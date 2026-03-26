import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Save,
  X,
  Check,
  Loader2,
  ChevronLeft,
  Settings2,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  isActive: boolean;
  features: Record<string, any>;
}

const PlanConfiguration: React.FC<{ session?: any }> = ({ session }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/billing/plans`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setPlans(data.data || data);
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [session]);

  const handleUpdate = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/billing/plans/${editingPlan.id}`,
        {
          name: editingPlan.name,
          price: editingPlan.price,
          isActive: editingPlan.isActive,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      await fetchPlans();
      setEditingPlan(null);
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  /* accent color per plan name */
  const planAccent = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("enterprise"))
      return {
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
        border: "rgba(59,130,246,0.2)",
      };
    if (n.includes("gold"))
      return {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.2)",
      };
    return {
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.06)",
      border: "rgba(148,163,184,0.15)",
    };
  };

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/membership")}
            className="w-9 h-9 rounded-xl border border-white-05 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Plan Architecture</h1>
            <p className="text-xs text-muted">
              Manage global subscription tiers and commercial constraints.
            </p>
          </div>
        </div>
        <button
          className="btn-primary text-xs bg-purple-600 rounded-md flex items-center gap-1.5 opacity-40 cursor-not-allowed"
          style={{
            padding: "8px 16px",
            border: "none",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          <Plus size={14} /> Create Tier
        </button>
      </header>

      {/* ── PLAN CARDS ── */}
      {loading ? (
        <div
          className="vd-card flex items-center justify-center"
          style={{ padding: "80px 0" }}
        >
          <Loader2 size={28} className="animate-spin text-purple-500" />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {plans.map((plan) => {
            const ac = planAccent(plan.name);
            return (
              <div
                key={plan.id}
                className="vd-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* colored top bar */}
                <div
                  style={{ height: "3px", background: ac.color, opacity: 0.8 }}
                />

                <div
                  style={{
                    padding: "22px 24px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Plan header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: 800,
                            color: "#e2e8f0",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {plan.name}
                        </h3>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "20px",
                            color: ac.color,
                            background: ac.bg,
                            border: `1px solid ${ac.border}`,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {plan.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#475569",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Global Tier
                      </span>
                    </div>
                    {/* status dot */}
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: "4px",
                        background: plan.isActive ? "#10b981" : "#334155",
                        boxShadow: plan.isActive
                          ? "0 0 8px rgba(16,185,129,0.5)"
                          : "none",
                      }}
                    />
                  </div>

                  {/* Price */}
                  <div
                    style={{
                      marginBottom: "20px",
                      paddingBottom: "18px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "32px",
                          fontWeight: 800,
                          color: ac.color,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        ${plan.price}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#475569",
                          fontWeight: 600,
                        }}
                      >
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginBottom: "22px",
                    }}
                  >
                    {Object.entries(plan.features || {}).map(
                      ([key, val]: [string, string | number | boolean], idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              minWidth: "16px",
                              borderRadius: "5px",
                              background: `${ac.color}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: ac.color,
                            }}
                          >
                            <Check size={10} />
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              textTransform: "capitalize",
                            }}
                          >
                            {key}:
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#e2e8f0",
                              marginLeft: "auto",
                            }}
                          >
                            {val.toString()}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setEditingPlan({ ...plan })}
                    className="w-full hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: `1px solid ${ac.border}`,
                      background: ac.bg,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: ac.color,
                      cursor: "pointer",
                    }}
                  >
                    <Settings2 size={12} /> Configure Tier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editingPlan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(2,6,23,0.85)",
            backdropFilter: "blur(6px)",
          }}
          className="animate-fade-in"
        >
          <div
            className="vd-card"
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Modal colored top bar */}
            <div
              style={{
                height: "3px",
                background: planAccent(editingPlan.name).color,
                opacity: 0.8,
              }}
            />

            <div style={{ padding: "24px" }}>
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#e2e8f0",
                      marginBottom: "3px",
                    }}
                  >
                    Edit {editingPlan.name}
                  </h3>
                  <p style={{ fontSize: "10px", color: "#475569" }}>
                    Modify tier settings and pricing
                  </p>
                </div>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="icon-btn p-1.5 text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Fields */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#475569",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#e2e8f0",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(139,92,246,0.45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#475569",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Monthly Price (USD)
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "13px",
                        color: "#475569",
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      value={editingPlan.price}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price: Number(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 26px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#e2e8f0",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "rgba(139,92,246,0.45)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                      }
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#e2e8f0",
                        marginBottom: "2px",
                      }}
                    >
                      Active for new tenants
                    </div>
                    <div style={{ fontSize: "10px", color: "#475569" }}>
                      New orgs can subscribe to this tier
                    </div>
                  </div>
                  <div
                    onClick={() =>
                      setEditingPlan({
                        ...editingPlan,
                        isActive: !editingPlan.isActive,
                      })
                    }
                    style={{
                      width: "40px",
                      height: "22px",
                      borderRadius: "11px",
                      cursor: "pointer",
                      background: editingPlan.isActive
                        ? "#8b5cf6"
                        : "rgba(255,255,255,0.08)",
                      border: editingPlan.isActive
                        ? "1px solid rgba(139,92,246,0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                      position: "relative",
                      transition: "background 0.2s, border-color 0.2s",
                      boxShadow: editingPlan.isActive
                        ? "0 0 10px rgba(139,92,246,0.3)"
                        : "none",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: editingPlan.isActive ? "21px" : "3px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{ display: "flex", gap: "10px", paddingTop: "4px" }}
                >
                  <button
                    onClick={() => setEditingPlan(null)}
                    className="icon-btn flex-1 border border-white-05 hover:bg-white/5 transition-all"
                    style={{
                      padding: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      borderRadius: "10px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {saving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanConfiguration;

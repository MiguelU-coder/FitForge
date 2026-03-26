import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MoreVertical,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  TrendingUp,
  Check,
  Loader2,
  ExternalLink,
  Edit2,
  Trash2,
  Users,
  CreditCard,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  plan?: { name: string; price: number | any };
  users?: { user: { displayName: string; email: string } }[];
  _count?: { users: number };
}

/* ── Context menu item type ── */
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
  divider?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}

/* ── Improved context menu ── */
const ContextMenu: React.FC<{
  items: MenuItem[];
  onClose: () => void;
  top: number;
  right: number;
}> = ({ items, onClose, top, right }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // slight delay so the opening click doesn't immediately close it
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top,
        right,
        zIndex: 9999,
        minWidth: "190px",
        background: "#0d1525",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "14px",
        boxShadow:
          "0 24px 48px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
        animation: "fadeIn 0.12s ease",
      }}
    >
      {/* Accent top bar */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg,rgba(16,185,129,0.5),transparent)",
        }}
      />

      <div style={{ padding: "6px" }}>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {item.divider && i > 0 && (
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.05)",
                  margin: "4px 0",
                }}
              />
            )}
            <button
              disabled={item.disabled}
              title={item.disabled ? item.disabledTitle : undefined}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: item.disabled ? "not-allowed" : "pointer",
                color: item.disabled ? "#334155" : item.color || "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
                transition: "background 0.12s, color 0.12s",
                textAlign: "left",
                opacity: item.disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = item.color
                    ? `${item.color}12`
                    : "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = item.color || "#e2e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = item.color || "#94a3b8";
                }
              }}
            >
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  minWidth: "26px",
                  borderRadius: "7px",
                  background: item.disabled
                    ? "rgba(255,255,255,0.03)"
                    : item.color
                      ? `${item.color}15`
                      : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.disabled ? "#334155" : item.color || "#64748b",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────────── */
const Organizations: React.FC<{ session?: any }> = ({ session }) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const [search, setSearch] = useState("");

  const fetchOrganizations = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/organizations`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setOrganizations(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [session]);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleManageBilling = async (orgId: string) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/organizations/${orgId}/portal-session`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      alert(
        "Billing portal unavailable. Ensure the org owner has a Stripe customer profile.",
      );
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!window.confirm("Delete this organization? This cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/organizations/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      fetchOrganizations();
    } catch {
      alert("Error deleting organization.");
    }
  };

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const menuItems = (org: Organization): MenuItem[] => [
    {
      label: "View Users",
      icon: <Users size={13} />,
      onClick: () => navigate("/users"),
    },
    {
      label: "Edit Details",
      icon: <Edit2 size={13} />,
      onClick: () => navigate(`/organizations/${org.id}/edit`),
    },
    {
      label: "Manage Billing",
      icon: <CreditCard size={13} />,
      color: "#10b981",
      divider: true,
      disabled: !org._count?.users || org._count.users === 0,
      disabledTitle: "Add at least one user to manage billing",
      onClick: () => handleManageBilling(org.id),
    },
    {
      label: "Delete Organization",
      icon: <Trash2 size={13} />,
      color: "#f43f5e",
      divider: true,
      onClick: () => handleDeleteOrg(org.id),
    },
  ];

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Organizations</h1>
          <p className="text-xs text-muted">
            Manage all registered tenants and their plans.
          </p>
        </div>
        <div className="flex gap-2">
          <div
            style={{
              width: "260px",
              height: "38px",
              backgroundColor: "#0d1425",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search
              size={13}
              className="text-slate-500"
              style={{ flexShrink: 0 }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="border-none outline-none text-[12px] text-slate-400 w-full"
              style={{
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={() => navigate("/organizations/add")}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            style={{
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            <Plus size={14} /> Add organization
          </button>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        <CompactStatCard
          icon={<Building2 size={13} />}
          title="Total Gyms"
          value="1,248"
          trend="+14.2%"
          color="#8b5cf6"
          up
        />
        <CompactStatCard
          icon={<Shield size={13} />}
          title="Active Plans"
          value="892"
          trend="+8.1%"
          color="#10b981"
          up
        />
        <CompactStatCard
          icon={<Layers size={13} />}
          title="Enterprise"
          value="124"
          trend="+12.5%"
          color="#3b82f6"
          up
        />
        <CompactStatCard
          icon={<TrendingUp size={13} />}
          title="Total Revenue"
          value="$450.8K"
          trend="+18.4%"
          color="#f59e0b"
          up
        />
      </div>

      {/* ── TABLE CARD ── */}
      <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
          style={{ padding: "16px 24px" }}
        >
          <h3 className="text-sm font-bold">Organization Directory</h3>
          <div className="flex items-center gap-3">
            {checked.size > 0 && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                {checked.size} selected
              </span>
            )}
            <button
              className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
              style={{ padding: "6px 12px" }}
            >
              <Filter size={12} /> Filter
            </button>
            <span className="text-[11px] text-purple-400 font-bold uppercase tracking-widest">
              1–10 of 2,450
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "900px",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "52px" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <th style={{ padding: "12px 8px 12px 24px" }}>
                  <div className="w-4 h-4 rounded border border-white-05 bg-slate-800/50" />
                </th>
                {["Gym Name", "Owner", "Plan", "Status", "Revenue", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        textAlign: i === 5 ? "right" : "left",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        paddingRight: i === 5 ? "24px" : "16px",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2
                      size={28}
                      className="animate-spin text-purple-500 mx-auto mb-2"
                    />
                    <p className="text-xs text-muted">
                      Synchronizing with global infrastructure...
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr style={{ height: "280px" }}>
                  <td colSpan={7} className="text-center align-middle">
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/30 border border-white-05 flex items-center justify-center mb-3 mx-auto">
                        <Building2
                          size={28}
                          className="text-slate-500"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-sm text-slate-300 font-semibold mb-1">
                        No organizations found
                      </p>
                      <p className="text-xs text-slate-500">
                        Onboard your first tenant to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((org, rowIdx) => {
                  const isChecked = checked.has(org.id);
                  const isLast = rowIdx === filtered.length - 1;
                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                      style={{
                        borderBottom: isLast
                          ? "none"
                          : "1px solid rgba(255,255,255,0.04)",
                        background: isChecked
                          ? "rgba(139,92,246,0.04)"
                          : undefined,
                        position: "relative",
                      }}
                    >
                      {/* Checkbox */}
                      <td
                        style={{
                          padding: "0 8px 0 24px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          onClick={() => toggle(org.id)}
                          className="w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-all"
                          style={{
                            borderColor: isChecked
                              ? "#8b5cf6"
                              : "rgba(255,255,255,0.1)",
                            background: isChecked
                              ? "#8b5cf6"
                              : "rgba(30,41,59,0.5)",
                            boxShadow: isChecked
                              ? "0 0 8px rgba(139,92,246,0.4)"
                              : "none",
                            color: "#fff",
                          }}
                        >
                          {isChecked && <Check size={9} />}
                        </div>
                      </td>

                      {/* Gym Name */}
                      <td
                        style={{
                          padding: "18px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              minWidth: "38px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(255,255,255,0.03)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid rgba(255,255,255,0.07)",
                              flexShrink: 0,
                            }}
                          >
                            <Building2 size={17} className="text-slate-500" />
                          </div>
                          <div style={{ overflow: "hidden" }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#e2e8f0",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {org.name}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#475569",
                                fontFamily: "monospace",
                                whiteSpace: "nowrap",
                                marginTop: "2px",
                              }}
                            >
                              ID: {org.id.split("-")[0].toUpperCase()} ·{" "}
                              {new Date(org.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td
                        style={{
                          padding: "18px 16px",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              minWidth: "28px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          >
                            {org.name.charAt(0)}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {org.users?.[0]?.user.displayName || "No Owner"}
                          </span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td
                        style={{
                          padding: "18px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        {(() => {
                          const pn = org.plan?.name || "No Plan";
                          const col =
                            pn === "Enterprise"
                              ? "#3b82f6"
                              : pn === "Gold"
                                ? "#f59e0b"
                                : "#94a3b8";
                          const bg =
                            pn === "Enterprise"
                              ? "rgba(59,130,246,0.1)"
                              : pn === "Gold"
                                ? "rgba(245,158,11,0.1)"
                                : "rgba(255,255,255,0.05)";
                          const bdr =
                            pn === "Enterprise"
                              ? "rgba(59,130,246,0.25)"
                              : pn === "Gold"
                                ? "rgba(245,158,11,0.25)"
                                : "rgba(255,255,255,0.1)";
                          return (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                color: col,
                                background: bg,
                                border: `1px solid ${bdr}`,
                              }}
                            >
                              {pn}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: "18px 16px",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "7px",
                              height: "7px",
                              minWidth: "7px",
                              borderRadius: "50%",
                              backgroundColor: org.isActive
                                ? "#10b981"
                                : "#f43f5e",
                              boxShadow: `0 0 7px ${org.isActive ? "#10b981" : "#f43f5e"}`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: org.isActive ? "#10b981" : "#f43f5e",
                            }}
                          >
                            {org.isActive ? "Active" : "Suspended"}
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td
                        style={{
                          padding: "18px 16px",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#e2e8f0",
                          }}
                        >
                          ${(org.plan?.price || 0).toLocaleString()}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#475569",
                            marginTop: "2px",
                          }}
                        >
                          {org._count?.users || 0} members
                        </div>
                      </td>

                      {/* Actions — 3-dot + context menu */}
                      <td
                        style={{
                          padding: "18px 24px 18px 16px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (
                              e.currentTarget as HTMLElement
                            ).getBoundingClientRect();
                            const menuH = 200;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const top =
                              spaceBelow > menuH
                                ? rect.bottom + 6
                                : rect.top - menuH - 6;
                            const right = window.innerWidth - rect.right + 4;
                            if (openMenuId === org.id) {
                              setOpenMenuId(null);
                            } else {
                              setMenuPos({ top, right });
                              setOpenMenuId(org.id);
                            }
                          }}
                          className="icon-btn p-1.5 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {openMenuId === org.id && menuPos.top > 0 && (
                          <ContextMenu
                            items={menuItems(org)}
                            onClose={() => {
                              setOpenMenuId(null);
                              setMenuPos({ top: 0, right: 0 });
                            }}
                            top={menuPos.top}
                            right={menuPos.right}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Spacer so dropdown doesn't clip on short tables */}
          {filtered.length > 0 && filtered.length < 3 && (
            <div style={{ height: "160px" }} aria-hidden="true" />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center border-t border-white-05"
          style={{ padding: "14px 24px" }}
        >
          <span className="text-[11px] text-muted">
            Showing {filtered.length} of 2,450 results
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-lg">
              Page 1 of 245
            </span>
            <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── CompactStatCard ── */
const CompactStatCard = ({
  icon,
  title,
  value,
  trend,
  color,
  up,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  color: string;
  up?: boolean;
}) => (
  <div
    className="vd-card flex flex-col justify-between"
    style={{ padding: "16px 20px" }}
  >
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] text-muted flex items-center gap-2">
        <span
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "5px",
            backgroundColor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        {title}
      </span>
      <button className="icon-btn p-0">
        <MoreVertical size={14} />
      </button>
    </div>
    <div className="flex items-baseline gap-2.5">
      <h4 className="text-lg font-bold">{value}</h4>
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${up ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}
      >
        {trend}
      </span>
    </div>
  </div>
);

export default Organizations;

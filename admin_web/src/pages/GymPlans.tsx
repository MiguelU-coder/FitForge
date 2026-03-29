import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ShieldCheck,
  X,
  Loader2,
  Check,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  display: "block",
  marginBottom: "8px",
};

const baseInput: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "9px",
  height: "38px",
  padding: "0 12px",
  fontSize: "12px",
  color: "#e2e8f0",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box" as const,
};

const focusBorder = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) => (e.target.style.borderColor = "rgba(16,185,129,0.4)");
const blurBorder = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) => (e.target.style.borderColor = "rgba(255,255,255,0.07)");

/* ── Frequency config ── */
const FREQUENCIES = [
  { value: "WEEKLY", label: "Semanal", color: "#3b82f6" },
  { value: "MONTHLY", label: "Mensual", color: "#10b981" },
  { value: "QUARTERLY", label: "Trimestral", color: "#f59e0b" },
  { value: "YEARLY", label: "Anual", color: "#8b5cf6" },
];

const freqAccent = (freq: string) =>
  FREQUENCIES.find((f) => f.value === freq) ?? {
    color: "#475569",
    label: freq,
  };

/* ── Section title ── */
const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  color?: string;
}> = ({ icon, title, color = "#10b981" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}
  >
    <span
      style={{
        width: "26px",
        height: "26px",
        minWidth: "26px",
        borderRadius: "7px",
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
    >
      {icon}
    </span>
    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
      {title}
    </h3>
  </div>
);

/* ─────────────────────────────── */
const GymPlans: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const organizationId = profile?.organizations?.[0]?.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    frequency: "MONTHLY",
    currency: "USD",
  });

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/organizations/${organizationId}/membership-plans`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      setPlans(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) fetchPlans();
  }, [organizationId]);

  const openNew = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      frequency: "MONTHLY",
      currency: "USD",
    });
    setShowModal(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      frequency: plan.frequency,
      currency: plan.currency,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationId) {
      alert("Error: No se encontró la organización activa. Por favor, recarga la página.");
      return;
    }

    if (!formData.name.trim() || !formData.price) {
      alert("Por favor, completa los campos requeridos (Nombre y Precio).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        frequency: formData.frequency,
        currency: formData.currency,
      };

      if (editingPlan) {
        await axios.patch(
          `${API_URL}/organizations/${organizationId}/membership-plans/${editingPlan.id}`,
          payload,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
      } else {
        await axios.post(
          `${API_URL}/organizations/${organizationId}/membership-plans`,
          payload,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
        setEditingPlan(null);
        fetchPlans();
      }, 1200);
    } catch (err: any) {
      console.error("Error saving plan:", err.response?.data || err);
      alert(err.response?.data?.message || "Ocurrió un error al guardar el plan. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm("¿Estás seguro de desactivar este plan?")) return;
    try {
      await axios.delete(
        `${API_URL}/organizations/${organizationId}/membership-plans/${planId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedFreq = FREQUENCIES.find((f) => f.value === formData.frequency);

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Planes de Membresía</h1>
          <p className="text-xs text-muted">
            Gestiona las tarifas y membresías de tu gimnasio
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg,#10b981,#059669)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
            transition: "filter 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
        >
          <Plus size={14} /> Nuevo Plan
        </button>
      </header>

      {/* ── TABLE CARD ── */}
      <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
          style={{ padding: "14px 20px" }}
        >
          <h3 className="text-sm font-bold">Directorio de Planes</h3>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 12px",
              height: "34px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "9px",
              transition: "border-color 0.2s",
              width: "220px",
            }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
            }
          >
            <Search size={12} style={{ color: "#475569", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar planes…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "12px",
                color: "#e2e8f0",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { label: "Plan", w: "32%" },
                  { label: "Frecuencia", w: "18%" },
                  { label: "Precio", w: "18%" },
                  { label: "Estado", w: "16%" },
                  { label: "", w: "16%", right: true },
                ].map(({ label, w, right }) => (
                  <th
                    key={label}
                    style={{
                      padding: "11px 16px",
                      textAlign: right ? "right" : "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#475569",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      width: w,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "60px 0", textAlign: "center" }}
                  >
                    <Loader2
                      size={22}
                      className="animate-spin mx-auto mb-2"
                      style={{ color: "#10b981" }}
                    />
                    <p style={{ fontSize: "12px", color: "#475569" }}>
                      Cargando planes…
                    </p>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "60px 0", textAlign: "center" }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                      }}
                    >
                      <CreditCard size={22} style={{ color: "#334155" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      Sin planes
                    </p>
                    <p style={{ fontSize: "11px", color: "#475569" }}>
                      Crea tu primer plan de membresía
                    </p>
                    <button
                      onClick={openNew}
                      style={{
                        marginTop: "16px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 18px",
                        borderRadius: "9px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
                      }}
                    >
                      <Plus size={13} /> Crear plan
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan, idx) => {
                  const fa = freqAccent(plan.frequency);
                  const isLast = idx === filteredPlans.length - 1;
                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      style={{
                        borderBottom: isLast
                          ? "none"
                          : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Plan name */}
                      <td style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              minWidth: "32px",
                              borderRadius: "9px",
                              background: `${fa.color}12`,
                              border: `1px solid ${fa.color}25`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CreditCard size={13} style={{ color: fa.color }} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#e2e8f0",
                                marginBottom: "2px",
                              }}
                            >
                              {plan.name}
                            </p>
                            <p style={{ fontSize: "10px", color: "#475569" }}>
                              {plan.description || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Frequency */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: fa.color,
                            background: `${fa.color}10`,
                            border: `1px solid ${fa.color}25`,
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: fa.color,
                              boxShadow: `0 0 4px ${fa.color}`,
                            }}
                          />
                          {fa.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td
                        style={{ padding: "14px 16px", whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#10b981",
                          }}
                        >
                          ${parseFloat(plan.price).toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#475569",
                            marginLeft: "4px",
                          }}
                        >
                          {plan.currency}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#10b981",
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#10b981",
                              boxShadow: "0 0 4px #10b981",
                            }}
                          />
                          Activo
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "14px 20px 14px 16px",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "4px",
                          }}
                        >
                          <button
                            className="icon-btn p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#a78bfa" }}
                            onClick={() => openEdit(plan)}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="icon-btn p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#f43f5e" }}
                            onClick={() => handleDelete(plan.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center border-t border-white-05"
          style={{ padding: "13px 20px" }}
        >
          <span className="text-[10px] text-muted">
            {filteredPlans.length} planes encontrados
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={13} />
            </button>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20">
              Página 1
            </span>
            <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          PLAN MODAL — full viewport
      ══════════════════════════════ */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            background: "rgba(2,6,23,0.97)",
            backdropFilter: "blur(12px)",
          }}
          className="animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          {/* ── Left panel: form ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 80px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "100%", maxWidth: "640px" }}>
              {/* Close */}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#475569",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "32px",
                  padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
              >
                <X size={14} /> Cerrar
              </button>

              <h2
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#e2e8f0",
                  marginBottom: "6px",
                }}
              >
                {editingPlan ? "Editar Plan" : "Nuevo Plan de Membresía"}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#475569",
                  marginBottom: "36px",
                }}
              >
                {editingPlan
                  ? "Modifica los detalles del plan existente."
                  : "Crea un nuevo plan de membresía para tu gimnasio."}
              </p>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >
                {/* Name + Description side by side */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Nombre del Plan{" "}
                      <span style={{ color: "#f43f5e" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Mensual Premium"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      style={baseInput}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Acceso a todas las clases"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      style={baseInput}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                </div>

                {/* Price + Currency */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Precio <span style={{ color: "#f43f5e" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "11px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#334155",
                          pointerEvents: "none",
                          display: "flex",
                        }}
                      >
                        <DollarSign size={13} />
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="29.99"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        style={{ ...baseInput, paddingLeft: "34px" }}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Moneda</label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      style={{
                        ...baseInput,
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                      }}
                      onFocus={focusBorder as any}
                      onBlur={blurBorder as any}
                    >
                      <option value="USD">USD — Dólar</option>
                      <option value="COP">COP — Peso Colombiano</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                </div>

                {/* Frequency — 4 cols */}
                <div>
                  <label style={labelStyle}>Frecuencia de Cobro</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "10px",
                    }}
                  >
                    {FREQUENCIES.map((f) => {
                      const sel = formData.frequency === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, frequency: f.value })
                          }
                          style={{
                            padding: "12px 10px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            border: sel
                              ? `1px solid ${f.color}40`
                              : "1px solid rgba(255,255,255,0.07)",
                            background: sel
                              ? `${f.color}10`
                              : "rgba(255,255,255,0.02)",
                            color: sel ? f.color : "#475569",
                          }}
                          onMouseEnter={(e) => {
                            if (!sel)
                              e.currentTarget.style.borderColor =
                                "rgba(255,255,255,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            if (!sel)
                              e.currentTarget.style.borderColor =
                                "rgba(255,255,255,0.07)";
                          }}
                        >
                          <span
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: sel
                                ? f.color
                                : "rgba(255,255,255,0.04)",
                              border: sel
                                ? "none"
                                : "1px solid rgba(255,255,255,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: sel ? `0 0 8px ${f.color}60` : "none",
                              transition: "all 0.15s",
                            }}
                          >
                            {sel && (
                              <Check
                                size={10}
                                style={{ color: "#fff", strokeWidth: 3 }}
                              />
                            )}
                          </span>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "11px 20px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.06)";
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#fff",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: "filter 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting)
                        e.currentTarget.style.filter = "brightness(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "brightness(1)";
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : saved ? (
                      <Check size={15} />
                    ) : null}
                    {isSubmitting
                      ? "Guardando…"
                      : saved
                        ? "¡Guardado!"
                        : editingPlan
                          ? "Guardar Cambios"
                          : "Crear Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right panel: live preview ── */}
          <div
            style={{
              width: "480px",
              minWidth: "480px",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(5,10,25,0.7)",
              display: "flex",
              flexDirection: "column",
              padding: "56px 44px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "32px",
              }}
            >
              Vista Previa en Vivo
            </p>

            {/* Plan card preview */}
            <div
              style={{
                borderRadius: "18px",
                background: "#0c1628",
                border: `1px solid ${selectedFreq?.color ?? "#10b981"}33`,
                overflow: "hidden",
                marginBottom: "24px",
                boxShadow: `0 24px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset`,
                position: "relative",
              }}
            >
              {/* Glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-60px",
                  width: "200px",
                  height: "200px",
                  background: selectedFreq?.color ?? "#10b981",
                  filter: "blur(90px)",
                  opacity: 0.12,
                  pointerEvents: "none",
                }}
              />
              {/* Top bar */}
              <div
                style={{
                  height: "3px",
                  background: `linear-gradient(90deg, ${selectedFreq?.color ?? "#10b981"}, ${selectedFreq?.color ?? "#10b981"}50)`,
                }}
              />

              <div style={{ padding: "28px 30px" }}>
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 12px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: selectedFreq?.color ?? "#10b981",
                      background: `${selectedFreq?.color ?? "#10b981"}15`,
                      border: `1px solid ${selectedFreq?.color ?? "#10b981"}30`,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {selectedFreq?.label ?? "Mensual"}
                  </span>
                  {formData.frequency === "MONTHLY" && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.1)",
                        padding: "4px 9px",
                        borderRadius: "6px",
                        border: "1px solid rgba(245,158,11,0.2)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      MÁS POPULAR
                    </span>
                  )}
                </div>

                {/* Name */}
                <h4
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#fff",
                    marginBottom: "8px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formData.name || "Nombre del Plan"}
                </h4>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  {formData.description ||
                    "Añade una descripción para este plan..."}
                </p>

                {/* Features */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "28px",
                  }}
                >
                  {[
                    "Acceso total a las instalaciones",
                    "Cancelación sin compromiso",
                    "Soporte prioritario",
                  ].map((feat, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      <Check
                        size={14}
                        style={{
                          color: selectedFreq?.color ?? "#10b981",
                          flexShrink: 0,
                        }}
                      />
                      {feat}
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "6px",
                    paddingTop: "22px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "46px",
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    $
                    {formData.price
                      ? parseFloat(formData.price).toFixed(2)
                      : "0.00"}
                  </span>
                  <div style={{ paddingBottom: "6px" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {formData.currency}
                    </p>
                    <p style={{ fontSize: "10px", color: "#334155" }}>
                      / {selectedFreq?.label.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary rows */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[
                {
                  label: "Nombre del Plan",
                  value: formData.name || "—",
                  icon: <FileText size={12} />,
                },
                {
                  label: "Frecuencia",
                  value: selectedFreq?.label ?? "—",
                  icon: <Calendar size={12} />,
                },
                {
                  label: "Costo Total",
                  value: formData.price
                    ? `$${parseFloat(formData.price).toFixed(2)} ${formData.currency}`
                    : "—",
                  icon: <DollarSign size={12} />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "#334155" }}>{icon}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#94a3b8",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", paddingTop: "28px" }}>
              <p
                style={{
                  fontSize: "10px",
                  color: "#1e293b",
                  textAlign: "center",
                  lineHeight: 1.7,
                }}
              >
                La vista previa se actualiza en tiempo real conforme rellenas el
                formulario.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymPlans;

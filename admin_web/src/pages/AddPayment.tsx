import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Check,
  Users,
  Banknote,
  Coins,
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
  fontSize: "12px",
  color: "#e2e8f0",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const baseSelect: React.CSSProperties = {
  ...baseInput,
  appearance: "none" as any,
  WebkitAppearance: "none" as any,
  padding: "0 12px",
  cursor: "pointer",
};

/* ── Section title ── */
const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  color?: string;
}> = ({ icon, title, color = "#8b5cf6" }) => (
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

/* ── Field wrapper ── */
const Field: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, required, icon, children }) => (
  <div>
    <label style={labelStyle}>
      {label}
      {required && (
        <span style={{ color: "#f43f5e", marginLeft: "3px" }}>*</span>
      )}
    </label>
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: "11px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#334155",
            pointerEvents: "none",
            display: "flex",
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  </div>
);

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

/* ── Payment method options ── */
const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo", color: "#10b981" },
  { value: "CARD", label: "Tarjeta", color: "#3b82f6" },
  { value: "TRANSFER", label: "Transferencia", color: "#8b5cf6" },
  { value: "OTHER", label: "Otro", color: "#64748b" },
];

const CURRENCIES = [
  { value: "USD", label: "USD", desc: "Dólar" },
  { value: "EUR", label: "EUR", desc: "Euro" },
  { value: "MXN", label: "MXN", desc: "Peso Mexicano" },
  { value: "COP", label: "COP", desc: "Peso Colombiano" },
];

/* ─────────────────────────────── */
const AddPayment: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMember = searchParams.get("member");

  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const organizationId = profile?.organizations?.[0]?.id;

  const [formData, setFormData] = useState({
    userId: preselectedMember || "",
    amount: "",
    currency: "USD",
    paymentMethod: "",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    if (!organizationId || !session?.access_token) {
      setMembersLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/organizations/${organizationId}/members`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      .then(({ data }) => {
        if (data.success) setMembers(data.data.members || []);
      })
      .catch(console.error)
      .finally(() => setMembersLoading(false));
  }, [session, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.userId || !formData.amount) {
      setError("Por favor selecciona un miembro e ingresa el monto");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/organizations/${organizationId}/payments`,
        {
          userId: formData.userId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          paymentMethod: formData.paymentMethod || undefined,
          dueDate: formData.dueDate || undefined,
          notes: formData.notes || undefined,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/payments"), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div
        className="dashboard-content animate-fade-in"
        style={{ padding: "0.5rem" }}
      >
        <div
          className="vd-card"
          style={{ padding: "80px 40px", textAlign: "center" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 32px rgba(16,185,129,0.15)",
            }}
          >
            <Check size={28} style={{ color: "#10b981" }} />
          </div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#e2e8f0",
              marginBottom: "8px",
            }}
          >
            ¡Pago Registrado!
          </h2>
          <p style={{ fontSize: "12px", color: "#475569" }}>
            Redirigiendo al historial de pagos…
          </p>
        </div>
      </div>
    );
  }

  const selectedMember = members.find((m) => m.id === formData.userId);
  const selectedMethod = PAYMENT_METHODS.find(
    (m) => m.value === formData.paymentMethod,
  );

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/payments")}
          style={{
            width: "34px",
            height: "34px",
            minWidth: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#e2e8f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Registrar Pago</h1>
          <p className="text-xs text-muted">Registra un pago de miembro</p>
        </div>
        <button
          onClick={handleSubmit as any}
          disabled={loading || !formData.userId || !formData.amount}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            cursor:
              loading || !formData.userId || !formData.amount
                ? "not-allowed"
                : "pointer",
            background: "linear-gradient(135deg,#10b981,#059669)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
            transition: "filter 0.2s",
            opacity: loading || !formData.userId || !formData.amount ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading && formData.userId && formData.amount)
              e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CreditCard size={14} />
          )}
          {loading ? "Registrando…" : "Registrar Pago"}
        </button>
      </header>

      {/* ── MAIN CARD ── */}
      <div className="vd-card" style={{ padding: "28px 32px" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "28px" }}
        >
          {/* Two-column layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: "28px",
              alignItems: "start",
            }}
          >
            {/* LEFT: Member + Payment details + Notes */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {/* Member selection */}
              <div>
                <SectionTitle
                  icon={<User size={13} />}
                  title="Miembro"
                  color="#8b5cf6"
                />
                {membersLoading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "28px 0",
                    }}
                  >
                    <Loader2
                      size={20}
                      style={{ color: "#8b5cf6" }}
                      className="animate-spin"
                    />
                  </div>
                ) : (
                  <>
                    <Field
                      label="Seleccionar Miembro"
                      required
                      icon={<Users size={13} />}
                    >
                      <select
                        value={formData.userId}
                        onChange={(e) =>
                          setFormData({ ...formData, userId: e.target.value })
                        }
                        style={{ ...baseSelect, paddingLeft: "34px" }}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      >
                        <option value="">Seleccionar miembro…</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.displayName} — {member.email}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {/* Selected member preview */}
                    {selectedMember && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "rgba(139,92,246,0.06)",
                          border: "1px solid rgba(139,92,246,0.18)",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            minWidth: "36px",
                            borderRadius: "10px",
                            background: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#8b5cf6",
                          }}
                        >
                          {selectedMember.displayName?.[0]?.toUpperCase() ||
                            "U"}
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
                            {selectedMember.displayName}
                          </p>
                          <p style={{ fontSize: "10px", color: "#475569" }}>
                            {selectedMember.email}
                          </p>
                        </div>
                        <span
                          style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#8b5cf6",
                            background: "rgba(139,92,246,0.1)",
                            border: "1px solid rgba(139,92,246,0.2)",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#8b5cf6",
                              boxShadow: "0 0 4px #8b5cf6",
                            }}
                          />
                          Seleccionado
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Payment details */}
              <div>
                <SectionTitle
                  icon={<DollarSign size={13} />}
                  title="Detalles del Pago"
                  color="#10b981"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Field label="Monto" required icon={<DollarSign size={13} />}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="0.00"
                      style={{
                        ...baseInput,
                        paddingLeft: "34px",
                        paddingRight: "12px",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </Field>

                  <Field label="Moneda" icon={<Coins size={13} />}>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      style={{ ...baseSelect, paddingLeft: "34px" }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label} — {c.desc}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Fecha de Vencimiento"
                    icon={<Calendar size={13} />}
                  >
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      style={{
                        ...baseInput,
                        paddingLeft: "34px",
                        paddingRight: "12px",
                        colorScheme: "dark",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </Field>
                </div>
              </div>

              {/* Notes */}
              <div>
                <SectionTitle
                  icon={<FileText size={13} />}
                  title="Notas"
                  color="#64748b"
                />
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  placeholder="Notas adicionales sobre el pago…"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "9px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                    outline: "none",
                    resize: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    lineHeight: 1.6,
                  }}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
            </div>

            {/* RIGHT SIDEBAR: Payment method + summary */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Payment method selector */}
              <div
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <SectionTitle
                  icon={<Banknote size={13} />}
                  title="Método de Pago"
                  color="#3b82f6"
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {PAYMENT_METHODS.map((method) => {
                    const sel = formData.paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: sel ? "" : method.value,
                          }))
                        }
                        style={{
                          padding: "11px 14px",
                          borderRadius: "10px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border: sel
                            ? `1px solid ${method.color}40`
                            : "1px solid rgba(255,255,255,0.06)",
                          background: sel
                            ? `${method.color}10`
                            : "rgba(255,255,255,0.02)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                        onMouseEnter={(e) => {
                          if (!sel)
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          if (!sel)
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.06)";
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: sel ? method.color : "#64748b",
                          }}
                        >
                          {method.label}
                        </span>
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            minWidth: "18px",
                            borderRadius: "50%",
                            background: sel
                              ? method.color
                              : "rgba(255,255,255,0.04)",
                            border: sel
                              ? "none"
                              : "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: sel
                              ? `0 0 8px ${method.color}60`
                              : "none",
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
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary card */}
              <div
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.12)",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#10b981",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Resumen
                </p>

                {/* Amount highlight */}
                {formData.amount && (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      marginBottom: "12px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: 800,
                        color: "#10b981",
                        lineHeight: 1,
                      }}
                    >
                      ${parseFloat(formData.amount || "0").toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        marginTop: "3px",
                      }}
                    >
                      {formData.currency}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                  }}
                >
                  {[
                    {
                      label: "Miembro",
                      value: selectedMember?.displayName || "—",
                    },
                    { label: "Método", value: selectedMethod?.label || "—" },
                    {
                      label: "Vencimiento",
                      value: formData.dueDate
                        ? new Date(formData.dueDate).toLocaleDateString("es-ES")
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#475569" }}>
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#94a3b8",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "9px",
                background: "rgba(244,63,94,0.06)",
                border: "1px solid rgba(244,63,94,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  minWidth: "5px",
                  borderRadius: "50%",
                  background: "#f43f5e",
                  boxShadow: "0 0 4px #f43f5e",
                }}
              />
              <p style={{ fontSize: "11px", color: "#f43f5e" }}>{error}</p>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              paddingTop: "4px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/payments")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#475569",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#475569";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.userId || !formData.amount}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#fff",
                border: "none",
                cursor:
                  loading || !formData.userId || !formData.amount
                    ? "not-allowed"
                    : "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                transition: "filter 0.2s",
                opacity:
                  loading || !formData.userId || !formData.amount ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && formData.userId && formData.amount)
                  e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CreditCard size={14} />
              )}
              {loading ? "Registrando…" : "Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;

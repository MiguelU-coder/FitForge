import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  UserPlus,
  ArrowLeft,
  Mail,
  User,
  Phone,
  Calendar,
  Lock,
  Loader2,
  Shield,
  Check,
  Eye,
  EyeOff,
  Target,
} from "lucide-react";
import { useEffect } from "react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

/* ── Role accent colors ── */
const ROLES = [
  {
    value: "CLIENT",
    label: "Cliente",
    desc: "Miembro del gimnasio",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
  },
  {
    value: "TRAINER",
    label: "Entrenador",
    desc: "Imparte clases y rutinas",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
  },
  {
    value: "ORG_ADMIN",
    label: "Administrador",
    desc: "Acceso completo al dashboard",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
  },
];

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

/* ── Field wrapper with optional leading icon ── */
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
          }}
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  </div>
);

/* ── Section divider ── */
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

/* ─────────────────────────────── */
const AddMember: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdMemberData, setCreatedMemberData] = useState<any>(null);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);

  const organizationId = profile?.organizations?.[0]?.id;

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/organizations/${organizationId}/membership-plans`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      setMembershipPlans(data.data || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  useEffect(() => {
    if (organizationId) fetchPlans();
  }, [organizationId]);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    dateOfBirth: "",
    role: "CLIENT",
    membershipPlanId: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const focusBorder = (e: React.FocusEvent<any>) =>
    (e.target.style.borderColor = "rgba(16,185,129,0.4)");
  const blurBorder = (e: React.FocusEvent<any>) =>
    (e.target.style.borderColor = "rgba(255,255,255,0.07)");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.displayName || !formData.email) {
      setError("Por favor completa los campos de nombre y email");
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/organizations/${organizationId}/members`,
        {
          displayName: formData.displayName,
          email: formData.email.toLowerCase(),
          password: formData.password,
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          role: formData.role,
          membershipPlanId: formData.membershipPlanId || undefined,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (response.data.success) {
        setCreatedMemberData(response.data.data);
        setSuccess(true);
        // Do not auto-navigate immediately so admin can see the password
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear el miembro");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: "0.5rem" }}>
        <div className="vd-card" style={{ padding: "60px 40px", textAlign: "center", maxWidth: "500px", margin: "40px auto" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 32px rgba(16,185,129,0.15)",
          }}>
            <Check size={28} style={{ color: "#10b981" }} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#e2e8f0", marginBottom: "8px" }}>¡Miembro Creado!</h2>
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "24px" }}>
            El miembro ha sido registrado exitosamente y sincronizado con el sistema de autenticación.
          </p>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px", marginBottom: "24px", textAlign: "left" }}>
            <p style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", fontWeight: 700, marginBottom: "12px" }}>Credenciales de Acceso</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Email:</span>
              <span style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: 600 }}>{createdMemberData?.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Contraseña:</span>
              <span style={{ fontSize: "11px", color: "#8b5cf6", fontWeight: 800, letterSpacing: "1px" }}>{createdMemberData?.password}</span>
            </div>
            <p style={{ fontSize: "10px", color: "#475569", marginTop: "12px", fontStyle: "italic" }}>
              ⚠️ Copia la contraseña ahora. Por seguridad, no se volverá a mostrar.
            </p>
          </div>

          <button onClick={() => navigate("/members")} className="btn-primary w-full py-3 text-sm bg-purple-600 rounded-lg">
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  /* ── Missing Organization screen ── */
  if (!loading && !organizationId) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: "0.5rem" }}>
        <div className="vd-card text-center py-20">
          <Shield size={48} className="mx-auto mb-4 text-slate-500 opacity-50" />
          <h2 className="text-lg font-bold mb-2 text-slate-200">Organización no encontrada</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Tu perfil no tiene una organización asociada. 
            Si crees que esto es un error, contacta al administrador global.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary py-2 px-6 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/members")}
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
          <h1 className="text-2xl font-bold mb-1">Agregar Miembro</h1>
          <p className="text-xs text-muted">
            Registra un nuevo miembro en tu gimnasio
          </p>
        </div>
        {/* Submit in header */}
        <button
          onClick={handleSubmit as any}
          disabled={loading}
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
            cursor: loading ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#10b981,#059669)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
            transition: "filter 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <UserPlus size={14} />
          )}
          {loading ? "Creando…" : "Crear Miembro"}
        </button>
      </header>

      <div className="vd-card" style={{ padding: "28px 32px" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "28px" }}
        >
          {/* ── Two-column layout: form left, sidebar right ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "28px",
              alignItems: "start",
            }}
          >
            {/* LEFT: Personal + Security */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {/* Personal Info */}
              <div>
                <SectionTitle
                  icon={<User size={13} />}
                  title="Información Personal"
                  color="#8b5cf6"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Field label="Nombre Completo" required>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={set("displayName")}
                      placeholder="Juan Pérez"
                      style={{ ...baseInput, padding: "0 12px" }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </Field>

                  <Field label="Email" required icon={<Mail size={13} />}>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={set("email")}
                      placeholder="juan@email.com"
                      style={{
                        ...baseInput,
                        paddingLeft: "34px",
                        paddingRight: "12px",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </Field>

                  <Field label="Teléfono" icon={<Phone size={13} />}>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={set("phoneNumber")}
                      placeholder="+57 300 000 0000"
                      style={{
                        ...baseInput,
                        paddingLeft: "34px",
                        paddingRight: "12px",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </Field>

                  <Field
                    label="Fecha de Nacimiento"
                    icon={<Calendar size={13} />}
                  >
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={set("dateOfBirth")}
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

                  <Field label="Plan de Membresía" icon={<Target size={13} />}>
                    <select
                      value={formData.membershipPlanId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          membershipPlanId: e.target.value,
                        })
                      }
                      style={{
                        ...baseInput,
                        paddingLeft: "34px",
                        paddingRight: "12px",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    >
                      <option value="">Seleccionar plan...</option>
                      {membershipPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.currency} {parseFloat(plan.price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Security */}
              <div>
                <SectionTitle
                  icon={<Lock size={13} />}
                  title="Seguridad"
                  color="#3b82f6"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Field label="Contraseña" required>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={set("password")}
                      placeholder="Mínimo 6 caracteres"
                      style={{ ...baseInput, padding: "0 36px 0 12px" }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#334155",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </Field>

                  <Field label="Confirmar Contraseña" required>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="Repite la contraseña"
                      style={{
                        ...baseInput,
                        padding: "0 36px 0 12px",
                        borderColor:
                          formData.confirmPassword &&
                          formData.password !== formData.confirmPassword
                            ? "rgba(244,63,94,0.4)"
                            : undefined,
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#334155",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </Field>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p
                      style={{
                        marginTop: "8px",
                        fontSize: "10px",
                        color: "#f43f5e",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "#f43f5e",
                          display: "inline-block",
                        }}
                      />
                      Las contraseñas no coinciden
                    </p>
                  )}
              </div>
            </div>

            {/* RIGHT SIDEBAR: Role + summary */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <SectionTitle
                  icon={<Shield size={13} />}
                  title="Rol en el Gimnasio"
                  color="#f59e0b"
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {ROLES.map((role) => {
                    const sel = formData.role === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, role: role.value }))
                        }
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border: sel
                            ? `1px solid ${role.border}`
                            : "1px solid rgba(255,255,255,0.06)",
                          background: sel ? role.bg : "rgba(255,255,255,0.02)",
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
                        <div>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: sel ? role.color : "#94a3b8",
                              marginBottom: "2px",
                            }}
                          >
                            {role.label}
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              color: sel ? role.color + "80" : "#334155",
                            }}
                          >
                            {role.desc}
                          </p>
                        </div>
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            minWidth: "18px",
                            borderRadius: "50%",
                            background: sel
                              ? role.color
                              : "rgba(255,255,255,0.04)",
                            border: sel
                              ? "none"
                              : "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: sel ? `0 0 8px ${role.color}60` : "none",
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

              {/* Mini info card */}
              <div
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.12)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#10b981",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Resumen
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {[
                    { label: "Nombre", value: formData.displayName || "—" },
                    { label: "Email", value: formData.email || "—" },
                    {
                      label: "Rol",
                      value:
                        ROLES.find((r) => r.value === formData.role)?.label ||
                        "—",
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
                          maxWidth: "160px",
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

          {/* ── Error banner ── */}
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

          {/* ── Footer actions ── */}
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
              onClick={() => navigate("/members")}
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
              disabled={loading}
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
                cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                transition: "filter 0.2s",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
              {loading ? "Creando…" : "Crear Miembro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;

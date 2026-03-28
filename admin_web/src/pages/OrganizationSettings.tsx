import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Upload,
  Check,
  KeyRound,
  Smartphone,
  Lock,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

/* ── Shared input style ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "9px",
  padding: "0 12px",
  height: "36px",
  fontSize: "12px",
  color: "#e2e8f0",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  display: "block",
  marginBottom: "8px",
};

/* ── Section card wrapper ── */
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  color?: string;
  children: React.ReactNode;
}> = ({ icon, title, color = "#8b5cf6", children }) => (
  <div className="vd-card" style={{ padding: "20px 24px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        paddingBottom: "14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{
          width: "28px",
          height: "28px",
          minWidth: "28px",
          borderRadius: "8px",
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
    {children}
  </div>
);

/* ── Toggle switch ── */
const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      cursor: "pointer",
    }}
    onClick={onChange}
  >
    <div>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#cbd5e1",
          marginBottom: "2px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "10px", color: "#475569" }}>{description}</p>
    </div>
    {/* Track */}
    <div
      style={{
        width: "40px",
        height: "22px",
        minWidth: "40px",
        borderRadius: "99px",
        background: checked
          ? "rgba(16,185,129,0.25)"
          : "rgba(255,255,255,0.05)",
        border: checked
          ? "1px solid rgba(16,185,129,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        transition: "all 0.2s",
      }}
    >
      {/* Thumb */}
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "20px" : "3px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: checked ? "#10b981" : "#334155",
          boxShadow: checked ? "0 0 6px rgba(16,185,129,0.5)" : "none",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && (
          <Check size={8} style={{ color: "#fff", strokeWidth: 3 }} />
        )}
      </div>
    </div>
  </div>
);

/* ── Action button row ── */
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}> = ({ icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
      transition: "all 0.15s",
      textAlign: "left",
      marginBottom: "8px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
    }}
  >
    <span
      style={{
        width: "28px",
        height: "28px",
        minWidth: "28px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
      }}
    >
      {icon}
    </span>
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
        {label}
      </p>
      {description && (
        <p style={{ fontSize: "10px", color: "#475569" }}>{description}</p>
      )}
    </div>
  </button>
);

/* ─────────────────────────────── */
const OrganizationSettings: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    primaryColor: "#8b5cf6",
    secondaryColor: "#3b82f6",
    emailNotifications: true,
    smsNotifications: false,
  });

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    if (!organizationId || !session?.access_token) return;
    axios
      .get(`${API_URL}/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      .then(({ data }) => {
        setOrganization(data);
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          logoUrl: data.logoUrl || "",
        }));
      })
      .catch((e) => console.error(e));
  }, [session, organizationId]);

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/organizations/${organizationId}`,
        { name: formData.name, logoUrl: formData.logoUrl },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(16,185,129,0.4)");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(255,255,255,0.07)");

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuración</h1>
          <p className="text-xs text-muted">
            Personaliza la configuración de tu gimnasio
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
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
            cursor: saving ? "not-allowed" : "pointer",
            background: saved
              ? "linear-gradient(135deg,#10b981,#059669)"
              : "linear-gradient(135deg,#10b981,#059669)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
            transition: "filter 0.2s",
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar Cambios"}
        </button>
      </header>

      <div className="grid grid-cols-dashboard gap-6">
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Organization Info */}
          <Section
            icon={<Building2 size={14} />}
            title="Información del Gimnasio"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label style={labelStyle}>Nombre del Gimnasio</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre de tu gimnasio"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>

              <div>
                <label style={labelStyle}>URL del Logo</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://..."
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <button
                    className="icon-btn"
                    style={{
                      width: "36px",
                      height: "36px",
                      minWidth: "36px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      background: "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={14} />
                  </button>
                </div>
              </div>

              {formData.logoUrl && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.02)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#475569" }}>
                    Vista previa del logo
                  </span>
                </div>
              )}
            </div>
          </Section>

          {/* Appearance */}
          <Section
            icon={<Palette size={14} />}
            title="Apariencia"
            color="#3b82f6"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                {
                  key: "primaryColor" as const,
                  label: "Color Primario",
                },
                {
                  key: "secondaryColor" as const,
                  label: "Color Secundario",
                },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "36px",
                        height: "36px",
                        minWidth: "36px",
                        borderRadius: "9px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="color"
                        value={formData[key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        style={{
                          position: "absolute",
                          inset: "-4px",
                          width: "calc(100% + 8px)",
                          height: "calc(100% + 8px)",
                          cursor: "pointer",
                          border: "none",
                          padding: 0,
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      style={{
                        ...inputStyle,
                        width: "120px",
                        flex: "none",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                    {/* Swatch preview */}
                    <div
                      style={{
                        flex: 1,
                        height: "36px",
                        borderRadius: "9px",
                        background: formData[key],
                        opacity: 0.25,
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Notifications */}
          <Section
            icon={<Bell size={14} />}
            title="Notificaciones"
            color="#f59e0b"
          >
            <div>
              <Toggle
                checked={formData.emailNotifications}
                onChange={() =>
                  setFormData({
                    ...formData,
                    emailNotifications: !formData.emailNotifications,
                  })
                }
                label="Notificaciones por Email"
                description="Recibe actualizaciones importantes por correo"
              />
              <Toggle
                checked={formData.smsNotifications}
                onChange={() =>
                  setFormData({
                    ...formData,
                    smsNotifications: !formData.smsNotifications,
                  })
                }
                label="Notificaciones SMS"
                description="Recibe alertas por mensaje de texto"
              />
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Billing */}
          <Section
            icon={<CreditCard size={14} />}
            title="Facturación"
            color="#10b981"
          >
            {organization?.plan && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#10b981",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        marginBottom: "4px",
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
                      Plan Actual
                    </span>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#e2e8f0",
                      }}
                    >
                      {organization.plan.name}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#e2e8f0",
                        lineHeight: 1,
                      }}
                    >
                      $
                      {organization.plan.price?.toNumber?.() ??
                        organization.plan.price}
                    </p>
                    <span style={{ fontSize: "10px", color: "#475569" }}>
                      /mes
                    </span>
                  </div>
                </div>
              </div>
            )}
            <ActionButton
              icon={<CreditCard size={14} />}
              label="Gestionar Suscripción"
              description="Cambiar plan o método de pago"
            />
          </Section>

          {/* Security */}
          <Section
            icon={<Shield size={14} />}
            title="Seguridad"
            color="#f43f5e"
          >
            <ActionButton
              icon={<KeyRound size={14} />}
              label="Cambiar contraseña"
              description="Actualiza tu contraseña de acceso"
            />
            <ActionButton
              icon={<Smartphone size={14} />}
              label="Autenticación de dos factores"
              description="Añade una capa extra de seguridad"
            />
            <ActionButton
              icon={<Lock size={14} />}
              label="Sesiones activas"
              description="Gestiona dispositivos conectados"
            />
          </Section>

          {/* Danger zone */}
          <div
            className="vd-card"
            style={{
              padding: "16px 20px",
              border: "1px solid rgba(244,63,94,0.15)",
              background: "rgba(244,63,94,0.03)",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#f43f5e",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "10px",
              }}
            >
              Zona de Peligro
            </p>
            <button
              style={{
                width: "100%",
                padding: "9px 14px",
                borderRadius: "9px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#f43f5e",
                background: "rgba(244,63,94,0.06)",
                border: "1px solid rgba(244,63,94,0.2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(244,63,94,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(244,63,94,0.06)";
              }}
            >
              Eliminar organización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;

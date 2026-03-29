import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DollarSign,
  Cpu,
  Wrench,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Check,
  ShieldAlert,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface GlobalSettings {
  basePrices: {
    monthlyPlan: number;
    yearlyPlan: number;
    singleSession: number;
  };
  aiLimits: {
    maxRoutinesPerDay: number;
    maxAiCallsPerMonth: number;
    maxMembersPerOrg: number;
  };
  maintenance: {
    isEnabled: boolean;
    message: string;
    allowedRoles: string[];
  };
}

/* ── Shared label style ── */
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
  fontSize: "13px",
  fontWeight: 600,
  color: "#e2e8f0",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box" as const,
};

const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.target.style.borderColor = "rgba(16,185,129,0.4)");
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.target.style.borderColor = "rgba(255,255,255,0.07)");

/* ── Section wrapper ── */
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ icon, title, description, color, children, danger }) => (
  <div
    className="vd-card"
    style={{
      padding: "22px 26px",
      border: danger ? "1px solid rgba(245,158,11,0.15)" : undefined,
      background: danger ? "rgba(245,158,11,0.02)" : undefined,
    }}
  >
    {/* Section header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
        paddingBottom: "14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{
          width: "34px",
          height: "34px",
          minWidth: "34px",
          borderRadius: "9px",
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
      <div>
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "2px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "10px", color: "#475569" }}>{description}</p>
      </div>
    </div>
    {children}
  </div>
);

/* ── Number input with +/− stepper ── */
const StepperInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  prefix?: string;
  color?: string;
}> = ({ label, value, onChange, step = 1, min = 0, prefix, color = "#10b981" }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "9px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onFocusCapture={(e) => (e.currentTarget.style.borderColor = `${color}60`)}
      onBlurCapture={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(2))))}
        style={{
          width: "34px",
          height: "38px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          color: "#475569",
          cursor: "pointer",
          border: "none",
          fontSize: "15px",
          fontWeight: 700,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      >
        −
      </button>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
        {prefix && <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#e2e8f0",
            fontSize: "13px",
            fontWeight: 700,
            width: "80px",
            textAlign: "center",
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(parseFloat((value + step).toFixed(2)))}
        style={{
          width: "34px",
          height: "38px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.02)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          color: "#475569",
          cursor: "pointer",
          border: "none",
          fontSize: "15px",
          fontWeight: 700,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      >
        +
      </button>
    </div>
  </div>
);

/* ── Toggle ── */
const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
  activeColor?: string;
}> = ({ checked, onChange, label, description, activeColor = "#10b981" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderRadius: "10px",
      background: checked ? `${activeColor}06` : "rgba(255,255,255,0.02)",
      border: checked ? `1px solid ${activeColor}20` : "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
      transition: "all 0.2s",
    }}
    onClick={onChange}
  >
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: checked ? "#e2e8f0" : "#94a3b8", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "10px", color: "#475569" }}>{description}</p>
    </div>
    {/* Track */}
    <div
      style={{
        width: "40px",
        height: "22px",
        minWidth: "40px",
        borderRadius: "99px",
        background: checked ? `${activeColor}25` : "rgba(255,255,255,0.05)",
        border: checked ? `1px solid ${activeColor}40` : "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        transition: "all 0.2s",
        marginLeft: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "19px" : "3px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: checked ? activeColor : "#334155",
          boxShadow: checked ? `0 0 6px ${activeColor}60` : "none",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={8} style={{ color: "#fff", strokeWidth: 3 }} />}
      </div>
    </div>
  </div>
);

/* ── Role pill ── */
const ROLE_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
  ORG_ADMIN: { label: "Admin", color: "#8b5cf6", border: "rgba(139,92,246,0.25)", bg: "rgba(139,92,246,0.08)" },
  TRAINER:   { label: "Entrenador", color: "#3b82f6", border: "rgba(59,130,246,0.25)", bg: "rgba(59,130,246,0.08)" },
  CLIENT:    { label: "Cliente", color: "#10b981", border: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)" },
};

/* ─────────────────────────────── */
const GlobalSettingsPage: React.FC<{ session: any }> = ({ session }) => {
  const [settings, setSettings] = useState<GlobalSettings>({
    basePrices: { monthlyPlan: 29.99, yearlyPlan: 299.99, singleSession: 15 },
    aiLimits: { maxRoutinesPerDay: 10, maxAiCallsPerMonth: 1000, maxMembersPerOrg: 500 },
    maintenance: { isEnabled: false, message: "Sistema en mantenimiento", allowedRoles: ["ORG_ADMIN"] },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    if (!session?.access_token) { setLoading(false); return; }
    try {
      const { data } = await axios.get(`${API_URL}/admin/global-settings`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data.success && data.data) setSettings(data.data);
    } catch (err: any) {
      if (err?.response?.status === 401)
        setMessage({ type: "error", text: "Sesión expirada. Vuelve a iniciar sesión." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(`${API_URL}/admin/global-settings`, settings, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setSaved(true);
      setMessage({ type: "success", text: "Configuración guardada correctamente" });
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  };

  const updateBasePrice = (field: keyof GlobalSettings["basePrices"], value: number) =>
    setSettings((p) => ({ ...p, basePrices: { ...p.basePrices, [field]: value } }));
  const updateAiLimit = (field: keyof GlobalSettings["aiLimits"], value: number) =>
    setSettings((p) => ({ ...p, aiLimits: { ...p.aiLimits, [field]: value } }));
  const updateMaintenance = (field: keyof GlobalSettings["maintenance"], value: any) =>
    setSettings((p) => ({ ...p, maintenance: { ...p.maintenance, [field]: value } }));

  if (loading) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={26} className="animate-spin mx-auto mb-3" style={{ color: "#8b5cf6" }} />
          <p style={{ fontSize: "12px", color: "#475569" }}>Cargando configuración…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: "0.5rem" }}>

      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuración Global</h1>
          <p className="text-xs text-muted">Parámetros globales de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            <RefreshCw size={13} /> Recargar
          </button>
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
                : "linear-gradient(135deg,#8b5cf6,#7c3aed)",
              boxShadow: saved
                ? "0 4px 16px rgba(16,185,129,0.3)"
                : "0 4px 16px rgba(139,92,246,0.3)",
              transition: "all 0.2s",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar Cambios"}
          </button>
        </div>
      </header>

      {/* ── STATUS BANNER ── */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: message.type === "success" ? "rgba(16,185,129,0.06)" : "rgba(244,63,94,0.06)",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              minWidth: "5px",
              borderRadius: "50%",
              background: message.type === "success" ? "#10b981" : "#f43f5e",
              boxShadow: `0 0 5px ${message.type === "success" ? "#10b981" : "#f43f5e"}`,
            }}
          />
          {message.type === "success"
            ? <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0 }} />
            : <AlertCircle size={14} style={{ color: "#f43f5e", flexShrink: 0 }} />}
          <span style={{ fontSize: "12px", color: message.type === "success" ? "#10b981" : "#f43f5e" }}>
            {message.text}
          </span>
        </div>
      )}

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Base Prices */}
          <Section icon={<DollarSign size={15} />} title="Precios Base" description="Configura los precios base para planes y sesiones" color="#10b981">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <StepperInput
                label="Plan Mensual"
                value={settings.basePrices.monthlyPlan}
                onChange={(v) => updateBasePrice("monthlyPlan", v)}
                step={0.01}
                prefix="$"
                color="#10b981"
              />
              <StepperInput
                label="Plan Anual"
                value={settings.basePrices.yearlyPlan}
                onChange={(v) => updateBasePrice("yearlyPlan", v)}
                step={0.01}
                prefix="$"
                color="#10b981"
              />
              <StepperInput
                label="Sesión Individual"
                value={settings.basePrices.singleSession}
                onChange={(v) => updateBasePrice("singleSession", v)}
                step={0.01}
                prefix="$"
                color="#10b981"
              />

              {/* Price summary */}
              <div
                style={{
                  marginTop: "4px",
                  padding: "12px 14px",
                  borderRadius: "9px",
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {[
                  { label: "Mensual", value: `$${settings.basePrices.monthlyPlan.toFixed(2)}` },
                  { label: "Anual", value: `$${settings.basePrices.yearlyPlan.toFixed(2)}` },
                  { label: "Sesión", value: `$${settings.basePrices.singleSession.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</p>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "#10b981" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* AI Limits */}
          <Section icon={<Cpu size={15} />} title="Límites de IA" description="Configura los límites de uso de IA por organización" color="#8b5cf6">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <StepperInput
                label="Rutinas IA por día"
                value={settings.aiLimits.maxRoutinesPerDay}
                onChange={(v) => updateAiLimit("maxRoutinesPerDay", v)}
                step={1}
                min={1}
                color="#8b5cf6"
              />
              <StepperInput
                label="Llamadas IA al mes"
                value={settings.aiLimits.maxAiCallsPerMonth}
                onChange={(v) => updateAiLimit("maxAiCallsPerMonth", v)}
                step={50}
                min={1}
                color="#8b5cf6"
              />
              <StepperInput
                label="Máx. miembros por org"
                value={settings.aiLimits.maxMembersPerOrg}
                onChange={(v) => updateAiLimit("maxMembersPerOrg", v)}
                step={10}
                min={1}
                color="#8b5cf6"
              />

              {/* Limits visual */}
              <div
                style={{
                  marginTop: "4px",
                  padding: "12px 14px",
                  borderRadius: "9px",
                  background: "rgba(139,92,246,0.04)",
                  border: "1px solid rgba(139,92,246,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[
                  { label: "Rutinas/día", value: settings.aiLimits.maxRoutinesPerDay, max: 100, color: "#8b5cf6" },
                  { label: "Llamadas/mes", value: settings.aiLimits.maxAiCallsPerMonth, max: 5000, color: "#3b82f6" },
                  { label: "Miembros/org", value: settings.aiLimits.maxMembersPerOrg, max: 2000, color: "#10b981" },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color }}>{value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", borderRadius: "2px", background: color, boxShadow: `0 0 6px ${color}50`, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Maintenance */}
          <Section icon={<Wrench size={15} />} title="Mantenimiento" description="Configura el modo mantenimiento del sistema" color="#f59e0b" danger>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <Toggle
                checked={settings.maintenance.isEnabled}
                onChange={() => updateMaintenance("isEnabled", !settings.maintenance.isEnabled)}
                label="Modo Mantenimiento"
                description="Activa para bloquear el acceso al sistema"
                activeColor="#f59e0b"
              />

              {settings.maintenance.isEnabled && (
                <>
                  {/* Warning badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(244,63,94,0.06)",
                      border: "1px solid rgba(244,63,94,0.18)",
                    }}
                  >
                    <ShieldAlert size={13} style={{ color: "#f43f5e", flexShrink: 0 }} />
                    <p style={{ fontSize: "10px", color: "#f43f5e" }}>
                      El sistema está en mantenimiento. Solo los roles seleccionados tienen acceso.
                    </p>
                  </div>

                  {/* Message input */}
                  <div>
                    <label style={labelStyle}>Mensaje de mantenimiento</label>
                    <input
                      type="text"
                      value={settings.maintenance.message}
                      onChange={(e) => updateMaintenance("message", e.target.value)}
                      style={baseInput}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  {/* Allowed roles */}
                  <div>
                    <label style={labelStyle}>Roles con acceso permitido</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {(["ORG_ADMIN", "TRAINER", "CLIENT"] as const).map((role) => {
                        const sel = settings.maintenance.allowedRoles.includes(role);
                        const rc = ROLE_CONFIG[role];
                        return (
                          <button
                            key={role}
                            onClick={() => {
                              const next = sel
                                ? settings.maintenance.allowedRoles.filter((r) => r !== role)
                                : [...settings.maintenance.allowedRoles, role];
                              updateMaintenance("allowedRoles", next);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              letterSpacing: "0.04em",
                              border: sel ? `1px solid ${rc.border}` : "1px solid rgba(255,255,255,0.07)",
                              background: sel ? rc.bg : "rgba(255,255,255,0.02)",
                              color: sel ? rc.color : "#475569",
                            }}
                          >
                            {sel && (
                              <span
                                style={{
                                  width: "5px",
                                  height: "5px",
                                  borderRadius: "50%",
                                  background: rc.color,
                                  boxShadow: `0 0 4px ${rc.color}`,
                                }}
                              />
                            )}
                            {rc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsPage;
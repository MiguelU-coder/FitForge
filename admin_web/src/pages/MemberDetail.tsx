import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Dumbbell,
  CreditCard,
  Activity,
  Loader2,
  Plus,
  Edit,
  Shield,
  Target,
  Clock,
  Send,
  Check,
  X,
  ChevronRight,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

/* ── Role helpers ── */
const roleAccent = (role: string) => {
  if (role === "ORG_ADMIN")
    return {
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      border: "rgba(139,92,246,0.25)",
      label: "Administrador",
    };
  if (role === "TRAINER")
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.25)",
      label: "Entrenador",
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    label: "Cliente",
  };
};

const statusAccent = (status: string) =>
  status === "active"
    ? {
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
        label: "Activo",
      }
    : {
        color: "#f43f5e",
        bg: "rgba(244,63,94,0.08)",
        border: "rgba(244,63,94,0.2)",
        label: "Inactivo",
      };

const paymentAccent = (status: string) => {
  if (status === "PAID")
    return {
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      label: "Pagado",
    };
  if (status === "PENDING")
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      label: "Pendiente",
    };
  return {
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.2)",
    label: "Vencido",
  };
};

/* ── Section title ── */
const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  color?: string;
  action?: React.ReactNode;
}> = ({ icon, title, color = "#8b5cf6", action }) => (
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
    <h3
      style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", flex: 1 }}
    >
      {title}
    </h3>
    {action}
  </div>
);

/* ── Info row ── */
const InfoRow: React.FC<{ icon: React.ReactNode; value: string }> = ({
  icon,
  value,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}
  >
    <span style={{ color: "#334155", display: "flex", flexShrink: 0 }}>
      {icon}
    </span>
    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{value}</span>
  </div>
);

/* ── Quick action button ── */
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "11px 14px",
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
        background: `${color}12`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
    >
      {icon}
    </span>
    <span style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
      {label}
    </span>
    <ChevronRight size={13} style={{ color: "#334155", marginLeft: "auto" }} />
  </button>
);

/* ─────────────────────────────── */
const MemberDetail: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [assignedRoutines, setAssignedRoutines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [linkSent, setLinkSent] = useState<string | null>(null);

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId || !memberId) return;
      try {
        const [memberRes, programsRes] = await Promise.all([
          axios.get(
            `${API_URL}/organizations/${organizationId}/members/${memberId}`,
            { headers: { Authorization: `Bearer ${session?.access_token}` } },
          ),
          axios.get(`${API_URL}/organizations/${organizationId}/routines`, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }),
        ]);
        if (memberRes.data.success) {
          const d = memberRes.data.data;
          setMember(d.member);
          setAssignedRoutines(d.assignedRoutines || []);
          setPayments(d.payments || []);
          setRecentActivity(d.recentActivity || []);
        }
        if (programsRes.data.success) setPrograms(programsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching member:", err);
      } finally {
        setLoading(false);
      }
    };
    if (session?.access_token) fetchData();
  }, [session, organizationId, memberId]);

  const handleAssignRoutine = async (programId: string) => {
    try {
      await axios.post(
        `${API_URL}/organizations/${organizationId}/members/${memberId}/assign-routine`,
        { programId },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      const res = await axios.get(
        `${API_URL}/organizations/${organizationId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (res.data.success)
        setAssignedRoutines(res.data.data.assignedRoutines || []);
      setShowAssignModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPaymentLink = async (paymentId: string) => {
    try {
      await axios.post(
        `${API_URL}/organizations/${organizationId}/payments/${paymentId}/send-link`,
        {},
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      setLinkSent(paymentId);
      setTimeout(() => setLinkSent(null), 2500);
    } catch {
      /* noop */
    }
  };

  const daysRemaining = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        className="dashboard-content animate-fade-in"
        style={{
          padding: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2
            size={26}
            className="animate-spin mx-auto mb-3"
            style={{ color: "#8b5cf6" }}
          />
          <p style={{ fontSize: "12px", color: "#475569" }}>
            Cargando miembro…
          </p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!member) {
    return (
      <div
        className="dashboard-content animate-fade-in"
        style={{ padding: "0.5rem" }}
      >
        <div
          className="vd-card"
          style={{ padding: "60px 40px", textAlign: "center" }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <User size={24} style={{ color: "#334155" }} />
          </div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#94a3b8",
              marginBottom: "12px",
            }}
          >
            Miembro no encontrado
          </p>
          <button
            onClick={() => navigate("/members")}
            style={{
              fontSize: "12px",
              color: "#8b5cf6",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Volver a miembros
          </button>
        </div>
      </div>
    );
  }

  const ra = roleAccent(member.role);
  const sa = statusAccent(member.status);
  const pendingPayment = payments.find((p) => p.status === "PENDING");

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

        {/* Avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flex: 1,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              borderRadius: "13px",
              background: ra.bg,
              border: `1px solid ${ra.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              color: ra.color,
            }}
          >
            {member.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              {member.displayName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              {/* Role chip */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: ra.color,
                  background: ra.bg,
                  border: `1px solid ${ra.border}`,
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: ra.color,
                    boxShadow: `0 0 4px ${ra.color}`,
                  }}
                />
                {ra.label}
              </span>
              {/* Status chip */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: sa.color,
                  background: sa.bg,
                  border: `1px solid ${sa.border}`,
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: sa.color,
                    boxShadow: `0 0 4px ${sa.color}`,
                  }}
                />
                {sa.label}
              </span>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => navigate(`/members/${memberId}/edit`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "9px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#94a3b8",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#e2e8f0";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          }}
        >
          <Edit size={13} /> Editar
        </button>
      </header>

      {/* ── PENDING PAYMENT ALERT ── */}
      {pendingPayment && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(245,158,11,0.05)",
            border: "1px solid rgba(245,158,11,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              width: "36px",
              height: "36px",
              minWidth: "36px",
              borderRadius: "10px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b",
            }}
          >
            <Clock size={16} />
          </span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#f59e0b",
                marginBottom: "2px",
              }}
            >
              Pago Pendiente
            </p>
            <p style={{ fontSize: "11px", color: "#64748b" }}>
              Tiene una suscripción pendiente.
              {pendingPayment.dueDate && (
                <span style={{ fontWeight: 700, color: "#94a3b8" }}>
                  {" "}
                  Vence en {daysRemaining(pendingPayment.dueDate)} días.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => handleSendPaymentLink(pendingPayment.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "9px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              background:
                linkSent === pendingPayment.id
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "linear-gradient(135deg,#f59e0b,#d97706)",
              boxShadow: "0 4px 12px rgba(245,158,11,0.25)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            {linkSent === pendingPayment.id ? (
              <Check size={12} />
            ) : (
              <Send size={12} />
            )}
            {linkSent === pendingPayment.id ? "¡Enviado!" : "Enviar Link"}
          </button>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-5">
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Contact Info */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<User size={13} />}
              title="Información de Contacto"
              color="#8b5cf6"
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <InfoRow icon={<Mail size={13} />} value={member.email} />
              {member.phoneNumber && (
                <InfoRow
                  icon={<Phone size={13} />}
                  value={member.phoneNumber}
                />
              )}
              {member.dateOfBirth && (
                <InfoRow
                  icon={<Calendar size={13} />}
                  value={new Date(member.dateOfBirth).toLocaleDateString(
                    "es-ES",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                />
              )}
              <InfoRow
                icon={<Shield size={13} />}
                value={`Miembro desde ${new Date(member.joinedAt).toLocaleDateString("es-ES")}`}
              />
            </div>
          </div>

          {/* Assigned Routines */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<Dumbbell size={13} />}
              title="Rutinas Asignadas"
              color="#3b82f6"
              action={
                <button
                  onClick={() => setShowAssignModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#3b82f6",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(59,130,246,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  }}
                >
                  <Plus size={11} /> Asignar
                </button>
              }
            />
            {assignedRoutines.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <Dumbbell
                  size={20}
                  style={{ color: "#334155", margin: "0 auto 8px" }}
                />
                <p style={{ fontSize: "11px", color: "#475569" }}>
                  Sin rutinas asignadas
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {assignedRoutines.map((r: any) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "9px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#e2e8f0",
                          marginBottom: "2px",
                        }}
                      >
                        {r.program?.name}
                      </p>
                      <p style={{ fontSize: "9px", color: "#334155" }}>
                        Asignado:{" "}
                        {new Date(r.assignedAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 9px",
                        borderRadius: "20px",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: r.isActive ? "#10b981" : "#475569",
                        background: r.isActive
                          ? "rgba(16,185,129,0.08)"
                          : "rgba(100,116,139,0.06)",
                        border: `1px solid ${r.isActive ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.15)"}`,
                      }}
                    >
                      <span
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: r.isActive ? "#10b981" : "#475569",
                        }}
                      />
                      {r.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<Activity size={13} />}
              title="Actividad Reciente"
              color="#f59e0b"
            />
            {recentActivity.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#475569" }}>
                  Sin actividad reciente
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "0px" }}
              >
                {recentActivity.slice(0, 5).map((a: any, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom:
                        i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                          flexShrink: 0,
                        }}
                      />
                      {a.eventType}
                    </span>
                    <span style={{ fontSize: "10px", color: "#334155" }}>
                      {new Date(a.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Payment History */}
          <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  minWidth: "26px",
                  borderRadius: "7px",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                }}
              >
                <CreditCard size={13} />
              </span>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  flex: 1,
                }}
              >
                Historial de Pagos
              </h3>
              <button
                onClick={() => navigate(`/payments?member=${memberId}`)}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#10b981",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Ver todos →
              </button>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#475569" }}>
                  Sin pagos registrados
                </p>
              </div>
            ) : (
              <div>
                {payments.slice(0, 5).map((p: any, i) => {
                  const pa = paymentAccent(p.status);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 20px",
                        borderBottom:
                          i < Math.min(payments.length, 5) - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#e2e8f0",
                            marginBottom: "2px",
                          }}
                        >
                          ${p.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: "9px", color: "#334155" }}>
                          {new Date(p.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: pa.color,
                          background: pa.bg,
                          border: `1px solid ${pa.border}`,
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: pa.color,
                            boxShadow: `0 0 4px ${pa.color}`,
                          }}
                        />
                        {pa.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<Target size={13} />}
              title="Acciones Rápidas"
              color="#f43f5e"
            />
            <QuickAction
              icon={<CreditCard size={14} />}
              label="Registrar Pago"
              color="#10b981"
              onClick={() => navigate(`/payments/new?member=${memberId}`)}
            />
            <QuickAction
              icon={<Target size={14} />}
              label="Asignar Rutina"
              color="#3b82f6"
              onClick={() => setShowAssignModal(true)}
            />
            <QuickAction
              icon={<Activity size={14} />}
              label="Ver Progreso"
              color="#8b5cf6"
              onClick={() => navigate(`/members/${memberId}/progress`)}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          ASSIGN ROUTINE MODAL
      ══════════════════════════════ */}
      {showAssignModal && (
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
            backdropFilter: "blur(8px)",
          }}
          className="animate-fade-in"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background:
                "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(9,14,30,0.98) 100%)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                top: "-60px",
                right: "-60px",
                width: "180px",
                height: "180px",
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "20px 22px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  borderRadius: "9px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                }}
              >
                <Dumbbell size={15} />
              </span>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#e2e8f0",
                  }}
                >
                  Asignar Rutina
                </h3>
                <p style={{ fontSize: "10px", color: "#475569" }}>
                  Selecciona una rutina para {member.displayName}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e2e8f0";
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "16px 22px 20px",
                maxHeight: "340px",
                overflowY: "auto",
              }}
            >
              {programs.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
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
                    <Dumbbell size={22} style={{ color: "#334155" }} />
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#94a3b8",
                      marginBottom: "10px",
                    }}
                  >
                    No hay rutinas disponibles
                  </p>
                  <button
                    onClick={() => navigate("/routines/create")}
                    style={{
                      fontSize: "12px",
                      color: "#3b82f6",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Crear una rutina →
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {programs.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => handleAssignRoutine(p.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(59,130,246,0.06)";
                        e.currentTarget.style.borderColor =
                          "rgba(59,130,246,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#e2e8f0",
                            marginBottom: "2px",
                          }}
                        >
                          {p.name}
                        </p>
                        <p style={{ fontSize: "10px", color: "#475569" }}>
                          {p.workoutsCount || 0} entrenamientos
                        </p>
                      </div>
                      <ChevronRight size={14} style={{ color: "#334155" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
  Eye,
  Banknote,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface Payment {
  id: string;
  user: { id: string; displayName: string; email: string; avatarUrl?: string };
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

/* ── Status helpers ── */
const statusAccent = (status: string) => {
  switch (status) {
    case "PAID":
      return {
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
        label: "Pagado",
      };
    case "PENDING":
      return {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.2)",
        label: "Pendiente",
      };
    case "OVERDUE":
      return {
        color: "#f43f5e",
        bg: "rgba(244,63,94,0.08)",
        border: "rgba(244,63,94,0.2)",
        label: "Vencido",
      };
    default:
      return {
        color: "#64748b",
        bg: "rgba(100,116,139,0.08)",
        border: "rgba(100,116,139,0.2)",
        label: status,
      };
  }
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  OVERDUE: "Vencido",
};

/* ─────────────────────────────── */
const OrganizationPayments: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    pendingCount: 0,
    overdueCount: 0,
  });

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);

    axios
      .get(`${API_URL}/organizations/${organizationId}/payments?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      .then(({ data }) => {
        if (data.success) {
          setPayments(data.data.payments || []);
          setStats(
            data.data.stats || {
              totalRevenue: 0,
              thisMonthRevenue: 0,
              pendingCount: 0,
              overdueCount: 0,
            },
          );
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [session, organizationId, statusFilter]);

  const filteredPayments = statusFilter
    ? payments.filter((p) => p.status === statusFilter)
    : payments;

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Pagos</h1>
          <p className="text-xs text-muted">
            Historial de pagos y facturación de miembros
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={() => navigate("/payments/new")}
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
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = "brightness(1)")
            }
          >
            <Plus size={14} /> Registrar Pago
          </button>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {[
          {
            icon: <DollarSign size={13} />,
            label: "Ingresos Totales",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            color: "#10b981",
          },
          {
            icon: <TrendingUp size={13} />,
            label: "Este Mes",
            value: `$${stats.thisMonthRevenue.toLocaleString()}`,
            color: "#3b82f6",
          },
          {
            icon: <Clock size={13} />,
            label: "Pendientes",
            value: stats.pendingCount,
            color: "#f59e0b",
          },
          {
            icon: <AlertTriangle size={13} />,
            label: "Vencidos",
            value: stats.overdueCount,
            color: "#f43f5e",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="vd-card flex flex-col justify-between"
            style={{ padding: "16px 20px" }}
          >
            <span className="text-[10px] text-muted flex items-center gap-1.5 mb-2">
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  borderRadius: "5px",
                  background: `${c.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.color,
                }}
              >
                {c.icon}
              </span>
              {c.label}
            </span>
            <h4 className="text-xl font-bold">{c.value}</h4>
          </div>
        ))}
      </div>

      {/* ── FILTERS TOOLBAR ── */}
      <div className="vd-card mb-4" style={{ padding: "14px 20px" }}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter — styled select */}
          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                padding: "0 32px 0 12px",
                height: "36px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "9px",
                fontSize: "12px",
                color: "#94a3b8",
                outline: "none",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(16,185,129,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.07)")
              }
            >
              <option value="">Todos los estados</option>
              <option value="PAID">Pagados</option>
              <option value="PENDING">Pendientes</option>
              <option value="OVERDUE">Vencidos</option>
            </select>
            <Filter
              size={11}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#475569",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Active status pills */}
          {["PAID", "PENDING", "OVERDUE"].map((s) => {
            const ac = statusAccent(s);
            const sel = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(sel ? "" : s)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  letterSpacing: "0.04em",
                  border: sel
                    ? `1px solid ${ac.border}`
                    : "1px solid rgba(255,255,255,0.07)",
                  background: sel ? ac.bg : "rgba(255,255,255,0.02)",
                  color: sel ? ac.color : "#475569",
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
          style={{ padding: "14px 24px" }}
        >
          <h3 className="text-sm font-bold">Historial de Transacciones</h3>
          <span className="text-[11px] text-muted">
            {filteredPayments.length} pagos encontrados
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Loader2
              size={26}
              className="animate-spin text-purple-500 mx-auto mb-2"
            />
            <p className="text-xs text-muted">Cargando pagos…</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
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
              <CreditCard size={24} style={{ color: "#334155" }} />
            </div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: "4px",
              }}
            >
              Sin pagos registrados
            </p>
            <p style={{ fontSize: "12px", color: "#475569" }}>
              Los pagos de los miembros aparecerán aquí
            </p>
            <button
              onClick={() => navigate("/payments/new")}
              style={{
                marginTop: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)",
                boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              }}
            >
              <Plus size={13} /> Registrar primer pago
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {[
                      { label: "Miembro", w: "26%" },
                      { label: "Monto", w: "14%" },
                      { label: "Estado", w: "14%" },
                      { label: "Método", w: "14%" },
                      { label: "Fecha", w: "20%" },
                      { label: "", w: "12%" },
                    ].map(({ label, w }) => (
                      <th
                        key={label}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#475569",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          width: w,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, idx) => {
                    const sa = statusAccent(payment.status);
                    const isLast = idx === filteredPayments.length - 1;

                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                        onClick={() => navigate(`/payments/${payment.id}`)}
                      >
                        {/* Member */}
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
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
                                background: "rgba(139,92,246,0.1)",
                                border: "1px solid rgba(139,92,246,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#8b5cf6",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {payment.user?.avatarUrl ? (
                                <img
                                  src={payment.user.avatarUrl}
                                  alt={payment.user.displayName}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                payment.user?.displayName?.[0]?.toUpperCase() ||
                                "U"
                              )}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "#e2e8f0",
                                  marginBottom: "2px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {payment.user?.displayName || "Sin nombre"}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#475569",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {payment.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "#e2e8f0",
                              }}
                            >
                              ${payment.amount.toLocaleString()}
                            </span>
                            <span
                              style={{ fontSize: "10px", color: "#475569" }}
                            >
                              {payment.currency}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
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
                                flexShrink: 0,
                              }}
                            />
                            {sa.label}
                          </span>
                        </td>

                        {/* Method */}
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {payment.paymentMethod ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              <Banknote
                                size={11}
                                style={{ flexShrink: 0, color: "#334155" }}
                              />
                              {payment.paymentMethod}
                            </span>
                          ) : (
                            <span
                              style={{ fontSize: "11px", color: "#334155" }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "11px",
                            color: "#475569",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Calendar
                                size={11}
                                style={{ flexShrink: 0, color: "#334155" }}
                              />
                              {new Date(payment.createdAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                            {payment.paidAt && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#334155",
                                  paddingLeft: "17px",
                                }}
                              >
                                Pagado:{" "}
                                {new Date(payment.paidAt).toLocaleDateString(
                                  "es-ES",
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          style={{
                            padding: "16px 24px 16px 16px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/payments/${payment.id}`);
                              }}
                              title="Ver detalle"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="icon-btn p-1.5 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              className="flex justify-between items-center border-t border-white-05"
              style={{ padding: "13px 24px" }}
            >
              <span className="text-[10px] text-muted">
                Mostrando {filteredPayments.length} pagos
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
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationPayments;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Download,
  Shield,
  Dumbbell,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface Member {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role: string;
  joinedAt: string;
  status: string;
}

/* ── Role / status helpers ── */
const roleAccent = (role: string) => {
  if (role === "ORG_ADMIN")
    return {
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      border: "rgba(139,92,246,0.25)",
    };
  if (role === "TRAINER")
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.25)",
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  };
};

const statusAccent = (status: string) =>
  status === "active"
    ? {
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
      }
    : {
        color: "#f43f5e",
        bg: "rgba(244,63,94,0.08)",
        border: "rgba(244,63,94,0.2)",
      };

const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: "Administrador",
  TRAINER: "Entrenador",
  CLIENT: "Cliente",
};

/* ─────────────────────────────── */
const OrganizationMembers: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [stats, setStats] = useState<any>({});

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (roleFilter) params.append("role", roleFilter);

    axios
      .get(`${API_URL}/organizations/${organizationId}/members?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      .then(({ data }) => {
        if (data.success) {
          setMembers(data.data.members || []);
          setStats(data.data.stats || {});
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [session, organizationId, search, roleFilter]);

  const totalMembers = stats.total ?? members.length;
  const activeMembers =
    stats.active ?? members.filter((m) => m.status === "active").length;
  const newThisMonth = stats.newThisMonth ?? 0;
  const trainers =
    stats.byRole?.TRAINER ?? members.filter((m) => m.role === "TRAINER").length;

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Miembros</h1>
          <p className="text-xs text-muted">
            Gestiona los miembros de tu gimnasio
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
            onClick={() => navigate("/members/add")}
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
            <Plus size={14} /> Agregar Miembro
          </button>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {[
          {
            icon: <Users size={13} />,
            label: "Total Miembros",
            value: totalMembers,
            dot: "bg-purple-400",
            color: "#8b5cf6",
          },
          {
            icon: <Shield size={13} />,
            label: "Activos",
            value: activeMembers,
            dot: "bg-emerald-400",
            color: "#10b981",
          },
          {
            icon: <UserPlus size={13} />,
            label: "Nuevos Este Mes",
            value: newThisMonth,
            dot: "bg-blue-400",
            color: "#3b82f6",
          },
          {
            icon: <Dumbbell size={13} />,
            label: "Entrenadores",
            value: trainers,
            dot: "bg-amber-400",
            color: "#f59e0b",
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
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 12px",
              height: "36px",
              flex: 1,
              maxWidth: "400px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "9px",
              transition: "border-color 0.2s",
            }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
            }
          >
            <Search size={13} style={{ color: "#475569", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Role filter — styled select */}
          <div style={{ position: "relative" }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
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
              <option value="">Todos los roles</option>
              <option value="CLIENT">Clientes</option>
              <option value="TRAINER">Entrenadores</option>
              <option value="ORG_ADMIN">Administradores</option>
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

          {/* Active role pills */}
          {["CLIENT", "TRAINER", "ORG_ADMIN"].map((r) => {
            const ac = roleAccent(r);
            const sel = roleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(sel ? "" : r)}
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
                {ROLE_LABELS[r]}
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
          <h3 className="text-sm font-bold">Directorio de Miembros</h3>
          <span className="text-[11px] text-muted">
            {members.length} miembros encontrados
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Loader2
              size={26}
              className="animate-spin text-purple-500 mx-auto mb-2"
            />
            <p className="text-xs text-muted">Cargando miembros…</p>
          </div>
        ) : members.length === 0 ? (
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
              <Users size={24} style={{ color: "#334155" }} />
            </div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: "4px",
              }}
            >
              Sin miembros
            </p>
            <p style={{ fontSize: "12px", color: "#475569" }}>
              Agrega tu primer miembro para comenzar
            </p>
            <button
              onClick={() => navigate("/members/add")}
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
              <Plus size={13} /> Agregar primer miembro
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
                      { label: "Miembro", w: "28%" },
                      { label: "Contacto", w: "22%" },
                      { label: "Rol", w: "14%" },
                      { label: "Estado", w: "12%" },
                      { label: "Fecha Ingreso", w: "16%" },
                      { label: "", w: "8%" },
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
                  {members.map((member, idx) => {
                    const ra = roleAccent(member.role);
                    const sa = statusAccent(member.status);
                    const isLast = idx === members.length - 1;

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                        onClick={() => navigate(`/members/${member.id}`)}
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
                            {/* Avatar */}
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                minWidth: "36px",
                                borderRadius: "10px",
                                background: ra.bg,
                                border: `1px solid ${ra.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 800,
                                color: ra.color,
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.displayName}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                member.displayName?.[0]?.toUpperCase() || "U"
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
                                {member.displayName}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#475569",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Mail
                                size={10}
                                style={{ flexShrink: 0, color: "#475569" }}
                              />
                              {member.email}
                            </span>
                            {member.phoneNumber && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#475569",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Phone size={9} style={{ flexShrink: 0 }} />
                                {member.phoneNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role */}
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
                                flexShrink: 0,
                              }}
                            />
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
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
                            {member.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {/* Join date */}
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "11px",
                            color: "#475569",
                            whiteSpace: "nowrap",
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
                            {new Date(member.joinedAt).toLocaleDateString(
                              "es-ES",
                            )}
                          </span>
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
                                navigate(`/members/${member.id}`);
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
                Mostrando {members.length} miembros
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

export default OrganizationMembers;

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Building2,
  ChevronRight,
  X,
  Loader2,
  Check,
  RadioTower,
  Inbox,
  BarChart3,
  Eye,
} from "lucide-react";

const QUEUE_ITEMS = [
  { label: "API / Integration", count: 8, max: 10, color: "#3b82f6" },
  { label: "Billing Issues", count: 6, max: 10, color: "#f59e0b" },
  { label: "Login / Access", count: 5, max: 10, color: "#8b5cf6" },
  { label: "Hardware Sync", count: 5, max: 10, color: "#f43f5e" },
];

/* ── Status / Priority helpers ── */
const statusAccent = (status: string) => {
  switch (status) {
    case "OPEN":
      return {
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
        border: "rgba(59,130,246,0.2)",
        label: "Abierto",
      };
    case "IN_PROGRESS":
      return {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.2)",
        label: "En proceso",
      };
    case "CLOSED":
      return {
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
        label: "Cerrado",
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

const priorityAccent = (priority: string) => {
  switch (priority) {
    case "CRITICAL":
      return {
        color: "#f43f5e",
        bg: "rgba(244,63,94,0.08)",
        border: "rgba(244,63,94,0.2)",
      };
    case "HIGH":
      return {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.2)",
      };
    case "MEDIUM":
      return {
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.2)",
      };
    default:
      return {
        color: "#475569",
        bg: "rgba(100,116,139,0.08)",
        border: "rgba(100,116,139,0.2)",
      };
  }
};

/* ── Section title (shared with other pages) ── */
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
const SupportHub: React.FC<{ session?: any }> = ({ session }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch] = useState("");

  const API_URL =
    (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";
  const headers = { Authorization: `Bearer ${session?.access_token}` };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/support/tickets`, { headers }),
        axios.get(`${API_URL}/support/stats`, { headers }),
      ]);
      const tp = ticketsRes?.data;
      const td = (tp && (tp.data ?? tp.tickets ?? tp)) ?? [];
      setTickets(Array.isArray(td) ? td : []);
      const sp = statsRes?.data;
      setStats((sp && (sp.data ?? sp)) ?? { total: 0, open: 0, resolved: 0 });
    } catch (err) {
      setTickets([]);
      setStats({ total: 0, open: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) fetchData();
  }, [session]);

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const activeCount = safeTickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  ).length;
  const filteredTickets = search
    ? safeTickets.filter(
        (t) =>
          t.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          t.subject?.toLowerCase().includes(search.toLowerCase()),
      )
    : safeTickets;

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setSending(true);
    try {
      await axios.post(
        `${API_URL}/support/broadcast`,
        { title: "Global Announcement", message: broadcastMsg, type: "info" },
        { headers },
      );
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setBroadcastMsg("");
      }, 2400);
    } catch {
      alert("Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyMsg.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await axios.post(
        `${API_URL}/support/tickets/${selectedTicket.id}/reply`,
        { message: replyMsg },
        { headers },
      );
      setReplyMsg("");
      setSelectedTicket(null);
      fetchData();
    } catch {
      alert("Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      await axios.put(
        `${API_URL}/support/tickets/${id}/status`,
        { status: "CLOSED" },
        { headers },
      );
      fetchData();
      if (selectedTicket?.id === id) setSelectedTicket(null);
    } catch {
      alert("Failed to close ticket.");
    }
  };

  const resolveRate = Math.round((stats.resolved / (stats.total || 1)) * 100);

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Support Hub</h1>
          <p className="text-xs text-muted">
            Manage organization assistance & platform-wide communications.
          </p>
        </div>
        {/* Active tickets badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.22)",
            fontSize: "12px",
            fontWeight: 700,
            color: "#a78bfa",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#8b5cf6",
              boxShadow: "0 0 5px #8b5cf6",
            }}
          />
          <MessageSquare size={13} />
          {activeCount} Active Tickets
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.35)",
              borderRadius: "5px",
              padding: "1px 6px",
              color: "#c4b5fd",
              letterSpacing: "0.06em",
            }}
          >
            LIVE
          </span>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {[
          {
            color: "#3b82f6",
            label: "Open Tickets",
            value: stats.open.toString(),
          },
          {
            color: "#f59e0b",
            label: "Total Requests",
            value: stats.total.toString(),
            sub: "All time",
          },
          {
            color: "#10b981",
            label: "Resolved",
            value: stats.resolved.toString(),
            sub: `${resolveRate}% resolve rate`,
          },
          {
            color: "#10b981",
            label: "Platform Status",
            value: "STABLE",
            sub: "Monitoring",
            valColor: "#10b981",
          },
        ].map((c: any) => (
          <div
            key={c.label}
            className="vd-card flex flex-col"
            style={{ padding: "16px 20px" }}
          >
            <span className="text-[10px] text-muted flex items-center gap-1.5 mb-2">
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: c.color,
                  boxShadow: `0 0 5px ${c.color}`,
                  flexShrink: 0,
                }}
              />
              {c.label}
            </span>
            <h4
              className="text-xl font-bold"
              style={{ color: c.valColor || "#e2e8f0" }}
            >
              {c.value}
            </h4>
            {c.sub && (
              <span
                style={{ fontSize: "9px", color: "#475569", marginTop: "4px" }}
              >
                {c.sub}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* LEFT: Broadcast + Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Broadcast */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<RadioTower size={13} />}
              title="Global Broadcast"
              color="#8b5cf6"
            />
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Scheduled maintenance tonight at 22:00 UTC…"
              style={{
                width: "100%",
                height: "88px",
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
                marginBottom: "10px",
                lineHeight: 1.6,
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(139,92,246,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.07)")
              }
            />
            <button
              onClick={handleSendBroadcast}
              disabled={!broadcastMsg.trim() || sending}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                border: "none",
                cursor:
                  !broadcastMsg.trim() || sending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                background: sent
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                boxShadow: sent
                  ? "0 4px 14px rgba(16,185,129,0.25)"
                  : "0 4px 14px rgba(139,92,246,0.25)",
                opacity: !broadcastMsg.trim() || sending ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (broadcastMsg.trim() && !sending)
                  e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              {sending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : sent ? (
                <Check size={13} />
              ) : (
                <Send size={13} />
              )}
              {sending ? "Sending…" : sent ? "Sent!" : "Send Broadcast"}
            </button>
          </div>

          {/* Queue Overview */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <SectionTitle
              icon={<BarChart3 size={13} />}
              title="Queue Overview"
              color="#3b82f6"
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {QUEUE_ITEMS.map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: "10px",
                    background: `${item.color}0d`,
                    border: `1px solid ${item.color}22`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "2px",
                      background: item.color,
                      opacity: 0.6,
                    }}
                  />
                  <div style={{ padding: "10px 14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: item.color,
                            boxShadow: `0 0 4px ${item.color}`,
                          }}
                        />
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: item.color,
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "3px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(item.count / item.max) * 100}%`,
                          height: "100%",
                          borderRadius: "3px",
                          background: item.color,
                          boxShadow: `0 0 6px ${item.color}50`,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Tickets table */}
        <div
          className="vd-card"
          style={{
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(2,6,23,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "3px",
                  height: "16px",
                  background: "#f43f5e",
                  borderRadius: "2px",
                }}
              />
              <h3
                style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}
              >
                Incoming Help Requests
              </h3>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  color: "#475569",
                }}
              >
                {filteredTickets.length} tickets
              </span>
            </div>
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
              }}
              onFocusCapture={(e) =>
                (e.currentTarget.style.borderColor = "rgba(244,63,94,0.35)")
              }
              onBlurCapture={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
              }
            >
              <Search size={12} style={{ color: "#475569", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
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
          <div style={{ overflowX: "auto", flex: 1 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "560px",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {[
                    { label: "Ticket / User", w: "28%" },
                    { label: "Subject", w: "30%" },
                    { label: "Priority", w: "14%", center: true },
                    { label: "Estado", w: "14%", center: true },
                    { label: "", w: "14%", right: true },
                  ].map(({ label, w, center, right }) => (
                    <th
                      key={label}
                      style={{
                        padding: "11px 16px",
                        textAlign: center ? "center" : right ? "right" : "left",
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "60px 0", textAlign: "center" }}
                    >
                      <Loader2
                        size={22}
                        className="animate-spin mx-auto mb-2"
                        style={{ color: "#8b5cf6" }}
                      />
                      <p style={{ fontSize: "12px", color: "#475569" }}>
                        Cargando tickets…
                      </p>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
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
                        <Inbox size={22} style={{ color: "#334155" }} />
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#94a3b8",
                          marginBottom: "4px",
                        }}
                      >
                        Sin tickets pendientes
                      </p>
                      <p style={{ fontSize: "11px", color: "#475569" }}>
                        ¡Buen trabajo!
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t, idx) => {
                    const sa = statusAccent(t.status);
                    const pa = priorityAccent(t.priority);
                    const isLast = idx === filteredTickets.length - 1;
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                        onClick={() => setSelectedTicket(t)}
                      >
                        {/* User */}
                        <td
                          style={{ padding: "14px 16px", whiteSpace: "nowrap" }}
                        >
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
                                background: sa.bg,
                                border: `1px solid ${sa.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: sa.color,
                              }}
                            >
                              {t.user?.displayName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#e2e8f0",
                                  marginBottom: "2px",
                                }}
                              >
                                {t.user?.displayName || "Anonymous"}
                              </p>
                              <p
                                style={{
                                  fontSize: "9px",
                                  color: "#334155",
                                  fontFamily: "monospace",
                                }}
                              >
                                #{t.id?.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Subject */}
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "11px",
                            color: "#64748b",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.subject}
                        </td>

                        {/* Priority */}
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 9px",
                              borderRadius: "20px",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: pa.color,
                              background: pa.bg,
                              border: `1px solid ${pa.border}`,
                            }}
                          >
                            <span
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: pa.color,
                                boxShadow: `0 0 4px ${pa.color}`,
                              }}
                            />
                            {t.priority || "LOW"}
                          </span>
                        </td>

                        {/* Status */}
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 9px",
                              borderRadius: "20px",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: sa.color,
                              background: sa.bg,
                              border: `1px solid ${sa.border}`,
                            }}
                          >
                            <span
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: sa.color,
                                boxShadow: `0 0 4px ${sa.color}`,
                              }}
                            />
                            {sa.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            padding: "14px 20px 14px 16px",
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
                                setSelectedTicket(t);
                              }}
                              title="Ver ticket"
                            >
                              <Eye size={14} />
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
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#475569" }}>
              Mostrando {filteredTickets.length} tickets
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#f43f5e",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Ver todos →
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          TICKET DETAIL MODAL
      ══════════════════════════════ */}
      {selectedTicket && (
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
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background:
                "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(9,14,30,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
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
                width: "200px",
                height: "200px",
                background:
                  "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "20px 22px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {(() => {
                  const sa = statusAccent(selectedTicket.status);
                  return (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        minWidth: "36px",
                        borderRadius: "10px",
                        background: sa.bg,
                        border: `1px solid ${sa.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: sa.color,
                      }}
                    >
                      {selectedTicket.user?.displayName?.[0]?.toUpperCase() ||
                        "?"}
                    </div>
                  );
                })()}
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#e2e8f0",
                      marginBottom: "3px",
                    }}
                  >
                    {selectedTicket.subject}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#475569" }}>
                      {selectedTicket.user?.email}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#334155",
                        fontFamily: "monospace",
                      }}
                    >
                      #{selectedTicket.id?.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
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
                  flexShrink: 0,
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

            {/* Status + priority chips */}
            <div
              style={{
                padding: "12px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                gap: "8px",
              }}
            >
              {(() => {
                const sa = statusAccent(selectedTicket.status);
                const pa = priorityAccent(selectedTicket.priority);
                return (
                  <>
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
                        }}
                      />
                      {sa.label}
                    </span>
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
                      {selectedTicket.priority || "LOW"}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Message */}
            <div
              style={{
                margin: "16px 22px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Mensaje
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                }}
              >
                "{selectedTicket.message}"
              </p>
            </div>

            {/* Reply textarea */}
            <div style={{ padding: "0 22px 16px" }}>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Respuesta
              </p>
              <textarea
                value={replyMsg}
                onChange={(e) => setReplyMsg(e.target.value)}
                placeholder="Escribe tu respuesta…"
                style={{
                  width: "100%",
                  height: "100px",
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
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(139,92,246,0.4)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.07)")
                }
              />
            </div>

            {/* Footer buttons */}
            <div
              style={{
                padding: "14px 22px 20px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => handleCloseTicket(selectedTicket.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "9px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#f43f5e",
                  background: "rgba(244,63,94,0.06)",
                  border: "1px solid rgba(244,63,94,0.18)",
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
                Cerrar Ticket
              </button>
              <button
                onClick={handleReply}
                disabled={!replyMsg.trim() || sendingReply}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "9px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#fff",
                  border: "none",
                  cursor:
                    !replyMsg.trim() || sendingReply
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                  boxShadow: "0 4px 14px rgba(139,92,246,0.25)",
                  opacity: !replyMsg.trim() || sendingReply ? 0.5 : 1,
                  transition: "filter 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (replyMsg.trim() && !sendingReply)
                    e.currentTarget.style.filter = "brightness(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                {sendingReply ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {sendingReply ? "Enviando…" : "Enviar Respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportHub;

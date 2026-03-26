import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";

/* ── Data ── */
const MOCK_TICKETS = [
  {
    id: "TKT-101",
    gym: "Iron Temple Gym",
    subject: "API Integration Error",
    priority: "High",
    status: "Open",
    date: "Dec 30, 2024",
  },
  {
    id: "TKT-102",
    gym: "FitForge Central",
    subject: "Billing Discrepancy",
    priority: "Medium",
    status: "Pending",
    date: "Dec 28, 2024",
  },
  {
    id: "TKT-103",
    gym: "Zenith Yoga Studio",
    subject: "Login Issues (New Staff)",
    priority: "Low",
    status: "Resolved",
    date: "Dec 25, 2024",
  },
  {
    id: "TKT-104",
    gym: "Elite Performance Hub",
    subject: "Hardware Sync Problem",
    priority: "Critical",
    status: "Open",
    date: "Dec 22, 2024",
  },
];

const QUEUE_ITEMS = [
  { label: "API / Integration", count: 8, max: 10, color: "#3b82f6" },
  { label: "Billing Issues", count: 6, max: 10, color: "#f59e0b" },
  { label: "Login / Access", count: 5, max: 10, color: "#8b5cf6" },
  { label: "Hardware Sync", count: 5, max: 10, color: "#f43f5e" },
];

const SupportHub: React.FC<{ session?: any }> = () => {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSend = () => {
    if (!broadcastMsg.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setBroadcastMsg("");
    }, 2400);
  };

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
        {/* Active chats badge — same style as SecurityAudit live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 14px",
            borderRadius: "8px",
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.22)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#a78bfa",
            letterSpacing: "0.06em",
          }}
        >
          <MessageSquare size={13} style={{ flexShrink: 0 }} />
          12 Active Chats
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "4px",
              padding: "1px 6px",
              color: "#c4b5fd",
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
            dot: "bg-blue-400",
            label: "Open Tickets",
            value: "24",
            sub: null,
            subColor: null,
          },
          {
            dot: "bg-amber-400",
            label: "Avg. Response",
            value: "18m",
            sub: "Fastest",
            subColor: "#10b981",
          },
          {
            dot: "bg-emerald-400",
            label: "Resolved Today",
            value: "11",
            sub: "+3 desde ayer",
            subColor: "#10b981",
          },
          {
            dot: "bg-rose-400",
            label: "Critical Open",
            value: "4",
            sub: "Requieren atención",
            subColor: "#f43f5e",
            valColor: "#f43f5e",
          },
        ].map((c: any) => (
          <div
            key={c.label}
            className="vd-card flex flex-col"
            style={{ padding: "20px 22px", gap: "10px" }}
          >
            <span className="text-[10px] text-muted flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}
              />
              {c.label}
            </span>
            <h4
              className="text-xl font-bold"
              style={{ color: c.valColor || "inherit" }}
            >
              {c.value}
            </h4>
            {c.sub && (
              <span style={{ fontSize: "9px", color: c.subColor || "#475569" }}>
                {c.sub}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* ── LEFT COL ── */}
        <div className="flex flex-col gap-4">
          {/* Broadcast card */}
          <div className="vd-card" style={{ padding: "24px" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-sm font-bold">Global Broadcast</h3>
            </div>
            <p className="text-[10px] text-muted mb-5 leading-relaxed">
              Send a system-wide banner to ALL organization dashboards.
            </p>
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Scheduled maintenance tonight at 11 PM EST…"
              className="w-full rounded-xl text-[11px] text-slate-300 outline-none resize-none transition-all mb-2"
              style={{
                height: "88px",
                padding: "12px 14px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                lineHeight: "1.6",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(139,92,246,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.07)")
              }
            />
            <div className="flex justify-between items-center text-[9px] text-muted mb-4">
              <span>{broadcastMsg.length} / 280 chars</span>
              <span className="flex items-center gap-1">
                <Users size={9} /> All tenants
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={!broadcastMsg.trim()}
              className={`w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale ${sent ? "bg-emerald-500" : "btn-primary bg-purple-600 hover:brightness-110"}`}
              style={{
                color: "#fff",
                border: "none",
                cursor: broadcastMsg.trim() ? "pointer" : "not-allowed",
              }}
            >
              {sent ? (
                <>
                  <CheckCircle2 size={13} /> Broadcast Sent!
                </>
              ) : (
                <>
                  <Send size={13} /> Send Broadcast
                </>
              )}
            </button>
          </div>

          {/* Queue card — same card style as Revenue Streams */}
          <div className="vd-card flex-1" style={{ padding: "24px" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h3 className="text-sm font-bold">Queue Overview</h3>
            </div>

            <div className="flex flex-col gap-3">
              {QUEUE_ITEMS.map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: "12px",
                    background: `${item.color}0d`,
                    border: `1px solid ${item.color}25`,
                    overflow: "hidden",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter = "brightness(1)")
                  }
                >
                  {/* colored top line */}
                  <div
                    style={{
                      height: "2px",
                      background: item.color,
                      opacity: 0.7,
                    }}
                  />

                  <div style={{ padding: "11px 14px" }}>
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
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "11px",
                          color: "#94a3b8",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: item.color,
                            boxShadow: `0 0 5px ${item.color}`,
                            flexShrink: 0,
                          }}
                        />
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: item.color,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                    {/* progress bar */}
                    <div
                      style={{
                        height: "4px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(item.count / item.max) * 100}%`,
                          height: "100%",
                          borderRadius: "4px",
                          background: item.color,
                          boxShadow: `0 0 8px ${item.color}55`,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TICKET TABLE ── */}
        <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Toolbar — two rows: title row + controls row */}
          <div
            className="border-b border-white-05 bg-slate-950/20"
            style={{ padding: "18px 24px 14px" }}
          >
            {/* Row 1: title + badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h3 className="text-sm font-bold">Incoming Help Requests</h3>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "20px",
                  background: "rgba(244,63,94,0.1)",
                  color: "#f43f5e",
                  border: "1px solid rgba(244,63,94,0.2)",
                  letterSpacing: "0.06em",
                }}
              >
                4 CRITICAL
              </span>
            </div>
            {/* Row 2: search + filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 12px",
                  height: "32px",
                  flex: 1,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  transition: "border-color 0.2s",
                }}
                onFocusCapture={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)")
                }
                onBlurCapture={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
                }
              >
                <Search size={12} style={{ color: "#475569", flexShrink: 0 }} />
                <input
                  placeholder="Search by gym, subject or ID…"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "11px",
                    color: "#94a3b8",
                    width: "100%",
                  }}
                />
              </div>
              <button
                className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
                style={{ padding: "6px 12px", flexShrink: 0 }}
              >
                <Filter size={12} /> Filter
              </button>
            </div>
          </div>

          {/* Scrollable table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "600px",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {[
                    { label: "ID / Gym", w: "30%" },
                    { label: "Subject", w: "28%" },
                    { label: "Priority", w: "14%" },
                    { label: "Status", w: "14%" },
                    { label: "Actions", w: "14%", right: true },
                  ].map(({ label, w, right }) => (
                    <th
                      key={label}
                      style={{
                        padding: "12px 16px",
                        textAlign: right ? "right" : "left",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        width: w,
                        paddingRight: right ? "24px" : "16px",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TICKETS.map((t, idx) => {
                  const priColor =
                    t.priority === "Critical"
                      ? "#f43f5e"
                      : t.priority === "High"
                        ? "#f59e0b"
                        : t.priority === "Medium"
                          ? "#3b82f6"
                          : "#94a3b8";
                  const priBg =
                    t.priority === "Critical"
                      ? "rgba(244,63,94,0.08)"
                      : t.priority === "High"
                        ? "rgba(245,158,11,0.08)"
                        : t.priority === "Medium"
                          ? "rgba(59,130,246,0.08)"
                          : "rgba(255,255,255,0.04)";
                  const priBdr =
                    t.priority === "Critical"
                      ? "rgba(244,63,94,0.25)"
                      : t.priority === "High"
                        ? "rgba(245,158,11,0.25)"
                        : t.priority === "Medium"
                          ? "rgba(59,130,246,0.25)"
                          : "rgba(255,255,255,0.08)";
                  const isLast = idx === MOCK_TICKETS.length - 1;

                  const stColor =
                    t.status === "Resolved"
                      ? "#10b981"
                      : t.status === "Pending"
                        ? "#f59e0b"
                        : "#64748b";
                  const stBg =
                    t.status === "Resolved"
                      ? "rgba(16,185,129,0.08)"
                      : t.status === "Pending"
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(255,255,255,0.04)";
                  const stBdr =
                    t.status === "Resolved"
                      ? "rgba(16,185,129,0.2)"
                      : t.status === "Pending"
                        ? "rgba(245,158,11,0.2)"
                        : "rgba(255,255,255,0.08)";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                      style={{
                        borderBottom: isLast
                          ? "none"
                          : "1px solid rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={() => setHoveredRow(t.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* ID / Gym */}
                      <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
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
                              border: `1px solid ${priBdr}`,
                              color: priColor,
                              background: priBg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "9px",
                              fontWeight: 800,
                            }}
                          >
                            {t.id.replace("TKT-", "#")}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "#475569",
                                marginBottom: "2px",
                              }}
                            >
                              {t.id}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Building2 size={9} />
                              {t.gym}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "12px",
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "200px",
                        }}
                        className="group-hover:text-white transition-colors"
                      >
                        {t.subject}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 9px",
                            borderRadius: "20px",
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: priColor,
                            background: priBg,
                            border: `1px solid ${priBdr}`,
                          }}
                        >
                          {t.priority === "Critical" && (
                            <AlertTriangle size={8} />
                          )}
                          {t.priority.toUpperCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 9px",
                            borderRadius: "20px",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: stColor,
                            background: stBg,
                            border: `1px solid ${stBdr}`,
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: stColor,
                              boxShadow: `0 0 4px ${stColor}`,
                              flexShrink: 0,
                            }}
                          />
                          {t.status.toUpperCase()}
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
                        <button
                          className="text-[9px] font-bold text-purple-400 bg-purple-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1 ml-auto"
                          style={{
                            padding: "5px 10px",
                            border: "1px solid rgba(139,92,246,0.25)",
                          }}
                        >
                          REPLY <ChevronRight size={10} />
                        </button>
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
              Showing 4 of 24 open tickets
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#10b981",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                    flexShrink: 0,
                  }}
                />
                3 Support Admins Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportHub;

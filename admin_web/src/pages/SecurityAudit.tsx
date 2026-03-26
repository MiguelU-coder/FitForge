import React, { useState } from "react";
import {
  Search,
  Filter,
  Terminal,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Zap,
  Cpu,
  Eye,
  Radio,
} from "lucide-react";

/* ── Data ── */
const MOCK_ALERTS = [
  {
    id: "1",
    type: "Warning",
    message: "Massive login attempts on Iron Temple Gym",
    time: "2 mins ago",
    level: "high",
  },
  {
    id: "2",
    type: "Info",
    message: "New Super Admin registered: Roberto G.",
    time: "45 mins ago",
    level: "medium",
  },
  {
    id: "3",
    type: "Critical",
    message: "Unauthorized API access attempt from IP: 192.168.1.1",
    time: "1 hour ago",
    level: "critical",
  },
];

const MOCK_AUDIT_LOGS = [
  {
    id: "L1",
    user: "Roberto G.",
    action: "Suspend Organization",
    entity: "Zenith Yoga Studio",
    ip: "185.20.10.4",
    time: "2024-03-19 14:20",
    type: "danger",
  },
  {
    id: "L2",
    user: "System",
    action: "Auto-Renew Membership",
    entity: "Elite Performance",
    ip: "Internal",
    time: "2024-03-19 13:00",
    type: "success",
  },
  {
    id: "L3",
    user: "Admin Sarah",
    action: "Delete User",
    entity: "Carlos M. #002",
    ip: "72.15.30.12",
    time: "2024-03-19 12:45",
    type: "danger",
  },
  {
    id: "L4",
    user: "Roberto G.",
    action: "Change Platform Fee",
    entity: "System Config",
    ip: "185.20.10.4",
    time: "2024-03-19 11:20",
    type: "warning",
  },
  {
    id: "L5",
    user: "System",
    action: "Database Backup",
    entity: "Global DB",
    ip: "Internal",
    time: "2024-03-19 03:00",
    type: "success",
  },
];

const LEVEL: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: {
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.2)",
    label: "Critical",
  },
  high: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    label: "Warning",
  },
  medium: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    label: "Info",
  },
};

const ACTION_COLOR: Record<string, string> = {
  danger: "#f43f5e",
  warning: "#f59e0b",
  success: "#10b981",
};

const KPI_LIST = [
  {
    label: "Guard Status",
    val: "Optimal",
    dot: "bg-emerald-400",
    color: "#10b981",
  },
  { label: "API Req / hr", val: "12.4K", dot: "bg-blue-400", color: "#3b82f6" },
  { label: "Active Admins", val: "4", dot: "bg-purple-400", color: "#8b5cf6" },
  { label: "Global Nodes", val: "12", dot: "bg-amber-400", color: "#f59e0b" },
];

const SecurityAudit: React.FC<{ session?: any }> = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_AUDIT_LOGS.filter(
    (l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Security & Audit Guard</h1>
          <p className="text-xs text-muted">
            Real-time platform monitoring and system-wide activity tracking.
          </p>
        </div>

        {/* Live badge — compact pill, not giant */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 14px",
            borderRadius: "8px",
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.22)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#10b981",
            letterSpacing: "0.06em",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px #10b981",
              flexShrink: 0,
              animation: "pulse 2s infinite",
            }}
          />
          Live Monitoring
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "4px",
              padding: "1px 6px",
              color: "#34d399",
            }}
          >
            ON
          </span>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {KPI_LIST.map((c) => (
          <div
            key={c.label}
            className="vd-card flex flex-col justify-between"
            style={{ padding: "16px 20px" }}
          >
            <span className="text-[10px] text-muted flex items-center gap-1.5 mb-2">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}
              />
              {c.label}
            </span>
            <h4 className="text-lg font-bold" style={{ color: c.color }}>
              {c.val}
            </h4>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* ── ALERTS PANEL ── */}
        <div className="vd-card flex flex-col" style={{ padding: "28px 24px" }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h3 className="text-sm font-bold">Active Alarms</h3>
            </div>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "3px 9px",
                borderRadius: "20px",
                background: "rgba(244,63,94,0.1)",
                color: "#f43f5e",
                border: "1px solid rgba(244,63,94,0.22)",
              }}
            >
              3 ALERTS
            </span>
          </div>

          {/* Alert items */}
          <div className="flex flex-col gap-4 flex-1">
            {MOCK_ALERTS.map((alert) => {
              const lv = LEVEL[alert.level];
              return (
                <div
                  key={alert.id}
                  style={{
                    borderRadius: "14px",
                    background: lv.bg,
                    border: `1px solid ${lv.border}`,
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
                  <div
                    style={{
                      height: "3px",
                      background: lv.color,
                      opacity: 0.85,
                    }}
                  />
                  <div style={{ padding: "16px 18px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: lv.color,
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: lv.color,
                            boxShadow: `0 0 6px ${lv.color}`,
                            flexShrink: 0,
                          }}
                        />
                        {lv.label}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "10px",
                          color: "#475569",
                        }}
                      >
                        <Clock size={10} style={{ flexShrink: 0 }} />
                        {alert.time}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        lineHeight: "1.6",
                        margin: 0,
                      }}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View all */}
          <button className="w-full mt-5 py-2.5 rounded-xl border border-white-05 text-[10px] font-bold text-muted hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
            <Eye size={12} /> View All Alerts
          </button>
        </div>

        {/* ── AUDIT TABLE ── */}
        <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Toolbar */}
          <div
            className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
            style={{ padding: "16px 24px" }}
          >
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-500" />
              <h3 className="text-sm font-bold">Platform Audit Trail</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Search — styled properly */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 12px",
                  height: "34px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "9px",
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs…"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "11px",
                    color: "#94a3b8",
                    width: "120px",
                  }}
                />
              </div>

              <button
                className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
                style={{ padding: "6px 11px" }}
              >
                <Filter size={12} /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "640px",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {[
                    { label: "Administrator", w: "26%" },
                    { label: "Operation", w: "26%" },
                    { label: "IP Address", w: "18%" },
                    { label: "Timestamp", w: "20%" },
                    { label: "", w: "10%", right: true },
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
                {filtered.map((log, idx) => {
                  const dotColor = ACTION_COLOR[log.type];
                  const isSystem = log.user === "System";
                  const isLast = idx === filtered.length - 1;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderBottom: isLast
                          ? "none"
                          : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Admin */}
                      <td
                        style={{ padding: "15px 16px", whiteSpace: "nowrap" }}
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
                              borderRadius: "10px",
                              background: isSystem
                                ? "rgba(59,130,246,0.08)"
                                : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isSystem ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 800,
                              color: isSystem ? "#3b82f6" : "#64748b",
                            }}
                          >
                            {isSystem ? <Cpu size={13} /> : log.user.charAt(0)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#e2e8f0",
                                marginBottom: "2px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.user}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              → {log.entity}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Operation */}
                      <td
                        style={{ padding: "15px 16px", whiteSpace: "nowrap" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              minWidth: "6px",
                              borderRadius: "50%",
                              background: dotColor,
                              boxShadow: `0 0 5px ${dotColor}`,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* IP */}
                      <td
                        style={{ padding: "15px 16px", whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 9px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontFamily: "monospace",
                            color: "#64748b",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          {log.ip === "Internal" ? (
                            <Zap
                              size={9}
                              style={{ color: "#f59e0b", flexShrink: 0 }}
                            />
                          ) : (
                            <Globe size={9} style={{ flexShrink: 0 }} />
                          )}
                          {log.ip}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td
                        style={{
                          padding: "15px 16px",
                          fontSize: "10px",
                          color: "#475569",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.time}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "15px 24px 15px 16px",
                          textAlign: "right",
                        }}
                      >
                        <button className="icon-btn p-1.5 text-slate-700 hover:text-white">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex justify-between items-center border-t border-white-05"
            style={{ padding: "13px 24px" }}
          >
            <span className="text-[10px] text-muted">
              Showing {filtered.length} of 2,100 entries
            </span>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-lg">
                Page 1 of 42
              </span>
              <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;

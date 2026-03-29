import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Terminal,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Loader2,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface AuditLog {
  id: string;
  user: { displayName: string; email: string };
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  statusCode: number;
  isError: boolean;
  createdAt: string;
  payload?: any;
}

/* ── Action color helper ── */
const actionAccent = (action: string) => {
  if (action.includes("DELETE"))
    return {
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.08)",
      border: "rgba(244,63,94,0.2)",
      method: "DELETE",
    };
  if (action.includes("PUT") || action.includes("PATCH"))
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      method: "PATCH",
    };
  if (action.includes("POST"))
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      method: "POST",
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    method: "GET",
  };
};

/* ── Status color helper ── */
const statusAccent = (code: number) => {
  if (code >= 500)
    return {
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.1)",
      border: "#f43f5e30",
      icon: <AlertTriangle size={10} />,
    };
  if (code >= 400)
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      border: "#f59e0b30",
      icon: <ShieldAlert size={10} />,
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "#10b98130",
    icon: <CheckCircle2 size={10} />,
  };
};

/* ── Entity type chip color ── */
const entityAccent = (entity: string) => {
  const e = entity?.toUpperCase();
  if (e?.includes("USER") || e?.includes("MEMBER"))
    return {
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(139,92,246,0.2)",
    };
  if (e?.includes("PAYMENT") || e?.includes("BILLING"))
    return {
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
    };
  if (e?.includes("ORG"))
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
    };
  return {
    color: "#475569",
    bg: "rgba(100,116,139,0.06)",
    border: "rgba(100,116,139,0.15)",
  };
};

const SecurityAudit: React.FC<{ session?: any }> = ({ session }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const API_URL =
    (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";
  const headers = { Authorization: `Bearer ${session?.access_token}` };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/audit/logs`, { headers });
      const payload = res?.data;
      const data = (payload && (payload.data ?? payload)) ?? [];
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) fetchLogs();
  }, [session]);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = safeLogs.filter((l) => {
    const matchesSearch =
      l.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType?.toLowerCase().includes(search.toLowerCase());

    const matchesErrorFilter = showErrorsOnly
      ? l.isError || l.statusCode >= 400
      : true;

    return matchesSearch && matchesErrorFilter;
  });

  const errorCount = safeLogs.filter(
    (l) => l.isError || l.statusCode >= 400,
  ).length;
  const uniqueIPs = new Set(safeLogs.map((l) => l.ipAddress).filter(Boolean))
    .size;

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Security & Audit</h1>
          <p className="text-xs text-muted">
            Platform monitoring focusing on system hygiene and threat detection.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.2)",
            fontSize: "12px",
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
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <Activity size={13} />
          Live Monitoring
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              background: "rgba(16,185,129,0.2)",
              border: "1px solid rgba(16,185,129,0.35)",
              borderRadius: "5px",
              padding: "1px 7px",
              color: "#34d399",
              letterSpacing: "0.06em",
            }}
          >
            ON
          </span>
        </div>
      </header>

      <div className="grid-cols-stats mb-6">
        {[
          {
            color: "#10b981",
            label: "Guard Status",
            value: errorCount > 5 ? "Warning" : "Optimal",
            valColor: errorCount > 5 ? "#f59e0b" : "#10b981",
          },
          {
            color: "#3b82f6",
            label: "Logs Collected",
            value: safeLogs.length.toString(),
          },
          {
            color: "#f43f5e",
            label: "Detected Errors",
            value: errorCount.toString(),
            valColor: errorCount > 0 ? "#f43f5e" : "#e2e8f0",
          },
          {
            color: "#f59e0b",
            label: "Unique IPs",
            value: uniqueIPs.toString(),
          },
        ].map((c: any) => (
          <div
            key={c.label}
            className="vd-card flex flex-col justify-between"
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-dashboard gap-4">
        <div className="vd-card" style={{ padding: "22px 24px" }}>
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
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f43f5e",
              }}
            >
              <ShieldAlert size={13} />
            </span>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#e2e8f0",
                flex: 1,
              }}
            >
              Active Alarms
            </h3>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: errorCount > 0 ? "#f43f5e" : "#10b981",
                background:
                  errorCount > 0
                    ? "rgba(244,63,94,0.08)"
                    : "rgba(16,185,129,0.08)",
                border:
                  errorCount > 0
                    ? "1px solid rgba(244,63,94,0.2)"
                    : "1px solid rgba(16,185,129,0.2)",
                borderRadius: "20px",
                padding: "3px 10px",
                letterSpacing: "0.06em",
              }}
            >
              {errorCount} {errorCount === 1 ? "ISSUE" : "ISSUES"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            {errorCount === 0 ? (
              <>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    boxShadow: "0 0 24px rgba(16,185,129,0.1)",
                  }}
                >
                  <ShieldCheck size={26} style={{ color: "#10b981" }} />
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    marginBottom: "6px",
                  }}
                >
                  Sistema Seguro
                </p>
                <p style={{ fontSize: "11px", color: "#475569" }}>
                  No active security threats detected.
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "rgba(244,63,94,0.08)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    boxShadow: "0 0 24px rgba(244,63,94,0.1)",
                  }}
                >
                  <AlertTriangle size={26} style={{ color: "#f43f5e" }} />
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#f43f5e",
                    marginBottom: "6px",
                  }}
                >
                  Alerta Detectada
                </p>
                <p style={{ fontSize: "11px", color: "#475569" }}>
                  {errorCount} suspicious events need review.
                </p>
              </>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {[
              { label: "Authentication", status: "Secure", color: "#10b981" },
              {
                label: "API Health",
                status: errorCount > 0 ? "Check Logs" : "Perfect",
                color: errorCount > 0 ? "#f59e0b" : "#10b981",
              },
              { label: "Encryption", status: "Active", color: "#3b82f6" },
              { label: "Stability", status: "STABLE", color: "#10b981" },
            ].map(({ label, status, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
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
                      background: color,
                      boxShadow: `0 0 4px ${color}`,
                    }}
                  />
                  {label}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="vd-card"
          style={{
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(2,6,23,0.2)",
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
              <Terminal size={13} />
            </span>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#e2e8f0",
                flex: 1,
              }}
            >
              Platform Audit Trail
            </h3>

            <div
              onClick={() => setShowErrorsOnly(!showErrorsOnly)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "8px",
                background: showErrorsOnly
                  ? "rgba(244,63,94,0.1)"
                  : "transparent",
                border: `1px solid ${showErrorsOnly ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
                marginRight: "4px",
              }}
            >
              <ShieldAlert
                size={12}
                style={{ color: showErrorsOnly ? "#f43f5e" : "#475569" }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: showErrorsOnly ? "#f43f5e" : "#475569",
                }}
              >
                Solo Errores
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                height: "34px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "9px",
                transition: "border-color 0.2s",
                width: "180px",
              }}
            >
              <Search size={12} style={{ color: "#475569", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "11px",
                  color: "#e2e8f0",
                }}
              />
            </div>
            <button
              onClick={fetchLogs}
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                color: "#475569",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div style={{ overflowX: "auto", flex: 1 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "580px",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {[
                    { label: "Administrator", w: "24%" },
                    { label: "Operation", w: "26%" },
                    { label: "Status", w: "12%", center: true },
                    { label: "Entity", w: "14%" },
                    { label: "IP Address", w: "12%" },
                    { label: "Timestamp", w: "12%", right: true },
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
                      colSpan={6}
                      style={{ padding: "60px 0", textAlign: "center" }}
                    >
                      <Loader2
                        size={22}
                        className="animate-spin mx-auto mb-2"
                        style={{ color: "#10b981" }}
                      />
                      <p style={{ fontSize: "12px", color: "#475569" }}>
                        Loading audit logs…
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                        <Terminal size={22} style={{ color: "#334155" }} />
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#94a3b8",
                          marginBottom: "4px",
                        }}
                      >
                        No logs found
                      </p>
                      <p style={{ fontSize: "11px", color: "#475569" }}>
                        Try adjusting your search or filters
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log, idx) => {
                    const aa = actionAccent(log.action);
                    const ea = entityAccent(log.entityType);
                    const st = statusAccent(
                      log.statusCode || (log.isError ? 500 : 200),
                    );
                    const isLast = idx === filtered.length - 1;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <td
                          style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
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
                                background: "rgba(16,185,129,0.08)",
                                border: "1px solid rgba(16,185,129,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#10b981",
                              }}
                            >
                              {log.user?.displayName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#e2e8f0",
                                  marginBottom: "1px",
                                }}
                              >
                                {log.user?.displayName}
                              </p>
                              <p style={{ fontSize: "9px", color: "#334155" }}>
                                {log.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
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
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "9px",
                                fontWeight: 800,
                                color: aa.color,
                                background: aa.bg,
                                border: `1px solid ${aa.border}`,
                              }}
                            >
                              {aa.method}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "160px",
                              }}
                            >
                              {log.action}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{ padding: "13px 16px", textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 8px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: st.color,
                              background: st.bg,
                              border: `1px solid ${st.border}`,
                            }}
                          >
                            {st.icon}{" "}
                            {log.statusCode || (log.isError ? 500 : 200)}
                          </span>
                        </td>
                        <td
                          style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 9px",
                              borderRadius: "20px",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: ea.color,
                              background: ea.bg,
                              border: `1px solid ${ea.border}`,
                            }}
                          >
                            <span
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: ea.color,
                                boxShadow: `0 0 3px ${ea.color}`,
                              }}
                            />
                            {log.entityType}
                          </span>
                        </td>
                        <td
                          style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 10px",
                              borderRadius: "7px",
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              fontFamily: "monospace",
                              fontSize: "10px",
                              color: "#475569",
                            }}
                          >
                            {log.ipAddress || "Internal"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 20px 13px 16px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "2px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Clock size={10} style={{ color: "#334155" }} />
                              {new Date(log.createdAt).toLocaleTimeString(
                                "es-ES",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            <span style={{ fontSize: "9px", color: "#334155" }}>
                              {new Date(log.createdAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;

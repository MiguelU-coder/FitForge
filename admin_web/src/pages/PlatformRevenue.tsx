import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowUpRight,
  RefreshCcw,
  Download,
  Filter,
  Clock,
  MoreVertical,
  X,
  Loader2,
  Check,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ── Data ── */
const FEE_DISTRIBUTION = [
  { name: "Subscription Fees", short: "Subs", value: 12500, color: "#8b5cf6" },
  { name: "Transaction Comm.", short: "Trans", value: 8400, color: "#3b82f6" },
  { name: "Add-on Services", short: "Add-on", value: 3200, color: "#10b981" },
];

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

const PlatformRevenue: React.FC<{ session?: any }> = ({ session }) => {
  const [settings, setSettings] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState("5.0");
  const [saved, setSaved] = useState(false);

  const [stats, setStats] = useState({
    monthlyUsers: 0,
    newSignups: 0,
    subscriptions: 0,
    mrr: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const fetchSettings = async () => {
    try {
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      const [settingsRes, statsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/billing/settings`, { headers }),
        axios.get(`${API_URL}/admin/stats/dashboard`, { headers }),
        axios.get(`${API_URL}/admin/events/recent?limit=10`, { headers }),
      ]);
      setSettings(settingsRes.data.data || settingsRes.data);
      setNewFee(
        settingsRes.data.data?.platformFeePct ||
          settingsRes.data?.platformFeePct ||
          "5.0",
      );
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (eventsRes.data.success) setRecentEvents(eventsRes.data.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [session]);

  const handleUpdateRates = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/billing/settings`,
        { platformFeePct: parseFloat(newFee) },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      await fetchSettings();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 1400);
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to update rates.");
    } finally {
      setLoading(false);
    }
  };

  const currentFee = parseFloat(settings?.platformFeePct || "5");
  const totalFees = stats.mrr * (currentFee / 100);
  const max = Math.max(...FEE_DISTRIBUTION.map((d) => d.value));

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Platform Revenue</h1>
          <p className="text-xs text-muted">
            Transaction fees & platform-wide financial health.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
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
            <RefreshCcw size={14} /> Update Rates
          </button>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {[
          {
            dot: "#8b5cf6",
            label: "Total Platform Fees",
            color: "#8b5cf6",
            value: `$${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            badge: "+18.4%",
            badgeColor: "#10b981",
            sub: (
              <span className="text-[9px] text-muted flex items-center gap-1">
                <Clock size={10} /> Updated just now
              </span>
            ),
          },
          {
            dot: "#f59e0b",
            label: "Pending Payouts",
            color: "#f59e0b",
            value: "$8,450",
            sub: (
              <div>
                <div
                  style={{
                    height: "4px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "65%",
                      height: "100%",
                      borderRadius: "4px",
                      background: "#f59e0b",
                      boxShadow: "0 0 8px rgba(245,158,11,0.4)",
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted">
                  65% awaiting disbursement
                </span>
              </div>
            ),
          },
          {
            dot: "#10b981",
            label: "Success Rate",
            color: "#10b981",
            value: "98.2%",
            badge: "+1.2%",
            badgeColor: "#10b981",
            sub: (
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: "4px",
                      flex: 1,
                      borderRadius: "2px",
                      background:
                        i < 9
                          ? "rgba(16,185,129,0.4)"
                          : "rgba(255,255,255,0.05)",
                      boxShadow:
                        i < 9 ? "0 0 4px rgba(16,185,129,0.2)" : "none",
                    }}
                  />
                ))}
              </div>
            ),
          },
          {
            dot: "#3b82f6",
            label: "Active Billing",
            color: "#3b82f6",
            value: stats.subscriptions.toLocaleString(),
            sub: (
              <span className="text-[9px] text-blue-400">
                tenants currently billed
              </span>
            ),
          },
        ].map((c) => (
          <div
            key={c.label}
            className="vd-card flex flex-col"
            style={{ padding: "18px 20px", gap: "10px" }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted flex items-center gap-1.5">
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: c.dot,
                    boxShadow: `0 0 5px ${c.dot}`,
                    flexShrink: 0,
                  }}
                />
                {c.label}
              </span>
              {c.badge && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: c.badgeColor,
                    background: `${c.badgeColor}15`,
                    padding: "2px 6px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <ArrowUpRight size={9} />
                  {c.badge}
                </span>
              )}
            </div>
            <h4
              className="text-xl font-bold"
              style={{
                color:
                  c.value.startsWith("$") || c.value.includes("%")
                    ? "#e2e8f0"
                    : "#e2e8f0",
              }}
            >
              {c.value}
            </h4>
            {c.sub}
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* Revenue Streams */}
        <div className="vd-card" style={{ padding: "24px" }}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: "3px",
                  height: "16px",
                  background: "#8b5cf6",
                  borderRadius: "2px",
                }}
              />
              <h3 className="text-sm font-bold">Revenue Streams</h3>
            </div>
            <button className="icon-btn p-1 text-slate-600 hover:text-white">
              <MoreVertical size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-3 mb-5">
            {FEE_DISTRIBUTION.map((item) => (
              <div
                key={item.name}
                style={{
                  borderRadius: "10px",
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
                <div
                  style={{
                    height: "2px",
                    background: item.color,
                    opacity: 0.7,
                  }}
                />
                <div style={{ padding: "12px 16px" }}>
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
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#e2e8f0",
                      }}
                    >
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
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
                        width: `${(item.value / max) * 100}%`,
                        height: "100%",
                        borderRadius: "4px",
                        background: item.color,
                        boxShadow: `0 0 8px ${item.color}55`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "9px",
                      color: "#475569",
                      textAlign: "right",
                    }}
                  >
                    {Math.round((item.value / max) * 100)}% of peak
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: "110px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FEE_DISTRIBUTION}
                barSize={30}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="2 6"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="short"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: 11,
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {FEE_DISTRIBUTION.map((item, i) => (
                    <Cell key={i} fill={item.color} opacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions table */}
        <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
            style={{ padding: "14px 24px" }}
          >
            <h3 className="text-sm font-bold">Recent Transactions</h3>
            <button
              className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
              style={{ padding: "6px 12px" }}
            >
              <Filter size={12} /> Filter
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
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
                    { label: "ID / Gym", w: "35%" },
                    { label: "Amount", w: "15%" },
                    { label: `Fee (${currentFee}%)`, w: "13%" },
                    { label: "Status", w: "18%" },
                    { label: "Date", w: "19%", right: true },
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
                {recentEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "48px 0",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#475569",
                      }}
                    >
                      No recent events synced yet
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((tx, idx) => {
                    const isLast = idx === recentEvents.length - 1;
                    const isPayment =
                      tx.eventType.includes("payment") ||
                      tx.eventType.includes("checkout");
                    const status = tx.eventType.includes("failed")
                      ? "Failed"
                      : isPayment
                        ? "Completed"
                        : "Processing";
                    const amountNum = tx.payload?.amount
                      ? tx.payload.amount / 100
                      : 0;
                    const feeNum = amountNum * (currentFee / 100);
                    const amountStr = amountNum
                      ? `$${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—";
                    const feeStr = amountNum
                      ? `$${feeNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—";
                    const sc =
                      status === "Completed"
                        ? {
                            color: "#10b981",
                            bg: "rgba(16,185,129,0.08)",
                            border: "rgba(16,185,129,0.2)",
                          }
                        : status === "Processing"
                          ? {
                              color: "#f59e0b",
                              bg: "rgba(245,158,11,0.08)",
                              border: "rgba(245,158,11,0.2)",
                            }
                          : {
                              color: "#f43f5e",
                              bg: "rgba(244,63,94,0.08)",
                              border: "rgba(244,63,94,0.2)",
                            };
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-white/[0.02] transition-colors"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
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
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: sc.color,
                                boxShadow: `0 0 5px ${sc.color}`,
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "#e2e8f0",
                                  marginBottom: "2px",
                                }}
                              >
                                {tx.user?.displayName || tx.userId || "Unknown"}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#475569",
                                  fontFamily: "monospace",
                                }}
                              >
                                {tx.eventType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#f1f5f9",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {amountStr}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#10b981",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {feeStr}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              color: sc.color,
                              background: sc.bg,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            <span
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: sc.color,
                                boxShadow: `0 0 4px ${sc.color}`,
                                flexShrink: 0,
                              }}
                            />
                            {status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 24px 14px 16px",
                            textAlign: "right",
                            fontSize: "11px",
                            color: "#475569",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            className="flex justify-between items-center border-t border-white-05"
            style={{ padding: "13px 24px" }}
          >
            <span className="text-[10px] text-muted">
              Showing {recentEvents.length} transactions
            </span>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft size={13} />
              </button>
              <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-lg border border-purple-400/20">
                Page 1
              </span>
              <button className="p-1.5 rounded-lg border border-white-05 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          MODAL — Update Platform Rates
      ══════════════════════════════ */}
      {showModal && (
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
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background:
                "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(9,14,30,0.98) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
              position: "relative",
            }}
          >
            {/* Glow blob */}
            <div
              style={{
                position: "absolute",
                top: "-60px",
                right: "-60px",
                width: "200px",
                height: "200px",
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-40px",
                left: "-40px",
                width: "160px",
                height: "160px",
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Modal header ── */}
            <div
              style={{
                padding: "22px 24px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    borderRadius: "10px",
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981",
                  }}
                >
                  <Zap size={16} />
                </span>
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "#e2e8f0",
                      marginBottom: "2px",
                    }}
                  >
                    Platform Economics
                  </h3>
                  <p style={{ fontSize: "10px", color: "#475569" }}>
                    Global fee applied to all transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
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

            {/* ── Modal body ── */}
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Description */}
              <p
                style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.7 }}
              >
                Adjust the global platform fee charged on every organization
                transaction. Changes are applied immediately to all future
                billing cycles.
              </p>

              {/* Current vs new comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "8px",
                    }}
                  >
                    Current Rate
                  </p>
                  <p
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: "#475569",
                      lineHeight: 1,
                    }}
                  >
                    {currentFee}
                    <span style={{ fontSize: "14px", color: "#334155" }}>
                      %
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#10b981",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "8px",
                    }}
                  >
                    New Rate
                  </p>
                  <p
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: "#34d399",
                      lineHeight: 1,
                    }}
                  >
                    {parseFloat(newFee) || 0}
                    <span style={{ fontSize: "14px", color: "#10b98170" }}>
                      %
                    </span>
                  </p>
                </div>
              </div>

              {/* Fee input */}
              <div>
                <label
                  style={{
                    fontSize: "10px",
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Standard Platform Fee (%)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                  onFocusCapture={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)")
                  }
                  onBlurCapture={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(16,185,129,0.25)")
                  }
                >
                  {/* Decrement */}
                  <button
                    type="button"
                    onClick={() =>
                      setNewFee((v) =>
                        Math.max(0, parseFloat(v) - 0.5).toFixed(1),
                      )
                    }
                    style={{
                      width: "40px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.03)",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      color: "#475569",
                      cursor: "pointer",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#e2e8f0";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.03)";
                    }}
                  >
                    −
                  </button>

                  {/* Input */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "0 12px",
                    }}
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#e2e8f0",
                        fontSize: "20px",
                        fontWeight: 800,
                        width: "80px",
                        textAlign: "center",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      %
                    </span>
                  </div>

                  {/* Increment */}
                  <button
                    type="button"
                    onClick={() =>
                      setNewFee((v) =>
                        Math.min(100, parseFloat(v) + 0.5).toFixed(1),
                      )
                    }
                    style={{
                      width: "40px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.03)",
                      borderLeft: "1px solid rgba(255,255,255,0.06)",
                      color: "#475569",
                      cursor: "pointer",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#e2e8f0";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.03)";
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Revenue Impact card ── */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      minWidth: "26px",
                      borderRadius: "7px",
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                    }}
                  >
                    <TrendingUp size={13} />
                  </span>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    Estimated Revenue Impact
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Projected next month at{" "}
                      <strong style={{ color: "#64748b" }}>{newFee}%</strong>
                    </p>
                    <p
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#10b981",
                        lineHeight: 1,
                      }}
                    >
                      ${(parseFloat(newFee) * 5000).toLocaleString()}
                    </p>
                  </div>
                  {/* Delta vs current */}
                  {parseFloat(newFee) !== currentFee && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color:
                          parseFloat(newFee) > currentFee
                            ? "#10b981"
                            : "#f43f5e",
                        background:
                          parseFloat(newFee) > currentFee
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(244,63,94,0.1)",
                        border: `1px solid ${parseFloat(newFee) > currentFee ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                      }}
                    >
                      <ArrowUpRight
                        size={10}
                        style={{
                          transform:
                            parseFloat(newFee) < currentFee
                              ? "rotate(90deg)"
                              : "none",
                        }}
                      />
                      {parseFloat(newFee) > currentFee ? "+" : ""}
                      {(
                        (parseFloat(newFee) - currentFee) *
                        5000
                      ).toLocaleString()}{" "}
                      vs current
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Modal footer ── */}
            <div
              style={{
                padding: "16px 24px 20px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  background: "rgba(255,255,255,0.02)",
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
                onClick={handleUpdateRates}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: saved
                    ? "linear-gradient(135deg,#059669,#047857)"
                    : "linear-gradient(135deg,#10b981,#059669)",
                  boxShadow: saved
                    ? "0 4px 16px rgba(5,150,105,0.4)"
                    : "0 4px 16px rgba(16,185,129,0.3)",
                  transition: "all 0.2s",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.filter = "brightness(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={14} />
                ) : (
                  <RefreshCcw size={14} />
                )}
                {loading
                  ? "Applying…"
                  : saved
                    ? "Rates Updated!"
                    : "Confirm New Rates"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformRevenue;

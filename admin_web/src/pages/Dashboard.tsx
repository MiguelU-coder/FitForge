import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  TrendingUp,
  Activity,
  Building2,
  MoreVertical,
  Download,
  Globe,
  RefreshCw,
  ShieldCheck,
  Zap,
  Server,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

/* ── Custom tooltip for chart ── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0d1525",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "10px 14px",
        fontSize: "11px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      }}
    >
      <p style={{ color: "#475569", marginBottom: "4px", fontSize: "10px" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>
          ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────── */
const Dashboard: React.FC<{ session: any; profile: any }> = ({
  session,
  profile,
}) => {
  const userName = profile?.displayName || "Admin";

  const [stats, setStats] = useState({
    monthlyUsers: 0,
    newSignups: 0,
    subscriptions: 0,
    mrr: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<{
    devices: any[];
    countries: any[];
  }>({ devices: [], countries: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${session.access_token}` };
      const [s, c, e, d] = await Promise.all([
        axios.get(`${API_URL}/admin/stats/dashboard`, { headers: h }),
        axios.get(`${API_URL}/admin/stats/revenue-chart`, { headers: h }),
        axios.get(`${API_URL}/admin/events/recent?limit=6`, { headers: h }),
        axios.get(`${API_URL}/admin/stats/distributions`, { headers: h }),
      ]);
      if (s.data.success) setStats(s.data.data);
      if (c.data.success) setRevenueData(c.data.data);
      if (e.data.success) setRecentEvents(e.data.data);
      if (d.data.success) setDistributions(d.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const totalDeviceUsers = distributions.devices.reduce(
    (a, d) => a + d.value,
    0,
  );
  const arr = ((stats.mrr * 12) / 1000).toFixed(1);

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, {userName.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted">
            Platform-wide performance and system intelligence for FitForge.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchData}
            className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <Download size={13} /> Export
          </button>
          {/* Live badge — same as SecurityAudit */}
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
                animation: "pulse 2s infinite",
              }}
            />
            <Activity size={13} />
            System Live
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
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {[
          {
            label: "MRR (EST.)",
            value: `$${stats.mrr.toLocaleString()}`,
            color: "#8b5cf6",
            dot: "bg-purple-400",
            trend: "+5.2%",
          },
          {
            label: "Active Users (30D)",
            value: stats.monthlyUsers.toLocaleString(),
            color: "#3b82f6",
            dot: "bg-blue-400",
            trend: "+2.1%",
          },
          {
            label: "New Signups",
            value: stats.newSignups.toLocaleString(),
            color: "#10b981",
            dot: "bg-emerald-400",
            trend: "+8.4%",
          },
          {
            label: "Active Orgs",
            value: stats.subscriptions.toLocaleString(),
            color: "#f59e0b",
            dot: "bg-amber-400",
            trend: "+1.0%",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="vd-card flex flex-col justify-between"
            style={{ padding: "16px 20px" }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-muted flex items-center gap-1.5">
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
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "20px",
                  padding: "2px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <ArrowUpRight size={9} />
                {c.trend}
              </span>
            </div>
            <h4 className="text-xl font-bold" style={{ color: c.color }}>
              {c.value}
            </h4>
          </div>
        ))}
      </div>

      {/* ── ROW 1: Chart + Side cards ── */}
      <div className="grid grid-cols-dashboard gap-4 mb-4">
        {/* Revenue chart card */}
        <div className="vd-card" style={{ padding: "24px" }}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 bg-purple-500 rounded-full"
                style={{ boxShadow: "0 0 8px #8b5cf6" }}
              />
              <h3 className="text-sm font-bold">Revenue Stream</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Commission
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Expenses
              </span>
              <button className="icon-btn p-1 text-slate-600 hover:text-white">
                <MoreVertical size={13} />
              </button>
            </div>
          </div>

          {/* ARR callout */}
          <div className="flex items-baseline gap-3 mb-6">
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#e2e8f0",
                letterSpacing: "-0.02em",
              }}
            >
              ${arr}K
            </h2>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: "#10b981",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "20px",
                padding: "3px 10px",
                letterSpacing: "0.08em",
              }}
            >
              EST. ARR
            </span>
          </div>

          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 10 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#grad1)"
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#8b5cf6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right side — 3 mini cards */}
        <div className="flex flex-col gap-4">
          {/* Quick insight */}
          <div
            className="vd-card relative overflow-hidden"
            style={{
              padding: "22px 24px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.18)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(90deg,rgba(99,102,241,0.6),transparent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                opacity: 0.06,
                pointerEvents: "none",
              }}
            >
              <TrendingUp size={64} />
            </div>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: "#818cf8",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Quick Insight
            </span>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#cbd5e1",
                lineHeight: "1.6",
                marginBottom: "14px",
              }}
            >
              Platform growth is up{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 800 }}>12.4%</span>{" "}
              this month across all tenants.
            </p>
            <button
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#fff",
                background: "#6366f1",
                border: "none",
                borderRadius: "8px",
                padding: "7px 16px",
                cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              Optimization Plan
            </button>
          </div>

          {/* Active nodes */}
          <div className="vd-card" style={{ padding: "20px 22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#475569",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <Server size={12} style={{ color: "#334155" }} /> Active Nodes
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#10b981",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "20px",
                  padding: "2px 8px",
                  letterSpacing: "0.06em",
                }}
              >
                STABLE
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h3
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#e2e8f0",
                  letterSpacing: "-0.02em",
                }}
              >
                12
              </h3>
              <span
                style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}
              >
                / 12 online
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
                  width: "100%",
                  height: "100%",
                  background: "#10b981",
                  borderRadius: "4px",
                  boxShadow: "0 0 8px rgba(16,185,129,0.4)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "9px", color: "#334155", marginTop: "6px" }}>
              All nodes responding normally
            </p>
          </div>

          {/* Security guard */}
          <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#475569",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={12} style={{ color: "#10b981" }} /> Security
                Guard
              </span>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                  animation: "pulse 2s infinite",
                }}
              />
            </div>
            <div style={{ padding: "14px 18px" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  lineHeight: "1.6",
                }}
              >
                System state is{" "}
                <span style={{ color: "#10b981", fontWeight: 700 }}>
                  Healthy
                </span>
                . Last security sweep completed 4m ago.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Device pie + Country distribution ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* Device distribution */}
        <div className="vd-card" style={{ padding: "24px" }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 bg-blue-500 rounded-full"
                style={{ boxShadow: "0 0 8px #3b82f6" }}
              />
              <h3 className="text-sm font-bold">Users by Device</h3>
            </div>
            <button className="icon-btn p-1 text-slate-600 hover:text-white">
              <MoreVertical size={13} />
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div
              style={{ position: "relative", width: "200px", height: "200px" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <Pie
                    data={distributions.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={85}
                    cornerRadius={10}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributions.devices.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#e2e8f0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {totalDeviceUsers.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#475569",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Total
                </span>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {distributions.devices.map((d) => {
                const pct = totalDeviceUsers
                  ? Math.round((d.value / totalDeviceUsers) * 100)
                  : 0;
                return (
                  <div key={d.name}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
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
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: d.color,
                            boxShadow: `0 0 4px ${d.color}`,
                            flexShrink: 0,
                          }}
                        />
                        {d.name} Users
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#e2e8f0",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "3px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: d.color,
                          boxShadow: `0 0 6px ${d.color}55`,
                          borderRadius: "4px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {distributions.devices.length === 0 && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "#334155",
                    textAlign: "center",
                    padding: "20px 0",
                    fontStyle: "italic",
                  }}
                >
                  Awaiting device metrics…
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Market distribution */}
        <div className="vd-card" style={{ padding: "24px" }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 rounded-full"
                style={{ background: "#6366f1", boxShadow: "0 0 8px #6366f1" }}
              />
              <h3 className="text-sm font-bold">Market Distribution</h3>
            </div>
            <Globe size={14} className="text-slate-500" />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {distributions.countries.map((c) => (
              <div key={c.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "7px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* Flag chip */}
                    <div
                      style={{
                        width: "28px",
                        height: "18px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                      }}
                    >
                      {c.flag}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#e2e8f0",
                    }}
                  >
                    {c.val}
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: c.val,
                      height: "100%",
                      background: c.color,
                      boxShadow: `0 0 6px ${c.color}55`,
                      borderRadius: "4px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
            {distributions.countries.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Globe
                  size={28}
                  style={{ color: "#1e293b", margin: "0 auto 12px" }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "#334155",
                    fontStyle: "italic",
                  }}
                >
                  Awaiting international metrics…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

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
const MOCK_TRANSACTIONS = [
  {
    id: "TX-9021",
    gym: "Iron Temple Gym",
    amount: "$1,250.00",
    fee: "$62.50",
    status: "Completed",
    date: "Dec 30, 2024",
  },
  {
    id: "TX-9022",
    gym: "FitForge Central",
    amount: "$840.00",
    fee: "$42.00",
    status: "Processing",
    date: "Dec 28, 2024",
  },
  {
    id: "TX-9023",
    gym: "Zenith Yoga Studio",
    amount: "$450.00",
    fee: "$22.50",
    status: "Completed",
    date: "Dec 25, 2024",
  },
  {
    id: "TX-9024",
    gym: "Elite Performance Hub",
    amount: "$2,100.00",
    fee: "$105.00",
    status: "Failed",
    date: "Dec 22, 2024",
  },
  {
    id: "TX-9025",
    gym: "Velocity CrossFit",
    amount: "$620.00",
    fee: "$31.00",
    status: "Completed",
    date: "Dec 21, 2024",
  },
];

const FEE_DISTRIBUTION = [
  { name: "Subscription Fees", short: "Subs", value: 12500, color: "#8b5cf6" },
  { name: "Transaction Comm.", short: "Trans", value: 8400, color: "#3b82f6" },
  { name: "Add-on Services", short: "Add-on", value: 3200, color: "#10b981" },
];

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const PlatformRevenue: React.FC<{ session?: any }> = ({ session }) => {
  const [settings, setSettings] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState("5.0");

  const [stats, setStats] = useState({ monthlyUsers: 0, newSignups: 0, subscriptions: 0, mrr: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const fetchSettings = async () => {
    try {
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      const [settingsRes, statsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/billing/settings`, { headers }),
        axios.get(`${API_URL}/admin/stats/dashboard`, { headers }),
        axios.get(`${API_URL}/admin/events/recent?limit=10`, { headers })
      ]);
      setSettings(settingsRes.data.data || settingsRes.data);
      setNewFee(settingsRes.data.data?.platformFeePct || settingsRes.data?.platformFeePct || "5.0");
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
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      await fetchSettings();
      setShowModal(false);
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to update rates.");
    } finally {
      setLoading(false);
    }
  };

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
            className="btn-primary text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            style={{
              padding: "8px 16px",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            <RefreshCcw size={14} /> Update Rates
          </button>
        </div>
      </header>

      {/* ── KPI STRIP ── */}
      <div className="grid-cols-stats mb-6">
        {/* Total Fees */}
        <div
          className="vd-card flex flex-col"
          style={{ padding: "20px 22px", gap: "12px" }}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
              Total Platform Fees
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              +18.4%
            </span>
          </div>
          <h4 className="text-xl font-bold">${(stats.mrr * (parseFloat(settings?.platformFeePct || "5")) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          <div className="text-[9px] text-muted flex items-center gap-1">
            <Clock size={10} /> Updated just now
          </div>
        </div>

        {/* Pending Payouts */}
        <div
          className="vd-card flex flex-col"
          style={{ padding: "20px 22px", gap: "12px" }}
        >
          <span className="text-[10px] text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            Pending Payouts
          </span>
          <h4 className="text-xl font-bold text-amber-400">$8,450</h4>
          <div>
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white-05 mb-1">
              <div
                className="h-full rounded-full"
                style={{
                  width: "65%",
                  background: "#f59e0b",
                  boxShadow: "0 0 8px #f59e0b55",
                }}
              />
            </div>
            <div className="text-[9px] text-muted">
              65% awaiting disbursement
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div
          className="vd-card flex flex-col"
          style={{ padding: "20px 22px", gap: "12px" }}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              Success Rate
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
              +1.2%
            </span>
          </div>
          <h4 className="text-xl font-bold">98.2%</h4>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-3.5 flex-1 rounded-sm"
                style={{
                  background:
                    i < 9 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.05)",
                  boxShadow: i < 9 ? "0 0 4px rgba(16,185,129,0.2)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Active Billing */}
        <div
          className="vd-card flex flex-col"
          style={{ padding: "20px 22px", gap: "12px" }}
        >
          <span className="text-[10px] text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            Active Billing
          </span>
          <h4 className="text-xl font-bold">{stats.subscriptions.toLocaleString()}</h4>
          <div className="text-[9px] text-blue-400">
            tenants currently billed
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-dashboard gap-4">
        {/* Revenue Streams card */}
        <div className="vd-card" style={{ padding: "24px" }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-sm font-bold">Revenue Streams</h3>
            </div>
            <button className="icon-btn p-1 text-slate-600 hover:text-white">
              <MoreVertical size={15} />
            </button>
          </div>

          {/* Stream items — each with top bar like alerts */}
          <div className="flex flex-col gap-3 mb-6">
            {FEE_DISTRIBUTION.map((item) => (
              <div
                key={item.name}
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
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: item.color,
                          boxShadow: `0 0 6px ${item.color}`,
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
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ${item.value.toLocaleString()}
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
                        width: `${(item.value / max) * 100}%`,
                        height: "100%",
                        borderRadius: "4px",
                        background: item.color,
                        boxShadow: `0 0 8px ${item.color}55`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  {/* pct label */}
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

          {/* Bar chart */}
          <div style={{ height: "120px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FEE_DISTRIBUTION}
                barSize={32}
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
                    borderRadius: "12px",
                    fontSize: 11,
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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
          {/* Toolbar */}
          <div
            className="flex justify-between items-center border-b border-white-05 bg-slate-950/20"
            style={{ padding: "16px 24px" }}
          >
            <h3 className="text-sm font-bold">Recent Transactions</h3>
            <button
              className="icon-btn text-xs border border-white-05 flex items-center gap-1.5"
              style={{ padding: "6px 12px" }}
            >
              <Filter size={12} /> Filter
            </button>
          </div>

          {/* Scrollable wrapper */}
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
                    { label: "Fee (5%)", w: "13%" },
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
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-muted">No recent events synced yet</td></tr>
                ) : recentEvents.map((tx, idx) => {
                  const isLast = idx === recentEvents.length - 1;
                  const isPayment = tx.eventType.includes('payment') || tx.eventType.includes('checkout');
                  const status = tx.eventType.includes('failed') ? "Failed" : isPayment ? "Completed" : "Processing";
                  const amountNum = tx.payload?.amount ? tx.payload.amount / 100 : 0;
                  const feeNum = amountNum * (parseFloat(settings?.platformFeePct || "5") / 100);
                  const amountStr = amountNum ? `$${amountNum.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-';
                  const feeStr = amountNum ? `$${feeNum.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-';

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
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: sc.color,
                              boxShadow: `0 0 6px ${sc.color}`,
                            }}
                          />
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

                      {/* Amount */}
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#f1f5f9",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {amountStr}
                      </td>

                      {/* Fee */}
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#10b981",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {feeStr}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px" }}>
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

                      {/* Date */}
                      <td
                        style={{
                          padding: "16px 24px 16px 16px",
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
              Showing 5 transactions
            </span>
            <span className="text-[10px] text-purple-400 font-bold cursor-pointer hover:underline">
              View all →
            </span>
          </div>
        </div>
      </div>
      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="vd-card w-full max-w-md p-8 border border-white-05 bg-slate-900 shadow-2xl relative overflow-hidden">
             {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Platform Economics</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-muted mb-8 leading-relaxed">
              Adjust the global platform fee charged on every organization transaction. 
              Changes are applied immediately to all future billing cycles.
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Standard Platform Fee (%)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-950/50 border border-white-05 rounded-xl px-4 py-3 flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1"
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="bg-transparent border-none outline-none text-white w-full font-bold"
                    />
                    <span className="text-slate-600 font-bold">%</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-4 flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <Check size={12} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-emerald-400 mb-0.5">Estimated Revenue Impact</h4>
                  <p className="text-[10px] text-emerald-400/60">
                    Based on current volume, a {newFee}% fee will generate approx. ${(parseFloat(newFee) * 5000).toLocaleString()} next month.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleUpdateRates}
                disabled={loading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                CONFIRM NEW RATES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformRevenue;

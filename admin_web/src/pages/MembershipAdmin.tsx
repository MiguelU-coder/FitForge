import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Mail,
  Bell,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  DollarSign,
  Filter,
  Download,
  ArrowUpRight,
  Layers,
  Activity,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MOCK_MEMBERSHIPS = [
  {
    id: "1",
    gym: "Iron Temple Gym",
    plan: "Enterprise",
    expiry: "2024-04-15",
    status: "Active",
    price: "$299",
  },
  {
    id: "2",
    gym: "FitForge Central",
    plan: "Gold",
    expiry: "2024-03-25",
    status: "Expiring soon",
    price: "$149",
  },
  {
    id: "3",
    gym: "Zenith Yoga Studio",
    plan: "Basic",
    expiry: "2024-03-20",
    status: "Expiring soon",
    price: "$49",
  },
  {
    id: "4",
    gym: "Elite Performance Hub",
    plan: "Enterprise",
    expiry: "2025-01-10",
    status: "Active",
    price: "$299",
  },
  {
    id: "5",
    gym: "Velocity CrossFit",
    plan: "Gold",
    expiry: "2024-06-05",
    status: "Active",
    price: "$149",
  },
];

const revenueData = [
  { month: "Jan", enterprise: 4200, gold: 1800 },
  { month: "Feb", enterprise: 4800, gold: 2100 },
  { month: "Mar", enterprise: 5100, gold: 2400 },
  { month: "Apr", enterprise: 5900, gold: 2800 },
  { month: "May", enterprise: 6400, gold: 3100 },
  { month: "Jun", enterprise: 7100, gold: 3500 },
];

const MembershipAdmin: React.FC<{ session?: any }> = () => {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Membership Center</h1>
          <p className="text-xs text-muted">
            Metric oversight & tenant billing operations.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn text-xs border border-white-05 px-3">
            Export CSV <ChevronDown size={14} />
          </button>
          <button 
            onClick={() => navigate("/billing/plans")}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md flex items-center gap-1"
          >
            <CreditCard size={14} /> Configure Plans
          </button>
        </div>
      </header>

      <div className="grid-cols-stats mb-6">
        <CompactStatCard title="Total Gyms" value="1.2k" trend="+14.2%" up />
        <CompactStatCard title="Active Plans" value="1.1k" trend="+8.1%" up />
        <CompactStatCard title="Enterprise" value="184" trend="+12.5%" up />
        <CompactStatCard
          title="Renewal Rate"
          value="94.8%"
          trend="-1.2%"
          up={false}
        />
      </div>

      <div className="grid grid-cols-dashboard gap-4 mb-4">
        <div className="vd-card bg-slate-950/40">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              Platform Revenue
            </span>
            <div className="flex gap-3 text-[10px] items-center">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Enterprise
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Gold
              </span>
              <button className="icon-btn text-[10px] bg-slate-800/50 px-2 py-1 flex gap-1">
                Jan–Jun 2024 <ChevronDown size={12} />
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-2xl font-bold">$450.8K</h2>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
              +12.5%
            </span>
            <span className="text-[10px] text-muted ml-1">Projected Q2</span>
          </div>
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="mgEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mgGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ fontSize: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="enterprise"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#mgEnt)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#8b5cf6" }}
                />
                <Area
                  type="monotone"
                  dataKey="gold"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#mgGold)"
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#3b82f6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="vd-card flex-1"
            style={{
              background:
                "linear-gradient(135deg,rgba(139,92,246,0.12) 0%,rgba(59,130,246,0.08) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-muted">
                <DollarSign size={12} className="inline mr-1" />
                Next Month MRR
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight size={10} />
                +8.2%
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">$45,210.00</h3>
            <div style={{ height: "60px" }} className="flex items-end gap-1">
              {[5, 7, 6, 8, 7, 9, 8, 6, 9, 8, 7, 9].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
                  style={{
                    height: `${h * 10}%`,
                    background: "linear-gradient(to top,#8b5cf6,#3b82f6)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
              <span className="text-muted">Total Assets: $1.2M</span>
              <button className="text-blue-400 hover:underline flex items-center gap-1">
                View <ExternalLink size={10} />
              </button>
            </div>
          </div>

          <div className="vd-card flex-1">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-muted">
                <AlertCircle size={12} className="inline mr-1" />
                Expiring Soon
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                At risk
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-xl font-bold">42</h3>
              <span className="text-[10px] text-amber-400">gyms</span>
            </div>
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white-05">
              <div
                className="h-full rounded-full"
                style={{
                  width: "42%",
                  background: "#f59e0b",
                  boxShadow: "0 0 8px #f59e0b66",
                }}
              />
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
              <span className="text-muted">Next 30 days</span>
              <button className="text-blue-400 hover:underline">
                Notify all
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 my-4">
        <h3 className="text-sm font-bold whitespace-nowrap">
          Tenant Directory
        </h3>
        <div className="h-px bg-white-05 flex-1" />
        <button className="icon-btn text-xs border border-white-05 px-3 py-1 flex items-center gap-1">
          <Filter size={12} /> Filter
        </button>
        <button className="icon-btn text-xs border border-white-05 px-3 py-1 flex items-center gap-1">
          <Download size={12} /> Report
        </button>
      </div>

      <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Gym / Entity</th>
              <th>Plan</th>
              <th>Expiry</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MEMBERSHIPS.map((m) => {
              const exp = m.status.includes("Expiring");
              return (
                <tr
                  key={m.id}
                  className="border-b border-white-05 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-white-05 flex items-center justify-center text-xs font-black text-slate-400">
                        {m.gym.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">
                          {m.gym}
                        </div>
                        <div className="text-[9px] text-muted">
                          TENANT-{m.id.padStart(4, "0")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        color:
                          m.plan === "Enterprise"
                            ? "#3b82f6"
                            : m.plan === "Gold"
                              ? "#f59e0b"
                              : "#94a3b8",
                        background:
                          m.plan === "Enterprise"
                            ? "rgba(59,130,246,0.1)"
                            : m.plan === "Gold"
                              ? "rgba(245,158,11,0.1)"
                              : "rgba(255,255,255,0.05)",
                      }}
                    >
                      {m.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs flex items-center gap-1 ${exp ? "text-amber-400" : "text-slate-400"}`}
                    >
                      {exp && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      )}
                      {m.expiry}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-bold text-white">
                      {m.price}
                      <span className="text-muted font-normal">/mo</span>
                    </div>
                    <div className="text-[9px] text-emerald-400">
                      Active billing
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`status-badge text-[9px] px-2 py-0.5 ${exp ? "status-pending" : "status-paid"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn p-1.5 text-slate-600 hover:text-white">
                        <Mail size={13} />
                      </button>
                      <button className="icon-btn p-1.5 text-slate-600 hover:text-amber-400">
                        <Bell size={13} />
                      </button>
                      <button className="icon-btn p-1.5 text-slate-600 hover:text-white">
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
    </div>
  );
};

const CompactStatCard = ({ title, value, trend, up }: any) => (
  <div className="vd-card flex flex-col justify-between py-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-muted flex items-center gap-1">
        <div className="w-1 h-1 rounded-full bg-purple-400" />
        {title}
      </span>
      <button className="icon-btn p-0">
        <MoreVertical size={14} />
      </button>
    </div>
    <div className="flex items-baseline gap-3">
      <h4 className="text-lg font-bold">{value}</h4>
      <span
        className={`text-[10px] font-bold px-1 py-0.5 rounded ${up ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}
      >
        {trend}
      </span>
    </div>
  </div>
);

export default MembershipAdmin;

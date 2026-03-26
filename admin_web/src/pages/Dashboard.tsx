import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  Plus,
  ChevronDown
} from 'lucide-react';
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
  BarChart,
  Bar
} from 'recharts';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

// --- Improved Mock Data ---

const deviceData = [
  { name: 'Desktop users', value: 18624, color: '#8b5cf6' },
  { name: 'Phone/app users', value: 3348, color: '#3b82f6' },
  { name: 'Tablet users', value: 2418, color: '#10b981' },
];

const Dashboard: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const userName = profile?.displayName || 'Admin';

  const [stats, setStats] = useState({ monthlyUsers: 0, newSignups: 0, subscriptions: 0, mrr: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        
        const [statsRes, chartRes, eventsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/stats/dashboard`, { headers }),
          axios.get(`${API_URL}/admin/stats/revenue-chart`, { headers }),
          axios.get(`${API_URL}/admin/events/recent?limit=6`, { headers })
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (chartRes.data.success) setRevenueData(chartRes.data.data);
        if (eventsRes.data.success) setRecentEvents(eventsRes.data.data);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    if (session?.access_token) {
      fetchDashboardData();
    }
  }, [session]);

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {userName.split(' ')[0]}</h1>
          <p className="text-xs text-muted">Measure your advertising ROI and sport website traffic.</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn text-xs border border-white-05 px-3">
            Export PDF <ChevronDown size={14} />
          </button>
          <button className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md">
            Create report
          </button>
        </div>
      </header>

      {/* Top Stats Grid */}
      <div className="grid-cols-stats mb-6">
        <CompactStatCard title="MRR (Est.)" value={`$${(stats.mrr).toLocaleString()}`} trend="+12.5%" trendUp />
        <CompactStatCard title="Total users" value={`${stats.monthlyUsers.toLocaleString()}`} trend="+5.2%" trendUp />
        <CompactStatCard title="New sign ups (30d)" value={`${stats.newSignups.toLocaleString()}`} trend="+8.2%" trendUp />
        <CompactStatCard title="Active Subscriptions" value={`${stats.subscriptions.toLocaleString()}`} trend="+15.0%" trendUp />
      </div>

      {/* Main Charts Row */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-dashboard gap-4">
          <div className="vd-card bg-slate-950/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-widest text-muted">Total Revenue</span>
              <div className="flex gap-4 text-[10px] items-center">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Revenue</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Expenses</span>
                <button className="icon-btn text-[10px] bg-slate-800/50 px-2 py-1 flex gap-1">
                  Jan 2024 - Dec 2024 <ChevronDown size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-2xl font-bold">$240.8K</h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+12.5%</span>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    fill="url(#purpleGradient)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fill="url(#blueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="vd-card flex-1 min-h-[160px]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-muted"><TrendingUp size={12} className="inline mr-1" /> Total profit</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+27.5%</span>
              </div>
              <h3 className="text-xl font-bold mb-2">$144.6K</h3>
              <div style={{ height: '60px' }} className="flex items-end gap-1">
                {[4, 7, 5, 8, 6, 9, 7, 5, 8, 9, 6].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm opacity-60 hover:opacity-100 transition-opacity" style={{ height: `${h * 10}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
                <span className="text-muted">Last 12 months</span>
                <button className="text-blue-400 hover:underline">View report</button>
              </div>
            </div>
            
            <div className="vd-card flex-1 min-h-[160px]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-muted"><Activity size={12} className="inline mr-1" /> Total sessions</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+16.8%</span>
              </div>
              <h3 className="text-xl font-bold mb-2">400</h3>
              <div style={{ height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData.slice(-6)}>
                    <Area type="step" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf622" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
                <span className="text-muted">1.2M hits/day</span>
                <button className="text-blue-400 hover:underline">View report</button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Overview Separator */}
        <div className="flex items-center gap-4 my-2">
          <h3 className="text-lg font-bold whitespace-nowrap">Reports overview</h3>
          <div className="h-px bg-white-05 flex-1" />
          <button className="icon-btn text-xs border border-white-05 px-3 py-1">
            Current year <ChevronDown size={14} />
          </button>
          <button className="btn-primary py-1 px-3 text-xs bg-purple-600 rounded-md">
            Create report
          </button>
        </div>

        <div className="grid grid-cols-dashboard gap-4">
          <div className="vd-card" style={{ minHeight: '400px' }}>
            <div className="flex justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-bold">Users by device</h3>
              </div>
              <button className="icon-btn"><MoreVertical size={16} /></button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={95}
                      cornerRadius={10}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-50 left-50 translate-middle text-center">
                  <span className="block text-3xl font-extrabold">23,648</span>
                  <span className="text-[10px] text-muted tracking-widest uppercase mt-1">Users by device</span>
                </div>
              </div>
              <div className="w-full mt-8 flex flex-col gap-3">
                {deviceData.map(d => (
                  <div key={d.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 text-muted">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="vd-card">
            <div className="flex justify-between mb-6">
              <h3 className="text-sm font-bold">Recent Activity</h3>
              <button className="icon-btn text-[10px] bg-slate-800/50 px-2 py-1 flex gap-1 items-center">
                Last 30 days <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {recentEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 border-b border-white-05 pb-4 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{event.eventType}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.user?.displayName || event.userId}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        <div className="vd-card">
          <div className="grid grid-cols-dashboard gap-8">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-sm font-bold">Users by country</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">12.4K</span>
              </div>
              <button className="icon-btn text-[10px] mb-6 flex gap-1 items-center border border-white-05 px-2 py-0.5">
                Event <ChevronDown size={12} />
              </button>
              <div className="flex flex-col gap-5">
                <CountryProgress name="United States" val="70%" color="#3b82f6" flag="US" />
                <CountryProgress name="United Kingdom" val="20%" color="#8b5cf6" flag="GB" />
                <CountryProgress name="Germany" val="15%" color="#10b981" flag="DE" />
                <CountryProgress name="Australia" val="12%" color="#f59e0b" flag="AU" />
                <CountryProgress name="Spain" val="10%" color="#6366f1" flag="ES" />
              </div>
            </div>
            <div className="relative flex justify-center items-center" style={{ minHeight: '300px' }}>
              {/* High-Fidelity World Map SVG Path */}
              <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 text-slate-400">
                <path fill="currentColor" d="M163,161 L167,161 L167,164 L170,164 L170,167 L163,167 Z M194,158 L197,158 L197,161 L200,161 L200,164 L194,164 Z M220,150 L226,150 L226,154 L229,154 L229,158 L223,158 L223,154 L220,154 Z M244,142 L250,142 L250,146 L244,146 Z M264,138 L270,138 L270,142 L264,142 Z M294,134 L300,134 L300,138 L294,138 Z M320,131 L326,131 L326,135 L320,135 Z M344,129 L350,129 L350,133 L344,133 Z M170,195 L176,195 L176,199 L170,199 Z M210,190 L216,190 L216,194 L210,194 Z M250,185 L256,185 L256,189 L250,189 Z M330,175 L336,175 L336,179 L330,179 Z M380,165 L386,165 L386,169 L380,169 Z M440,155 L446,155 L446,159 L440,159 Z M500,145 L506,145 L506,149 L500,149 Z M580,135 L586,135 L586,139 L580,139 Z M650,125 L656,125 L656,129 L650,129 Z M720,120 L726,120 L726,124 L720,124 Z M800,115 L806,115 L806,119 L800,119 Z M880,110 L886,110 L886,114 L880,114 Z M180,250 L186,250 L186,254 L180,254 Z M240,245 L246,245 L246,249 L240,249 Z M300,240 L306,240 L306,244 L300,244 Z M400,230 L406,230 L406,234 L400,234 Z M500,225 L506,225 L506,229 L500,229 Z M600,220 L606,220 L606,224 L600,224 Z M700,215 L706,215 L706,219 L700,219 Z M820,205 L826,205 L826,209 L820,209 Z M900,200 L906,200 L906,204 L900,204 Z M200,320 L206,320 L206,324 L200,324 Z M280,315 L286,315 L286,319 L280,319 Z M380,305 L386,305 L386,309 L380,309 Z M480,295 L486,295 L486,299 L480,299 Z M600,280 L606,280 L606,284 L600,284 Z M720,265 L726,265 L726,269 L720,269 Z M850,250 L856,250 L856,254 L850,254 Z M250,400 L256,400 L256,404 L250,404 Z M350,390 L356,390 L356,394 L350,394 Z M450,380 L456,380 L456,384 L450,384 Z M550,370 L556,370 L556,374 L550,374 Z M680,350 L686,350 L686,354 L680,354 Z M800,330 L806,330 L806,334 L800,334 Z" />
                {/* Active Hotspots */}
                <circle cx="280" cy="180" r="4" fill="#8b5cf6" className="animate-pulse" />
                <circle cx="280" cy="180" r="12" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.3" className="animate-ping" />
                
                <circle cx="480" cy="140" r="3" fill="#3b82f6" />
                <circle cx="620" cy="220" r="4" fill="#10b981" />
                <circle cx="820" cy="180" r="3" fill="#f59e0b" />
                <circle cx="200" cy="350" r="3" fill="#6366f1" />
              </svg>
              
              {/* Refined Tooltip-style Highlight */}
              <div className="absolute right-[15%] bottom-[20%] animate-fade-in">
                  <div className="flex items-center gap-4 p-4 border border-blue-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl rounded-xl">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-blue-500/50 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-white tracking-tight">1.25 K</span>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Global Users</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const CompactStatCard: React.FC<{ title: string; value: string; trend: string; trendUp: boolean }> = ({ title, value, trend, trendUp }) => (
  <div className="vd-card flex flex-col justify-between py-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-muted flex items-center gap-1">
        <div className="w-1 h-1 rounded-full bg-blue-400" /> {title}
      </span>
      <button className="icon-btn p-0"><MoreVertical size={14} /></button>
    </div>
    <div className="flex items-baseline gap-3">
      <h4 className="text-lg font-bold">{value}</h4>
      <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${trendUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const CountryProgress: React.FC<{ name: string; val: string; color: string; flag: string }> = ({ name, val, color, flag }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center text-[10px] font-bold">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black border border-white-05">
          {flag}
        </div>
        <span className="text-slate-300">{name}</span>
      </div>
      <span className="text-white">{val}</span>
    </div>
    <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white-05">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: val, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
    </div>
  </div>
);

const OrderRow: React.FC<{ id: string; date: string; status: string; amount: string }> = ({ id, date, status, amount }) => (
  <tr className="border-b border-white-05 last:border-0">
    <td className="py-3 text-xs flex items-center gap-2">
      <div className="w-2 h-2 rounded-sm bg-purple-500" /> #{id}
    </td>
    <td className="py-3 text-[10px] text-muted">{date}</td>
    <td className="py-3">
      <span className={`status-badge text-[9px] px-2 py-0.5 ${status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
        {status}
      </span>
    </td>
    <td className="py-3 text-xs font-bold">{amount}</td>
  </tr>
);

export default Dashboard;

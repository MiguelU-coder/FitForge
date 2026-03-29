import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  DollarSign,
  Dumbbell,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronDown,
  Activity,
  UserPlus,
  Target,
  Clock,
  RefreshCw,
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
} from 'recharts';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const COLORS = {
  primary: '#8b5cf6',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  purple: '#a855f7',
  blue: '#60a5fa',
};

const mockChartData = [
  { name: 'Ene', members: 45, revenue: 2250 },
  { name: 'Feb', members: 52, revenue: 2600 },
  { name: 'Mar', members: 58, revenue: 2900 },
  { name: 'Abr', members: 65, revenue: 3250 },
  { name: 'May', members: 72, revenue: 3600 },
  { name: 'Jun', members: 85, revenue: 4250 },
];

const mockActivity = [
  { id: '1', eventType: 'Nuevo miembro', createdAt: new Date().toISOString(), userId: 'user1' },
  { id: '2', eventType: 'Pago completado', createdAt: new Date().toISOString(), userId: 'user2' },
  { id: '3', eventType: 'Rutina asignada', createdAt: new Date().toISOString(), userId: 'user3' },
];

const deviceData = [
  { name: 'Miembros activos', value: 18624, color: '#8b5cf6' },
  { name: 'Nuevos este mes', value: 3348, color: '#3b82f6' },
  { name: 'Inactivos', value: 2418, color: '#10b981' },
];

const OrganizationDashboard: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [membershipDistribution, setMembershipDistribution] = useState<any[]>([]);

  const organizationId = profile?.organizations?.[0]?.id;
  const userName = profile?.displayName || 'Administrador';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${session?.access_token}` };

        const [dashboardRes, membersRes, routinesRes] = await Promise.all([
          axios.get(`${API_URL}/organizations/${organizationId}/dashboard`, { headers }),
          axios.get(`${API_URL}/organizations/${organizationId}/members`, { headers }),
          axios.get(`${API_URL}/organizations/${organizationId}/routines`, { headers }),
        ]);

        if (dashboardRes.data.success) {
          const data = dashboardRes.data.data;
          setStats(data.stats);
          setRevenueChart(data.revenueChart?.length > 0 ? data.revenueChart : mockChartData);
          setRecentActivity(data.recentActivity?.length > 0 ? data.recentActivity : mockActivity);
          setMembershipDistribution(data.membershipDistribution);
        }

        if (membersRes.data.success) {
          setMembers(membersRes.data.data?.members || []);
        }

        if (routinesRes.data.success) {
          setRoutines(Array.isArray(routinesRes.data.data) ? routinesRes.data.data : []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setStats({
          activeMembers: 85,
          totalMembers: 92,
          newSignups: 12,
          monthlyRevenue: 4250,
          retentionRate: 92,
          routinesCount: 15,
          exercisesCount: 120,
        });
        setRevenueChart(mockChartData);
        setRecentActivity(mockActivity);
        setMembershipDistribution([
          { name: 'CLIENT', value: 75 },
          { name: 'TRAINER', value: 12 },
          { name: 'ORG_ADMIN', value: 5 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && organizationId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [session, organizationId]);

  if (loading) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: '2rem' }}>
        <div className="flex items-center justify-center" style={{ height: '50vh' }}>
          <RefreshCw className="animate-spin text-purple-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bienvenido, {userName.split(' ')[0]}</h1>
          <p className="text-xs text-muted">Resumen del rendimiento de tu gimnasio y métricas clave.</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn text-xs border border-white-05 px-3">
            Exportar PDF <ChevronDown size={14} />
          </button>
          <button
            onClick={() => navigate('/members/add')}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md"
          >
            <UserPlus size={14} className="inline mr-1" /> Agregar Miembro
          </button>
        </div>
      </header>

      {/* Top Stats Grid */}
      <div className="grid-cols-stats mb-6">
        <CompactStatCard title="Miembros Activos" value={stats?.activeMembers || 0} trend="+8.2%" trendUp />
        <CompactStatCard title="Nuevos (30d)" value={stats?.newSignups || 0} trend="+12.5%" trendUp />
        <CompactStatCard title="Ingresos MRR" value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`} trend="+15.3%" trendUp />
        <CompactStatCard title="Retención" value={`${stats?.retentionRate || 0}%`} trend="+2.1%" trendUp />
      </div>

      {/* Main Charts Row */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-dashboard gap-4">
          {/* Revenue Chart */}
          <div className="vd-card bg-slate-950/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-widest text-muted">
                <TrendingUp size={12} className="inline mr-1" /> Crecimiento de Miembros
              </span>
              <div className="flex gap-4 text-[10px] items-center">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Miembros
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Ingresos
                </span>
                <button className="icon-btn text-[10px] bg-slate-800/50 px-2 py-1 flex gap-1">
                  Ene - Dic 2024 <ChevronDown size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-2xl font-bold">{stats?.totalMembers || 0}</h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+{(stats?.newSignups || 0)} este mes</span>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="purpleGradientOrg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="emeraldGradientOrg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2} fill="url(#purpleGradientOrg)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#emeraldGradientOrg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Stats */}
          <div className="flex flex-col gap-4">
            <div className="vd-card flex-1 min-h-[160px]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-muted">
                  <Dumbbell size={12} className="inline mr-1" /> Rutinas Activas
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+3 nuevas</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{stats?.routinesCount || 0}</h3>
              <div style={{ height: '60px' }} className="flex items-end gap-1">
                {[4, 7, 5, 8, 6, 9, 7, 5, 8, 9, 6].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-purple-500 rounded-sm opacity-60 hover:opacity-100 transition-opacity" style={{ height: `${h * 10}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
                <span className="text-muted">{stats?.exercisesCount || 0} ejercicios</span>
                <button onClick={() => navigate('/routines')} className="text-purple-400 hover:underline">Ver rutinas</button>
              </div>
            </div>

            <div className="vd-card flex-1 min-h-[160px]">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-muted">
                  <Activity size={12} className="inline mr-1" /> Retención
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+2.1%</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{stats?.retentionRate || 0}%</h3>
              <div style={{ height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart.slice(-6)}>
                    <Area type="step" dataKey="members" stroke="#8b5cf6" fill="#8b5cf622" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white-05 text-[10px]">
                <span className="text-muted">Tasa de permanencia</span>
                <button onClick={() => navigate('/members')} className="text-purple-400 hover:underline">Ver miembros</button>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 my-2">
          <h3 className="text-lg font-bold whitespace-nowrap">Resumen General</h3>
          <div className="h-px bg-white-05 flex-1" />
          <button className="icon-btn text-xs border border-white-05 px-3 py-1">
            Este mes <ChevronDown size={14} />
          </button>
        </div>

        <div className="grid grid-cols-dashboard gap-4">
          {/* Members by Status */}
          <div className="vd-card" style={{ minHeight: '400px' }}>
            <div className="flex justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-bold">Estado de Miembros</h3>
              </div>
              <button className="icon-btn"><MoreVertical size={16} /></button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={membershipDistribution.map((d, i) => ({ ...d, color: [COLORS.primary, COLORS.success, COLORS.warning][i % 3] }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={95}
                      cornerRadius={10}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {membershipDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.success, COLORS.warning][index % 3]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-50 left-50 translate-middle text-center">
                  <span className="block text-3xl font-extrabold">{stats?.activeMembers || 0}</span>
                  <span className="text-[10px] text-muted tracking-widest uppercase mt-1">Activos</span>
                </div>
              </div>
              <div className="w-full mt-8 flex flex-col gap-3">
                {membershipDistribution.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 text-muted">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [COLORS.primary, COLORS.success, COLORS.warning][index % 3] }} />
                      {item.name === 'CLIENT' ? 'Clientes' : item.name === 'TRAINER' ? 'Entrenadores' : 'Admins'}
                    </span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="vd-card">
            <div className="flex justify-between mb-6">
              <h3 className="text-sm font-bold">Actividad Reciente</h3>
              <button className="icon-btn text-[10px] bg-slate-800/50 px-2 py-1 flex gap-1 items-center">
                Últimas 24h <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {(recentActivity || []).slice(0, 5).map(event => (
                <div key={event.id} className="flex items-start gap-3 border-b border-white-05 pb-4 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{event.eventType}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.userId}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">Sin actividad reciente</div>
              )}
            </div>
          </div>
        </div>

        {/* Members & Quick Actions */}
        <div className="vd-card">
          <div className="grid grid-cols-dashboard gap-8">
            {/* Recent Members */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-bold">Miembros Recientes</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{(members || []).length} total</span>
              </div>
              <div className="flex flex-col gap-4">
                {(members || []).slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 border-b border-white-05 pb-3 last:border-0 last:pb-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-500/20 to-emerald-500/20"
                      style={{ color: COLORS.primary }}
                    >
                      {(member.displayName?.[0] || member.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{member.displayName || 'Sin nombre'}</p>
                      <p className="text-[10px] text-muted truncate">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: member.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: `1px solid ${member.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          color: member.status === 'active' ? COLORS.success : COLORS.danger,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            minWidth: '6px',
                            borderRadius: '50%',
                            background: member.status === 'active' ? COLORS.success : COLORS.danger,
                            boxShadow: `0 0 6px ${member.status === 'active' ? COLORS.success : COLORS.danger}`,
                          }}
                        />
                        {member.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <div className="text-center py-6 text-muted">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No hay miembros registrados</p>
                    <button onClick={() => navigate('/members/add')} className="text-[10px] text-purple-400 hover:underline mt-1">
                      Agregar el primero →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <h3 className="text-sm font-bold">Acciones Rápidas</h3>
              </div>
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px' 
                }}
              >
                <QuickActionButton
                  icon={<UserPlus size={16} />}
                  label="Agregar Miembro"
                  description="Nuevo registro"
                  color={COLORS.primary}
                  onClick={() => navigate('/members/add')}
                />
                <QuickActionButton
                  icon={<Dumbbell size={16} />}
                  label="Crear Rutina"
                  description="Diseñar entrenamiento"
                  color={COLORS.success}
                  onClick={() => navigate('/routines?create=true')}
                />
                <QuickActionButton
                  icon={<Calendar size={16} />}
                  label="Programar Clase"
                  description="Agendar sesión"
                  color={COLORS.warning}
                  onClick={() => navigate('/classes/schedule')}
                />
                <QuickActionButton
                  icon={<CreditCard size={16} />}
                  label="Ver Pagos"
                  description="Historial completo"
                  color={COLORS.blue}
                  onClick={() => navigate('/payments')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Routines Overview */}
        <div className="vd-card">
          <div className="flex justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-sm font-bold">Rutinas Populares</h3>
            </div>
            <button className="icon-btn text-[10px] mb-6 flex gap-1 items-center border border-white-05 px-2 py-0.5">
              Todas <ChevronDown size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {routines.slice(0, 6).map((routine, index) => (
              <div key={routine.id} className="p-3 rounded-lg bg-slate-900/50 border border-white-05 hover:border-purple-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))` }}
                  >
                    <Dumbbell size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{routine.name}</p>
                    <p className="text-[10px] text-muted">{routine.workoutsCount || 0} entrenamientos</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {routine.duration || 'Sin duración'}
                  </span>
                  <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
                </div>
              </div>
            ))}
            {routines.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted">
                <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay rutinas creadas</p>
                <button onClick={() => navigate('/routines?create=true')} className="text-xs text-purple-400 hover:underline mt-2">
                  Crear la primera rutina →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const CompactStatCard: React.FC<{ title: string; value: string | number; trend: string; trendUp: boolean }> = ({ title, value, trend, trendUp }) => (
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

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  description?: string;
  onClick: () => void;
}> = ({ icon, label, color, description, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '14px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: isHovered ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.06)',
        background: isHovered ? `${color}08` : 'rgba(255,255,255,0.015)',
        boxShadow: isHovered ? `0 4px 20px ${color}15` : 'none',
      }}
    >
      <span
        style={{
          width: '36px',
          height: '36px',
          minWidth: '36px',
          borderRadius: '9px',
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          boxShadow: isHovered ? `0 0 12px ${color}30` : 'none',
          transition: 'all 0.2s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {icon}
      </span>
      <div style={{ textAlign: 'left' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: isHovered ? color : '#e2e8f0',
          transition: 'color 0.2s',
          display: 'block',
        }}>
          {label}
        </span>
        {description && (
          <span style={{
            fontSize: '10px',
            color: '#475569',
            marginTop: '2px',
            display: 'block',
          }}>
            {description}
          </span>
        )}
      </div>
    </button>
  );
};

export default OrganizationDashboard;

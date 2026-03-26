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
  Plus,
  ChevronDown,
  Activity,
  UserPlus,
  Target,
  Zap,
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
  BarChart,
  Bar,
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

// Mock data for demo/fallback
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

const OrganizationDashboard: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [membershipDistribution, setMembershipDistribution] = useState<any[]>([]);

  // Get organizationId from profile (organizations array)
  const organizationId = profile?.organizations?.[0]?.id;

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
          setMembers(membersRes.data.data);
        }

        if (routinesRes.data.success) {
          setRoutines(routinesRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Use mock data on error
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
          <h1 className="text-2xl font-bold mb-1">Dashboard del Gimnasio</h1>
          <p className="text-xs text-muted">
            Bienvenido, {profile?.displayName || 'Administrador'}. Aquí tienes el resumen de tu negocio.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn text-xs border border-white-05 px-3">
            Exportar PDF <ChevronDown size={14} />
          </button>
          <button
            onClick={() => navigate('/members/add')}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
          >
            <UserPlus size={14} /> Agregar Miembro
          </button>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <div className="grid-cols-stats mb-6">
        <MetricCard
          icon={<Users size={16} />}
          title="Miembros Activos"
          value={stats?.activeMembers || 0}
          trend="+8.2%"
          trendUp
          color={COLORS.success}
          subtitle="Pagando actualmente"
        />
        <MetricCard
          icon={<UserPlus size={16} />}
          title="Nuevos Este Mes"
          value={stats?.newSignups || 0}
          trend="+12.5%"
          trendUp
          color={COLORS.primary}
          subtitle="Últimos 30 días"
        />
        <MetricCard
          icon={<DollarSign size={16} />}
          title="Ingresos Mensuales"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          trend="+15.3%"
          trendUp
          color={COLORS.warning}
          subtitle="MRR estimado"
        />
        <MetricCard
          icon={<Target size={16} />}
          title="Retención"
          value={`${stats?.retentionRate || 0}%`}
          trend="+2.1%"
          trendUp
          color={COLORS.blue}
          subtitle="Tasa de permanencia"
        />
      </div>

      {/* Main Content Grid */}
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
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-2xl font-bold">{stats?.totalMembers || 0}</h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                +{(stats?.newSignups || 0)} este mes
              </span>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2} fill="url(#purpleGradient)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Stats */}
          <div className="flex flex-col gap-4">
            {/* Quick Stats */}
            <div className="vd-card flex-1 min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-muted">
                  <Dumbbell size={12} className="inline mr-1" /> Rutinas Activas
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+3 nuevas</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats?.routinesCount || 0}</h3>
              <p className="text-[10px] text-muted mb-3">{stats?.exercisesCount || 0} ejercicios disponibles</p>
              <div className="flex justify-between mt-2 pt-2 border-t border-white-05">
                <span className="text-[10px] text-muted">Ver todas</span>
                <button onClick={() => navigate('/routines')} className="text-[10px] text-purple-400 hover:underline">
                  Gestionar →
                </button>
              </div>
            </div>

            {/* Membership Distribution */}
            <div className="vd-card flex-1 min-h-[140px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-muted">
                  <Activity size={12} className="inline mr-1" /> Distribución
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div style={{ width: 80, height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {membershipDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.success, COLORS.warning][index % 3]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  {membershipDistribution.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-muted flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: [COLORS.primary, COLORS.success, COLORS.warning][index % 3] }}
                        />
                        {item.name === 'CLIENT' ? 'Clientes' : item.name === 'TRAINER' ? 'Entrenadores' : 'Admins'}
                      </span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Members */}
        <div className="grid grid-cols-dashboard gap-4">
          {/* Recent Members */}
          <div className="vd-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Miembros Recientes</h3>
              <button onClick={() => navigate('/members')} className="text-[10px] text-purple-400 hover:underline">
                Ver todos →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3 border-b border-white-05 pb-3 last:border-0 last:pb-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'rgba(139, 92, 246, 0.15)', color: COLORS.primary }}
                  >
                    {(member.displayName?.[0] || member.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{member.displayName || 'Sin nombre'}</p>
                    <p className="text-[10px] text-muted truncate">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        background: member.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: member.status === 'active' ? COLORS.success : COLORS.danger,
                      }}
                    >
                      {member.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
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

          {/* Quick Actions & Activity */}
          <div className="flex flex-col gap-4">
            {/* Quick Actions */}
            <div className="vd-card">
              <h3 className="text-sm font-bold mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <QuickActionButton
                  icon={<UserPlus size={16} />}
                  label="Agregar Miembro"
                  color={COLORS.primary}
                  onClick={() => navigate('/members/add')}
                />
                <QuickActionButton
                  icon={<Dumbbell size={16} />}
                  label="Crear Rutina"
                  color={COLORS.success}
                  onClick={() => navigate('/routines/create')}
                />
                <QuickActionButton
                  icon={<Calendar size={16} />}
                  label="Programar Clase"
                  color={COLORS.warning}
                  onClick={() => navigate('/classes/schedule')}
                />
                <QuickActionButton
                  icon={<CreditCard size={16} />}
                  label="Ver Pagos"
                  color={COLORS.blue}
                  onClick={() => navigate('/payments')}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="vd-card flex-1">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold">Actividad Reciente</h3>
                <span className="text-[10px] text-muted">Últimas 24h</span>
              </div>
              <div className="flex flex-col gap-2">
                {recentActivity.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-[11px]">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                    >
                      <Activity size={12} className="text-purple-400" />
                    </div>
                    <span className="flex-1 truncate">{event.eventType}</span>
                    <span className="text-muted">
                      {new Date(event.createdAt).toLocaleDateString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-xs text-muted text-center py-4">Sin actividad reciente</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Routines Overview */}
        <div className="vd-card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-sm font-bold">Rutinas Populares</h3>
            </div>
            <button onClick={() => navigate('/routines')} className="text-[10px] text-purple-400 hover:underline">
              Ver todas →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {routines.slice(0, 6).map((routine) => (
              <div key={routine.id} className="p-3 rounded-lg bg-slate-900/50 border border-white-05 hover:border-purple-500/30 transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))' }}
                  >
                    <Dumbbell size={14} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{routine.name}</p>
                    <p className="text-[10px] text-muted">{routine.workoutsCount || 0} entrenamientos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <Clock size={10} />
                  <span>{routine.duration || 'Sin duración'}</span>
                </div>
              </div>
            ))}
            {routines.length === 0 && (
              <div className="col-span-3 text-center py-6 text-muted">
                <Dumbbell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No hay rutinas creadas</p>
                <button onClick={() => navigate('/routines/create')} className="text-[10px] text-purple-400 hover:underline mt-1">
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

// Metric Card Component
const MetricCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  color: string;
  subtitle?: string;
}> = ({ icon, title, value, trend, trendUp, color, subtitle }) => (
  <div className="vd-card flex flex-col justify-between py-3" style={{ minHeight: '100px' }}>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-muted flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </span>
        {title}
      </span>
      <button className="icon-btn p-0">
        <MoreVertical size={14} />
      </button>
    </div>
    <div className="flex items-baseline gap-2">
      <h4 className="text-2xl font-bold">{value}</h4>
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${trendUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}
      >
        {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </span>
    </div>
    {subtitle && <span className="text-[10px] text-muted mt-1">{subtitle}</span>}
  </div>
);

// Quick Action Button Component
const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 p-3 rounded-lg border border-white-05 hover:border-white-10 transition-all group"
    style={{ background: 'transparent' }}
  >
    <span
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {icon}
    </span>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

export default OrganizationDashboard;
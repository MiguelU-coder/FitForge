import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Download,
  Filter,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface Payment {
  id: string;
  user: { id: string; displayName: string; email: string; avatarUrl?: string };
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

const OrganizationPayments: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    const fetchPayments = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/organizations/${organizationId}/payments`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (data.success) {
          setPayments(data.data.payments || []);
          setStats(data.data.stats || {
            totalRevenue: 0,
            thisMonthRevenue: 0,
            pendingCount: 0,
            overdueCount: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && organizationId) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [session, organizationId]);

  const filteredPayments = statusFilter
    ? payments.filter((p) => p.status === statusFilter)
    : payments;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PAID':
        return { label: 'Pagado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle };
      case 'PENDING':
        return { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock };
      case 'OVERDUE':
        return { label: 'Vencido', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertTriangle };
      default:
        return { label: status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: Clock };
    }
  };

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Pagos de Miembros</h1>
          <p className="text-xs text-muted">Historial de pagos y facturación de miembros</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/payments/new')}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
          >
            <Plus size={14} /> Registrar Pago
          </button>
          <button className="icon-btn text-xs border border-white-05 px-3">
            <Download size={14} className="mr-1" /> Exportar
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid-cols-stats mb-6">
        <StatCard
          icon={<DollarSign size={14} />}
          title="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          color="#10b981"
        />
        <StatCard
          icon={<TrendingUp size={14} />}
          title="Este Mes"
          value={`$${stats.thisMonthRevenue.toLocaleString()}`}
          color="#3b82f6"
        />
        <StatCard
          icon={<Clock size={14} />}
          title="Pendientes"
          value={stats.pendingCount.toString()}
          color="#f59e0b"
        />
        <StatCard
          icon={<AlertTriangle size={14} />}
          title="Vencidos"
          value={stats.overdueCount.toString()}
          color="#ef4444"
        />
      </div>

      {/* Filters */}
      <div className="vd-card mb-4">
        <div className="flex items-center gap-4">
          <Filter size={14} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Todos los estados</option>
            <option value="PAID">Pagados</option>
            <option value="PENDING">Pendientes</option>
            <option value="OVERDUE">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="vd-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center border-b border-white-05" style={{ padding: '16px 24px' }}>
          <h3 className="text-sm font-bold">Historial de Transacciones</h3>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 size={28} className="animate-spin text-purple-500 mx-auto mb-2" />
            <p className="text-xs text-muted">Cargando pagos...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-slate-500 opacity-50" />
            <p className="text-sm text-slate-300 font-semibold mb-1">Sin pagos registrados</p>
            <p className="text-xs text-slate-500">
              Los pagos de los miembros aparecerán aquí
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Miembro', 'Monto', 'Estado', 'Método', 'Fecha'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#475569',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, idx) => {
                  const statusInfo = getStatusInfo(payment.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      style={{
                        borderBottom:
                          idx === filteredPayments.length - 1
                            ? 'none'
                            : '1px solid rgba(255,255,255,0.04)',
                      }}
                      onClick={() => navigate(`/payments/${payment.id}`)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}
                          >
                            {payment.user?.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">
                              {payment.user?.displayName || 'Sin nombre'}
                            </p>
                            <p className="text-[10px] text-slate-500">{payment.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="text-sm font-bold">
                          ${payment.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          {payment.currency}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <StatusIcon size={14} style={{ color: statusInfo.color }} />
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-bold"
                            style={{ background: statusInfo.bg, color: statusInfo.color }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="text-xs text-slate-400">
                          {payment.paymentMethod || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-300">
                            {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {payment.paidAt && (
                            <span className="text-[10px] text-slate-500">
                              Pagado: {new Date(payment.paidAt).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string }> = ({
  icon,
  title,
  value,
  color,
}) => (
  <div className="vd-card flex flex-col justify-between py-3" style={{ padding: '16px 20px' }}>
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
    </div>
    <h4 className="text-2xl font-bold">{value}</h4>
  </div>
);

export default OrganizationPayments;
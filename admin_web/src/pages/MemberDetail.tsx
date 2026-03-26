import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Dumbbell,
  CreditCard,
  Activity,
  Loader2,
  Plus,
  Edit,
  Shield,
  Target,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const MemberDetail: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [assignedRoutines, setAssignedRoutines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId || !memberId) return;

      try {
        // Fetch member details
        const memberRes = await axios.get(
          `${API_URL}/organizations/${organizationId}/members/${memberId}`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );

        if (memberRes.data.success) {
          const data = memberRes.data.data;
          setMember(data.member);
          setAssignedRoutines(data.assignedRoutines || []);
          setPayments(data.payments || []);
          setRecentActivity(data.recentActivity || []);
        }

        // Fetch available programs
        const programsRes = await axios.get(
          `${API_URL}/organizations/${organizationId}/routines`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );

        if (programsRes.data.success) {
          setPrograms(programsRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching member:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token) {
      fetchData();
    }
  }, [session, organizationId, memberId]);

  const handleAssignRoutine = async (programId: string) => {
    try {
      await axios.post(
        `${API_URL}/organizations/${organizationId}/members/${memberId}/assign-routine`,
        { programId },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      // Refresh data
      const memberRes = await axios.get(
        `${API_URL}/organizations/${organizationId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      if (memberRes.data.success) {
        setAssignedRoutines(memberRes.data.data.assignedRoutines || []);
      }
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error assigning routine:', err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' };
      case 'TRAINER':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    }
  };

  const roleLabels: Record<string, string> = {
    ORG_ADMIN: 'Administrador',
    TRAINER: 'Entrenador',
    CLIENT: 'Cliente',
  };

  if (loading) {
    return (
      <div className="dashboard-content animate-fade-in flex items-center justify-center" style={{ height: '60vh' }}>
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
        <div className="vd-card text-center py-20">
          <User size={40} className="mx-auto mb-3 text-slate-500 opacity-50" />
          <p className="text-sm text-slate-300 font-semibold mb-1">Miembro no encontrado</p>
          <button
            onClick={() => navigate('/members')}
            className="text-xs text-purple-400 hover:underline"
          >
            Volver a miembros
          </button>
        </div>
      </div>
    );
  }

  const roleStyle = getRoleBadgeColor(member.role);

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/members')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={roleStyle}
            >
              {member.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.displayName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={roleStyle}
                >
                  {roleLabels[member.role] || member.role}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={{
                    background:
                      member.status === 'active'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color: member.status === 'active' ? '#10b981' : '#ef4444',
                  }}
                >
                  {member.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/members/${memberId}/edit`)}
          className="icon-btn text-xs border border-white-05 px-4 flex items-center gap-2"
        >
          <Edit size={14} /> Editar
        </button>
      </header>

      <div className="grid grid-cols-dashboard gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Contact Info */}
          <div className="vd-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-400" />
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-slate-500" />
                <span className="text-sm">{member.email}</span>
              </div>
              {member.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-slate-500" />
                  <span className="text-sm">{member.phoneNumber}</span>
                </div>
              )}
              {member.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-sm">
                    {new Date(member.dateOfBirth).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield size={14} className="text-slate-500" />
                <span className="text-sm">Miembro desde {new Date(member.joinedAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Assigned Routines */}
          <div className="vd-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Dumbbell size={16} className="text-purple-400" />
                Rutinas Asignadas
              </h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus size={12} /> Asignar
              </button>
            </div>
            {assignedRoutines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Sin rutinas asignadas
              </p>
            ) : (
              <div className="space-y-2">
                {assignedRoutines.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg bg-slate-900/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{r.program?.name}</p>
                      <p className="text-[10px] text-slate-500">
                        Asignado: {new Date(r.assignedAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        r.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {r.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="vd-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-purple-400" />
              Actividad Reciente
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Sin actividad</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{a.eventType}</span>
                    <span className="text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Payment History */}
          <div className="vd-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CreditCard size={16} className="text-purple-400" />
                Historial de Pagos
              </h3>
              <button
                onClick={() => navigate(`/payments?member=${memberId}`)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Ver todos
              </button>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Sin pagos registrados</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/30"
                  >
                    <div>
                      <p className="text-sm font-bold">${p.amount}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        p.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="vd-card">
            <h3 className="text-sm font-bold mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/payments/new?member=${memberId}`)}
                className="w-full py-2 px-3 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors text-left flex items-center gap-2"
              >
                <CreditCard size={14} className="text-purple-400" /> Registrar Pago
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="w-full py-2 px-3 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors text-left flex items-center gap-2"
              >
                <Target size={14} className="text-purple-400" /> Asignar Rutina
              </button>
              <button
                onClick={() => navigate(`/members/${memberId}/progress`)}
                className="w-full py-2 px-3 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors text-left flex items-center gap-2"
              >
                <Activity size={14} className="text-purple-400" /> Ver Progreso
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Routine Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="vd-card max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Asignar Rutina</h3>
            {programs.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell size={32} className="mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-400">No hay rutinas disponibles</p>
                <button
                  onClick={() => navigate('/routines/create')}
                  className="mt-4 text-xs text-purple-400 hover:underline"
                >
                  Crear una rutina
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {programs.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssignRoutine(p.id)}
                    className="w-full p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 text-left transition-colors"
                  >
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.workoutsCount || 0} entrenamientos</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
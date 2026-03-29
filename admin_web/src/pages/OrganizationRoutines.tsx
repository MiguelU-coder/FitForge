import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Clock,
  Target,
  MoreVertical,
  Loader2,
  Calendar,
  Zap,
  X,
  UserPlus,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface Routine {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  workoutsCount: number;
  createdAt: string;
}

interface Member {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface RoutineFormData {
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  goal: string;
}

const OrganizationRoutines: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const organizationId = profile?.organizations?.[0]?.id;

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/organizations/${organizationId}/routines`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (data.success) {
          setRoutines(data.data);
        }
      } catch (err) {
        console.error('Error fetching routines:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && organizationId) {
      fetchRoutines();
    } else {
      setLoading(false);
    }
  }, [session, organizationId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

  const handleCreateRoutine = async (formData: RoutineFormData) => {
    try {
      await axios.post(
        `${API_URL}/organizations/${organizationId}/routines`,
        formData,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      setShowCreateModal(false);
      const { data } = await axios.get(`${API_URL}/organizations/${organizationId}/routines`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data.success) setRoutines(data.data);
    } catch (err) {
      console.error('Error creating routine:', err);
    }
  };

  const openAssignModal = async (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowAssignModal(true);
    setAssignMessage(null);
    setMembersLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/organizations/${organizationId}/members?role=CLIENT`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data.success) setMembers(data.data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAssignRoutine = async (memberId: string) => {
    if (!selectedRoutine) return;
    setAssignLoading(true);
    setAssignMessage(null);
    try {
      await axios.post(
        `${API_URL}/organizations/${organizationId}/members/${memberId}/assign-routine`,
        { programId: selectedRoutine.id },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      setAssignMessage({ type: 'success', text: 'Rutina asignada correctamente' });
    } catch (err: any) {
      setAssignMessage({ type: 'error', text: err.response?.data?.message || 'Error al asignar rutina' });
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Rutinas</h1>
          <p className="text-xs text-muted">Gestiona las rutinas de entrenamiento</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
        >
          <Plus size={14} /> Crear Rutina
        </button>
      </header>

      {/* Stats */}
      <div className="grid-cols-stats mb-6">
        <StatCard icon={<Dumbbell size={14} />} title="Total Rutinas" value={routines.length.toString()} color="#8b5cf6" />
        <StatCard
          icon={<Calendar size={14} />}
          title="Este Mes"
          value={routines.filter((r) => new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length.toString()}
          color="#3b82f6"
        />
        <StatCard
          icon={<Target size={14} />}
          title="Entrenamientos"
          value={routines.reduce((acc, r) => acc + (r.workoutsCount || 0), 0).toString()}
          color="#10b981"
        />
        <StatCard icon={<Zap size={14} />} title="Activas" value={routines.length.toString()} color="#f59e0b" />
      </div>

      {/* Routines Grid */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '40vh' }}>
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : routines.length === 0 ? (
        <div className="vd-card text-center py-16">
          <Dumbbell size={48} className="mx-auto mb-4 text-slate-500 opacity-50" />
          <h3 className="text-lg font-bold mb-2">No hay rutinas</h3>
          <p className="text-sm text-slate-400 mb-4">Crea tu primera rutina de entrenamiento</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2 px-4 text-xs bg-purple-600 rounded-md"
            style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
          >
            <Plus size={14} className="inline mr-1" /> Crear Rutina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {routines.map((routine, idx) => (
            <div
              key={routine.id}
              className="vd-card cursor-pointer hover:border-purple-500/30 transition-all"
              onClick={() => navigate(`/routines/${routine.id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${colors[idx % colors.length]}22, ${colors[(idx + 1) % colors.length]}22)`,
                  }}
                >
                  <Dumbbell size={20} style={{ color: colors[idx % colors.length] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{routine.name}</h4>
                  <p className="text-[10px] text-muted">{routine.workoutsCount || 0} entrenamientos</p>
                </div>
              </div>
              {routine.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{routine.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white-05">
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <Clock size={12} />
                  <span>{routine.duration || 'Sin duración'}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); openAssignModal(routine); }}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <UserPlus size={10} /> Asignar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <>
        {/* Create Routine Modal */}
        {showCreateModal && (
          <CreateRoutineModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateRoutine}
          />
        )}

        {/* Assign to Member Modal */}
        {showAssignModal && selectedRoutine && (
          <AssignMemberModal
            routine={selectedRoutine as Routine}
            members={members}
            loading={membersLoading}
            assignLoading={assignLoading}
            message={assignMessage}
            onClose={() => { setShowAssignModal(false); setSelectedRoutine(null); }}
            onAssign={handleAssignRoutine}
          />
        )}
      </>
    </div>
  );
};

const CreateRoutineModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: RoutineFormData) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RoutineFormData>({
    name: '',
    description: '',
    duration: '45 min',
    difficulty: 'intermediate',
    goal: 'strength',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="vd-card" style={{ width: '480px', maxHeight: '80vh', overflow: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Crear Nueva Rutina</h2>
          <button onClick={onClose} className="icon-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">Nombre de la rutina</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Rutina Full Body"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe los objetivos de esta rutina..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px', resize: 'none' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Duración</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}
                >
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                  <option value="90 min">90 min</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Dificultad</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Objetivo</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '13px' }}
              >
                <option value="strength">Fuerza</option>
                <option value="cardio">Cardio</option>
                <option value="hypertrophy">Hipertrofia</option>
                <option value="flexibility">Flexibilidad</option>
                <option value="weight_loss">Pérdida de peso</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white-10 text-muted hover:text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-purple-600 text-white" style={{ fontSize: '13px', fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><Save size={14} className="inline mr-1" /> Crear Rutina</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignMemberModal: React.FC<{
  routine: Routine;
  members: Member[];
  loading: boolean;
  assignLoading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
  onAssign: (memberId: string) => void;
}> = ({ routine, members, loading, assignLoading, message, onClose, onAssign }) => {
  const [selectedMember, setSelectedMember] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="vd-card" style={{ width: '420px' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">Asignar Rutina</h2>
            <p className="text-xs text-muted mt-1">{routine.name}</p>
          </div>
          <button onClick={onClose} className="icon-btn"><X size={18} /></button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" size={24} /></div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">No hay miembros disponibles</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 text-left transition-all ${selectedMember === member.id ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-white/03 border border-white-05 hover:bg-white/05'}`}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                  {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : member.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>{member.displayName}</div>
                  <div className="text-[10px] text-muted truncate">{member.email}</div>
                </div>
                {selectedMember === member.id && <CheckCircle size={16} className="text-purple-400" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white-10 text-muted hover:text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
          <button
            onClick={() => onAssign(selectedMember)}
            disabled={!selectedMember || assignLoading}
            className="flex-1 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
            style={{ fontSize: '13px', fontWeight: 600, border: 'none', cursor: !selectedMember || assignLoading ? 'not-allowed' : 'pointer' }}
          >
            {assignLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><UserPlus size={14} className="inline mr-1" /> Asignar</>}
          </button>
        </div>
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
        <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          {icon}
        </span>
        {title}
      </span>
    </div>
    <h4 className="text-2xl font-bold">{value}</h4>
  </div>
);

export default OrganizationRoutines;
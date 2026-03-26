import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Clock,
  Target,
  MoreVertical,
  Loader2,
  Calendar,
  Zap,
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

const OrganizationRoutines: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

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

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Rutinas</h1>
          <p className="text-xs text-muted">Gestiona las rutinas de entrenamiento</p>
        </div>
        <button
          onClick={() => navigate('/routines/create')}
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
            onClick={() => navigate('/routines/create')}
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
                <span className="text-[10px] text-slate-500">
                  {new Date(routine.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
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
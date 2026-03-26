import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UserPlus,
  ArrowLeft,
  Mail,
  User,
  Phone,
  Calendar,
  Lock,
  Loader2,
  Shield,
  Check,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const AddMember: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const organizationId = profile?.organizations?.[0]?.id;

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    role: 'CLIENT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.displayName || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/organizations/${organizationId}/members`,
        {
          displayName: formData.displayName,
          email: formData.email.toLowerCase(),
          password: formData.password,
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          role: formData.role,
        },
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/members');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating member:', err);
      setError(err.response?.data?.message || 'Error al crear el miembro');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
        <div className="vd-card text-center py-20">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
          >
            <Check size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Miembro Creado</h2>
          <p className="text-sm text-slate-400">Redirigiendo a la lista de miembros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/members')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Agregar Miembro</h1>
          <p className="text-xs text-muted">Registra un nuevo miembro en tu gimnasio</p>
        </div>
      </header>

      <div className="vd-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-400" />
              Información Personal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white-05 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="juan@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white-05 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white-05 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Lock size={16} className="text-purple-400" />
              Seguridad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield size={16} className="text-purple-400" />
              Rol en el Gimnasio
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'CLIENT', label: 'Cliente', desc: 'Miembro del gimnasio' },
                { value: 'TRAINER', label: 'Entrenador', desc: 'Imparte clases y rutinas' },
                {
                  value: 'ORG_ADMIN',
                  label: 'Administrador',
                  desc: 'Acceso completo al dashboard',
                },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.role === role.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white-05 bg-slate-900/30 hover:border-white-10'
                  }`}
                >
                  <p className="text-sm font-bold">{role.label}</p>
                  <p className="text-[10px] text-slate-500">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-6 text-sm bg-purple-600 rounded-lg flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? 'Creando...' : 'Crear Miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
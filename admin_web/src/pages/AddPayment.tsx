import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCard,
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Check,
  Users,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const AddPayment: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMember = searchParams.get('member');

  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const organizationId = profile?.organizations?.[0]?.id;

  const [formData, setFormData] = useState({
    userId: preselectedMember || '',
    amount: '',
    currency: 'USD',
    paymentMethod: '',
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    const fetchMembers = async () => {
      if (!organizationId) return;

      try {
        const { data } = await axios.get(
          `${API_URL}/organizations/${organizationId}/members`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );

        if (data.success) {
          setMembers(data.data.members || []);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setMembersLoading(false);
      }
    };

    if (session?.access_token && organizationId) {
      fetchMembers();
    } else {
      setMembersLoading(false);
    }
  }, [session, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.userId || !formData.amount) {
      setError('Por favor selecciona un miembro e ingresa el monto');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/organizations/${organizationId}/payments`,
        {
          userId: formData.userId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          paymentMethod: formData.paymentMethod || undefined,
          dueDate: formData.dueDate || undefined,
          notes: formData.notes || undefined,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/payments');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.message || 'Error al registrar el pago');
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
          <h2 className="text-xl font-bold mb-2">Pago Registrado</h2>
          <p className="text-sm text-slate-400">Redirigiendo al historial de pagos...</p>
        </div>
      </div>
    );
  }

  const selectedMember = members.find((m) => m.id === formData.userId);

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/payments')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Registrar Pago</h1>
          <p className="text-xs text-muted">Registra un pago de miembro</p>
        </div>
      </header>

      <div className="vd-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Selection */}
          <div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-400" />
              Miembro
            </h3>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 appearance-none"
                >
                  <option value="">Seleccionar miembro...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.email})
                    </option>
                  ))}
                </select>
                <Users
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            )}
            {selectedMember && (
              <div className="mt-3 p-3 rounded-lg bg-slate-900/30 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}
                >
                  {selectedMember.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedMember.displayName}</p>
                  <p className="text-[10px] text-slate-500">{selectedMember.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-purple-400" />
              Detalles del Pago
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Monto *
                </label>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white-05 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Moneda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Método de Pago
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">
                  Fecha de Vencimiento
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white-05 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-2 flex items-center gap-2">
              <FileText size={14} className="text-purple-400" />
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Notas adicionales sobre el pago..."
            />
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
              onClick={() => navigate('/payments')}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.userId || !formData.amount}
              className="btn-primary py-2.5 px-6 text-sm bg-purple-600 rounded-lg flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;
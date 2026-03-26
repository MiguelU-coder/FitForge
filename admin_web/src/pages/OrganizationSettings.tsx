import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Upload,
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

const OrganizationSettings: React.FC<{ session: any; profile: any }> = ({ session, profile }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  const organizationId = profile?.organizations?.[0]?.id;

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    primaryColor: '#8b5cf6',
    secondaryColor: '#3b82f6',
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) return;

      try {
        const { data } = await axios.get(`${API_URL}/organizations/${organizationId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        setOrganization(data);
        setFormData((prev) => ({
          ...prev,
          name: data.name || '',
          logoUrl: data.logoUrl || '',
        }));
      } catch (err) {
        console.error('Error fetching organization:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && organizationId) {
      fetchOrganization();
    }
  }, [session, organizationId]);

  const handleSave = async () => {
    if (!organizationId) return;

    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/organizations/${organizationId}`,
        {
          name: formData.name,
          logoUrl: formData.logoUrl,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: '0.5rem' }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Configuración del Gimnasio</h1>
        <p className="text-xs text-muted">Personaliza la configuración de tu gimnasio</p>
      </header>

      <div className="grid grid-cols-dashboard gap-6">
        {/* Left Column - Settings */}
        <div className="flex flex-col gap-4">
          {/* Organization Info */}
          <div className="vd-card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold">Información del Gimnasio</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">Nombre del Gimnasio</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Nombre de tu gimnasio"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">URL del Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="flex-1 bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="https://..."
                  />
                  <button className="icon-btn border border-white-05 px-3">
                    <Upload size={16} />
                  </button>
                </div>
              </div>

              {formData.logoUrl && (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-white-05 flex items-center justify-center overflow-hidden">
                    <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-xs text-slate-400">Vista previa del logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div className="vd-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold">Apariencia</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">Color Primario</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted uppercase tracking-widest block mb-2">Color Secundario</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="bg-slate-900/50 border border-white-05 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="vd-card">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold">Notificaciones</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold block">Notificaciones por Email</span>
                  <span className="text-[10px] text-slate-500">Recibe actualizaciones importantes por correo</span>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${formData.emailNotifications ? 'bg-purple-500' : 'bg-slate-700'}`}
                  onClick={() => setFormData({ ...formData, emailNotifications: !formData.emailNotifications })}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition-transform ${formData.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'}`}
                    style={{ marginTop: '2px', marginLeft: '2px' }}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold block">Notificaciones SMS</span>
                  <span className="text-[10px] text-slate-500">Recibe alertas por mensaje de texto</span>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${formData.smsNotifications ? 'bg-purple-500' : 'bg-slate-700'}`}
                  onClick={() => setFormData({ ...formData, smsNotifications: !formData.smsNotifications })}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition-transform ${formData.smsNotifications ? 'translate-x-5' : 'translate-x-0.5'}`}
                    style={{ marginTop: '2px', marginLeft: '2px' }}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="flex flex-col gap-4">
          {/* Billing */}
          <div className="vd-card">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold">Facturación</h3>
            </div>

            {organization?.plan && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-purple-400 font-bold uppercase">Plan Actual</span>
                    <p className="text-lg font-bold">{organization.plan.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${organization.plan.price?.toNumber?.() || organization.plan.price}</span>
                    <span className="text-xs text-slate-400">/mes</span>
                  </div>
                </div>
              </div>
            )}

            <button className="w-full py-2 px-4 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors">
              Gestionar Suscripción
            </button>
          </div>

          {/* Security */}
          <div className="vd-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold">Seguridad</h3>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2 px-4 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors text-left">
                Cambiar contraseña
              </button>
              <button className="w-full py-2 px-4 text-xs bg-slate-800/50 border border-white-05 rounded-lg hover:bg-slate-700/50 transition-colors text-left">
                Autenticación de dos factores
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-3 px-4 text-sm bg-purple-600 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
            style={{ border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
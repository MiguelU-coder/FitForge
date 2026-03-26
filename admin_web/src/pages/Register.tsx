import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, ArrowRight, Building2, User } from 'lucide-react';
import axios from 'axios';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    orgName: '',
    orgSlug: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, orgName: name, orgSlug: slug }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
          }
        }
      });

      if (authError) throw authError;

      // 2. Create Organization in Backend
      // NOTE: Here we would ideally call the NestJS API. 
      // For this initial UI demo, we'll inform the user and redirect.
      // In a real flow, we'd wait for the session and then POST to /organizations.
      
      console.log('User registered, creating organization...', formData);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="page-background" />
      
      <div className="auth-card-container animate-fade-in">
        <div className="glass-card register-card">
          <header className="auth-header">
            <div className="brand-badge">FF</div>
            <h2>Unirse a FitForge</h2>
            <p>Comienza a digitalizar tu gimnasio hoy mismo</p>
          </header>

          <form onSubmit={handleRegister} className="auth-form">
            {error && <div className="alert-error">{error}</div>}
            
            {step === 1 ? (
              <div className="step-content animate-fade-in">
                <div className="form-section-label">
                  <User size={16} /> Información Personal
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Eej. Juan Pérez"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Corporativo</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="email@tu-gym.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <button type="button" className="btn-primary auth-submit" onClick={() => setStep(2)}>
                  Siguiente paso <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="step-content animate-fade-in">
                <div className="form-section-label">
                  <Building2 size={16} /> Detalles del Gimnasio
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre de la Organización</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej. Iron Paradise Gym"
                    value={formData.orgName}
                    onChange={(e) => handleOrgSlug(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL del Gimnasio (Slug)</label>
                  <div className="slug-input-wrapper">
                    <span>fitforge.app/</span>
                    <input 
                      type="text" 
                      className="form-control slug-control"
                      value={formData.orgSlug}
                      readOnly
                    />
                  </div>
                </div>
                <div className="btn-group">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                    Atrás
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary auth-submit">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Crear Cuenta <UserPlus size={18} /></>}
                  </button>
                </div>
              </div>
            )}
          </form>

          <footer className="auth-footer">
            <p>¿Ya tienes una cuenta? <Link to="/login" className="link-accent">Inicia sesión</Link></p>
          </footer>
        </div>
      </div>

      <style>{`
        .auth-viewport {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-card-container {
          width: 100%;
          max-width: 480px;
        }

        .register-card {
          padding: 3rem 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .brand-badge {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          border-radius: var(--radius-md);
          margin: 0 auto 1.25rem;
          box-shadow: var(--shadow-glow);
        }

        .form-section-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-400);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding-left: 1rem;
          font-size: 0.875rem;
          color: var(--text-500);
        }

        .slug-control {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .btn-group {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }

        .auth-submit {
          width: 100%;
          padding: 0.875rem;
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.875rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9375rem;
        }

        .link-accent {
          color: var(--accent-400);
          text-decoration: none;
          font-weight: 600;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="page-background" />
      
      <div className="auth-card-container animate-fade-in">
        <div className="glass-card login-card">
          <header className="auth-header">
            <div className="brand-badge">FF</div>
            <h2>FitForge Admin</h2>
            <p>Accede a la gestión profesional de tu gimnasio</p>
          </header>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="alert-error">
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Email Corporativo</label>
              <input 
                type="email" 
                className="form-control"
                placeholder="nombre@gimnasio.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-control"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary auth-submit">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Iniciar Sesión <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <footer className="auth-footer">
            <p>¿No tienes una cuenta? <Link to="/register" className="link-accent">Regístrate ahora</Link></p>
          </footer>
        </div>
        
        <div className="auth-meta">
          <p>© 2026 FitForge Ecosystem — Advanced Multi-tenant Architecture</p>
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
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-card {
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

        .auth-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }

        .auth-header p {
          font-size: 0.9375rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .auth-submit {
          width: 100%;
          padding: 0.875rem;
          margin-top: 0.5rem;
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.875rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          text-align: center;
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
          border-bottom: 1px solid transparent;
          transition: var(--transition-fast);
        }

        .link-accent:hover {
          border-bottom-color: var(--accent-400);
        }

        .auth-meta {
          text-align: center;
          color: var(--text-400);
          font-size: 0.75rem;
          opacity: 0.6;
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

export default Login;

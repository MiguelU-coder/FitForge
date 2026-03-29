import React from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Search,
  Bell,
  Command,
  Building2,
  Menu,
  CreditCard,
  DollarSign,
  ShieldAlert,
  LifeBuoy,
  X,
  Target
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children, user }) => {
  const handleLogout = () => supabase.auth.signOut();
  const location = useLocation();

  return (
    <div className="dashboard-wrapper">
      <div className="page-background" />
      
      {/* Sidebar - Premium Minimalist */}
      <aside className="sidebar glass-card">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Command size={20} />
          </div>
          <span className="brand-name">FitForge</span>
        </div>

        <nav className="sidebar-nav">
          {user?.isGlobalAdmin && (
            <>
              <NavItem 
                icon={<LayoutDashboard size={18} />} 
                label="Overview" 
                to="/" 
                active={location.pathname === '/'} 
              />
              <div className="nav-section-title">Plataforma</div>
              <NavItem 
                icon={<Building2 size={18} />} 
                label="Organizaciones" 
                to="/organizations" 
                active={location.pathname === '/organizations'} 
              />
              <NavItem 
                icon={<CreditCard size={18} />} 
                label="Membresías" 
                to="/membership" 
                active={location.pathname === '/membership'} 
              />
              <NavItem 
                icon={<DollarSign size={18} />} 
                label="Ingresos" 
                to="/revenue" 
                active={location.pathname === '/revenue'} 
              />
              <NavItem 
                icon={<ShieldAlert size={18} />} 
                label="Auditoria" 
                to="/security" 
                active={location.pathname === '/security'} 
              />
              <NavItem 
                icon={<LifeBuoy size={18} />} 
                label="Soporte" 
                to="/support" 
                active={location.pathname === '/support'} 
              />
              <NavItem 
                icon={<Users size={18} />} 
                label="Usuarios Globales" 
                to="/users" 
                active={location.pathname === '/users'} 
              />
              <NavItem 
                icon={<Settings size={18} />} 
                label="Configuración Global" 
                to="/settings" 
                active={location.pathname === '/settings'} 
              />
            </>
          )}
          {!user?.isGlobalAdmin && (
            <>
              <NavItem
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                to="/"
                active={location.pathname === '/'}
              />
              <div className="nav-section-title">Gimnasio</div>
              <NavItem
                icon={<Users size={18} />}
                label="Miembros"
                to="/members"
                active={location.pathname === '/members'}
              />
              <NavItem
                icon={<Dumbbell size={18} />}
                label="Rutinas"
                to="/routines"
                active={location.pathname === '/routines'}
              />
              <NavItem
                icon={<CreditCard size={18} />}
                label="Pagos"
                to="/payments"
                active={location.pathname === '/payments'}
              />
              <NavItem
                icon={<Target size={18} />}
                label="Planes de Gimnasio"
                to="/gym-plans"
                active={location.pathname === '/gym-plans'}
              />
              <div className="nav-section-title">Configuración</div>
              <NavItem
                icon={<Settings size={18} />}
                label="Ajustes"
                to="/gym-settings"
                active={location.pathname === '/gym-settings'}
              />
            </>
          )}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-badge">
            <div className="avatar">{(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}</div>
            <div className="profile-details">
              <span className="p-name">{user?.displayName || 'Administrador'}</span>
              <span className="p-role">{user?.isGlobalAdmin ? 'Global Owner' : 'Gym Manager'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-trigger" title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        <header className="top-navigation">
          <div className="search-field">
            <Search size={16} />
            <input type="text" placeholder="Search resources..." className="search-input" />
            <kbd className="search-kbd">⌘K</kbd>
          </div>
          
          <div className="top-actions">
            <button className="notification-bell">
              <Bell size={18} />
              <span className="bell-dot"></span>
            </button>
            <div className="separator"></div>
            <div className="system-status">
              <span className="status-dot"></span>
              API Online
            </div>
          </div>
        </header>

        <section className="scrollable-content">
          <div className="content-inner animate-fade-in">
            {children}
          </div>
        </section>
      </main>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-base);
        }

        /* Sidebar Styling */
        .sidebar {
          width: 260px;
          height: calc(100vh - 2rem);
          margin: 1rem;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.25rem;
          border-color: rgba(255, 255, 255, 0.03);
          z-index: 10;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-glow);
        }

        .brand-name {
          font-weight: 800;
          font-size: 1.125rem;
          color: var(--text-900);
          letter-spacing: -0.02em;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .nav-section-title {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-400);
          margin: 1.5rem 0 0.75rem 0.5rem;
          font-weight: 700;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--text-500);
          font-weight: 600;
          font-size: 0.875rem;
          transition: var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--text-900);
          background-color: var(--bg-surface);
        }

        .nav-link.active {
          background-color: var(--accent-soft);
          color: var(--accent-400);
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.1);
        }

        .sidebar-profile {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .profile-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar {
          width: 34px;
          height: 34px;
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: var(--text-900);
          font-size: 0.75rem;
          border: 1px solid var(--border-subtle);
        }

        .profile-details {
          display: flex;
          flex-direction: column;
        }

        .p-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-900);
        }

        .p-role {
          font-size: 0.6875rem;
          color: var(--text-400);
          font-weight: 500;
        }

        .logout-trigger {
          color: var(--text-400);
          padding: 0.5rem;
          border-radius: var(--radius-xs);
        }

        .logout-trigger:hover {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.05);
        }

        /* Main Viewport Styling */
        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .top-navigation {
          height: 80px;
          padding: 0 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 5;
        }

        .search-field {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 0 1rem;
          width: 380px;
          color: var(--text-500);
          transition: var(--transition-fast);
        }

        .search-field:focus-within {
          border-color: var(--border-focus);
          background: var(--bg-overlay);
        }

        .search-input {
          border: none;
          background: transparent;
          padding: 0.625rem 0.75rem;
          color: var(--text-900);
          width: 100%;
          font-size: 0.875rem;
        }

        .search-kbd {
          font-size: 0.625rem;
          font-weight: 800;
          background: var(--bg-overlay);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: var(--text-400);
          border: 1px solid var(--border-subtle);
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .notification-bell {
          position: relative;
          color: var(--text-500);
        }

        .bell-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 6px;
          height: 6px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--bg-base);
        }

        .separator {
          width: 1px;
          height: 20px;
          background-color: var(--border-subtle);
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-400);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: var(--accent-500);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 3rem 3rem 3rem;
        }

        .content-inner {
          margin: 0 auto;
          max-width: 1600px;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, to, active = false }: any) => (
  <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
    {icon}
    <span>{label}</span>
    {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
  </Link>
);

export default DashboardLayout;

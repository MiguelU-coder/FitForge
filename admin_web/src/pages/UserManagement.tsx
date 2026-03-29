import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Heart,
  Globe,
  Plus,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserTable from '../components/users/UserTable';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface UserStats {
  total: number;
  newUsers: number;
  activeUsers: number;
  retention: string;
}

const UserManagement: React.FC<{ session: any }> = ({ session }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);

  const fetchStats = async () => {
    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const statsRes = await axios.get(`${API_URL}/users/stats`, { headers });
      setStats(statsRes.data);
    } catch (err) {
      setStats({
        total: 0,
        newUsers: 0,
        activeUsers: 0,
        retention: '0'
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="users-page animate-fade-in">
      {/* Top Header Section */}
      <header className="flex justify-between items-center mb-8 px-2" style={{ height: '80px' }}>
        <div className="flex items-center" style={{ gap: '50px' }}>
          <h1 className="text-xl font-bold text-white tracking-tight">Users</h1>
          <div className="search-box-figma" style={{ width: '458px', height: '42px', backgroundColor: '#0d1425', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={14} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search for..." 
              className="border-none outline-none text-[13px] text-slate-400 w-full placeholder:text-slate-600" 
              style={{ backgroundColor: 'transparent', background: 'transparent', border: 'none', outline: 'none' }}
            />
          </div>
        </div>
        <button 
          onClick={() => navigate('/users/add')}
          style={{ 
            backgroundColor: '#10b981', 
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
          }}
          className="hover:brightness-110 transition-all"
        >
          Add user
        </button>
      </header>

      {/* Stats Grid - Pixel Perfect Dashdark Style */}
      <div className="stats-grid">
        <StatCard 
          icon={<Users size={18} />} 
          title="Total Users" 
          value={stats?.total?.toString() || '0'} 
          colorClass="purple"
        />
        <StatCard 
          icon={<UserPlus size={18} />} 
          title="New Users" 
          value={stats?.newUsers?.toString() || '0'} 
          colorClass="amber"
        />
        <StatCard 
          icon={<Heart size={18} />} 
          title="Active Users" 
          value={stats?.activeUsers?.toString() || '0'} 
          colorClass="emerald"
        />
        <StatCard 
          icon={<div className="flex gap-0.5"><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>} 
          title="Retention" 
          value={stats ? `${stats.retention}%` : '0%'} 
          colorClass="blue"
        />
      </div>

      <div className="table-container-premium">
        <div className="table-header-premium">
          <h3 className="text-sm font-bold text-white">All Users</h3>
          <span className="text-[11px] text-purple-400 font-bold">1 - 10 of 460</span>
        </div>
        <UserTable session={session} />
      </div>

      <style>{`
        .users-page {
          padding: 1rem 0;
        }
        .search-box-figma {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: #0d1425;
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 0.6rem 1rem;
        }
        .search-box-figma input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          width: 100%;
          color: #94a3b8;
          font-size: 13px;
        }
        .search-box-figma input::placeholder {
          color: #475569;
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; colorClass: string }> = ({ icon, title, value, colorClass }) => (
  <div className="stat-card-premium flex-row items-center gap-4">
    <div className={`stat-icon-circle ${colorClass}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <h4 className="text-[13px] font-bold text-white mb-0.5">{title}</h4>
      <span className="text-[11px] text-slate-500 font-medium">{value}</span>
    </div>
    <button className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
      <MoreVertical size={14} />
    </button>
  </div>
);

export default UserManagement;

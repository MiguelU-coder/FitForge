import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  Edit2, 
  Trash2, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';



interface UserTableProps {
  session: any;
}

const UserTable: React.FC<UserTableProps> = ({ session }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const res = await axios.get(`${API_URL}/users`, { headers, params: { limit: 10 } });
        if (res.data.users && res.data.users.length > 0) {
          const apiUsers = res.data.users.map((u: any) => ({
            ...u,
            phone: u.phone || '(555) 000-0000',
            location: u.location || 'Unknown',
            company: u.organizations?.[0]?.organization?.name || 'Individual'
          }));
          setUsers(apiUsers);
        }
      } catch (err) {
        console.warn('Backend offline, using mock data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="refined-table">
        <thead>
          <tr>
            <th className="w-10"><input type="checkbox" className="custom-check" /></th>
            <th><div className="flex items-center gap-2">Name <Filter size={10} /></div></th>
            <th><div className="flex items-center gap-2">Phone <Filter size={10} /></div></th>
            <th><div className="flex items-center gap-2">Location <Filter size={10} /></div></th>
            <th><div className="flex items-center gap-2">Company <Filter size={10} /></div></th>
            <th><div className="flex items-center gap-2">Status <Filter size={10} /></div></th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td><input type="checkbox" className="custom-check" /></td>
              <td>
                <div className="flex items-center gap-3">
                  <div className="avatar-small">
                    <img src={`https://i.pravatar.cc/100?u=${user.id}`} alt="" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{user.displayName}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                </div>
              </td>
              <td className="text-[11px] text-slate-400">{user.phone}</td>
              <td className="text-[11px] text-slate-400">{user.location}</td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="company-icon">
                    <Building2 size={12} className="text-blue-400" />
                  </div>
                  <span className="text-[11px] text-slate-300">{user.company}</span>
                </div>
              </td>
              <td>
                <span className={`status-pill ${user.isActive ? 'online' : 'offline'}`}>
                  {user.isActive ? 'Online' : 'Offline'}
                </span>
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-3 opacity-40 hover:opacity-100 transition-opacity">
                  <Edit2 
                    size={14} 
                    className="cursor-pointer hover:text-purple-400" 
                    onClick={() => navigate(`/users/edit/${user.id}`)}
                  />
                  <Trash2 size={14} className="cursor-pointer hover:text-rose-400" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div className="pagination-footer">
        <span className="text-[10px] text-slate-500">1 - 10 of 460</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            Rows per page: 
            <select className="bg-transparent border-none outline-none text-white font-bold ml-1">
              <option>10</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button className="text-slate-500 hover:text-white"><ChevronLeft size={16} /></button>
            <button className="text-slate-500 hover:text-white"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-check {
          appearance: none;
          width: 14px;
          height: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          background: rgba(30, 41, 59, 0.5);
          cursor: pointer;
        }
        .avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .avatar-small img { width: 100%; height: 100%; object-fit: cover; }
        .company-icon {
          width: 24px;
          height: 24px;
          background: #1a2035;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-pill.online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.online::before { content: ''; width: 4px; height: 4px; background: #10b981; border-radius: 50%; }
        .status-pill.offline { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }
        .status-pill.offline::before { content: ''; width: 4px; height: 4px; background: #94a3b8; border-radius: 50%; }
        .pagination-footer {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(15, 23, 42, 0.3);
        }
      `}</style>
    </div>
  );
};

export default UserTable;

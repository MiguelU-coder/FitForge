import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Save,
  X,
  Check,
  Loader2,
  ChevronLeft,
  Settings2,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  isActive: boolean;
  features: Record<string, any>;
}

const PlanConfiguration: React.FC<{ session?: any }> = ({ session }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 29.99,
    interval: "month",
    features: {
      members: 500,
      ai_routines: 10,
      support: "Email",
    }
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/billing/plans`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setPlans(data.data || data);
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) fetchPlans();
  }, [session]);

  const handleUpdate = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/billing/plans/${editingPlan.id}`,
        {
          name: editingPlan.name,
          price: editingPlan.price,
          isActive: editingPlan.isActive,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      await fetchPlans();
      setEditingPlan(null);
    } catch (err) {
      alert("Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newPlan.name.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/billing/plans`,
        newPlan,
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      await fetchPlans();
      setIsCreating(false);
      setNewPlan({
        name: "",
        price: 29.99,
        interval: "month",
        features: { members: 500, ai_routines: 10, support: "Email" }
      });
    } catch (err) {
      alert("Failed to create plan.");
    } finally {
      setSaving(false);
    }
  };

  const planAccent = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("enterprise") || n.includes("platinum"))
      return { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" };
    if (n.includes("gold") || n.includes("pro"))
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
    return { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" };
  };

  return (
    <div className="dashboard-content animate-fade-in" style={{ padding: "0.5rem" }}>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl border border-white-05 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Plan Architecture</h1>
            <p className="text-xs text-muted">Manage global subscription tiers and commercial constraints.</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary text-xs bg-purple-600 rounded-md flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          style={{ padding: "8px 16px", border: "none", color: "#fff", fontWeight: 700 }}
        >
          <Plus size={14} /> Create Tier
        </button>
      </header>

      {loading ? (
        <div className="vd-card flex items-center justify-center" style={{ padding: "80px 0" }}>
          <Loader2 size={28} className="animate-spin text-purple-500" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {plans.map((plan) => {
            const ac = planAccent(plan.name);
            return (
              <div key={plan.id} className="vd-card p-0 overflow-hidden flex flex-col">
                <div style={{ height: "3px", background: ac.color, opacity: 0.8 }} />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-extrabold text-white">{plan.name}</h3>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: ac.color, background: ac.bg, border: `1px solid ${ac.border}` }}>
                          {plan.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Global Tier</span>
                    </div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: plan.isActive ? "#10b981" : "#334155", boxShadow: plan.isActive ? "0 0 8px #10b981" : "none" }} />
                  </div>

                  <div className="mb-5 pb-5 border-b border-white-05">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black" style={{ color: ac.color }}>${plan.price}</span>
                      <span className="text-xs text-slate-500 font-bold">/{plan.interval}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5 mb-6">
                    {Object.entries(plan.features || {}).map(([key, val]: any, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Check size={10} className="text-slate-500" />
                           <span className="text-[11px] text-slate-400 capitalize">{key.replace(/_/g, " ")}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-200">{val.toString()}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setEditingPlan(plan)} className="w-full py-2.5 rounded-xl border border-white-05 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Settings2 size={12} /> Configure Tier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE/EDIT MODAL ── */}
      {(editingPlan || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => { setEditingPlan(null); setIsCreating(false); }}>
          <div className="vd-card w-full max-w-md overflow-hidden bg-slate-900 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{isCreating ? "Create New Tier" : `Edit ${editingPlan?.name}`}</h3>
                <p className="text-[10px] text-slate-500">Configure core plan properties and pricing.</p>
              </div>
              <button onClick={() => { setEditingPlan(null); setIsCreating(false); }} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Display Name</label>
                <input
                  value={isCreating ? newPlan.name : editingPlan?.name}
                  onChange={e => isCreating ? setNewPlan({...newPlan, name: e.target.value}) : setEditingPlan({...editingPlan!, name: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  placeholder="e.g. Platinum Elite"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Price (USD)</label>
                  <input
                    type="number"
                    value={isCreating ? newPlan.price : editingPlan?.price}
                    onChange={e => isCreating ? setNewPlan({...newPlan, price: Number(e.target.value)}) : setEditingPlan({...editingPlan!, price: Number(e.target.value)})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Interval</label>
                  <select
                    value={isCreating ? newPlan.interval : editingPlan?.interval}
                    onChange={e => isCreating ? setNewPlan({...newPlan, interval: e.target.value}) : setEditingPlan({...editingPlan!, interval: e.target.value})}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>

              {!isCreating && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white-05">
                   <div className="text-xs font-bold text-white">Publicly Available</div>
                   <div 
                    onClick={() => setEditingPlan({...editingPlan!, isActive: !editingPlan?.isActive})}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${editingPlan?.isActive ? 'bg-purple-600' : 'bg-slate-700'}`}
                   >
                     <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingPlan?.isActive ? 'left-6' : 'left-1'}`} />
                   </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setEditingPlan(null); setIsCreating(false); }}
                  className="flex-1 py-2.5 rounded-xl border border-white-05 text-[11px] font-bold text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={isCreating ? handleCreate : handleUpdate}
                  disabled={saving || (isCreating && !newPlan.name)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-[11px] font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isCreating ? "Create Plan" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanConfiguration;

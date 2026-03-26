import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Globe,
  Bell,
  Users,
  CreditCard,
  ChevronRight,
  Check,
  X,
  Plus,
  Image as ImageIcon,
  Save,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import axios from "axios";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

const TABS = [
  { id: "personal", label: "Personal Information", icon: <User size={14} /> },
  { id: "team", label: "Team", icon: <Users size={14} /> },
  { id: "plan", label: "Subscription Plan", icon: <CreditCard size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
];

const NOTIF_ITEMS = [
  { id: "mentions", label: "I'm mentioned in a message" },
  { id: "replies", label: "Someone replies to my message" },
  { id: "assignments", label: "I'm assigned a task" },
  { id: "overdue", label: "A task is overdue" },
];

/* ── Plan accent color helper ── */
const planAccent = (name: string = "") => {
  const n = name.toLowerCase();
  if (n.includes("enterprise"))
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.25)",
    };
  if (n.includes("gold"))
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
    };
  return {
    color: "#10b981",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.2)",
  };
};

/* ─────────────────────────────── */
const AddUser: React.FC<{ session: any }> = ({ session }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // ── Stripe feedback state ──
  const [stripeResult, setStripeResult] = useState<{
    checkoutUrl: string;
    userEmail: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    position: "",
    location: "",
    website: "",
    shortBio: "",
    teamName: "",
    rank: "",
    office: "",
    businessEmail: "",
    planId: "", // ← Stripe plan selection
    notificationSettings: {
      mentions: { inApp: true, email: false },
      replies: { inApp: false, email: true },
      assignments: { inApp: true, email: true },
      overdue: { inApp: true, email: false },
    },
  });

  // ── Fetch plans for the plan selector ──
  useEffect(() => {
    setPlansLoading(true);
    axios
      .get(`${API_URL}/billing/plans`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      .then(({ data }) => {
        const list = data.data || data;
        setPlans(list);
        if (list.length > 0) setForm((p) => ({ ...p, planId: list[0].id }));
      })
      .catch((e) => console.error("Failed to fetch plans", e))
      .finally(() => setPlansLoading(false));
  }, [session]);

  // ── Fetch user data when editing ──
  useEffect(() => {
    if (!isEdit) return;
    axios
      .get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        params: { search: id },
      })
      .then(({ data }) => {
        const user = data.users?.find((u: any) => u.id === id);
        if (user)
          setForm((p) => ({
            ...p,
            ...user,
            notificationSettings:
              user.notificationSettings || p.notificationSettings,
          }));
      })
      .catch((e) => console.error(e));
  }, [id]);

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const toggleNotif = (key: string, type: "inApp" | "email") =>
    setForm((p) => ({
      ...p,
      notificationSettings: {
        ...p.notificationSettings,
        [key]: {
          ...(p.notificationSettings as any)[key],
          [type]: !(p.notificationSettings as any)[key][type],
        },
      },
    }));

  // ── Validate required fields ──
  const validate = () => {
    if (!form.displayName.trim()) return "Full name is required.";
    if (!form.email.trim() || !form.email.includes("@"))
      return "A valid email is required.";
    if (!isEdit && !form.planId) return "Please select a subscription plan.";
    return null;
  };

  // ── Submit → calls createWithStripe on the backend ──
  const handleSubmit = async () => {
    setSubmitError(null);
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };

      if (isEdit) {
        // Edit: standard PATCH, no Stripe involved
        await axios.patch(`${API_URL}/users/${id}`, form, { headers });
        navigate("/users");
        return;
      }

      // Create: backend calls stripe.customers.create() + checkout.sessions.create()
      // and returns { user, checkoutUrl }
      const { data } = await axios.post(
        `${API_URL}/users`,
        {
          displayName: form.displayName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          position: form.position,
          location: form.location,
          website: form.website,
          shortBio: form.shortBio,
          teamName: form.teamName,
          rank: form.rank,
          office: form.office,
          businessEmail: form.businessEmail,
          planId: form.planId, // backend maps this to Stripe Price ID
          notificationSettings: form.notificationSettings,
        },
        { headers },
      );

      // Backend returns { user, checkoutUrl, message }
      // The backend also emails the checkout URL automatically.
      // Show it here too so the admin can copy/share it manually.
      setStripeResult({
        checkoutUrl: data.checkoutUrl,
        userEmail: form.email,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e.message || "Error creating user.";
      setSubmitError(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen after Stripe checkout URL is generated ──
  if (stripeResult) {
    return (
      <div
        className="dashboard-content animate-fade-in"
        style={{ padding: "0.5rem" }}
      >
        <div
          style={{
            maxWidth: "540px",
            margin: "60px auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "24px",
          }}
        >
          {/* Success icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={28} style={{ color: "#10b981" }} />
          </div>

          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "8px",
              }}
            >
              User created successfully
            </h2>
            <p
              style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}
            >
              The user has been onboarded successfully. Use the link below to complete the subscription.
            </p>
          </div>

          {/* NEW: PROMINENT CHECKOUT URL BOX */}
          <div
            style={{
              width: "100%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "20px",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.05, transform: "rotate(-15deg)" }}>
               <CreditCard size={120} />
            </div>
            
            <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>
              Action Required: Stripe Checkout
            </h3>
            
            <div style={{ wordBreak: "break-all", fontSize: "18px", fontWeight: 700, color: "#e2e8f0", marginBottom: "24px", lineHeight: "1.4", fontFamily: "'Inter', sans-serif" }}>
              {stripeResult.checkoutUrl}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                   navigator.clipboard.writeText(stripeResult.checkoutUrl);
                   alert("URL Copied!");
                }}
                className="btn-primary"
                style={{ 
                  flex: 1, 
                  background: "rgba(255,255,255,0.05)", 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  padding: "12px", 
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#e2e8f0",
                  cursor: "pointer"
                }}
              >
                Copy URL
              </button>
              <a
                href={stripeResult.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  flex: 1.5, 
                  background: "#10b981", 
                  padding: "12px", 
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#fff",
                  textDecoration: "none",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                Open Checkout <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Social sharing */}
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
             <button
                onClick={() => {
                  const text = `Hi, here is your secure Stripe Checkout link to activate your FitForge account: ${stripeResult.checkoutUrl}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(34,197,94,0.2)",
                  background: "rgba(34,197,94,0.05)",
                  color: "#4ade80",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Send via WhatsApp
              </button>
          </div>



          {/* How it works */}
          <div
            className="vd-card"
            style={{ padding: "18px 22px", width: "100%", textAlign: "left" }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#475569",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              What happens next
            </p>
            {[
              {
                icon: <Send size={12} />,
                color: "#3b82f6",
                text: "User receives the checkout link by email",
              },
              {
                icon: <CreditCard size={12} />,
                color: "#8b5cf6",
                text: "User enters card details on Stripe's secure page",
              },
              {
                icon: <CheckCircle2 size={12} />,
                color: "#10b981",
                text: "Stripe webhook activates the subscription instantly",
              },
              {
                icon: <Bell size={12} />,
                color: "#f59e0b",
                text: "User gets full access to the mobile app",
              },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "7px 0",
                  borderBottom:
                    i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    minWidth: "26px",
                    borderRadius: "7px",
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              onClick={() => {
                setStripeResult(null);
                setForm((p) => ({
                  ...p,
                  displayName: "",
                  email: "",
                  planId: plans[0]?.id || "",
                }));
                setActiveTab("personal");
              }}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e2e8f0";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Add Another User
            </button>
            <button
              onClick={() => navigate("/users")}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                transition: "filter 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div
      className="dashboard-content animate-fade-in"
      style={{ padding: "0.5rem" }}
    >
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/users")}
            className="w-9 h-9 rounded-xl border border-white-05 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
              >
                User Management
              </span>
              <span
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "#334155",
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: "10px", color: "#475569", fontWeight: 500 }}
              >
                {isEdit ? "Edit User" : "New User · Stripe Checkout"}
              </span>
            </div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Edit User" : "Add New User"}
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Validation error inline */}
          {submitError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.2)",
                color: "#f43f5e",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              <AlertCircle size={13} />
              {submitError}
            </div>
          )}
          <button
            onClick={() => navigate("/users")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748b",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e2e8f0";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
              boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
              transition: "filter 0.2s, transform 0.15s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = "brightness(1)")
            }
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.97)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {loading
              ? "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create & Send Link"}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* ── SIDEBAR ── */}
        <aside>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              marginBottom: "16px",
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    background: active
                      ? "rgba(16,185,129,0.08)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(16,185,129,0.2)"
                      : "1px solid transparent",
                    color: active ? "#e2e8f0" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      color: active ? "#34d399" : "#475569",
                      flexShrink: 0,
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      flex: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.label}
                  </span>
                  {active && (
                    <ChevronRight
                      size={11}
                      style={{ color: "#34d399", flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Stripe notice card */}
          <div
            className="vd-card"
            style={{
              padding: "14px 16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "#10b981",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "7px",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#34d399",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Stripe Checkout
              </span>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "#64748b",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              After creating the user, Stripe will generate a secure payment
              link and email it automatically. No card data is handled by this
              dashboard.
            </p>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* PERSONAL */}
          {activeTab === "personal" && (
            <>
              <FS
                title="Personal information"
                desc="Configure the user's personal details and profile photo."
              >
                <FR
                  icon={<User size={14} />}
                  label="Full name"
                  placeholder="John Carter"
                  value={form.displayName}
                  onChange={(v) => set("displayName", v)}
                  required
                />
                <Div />
                <FR
                  icon={<Mail size={14} />}
                  label="Email"
                  placeholder="john@dashdark.com"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  required
                />
                <Div />
                {/* Photo */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "18px 0",
                  }}
                >
                  <div
                    style={{
                      width: "150px",
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      flexShrink: 0,
                      paddingTop: "2px",
                    }}
                  >
                    <ImageIcon size={14} style={{ color: "#475569" }} />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      Photo
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          border: "2px solid rgba(16,185,129,0.45)",
                          padding: "2px",
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "#f43f5e",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Remove
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "22px 16px",
                        borderRadius: "14px",
                        border: "1px dashed rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)")
                      }
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          background: "rgba(16,185,129,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "8px",
                          color: "#34d399",
                        }}
                      >
                        <ImageIcon size={16} />
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#e2e8f0",
                          margin: "0 0 3px",
                        }}
                      >
                        <span style={{ color: "#34d399" }}>
                          Click to upload
                        </span>{" "}
                        or drag & drop
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#475569",
                          margin: 0,
                        }}
                      >
                        SVG, PNG, JPG (max 800×400px)
                      </p>
                    </div>
                  </div>
                </div>
                <Div />
                <FR
                  icon={<Briefcase size={14} />}
                  label="Short bio"
                  placeholder="Write a short bio..."
                  isTextarea
                  value={form.shortBio}
                  onChange={(v) => set("shortBio", v)}
                />
              </FS>

              <FS
                title="Basic information"
                desc="Contact and location details."
              >
                <FR
                  icon={<Phone size={14} />}
                  label="Phone"
                  placeholder="(123) 456-7890"
                  value={form.phoneNumber}
                  onChange={(v) => set("phoneNumber", v)}
                />
                <Div />
                <FR
                  icon={<Briefcase size={14} />}
                  label="Position"
                  placeholder="CEO & Founder"
                  value={form.position}
                  onChange={(v) => set("position", v)}
                />
                <Div />
                <FR
                  icon={<MapPin size={14} />}
                  label="Location"
                  placeholder="New York, NY"
                  value={form.location}
                  onChange={(v) => set("location", v)}
                />
                <Div />
                <FR
                  icon={<Globe size={14} />}
                  label="Website"
                  placeholder="dashdark.com"
                  value={form.website}
                  onChange={(v) => set("website", v)}
                />
              </FS>
            </>
          )}

          {/* TEAM */}
          {activeTab === "team" && (
            <FS
              title="Team information"
              desc="Configure the user's team, rank and office assignment."
            >
              <FR
                icon={<Users size={14} />}
                label="Team Name"
                placeholder="Product Design"
                value={form.teamName}
                onChange={(v) => set("teamName", v)}
              />
              <Div />
              <FR
                icon={<Briefcase size={14} />}
                label="Rank"
                placeholder="Senior Expert"
                value={form.rank}
                onChange={(v) => set("rank", v)}
              />
              <Div />
              <FR
                icon={<MapPin size={14} />}
                label="Office"
                placeholder="Main HQ"
                value={form.office}
                onChange={(v) => set("office", v)}
              />
              <Div />
              <FR
                icon={<Mail size={14} />}
                label="Business email"
                placeholder="team@dashdark.com"
                value={form.businessEmail}
                onChange={(v) => set("businessEmail", v)}
              />
            </FS>
          )}

          {/* ── PLAN (Stripe plan selector) ── */}
          {activeTab === "plan" && (
            <FS
              title="Subscription Plan"
              desc="Select the Stripe plan this user will be billed for. A checkout link will be emailed to them automatically."
            >
              {plansLoading ? (
                <div
                  style={{
                    padding: "40px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "#475569",
                  }}
                >
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: "#10b981" }}
                  />{" "}
                  Loading plans from Stripe…
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "12px",
                    padding: "16px 0",
                  }}
                >
                  {plans.map((plan) => {
                    const ac = planAccent(plan.name);
                    const sel = form.planId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => set("planId", plan.id)}
                        style={{
                          borderRadius: "14px",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          border: sel
                            ? `1px solid ${ac.border}`
                            : "1px solid rgba(255,255,255,0.06)",
                          background: sel ? ac.bg : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div
                          style={{
                            height: "3px",
                            background: ac.color,
                            opacity: sel ? 0.9 : 0.3,
                          }}
                        />
                        <div
                          style={{
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#475569",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              marginBottom: "5px",
                            }}
                          >
                            Stripe Plan
                          </span>
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#e2e8f0",
                              marginBottom: "4px",
                            }}
                          >
                            {plan.name}
                          </h4>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: 800,
                              color: sel ? ac.color : "#64748b",
                              marginBottom: "14px",
                            }}
                          >
                            ${plan.price}
                            <span
                              style={{
                                fontSize: "10px",
                                opacity: 0.45,
                                fontWeight: 400,
                              }}
                            >
                              /{plan.interval}
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              marginBottom: "12px",
                            }}
                          >
                            {Object.entries(plan.features || {}).map(
                              ([k, v]: any, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    fontSize: "10px",
                                    color: "#64748b",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: "13px",
                                      height: "13px",
                                      minWidth: "13px",
                                      borderRadius: "4px",
                                      background: sel
                                        ? `${ac.color}18`
                                        : "rgba(255,255,255,0.04)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: sel ? ac.color : "#475569",
                                    }}
                                  >
                                    <Check size={8} />
                                  </span>
                                  <span className="capitalize">{k}:</span>
                                  <span
                                    style={{
                                      color: "#e2e8f0",
                                      fontWeight: 600,
                                      marginLeft: "auto",
                                    }}
                                  >
                                    {v.toString()}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                          {sel && (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                color: ac.color,
                                background: `${ac.color}15`,
                                border: `1px solid ${ac.border}`,
                              }}
                            >
                              <Check size={8} /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stripe checkout info banner */}
              <div
                style={{
                  margin: "4px 0 16px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    minWidth: "28px",
                    borderRadius: "7px",
                    background: "rgba(59,130,246,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3b82f6",
                  }}
                >
                  <CreditCard size={13} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#93c5fd",
                      marginBottom: "3px",
                    }}
                  >
                    Stripe Checkout — No card data stored here
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#475569",
                      margin: 0,
                      lineHeight: "1.6",
                    }}
                  >
                    After creating the user, Stripe generates a secure hosted
                    checkout page. The link is emailed to the user — they enter
                    their card directly on Stripe's servers. Your dashboard
                    never handles card data.
                  </p>
                </div>
              </div>
            </FS>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <FS
              title="Notification preferences"
              desc="Choose how the user receives updates and alerts."
            >
              {NOTIF_ITEMS.map((item, idx) => {
                const ns = (form.notificationSettings as any)[item.id];
                const isLast = idx === NOTIF_ITEMS.length - 1;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "18px 0",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {item.label}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {(["inApp", "email"] as const).map((type) => {
                        const on = ns[type];
                        return (
                          <button
                            key={type}
                            onClick={() => toggleNotif(item.id, type)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              border: on
                                ? "1px solid rgba(16,185,129,0.3)"
                                : "1px solid rgba(255,255,255,0.07)",
                              background: on
                                ? "rgba(16,185,129,0.1)"
                                : "rgba(255,255,255,0.03)",
                              color: on ? "#34d399" : "#475569",
                            }}
                          >
                            {type === "inApp" ? (
                              <Bell size={11} />
                            ) : (
                              <Mail size={11} />
                            )}
                            {type === "inApp" ? "In-app" : "Email"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </FS>
          )}
        </main>
      </div>
    </div>
  );
};

/* ── Micro-components ── */

const FS = ({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) => (
  <div>
    <div style={{ marginBottom: "10px" }}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#e2e8f0",
          marginBottom: "2px",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>{desc}</p>
    </div>
    <div
      className="vd-card"
      style={{ padding: "0 28px", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg,rgba(16,185,129,0.3),transparent)",
        }}
      />
      {children}
    </div>
  </div>
);

const FR = ({
  icon,
  label,
  placeholder,
  isTextarea,
  type,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  isTextarea?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) => (
  <div style={{ display: "flex", alignItems: "center", padding: "18px 0" }}>
    <div
      style={{
        width: "150px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#475569", display: "flex" }}>{icon}</span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#94a3b8",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#f43f5e", marginLeft: "2px" }}>*</span>
        )}
      </span>
    </div>
    <div style={{ flex: 1 }}>
      {isTextarea ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "9px",
            resize: "none",
            lineHeight: "1.6",
            outline: "none",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#e2e8f0",
            fontSize: "14px",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.07)")
          }
        />
      ) : (
        <input
          type={type || "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "9px",
            outline: "none",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#e2e8f0",
            fontSize: "14px",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.07)")
          }
        />
      )}
    </div>
  </div>
);

const Div = () => (
  <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
);

export default AddUser;

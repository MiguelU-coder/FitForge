import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomSelect from "./CustomSelect";
import {
  Building2,
  User,
  Globe,
  Save,
  X,
  Shield,
  CreditCard,
  ImageIcon,
  Mail,
  Phone,
  ArrowUp,
  Bell,
  Check,
  ChevronRight,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Send,
  MapPin,
  ChevronDown,
} from "lucide-react";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3000/api/v1";

const TABS = [
  { id: "general", label: "Basic Information", icon: <Building2 size={14} /> },
  { id: "branding", label: "Branding & Logo", icon: <ImageIcon size={14} /> },
  { id: "plan", label: "Subscription Plan", icon: <CreditCard size={14} /> },
  { id: "admin", label: "Initial Admin", icon: <Shield size={14} /> },
];

const planAccent = (name = "") => {
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

const AddOrganization: React.FC<{ session?: any }> = ({ session }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [stripeResult, setStripeResult] = useState<{
    checkoutUrl: string;
    orgName: string;
    orgEmail: string;
    generatedPassword?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    location: "",
    website: "",
    brandName: "",
    description: "",
    planId: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    logoUrl: "https://i.pravatar.cc/150?u=gym",
  });

  // Location
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    axios
      .get("https://countriesnow.space/api/v0.1/countries")
      .then(({ data }) => {
        if (!data.error) setCountries(data.data);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const obj = countries.find((c) => c.country === selectedCountry);
      setCities(obj ? obj.cities : []);
      setSelectedCity("");
    }
  }, [selectedCountry, countries]);

  useEffect(() => {
    if (selectedCountry && selectedCity)
      setForm((p) => ({
        ...p,
        location: `${selectedCity}, ${selectedCountry}`,
      }));
    else if (selectedCountry)
      setForm((p) => ({ ...p, location: selectedCountry }));
  }, [selectedCountry, selectedCity]);

  useEffect(() => {
    setPlansLoading(true);
    axios
      .get(`${API_URL}/billing/plans`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      .then(({ data }) => {
        const list = data.data || data;
        setPlans(list);
        if (list.length > 0) setForm((p) => ({ ...p, planId: list[0].id }));
      })
      .catch((e) => console.error(e))
      .finally(() => setPlansLoading(false));
  }, [session]);

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const validate = () => {
    if (!form.name.trim()) return "Organization name is required.";
    if (!form.email.trim() || !form.email.includes("@"))
      return "A valid email is required.";
    if (!form.planId) return "Please select a subscription plan.";
    if (!form.adminEmail.trim() || !form.adminEmail.includes("@"))
      return "Admin email is required in the Initial Admin tab.";
    if (!form.adminFirstName.trim())
      return "Admin first name is required in the Initial Admin tab.";
    return null;
  };

  const handleCreate = async () => {
    setSubmitError(null);
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    setLoading(true);
    try {
      const slug = form.name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      const { data } = await axios.post(
        `${API_URL}/organizations`,
        {
          name: form.name,
          slug,
          email: form.email,
          phone: form.phone,
          position: form.position,
          location: form.location,
          website: form.website,
          brandName: form.brandName,
          description: form.description,
          logoUrl: form.logoUrl,
          planId: form.planId,
          adminFirstName: form.adminFirstName,
          adminLastName: form.adminLastName,
          adminEmail: form.adminEmail,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      const responsePayload = data.data || data;
      setStripeResult({
        checkoutUrl: responsePayload.checkoutUrl,
        orgName: form.name,
        orgEmail: form.adminEmail || form.email,
        generatedPassword: responsePayload.generatedPassword,
      });
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.message ||
          e.message ||
          "Failed to create organization.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
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
              Organization created successfully
            </h2>
            <p
              style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}
            >
              <strong style={{ color: "#94a3b8" }}>
                {stripeResult.orgName}
              </strong>{" "}
              has been onboarded. A Stripe checkout link has been{" "}
              <strong style={{ color: "#94a3b8" }}>
                emailed automatically
              </strong>{" "}
              to{" "}
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {stripeResult.orgEmail}
              </span>
              .
            </p>

            <div style={{ marginTop: "20px", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "left" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Default Admin Credentials</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Email:</span>
                <span style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 500 }}>{stripeResult.orgEmail}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Password:</span>
                <span style={{ color: "#10b981", fontSize: "14px", fontWeight: 600, fontFamily: "monospace", letterSpacing: "1px" }}>{stripeResult.generatedPassword}</span>
              </div>
              <p style={{ marginTop: "12px", marginBottom: 0, fontSize: "11px", color: "#64748b" }}>Please securely share these credentials with the client. After payment, they can use these to log into the dashboard.</p>
            </div>
          </div>

          {/* Checkout URL */}
          <div
            className="vd-card"
            style={{
              padding: "24px",
              width: "100%",
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(16,185,129,0.02) 100%)",
              border: "1px solid rgba(16,185,129,0.18)",
              borderRadius: "18px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                opacity: 0.05,
              }}
            >
              <CreditCard size={100} />
            </div>
            <p
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: "#34d399",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Action Required · Stripe Checkout
            </p>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                fontFamily: "monospace",
                wordBreak: "break-all",
                marginBottom: "18px",
                lineHeight: "1.6",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {stripeResult.checkoutUrl}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(stripeResult.checkoutUrl)
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e2e8f0";
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
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
                  padding: "10px",
                  borderRadius: "10px",
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                }}
              >
                Open Checkout <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* WhatsApp share */}
          <div style={{ width: "100%" }}>
            <button
              onClick={() => {
                const text = `Hi ${stripeResult.orgName}, here is your Stripe Checkout link to activate your organization: ${stripeResult.checkoutUrl}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(text)}`,
                  "_blank",
                );
              }}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "12px",
                border: "1px solid rgba(34,197,94,0.2)",
                background: "rgba(34,197,94,0.05)",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Send via WhatsApp
            </button>
          </div>

          {/* What happens next */}
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
                text: "Owner receives the checkout link by email",
              },
              {
                icon: <CreditCard size={12} />,
                color: "#8b5cf6",
                text: "Owner enters card details on Stripe's secure page",
              },
              {
                icon: <CheckCircle2 size={12} />,
                color: "#10b981",
                text: "Stripe webhook activates the subscription instantly",
              },
              {
                icon: <Building2 size={12} />,
                color: "#f59e0b",
                text: "Organization gets full access to the platform",
              },
            ].map((s, i) => (
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
                    background: `${s.color}15`,
                    border: `1px solid ${s.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              onClick={() => {
                setStripeResult(null);
                setForm((p) => ({
                  ...p,
                  name: "",
                  email: "",
                  adminEmail: "",
                  adminPassword: "",
                  planId: plans[0]?.id || "",
                }));
                setActiveTab("general");
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
              Add Another Organization
            </button>
            <button
              onClick={() => navigate("/organizations")}
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
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              Back to Organizations
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
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/organizations")}
            className="w-9 h-9 rounded-xl border border-white-05 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            style={{ flexShrink: 0 }}
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
                Global Master Suite
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
                Phase 01 / Tenant Setup · Stripe Checkout
              </span>
            </div>
            <h1 className="text-3xl font-bold">Onboard New Organization</h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                maxWidth: "280px",
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {submitError}
            </div>
          )}
          <button
            onClick={() => navigate("/organizations")}
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
            onClick={handleCreate}
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
              background: "linear-gradient(135deg,#10b981,#059669)",
              boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
              transition: "filter 0.2s",
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
            {loading ? "Creating…" : "Generate Tenant"}
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* SIDEBAR */}
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
                position: "absolute",
                bottom: "-10px",
                right: "-6px",
                opacity: 0.04,
                pointerEvents: "none",
              }}
            >
              <Bell size={60} />
            </div>
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
                  flexShrink: 0,
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
              After creation, Stripe generates a secure payment link emailed to
              the admin. No card data is handled here.
            </p>
          </div>
        </aside>

        {/* FORM */}
        <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* GENERAL */}
          {activeTab === "general" && (
            <>
              <FS
                title="Organization information"
                desc="Configure the fundamental business parameters for this fitness tenant."
              >
                <FR
                  icon={<Building2 size={14} />}
                  label="Full name"
                  placeholder="Iron Temple Gym"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  required
                />
                <Div />
                <FR
                  icon={<Mail size={14} />}
                  label="Email address"
                  placeholder="contact@gym.com"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  required
                />
              </FS>
              <FS
                title="Basic information"
                desc="Provide additional details to complete the organization profile."
              >
                <FR
                  icon={<Phone size={14} />}
                  label="Phone"
                  placeholder="(123) 456-7890"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                />
                <Div />
                <FR
                  icon={<Building2 size={14} />}
                  label="Position"
                  placeholder="CEO & Founder"
                  value={form.position}
                  onChange={(v) => set("position", v)}
                />
                <Div />
                {/* Country select */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 0",
                  }}
                >
                  <div
                    style={{
                      width: "155px",
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      flexShrink: 0,
                    }}
                  >
                    <Globe size={14} style={{ color: "#475569" }} />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      Country
                    </span>
                  </div>
                  <CustomSelect
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    options={countries.map((c) => ({
                      value: c.country,
                      label: c.country,
                    }))}
                    placeholder="Select a country…"
                  />
                </div>
                <Div />
                {/* City select */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 0",
                  }}
                >
                  <div
                    style={{
                      width: "155px",
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={14} style={{ color: "#475569" }} />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      City
                    </span>
                  </div>
                  <CustomSelect
                    value={selectedCity}
                    onChange={setSelectedCity}
                    options={cities.map((c) => ({ value: c, label: c }))}
                    placeholder={
                      selectedCountry
                        ? "Select a city…"
                        : "Select country first"
                    }
                    disabled={!selectedCountry}
                  />
                </div>
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

          {/* BRANDING */}
          {activeTab === "branding" && (
            <FS
              title="Branding & Identity"
              desc="Set the organization's unique brand assets for app white-labeling."
            >
              <FR
                icon={<User size={14} />}
                label="Brand name"
                placeholder="Iron Temple"
                value={form.brandName}
                onChange={(v) => set("brandName", v)}
              />
              <Div />
              <FR
                icon={<Mail size={14} />}
                label="Contact email"
                placeholder="brand@gym.com"
                value={form.email}
                onChange={(v) => set("email", v)}
              />
              <Div />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  padding: "18px 0",
                }}
              >
                <div
                  style={{
                    width: "155px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexShrink: 0,
                    paddingTop: "2px",
                  }}
                >
                  <ImageIcon size={14} style={{ color: "#475569" }} />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#94a3b8",
                    }}
                  >
                    Logo
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
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        border: "2px solid rgba(16,185,129,0.4)",
                        padding: "2px",
                      }}
                    >
                      <img
                        src="https://i.pravatar.cc/150?u=gym"
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
                      padding: "24px 16px",
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
                        background: "rgba(16,185,129,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                        color: "#34d399",
                      }}
                    >
                      <ArrowUp size={16} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#e2e8f0",
                        margin: "0 0 3px",
                      }}
                    >
                      <span style={{ color: "#34d399" }}>Click to upload</span>{" "}
                      or drag & drop
                    </p>
                    <p
                      style={{ fontSize: "10px", color: "#475569", margin: 0 }}
                    >
                      SVG, PNG, JPG (max 800×400px)
                    </p>
                  </div>
                </div>
              </div>
              <Div />
              <FR
                icon={<Building2 size={14} />}
                label="Description"
                placeholder="Write a short bio..."
                isTextarea
                value={form.description}
                onChange={(v) => set("description", v)}
              />
            </FS>
          )}

          {/* PLAN */}
          {activeTab === "plan" && (
            <FS
              title="Subscription Plan"
              desc="Select the Stripe plan for this organization. A checkout link will be emailed to the admin automatically."
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
                    padding: "12px 0",
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
                              fontSize: "16px",
                              fontWeight: 800,
                              color: "#e2e8f0",
                              marginBottom: "4px",
                            }}
                          >
                            {plan.name}
                          </h4>
                          <div
                            style={{
                              fontSize: "24px",
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
                              /mo
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: "7px",
                              marginBottom: "12px",
                            }}
                          >
                            {Object.values(plan.features || {}).map(
                              (f: any, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    fontSize: "11px",
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
                                  {f.toString()}
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
                    After creating the organization, Stripe generates a secure
                    hosted checkout page. The link is emailed to the admin —
                    they enter their card directly on Stripe's servers.
                  </p>
                </div>
              </div>
            </FS>
          )}

          {/* ADMIN */}
          {activeTab === "admin" && (
            <FS
              title="Master Administrator"
              desc="Primary administrative entity for this tenant's management portal."
            >
              <FR
                icon={<User size={14} />}
                label="First name"
                placeholder="Robert"
                value={form.adminFirstName}
                onChange={(v) => set("adminFirstName", v)}
                required
              />
              <Div />
              <FR
                icon={<User size={14} />}
                label="Last name"
                placeholder="Evans"
                value={form.adminLastName}
                onChange={(v) => set("adminLastName", v)}
              />
              <Div />
              <FR
                icon={<Mail size={14} />}
                label="Email"
                placeholder="robert@evans-gym.com"
                value={form.adminEmail}
                onChange={(v) => set("adminEmail", v)}
                required
              />
              <Div />
              <div style={{ marginTop: "1rem", padding: "12px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#34d399", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={14} />
                  A secure default password will be automatically generated.
                </p>
              </div>
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
        width: "155px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#475569", display: "flex", alignItems: "center" }}>
        {icon}
      </span>
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
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(16,185,129,0.45)")
          }
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
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(16,185,129,0.45)")
          }
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

export default AddOrganization;

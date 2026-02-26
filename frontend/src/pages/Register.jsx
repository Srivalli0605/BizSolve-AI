import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomCursor from "../components/CustomCursor";
import axios from "axios";
import "../styles/Auth.css";

const CATEGORIES = [
  "Retail", "Food & Beverage", "Fashion", "Technology",
  "Health & Wellness", "Education", "Real Estate",
  "Finance", "Creative & Design", "Consulting", "Other",
];

const TONES = ["Professional", "Friendly", "Bold", "Playful", "Luxury", "Minimal"];
const STYLES = ["Modern & Clean", "Bold & Vibrant", "Elegant & Refined", "Playful & Fun", "Minimal & Subtle", "Vintage & Classic"];
const GOALS = ["Increase Sales", "Build Brand Awareness", "Generate Leads", "Launch a New Product", "Grow Online Presence", "Other"];

const STEPS = [
  { num: "01", label: "Account", desc: "Your login credentials" },
  { num: "02", label: "Business", desc: "Basic business info" },
  { num: "03", label: "Audience", desc: "Who you're targeting" },
  { num: "04", label: "Brand", desc: "Your visual identity" },
];

const LEFT_CONTENT = [
  { title: "Let's get you started.", sub: "Create your account credentials. You'll use these to log in to BizSolve every time." },
  { title: "Tell us about your business.", sub: "This helps our AI generate websites, campaigns, and content tailored specifically for you." },
  { title: "Who's your audience?", sub: "Understanding your customers lets us craft messaging that actually resonates and converts." },
  { title: "Define your brand identity.", sub: "Your style, tone, and colors shape everything we create — let's make it uniquely yours." },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Step 0
    name: "", email: "", password: "",
    // Step 1
    business_name: "", category: "", custom_category: "", description: "", location: "", offerings: "",
    // Step 2
    target_audience: "", primary_goal: "",
    // Step 3
    brand_tone: "Professional", preferred_style: "Modern & Clean", brand_colors: "",
  });

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.email || !form.password) { setError("Please fill in all fields."); return false; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    }
    if (step === 1) {
      if (!form.business_name || !form.category) { setError("Business name and category are required."); return false; }
      if (form.category === "Other" && !form.custom_category.trim()) { setError("Please specify your category."); return false; }
    }
    if (step === 2 && !form.target_audience) { setError("Please describe your target audience."); return false; }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        business_name: form.business_name,
        // If "Other" selected, use the typed custom category
        category: form.category === "Other" ? form.custom_category.trim() : form.category,
        description: form.description,
        location: form.location,
        offerings: form.offerings,
        target_audience: form.target_audience,
        primary_goal: form.primary_goal,
        brand_tone: form.brand_tone,
        preferred_style: form.preferred_style,
        brand_colors: form.brand_colors,
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, payload);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <>
      <CustomCursor />
      <div className="auth-page">

        {/* ── LEFT ── */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <Link to="/" className="logo"><div className="logo-dot" />BizSolve</Link>

            <div className="auth-left-content">
              <div className="auth-steps">
                {STEPS.map((s, i) => (
                  <div key={i}>
                    <div className={`auth-step ${step >= i ? "active" : ""} ${step === i ? "current" : ""}`}>
                      <div className="auth-step-num">
                        {step > i
                          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : s.num}
                      </div>
                      <div>
                        <div className="auth-step-label">{s.label}</div>
                        <div className="auth-step-sublabel">{s.desc}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div className={`auth-step-connector ${step > i ? "done" : ""}`} />}
                  </div>
                ))}
              </div>

              <div className="auth-left-text" key={step}>
                <div className="auth-big-title">{LEFT_CONTENT[step].title}</div>
                <div className="auth-big-sub">{LEFT_CONTENT[step].sub}</div>
              </div>
            </div>

            <div className="auth-left-footer">© 2025 BizSolve · AI Business Toolkit</div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <Link to="/" className="logo auth-mobile-logo"><div className="logo-dot" />BizSolve</Link>

            {/* Progress */}
            <div className="auth-progress-bar">
              <div className="auth-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
            <div className="auth-progress-label">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</div>

            {error && <div className="auth-error">{error}</div>}

            {/* ── STEP 0: Account ── */}
            {step === 0 && (
              <form onSubmit={handleNext}>
                <div className="auth-heading">Create your account</div>
                <div className="auth-sub">Start with your login credentials</div>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input type="text" name="name" className="form-input" placeholder="Jane Smith" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="form-submit">Continue <ArrowIcon /></button>
                <div className="auth-switch">Already have an account? <Link to="/login" className="auth-switch-link">Sign in</Link></div>
              </form>
            )}

            {/* ── STEP 1: Business ── */}
            {step === 1 && (
              <form onSubmit={handleNext}>
                <div className="auth-heading">Your business</div>
                <div className="auth-sub">Tell us what you do</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Business name</label>
                    <input type="text" name="business_name" className="form-input" placeholder="Acme Co." value={form.business_name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input type="text" name="location" className="form-input" placeholder="City, Country" value={form.location} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input form-select" value={form.category} onChange={handleChange} required>
                    <option value="" disabled>Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Show text input when "Other" is selected */}
                {form.category === "Other" && (
                  <div className="form-group">
                    <label className="form-label">Specify your category</label>
                    <input type="text" name="custom_category" className="form-input" placeholder="e.g. Pet Care, Event Planning..." value={form.custom_category} onChange={handleChange} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-input form-textarea" placeholder="What does your business do?" value={form.description} onChange={handleChange} rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Products / Services offered</label>
                  <textarea name="offerings" className="form-input form-textarea" placeholder="e.g. Handmade candles, workshops, online courses..." value={form.offerings} onChange={handleChange} rows={2} />
                </div>
                <div className="auth-step-actions">
                  <button type="button" className="btn-back" onClick={() => setStep(0)}>← Back</button>
                  <button type="submit" className="form-submit" style={{ flex: 1 }}>Continue <ArrowIcon /></button>
                </div>
              </form>
            )}

            {/* ── STEP 2: Audience ── */}
            {step === 2 && (
              <form onSubmit={handleNext}>
                <div className="auth-heading">Your audience</div>
                <div className="auth-sub">Who are you speaking to?</div>
                <div className="form-group">
                  <label className="form-label">Target audience</label>
                  <textarea name="target_audience" className="form-input form-textarea" placeholder="e.g. Young professionals aged 25–35 interested in wellness..." value={form.target_audience} onChange={handleChange} rows={4} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary goal</label>
                  <div className="chip-grid">
                    {GOALS.map((g) => (
                      <button key={g} type="button"
                        className={`chip ${form.primary_goal === g ? "active" : ""}`}
                        onClick={() => { setForm({ ...form, primary_goal: g }); setError(""); }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="auth-step-actions">
                  <button type="button" className="btn-back" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="form-submit" style={{ flex: 1 }}>Continue <ArrowIcon /></button>
                </div>
              </form>
            )}

            {/* ── STEP 3: Brand ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <div className="auth-heading">Brand identity</div>
                <div className="auth-sub">Shape your visual presence</div>
                <div className="form-group">
                  <label className="form-label">Brand tone</label>
                  <div className="chip-grid">
                    {TONES.map((t) => (
                      <button key={t} type="button"
                        className={`chip ${form.brand_tone === t ? "active" : ""}`}
                        onClick={() => setForm({ ...form, brand_tone: t })}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred style</label>
                  <div className="chip-grid">
                    {STYLES.map((s) => (
                      <button key={s} type="button"
                        className={`chip ${form.preferred_style === s ? "active" : ""}`}
                        onClick={() => setForm({ ...form, preferred_style: s })}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Brand colors <span className="form-label-hint">(optional)</span></label>
                  <input type="text" name="brand_colors" className="form-input" placeholder="e.g. #B22222, Navy Blue, Gold" value={form.brand_colors} onChange={handleChange} />
                </div>
                <div className="auth-step-actions">
                  <button type="button" className="btn-back" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className="form-submit" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <span className="btn-spinner" /> : <>Create account <ArrowIcon /></>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
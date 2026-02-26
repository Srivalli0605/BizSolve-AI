import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomCursor from "../components/CustomCursor";
import axios from "axios";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomCursor />
      <div className="auth-page">

        {/* LEFT */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <Link to="/" className="logo"><div className="logo-dot" />BizSolve</Link>

            <div className="auth-left-content">
              <div className="auth-big-title">Good to see<br />you again.</div>
              <div className="auth-big-sub">
                Sign back in and pick up right where you left off. Your business toolkit is waiting.
              </div>

              <div className="auth-login-features">
                {[
                  { icon: "⚡", text: "AI-generated websites & campaigns" },
                  { icon: "📦", text: "Product & brand management" },
                  { icon: "📬", text: "Bulk email with real analytics" },
                  { icon: "🗂️", text: "Brand vault for all your assets" },
                ].map((f, i) => (
                  <div key={i} className="auth-login-feature">
                    <span className="auth-login-feature-icon">{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-left-footer">© 2025 BizSolve · AI Business Toolkit</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div className="auth-form-wrap auth-form-wrap--login">
            <Link to="/" className="logo auth-mobile-logo"><div className="logo-dot" />BizSolve</Link>

            <div className="auth-heading">Welcome back</div>
            <div className="auth-sub">Sign in to your BizSolve account</div>

            <button type="button" className="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider"><span>or sign in with email</span></div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input form-input--lg" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Password</label>
                  <span className="form-label-hint" style={{ cursor: "none" }}>Forgot password?</span>
                </div>
                <input type="password" name="password" className="form-input form-input--lg" placeholder="••••••••" value={form.password} onChange={handleChange} required />
              </div>
              <button type="submit" className="form-submit form-submit--lg" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : <>Sign in <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></>}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?{" "}
              <Link to="/register" className="auth-switch-link">Create one free</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
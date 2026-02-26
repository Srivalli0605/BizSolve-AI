import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Modal({ isOpen, onClose, defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setTab(defaultTab); setError(""); }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form);
      localStorage.setItem("token", res.data.access_token);
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : ""}`}
      onClick={(e) => { if (e.target.classList.contains("modal-overlay")) onClose(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-accent-line" />

        {tab === "login" ? (
          <>
            <div className="modal-title">Welcome back</div>
            <div className="modal-sub">Sign in to your account</div>
          </>
        ) : (
          <>
            <div className="modal-title">Get started</div>
            <div className="modal-sub">Create your BizSolve account</div>
          </>
        )}

        <div className="tab-bar">
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Log in</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => { onClose(); navigate("/register"); }}>Register</button>
        </div>

        {/* LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            {error && <div className="modal-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Sign in"}
            </button>
            <div className="switch-text">
              No account yet?{" "}
              <button type="button" className="switch-link" onClick={() => { onClose(); navigate("/register"); }}>
                Create one
              </button>
            </div>
          </form>
        )}

        {/* REGISTER — redirect to full page */}
        {tab === "register" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 300, marginBottom: "20px", lineHeight: 1.6 }}>
              Registration takes just a few steps — we'll set up your account and business profile together.
            </p>
            <button
              className="form-submit"
              onClick={() => { onClose(); navigate("/register"); }}
            >
              Begin registration →
            </button>
            <div className="switch-text" style={{ marginTop: "16px" }}>
              Already have an account?{" "}
              <button type="button" className="switch-link" onClick={() => setTab("login")}>Sign in</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
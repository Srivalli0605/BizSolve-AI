import { useState, useEffect } from "react";

export default function Modal({ isOpen, onClose, defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);

  // Sync tab when modal opens with a specific defaultTab
  useEffect(() => {
    if (isOpen) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : ""}`}
      onClick={(e) => { if (e.target.classList.contains("modal-overlay")) onClose(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Top accent line */}
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

        {/* Tab bar */}
        <div className="tab-bar">
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>
            Log in
          </button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>
            Register
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            <button type="submit" className="form-submit">Sign in</button>
            <div className="switch-text">
              No account yet?{" "}
              <button type="button" className="switch-link" onClick={() => setTab("register")}>
                Create one
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" className="form-input" placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Create a strong password" />
            </div>
            <button type="submit" className="form-submit">Create account</button>
            <div className="switch-text">
              Already have an account?{" "}
              <button type="button" className="switch-link" onClick={() => setTab("login")}>
                Log in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
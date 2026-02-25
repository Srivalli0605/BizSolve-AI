import { useState, useEffect } from "react";
import CustomCursor from "../components/CustomCursor";
import Modal from "../components/Modal";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: "Website Generator",
    desc: "AI builds your site from brand details. Deploy instantly, modify and re-publish with version tracking.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
    title: "Email Campaigns",
    desc: "Generate compelling email copy with AI, upload contacts, and send bulk campaigns with live analytics.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    title: "Product Manager",
    desc: "Add, edit, and showcase products with images and descriptions — synced directly to your website.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        <rect x="2" y="4" width="20" height="16" rx="2" />
      </svg>
    ),
    title: "Poster Generator",
    desc: "Create stunning marketing visuals powered by Gemini's image generation in seconds.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "AI Chatbot",
    desc: "Embed a smart AI assistant on your website that knows your brand and answers customer questions 24/7.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
    title: "Brand Vault",
    desc: "Store brand assets, notes, files, and images in a smart, organized file system — your brand's single source of truth.",
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fade-in observer
  useEffect(() => {
    const els = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const openModal = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <CustomCursor />

      {/* NAV */}
      <nav className={scrolled ? "scrolled" : ""}>
        <a href="/" className="logo">
          <div className="logo-dot" />
          BizSolve
        </a>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => openModal("login")}>Log in</button>
          <button className="btn-primary" onClick={() => openModal("register")}>Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-eyebrow">
          <span className="eyebrow-line" />
          AI-Powered Business Toolkit
          <span className="eyebrow-line" />
        </div>
        <h1 className="hero-title">
          Your business,{" "}
          <em className="accent-word">fully powered</em>{" "}
          by AI.
        </h1>
        <p className="hero-sub">
          Launch websites, run campaigns, manage products, and grow your brand — all from one elegant platform.
        </p>
        <div className="hero-cta">
          <button className="btn-large" onClick={() => openModal("register")}>
            Start for free
            <svg className="arrow-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a href="#features" className="btn-outline">See features</a>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-num">8+</span>
            <span className="stat-label">AI Tools</span>
          </div>
          <div className="stat">
            <span className="stat-num">∞</span>
            <span className="stat-label">Scale</span>
          </div>
          <div className="stat">
            <span className="stat-num">1</span>
            <span className="stat-label">Platform</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features fade-in" id="features">
        <div className="section-label">What's inside</div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section fade-in">
        <div className="cta-box">
          <h2 className="cta-title">
            Ready to grow your<br />
            <span className="accent-word">business?</span>
          </h2>
          <p className="cta-sub">Join forward-thinking business owners using AI to work smarter, not harder.</p>
          <button className="btn-large" onClick={() => openModal("register")}>
            Create free account
            <svg className="arrow-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-left">BizSolve</div>
        <div className="footer-right">© 2025 · Built for the future of small business</div>
      </footer>

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={modalTab}
      />
    </>
  );
}
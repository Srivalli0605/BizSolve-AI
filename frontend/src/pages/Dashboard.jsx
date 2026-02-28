import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import CustomCursor from "../components/CustomCursor";
import axios from "axios";
import "../styles/Dashboard.css";
import { useTheme } from "../context/ThemeContext";
import ChatPage from "./ChatPage";
import ChatHistoryPage from "./ChatHistoryPage";

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg> },
  { id: "website",      label: "Website",      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M2 7h16M6 3v4"/></svg> },
  { id: "products",     label: "Products",     icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14"/></svg> },
  { id: "posters",      label: "Posters",      icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M2 13l4-4 3 3 3-4 6 6"/></svg> },
  { id: "campaigns",    label: "Campaigns",    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M2 7l8 5 8-5"/></svg> },
  { id: "chatbot",      label: "BizWiser",     icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 10c0 3.866-3.134 7-7 7a6.98 6.98 0 01-3.5-.937L3 17l.937-3.5A6.98 6.98 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z"/></svg> },
  { id: "chat-history", label: "Chat History", icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V5a1 1 0 011-1z"/><path d="M6 8h8M6 11h5"/></svg> },
  { id: "vault",        label: "Brand Vault",  icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M7 4V2M13 4V2M3 8h14"/></svg> },
];

const QUICK_ACTIONS = [
  { label: "Generate Website", sub: "AI builds your site",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,                                                                                                nav: "website",   color: "#e8d5a3" },
  { label: "Create Poster",    sub: "Gemini image gen",         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 4 4"/></svg>,                                                                                               nav: "posters",   color: "#c9a96e" },
  { label: "Email Campaign",   sub: "AI-written emails",        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M3 6l9 7 9-7"/></svg>,                                                                           nav: "campaigns", color: "#e8d5a3" },
  { label: "Add Product",      sub: "Manage catalog",           icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>,                                                                                                                                                      nav: "products",  color: "#c9a96e" },
  { label: "Brand Vault",      sub: "Store assets",             icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,                                                                                               nav: "vault",     color: "#e8d5a3" },
  { label: "BizWiser",         sub: "Your AI growth advisor",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,                                                                                                             nav: "chatbot",   color: "#c9a96e" },
];

const TIPS = [
  "Upload your logo in Brand Vault to personalise everything AI generates for you.",
  "Add your products so the AI can reference them when building your website.",
  "Set your brand colors to ensure every poster matches your visual identity.",
  "Try generating a website — it only takes 30 seconds with AI.",
  "Email campaigns work best with a customer list. Add contacts first.",
];

const initials = (s) => s ? s.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "?";
const timeAgo = (d) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};
const parseSwatch = (c) => {
  if (!c) return "#e8d5a3";
  const t = c.trim();
  if (t.startsWith("#")) return t;
  const MAP = {gold:"#e8d5a3",amber:"#c9a96e",navy:"#1e3a5f",white:"#f5f5f5",black:"#111",
    red:"#b22222",blue:"#2255aa",green:"#2a7a4b",pink:"#e75480",purple:"#6b3fa0",
    orange:"#e07b39",teal:"#1a7a7a",yellow:"#e0c040",brown:"#8b5e3c"};
  return MAP[t.toLowerCase()] || "#e8d5a3";
};

const IMPLEMENTED_NAV = new Set(["dashboard", "chatbot", "chat-history"]);

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeNav,   setActiveNav]   = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isDark, toggle: toggleTheme, setDark, setLight } = useTheme();
  const [loading,     setLoading]     = useState(true);
  const [tipIdx]                      = useState(() => Math.floor(Math.random() * TIPS.length));

  const [user,      setUser]      = useState(null);
  const [business,  setBusiness]  = useState(null);
  const [websites,  setWebsites]  = useState([]);
  const [posters,   setPosters]   = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [products,  setProducts]  = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const H = { Authorization: `Bearer ${token}` };
    const safe = (p) => axios.get(`${import.meta.env.VITE_API_URL}${p}`, {headers:H}).then(r=>r.data).catch(()=>null);
    (async () => {
      try {
        const me = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {headers:H});
        setUser(me.data);
        const [biz,webs,posts,camps,prods] = await Promise.all([
          safe("/business/me"), safe("/websites/"), safe("/posters/"), safe("/campaigns/"), safe("/products/"),
        ]);
        if (biz)   setBusiness(biz);
        const arr = (d,k) => Array.isArray(d) ? d : (d?.[k] ?? []);
        if (webs)  setWebsites(arr(webs,"websites"));
        if (posts) setPosters(arr(posts,"posters"));
        if (camps) setCampaigns(arr(camps,"campaigns"));
        if (prods) setProducts(arr(prods,"products"));
      } catch { localStorage.removeItem("token"); navigate("/login"); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };
  const greeting = () => { const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; };
  const brandColors = business?.brand_colors ?? [];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (loading) return <div className="dash-loading"><div className="dash-loading-dot"/></div>;

  return (
    <>
      <CustomCursor />
      <div className={`dash-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

        {mobileSidebarOpen && (
          <div className="dash-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* ─── SIDEBAR ─── */}
        <aside className={`dash-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
          <div className="dash-sidebar-inner">

            <div className="dash-logo">
              <Link to="/" className="logo" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:8}}>
                <div className="logo-dot"/>
                {sidebarOpen && <span className="logo-text">BizSolve</span>}
              </Link>
              <button className="sidebar-toggle" onClick={()=>setSidebarOpen(s=>!s)} title={sidebarOpen?"Collapse":"Expand"}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d={sidebarOpen?"M9 3L5 7l4 4":"M5 3l4 4-4 4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {business && (
              <div className={`dash-biz-badge ${!sidebarOpen?"collapsed":""}`}>
                <div className="dash-biz-avatar">
                  {business.logo_url ? <img src={business.logo_url} alt="logo"/> : <span>{initials(business.business_name)}</span>}
                </div>
                {sidebarOpen && (
                  <div className="dash-biz-info">
                    <div className="dash-biz-name">{business.business_name}</div>
                    <div className="dash-biz-cat">{business.category}</div>
                  </div>
                )}
              </div>
            )}

            <nav className="dash-nav">
              {NAV_ITEMS.map(item=>(
                <button key={item.id}
                  className={`dash-nav-item ${activeNav===item.id?"active":""}`}
                  onClick={()=>{ setActiveNav(item.id); setMobileSidebarOpen(false); }}
                  title={!sidebarOpen?item.label:""}
                >
                  <span className="dash-nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="dash-nav-label">{item.label}</span>}
                  {!sidebarOpen && activeNav===item.id && <span className="dash-nav-indicator"/>}
                </button>
              ))}
            </nav>

            <div className="dash-sidebar-bottom">
              <div className={`dash-theme-row ${!sidebarOpen?"collapsed":""}`}>
                <button className={`dash-theme-btn ${!isDark?"active":""}`} onClick={setLight} title="Light mode">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="10" cy="10" r="4"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/>
                  </svg>
                  {sidebarOpen && <span>Light</span>}
                </button>
                <button className={`dash-theme-btn ${isDark?"active":""}`} onClick={setDark} title="Dark mode">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M17.5 12A7.5 7.5 0 018 2.5a7.5 7.5 0 100 15 7.5 7.5 0 009.5-5.5z"/>
                  </svg>
                  {sidebarOpen && <span>Dark</span>}
                </button>
              </div>
              <button className="dash-nav-item dash-logout" onClick={handleLogout} title={!sidebarOpen?"Log out":""}>
                <span className="dash-nav-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 15l4-5-4-5M17 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
                  </svg>
                </span>
                {sidebarOpen && <span className="dash-nav-label">Log out</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <main className="dash-main">

          <header className="dash-topbar">
            <button className="topbar-hamburger" onClick={() => setMobileSidebarOpen(s => !s)} title="Menu">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="dash-topbar-left">
              <div className="dash-greeting">{greeting()}, <span className="dash-greeting-name">{user?.name?.split(" ")[0]||"there"}</span></div>
              <div className="dash-topbar-sub">
                {business ? [business.business_name, business.location].filter(Boolean).join(" · ") : "Here's your business overview"}
              </div>
            </div>
            <div className="dash-topbar-right">
              <button className="topbar-theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {isDark
                  ? <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="4"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17.5 12A7.5 7.5 0 018 2.5a7.5 7.5 0 100 15 7.5 7.5 0 009.5-5.5z"/></svg>
                }
              </button>
              <div className="dash-user-pill">
                <div className="dash-user-avatar">{initials(user?.name)}</div>
                <span>{user?.name}</span>
              </div>
            </div>
          </header>

          {/* ─── DASHBOARD HOME ─── */}
          {activeNav==="dashboard" && (
            <div className="dash-content">
              {business && (
                <div className="dash-brand-card">
                  <div className="dash-brand-card-top">
                    <div className="dash-brand-card-accent"/>
                    <div className="dash-brand-avatar-lg">
                      {business.logo_url ? <img src={business.logo_url} alt="logo"/> : <span>{initials(business.business_name)}</span>}
                    </div>
                    <div className="dash-brand-info">
                      <div className="dash-brand-title">{business.business_name}</div>
                      <div className="dash-brand-chips">
                        {[business.category,business.location,business.brand_tone,business.preferred_style].filter(Boolean).map((v,i)=>(
                          <span key={i} className="dash-brand-chip">{v}</span>
                        ))}
                      </div>
                      {business.description && <div className="dash-brand-desc">{business.description}</div>}
                    </div>
                    {brandColors.length>0 && (
                      <div className="dash-brand-colors">
                        <div className="dash-brand-colors-label">Brand colors</div>
                        <div className="dash-brand-swatches">
                          {brandColors.map((c,i)=><div key={i} className="dash-swatch" style={{background:parseSwatch(c)}} title={c}/>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="dash-brand-card-bottom">
                    {business.target_audience && <div className="dash-brand-field"><div className="dash-brand-field-label">Target audience</div><div className="dash-brand-field-val">{business.target_audience}</div></div>}
                    {business.primary_goal     && <div className="dash-brand-field"><div className="dash-brand-field-label">Primary goal</div><div className="dash-brand-field-val">{business.primary_goal}</div></div>}
                    {business.offerings        && <div className="dash-brand-field"><div className="dash-brand-field-label">Offerings</div><div className="dash-brand-field-val">{business.offerings}</div></div>}
                  </div>
                </div>
              )}

              <div className="dash-stats-row">
                {[
                  {label:"Websites",  value:websites.length,  sub:websites.filter(w=>w.published_url).length+" live",   icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M2 7h16"/></svg>},
                  {label:"Posters",   value:posters.length,   sub:"Generated",                                           icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M2 13l4-4 3 3 3-4 6 6"/></svg>},
                  {label:"Campaigns", value:campaigns.length, sub:campaigns.filter(c=>c.status==="sent").length+" sent", icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M2 7l8 5 8-5"/></svg>},
                  {label:"Products",  value:products.length,  sub:products.length===0?"Add your first":"In catalog",    icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14"/></svg>},
                ].map((s,i)=>(
                  <div className="dash-stat-card" key={i} style={{animationDelay:`${i*0.07}s`}}>
                    <div className="dash-stat-icon">{s.icon}</div>
                    <div className="dash-stat-val">{s.value}</div>
                    <div className="dash-stat-label">{s.label}</div>
                    <div className="dash-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="dash-section">
                <div className="dash-section-header">
                  <div className="dash-section-title">Quick actions</div>
                  <div className="dash-section-sub">Jump straight into any tool</div>
                </div>
                <div className="dash-actions-grid">
                  {QUICK_ACTIONS.map((a,i)=>(
                    <button key={i} className="dash-action-card" style={{animationDelay:`${i*0.06}s`}} onClick={()=>setActiveNav(a.nav)}>
                      <div className="dash-action-icon" style={{color:a.color}}>{a.icon}</div>
                      <div className="dash-action-label">{a.label}</div>
                      <div className="dash-action-sub">{a.sub}</div>
                      <div className="dash-action-arrow">→</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="dash-history-row">
                <div className="dash-history-panel">
                  <div className="dash-panel-header">
                    <div><div className="dash-panel-title">Generated Websites</div><div className="dash-panel-sub">Your deployed sites</div></div>
                    <button className="dash-panel-action" onClick={()=>setActiveNav("website")}>+ New</button>
                  </div>
                  <div className="dash-website-list">
                    {websites.length===0
                      ? <div className="dash-empty"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2,marginBottom:8}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>No websites yet</div>
                      : websites.map(w=>(
                          <div className="dash-website-item" key={w.id||w._id}>
                            <div className="dash-website-info">
                              <div className="dash-website-name">{w.template||"Website"} <span className="dash-badge">v{w.version??1}</span></div>
                              <div className="dash-website-url">{w.published_url||"Not published"}</div>
                            </div>
                            <div className="dash-website-right">
                              <span className={`dash-status ${w.published_url?"live":"draft"}`}>{w.published_url?"live":"draft"}</span>
                              <span className="dash-website-time">{timeAgo(w.updated_at||w.created_at)}</span>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
                <div className="dash-history-panel">
                  <div className="dash-panel-header">
                    <div><div className="dash-panel-title">Generated Posters</div><div className="dash-panel-sub">Your marketing visuals</div></div>
                    <button className="dash-panel-action" onClick={()=>setActiveNav("posters")}>+ New</button>
                  </div>
                  {posters.length===0
                    ? <div className="dash-empty"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2,marginBottom:8}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 4 4"/></svg>No posters yet</div>
                    : <div className="dash-poster-grid">
                        {posters.slice(0,4).map(p=>(
                          <div className="dash-poster-item" key={p.id||p._id}>
                            <div className="dash-poster-thumb">
                              {p.image_url ? <img src={p.image_url} alt={p.title}/>
                                : <div className="dash-poster-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 4 4"/></svg></div>}
                            </div>
                            <div className="dash-poster-title">{p.title}</div>
                            <div className="dash-poster-date">{timeAgo(p.created_at)}</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>

              {campaigns.length>0 && (
                <div className="dash-section">
                  <div className="dash-section-header">
                    <div className="dash-section-title">Recent campaigns</div>
                    <div className="dash-section-sub">Email campaigns you've created</div>
                  </div>
                  <div className="dash-campaign-list">
                    {campaigns.slice(0,3).map(c=>(
                      <div className="dash-campaign-item" key={c.id||c._id}>
                        <div className="dash-campaign-left">
                          <div className="dash-campaign-name">{c.name}</div>
                          <div className="dash-campaign-subject">{c.subject}</div>
                        </div>
                        <div className="dash-campaign-right">
                          <span className={`dash-status ${c.status==="sent"?"live":"draft"}`}>{c.status}</span>
                          <span className="dash-website-time">{timeAgo(c.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dash-tip-card">
                <div className="dash-tip-icon">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6.5v.5"/>
                  </svg>
                </div>
                <div className="dash-tip-text"><strong>Tip:</strong> {TIPS[tipIdx]}</div>
              </div>
            </div>
          )}

          {/* ─── CHAT PAGES ─── */}
          {activeNav === "chatbot"      && <ChatPage />}
          {activeNav === "chat-history" && <ChatHistoryPage />}

          {/* ─── COMING SOON ─── */}
          {!IMPLEMENTED_NAV.has(activeNav) && (
            <div className="dash-content">
              <div className="dash-coming-soon">
                <div className="dash-coming-icon">{NAV_ITEMS.find(n=>n.id===activeNav)?.icon}</div>
                <div className="dash-coming-title">{NAV_ITEMS.find(n=>n.id===activeNav)?.label}</div>
                <div className="dash-coming-sub">This section is being built. It'll be ready soon.</div>
                <button className="dash-coming-back" onClick={()=>setActiveNav("dashboard")}>← Back to Dashboard</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
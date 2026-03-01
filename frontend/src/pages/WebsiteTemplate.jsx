import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const parseSwatch = (c) => {
  if (!c) return "#e8d5a3";
  const t = c.trim();
  if (t.startsWith("#")) return t;
  const MAP = { gold:"#e8d5a3",amber:"#c9a96e",navy:"#1e3a5f",white:"#f5f5f5",black:"#111",red:"#b22222",blue:"#2255aa",green:"#2a7a4b" };
  return MAP[t.toLowerCase()] || "#e8d5a3";
};

// Strip **bold** markdown from Gemini output
const stripMd = (text) => text ? text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1") : "";

export default function WebsiteTemplate() {
  const { websiteId } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    axios.get(`${API}/public-website/${websiteId}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError("Website not found."); setLoading(false); });
  }, [websiteId]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#09090b" }}>
      <div style={{ width:10, height:10, borderRadius:"50%", background:"#e8d5a3", animation:"pulse 1.2s ease-in-out infinite" }}/>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#09090b", color:"#555", fontFamily:"sans-serif" }}>
      {error}
    </div>
  );

  const { content_json: c, branding } = data;
  const primary  = parseSwatch(branding?.brand_colors?.[0]);
  const heroImg  = c.hero?.image_url;
  const aboutImg = c.about?.image_url;
  const hasOffers = !!(c.offers && (c.offers.title || c.offers.description));

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'DM Sans',sans-serif;background:#09090b;color:#f0ede8;}
    html{scroll-behavior:smooth;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .animate{animation:fadeUp 0.7s ease both;}
    .d1{animation-delay:0.1s}.d2{animation-delay:0.2s}.d3{animation-delay:0.3s}.d4{animation-delay:0.4s}
    a{color:inherit;text-decoration:none;}
    button{cursor:pointer;font-family:'DM Sans',sans-serif;}
    nav a:hover{opacity:1 !important;}
  `;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#09090b", color:"#f0ede8", minHeight:"100vh" }}>
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 56px", height:64, background:"rgba(9,9,11,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {branding?.logo_url && <img src={branding.logo_url} alt="logo" style={{ width:28, height:28, borderRadius:6, objectFit:"cover" }}/>}
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.1rem" }}>{branding?.business_name}</span>
        </div>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {["About","Services","Contact"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ color:"rgba(240,237,232,0.45)", fontSize:"0.875rem", transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#f0ede8"} onMouseLeave={e=>e.target.style.color="rgba(240,237,232,0.45)"}>{l}</a>
          ))}
          <a href="#contact" style={{ padding:"9px 22px", background:primary, color:"#09090b", borderRadius:7, fontWeight:600, fontSize:"0.875rem" }}>
            {c.hero?.cta_primary || "Get Started"}
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:"relative", minHeight:"92vh", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:500, background:`radial-gradient(ellipse, ${primary}22 0%, transparent 70%)`, pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:1, padding:"80px 24px", maxWidth:860, margin:"0 auto" }}>
          <div className="animate d1" style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", padding:"6px 18px", borderRadius:100, fontSize:"0.72rem", color:primary, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:32 }}>
            {c.hero?.tagline || branding?.business_name}
          </div>
          <h1 className="animate d2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.6rem,6vw,5.2rem)", fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.08, marginBottom:24 }}>
            {c.hero?.headline}
          </h1>
          <p className="animate d3" style={{ fontSize:"1.1rem", color:"rgba(240,237,232,0.6)", maxWidth:520, margin:"0 auto 48px", lineHeight:1.75, fontWeight:300 }}>
            {c.hero?.subheadline}
          </p>
          <div className="animate d4" style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="#contact" style={{ padding:"15px 36px", background:primary, color:"#09090b", borderRadius:9, fontWeight:600, fontSize:"1rem" }}>
              {c.hero?.cta_primary || "Get Started"}
            </a>
            <a href="#about" style={{ padding:"15px 36px", background:"rgba(255,255,255,0.06)", color:"#f0ede8", border:"1px solid rgba(255,255,255,0.12)", borderRadius:9, fontSize:"1rem" }}>
              {c.hero?.cta_secondary || "Learn More"}
            </a>
          </div>
        </div>
      </section>

      {/* ── OFFERS BANNER ── */}
      {hasOffers && (
        <section style={{ background:`linear-gradient(135deg, ${primary}18, ${primary}08)`, borderTop:`1px solid ${primary}35`, borderBottom:`1px solid ${primary}35`, padding:"32px 56px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            {/* Header row */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
              <span style={{ fontSize:"1.4rem" }}>🎉</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.2rem", color:primary }}>
                {stripMd(c.offers.title)}
              </span>
            </div>
            {/* Description */}
            <p style={{ color:"rgba(240,237,232,0.75)", fontSize:"0.95rem", lineHeight:1.65, marginBottom:20, maxWidth:700 }}>
              {stripMd(c.offers.description)}
            </p>
            {/* Promo + CTA row */}
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>

              <a href="#contact" style={{ padding:"10px 24px", background:primary, color:"#09090b", borderRadius:7, fontWeight:600, fontSize:"0.875rem", display:"inline-block" }}>
                {stripMd(c.offers.cta) || "Claim Now"}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding:"100px 56px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns: aboutImg ? "1fr 1fr" : "1fr", gap:60, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"0.7rem", fontWeight:500, color:"rgba(240,237,232,0.3)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
              About us <span style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, letterSpacing:"-0.02em", marginBottom:20 }}>
              {c.about?.title}
            </h2>
            <p style={{ fontSize:"1.05rem", color:"rgba(240,237,232,0.55)", lineHeight:1.8, fontWeight:300, marginBottom:36 }}>
              {stripMd(c.about?.description)}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[c.about?.highlight_1, c.about?.highlight_2, c.about?.highlight_3].filter(Boolean).map((h,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, fontSize:"0.9rem", fontWeight:300 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:primary, flexShrink:0 }}/>
                  {stripMd(h)}
                </div>
              ))}
            </div>
          </div>
          {aboutImg && (
            <div style={{ borderRadius:16, overflow:"hidden", aspectRatio:"4/3" }}>
              <img src={aboutImg} alt="About" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          )}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding:"0 56px 100px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ fontSize:"0.7rem", fontWeight:500, color:"rgba(240,237,232,0.3)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          What we offer <span style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(c.services?.length||3,3)},1fr)`, gap:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
          {(c.services||[]).map((s,i) => (
            <div key={i} style={{ background:"#0e0e10", overflow:"hidden", transition:"background 0.2s", display:"flex", flexDirection:"column" }}
              onMouseEnter={e=>e.currentTarget.style.background="#141416"}
              onMouseLeave={e=>e.currentTarget.style.background="#0e0e10"}>
              {/* Service image */}
              <div style={{ width:"100%", aspectRatio:"16/9", overflow:"hidden", background:"#1a1a1c", flexShrink:0 }}>
                {s.image_url ? (
                  <img src={s.image_url} alt={s.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.85)", transition:"transform 0.4s" }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.05)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}
                  />
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>{s.icon}</div>
                )}
              </div>
              {/* Service text */}
              <div style={{ padding:"24px 24px 28px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.05rem", marginBottom:10 }}>{s.title}</div>
                <p style={{ fontSize:"0.875rem", color:"rgba(240,237,232,0.45)", lineHeight:1.65, fontWeight:300 }}>{stripMd(s.description)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {c.testimonials?.length > 0 && (
        <section style={{ padding:"0 56px 100px", maxWidth:1100, margin:"0 auto" }}>
          <div style={{ fontSize:"0.7rem", fontWeight:500, color:"rgba(240,237,232,0.3)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
            What people say <span style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
            {c.testimonials.map((t,i) => (
              <div key={i} style={{ background:"#0e0e10", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"28px" }}>
                <div style={{ fontSize:"1.5rem", color:primary, marginBottom:12, lineHeight:1 }}>"</div>
                <p style={{ fontSize:"0.95rem", color:"rgba(240,237,232,0.55)", lineHeight:1.7, fontWeight:300, marginBottom:20, fontStyle:"italic" }}>{stripMd(t.text)}</p>
                <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{t.name}</div>
                <div style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.35)", marginTop:2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {c.faq?.length > 0 && (
        <section style={{ padding:"0 56px 100px", maxWidth:1100, margin:"0 auto" }}>
          <div style={{ fontSize:"0.7rem", fontWeight:500, color:"rgba(240,237,232,0.3)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
            FAQ <span style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:1, background:"rgba(255,255,255,0.05)", borderRadius:14, overflow:"hidden" }}>
            {c.faq.map((f,i) => (
              <div key={i} style={{ background:"#0e0e10", padding:"24px 28px" }}>
                <div style={{ fontWeight:500, marginBottom:8, fontSize:"0.95rem" }}>{f.question}</div>
                <div style={{ color:"rgba(240,237,232,0.5)", fontSize:"0.875rem", fontWeight:300, lineHeight:1.6 }}>{stripMd(f.answer)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section id="contact" style={{ padding:"80px 56px 120px", display:"flex", justifyContent:"center" }}>
        <div style={{ maxWidth:680, width:"100%", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"64px 48px", textAlign:"center", background:"linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 60%)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-1, left:"20%", right:"20%", height:1, background:`linear-gradient(90deg,transparent,${primary},transparent)` }}/>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:800, letterSpacing:"-0.02em", marginBottom:16 }}>
            {c.cta?.headline}
          </h2>
          <p style={{ fontSize:"0.95rem", color:"rgba(240,237,232,0.5)", fontWeight:300, marginBottom:36, lineHeight:1.65 }}>
            {stripMd(c.cta?.subtext)}
          </p>
          <a href={`mailto:${c.footer?.email}`} style={{ display:"inline-block", padding:"15px 40px", background:primary, color:"#09090b", borderRadius:9, fontWeight:600, fontSize:"1rem" }}>
            {c.cta?.button_text || "Get Started"}
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"28px 56px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:"rgba(240,237,232,0.4)" }}>{branding?.business_name}</div>
        <div style={{ display:"flex", gap:24, fontSize:"0.8rem", color:"rgba(240,237,232,0.35)", flexWrap:"wrap" }}>
          {c.footer?.email   && <span>{c.footer.email}</span>}
          {c.footer?.phone   && <span>{c.footer.phone}</span>}
          {c.footer?.address && <span>{c.footer.address}</span>}
        </div>
        <div style={{ fontSize:"0.75rem", color:"rgba(240,237,232,0.2)" }}>{c.footer?.tagline}</div>
      </footer>
    </div>
  );
}
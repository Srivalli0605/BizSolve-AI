import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const GOALS    = ["Get Customers", "Showcase Work", "Sell Products", "Build Trust"];
const SECTIONS = ["About Us", "Services", "Products", "Testimonials", "FAQ", "Contact"];

const token  = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ── Color Palettes ────────────────────────────────────────────────────────
const PALETTES = [
  { name: "Midnight Gold",   colors: ["#1a1a2e", "#e8d5a3", "#c9a96e"],  desc: "Dark luxury" },
  { name: "Royal Navy",      colors: ["#1e3a5f", "#f5f5f5", "#c9a96e"],  desc: "Classic trust" },
  { name: "Forest",          colors: ["#1e3a2e", "#f0ede8", "#6aab6a"],  desc: "Natural calm" },
  { name: "Crimson",         colors: ["#1a0a0a", "#f5f0f0", "#b22222"],  desc: "Bold power" },
  { name: "Ocean Blue",      colors: ["#0a1628", "#e8f4f8", "#2277cc"],  desc: "Modern tech" },
  { name: "Rose Gold",       colors: ["#1a1015", "#fdf0f0", "#c9748a"],  desc: "Elegant feminine" },
  { name: "Emerald",         colors: ["#0a1a14", "#f0fdf4", "#2a9a6a"],  desc: "Fresh growth" },
  { name: "Sunset Orange",   colors: ["#1a0e0a", "#fff8f5", "#e07b39"],  desc: "Energetic warmth" },
  { name: "Purple Reign",    colors: ["#12091a", "#f5f0ff", "#7c3aed"],  desc: "Creative luxury" },
  { name: "Slate",           colors: ["#0f1419", "#f0f4f8", "#64748b"],  desc: "Minimal clean" },
  { name: "Saffron",         colors: ["#1a1200", "#fffbf0", "#f59e0b"],  desc: "Warm vibrant" },
  { name: "Teal Modern",     colors: ["#061a1a", "#f0fafa", "#0d9488"],  desc: "Contemporary" },
];

const PaletteCard = ({ palette, selected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      borderRadius: 10, cursor: "none", padding: "12px 14px",
      border: `2px solid ${selected ? "var(--accent2)" : "var(--border)"}`,
      background: selected ? "rgba(232,213,163,0.06)" : "rgba(255,255,255,0.02)",
      transition: "all 0.15s", position: "relative",
    }}
  >
    {selected && (
      <div style={{
        position: "absolute", top: 7, right: 7,
        width: 18, height: 18, borderRadius: "50%",
        background: "var(--accent)", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: "0.6rem", color: "var(--bg)", fontWeight: 700,
      }}>✓</div>
    )}
    {/* Color swatches */}
    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
      {palette.colors.map((c, i) => (
        <div key={i} style={{
          flex: i === 0 ? 2 : 1,
          height: 28, borderRadius: 5,
          background: c,
          border: "1px solid rgba(255,255,255,0.08)",
        }} />
      ))}
    </div>
    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: selected ? "var(--accent)" : "var(--text)", marginBottom: 1 }}>
      {palette.name}
    </div>
    <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{palette.desc}</div>
  </div>
);

const Chips = ({ options, selected, onToggle, single = false }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {options.map((opt) => {
      const active = single ? selected === opt : selected.includes(opt);
      return (
        <button key={opt} type="button" onClick={() => onToggle(opt)} style={{
          padding: "7px 14px", borderRadius: 6,
          border: `1px solid ${active ? "var(--accent2)" : "var(--border)"}`,
          background: active ? "rgba(232,213,163,0.12)" : "rgba(255,255,255,0.03)",
          color: active ? "var(--accent)" : "var(--muted)",
          fontSize: "0.82rem", cursor: "none", transition: "all 0.15s",
        }}>
          {opt}
        </button>
      );
    })}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      {hint && <span style={{ fontSize: "0.72rem", color: "var(--muted)", opacity: 0.5 }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const ProductCard = ({ product, selected, onToggle }) => (
  <div onClick={() => onToggle(product.id)} style={{
    borderRadius: 10, overflow: "hidden", cursor: "none",
    border: `2px solid ${selected ? "var(--accent2)" : "var(--border)"}`,
    background: selected ? "rgba(232,213,163,0.06)" : "rgba(255,255,255,0.02)",
    transition: "all 0.15s", position: "relative",
  }}>
    {selected && (
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--bg)", fontWeight: 700 }}>✓</div>
    )}
    <div style={{ width: "100%", aspectRatio: "4/3", background: "#1a1a1c", overflow: "hidden" }}>
      {product.image_url
        ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: selected ? 1 : 0.7 }} />
        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📦</div>
      }
    </div>
    <div style={{ padding: "10px 12px 12px" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: selected ? "var(--accent)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
    </div>
  </div>
);

export default function WebsiteGenerator() {
  const [step, setStep]               = useState(0);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [websiteId, setWebsiteId]     = useState(null);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);
  const [products, setProducts]       = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [form, setForm] = useState({
    tagline: "",
    website_goal: "",
    current_offers: "",
    festival_promotion: "",
    sections: ["About Us", "Services", "Testimonials"],
    extra_notes: "",
    image_source: "auto",
    selected_product_ids: [],
    selected_palette: null,   // null = use business default colors
  });

  // Check for existing website
  useEffect(() => {
    axios.get(`${API}/websites/`, { headers: headers() })
      .then(res => {
        if (res.data.website) {
          setWebsiteId(res.data.website.id);
          setPublishedUrl(res.data.website.published_url || "");
          setStep(3);
        }
      })
      .catch(() => {});
  }, []);

  // Load products when needed
  useEffect(() => {
    if (form.image_source === "products" && products.length === 0) {
      setLoadingProducts(true);
      axios.get(`${API}/products/`, { headers: headers() })
        .then(res => setProducts(res.data))
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [form.image_source]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleSection = (s) => setForm(f => ({
    ...f,
    sections: f.sections.includes(s) ? f.sections.filter(x => x !== s) : [...f.sections, s],
  }));
  const toggleProduct = (id) => setForm(f => ({
    ...f,
    selected_product_ids: f.selected_product_ids.includes(id)
      ? f.selected_product_ids.filter(x => x !== id)
      : [...f.selected_product_ids, id],
  }));

  const handleGenerate = async () => {
    if (form.image_source === "products" && form.selected_product_ids.length === 0) {
      setError("Please select at least one product."); return;
    }
    setStep(2);
    setError("");
    try {
      const palette = form.selected_palette
        ? PALETTES.find(p => p.name === form.selected_palette)
        : null;

      const res = await axios.post(`${API}/generate-website`, {
        tagline:              form.tagline || null,
        website_goal:         form.website_goal || null,
        current_offers:       form.current_offers || null,
        festival_promotion:   form.festival_promotion || null,
        sections:             form.sections,
        extra_notes:          form.extra_notes || null,
        image_source:         form.image_source,
        selected_product_ids: form.image_source === "products" ? form.selected_product_ids : null,
        // Send selected palette colors to override business brand colors
        brand_colors_override: palette ? palette.colors : null,
      }, { headers: headers() });

      setWebsiteId(res.data.website_id);
      setPublishedUrl(res.data.published_url || "");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Generation failed. Please try again.");
      setStep(1);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("This will delete your current website. Are you sure?")) return;
    try {
      await axios.delete(`${API}/generate-website/reset`, { headers: headers() });
    } catch (err) {
      if (err.response?.status !== 404) { setError("Failed to reset website."); return; }
    }
    setPublishedUrl(""); setWebsiteId(null); setStep(0);
    setForm(f => ({ ...f, image_source: "auto", selected_product_ids: [], selected_palette: null }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Selected palette object for preview
  const selectedPaletteObj = form.selected_palette
    ? PALETTES.find(p => p.name === form.selected_palette)
    : null;

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (step === 3) {
    const hasUrl = Boolean(publishedUrl);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>{hasUrl ? "🎉" : "✅"}</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
            {hasUrl ? "Your website is live!" : "Website generated!"}
          </h2>
          <p style={{ color: "var(--muted)", fontWeight: 300, fontSize: "0.9rem" }}>
            {hasUrl ? "Deployed and ready to share with customers." : "Deployment link will appear shortly."}
          </p>
        </div>

        {hasUrl && (
          <>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, marginBottom: 16 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                🌐 Your Live Website URL
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px", fontSize: "0.85rem", color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {publishedUrl}
                </div>
                <button onClick={handleCopy} style={{
                  padding: "11px 16px",
                  background: copied ? "rgba(34,197,94,0.1)" : "rgba(232,213,163,0.1)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "var(--accent2)"}`,
                  borderRadius: 8, color: copied ? "#4ade80" : "var(--accent)",
                  fontSize: "0.82rem", cursor: "none", whiteSpace: "nowrap", transition: "all 0.2s",
                }}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <a href={publishedUrl} target="_blank" rel="noreferrer" style={{
                  padding: "11px 16px", background: "var(--accent)", borderRadius: 8,
                  color: "var(--bg)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  Open →
                </a>
              </div>
              <div style={{ padding: "10px 14px", background: "rgba(232,213,163,0.05)", border: "1px solid rgba(232,213,163,0.1)", borderRadius: 8, fontSize: "0.78rem", color: "var(--muted)" }}>
                💡 Share this link on WhatsApp, Instagram bio, or Google Business.
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 10px", fontSize: "0.72rem", color: "var(--muted)", marginLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {publishedUrl}
                </div>
              </div>
              <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ fontSize: "2rem" }}>🌐</div>
                <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 300 }}>Preview not available inside dashboard</div>
                <a href={publishedUrl} target="_blank" rel="noreferrer" style={{
                  padding: "9px 24px", background: "var(--accent)", borderRadius: 8,
                  color: "var(--bg)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
                }}>
                  Open Full Preview →
                </a>
              </div>
            </div>
          </>
        )}

        <button onClick={handleReset} style={{
          background: "none", border: "1px solid var(--border)", borderRadius: 8,
          padding: "10px 20px", color: "var(--muted)", fontSize: "0.85rem",
          cursor: "none", width: "100%",
        }}>
          🔄 Regenerate website
        </button>
      </div>
    );
  }

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 1s linear infinite" }} />
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
          Generating & deploying your website...
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 300, textAlign: "center", maxWidth: 340 }}>
          AI is crafting content{form.image_source === "products" ? ", adding your products" : ", finding images"}, and deploying. 20–40 seconds.
        </div>
        {selectedPaletteObj && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {selectedPaletteObj.colors.map((c, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
            ))}
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: 4 }}>{selectedPaletteObj.name}</span>
          </div>
        )}
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Generate Your Website
        </h2>
        <p style={{ color: "var(--muted)", fontWeight: 300, fontSize: "0.9rem" }}>
          We already know your business. Just tell us a few more things to make it perfect.
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#f87171", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {["Basic Info", "Colors & Images"].map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 2, borderRadius: 2, background: step >= i ? "var(--accent)" : "var(--border)", marginBottom: 6, transition: "background 0.3s" }} />
            <div style={{ fontSize: "0.72rem", color: step >= i ? "var(--accent)" : "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── STEP 0: Basic Info ── */}
      {step === 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28 }}>
          <Field label="Custom Tagline" hint="(optional)">
            <input name="tagline" value={form.tagline} onChange={handleChange} className="form-input" placeholder="e.g. Freshness Delivered Daily" />
          </Field>
          <Field label="Website Goal">
            <Chips options={GOALS} selected={form.website_goal}
              onToggle={(g) => setForm(f => ({ ...f, website_goal: f.website_goal === g ? "" : g }))} single />
          </Field>
          <Field label="Sections to Include">
            <Chips options={SECTIONS} selected={form.sections} onToggle={toggleSection} />
          </Field>
          <button onClick={() => setStep(1)} style={{ width: "100%", padding: "13px", background: "var(--accent)", border: "none", borderRadius: 8, color: "var(--bg)", fontWeight: 600, fontSize: "0.9rem", cursor: "none", marginTop: 8 }}>
            Continue →
          </button>
        </div>
      )}

      {/* ── STEP 1: Colors & Images ── */}
      {step === 1 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28 }}>

          {/* COLOR PALETTE */}
          <Field label="Color Palette" hint="(pick one or use your brand default)">
            {/* "Use my brand colors" option */}
            <div
              onClick={() => setForm(f => ({ ...f, selected_palette: null }))}
              style={{
                borderRadius: 10, cursor: "none", padding: "12px 14px", marginBottom: 12,
                border: `2px solid ${!form.selected_palette ? "var(--accent2)" : "var(--border)"}`,
                background: !form.selected_palette ? "rgba(232,213,163,0.06)" : "rgba(255,255,255,0.02)",
                display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: "1.2rem" }}>🎨</div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: !form.selected_palette ? "var(--accent)" : "var(--text)" }}>
                  Use my brand colors
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>From your business profile</div>
              </div>
              {!form.selected_palette && (
                <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--bg)", fontWeight: 700 }}>✓</div>
              )}
            </div>

            {/* Palette grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {PALETTES.map(p => (
                <PaletteCard
                  key={p.name}
                  palette={p}
                  selected={form.selected_palette === p.name}
                  onClick={() => setForm(f => ({ ...f, selected_palette: f.selected_palette === p.name ? null : p.name }))}
                />
              ))}
            </div>

            {/* Selected preview */}
            {selectedPaletteObj && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {selectedPaletteObj.colors.map((c, i) => (
                    <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                  ))}
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  <strong style={{ color: "var(--accent)" }}>{selectedPaletteObj.name}</strong> will be used in your website
                </span>
              </div>
            )}
          </Field>

          {/* OFFERS */}
          <Field label="Current Offers / Discounts" hint="(optional)">
            <textarea name="current_offers" value={form.current_offers} onChange={handleChange} className="form-input form-textarea" placeholder="e.g. 20% off all orders this week" rows={2} />
          </Field>
          <Field label="Festival / Seasonal Promotion" hint="(optional)">
            <textarea name="festival_promotion" value={form.festival_promotion} onChange={handleChange} className="form-input form-textarea" placeholder="e.g. Diwali special gift hampers available" rows={2} />
          </Field>
          <Field label="Extra Instructions for AI" hint="(optional)">
            <textarea name="extra_notes" value={form.extra_notes} onChange={handleChange} className="form-input form-textarea" placeholder="e.g. Make it feel luxurious and premium." rows={2} />
          </Field>

          {/* IMAGE SOURCE */}
          <Field label="Product Images">
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { value: "auto",     label: "🤖 Auto-generate", sub: "AI picks from Pexels" },
                { value: "products", label: "📦 My Products",   sub: "Use your uploaded products" },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, image_source: opt.value, selected_product_ids: [] }))}
                  style={{
                    flex: 1, padding: "14px 12px", borderRadius: 8, cursor: "none", textAlign: "left",
                    border: `1px solid ${form.image_source === opt.value ? "var(--accent2)" : "var(--border)"}`,
                    background: form.image_source === opt.value ? "rgba(232,213,163,0.08)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: form.image_source === opt.value ? "var(--accent)" : "var(--text)", marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 300 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Product grid */}
          {form.image_source === "products" && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                <span>Select products to feature</span>
                {form.selected_product_ids.length > 0 && (
                  <span style={{ color: "var(--accent)", fontSize: "0.78rem", textTransform: "none", letterSpacing: 0 }}>{form.selected_product_ids.length} selected</span>
                )}
              </div>
              {loadingProducts ? (
                <div style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontSize: "0.85rem" }}>Loading products...</div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, border: "1px dashed var(--border)", borderRadius: 10 }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📦</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No products yet — go to Products page to add some</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} selected={form.selected_product_ids.includes(p.id)} onToggle={toggleProduct} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setStep(0)} style={{ padding: "13px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", fontSize: "0.875rem", cursor: "none" }}>
              ← Back
            </button>
            <button onClick={handleGenerate} style={{ flex: 1, padding: "13px", background: "var(--accent)", border: "none", borderRadius: 8, color: "var(--bg)", fontWeight: 600, fontSize: "0.9rem", cursor: "none" }}>
              ✨ Generate & Deploy Website
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// pages/BrandVaultPage.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/BrandVault.css";

const API = import.meta.env.VITE_API_URL;
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const TABS = [
  { id: "identity", label: "Brand Identity",  icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l2 2"/></svg> },
  { id: "media",    label: "Media Assets",    icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M2 13l4-4 3 3 3-4 6 6"/></svg> },
  { id: "content",  label: "Content Bank",    icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h12M4 9h12M4 13h7"/></svg> },
  { id: "contact",  label: "Key Contacts",     icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3 2.7-5 6-5s6 2 6 5M15 7c1.657 0 3 1.343 3 3M18 17c0-2-1.2-3.5-3-4"/></svg> },
  { id: "notes",    label: "Notes",           icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3h12a1 1 0 011 1v10l-4 4H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M13 14v3M13 14h4"/></svg> },
];

const MEDIA_CATS = ["all", "product", "team", "banner", "campaign", "store", "general", "document"];
const CONTENT_TYPES = [
  { value: "about_us",            label: "About Us" },
  { value: "instagram_bio",       label: "Instagram Bio" },
  { value: "whatsapp_message",    label: "WhatsApp Message" },
  { value: "elevator_pitch",      label: "Elevator Pitch" },
  { value: "product_description", label: "Product Description" },
  { value: "sales_pitch",         label: "Sales Pitch" },
  { value: "cta_phrase",          label: "CTA Phrase" },
  { value: "other",               label: "Other" },
];
const TONE_OPTIONS = ["professional", "friendly", "luxury", "bold", "minimal", "playful"];

// ─── BRAND SCORE ───
function BrandScore({ score, breakdown }) {
  return (
    <div className="bv-score-card">
      <div className="bv-score-top">
        <div>
          <div className="bv-score-label">Brand Setup Score</div>
          <div className="bv-score-val">{score}%</div>
        </div>
        <div className="bv-score-ring">
          <svg viewBox="0 0 36 36" width="64" height="64">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5"/>
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke="var(--accent2)" strokeWidth="2.5"
              strokeDasharray={`${score} ${100 - score}`}
              strokeDashoffset="25"
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <span className="bv-score-ring-val">{score}</span>
        </div>
      </div>
      <div className="bv-score-items">
        {breakdown.map((item, i) => (
          <div key={i} className={`bv-score-item ${item.done ? "done" : ""}`}>
            <span className="bv-score-check">
              {item.done
                ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="var(--accent2)"/><path d="M3.5 6l1.5 1.5 3-3" stroke="#0a0a0b" strokeWidth="1.4" strokeLinecap="round"/></svg>
                : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="var(--border)"/></svg>
              }
            </span>
            <span className="bv-score-text">{item.label}</span>
            <span className="bv-score-pts">+{item.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── IDENTITY TAB ───
function IdentityTab({ vault, onSave, saving }) {
  const [form, setForm] = useState({
    tagline:           vault?.tagline || "",
    mission_statement: vault?.mission_statement || "",
    vision_statement:  vault?.vision_statement || "",
    short_description: vault?.short_description || "",
    long_description:  vault?.long_description || "",
    brand_tone:        vault?.brand_tone || "",
    brand_fonts:       vault?.brand_fonts || "",
    brand_colors: {
      primary:   vault?.brand_colors?.primary || "",
      secondary: vault?.brand_colors?.secondary || "",
    },
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview,   setLogoPreview]   = useState(vault?.logo_url || null);
  const [altPreview,    setAltPreview]    = useState(vault?.alternate_logo_url || null);
  const logoRef = useRef();
  const altRef  = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setColor = (k, v) => setForm(f => ({ ...f, brand_colors: { ...f.brand_colors, [k]: v } }));

  const uploadLogo = async (file, isAlt) => {
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("is_alternate", isAlt);
    try {
      const res = await axios.post(`${API}/brandvault/logo`, fd, { headers: { ...authH(), "Content-Type": "multipart/form-data" } });
      if (isAlt) setAltPreview(res.data.url);
      else       setLogoPreview(res.data.url);
    } catch (e) {
      alert(e.response?.data?.detail || "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="bv-tab-content">
      {/* Logos */}
      <div className="bv-section">
        <div className="bv-section-title">Logos</div>
        <div className="bv-logo-row">
          <div className="bv-logo-upload-box" onClick={() => logoRef.current?.click()}>
            {logoPreview
              ? <img src={logoPreview} alt="logo" className="bv-logo-preview"/>
              : <div className="bv-logo-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 4 4"/></svg>
                  <span>Upload Logo</span>
                </div>
            }
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e => e.target.files[0] && uploadLogo(e.target.files[0], false)}/>
            {logoUploading && <div className="bv-logo-uploading">Uploading...</div>}
          </div>
          <div className="bv-logo-upload-box alt" onClick={() => altRef.current?.click()}>
            {altPreview
              ? <img src={altPreview} alt="alt logo" className="bv-logo-preview"/>
              : <div className="bv-logo-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                  <span>Alt Logo (optional)</span>
                </div>
            }
            <input ref={altRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e => e.target.files[0] && uploadLogo(e.target.files[0], true)}/>
          </div>
        </div>
        <div className="bv-logo-hint">Supported: PNG, JPG, SVG, WEBP · Max 5MB</div>
      </div>

      {/* Colors & Tone */}
      <div className="bv-section">
        <div className="bv-section-title">Brand Colors & Tone</div>
        <div className="bv-row-3">
          <div className="bv-field">
            <label className="bv-label">Primary Color</label>
            <div className="bv-color-row">
              <input type="color" className="bv-color-picker"
                value={form.brand_colors.primary || "#e8d5a3"}
                onChange={e => setColor("primary", e.target.value)}/>
              <input type="text" className="bv-input" placeholder="#e8d5a3"
                value={form.brand_colors.primary}
                onChange={e => setColor("primary", e.target.value)}/>
            </div>
          </div>
          <div className="bv-field">
            <label className="bv-label">Secondary Color</label>
            <div className="bv-color-row">
              <input type="color" className="bv-color-picker"
                value={form.brand_colors.secondary || "#c9a96e"}
                onChange={e => setColor("secondary", e.target.value)}/>
              <input type="text" className="bv-input" placeholder="#c9a96e"
                value={form.brand_colors.secondary}
                onChange={e => setColor("secondary", e.target.value)}/>
            </div>
          </div>
          <div className="bv-field">
            <label className="bv-label">Brand Fonts</label>
            <input type="text" className="bv-input" placeholder="e.g. Syne, DM Sans"
              value={form.brand_fonts} onChange={e => set("brand_fonts", e.target.value)}/>
          </div>
        </div>
        <div className="bv-field" style={{marginTop:12}}>
          <label className="bv-label">Brand Tone</label>
          <div className="bv-chip-row">
            {TONE_OPTIONS.map(t => (
              <button key={t} className={`bv-chip ${form.brand_tone===t?"active":""}`}
                onClick={() => set("brand_tone", t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="bv-section">
        <div className="bv-section-title">Brand Copy</div>
        <div className="bv-field">
          <label className="bv-label">Tagline</label>
          <input type="text" className="bv-input" placeholder="Your brand's one-liner"
            value={form.tagline} onChange={e => set("tagline", e.target.value)}/>
        </div>
        <div className="bv-row-2" style={{marginTop:12}}>
          <div className="bv-field">
            <label className="bv-label">Mission Statement</label>
            <textarea className="bv-textarea" rows={3} placeholder="Why your business exists..."
              value={form.mission_statement} onChange={e => set("mission_statement", e.target.value)}/>
          </div>
          <div className="bv-field">
            <label className="bv-label">Vision Statement</label>
            <textarea className="bv-textarea" rows={3} placeholder="Where you're headed..."
              value={form.vision_statement} onChange={e => set("vision_statement", e.target.value)}/>
          </div>
        </div>
        <div className="bv-field" style={{marginTop:12}}>
          <label className="bv-label">Short Description <span className="bv-hint-inline">(used in AI prompts)</span></label>
          <textarea className="bv-textarea" rows={2} placeholder="2-3 sentence brand summary..."
            value={form.short_description} onChange={e => set("short_description", e.target.value)}/>
        </div>
        <div className="bv-field" style={{marginTop:12}}>
          <label className="bv-label">Long Description <span className="bv-hint-inline">(for website & campaigns)</span></label>
          <textarea className="bv-textarea" rows={4} placeholder="Full brand story..."
            value={form.long_description} onChange={e => set("long_description", e.target.value)}/>
        </div>
      </div>

      <button className="bv-save-btn" onClick={() => onSave(form)} disabled={saving}>
        {saving ? <><span className="bv-spinner"/>Saving...</> : "Save Brand Identity"}
      </button>
    </div>
  );
}

// ─── MEDIA TAB ───
function MediaTab() {
  const [assets,    setAssets]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [showModal, setShowModal] = useState(false);
  const [uploadForm,setUploadForm]= useState({ category: "general", tags: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const fileRef = useRef();

  const load = async (cat, p) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (cat !== "all") params.category = cat;
      const res = await axios.get(`${API}/brandvault/media`, { headers: authH(), params });
      setAssets(res.data.assets);
      setTotalPages(res.data.pages || 1);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(catFilter, page); }, [catFilter, page]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("category", uploadForm.category);
    fd.append("tags", uploadForm.tags);
    try {
      await axios.post(`${API}/brandvault/media`, fd, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" }
      });
      setShowModal(false);
      setSelectedFile(null);
      setPreview(null);
      setUploadForm({ category: "general", tags: "" });
      load(catFilter, page);
    } catch (e) {
      alert(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this asset?")) return;
    try {
      await axios.delete(`${API}/brandvault/media/${id}`, { headers: authH() });
      setAssets(a => a.filter(x => x.id !== id));
    } catch {}
  };

  return (
    <div className="bv-tab-content">
      <div className="bv-media-toolbar">
        <div className="bv-cat-filters">
          {MEDIA_CATS.map(c => (
            <button key={c} className={`bv-cat-chip ${catFilter===c?"active":""}`}
              onClick={() => { setCatFilter(c); setPage(1); }}>
              {c}
            </button>
          ))}
        </div>
        <button className="bv-upload-btn" onClick={() => setShowModal(true)}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3v14M3 10h14"/></svg>
          Upload Asset
        </button>
      </div>

      {loading ? (
        <div className="bv-loading"><span/><span/><span/></div>
      ) : assets.length === 0 ? (
        <div className="bv-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2}}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 4 4"/>
          </svg>
          <p>No assets yet. Upload your first one.</p>
        </div>
      ) : (
        <div className="bv-media-grid">
          {assets.map(a => (
            <div key={a.id} className="bv-media-card">
              {a.file_type?.startsWith("video")
                ? <video src={a.file_url} className="bv-media-thumb" controls/>
                : (a.file_type?.startsWith("image"))
                  ? <img src={a.file_url} alt={a.category} className="bv-media-thumb"/>
                  : <div className="bv-doc-thumb">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h1"/>
                      </svg>
                      <span className="bv-doc-name">{a.file_url?.split("/").pop()?.split("?")[0]?.slice(0,20)}</span>
                      <a href={a.file_url} target="_blank" rel="noreferrer" className="bv-doc-open" onClick={e=>e.stopPropagation()}>Open ↗</a>
                    </div>
              }
              <div className="bv-media-card-info">
                <span className="bv-media-cat">{a.category}</span>
                {a.tags?.length > 0 && (
                  <div className="bv-media-tags">
                    {a.tags.map((t,i) => <span key={i} className="bv-media-tag">{t}</span>)}
                  </div>
                )}
              </div>
              <button className="bv-media-delete" onClick={() => handleDelete(a.id)}>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="bv-pagination">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}>←</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>→</button>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="bv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bv-modal" onClick={e => e.stopPropagation()}>
            <div className="bv-modal-title">Upload Media Asset</div>

            <div className="bv-upload-drop" onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}>
              {preview
                ? <img src={preview} alt="preview" style={{maxHeight:160, borderRadius:8, objectFit:"contain"}}/>
                : <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.3}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span>Click or drag file here</span>
                    <span style={{fontSize:"0.7rem", opacity:0.5}}>Images, videos, PDFs, Excel, Word up to 20MB</span>
                  </>
              }
              <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf,.xlsx,.xls,.csv,.docx,.doc" style={{display:"none"}}
                onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}/>
            </div>

            <div className="bv-field" style={{marginTop:14}}>
              <label className="bv-label">Category</label>
              <select className="bv-select"
                value={uploadForm.category}
                onChange={e => setUploadForm(f => ({...f, category: e.target.value}))}>
                {MEDIA_CATS.filter(c=>c!=="all").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="bv-field" style={{marginTop:10}}>
              <label className="bv-label">Tags <span className="bv-hint-inline">(comma separated)</span></label>
              <input type="text" className="bv-input" placeholder="e.g. product, summer, launch"
                value={uploadForm.tags}
                onChange={e => setUploadForm(f => ({...f, tags: e.target.value}))}/>
            </div>

            <div className="bv-modal-actions">
              <button className="bv-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="bv-upload-btn" onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? <><span className="bv-spinner"/>Uploading...</> : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTENT TAB ───
function ContentTab() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState({ content_type: "about_us", content_text: "" });
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/brandvault/content`, { headers: authH() });
      setItems(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.content_text.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API}/brandvault/content/${editId}`, { content_text: form.content_text }, { headers: authH() });
      } else {
        await axios.post(`${API}/brandvault/content`, form, { headers: authH() });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ content_type: "about_us", content_text: "" });
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this content?")) return;
    await axios.delete(`${API}/brandvault/content/${id}`, { headers: authH() });
    setItems(i => i.filter(x => x.id !== id));
  };

  const startEdit = (item) => {
    setForm({ content_type: item.content_type, content_text: item.content_text });
    setEditId(item.id);
    setShowForm(true);
  };

  const labelFor = (type) => CONTENT_TYPES.find(c => c.value === type)?.label || type;

  return (
    <div className="bv-tab-content">
      <div className="bv-content-toolbar">
        <div>
          <div className="bv-section-title" style={{marginBottom:2}}>Content Bank</div>
          <div className="bv-section-sub">Reusable marketing copy for AI features</div>
        </div>
        <button className="bv-upload-btn" onClick={() => { setShowForm(true); setEditId(null); setForm({ content_type: "about_us", content_text: "" }); }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3v14M3 10h14"/></svg>
          Add Content
        </button>
      </div>

      {showForm && (
        <div className="bv-content-form">
          <div className="bv-row-2">
            <div className="bv-field">
              <label className="bv-label">Content Type</label>
              <select className="bv-select" value={form.content_type}
                onChange={e => setForm(f => ({...f, content_type: e.target.value}))}
                disabled={!!editId}>
                {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="bv-field" style={{marginTop:10}}>
            <label className="bv-label">Content</label>
            <textarea className="bv-textarea" rows={4} placeholder="Write your content here..."
              value={form.content_text}
              onChange={e => setForm(f => ({...f, content_text: e.target.value}))}/>
          </div>
          <div className="bv-modal-actions" style={{marginTop:10}}>
            <button className="bv-modal-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="bv-upload-btn" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="bv-spinner"/>Saving...</> : editId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bv-loading"><span/><span/><span/></div>
      ) : items.length === 0 ? (
        <div className="bv-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2}}>
            <path d="M4 5h12M4 9h12M4 13h7"/>
          </svg>
          <p>No content yet. Add your first piece.</p>
        </div>
      ) : (
        <div className="bv-content-list">
          {items.map(item => (
            <div key={item.id} className="bv-content-item">
              <div className="bv-content-item-header">
                <span className="bv-content-type-badge">{labelFor(item.content_type)}</span>
                <div className="bv-content-actions">
                  <button className="bv-icon-btn" onClick={() => startEdit(item)} title="Edit">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3l3 3-9 9H5v-3l9-9z"/></svg>
                  </button>
                  <button className="bv-icon-btn danger" onClick={() => handleDelete(item.id)} title="Delete">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"/></svg>
                  </button>
                </div>
              </div>
              <div className="bv-content-text">{item.content_text}</div>
              <button className="bv-copy-btn" onClick={() => navigator.clipboard.writeText(item.content_text)}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="10" height="10" rx="1"/><path d="M4 12H3a1 1 0 01-1-1V3a1 1 0 011-1h8a1 1 0 011 1v1"/></svg>
                Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KEY CONTACTS TAB ───
const CONTACT_ROLES = ["Supplier", "Distributor", "Partner", "Client", "Vendor", "Investor", "Team", "Other"];

function ContactTab() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [form, setForm] = useState({
    name: "", role: "Supplier", company: "",
    phone: "", whatsapp: "", email: "",
    notes: "", priority: "normal",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/brandvault/content`, { headers: authH() });
      setContacts(res.data.filter(n => n.content_type === "key_contact"));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const parseContact = (item) => {
    try { return JSON.parse(item.content_text); }
    catch { return {}; }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const text = JSON.stringify(form);
    try {
      if (editId) {
        await axios.put(`${API}/brandvault/content/${editId}`, { content_text: text }, { headers: authH() });
      } else {
        await axios.post(`${API}/brandvault/content`, { content_type: "key_contact", content_text: text }, { headers: authH() });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", role: "Supplier", company: "", phone: "", whatsapp: "", email: "", notes: "", priority: "normal" });
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contact?")) return;
    await axios.delete(`${API}/brandvault/content/${id}`, { headers: authH() });
    setContacts(c => c.filter(x => x.id !== id));
  };

  const startEdit = (item) => {
    const p = parseContact(item);
    setForm({ name: p.name||"", role: p.role||"Supplier", company: p.company||"",
      phone: p.phone||"", whatsapp: p.whatsapp||"", email: p.email||"",
      notes: p.notes||"", priority: p.priority||"normal" });
    setEditId(item.id);
    setShowForm(true);
  };

  const initials = (name) => name ? name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "?";
  const filtered = contacts.filter(c => {
    const p = parseContact(c);
    return !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.toLowerCase().includes(search.toLowerCase());
  });

  const PRIORITY_COLOR = { high: "#e8d5a3", normal: "var(--muted)", low: "var(--border)" };

  return (
    <div className="bv-tab-content">
      <div className="bv-content-toolbar">
        <div>
          <div className="bv-section-title" style={{marginBottom:2}}>Key Contacts</div>
          <div className="bv-section-sub">Suppliers, partners, clients & important people</div>
        </div>
        <button className="bv-upload-btn" onClick={() => { setShowForm(true); setEditId(null); setForm({ name:"", role:"Supplier", company:"", phone:"", whatsapp:"", email:"", notes:"", priority:"normal" }); }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3v14M3 10h14"/></svg>
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div style={{marginBottom:16, position:"relative"}}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", opacity:0.4}}>
          <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
        </svg>
        <input type="text" className="bv-input" placeholder="Search contacts..."
          style={{paddingLeft:32}} value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {showForm && (
        <div className="bv-contact-form-card">
          <div className="bv-row-2">
            <div className="bv-field">
              <label className="bv-label">Full Name *</label>
              <input type="text" className="bv-input" placeholder="e.g. Ravi Kumar"
                value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))}/>
            </div>
            <div className="bv-field">
              <label className="bv-label">Company / Business</label>
              <input type="text" className="bv-input" placeholder="e.g. Kumar Oils Ltd"
                value={form.company} onChange={e => setForm(f=>({...f, company:e.target.value}))}/>
            </div>
          </div>
          <div className="bv-row-2" style={{marginTop:10}}>
            <div className="bv-field">
              <label className="bv-label">Role / Category</label>
              <select className="bv-select" value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value}))}>
                {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="bv-field">
              <label className="bv-label">Priority</label>
              <select className="bv-select" value={form.priority} onChange={e => setForm(f=>({...f, priority:e.target.value}))}>
                <option value="high">⭐ High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="bv-row-2" style={{marginTop:10}}>
            <div className="bv-field">
              <label className="bv-label">Phone</label>
              <input type="tel" className="bv-input" placeholder="+91 9876543210"
                value={form.phone} onChange={e => setForm(f=>({...f, phone:e.target.value}))}/>
            </div>
            <div className="bv-field">
              <label className="bv-label">WhatsApp</label>
              <input type="tel" className="bv-input" placeholder="+91 9876543210"
                value={form.whatsapp} onChange={e => setForm(f=>({...f, whatsapp:e.target.value}))}/>
            </div>
          </div>
          <div className="bv-field" style={{marginTop:10}}>
            <label className="bv-label">Email</label>
            <input type="email" className="bv-input" placeholder="contact@example.com"
              value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))}/>
          </div>
          <div className="bv-field" style={{marginTop:10}}>
            <label className="bv-label">Notes</label>
            <textarea className="bv-textarea" rows={2} placeholder="Any additional notes..."
              value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))}/>
          </div>
          <div className="bv-modal-actions" style={{marginTop:12}}>
            <button className="bv-modal-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="bv-upload-btn" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <><span className="bv-spinner"/>Saving...</> : editId ? "Update" : "Save Contact"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bv-loading"><span/><span/><span/></div>
      ) : filtered.length === 0 ? (
        <div className="bv-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2}}>
            <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
          </svg>
          <p>{search ? "No contacts match your search." : "No contacts yet. Add your first one."}</p>
        </div>
      ) : (
        <div className="bv-contacts-list">
          {filtered.map(item => {
            const p = parseContact(item);
            return (
              <div key={item.id} className={`bv-contact-card ${p.priority === "high" ? "priority-high" : ""}`}>
                <div className="bv-contact-avatar">{initials(p.name)}</div>
                <div className="bv-contact-info">
                  <div className="bv-contact-name">
                    {p.name}
                    {p.priority === "high" && <span className="bv-contact-star">⭐</span>}
                  </div>
                  {p.company && <div className="bv-contact-company">{p.company}</div>}
                  <div className="bv-contact-meta">
                    <span className="bv-contact-role-badge">{p.role}</span>
                    {p.phone && <span className="bv-contact-detail">📞 {p.phone}</span>}
                    {p.email && <span className="bv-contact-detail">✉ {p.email}</span>}
                  </div>
                  {p.notes && <div className="bv-contact-notes">{p.notes}</div>}
                </div>
                <div className="bv-contact-actions">
                  {p.whatsapp && (
                    <a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                      className="bv-contact-wa" title="WhatsApp">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                  <button className="bv-icon-btn" onClick={() => startEdit(item)} title="Edit">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3l3 3-9 9H5v-3l9-9z"/></svg>
                  </button>
                  <button className="bv-icon-btn danger" onClick={() => handleDelete(item.id)} title="Delete">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── NOTES TAB ───
const NOTE_COLORS = ["#1a1a1a", "#1a2a1a", "#1a1a2a", "#2a1a1a", "#1a2a2a"];

function NotesTab() {
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState({ title: "", body: "", color: "#1a1a1a" });
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Notes stored as content_type = "note" in brand_content collection
      const res = await axios.get(`${API}/brandvault/content`, { headers: authH() });
      setNotes(res.data.filter(n => n.content_type === "note"));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.body.trim()) return;
    setSaving(true);
    const text = JSON.stringify({ title: form.title, body: form.body, color: form.color });
    try {
      if (editId) {
        await axios.put(`${API}/brandvault/content/${editId}`, { content_text: text }, { headers: authH() });
      } else {
        await axios.post(`${API}/brandvault/content`, { content_type: "note", content_text: text }, { headers: authH() });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: "", body: "", color: "#1a1a1a" });
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this note?")) return;
    await axios.delete(`${API}/brandvault/content/${id}`, { headers: authH() });
    setNotes(n => n.filter(x => x.id !== id));
  };

  const parseNote = (item) => {
    try { return JSON.parse(item.content_text); }
    catch { return { title: "", body: item.content_text, color: "#1a1a1a" }; }
  };

  const startEdit = (item) => {
    const parsed = parseNote(item);
    setForm({ title: parsed.title || "", body: parsed.body || "", color: parsed.color || "#1a1a1a" });
    setEditId(item.id);
    setShowForm(true);
  };

  return (
    <div className="bv-tab-content">
      <div className="bv-content-toolbar">
        <div>
          <div className="bv-section-title" style={{marginBottom:2}}>Notes</div>
          <div className="bv-section-sub">Quick notes and ideas for your brand</div>
        </div>
        <button className="bv-upload-btn" onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", body: "", color: "#1a1a1a" }); }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3v14M3 10h14"/></svg>
          New Note
        </button>
      </div>

      {showForm && (
        <div className="bv-note-form" style={{borderLeft: `3px solid ${form.color === "#1a1a1a" ? "var(--accent2)" : form.color}`}}>
          <input type="text" className="bv-note-title-input" placeholder="Note title (optional)"
            value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}/>
          <textarea className="bv-note-body-input" rows={5} placeholder="Write your note here..."
            value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))}/>
          <div className="bv-modal-actions" style={{marginTop:10}}>
            <button className="bv-modal-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="bv-upload-btn" onClick={handleSave} disabled={saving || !form.body.trim()}>
              {saving ? <><span className="bv-spinner"/>Saving...</> : editId ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bv-loading"><span/><span/><span/></div>
      ) : notes.length === 0 ? (
        <div className="bv-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{opacity:0.2}}>
            <path d="M4 3h12a1 1 0 011 1v10l-4 4H4a1 1 0 01-1-1V4a1 1 0 011-1z"/>
          </svg>
          <p>No notes yet. Capture your first idea.</p>
        </div>
      ) : (
        <div className="bv-notes-grid">
          {notes.map(item => {
            const note = parseNote(item);
            return (
              <div key={item.id} className="bv-note-card">
                <div className="bv-note-card-accent" style={{background: note.color === "#1a1a1a" ? "var(--accent2)" : note.color}}/>
                {note.title && <div className="bv-note-card-title">{note.title}</div>}
                <div className="bv-note-card-body">{note.body}</div>
                <div className="bv-note-card-footer">
                  <span className="bv-note-card-time">{new Date(item.created_at).toLocaleDateString()}</span>
                  <div style={{display:"flex", gap:4}}>
                    <button className="bv-icon-btn" onClick={() => startEdit(item)} title="Edit">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3l3 3-9 9H5v-3l9-9z"/></svg>
                    </button>
                    <button className="bv-icon-btn danger" onClick={() => handleDelete(item.id)} title="Delete">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ───
export default function BrandVaultPage() {
  const [activeTab, setActiveTab] = useState("identity");
  const [vault,     setVault]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/brandvault/`, { headers: authH() });
        setVault(res.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/brandvault/`, data, { headers: authH() });
      // Refresh vault to get updated score
      const fresh = await axios.get(`${API}/brandvault/`, { headers: authH() });
      setVault(fresh.data);
      showToast("Saved successfully!");
    } catch (e) {
      showToast(e.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="bv-page">
      <div className="bv-page-loading"><span/><span/><span/></div>
    </div>
  );

  return (
    <div className="bv-page">
      {/* Header */}
      <div className="bv-page-header">
        <div>
          <div className="bv-page-title">Brand Vault</div>
          <div className="bv-page-sub">Your digital brand locker — one source of truth for all AI features</div>
        </div>
      </div>

      <div className="bv-layout">
        {/* Left: tabs + content */}
        <div className="bv-main-col">
          {/* Tab bar */}
          <div className="bv-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`bv-tab ${activeTab===t.id?"active":""}`}
                onClick={() => setActiveTab(t.id)}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "identity" && <IdentityTab vault={vault} onSave={handleSave} saving={saving}/>}
          {activeTab === "media"    && <MediaTab />}
          {activeTab === "content"  && <ContentTab />}
          {activeTab === "contact"  && <ContactTab />}
          {activeTab === "notes"    && <NotesTab />}
        </div>

        {/* Right: score card */}
        {vault?.brand_score && (
          <div className="bv-side-col">
            <BrandScore score={vault.brand_score.score} breakdown={vault.brand_score.breakdown}/>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="bv-toast">{toast}</div>}
    </div>
  );
}
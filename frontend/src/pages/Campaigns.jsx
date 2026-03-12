// src/pages/Campaigns.jsx
import { useState, useEffect } from "react";
import { generateEmail, sendCampaign, listCampaigns, getCampaign } from "../api/campaignApi";

const EMAIL_TYPES = ["Promotional", "Newsletter", "Welcome", "Product Launch",
  "Re-engagement", "Event Invitation", "Follow-up", "Seasonal Sale"];
const TONES = ["Professional", "Friendly", "Urgent", "Inspirational", "Casual", "Luxury", "Playful"];
const EMPTY_FORM = { campaign_name: "", email_type: EMAIL_TYPES[0], target_audience: "",
  offer_details: "", discount: "", tone: TONES[0], cta_text: "" };

// ✅ Fixed: treat MongoDB UTC timestamps correctly
const timeAgo = (d) => {
  if (!d) return "";
  // MongoDB returns ISO strings without Z — add Z to treat as UTC
  const raw = typeof d === "string" && !d.endsWith("Z") && !d.includes("+") ? d + "Z" : d;
  const ms = Date.now() - new Date(raw).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500,
        marginBottom: 6, color: "var(--text-secondary, #888)" }}>
        {label} {required && <span style={{ color: "#e07b39" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  border: "1px solid var(--border, #333)", borderRadius: 8,
  background: "var(--input-bg, #1a1a1a)", color: "var(--text, #f0f0f0)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

function Alert({ type, msg }) {
  if (!msg) return null;
  const colors = { error: "#e07b39", success: "#2a7a4b" };
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13,
      background: `${colors[type]}18`, border: `1px solid ${colors[type]}44`,
      color: colors[type], marginBottom: 12 }}>
      {msg}
    </div>
  );
}

export default function Campaigns() {
  const [view, setView] = useState("list");
  const [campaigns, setCampaigns] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState("");

  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [previewTab, setPreviewTab] = useState("preview");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    if (view === "list") {
      setLoadingList(true);
      listCampaigns().then(setCampaigns).catch(() => {}).finally(() => setLoadingList(false));
    }
  }, [view]);

  const handleFormChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setFormError(""); };

  const handleGenerate = async () => {
    const required = ["campaign_name", "target_audience", "offer_details", "cta_text"];
    for (const f of required) { if (!form[f].trim()) { setFormError(`Please fill in: ${f.replace(/_/g, " ")}`); return; } }
    setGenerating(true); setFormError("");
    try {
      const result = await generateEmail(form);
      setPreview(result); setSubject(result.subject); setBodyHtml(result.body_html);
      setRecipients([]); setSendSuccess(""); setSendError(""); setView("preview");
    } catch (err) {
      const detail = err?.response?.data?.detail || "Generation failed. Please try again.";
      setFormError(err?.response?.status === 429 ? "⏳ Rate limit hit. Wait 1 minute and try again." : detail);
    } finally { setGenerating(false); }
  };

  const openDraft = async (campaign) => {
    setLoadingDraft(true);
    try {
      let data = campaign;
      if (!campaign.body_html) data = await getCampaign(campaign.id);
      setPreview({ campaign_id: data.id });
      setSubject(data.subject || "");
      setBodyHtml(data.body_html || data.body || "");
      setRecipients(data.recipients || []);
      setSendSuccess(""); setSendError(""); setPreviewTab("preview");
      setView("preview");
    } catch { alert("Failed to load campaign. Please try again."); }
    finally { setLoadingDraft(false); }
  };

  const addRecipients = () => {
    const emails = recipientInput.split(",").map(e => e.trim()).filter(Boolean);
    const invalid = emails.filter(e => !validateEmail(e));
    if (invalid.length) { setSendError(`Invalid email(s): ${invalid.join(", ")}`); return; }
    setRecipients(prev => [...new Set([...prev, ...emails])]);
    setRecipientInput(""); setSendError("");
  };

  const removeRecipient = (r) => setRecipients(prev => prev.filter(x => x !== r));

  const handleSend = async () => {
    if (!recipients.length) { setSendError("Add at least one recipient."); return; }
    if (!subject.trim()) { setSendError("Subject cannot be empty."); return; }
    if (!bodyHtml.trim()) { setSendError("Email body cannot be empty."); return; }
    setSending(true); setSendError("");
    try {
      const result = await sendCampaign(preview.campaign_id, { recipients, subject, body_html: bodyHtml });
      setSendSuccess(`✓ Sent to ${result.sent_count} recipient(s)!`);
      setTimeout(() => { setView("list"); setForm(EMPTY_FORM); }, 2500);
    } catch (err) {
      setSendError(err?.response?.data?.detail || "Send failed. Please try again.");
    } finally { setSending(false); }
  };

  const card = { background: "var(--card-bg, #151515)", border: "1px solid var(--border, #2a2a2a)", borderRadius: 12, padding: 20 };
  const btn = (color = "#c9a96e") => ({ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", background: color, color: "#111", transition: "opacity .15s" });

  // ── LIST ─────────────────────────────────────────────────────────────────
  if (view === "list") return (
    <div>
      {loadingDraft && (
        <div style={{ position: "fixed", inset: 0, background: "#00000077", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 999, fontSize: 14, color: "#fff" }}>
          Loading campaign…
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Email Campaigns</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #888)", marginTop: 3 }}>AI-generated email marketing</div>
        </div>
        <button style={btn()} onClick={() => { setForm(EMPTY_FORM); setFormError(""); setView("form"); }}>+ New Campaign</button>
      </div>

      {loadingList ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary, #888)" }}>Loading…</div>
      ) : campaigns.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No campaigns yet</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #888)", marginBottom: 20 }}>Generate your first AI email campaign</div>
          <button style={btn()} onClick={() => setView("form")}>Generate with AI</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {campaigns.map(c => (
            <div key={c.id}
              style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", cursor: c.status === "draft" ? "pointer" : "default",
                transition: "border-color .15s" }}
              onMouseEnter={e => { if (c.status === "draft") e.currentTarget.style.borderColor = "#c9a96e66"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border, #2a2a2a)"; }}
              onClick={() => c.status === "draft" && openDraft(c)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  {c.status === "draft" && (
                    <span style={{ fontSize: 10, color: "#c9a96e", background: "#c9a96e15",
                      border: "1px solid #c9a96e33", borderRadius: 4, padding: "1px 6px" }}>
                      Click to edit & send
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, #888)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.subject}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                  background: c.status === "sent" ? "#2a7a4b22" : "#c9a96e22",
                  color: c.status === "sent" ? "#2a7a4b" : "#c9a96e",
                  border: `1px solid ${c.status === "sent" ? "#2a7a4b44" : "#c9a96e44"}` }}>
                  {c.status}
                </span>
                {c.sent_count > 0 && <span style={{ fontSize: 12, color: "var(--text-secondary, #888)" }}>{c.sent_count} sent</span>}
                <span style={{ fontSize: 12, color: "var(--text-secondary, #888)" }}>{timeAgo(c.created_at)}</span>
                {c.status === "draft" && <span style={{ fontSize: 18, color: "#c9a96e" }}>→</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── FORM ─────────────────────────────────────────────────────────────────
  if (view === "form") return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none",
          color: "var(--text-secondary, #888)", cursor: "pointer", fontSize: 13, padding: 0 }}>← Back</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>New Campaign</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #888)" }}>AI will write the email for you</div>
        </div>
      </div>
      <div style={card}>
        <Field label="Campaign Name" required>
          <input name="campaign_name" value={form.campaign_name} onChange={handleFormChange}
            placeholder="e.g. Summer Sale 2025" style={inputStyle} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email Type">
            <select name="email_type" value={form.email_type} onChange={handleFormChange} style={selectStyle}>
              {EMAIL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Tone">
            <select name="tone" value={form.tone} onChange={handleFormChange} style={selectStyle}>
              {TONES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Target Audience" required>
          <input name="target_audience" value={form.target_audience} onChange={handleFormChange}
            placeholder="e.g. Young professionals aged 25–35" style={inputStyle} />
        </Field>
        <Field label="Offer Details" required>
          <textarea name="offer_details" value={form.offer_details} onChange={handleFormChange}
            placeholder="e.g. Buy 2 get 1 free this weekend only"
            rows={3} style={{ ...inputStyle, resize: "none" }} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Discount (optional)">
            <input name="discount" value={form.discount} onChange={handleFormChange}
              placeholder="e.g. 30% OFF" style={inputStyle} />
          </Field>
          <Field label="Call to Action" required>
            <input name="cta_text" value={form.cta_text} onChange={handleFormChange}
              placeholder="e.g. Shop Now" style={inputStyle} />
          </Field>
        </div>
        <Alert type="error" msg={formError} />
        <button onClick={handleGenerate} disabled={generating}
          style={{ ...btn(), width: "100%", padding: "11px 18px",
            opacity: generating ? 0.6 : 1, cursor: generating ? "not-allowed" : "pointer" }}>
          {generating ? "✨ Generating with AI…" : "✨ Generate Email"}
        </button>
      </div>
    </div>
  );

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  if (view === "preview") return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none",
            color: "var(--text-secondary, #888)", cursor: "pointer", fontSize: 13, padding: 0 }}>← Back</button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Preview & Send</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary, #888)" }}>Review, edit, add recipients, then send</div>
          </div>
        </div>
        <button onClick={handleSend} disabled={sending || !!sendSuccess}
          style={{ ...btn(), opacity: sending || sendSuccess ? 0.6 : 1,
            cursor: sending || sendSuccess ? "not-allowed" : "pointer" }}>
          {sending ? "Sending…" : "📤 Send Campaign"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8,
              color: "var(--text-secondary, #888)", textTransform: "uppercase", letterSpacing: 1 }}>Subject Line</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
          </div>
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8,
              color: "var(--text-secondary, #888)", textTransform: "uppercase", letterSpacing: 1 }}>
              Recipients ({recipients.length})
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input value={recipientInput} onChange={e => setRecipientInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipients(); }}}
                placeholder="email@example.com" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addRecipients} style={{ ...btn(), padding: "9px 14px", flexShrink: 0 }}>+</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary, #888)", marginBottom: 8 }}>
              Press Enter or comma to add multiple
            </div>
            {recipients.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 100, overflowY: "auto" }}>
                {recipients.map(r => (
                  <span key={r} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                    padding: "3px 8px", borderRadius: 20, background: "#c9a96e22",
                    border: "1px solid #c9a96e44", color: "#c9a96e" }}>
                    {r}
                    <button onClick={() => removeRecipient(r)} style={{ background: "none", border: "none",
                      color: "inherit", cursor: "pointer", padding: 0, fontSize: 13 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Alert type="error" msg={sendError} />
          <Alert type="success" msg={sendSuccess} />
        </div>

        <div style={{ ...card, padding: 0, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border, #2a2a2a)", flexShrink: 0 }}>
            {["preview", "edit"].map(tab => (
              <button key={tab} onClick={() => setPreviewTab(tab)}
                style={{ padding: "11px 20px", fontSize: 13, fontWeight: 500, background: "none",
                  border: "none", cursor: "pointer",
                  color: previewTab === tab ? "#c9a96e" : "var(--text-secondary, #888)",
                  borderBottom: previewTab === tab ? "2px solid #c9a96e" : "2px solid transparent" }}>
                {tab === "preview" ? "👁 Preview" : "✏️ Edit HTML"}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {previewTab === "preview" ? (
              <iframe srcDoc={bodyHtml} title="Email Preview"
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                sandbox="allow-same-origin" />
            ) : (
              <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                style={{ ...inputStyle, width: "100%", height: "100%", boxSizing: "border-box",
                  resize: "none", borderRadius: 0, border: "none", fontFamily: "monospace",
                  fontSize: 12, padding: 16 }}
                spellCheck={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
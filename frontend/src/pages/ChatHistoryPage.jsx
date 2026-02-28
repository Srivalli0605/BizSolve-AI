// pages/ChatHistoryPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const timeAgo = (d) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Markdown parser (same as ChatBubble) ────────────────
function boldify(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong style='font-weight:600;color:inherit'>$1</strong>")
    .replace(/\*([^*]+)\*/g, "$1");
}

function parseMarkdown(text) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: "4px" }} />;

    // ## Heading
    if (/^##\s/.test(trimmed)) {
      const content = trimmed.replace(/^##\s*/, "");
      return (
        <div key={i} style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.82rem", color: "var(--accent)", letterSpacing: "0.02em", margin: "10px 0 3px" }}
          dangerouslySetInnerHTML={{ __html: boldify(content) }} />
      );
    }

    // ### Heading
    if (/^###\s/.test(trimmed)) {
      const content = trimmed.replace(/^###\s*/, "");
      return (
        <div key={i} style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "var(--accent)", letterSpacing: "0.03em", margin: "8px 0 3px" }}
          dangerouslySetInnerHTML={{ __html: boldify(content) }} />
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      const content = trimmed.replace(/^\d+\.\s*/, "");
      return (
        <div key={i} style={{ display: "flex", gap: "7px", margin: "3px 0", alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent2)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.74rem", flexShrink: 0, minWidth: "16px" }}>{num}.</span>
          <span style={{ fontSize: "0.8rem", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    // Bullet
    if (/^[-*•]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s*/, "");
      return (
        <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0", alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent2)", flexShrink: 0, marginTop: "7px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent2)", display: "inline-block" }} />
          <span style={{ fontSize: "0.8rem", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    // Section header ending with ":"
    if (trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.includes(".")) {
      return (
        <div key={i} style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.72rem", color: "var(--accent)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "8px 0 3px" }}
          dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
      );
    }

    return (
      <p key={i} style={{ margin: "2px 0", fontSize: "0.8rem", lineHeight: 1.6, wordBreak: "break-word" }}
        dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    );
  });
}

export default function ChatHistoryPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/chatlogs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.chatlogs ?? [];
      setLogs(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch {
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const deleteLog = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/chatlogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(prev => prev.filter(l => (l.id || l._id) !== id));
    } catch {
      alert("Failed to delete log.");
    }
  };

  return (
    <div className="chat-history-page">

      {/* Header */}
      <div className="chat-page-header">
        <div>
          <div className="chat-page-title">Chat History</div>
          <div className="chat-page-sub">{logs.length} conversation{logs.length !== 1 ? "s" : ""} logged</div>
        </div>
        <button className="chat-refresh-btn" onClick={fetchLogs} title="Refresh">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 4a8 8 0 1112 0M16 4v4h-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="chat-history-loading">
          <div className="dash-loading-dot" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="chat-error-banner" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && !error && (
        <div className="chat-history-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.2, marginBottom: 10 }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          No chat history yet. Start a conversation with BizWiser!
        </div>
      )}

      {/* Log list */}
      <div className="chat-history-list">
        {logs.map((log) => {
          const id = log.id || log._id;
          return (
            <div className="chat-history-item" key={id}>

              {/* Meta row */}
              <div className="chat-history-meta">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--input-bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="10" cy="7" r="3"/><path d="M3 18c0-4 3-6 7-6s7 2 7 6"/>
                    </svg>
                  </div>
                  <span className="chat-history-email">{log.customer_email || "You"}</span>
                </div>
                <span className="chat-history-time">{timeAgo(log.timestamp)}</span>
                <button className="chat-history-delete" onClick={() => deleteLog(id)} title="Delete">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 5l10 10M15 5L5 15"/>
                  </svg>
                </button>
              </div>

              {/* Question bubble */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span className="chat-history-label">You</span>
                <div style={{
                  background: "rgba(232,213,163,0.08)",
                  border: "1px solid rgba(232,213,163,0.15)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 300,
                  color: "var(--text)",
                  lineHeight: 1.55,
                  flex: 1,
                }}>
                  {log.message}
                </div>
              </div>

              {/* Answer bubble with markdown */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span className="chat-history-label bot">AI</span>
                <div style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  color: "var(--text)",
                  flex: 1,
                  lineHeight: 1.6,
                }}>
                  {parseMarkdown(log.response)}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
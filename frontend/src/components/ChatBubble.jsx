// components/chat/ChatBubble.jsx

function parseMarkdown(text) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: "6px" }} />;

    // ## Heading
    if (/^##\s/.test(trimmed)) {
      const content = trimmed.replace(/^##\s*/, "");
      return (
        <div key={i} style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "0.88rem",
          color: "var(--accent)",
          letterSpacing: "0.02em",
          margin: "14px 0 5px",
        }}
          dangerouslySetInnerHTML={{ __html: boldify(content) }}
        />
      );
    }

    // ### Heading
    if (/^###\s/.test(trimmed)) {
      const content = trimmed.replace(/^###\s*/, "");
      return (
        <div key={i} style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "0.82rem",
          color: "var(--accent)",
          letterSpacing: "0.03em",
          margin: "12px 0 4px",
        }}
          dangerouslySetInnerHTML={{ __html: boldify(content) }}
        />
      );
    }

    // Numbered list: "1. text"
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      const content = trimmed.replace(/^\d+\.\s*/, "");
      return (
        <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0", alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent2)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem", flexShrink: 0, minWidth: "18px" }}>{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    // Bullet: "- text" or "* text"
    if (/^[-*•]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s*/, "");
      return (
        <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0", alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent2)", flexShrink: 0, marginTop: "6px", width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent2)", display: "inline-block" }} />
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    // Section header: line ends with ":" and is short
    if (trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.includes(".")) {
      return (
        <div key={i} style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "var(--accent)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "10px 0 4px" }}
          dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
      );
    }

    // Normal paragraph
    return <p key={i} style={{ margin: "2px 0", wordBreak: "break-word", overflowWrap: "anywhere" }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
}

function boldify(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong style='font-weight:600;color:inherit'>$1</strong>")
    .replace(/\*([^*]+)\*/g, "$1");
}

export default function ChatBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`chat-bubble-row ${isUser ? "chat-bubble-user-row" : "chat-bubble-bot-row"}`}>

      {!isUser && (
        <div className="chat-avatar chat-avatar-bot">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 10c0 3.866-3.134 7-7 7a6.98 6.98 0 01-3.5-.937L3 17l.937-3.5A6.98 6.98 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z"/>
          </svg>
        </div>
      )}

      <div
        className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-bot"}`}
        style={{ height: "auto", overflow: "visible", whiteSpace: "pre-wrap" }}
      >
        {isUser
          ? <span style={{ wordBreak: "break-word" }}>{text}</span>
          : (
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.84rem",
              fontWeight: 300,
              lineHeight: 1.65,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}>
              {parseMarkdown(text)}
            </div>
          )
        }
      </div>

      {isUser && (
        <div className="chat-avatar chat-avatar-user">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="7" r="3"/><path d="M3 18c0-4 3-6 7-6s7 2 7 6"/>
          </svg>
        </div>
      )}
    </div>
  );
}
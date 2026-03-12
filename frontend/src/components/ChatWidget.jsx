// components/chat/ChatWidget.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import "../styles/Chat.css";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm BizWiser, your AI business growth advisor. How can I help you today?" },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: "bot", text: res.data.response }]);
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
      setMessages(prev => [...prev, { role: "bot", text: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-dot" />
        <div>
          <div className="chat-header-title">BizWiser</div>
          <div className="chat-header-sub">Powered by Gemini</div>
        </div>
        <div className="chat-header-status">
          <span className="chat-status-dot" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} text={msg.text} />
        ))}

        {loading && (
          <div className="chat-bubble-row chat-bubble-bot-row">
            <div className="chat-avatar chat-avatar-bot">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 10c0 3.866-3.134 7-7 7a6.98 6.98 0 01-3.5-.937L3 17l.937-3.5A6.98 6.98 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z"/>
              </svg>
            </div>
            <div className="chat-bubble chat-bubble-bot chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="chat-error-banner">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 13.5v.5"/>
          </svg>
          {error}
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask BizWiser anything about your business..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className={`chat-send-btn ${loading ? "loading" : ""}`}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          title="Send"
        >
          {loading
            ? <div className="chat-spinner" />
            : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M17 3L3 9l6 2 2 6 6-14z" strokeLinejoin="round"/>
              </svg>
            )
          }
        </button>
      </div>
      <div className="chat-input-hint">Press Enter to send · Shift+Enter for newline</div>
    </div>
  );
}
// pages/chat/ChatPage.jsx
import ChatWidget from "../components/ChatWidget.jsx";

export default function ChatPage() {
  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div>
          <div className="chat-page-title">BizWiser</div>
          <div className="chat-page-sub">
            Your AI-powered business growth advisor
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
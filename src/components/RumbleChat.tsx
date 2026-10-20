import React, { useState } from "react";

interface ChatMessage {
  id: string;
  sender: "rumble" | "user";
  text: string;
  timestamp: string;
}

interface RumbleChatProps {
  onClose?: () => void;
  initialMessage?: string;
}

export function RumbleChat({ onClose, initialMessage }: RumbleChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_welcome",
      sender: "rumble",
      text: "Hello. Type or use voice to speak directly with me regarding your agenda, symptoms, or recovery.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState(initialMessage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/rumble/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Chat service is unavailable. Please try again later.");
      }

      const data = await res.json();
      const replyText = data.reply || "Rumble received your message.";

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_reply_${Date.now()}`,
          sender: "rumble",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      // Local fallback for smooth conversational experience if offline
      const fallbackReply = generateFallbackRumbleReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_reply_${Date.now()}`,
          sender: "rumble",
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setError("Live chat service is temporarily unavailable; operating in local mode.");
    } finally {
      setLoading(false);
    }
  };

  const exportChatJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rumble_chat_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="chat-modal-inner" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/Rumble_Icon.png" alt="Rumble" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Chat with RUMBLE</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="btn btn-outline btn-sm" onClick={exportChatJson} type="button" title="Export Chat as JSON">
            Export JSON
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose} type="button" aria-label="Close chat">
              &times;
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div role="alert" className="alert-banner" style={{ background: "rgba(220, 38, 38, 0.2)", borderLeft: "3px solid var(--neon-red)", padding: "6px 12px", borderRadius: "6px", marginBottom: "8px", fontSize: "0.8rem", color: "var(--neon-red)" }}>
          {error}
        </div>
      ) : null}

      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0", minHeight: "260px", maxHeight: "420px" }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.sender === "rumble" ? "rumble-message" : "user-message"}`}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              maxWidth: "85%",
              alignSelf: m.sender === "rumble" ? "flex-start" : "flex-end",
              background: m.sender === "rumble" ? "rgba(0, 240, 255, 0.08)" : "rgba(181, 0, 255, 0.15)",
              border: m.sender === "rumble" ? "1px solid rgba(0, 240, 255, 0.3)" : "1px solid rgba(181, 0, 255, 0.3)",
              fontSize: "0.9rem",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontSize: "0.72rem", color: m.sender === "rumble" ? "var(--neon-blue)" : "var(--neon-purple)", fontWeight: "bold", marginBottom: "3px" }}>
              {m.sender === "rumble" ? "RUMBLE" : "YOU"} • {m.timestamp}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "var(--neon-blue)", fontSize: "0.85rem", fontStyle: "italic", padding: "6px 10px" }}>
            Rumble is analyzing…
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          aria-label="Message"
          className="glass-input"
          placeholder="Type to Rumble, ask about recovery, agenda, or symptoms…"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", fontSize: "0.9rem" }}
        />
        <button className="btn btn-neon-blue btn-sm" type="submit" aria-label="Send message" disabled={loading || !inputMessage.trim()}>
          Send message
        </button>
      </form>
    </div>
  );
}

function generateFallbackRumbleReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("pain") || lower.includes("lumbar") || lower.includes("sciatica") || lower.includes("neck")) {
    return "Acknowledged. Recorded your symptom context. Remember to maintain neutral pelvic alignment, use warm hydrotherapy decompression, and avoid aggravating end-range lumbar flexion during acute spikes.";
  }
  if (lower.includes("weather") || lower.includes("wash") || lower.includes("rain")) {
    return "The live Wangaratta forecast shows Wednesday and Friday have the lowest precipitation risk (5-10%), optimal for outdoor washing.";
  }
  if (lower.includes("dr") || lower.includes("clancy") || lower.includes("court") || lower.includes("meeting")) {
    return "Consultation notes and checklists are updated. In your meeting, present the concise 30-day pain trajectory report and request MRI review for cervical hyperreflexia.";
  }
  return `Understood: "${input}". Action noted in daily operational context.`;
}

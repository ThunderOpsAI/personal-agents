"use client";

import { FormEvent, useState } from "react";

type ChatResponse = {
  reply: string;
  intent?: string;
};

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const chatEndpoint = "/api/v1/rumble/chat";

export function RumbleChat() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    setError(null);
    setIsSending(true);
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: message }]);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Chat service is unavailable.");
      const payload = (await response.json()) as ChatResponse;
      if (typeof payload.reply !== "string" || !payload.reply.trim()) {
        throw new Error("Chat service returned an invalid response.");
      }

      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: payload.reply }]);
      setDraft("");
    } catch {
      setError("Rumble chat is unavailable right now. Please try again shortly.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section aria-labelledby="rumble-chat-heading" className="rumble-chat">
      <div className="section-heading">
        <div>
          <h2 id="rumble-chat-heading">Chat with Rumble</h2>
          <p>Ask about your schedule, recovery, or the information currently available to Rumble.</p>
        </div>
      </div>
      <div aria-live="polite" className="chat-transcript" role="log">
        {messages.map((chatMessage) => (
          <p className={`chat-message ${chatMessage.role}`} key={chatMessage.id}>
            <strong>{chatMessage.role === "user" ? "You" : "Rumble"}:</strong> {chatMessage.text}
          </p>
        ))}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <form onSubmit={submitMessage}>
        <label htmlFor="rumble-chat-message">Message</label>
        <textarea
          id="rumble-chat-message"
          disabled={isSending}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message to Rumble"
          required
          rows={3}
          value={draft}
        />
        <button className="button" disabled={isSending || !draft.trim()} type="submit">
          {isSending ? "Sending…" : "Send message"}
        </button>
      </form>
    </section>
  );
}

import React, { useState } from "react";
import { SmsMessage } from "../../types";

interface ComposeSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (msg: SmsMessage) => void;
}

export function ComposeSmsModal({ isOpen, onClose, onSend }: ComposeSmsModalProps) {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return;

    const newMsg: SmsMessage = {
      id: `sms_${Date.now()}`,
      from: "Rumble OS",
      to: to.trim(),
      body: body.trim(),
      timestamp: new Date().toISOString(),
      read: true,
      direction: "outbound",
    };

    onSend(newMsg);
    setTo("");
    setBody("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "480px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Compose Text Message</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              To (Phone Number or Contact)
            </label>
            <input
              type="tel"
              className="glass-input"
              required
              placeholder="+61400000000"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ width: "100%", padding: "8px 10px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Message Body
            </label>
            <textarea
              className="glass-input"
              rows={4}
              required
              placeholder="Type your text message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-neon-blue btn-sm" type="submit">
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

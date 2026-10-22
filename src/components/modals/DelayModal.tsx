import React, { useState } from "react";
import { AgendaItem } from "../../types";

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AgendaItem | null;
  onConfirmReschedule: (item: AgendaItem, newTime: string) => void;
}

export function DelayModal({ isOpen, onClose, item, onConfirmReschedule }: DelayModalProps) {
  const [customDateTime, setCustomDateTime] = useState("");

  if (!isOpen || !item) return null;

  const handleQuickPreset = (hoursDelta: number, setTimeStr?: string) => {
    const target = new Date();
    if (setTimeStr) {
      target.setDate(target.getDate() + 1);
      const [h, m] = setTimeStr.split(":").map(Number);
      target.setHours(h, m, 0, 0);
    } else {
      target.setHours(target.getHours() + hoursDelta);
    }
    onConfirmReschedule(item, target.toISOString());
    onClose();
  };

  const handleCustomConfirm = () => {
    if (!customDateTime) return;
    onConfirmReschedule(item, new Date(customDateTime).toISOString());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "440px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Delay Agenda Item</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div style={{ margin: "12px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Reschedule <strong>"{item.title}"</strong>:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickPreset(2)}>
              In 2 Hours
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickPreset(0, "09:00")}>
              Tomorrow 9 AM
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickPreset(0, "14:00")}>
              Tomorrow 2 PM
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickPreset(0, "21:00")}>
              Tomorrow 9 PM
            </button>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Or Custom Date &amp; Time
            </label>
            <input
              type="datetime-local"
              className="glass-input"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-neon-blue btn-sm" type="button" onClick={handleCustomConfirm} disabled={!customDateTime}>
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

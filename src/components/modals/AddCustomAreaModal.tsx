import React, { useState } from "react";

interface AddCustomAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArea: (areaName: string) => void;
}

export function AddCustomAreaModal({ isOpen, onClose, onAddArea }: AddCustomAreaModalProps) {
  const [name, setName] = useState("");
  const [side, setSide] = useState("Right");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const fullName = `${side} ${name.trim()}`;
    onAddArea(fullName);
    setName("");
    setNotes("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "420px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Custom Body Area</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <form onSubmit={handleSave} style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Body Part Name *
            </label>
            <input
              type="text"
              className="glass-input"
              required
              placeholder="e.g. Wrist, Ankle, Hip..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "8px 10px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Side</label>
            <select
              className="glass-select"
              value={side}
              onChange={(e) => setSide(e.target.value)}
              style={{ width: "100%", padding: "8px 10px" }}
            >
              <option value="Right">Right</option>
              <option value="Left">Left</option>
              <option value="Bilateral">Bilateral (Both)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Area Notes / Context</label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Temporary sprain or post-surgical guarding..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", padding: "8px 10px" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-neon-blue btn-sm">
              Save &amp; Add to Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export function ExecutiveBriefingModal({ isOpen, onClose, onOpenChat }: ExecutiveBriefingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "800px", width: "95%", maxHeight: "88vh", overflowY: "auto", padding: "22px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge neon-purple">06:00 AM BRIEF</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Monday, October 19, 2026</span>
            </div>
            <h2 style={{ margin: "4px 0 0 0", fontSize: "1.3rem" }}>Morning Executive Briefing</h2>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px", lineHeight: 1.55, fontSize: "0.9rem" }}>
          <div className="glass-panel" style={{ padding: "14px", borderLeft: "3px solid var(--neon-blue)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "var(--neon-blue)" }}>
              🎯 Core Daily Focus & Medical Guardrails
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              Today's priorities balance critical consultations with cervical and lumbar pacing. Do not push through sharp radicular flares; hydrotherapy session scheduled for 11:00 AM provides warm-water buoyancy decompression.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
            <div className="glass-panel" style={{ padding: "12px", borderLeft: "3px solid var(--neon-purple)" }}>
              <strong style={{ display: "block", color: "var(--neon-purple)", fontSize: "0.9rem", marginBottom: "4px" }}>
                1. 08:30 AM • Solicitor Clancy
              </strong>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Key topic: Hardship documentation (R v Smith), Chemist Warehouse complaint timeline, and upcoming mention dates.
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "12px", borderLeft: "3px solid var(--neon-green)" }}>
              <strong style={{ display: "block", color: "var(--neon-green)", fontSize: "0.9rem", marginBottom: "4px" }}>
                2. 03:00 PM • Dr Khan
              </strong>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Examine brisk lower limb reflexes, clonus, right-side Hoffmann sign, and request cervical spine MRI imaging referral.
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "14px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "0.95rem" }}>
              📋 Weather & Routine Optimization
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <li><strong>Wangaratta Weather:</strong> Optimal drying conditions on Wednesday & Friday (lowest precipitation probability).</li>
              <li><strong>Hydrotherapy:</strong> Session 2 of 3 targets deep water core suspension and gait training.</li>
              <li><strong>MFA Unlock:</strong> Standing reminder to follow up with Deakin IT support.</li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--glass-border)" }}>
          <button className="btn btn-neon-blue btn-sm" type="button" onClick={() => { onClose(); onOpenChat(); }}>
            Discuss in Rumble Chat
          </button>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";

interface ConsultChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePermanentNote: (note: { title: string; content: string }) => void;
}

interface MeetingConfig {
  id: "clancy" | "drKhan";
  badge: string;
  tabTitle: string;
  tabSub: string;
  verbatim: string;
  defaultActions: { id: string; text: string; done: boolean }[];
}

const MEETINGS: Record<"clancy" | "drKhan", MeetingConfig> = {
  clancy: {
    id: "clancy",
    badge: "8:30 AM • Solicitor Clancy",
    tabTitle: "8:30 AM • Solicitor Clancy",
    tabSub: "Custody Risk & R v Smith Hardship",
    verbatim:
      "Good morning Clancy. Before we discuss procedural dates, I need to put on record our evidence regarding R v Smith hardship and the medical necessity of uninterrupted rehabilitation routines.",
    defaultActions: [
      { id: "c1", text: "Confirm receipt of updated medical timeline and Dr Anderson's clinical notes", done: false },
      { id: "c2", text: "Address R v Smith hardship argument regarding physical care requirements", done: false },
      { id: "c3", text: "Review Chemist Warehouse outreach statement and customer complaint record", done: false },
      { id: "c4", text: "Confirm next mention date and filing deadlines for statutory declaration", done: false },
      { id: "c5", text: "Obtain written summary of solicitor counsel before call ends", done: false },
    ],
  },
  drKhan: {
    id: "drKhan",
    badge: "3:00 PM • Dr Khan",
    tabTitle: "3:00 PM • Dr Khan",
    tabSub: "Reflex Check, Court Report & Scripts",
    verbatim:
      "Dr Khan, my neurologist noted 3+ brisk reflexes in the lower extremities and a positive Hoffmann sign. I need you to clinically document my cervical cord findings today and discuss an urgent MRI.",
    defaultActions: [
      { id: "k1", text: "Perform patellar, Achilles, and upper limb deep tendon reflex exam", done: false },
      { id: "k2", text: "Check for clonus and assess Hoffmann's reflex on right vs left hand", done: false },
      { id: "k3", text: "Review I-MED radiology imaging report and request cervical spine MRI referral", done: false },
      { id: "k4", text: "Renew hydrotherapy pool medical clearance certificate for 6 months", done: false },
      { id: "k5", text: "Update pharmacy scripts and clinical symptom report for legal representation", done: false },
    ],
  },
};

export function ConsultChecklistModal({ isOpen, onClose, onSavePermanentNote }: ConsultChecklistModalProps) {
  const [activeMeeting, setActiveMeeting] = useState<"clancy" | "drKhan">("clancy");
  const [actions, setActions] = useState(MEETINGS);
  const [customInput, setCustomInput] = useState("");
  const [liveNotes, setLiveNotes] = useState("");
  const [copiedStatus, setCopiedStatus] = useState("");
  const [savedFeedback, setSavedFeedback] = useState("");

  if (!isOpen) return null;

  const currentCfg = actions[activeMeeting];
  const completedCount = currentCfg.defaultActions.filter((a) => a.done).length;
  const totalCount = currentCfg.defaultActions.length;
  const progressPct = Math.round((completedCount / (totalCount || 1)) * 100);

  const toggleAction = (actionId: string) => {
    setActions((prev) => ({
      ...prev,
      [activeMeeting]: {
        ...prev[activeMeeting],
        defaultActions: prev[activeMeeting].defaultActions.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
      },
    }));
  };

  const addAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const newAction = {
      id: `custom_${Date.now()}`,
      text: customInput.trim(),
      done: false,
    };
    setActions((prev) => ({
      ...prev,
      [activeMeeting]: {
        ...prev[activeMeeting],
        defaultActions: [...prev[activeMeeting].defaultActions, newAction],
      },
    }));
    setCustomInput("");
  };

  const copyVerbatim = () => {
    navigator.clipboard.writeText(currentCfg.verbatim);
    setCopiedStatus("Copied to clipboard!");
    setTimeout(() => setCopiedStatus(""), 3000);
  };

  const handleSaveToPermanentNotes = () => {
    if (!liveNotes.trim()) return;
    onSavePermanentNote({
      title: `Meeting Notes: ${currentCfg.tabTitle}`,
      content: liveNotes.trim(),
    });
    setSavedFeedback("Saved to Notes & Scratchpad ✓");
    setTimeout(() => setSavedFeedback(""), 3500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "680px", width: "95%", maxHeight: "92vh", overflowY: "auto", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "1px solid var(--glass-border)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge neon-blue">High Priority</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Interactive Action Guide</span>
            </div>
            <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#fff" }}>Meeting Action Checklist</h2>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Meeting Switcher Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" }}>
          {(["clancy", "drKhan"] as const).map((key) => {
            const m = MEETINGS[key];
            const isActive = activeMeeting === key;
            return (
              <button
                key={key}
                type="button"
                className={`btn ${isActive ? "btn-neon-purple" : "btn-outline"}`}
                onClick={() => setActiveMeeting(key)}
                style={{ padding: "10px 12px", textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <strong style={{ fontSize: "0.92rem", color: "#fff" }}>{m.tabTitle}</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{m.tabSub}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: "14px", background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--neon-green)" }}>
              {completedCount} of {totalCount} actions completed
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{progressPct}% Done</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--neon-green)", transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Verbatim "Say This First" Box */}
        <div style={{ marginTop: "14px", padding: "14px", borderRadius: "10px", background: "rgba(0, 240, 255, 0.08)", borderLeft: "4px solid var(--neon-blue)", border: "1px solid rgba(0,240,255,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--neon-blue)" }}>
              Say This First (Exact Words)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {copiedStatus && <span style={{ fontSize: "0.72rem", color: "var(--neon-green)" }}>{copiedStatus}</span>}
              <button type="button" className="btn btn-sm btn-outline" onClick={copyVerbatim} style={{ padding: "3px 8px", fontSize: "0.72rem", borderColor: "var(--neon-blue)", color: "var(--neon-blue)" }}>
                Copy Words
              </button>
            </div>
          </div>
          <p style={{ fontSize: "0.95rem", fontWeight: "600", lineHeight: 1.45, color: "#fff", margin: 0 }}>
            "{currentCfg.verbatim}"
          </p>
        </div>

        {/* Action Steps */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "bold" }}>
            Action Steps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentCfg.defaultActions.map((action) => (
              <label
                key={action.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: action.done ? "rgba(0, 255, 102, 0.05)" : "rgba(255, 255, 255, 0.04)",
                  border: action.done ? "1px solid rgba(0, 255, 102, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={action.done}
                  onChange={() => toggleAction(action.id)}
                  style={{ accentColor: "var(--neon-green)", marginTop: "3px", width: "16px", height: "16px" }}
                />
                <span style={{ fontSize: "0.88rem", color: action.done ? "var(--text-secondary)" : "#fff", textDecoration: action.done ? "line-through" : "none", lineHeight: 1.4 }}>
                  {action.text}
                </span>
              </label>
            ))}
          </div>

          {/* Add custom action */}
          <form onSubmit={addAction} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <input
              type="text"
              className="glass-input"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="+ Add a custom item or question..."
              style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
            />
            <button type="submit" className="btn btn-outline btn-sm">
              Add
            </button>
          </form>
        </div>

        {/* Live Consult Notes */}
        <div style={{ marginTop: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#fff" }}>Live Meeting Notes</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {savedFeedback && <span style={{ fontSize: "0.72rem", color: "var(--neon-green)" }}>{savedFeedback}</span>}
              <button type="button" className="btn btn-sm btn-neon-blue" onClick={handleSaveToPermanentNotes} style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
                Save to Permanent Notes
              </button>
            </div>
          </div>
          <textarea
            className="glass-input"
            rows={4}
            value={liveNotes}
            onChange={(e) => setLiveNotes(e.target.value)}
            placeholder="Type instructions, advice, dates, or clinician comments here during the meeting..."
            style={{ width: "100%", padding: "10px", fontSize: "0.88rem", lineHeight: 1.4, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
          <button type="button" className="btn btn-neon-blue btn-sm" onClick={onClose} style={{ padding: "8px 20px" }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

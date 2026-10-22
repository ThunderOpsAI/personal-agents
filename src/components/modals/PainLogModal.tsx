import React, { useState } from "react";
import { PainAreaWeight, PainLogRecord } from "../../types";

interface PainLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PainLogRecord) => void;
  onOpenAnalytics: () => void;
  recentLogs: PainLogRecord[];
  customAreas: string[];
  onOpenAddArea: () => void;
}

const DEFAULT_ANATOMY = [
  "Right Lumbar",
  "Left Lumbar",
  "Neck / Cervical",
  "Right Shoulder",
  "Sciatica",
  "Thoracic",
  "Scapula",
  "Right Ankle",
  "Right Knee",
  "Left Knee",
  "Right Hip",
];

const PRESETS: Record<string, { areas: PainAreaWeight[]; mood: string; moodScore: number; score: number; soreness: string; note: string }> = {
  standard: {
    areas: [
      { area: "Right Lumbar", percentage: 70, score: 7.5 },
      { area: "Neck / Cervical", percentage: 30, score: 5.0 },
    ],
    mood: "Calm",
    moodScore: 6.0,
    score: 7.5,
    soreness: "Moderate",
    note: "Standard baseline flare; lumbar stiffness prominent.",
  },
  hydro: {
    areas: [
      { area: "Right Lumbar", percentage: 60, score: 5.0 },
      { area: "Thoracic", percentage: 40, score: 4.5 },
    ],
    mood: "Calm",
    moodScore: 7.5,
    score: 5.0,
    soreness: "Mild",
    note: "Post-hydro decompression; noticeable relief in lumbar compression.",
  },
  thoracic: {
    areas: [
      { area: "Thoracic", percentage: 70, score: 7.5 },
      { area: "Neck / Cervical", percentage: 30, score: 6.0 },
    ],
    mood: "OK",
    moodScore: 5.0,
    score: 7.5,
    soreness: "Moderate",
    note: "Mid-back fatigue from sustained desk posture.",
  },
  sciatica: {
    areas: [{ area: "Sciatica", percentage: 100, score: 9.5 }],
    mood: "Frustrated",
    moodScore: 2.5,
    score: 9.5,
    soreness: "Extreme",
    note: "Sharp shooting nerve pain down right leg; avoiding forward flexion.",
  },
  post_walk: {
    areas: [
      { area: "Right Lumbar", percentage: 60, score: 6.5 },
      { area: "Right Knee", percentage: 40, score: 5.5 },
    ],
    mood: "OK",
    moodScore: 5.0,
    score: 6.5,
    soreness: "Moderate",
    note: "Post-walk loading flare; gentle quad stretch needed.",
  },
  morning_stiffness: {
    areas: [
      { area: "Right Lumbar", percentage: 50, score: 7.0 },
      { area: "Thoracic", percentage: 50, score: 6.5 },
    ],
    mood: "Calm",
    moodScore: 4.5,
    score: 7.0,
    soreness: "Moderate",
    note: "Morning stiffness upon waking; beginning cat-cow mobility.",
  },
  neck_shoulder: {
    areas: [
      { area: "Neck / Cervical", percentage: 60, score: 7.0 },
      { area: "Right Shoulder", percentage: 40, score: 6.0 },
    ],
    mood: "Frustrated",
    moodScore: 4.0,
    score: 7.0,
    soreness: "Moderate",
    note: "Cervical and trapezius spasm; heat pack applied.",
  },
  white_fingers: {
    areas: [{ area: "Neck / Cervical", percentage: 100, score: 6.5 }],
    mood: "Anxious",
    moodScore: 4.0,
    score: 6.5,
    soreness: "Mild",
    note: "Cold triggered vascular / neurological pallor in fingertips.",
  },
  rest_day: {
    areas: [{ area: "Right Lumbar", percentage: 100, score: 3.5 }],
    mood: "Calm",
    moodScore: 8.0,
    score: 3.5,
    soreness: "None",
    note: "Rest day; calm nervous system and reduced guarding.",
  },
};

export function PainLogModal({
  isOpen,
  onClose,
  onSave,
  onOpenAnalytics,
  recentLogs,
  customAreas,
  onOpenAddArea,
}: PainLogModalProps) {
  const allAnatomy = Array.from(new Set([...DEFAULT_ANATOMY, ...customAreas]));

  const [selectedAreas, setSelectedAreas] = useState<PainAreaWeight[]>([
    { area: "Right Lumbar", percentage: 70, score: 7.5 },
    { area: "Neck / Cervical", percentage: 30, score: 5.0 },
  ]);
  const [moodScore, setMoodScore] = useState<number>(5);
  const [moodLabel, setMoodLabel] = useState<string>("Calm");
  const [soreness, setSoreness] = useState<string>("None");
  const [selectedTherapies, setSelectedTherapies] = useState<string[]>(["Hydrotherapy"]);
  const [selectedAggravators, setSelectedAggravators] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const totalPercent = selectedAreas.reduce((sum, a) => sum + (a.percentage || 0), 0);

  const toggleArea = (areaName: string) => {
    const exists = selectedAreas.some((a) => a.area === areaName);
    if (exists) {
      if (selectedAreas.length <= 1) {
        return;
      }
      const filtered = selectedAreas.filter((a) => a.area !== areaName);
      setSelectedAreas(autoBalance(filtered));
    } else {
      if (selectedAreas.length >= 3) {
        return;
      }
      const updated = [...selectedAreas, { area: areaName, percentage: 10, score: 6.0 }];
      setSelectedAreas(autoBalance(updated));
    }
  };

  const autoBalance = (areas: PainAreaWeight[]): PainAreaWeight[] => {
    if (areas.length === 1) return [{ ...areas[0], percentage: 100 }];
    if (areas.length === 2) return [{ ...areas[0], percentage: 70 }, { ...areas[1], percentage: 30 }];
    if (areas.length === 3) return [{ ...areas[0], percentage: 60 }, { ...areas[1], percentage: 25 }, { ...areas[2], percentage: 15 }];
    return areas;
  };

  const adjustPercent = (areaName: string, delta: number) => {
    setSelectedAreas((prev) => {
      const target = prev.find((a) => a.area === areaName);
      if (!target) return prev;
      const otherTotal = prev.filter((a) => a.area !== areaName).reduce((sum, a) => sum + a.percentage, 0);
      const maxAllowed = 100 - otherTotal;
      let nextVal = target.percentage + delta;
      nextVal = Math.max(5, Math.min(maxAllowed, nextVal));
      return prev.map((a) => (a.area === areaName ? { ...a, percentage: nextVal } : a));
    });
  };

  const setAreaScore = (areaName: string, score: number) => {
    setSelectedAreas((prev) => prev.map((a) => (a.area === areaName ? { ...a, score } : a)));
  };

  const loadPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setSelectedAreas(p.areas);
    setMoodScore(p.moodScore);
    setMoodLabel(p.mood);
    setSoreness(p.soreness);
    setNotes(p.note);
  };

  const toggleTherapy = (t: string) => {
    setSelectedTherapies((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleAggravator = (a: string) => {
    setSelectedAggravators((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleSave = () => {
    const primaryScore = selectedAreas[0]?.score ?? 6.0;
    const newLog: PainLogRecord = {
      id: `pl_${Date.now()}`,
      score: primaryScore,
      locations: selectedAreas,
      mood: moodLabel,
      moodScore,
      soreness,
      therapies: selectedTherapies,
      aggravators: selectedAggravators,
      notes: notes.trim() || "Routine clinical check-in",
      created_at: new Date().toISOString(),
    };
    onSave(newLog);
    onClose();
  };

  return (
    <div className="modal-overlay slide-up-overlay" onClick={onClose}>
      <div className="modal-content glass-panel slide-up-widget pain-log-widget" style={{ maxWidth: "960px", width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Log Pain & Symptom Check-in</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={onOpenAnalytics} title="Open Clinical Analytics">
              Analytics
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={onOpenAddArea} title="Add Custom Body Part">
              + Custom Area
            </button>
            <button className="btn-close" onClick={onClose} type="button">
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body-form pain-modal-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "12px" }}>
          {/* LEFT: Anatomy selection and dynamic area cards */}
          <div className="pain-modal-left-col" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="top-anatomy-panel glass-panel" style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className="section-label-cyan" style={{ fontSize: "0.82rem", fontWeight: "bold", color: "var(--neon-blue)" }}>
                  Select Pain Areas (1 to 3)
                </span>
                <span className="val-tag badge neon-blue" style={{ fontSize: "0.75rem" }}>
                  {selectedAreas.length}/3 Selected
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "6px" }}>
                {allAnatomy.map((area) => {
                  const isSel = selectedAreas.some((a) => a.area === area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`btn btn-sm ${isSel ? "btn-neon-blue" : "btn-outline"}`}
                      style={{ fontSize: "0.76rem", padding: "6px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {isSel ? `✓ ${area}` : area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Selected Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedAreas.map((slot, idx) => {
                const borderColors = ["var(--neon-blue)", "var(--neon-purple)", "var(--neon-green)"];
                const color = borderColors[idx % borderColors.length];
                return (
                  <div key={slot.area} className="glass-panel" style={{ padding: "12px", borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ color, fontSize: "0.9rem" }}>
                        Section {idx + 1}: {slot.area}
                      </strong>
                      {selectedAreas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleArea(slot.area)}
                          style={{ background: "none", border: "1px solid rgba(255, 60, 60, 0.4)", color: "var(--neon-red)", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "center" }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                          Pain % Weight
                        </label>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "3px 6px", borderRadius: "6px", border: "1px solid var(--glass-border)" }}>
                          <button
                            type="button"
                            onClick={() => adjustPercent(slot.area, -5)}
                            disabled={slot.percentage <= 5}
                            style={{ width: "26px", height: "26px", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer" }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: "40px", textAlign: "center", fontWeight: "bold", color: "var(--neon-green)", fontSize: "0.95rem" }}>
                            {slot.percentage}%
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustPercent(slot.area, 5)}
                            disabled={totalPercent >= 100}
                            style={{ width: "26px", height: "26px", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                          Score: <strong style={{ color: "var(--neon-red)" }}>{slot.score ?? 6.0}/10</strong>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={slot.score ?? 6.0}
                          onChange={(e) => setAreaScore(slot.area, parseFloat(e.target.value))}
                          style={{ width: "100%", accentColor: "var(--neon-red)" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Balance Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
              <div>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Total Allocation: </span>
                <strong style={{ color: totalPercent === 100 ? "var(--neon-green)" : "var(--neon-red)", fontSize: "0.95rem" }}>
                  {totalPercent}% {totalPercent === 100 ? "(Balanced ✓)" : "(Needs 100%)"}
                </strong>
              </div>
              {totalPercent !== 100 && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedAreas(autoBalance(selectedAreas))}>
                  Auto-Balance
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Presets, Mood, Soreness, Notes, and Save */}
          <div className="pain-modal-right-col" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="glass-panel" style={{ padding: "12px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: "var(--neon-blue)", display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Staging Presets (9 Clinical)</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {Object.keys(PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => loadPreset(key)}
                    style={{ padding: "5px 4px", fontSize: "0.72rem", textTransform: "capitalize" }}
                  >
                    {key.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem" }}>
                  Mood Level: <strong style={{ color: "var(--neon-blue)" }}>{moodScore}/10 ({moodLabel})</strong>
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                {["Happy (+2)", "OK (+1)", "Calm (+1)", "Frustrated (-1)", "Sad (-2)", "Anxious (-2)"].map((tag) => {
                  const label = tag.split(" ")[0];
                  const active = moodLabel === label;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMoodLabel(label)}
                      className={`btn btn-sm ${active ? "btn-neon-purple" : "btn-outline"}`}
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Physical Soreness</span>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {["None", "Mild", "Moderate", "Severe", "Extreme"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSoreness(s)}
                      className={`btn btn-sm ${soreness === s ? "btn-neon-red" : "btn-outline"}`}
                      style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Relief Therapies</span>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {["Hydrotherapy", "TENS Machine", "Meditate", "Yoga", "Heat Pack", "Cupping", "Massage Gun"].map((t) => {
                    const sel = selectedTherapies.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTherapy(t)}
                        className={`btn btn-sm ${sel ? "btn-neon-green" : "btn-outline"}`}
                        style={{ fontSize: "0.72rem", padding: "2px 6px" }}
                      >
                        {sel ? `✓ ${t}` : t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Clinical Notes</label>
                <textarea
                  className="glass-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes, triggers, observations..."
                  style={{ width: "100%", padding: "8px", fontSize: "0.85rem", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn-neon-red" onClick={handleSave} style={{ minWidth: "140px" }}>
                  Save pain log
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Today's logged history */}
        <div style={{ marginTop: "16px", borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--neon-blue)" }}>Today's Check-ins</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{recentLogs.length} Logged</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
            {recentLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "0.82rem" }}>
                <div>
                  <strong style={{ color: "var(--neon-red)", marginRight: "8px" }}>{log.score}/10</strong>
                  <span>{log.locations.map((l) => `${l.area} (${l.percentage}%)`).join(", ")}</span>
                  {log.notes && <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>— {log.notes}</span>}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

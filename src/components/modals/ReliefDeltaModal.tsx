import React, { useState } from "react";
import { ExerciseItem } from "../../data/exercise-db";

interface ReliefDeltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: ExerciseItem | null;
  onSave: (outcome: { routineId: string; routineTitle: string; postScore: number; notes: string }) => void;
}

export function ReliefDeltaModal({ isOpen, onClose, routine, onSave }: ReliefDeltaModalProps) {
  const [postScore, setPostScore] = useState(4.5);
  const [notes, setNotes] = useState("");

  if (!isOpen || !routine) return null;

  const handleSave = () => {
    onSave({
      routineId: routine.id,
      routineTitle: routine.name,
      postScore,
      notes,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "440px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log Relief Delta</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "0.88rem", color: "var(--neon-blue)", fontWeight: "600", margin: "0 0 10px 0" }}>
            Completed: {routine.name}
          </p>
          <div className="form-group">
            <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              New pain score after routine: <strong style={{ color: "var(--neon-green)" }}>{postScore} / 10</strong>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={postScore}
              onChange={(e) => setPostScore(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--neon-green)" }}
            />
          </div>
          <div className="form-group" style={{ marginTop: "12px" }}>
            <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Observations & Relief Notes
            </label>
            <input
              type="text"
              className="glass-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Decompressed lumbar, spine felt looser..."
              style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem" }}
            />
          </div>
        </div>
        <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Skip
          </button>
          <button className="btn btn-neon-green btn-sm" type="button" onClick={handleSave}>
            Save Outcome
          </button>
        </div>
      </div>
    </div>
  );
}

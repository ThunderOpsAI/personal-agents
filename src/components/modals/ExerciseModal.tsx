import React, { useState } from "react";
import { EXERCISE_DATABASE, ExerciseItem } from "../../data/exercise-db";

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRoutine: (routine: ExerciseItem) => void;
  onShowDemo: (routine: ExerciseItem) => void;
}

export function ExerciseModal({ isOpen, onClose, onStartRoutine, onShowDemo }: ExerciseModalProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [focusArea, setFocusArea] = useState<string>("all");

  if (!isOpen) return null;

  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    if (category !== "all" && ex.category !== category) return false;
    if (focusArea !== "all") {
      const match = ex.focus_areas.some((f) => f.toLowerCase().includes(focusArea.toLowerCase()));
      if (!match) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const inName = ex.name.toLowerCase().includes(q);
      const inInst = ex.instruction.toLowerCase().includes(q);
      const inAreas = ex.focus_areas.some((f) => f.toLowerCase().includes(q));
      if (!inName && !inInst && !inAreas) return false;
    }
    return true;
  });

  // Top 3 recommendations
  const aiRecommendations = EXERCISE_DATABASE.slice(0, 3);

  return (
    <div className="modal-overlay slide-up-overlay" onClick={onClose}>
      <div className="modal-content glass-panel slide-up-widget exercise-widget" style={{ maxWidth: "880px", width: "95%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Explore Exercise & Rehab Library</h2>
            <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Search 34+ clinical-grade Yoga, Pilates, Stretches, Spine Stabilization & Hydrotherapy routines.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="glass-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, body area (e.g. lumbar, cervical, psoas), or keyword..."
              style={{ flex: 1, padding: "9px 14px", fontSize: "0.9rem" }}
            />
            {search && (
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              { id: "all", label: "All Categories" },
              { id: "yoga", label: "Yoga" },
              { id: "pilates", label: "Pilates" },
              { id: "stretches", label: "Stretches & Mobility" },
              { id: "rehab", label: "Spine & Neuro Rehab" },
              { id: "hydrotherapy", label: "Hydrotherapy" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                className={`btn btn-sm ${category === c.id ? "btn-neon-blue" : "btn-outline"}`}
                onClick={() => setCategory(c.id)}
                style={{ fontSize: "0.78rem", padding: "4px 10px" }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Focus Area Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginRight: "4px" }}>Focus Area:</span>
            {[
              { id: "all", label: "All Areas" },
              { id: "lumbar", label: "Lower Back" },
              { id: "cervical", label: "Neck / Cervical" },
              { id: "thoracic", label: "Mid Back / Shoulders" },
              { id: "hip", label: "Hips & Pelvis" },
              { id: "sciatic", label: "Sciatica / Hamstrings" },
              { id: "core", label: "Core Stabilization" },
            ].map((a) => (
              <button
                key={a.id}
                type="button"
                className={`btn btn-sm ${focusArea === a.id ? "btn-neon-purple" : "btn-outline"}`}
                onClick={() => setFocusArea(a.id)}
                style={{ fontSize: "0.72rem", padding: "2px 8px" }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily AI Recommendations */}
        <div style={{ margin: "10px 0 14px 0", background: "rgba(0, 240, 255, 0.05)", border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <strong style={{ fontSize: "0.85rem", color: "var(--neon-blue)" }}>Daily AI Recommendations (Pain-Matched)</strong>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Based on active lumbar and cervical pain logs</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
            {aiRecommendations.map((rec) => (
              <div key={rec.id} className="glass-panel" style={{ padding: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#fff" }}>{rec.name}</strong>
                    <span className="badge neon-green" style={{ fontSize: "0.68rem" }}>{rec.duration_minutes}m</span>
                  </div>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "4px 0 8px 0" }}>
                    {rec.instruction}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="btn btn-neon-blue btn-sm" type="button" onClick={() => onStartRoutine(rec)} style={{ flex: 1, padding: "4px 8px", fontSize: "0.75rem" }}>
                    Start Routine
                  </button>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => onShowDemo(rec)} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                    Show Me
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog List */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
            Exercise Library ({filteredExercises.length})
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "40vh", overflowY: "auto", paddingRight: "4px" }}>
          {filteredExercises.map((ex) => (
            <div key={ex.id} className="glass-panel" style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "0.92rem", color: "#fff" }}>{ex.name}</strong>
                  <span className="badge neon-blue" style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>{ex.category}</span>
                  <span className="badge neon-purple" style={{ fontSize: "0.7rem" }}>{ex.duration_minutes} min</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>• {ex.intensity}</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.35 }}>
                  {ex.instruction}
                </p>
                <div style={{ fontSize: "0.72rem", color: "var(--neon-green)", marginTop: "4px" }}>
                  Focus: {ex.focus_areas.join(", ")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                <button className="btn btn-neon-blue btn-sm" type="button" onClick={() => onStartRoutine(ex)} style={{ whiteSpace: "nowrap" }}>
                  Start Routine
                </button>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => onShowDemo(ex)} style={{ whiteSpace: "nowrap" }}>
                  Show Me
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

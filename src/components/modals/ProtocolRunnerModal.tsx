import React, { useState, useEffect, useMemo } from "react";
import { EXERCISE_DATABASE, ExerciseItem, ExerciseStep } from "../../data/exercise-db";

interface ProtocolRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: ExerciseItem | null;
  onFinish: (routine: ExerciseItem) => void;
  onSwapRoutine: () => void;
}

interface StepWithOriginal extends ExerciseStep {
  originalTitle?: string;
  originalCue?: string;
  originalFrames?: string[];
  isSwapped?: boolean;
}

export function ProtocolRunnerModal({
  isOpen,
  onClose,
  routine,
  onFinish,
  onSwapRoutine,
}: ProtocolRunnerModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(900);
  const [stepSecondsRemaining, setStepSecondsRemaining] = useState(225);
  const [activeSteps, setActiveSteps] = useState<StepWithOriginal[]>([]);
  const [isSwapExerciseModalOpen, setIsSwapExerciseModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const getDailySwapStorageKey = () =>
    "rumble_daily_exercise_swaps_" + new Date().toLocaleDateString("en-CA");

  const pruneOldExerciseSwaps = () => {
    try {
      const todayKey = getDailySwapStorageKey();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("rumble_daily_exercise_swaps_") && k !== todayKey) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn("Failed to prune old exercise swaps:", e);
    }
  };

  const getTodaySwaps = (): Record<string, any> => {
    try {
      const raw = localStorage.getItem(getDailySwapStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const setTodaySwap = (routineId: string, stepIdx: number, swapData: any) => {
    try {
      const key = getDailySwapStorageKey();
      const current = getTodaySwaps();
      if (swapData === null) {
        delete current[`${routineId}:${stepIdx}`];
      } else {
        current[`${routineId}:${stepIdx}`] = swapData;
      }
      localStorage.setItem(key, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to persist exercise swap:", e);
    }
  };

  // Initialize and calibrate steps on routine change
  useEffect(() => {
    if (!routine) return;
    pruneOldExerciseSwaps();

    const totalSec = (routine.duration_minutes || 15) * 60;
    setTotalSecondsRemaining(totalSec);
    setCurrentStepIndex(0);
    setIsPaused(false);

    const baseSteps: StepWithOriginal[] = (routine.steps || []).map((s) => ({
      ...s,
      originalTitle: s.title,
      originalCue: s.cue,
      originalFrames: s.frames ? [...s.frames] : [],
    }));

    // Calibrate durations to sum strictly to declared routine duration
    if (baseSteps.length > 0) {
      const sum = baseSteps.reduce((acc, step) => acc + (step.duration || 45), 0);
      if (sum !== totalSec && totalSec > 0) {
        const factor = totalSec / sum;
        let allocated = 0;
        baseSteps.forEach((s, idx) => {
          if (idx === baseSteps.length - 1) {
            s.duration = totalSec - allocated;
          } else {
            s.duration = Math.round((s.duration || 45) * factor);
            allocated += s.duration;
          }
        });
      }
    }

    // Apply same-day exercise swap overrides (preserving calibrated slot duration)
    const todaySwaps = getTodaySwaps();
    baseSteps.forEach((step, idx) => {
      const override = todaySwaps[`${routine.id}:${idx}`];
      if (override) {
        step.title = override.title;
        if (override.cue) step.cue = override.cue;
        if (override.frames) step.frames = override.frames;
        step.isSwapped = true;
      }
    });

    setActiveSteps(baseSteps);
    setStepSecondsRemaining(baseSteps[0]?.duration || 180);
  }, [routine]);

  // Timer interval
  useEffect(() => {
    if (!isOpen || isPaused || totalSecondsRemaining <= 0 || activeSteps.length === 0) return;

    const interval = setInterval(() => {
      setTotalSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (routine) onFinish(routine);
          return 0;
        }
        return prev - 1;
      });

      setStepSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (currentStepIndex < activeSteps.length - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            return activeSteps[nextIdx]?.duration || 180;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, totalSecondsRemaining, currentStepIndex, activeSteps, routine, onFinish]);

  // Deduplicated individual exercises (never routine titles)
  const uniqueExercises = useMemo(() => {
    const map = new Map<string, { title: string; cue: string; frames: string[]; category: string }>();
    const routineTitles = new Set<string>();

    EXERCISE_DATABASE.forEach((r) => {
      if (r.title) routineTitles.add(r.title.trim().toLowerCase());
      if (r.name) routineTitles.add(r.name.trim().toLowerCase());
    });

    EXERCISE_DATABASE.forEach((r) => {
      (r.steps || []).forEach((step) => {
        const norm = (step.title || "").trim().toLowerCase();
        if (norm && !routineTitles.has(norm) && !map.has(norm)) {
          map.set(norm, {
            title: step.title.trim(),
            cue: step.cue || "",
            frames: step.frames ? [...step.frames] : [],
            category: r.category || "rehab",
          });
        }
      });
    });

    return Array.from(map.values());
  }, []);

  if (!isOpen || !routine) return null;

  const currentStep = activeSteps[currentStepIndex] || {
    title: "Alignment & Settling",
    duration: 225,
    cue: "Find comfortable position and steady breathing.",
    frames: ["/exercises/supine_pelvic_tilts.jpg"],
  };

  const totalDuration = (routine.duration_minutes || 15) * 60;
  const totalElapsed = totalDuration - totalSecondsRemaining;
  const totalPct = Math.min(100, Math.round((totalElapsed / totalDuration) * 100));

  const stepDuration = currentStep.duration || 180;
  const stepElapsed = stepDuration - stepSecondsRemaining;
  const stepPct = Math.min(100, Math.round((stepElapsed / stepDuration) * 100));

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setStepSecondsRemaining(activeSteps[nextIdx]?.duration || 180);
    } else {
      onFinish(routine);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setStepSecondsRemaining(activeSteps[prevIdx]?.duration || 180);
    }
  };

  const handleOpenSwapExercise = () => {
    setIsPaused(true);
    setSearchFilter("");
    setIsSwapExerciseModalOpen(true);
  };

  const handleSelectExerciseSwap = (ex: { title: string; cue: string; frames: string[] }) => {
    const slotDuration = activeSteps[currentStepIndex].duration;
    const originalTitle = activeSteps[currentStepIndex].originalTitle || activeSteps[currentStepIndex].title;

    setTodaySwap(routine.id, currentStepIndex, {
      title: ex.title,
      cue: ex.cue,
      frames: ex.frames,
      swappedAt: new Date().toISOString(),
      originalTitle,
    });

    const updated = [...activeSteps];
    updated[currentStepIndex] = {
      ...updated[currentStepIndex],
      title: ex.title,
      cue: ex.cue,
      frames: ex.frames,
      duration: slotDuration,
      isSwapped: true,
    };

    setActiveSteps(updated);
    setStepSecondsRemaining(slotDuration);
    setIsSwapExerciseModalOpen(false);
  };

  const handleRestoreOriginalStep = () => {
    const slotDuration = activeSteps[currentStepIndex].duration;
    setTodaySwap(routine.id, currentStepIndex, null);

    const updated = [...activeSteps];
    const orig = updated[currentStepIndex];
    updated[currentStepIndex] = {
      ...orig,
      title: orig.originalTitle || orig.title,
      cue: orig.originalCue || orig.cue,
      frames: orig.originalFrames || orig.frames,
      duration: slotDuration,
      isSwapped: false,
    };

    setActiveSteps(updated);
    setStepSecondsRemaining(slotDuration);
    setIsSwapExerciseModalOpen(false);
  };

  const currentFrame = currentStep.frames?.[0] || "/exercises/constructive-rest.svg";
  const todaySwaps = getTodaySwaps();
  const currentStepSwap = todaySwaps[`${routine.id}:${currentStepIndex}`];

  const filteredExercises = uniqueExercises.filter((ex) => {
    if (ex.title.toLowerCase() === currentStep.title.toLowerCase()) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return ex.title.toLowerCase().includes(q) || ex.cue.toLowerCase().includes(q) || ex.category.toLowerCase().includes(q);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "580px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{routine.name}</h2>
              <span className="badge neon-purple">{routine.duration_minutes} Min Routine</span>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--neon-blue)", fontWeight: "bold", marginTop: "3px" }}>
              Total Remaining: {formatMinSec(totalSecondsRemaining)} / {formatMinSec(totalDuration)}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Visual Frame */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: "10px", overflow: "hidden", margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={currentFrame}
            alt={currentStep.title}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Step details & Controls */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                Step {currentStepIndex + 1} of {activeSteps.length}: {currentStep.title}
                {currentStep.isSwapped && (
                  <span className="badge" style={{ marginLeft: "8px", background: "rgba(0, 240, 255, 0.2)", color: "var(--neon-blue)", fontSize: "0.72rem" }}>
                    Swapped
                  </span>
                )}
              </h3>
              <p style={{ margin: "4px 0 10px 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {currentStep.cue}
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button className="btn btn-outline btn-sm" type="button" onClick={onSwapRoutine} title="Switch to another full routine">
                Swap Routine
              </button>
              <button className="btn btn-outline btn-sm" type="button" onClick={handleOpenSwapExercise} title="Swap this step in-place">
                Swap Exercise
              </button>
              <button
                className={`btn btn-sm ${isPaused ? "btn-neon-green" : "btn-outline"}`}
                type="button"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          {/* Dual Countdown Displays */}
          <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0, 240, 255, 0.25)", borderRadius: "8px", padding: "10px 14px", marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--neon-blue)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>
                  Routine Countdown
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--neon-purple)", lineHeight: 1, marginTop: "2px" }}>
                  {formatMinSec(totalSecondsRemaining)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Current Step Hold</span>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--neon-blue)", marginTop: "2px" }}>
                  {formatMinSec(stepSecondsRemaining)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "10px", marginBottom: "3px" }}>
              <span>Total Routine Progress</span>
              <span style={{ color: "var(--neon-blue)", fontWeight: "bold" }}>{totalPct}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${totalPct}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-blue), var(--neon-purple))", transition: "width 0.3s ease" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "6px", marginBottom: "2px" }}>
              <span>Step Hold</span>
              <span>{stepPct}%</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${stepPct}%`, height: "100%", background: "var(--neon-blue)", transition: "width 0.3s ease" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
          <button className="btn btn-outline" type="button" onClick={handlePrev} disabled={currentStepIndex === 0}>
            &larr; Prev Step
          </button>
          <button className="btn btn-neon-purple" type="button" onClick={handleNext}>
            {currentStepIndex === activeSteps.length - 1 ? "Complete Routine ✓" : "Next Step &rarr;"}
          </button>
        </div>

        {/* In-Modal Swap Exercise Sub-Dialog */}
        {isSwapExerciseModalOpen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(7, 13, 25, 0.96)",
              backdropFilter: "blur(8px)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Swap Exercise Step</h3>
              <button className="btn-close" type="button" onClick={() => setIsSwapExerciseModalOpen(false)}>
                &times;
              </button>
            </div>

            {currentStepSwap && (
              <div style={{ marginBottom: "12px" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleRestoreOriginalStep}
                  style={{ width: "100%", borderColor: "var(--neon-blue)", color: "var(--neon-blue)", fontWeight: "bold" }}
                >
                  ↺ Restore Original Step ({currentStepSwap.originalTitle || "Original"})
                </button>
              </div>
            )}

            <p style={{ margin: "0 0 10px 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Select an individual exercise to replace Step {currentStepIndex + 1} while preserving its {currentStep.duration}s time slot.
            </p>

            <input
              type="text"
              className="form-control"
              placeholder="Search individual exercises..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--text-primary)",
                marginBottom: "12px",
                fontSize: "0.85rem",
              }}
            />

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredExercises.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No individual exercises match your search.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.title}
                    className="glass-panel"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: "8px",
                    }}
                    onClick={() => handleSelectExerciseSwap(ex)}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span className={`exercise-tag ${ex.category}`}>{ex.category.toUpperCase()}</span>
                        <strong style={{ color: "var(--text-primary)", fontSize: "0.92rem" }}>{ex.title}</strong>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "3px", lineHeight: 1.3 }}>
                        {ex.cue}
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" style={{ whiteSpace: "nowrap" }} type="button">
                      Swap Step
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { ExerciseItem } from "../../data/exercise-db";

interface ProtocolRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: ExerciseItem | null;
  onFinish: (routine: ExerciseItem) => void;
  onSwapRoutine: () => void;
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

  const steps = routine?.steps || [];
  const currentStep = steps[currentStepIndex] || {
    title: "Alignment & Settling",
    duration: 225,
    cue: "Find comfortable position and steady breathing.",
    frames: ["/exercises/supine_pelvic_tilts.jpg"],
  };

  useEffect(() => {
    if (routine) {
      const totalSec = (routine.duration_minutes || 15) * 60;
      setTotalSecondsRemaining(totalSec);
      setCurrentStepIndex(0);
      setStepSecondsRemaining(steps[0]?.duration || Math.round(totalSec / (steps.length || 1)));
      setIsPaused(false);
    }
  }, [routine]);

  useEffect(() => {
    if (!isOpen || isPaused || totalSecondsRemaining <= 0) return;

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
          // Advance step if available
          if (currentStepIndex < steps.length - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            return steps[nextIdx]?.duration || 180;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, totalSecondsRemaining, currentStepIndex, steps, routine, onFinish]);

  if (!isOpen || !routine) return null;

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
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setStepSecondsRemaining(steps[nextIdx]?.duration || 180);
    } else {
      onFinish(routine);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setStepSecondsRemaining(steps[prevIdx]?.duration || 180);
    }
  };

  const currentFrame = currentStep.frames?.[0] || "/exercises/constructive-rest.svg";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "560px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
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
              // fallback if missing
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Step details & Timer */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                Step {currentStepIndex + 1} of {steps.length}: {currentStep.title}
              </h3>
              <p style={{ margin: "4px 0 10px 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {currentStep.cue}
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn btn-outline btn-sm" type="button" onClick={onSwapRoutine}>
                Swap
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
            {currentStepIndex === steps.length - 1 ? "Complete Routine ✓" : "Next Step &rarr;"}
          </button>
        </div>
      </div>
    </div>
  );
}

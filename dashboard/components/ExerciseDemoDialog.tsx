"use client";

import { useEffect, useRef } from "react";
import type { ExerciseRecommendation } from "./exercise-types";

type ExerciseDemoDialogProps = {
  exercise: ExerciseRecommendation | null;
  onClose: () => void;
};

function usableMediaUrl(exercise: ExerciseRecommendation): string | undefined {
  const candidate = exercise.video_url ?? exercise.image_url ?? exercise.media_url;
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(?:$|[?#])/i.test(url);
}

export function ExerciseDemoDialog({ exercise, onClose }: ExerciseDemoDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!exercise) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exercise, onClose]);

  if (!exercise) return null;
  const mediaUrl = usableMediaUrl(exercise);

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="exercise-demo-description"
        aria-labelledby="exercise-demo-title"
        aria-modal="true"
        className="exercise-demo-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="dialog-heading">
          <h2 id="exercise-demo-title">{exercise.name}</h2>
          <button aria-label="Close exercise demonstration" className="button secondary" onClick={onClose} ref={closeButtonRef} type="button">
            Close
          </button>
        </div>
        {exercise.instruction ? <p id="exercise-demo-description">{exercise.instruction}</p> : null}
        {mediaUrl ? (
          isVideo(mediaUrl) ? (
            <video aria-label={`${exercise.name} demonstration`} controls src={mediaUrl} />
          ) : (
            // API-provided media is intentionally rendered directly; there are no bundled demo assets.
            <img alt={`Demonstration for ${exercise.name}`} src={mediaUrl} />
          )
        ) : (
          <p className="unavailable" role="status">
            A demonstration is not available from the live exercise recommendation service.
          </p>
        )}
      </section>
    </div>
  );
}

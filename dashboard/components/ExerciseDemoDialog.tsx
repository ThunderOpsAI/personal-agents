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

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function toYouTubeEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.slice(1).split("/")[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    const vParam = parsed.searchParams.get("v");
    if (vParam) {
      return `https://www.youtube-nocookie.com/embed/${vParam}`;
    }
    if (parsed.pathname.startsWith("/embed/")) {
      const videoId = parsed.pathname.replace("/embed/", "").split("/")[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
  } catch {
    // fallback regex if URL parsing fails
  }
  const match = /(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/i.exec(url);
  const videoId = match ? match[1] : url;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
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
          isYouTubeUrl(mediaUrl) ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              src={toYouTubeEmbedUrl(mediaUrl)}
              style={{ width: "100%", aspectRatio: "16 / 9", border: 0 }}
              title={`${exercise.name} demonstration`}
              width="100%"
            />
          ) : isVideo(mediaUrl) ? (
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

import React, { useEffect } from "react";
import type { ExerciseRecommendation } from "./exercise-types";

interface ExerciseDemoDialogProps {
  exercise: ExerciseRecommendation | null;
  onClose: () => void;
}

export function ExerciseDemoDialog({ exercise, onClose }: ExerciseDemoDialogProps) {
  useEffect(() => {
    if (!exercise) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exercise, onClose]);

  if (!exercise) return null;

  const rawUrl = exercise.video_url || exercise.media_url || exercise.image_url;
  let isYouTube = false;
  let youTubeEmbedUrl = "";

  if (rawUrl) {
    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      isYouTube = true;
      youTubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }
  }

  const isVideoFile = rawUrl && !isYouTube && (rawUrl.endsWith(".mp4") || rawUrl.endsWith(".webm") || rawUrl.includes("video"));
  const isImageFile = rawUrl && !isYouTube && !isVideoFile;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="exercise-demo-dialog"
        role="dialog"
        aria-label={exercise.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-heading">
          <h2>{exercise.name}</h2>
          <button
            className="button secondary"
            aria-label="Close exercise demonstration"
            onClick={onClose}
            type="button"
          >
            &times;
          </button>
        </div>

        {exercise.instruction ? <p>{exercise.instruction}</p> : null}

        {isYouTube ? (
          <iframe
            src={youTubeEmbedUrl}
            title="Live exercise demonstration"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "340px", border: 0, borderRadius: "8px", marginTop: "1rem" }}
          />
        ) : isVideoFile ? (
          <video
            aria-label="Live exercise demonstration"
            src={rawUrl}
            controls
            style={{ width: "100%", maxHeight: "60vh", borderRadius: "8px", marginTop: "1rem" }}
          />
        ) : isImageFile ? (
          <img
            src={rawUrl}
            alt={`Demonstration for ${exercise.name}`}
            style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "8px", marginTop: "1rem" }}
          />
        ) : (
          <p role="status" className="unavailable" style={{ marginTop: "1rem" }}>
            Live exercise demonstration is not available.
          </p>
        )}
      </div>
    </div>
  );
}

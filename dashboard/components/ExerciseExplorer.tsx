"use client";

import { useCallback, useEffect, useState } from "react";
import { ExerciseDemoDialog } from "./ExerciseDemoDialog";
import type { ExerciseRecommendation, ExerciseSuggestionsResponse } from "./exercise-types";

type LoadingState = "idle" | "loading" | "error";

const exerciseSuggestionUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/exercises/suggest`;

export function ExerciseExplorer() {
  const [exercises, setExercises] = useState<ExerciseRecommendation[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRecommendation | null>(null);
  const [state, setState] = useState<LoadingState>("idle");

  const loadRecommendations = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(exerciseSuggestionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Recommendations are unavailable.");
      const payload = (await response.json()) as ExerciseSuggestionsResponse;
      setExercises(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      setState("idle");
    } catch {
      setExercises([]);
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  return (
    <section aria-labelledby="explore-exercises-heading" className="exercise-explorer">
      <div className="section-heading">
        <div>
          <h2 id="explore-exercises-heading">Explore Exercises</h2>
          <p>Recommendations are based on live pain logs and learned feedback.</p>
        </div>
        <button className="button secondary" disabled={state === "loading"} onClick={() => void loadRecommendations()} type="button">
          Refresh
        </button>
      </div>
      {state === "loading" ? <p role="status">Loading live recommendations…</p> : null}
      {state === "error" ? <p role="alert">Live exercise recommendations are unavailable. Try again later.</p> : null}
      {state === "idle" && exercises.length === 0 ? <p role="status">No live exercise recommendations are available.</p> : null}
      <ul className="exercise-list">
        {exercises.map((exercise) => (
          <li className="exercise-card" key={exercise.id}>
            <div>
              <h3>{exercise.name}</h3>
              {exercise.instruction ? <p>{exercise.instruction}</p> : null}
              {exercise.duration_minutes || exercise.intensity ? (
                <small>{[exercise.duration_minutes ? `${exercise.duration_minutes} min` : null, exercise.intensity].filter(Boolean).join(" · ")}</small>
              ) : null}
            </div>
            <button className="button" onClick={() => setSelectedExercise(exercise)} type="button">
              Show Me
            </button>
          </li>
        ))}
      </ul>
      <ExerciseDemoDialog exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
    </section>
  );
}

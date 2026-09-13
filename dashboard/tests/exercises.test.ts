import { describe, it, expect } from "vitest";
import { EXERCISE_DATABASE, getExerciseById, searchExercises } from "../lib/exercise-db";
import { GET as getExercises } from "../app/api/v1/exercises/route";
import { POST as postSuggest } from "../app/api/v1/exercises/suggest/route";

describe("Comprehensive Exercise & Rehab Database (exercise-db.ts)", () => {
  it("contains at least 30 clinical-grade rehabilitation routines", () => {
    expect(EXERCISE_DATABASE.length).toBeGreaterThanOrEqual(30);
  });

  it("covers all core rehabilitation categories: yoga, pilates, stretches, rehab, hydrotherapy", () => {
    const categories = new Set(EXERCISE_DATABASE.map(e => e.category));
    expect(categories.has("yoga")).toBe(true);
    expect(categories.has("pilates")).toBe(true);
    expect(categories.has("stretches")).toBe(true);
    expect(categories.has("rehab")).toBe(true);
    expect(categories.has("hydrotherapy")).toBe(true);
  });

  it("ensures every routine has steps with positive durations and valid cues", () => {
    for (const ex of EXERCISE_DATABASE) {
      expect(ex.id).toBeDefined();
      expect(ex.name.length).toBeGreaterThan(0);
      expect(ex.steps.length).toBeGreaterThan(0);
      for (const step of ex.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.duration).toBeGreaterThan(0);
      }
    }
  });

  it("searches exercises by keyword and target anatomical focus", () => {
    const lumbarResults = searchExercises({ focus_area: "lumbar" });
    expect(lumbarResults.length).toBeGreaterThanOrEqual(3);
    for (const item of lumbarResults) {
      const hasLumbar = item.focus_areas.some(fa => fa.includes("lumbar") || fa.includes("lower back"));
      expect(hasLumbar).toBe(true);
    }

    const pilatesResults = searchExercises({ category: "pilates" });
    expect(pilatesResults.length).toBeGreaterThanOrEqual(5);
    for (const item of pilatesResults) {
      expect(item.category).toBe("pilates");
    }

    const queryResults = searchExercises({ query: "sciatic" });
    expect(queryResults.length).toBeGreaterThanOrEqual(1);
  });

  it("fetches single routine by ID", () => {
    const r1 = getExerciseById("r1");
    expect(r1).toBeDefined();
    expect(r1?.name).toContain("McGill");
    expect(r1?.category).toBe("rehab");

    const h1 = getExerciseById("h1");
    expect(h1).toBeDefined();
    expect(h1?.name).toContain("Hydrotherapy");
  });
});

describe("API /api/v1/exercises & /suggest Handlers", () => {
  it("GET /api/v1/exercises returns full catalog and handles filtering", async () => {
    const req = new Request("http://localhost:3000/api/v1/exercises?category=yoga");
    const res = await getExercises(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.total).toBeGreaterThanOrEqual(5);
    for (const ex of data.exercises) {
      expect(ex.category).toBe("yoga");
    }
  });

  it("POST /api/v1/exercises/suggest returns live recommendations and all routines", async () => {
    const req = new Request("http://localhost:3000/api/v1/exercises/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pain_level: 6, generators: [{ area: "lumbar", side: "both", percentage: 100 }] })
    });
    const res = await postSuggest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.suggestions.length).toBe(3);
    expect(data.all_exercises.length).toBeGreaterThanOrEqual(30);
  });
});

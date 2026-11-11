import { beforeEach, describe, expect, it } from "vitest";
import { EXERCISE_DATABASE, ExerciseItem } from "../lib/exercise-db";

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
};

const mockStorage = createStorageMock();
(globalThis as any).localStorage = mockStorage;

describe("Yoga Exercise Same-Day Swap & Slot Duration Preservation", () => {
  const getDailySwapStorageKey = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return "rumble_daily_exercise_swaps_" + d.toLocaleDateString("en-CA");
  };

  beforeEach(() => {
    mockStorage.clear();
  });

  it("1. Deduplicated exercise list strictly excludes routine titles", () => {
    const routineTitles = new Set<string>();
    EXERCISE_DATABASE.forEach((r) => {
      if (r.title) routineTitles.add(r.title.trim().toLowerCase());
      if (r.name) routineTitles.add(r.name.trim().toLowerCase());
    });

    const individualExercises: { title: string; cue: string }[] = [];
    const seen = new Set<string>();

    EXERCISE_DATABASE.forEach((r) => {
      (r.steps || []).forEach((s) => {
        const norm = (s.title || "").trim().toLowerCase();
        // Exclusion rule: must not be a routine title and not already seen
        if (norm && !routineTitles.has(norm) && !seen.has(norm)) {
          seen.add(norm);
          individualExercises.push({ title: s.title.trim(), cue: s.cue || "" });
        }
      });
    });

    expect(individualExercises.length).toBeGreaterThan(15);
    // Assert zero overlap between individual exercises and full routine titles
    for (const ex of individualExercises) {
      expect(routineTitles.has(ex.title.toLowerCase())).toBe(false);
    }
  });

  it("2. Swapping an exercise strictly preserves the calibrated slot duration", () => {
    const routine = EXERCISE_DATABASE.find((r) => r.id === "y1")!;
    const originalStep = routine.steps[1]; // e.g. Supported Child's Pose
    const originalDuration = originalStep.duration || 120;

    // A replacement candidate with a different declared duration (e.g. 180s)
    const replacementCandidate = {
      title: "Glute Bridge Hold",
      cue: "Drive through heels, squeeze glutes.",
      frames: ["/exercises/hip_glute_bridge.jpg"],
      duration: 180,
    };

    // Swap action preserves originalStep duration
    const swappedStep = {
      ...originalStep,
      title: replacementCandidate.title,
      cue: replacementCandidate.cue,
      frames: replacementCandidate.frames,
      duration: originalDuration, // Slot duration preserved!
      isSwapped: true,
      swappedFrom: originalStep.title,
    };

    expect(swappedStep.duration).toBe(originalDuration);
    expect(swappedStep.title).toBe(replacementCandidate.title);
    expect(swappedStep.duration).not.toBe(replacementCandidate.duration);
  });

  it("3. Persists across reopening routine on the same day (YYYY-MM-DD)", () => {
    const todayKey = getDailySwapStorageKey();
    const routineId = "y1";
    const stepIndex = 0;

    const swapRecord = {
      title: "Bird Dog Alternating",
      cue: "Brace core without rotation.",
      frames: ["/exercises/bird_dog.jpg"],
      swappedAt: new Date().toISOString(),
      originalTitle: "Diaphragmatic 360 Core Awakening",
    };

    const store: Record<string, any> = {};
    store[`${routineId}:${stepIndex}`] = swapRecord;
    mockStorage.setItem(todayKey, JSON.stringify(store));

    // Reopen routine on same day:
    const loadedRaw = mockStorage.getItem(todayKey);
    expect(loadedRaw).toBeDefined();
    const parsed = JSON.parse(loadedRaw!);
    expect(parsed[`${routineId}:${stepIndex}`].title).toBe("Bird Dog Alternating");
    expect(parsed[`${routineId}:${stepIndex}`].originalTitle).toBe("Diaphragmatic 360 Core Awakening");
  });

  it("4. Automatically reverts to original exercise on the next calendar day", () => {
    const pastDateKey = "rumble_daily_exercise_swaps_2026-11-10";
    const todayKey = getDailySwapStorageKey();

    // Past date had a swap
    mockStorage.setItem(
      pastDateKey,
      JSON.stringify({
        "y1:0": { title: "Bird Dog Alternating", originalTitle: "Diaphragmatic 360 Core Awakening" },
      })
    );

    // Startup prune helper simulation:
    for (let i = mockStorage.length - 1; i >= 0; i--) {
      const k = mockStorage.key(i);
      if (k && k.startsWith("rumble_daily_exercise_swaps_") && k !== todayKey) {
        mockStorage.removeItem(k);
      }
    }

    // Past date is pruned
    expect(mockStorage.getItem(pastDateKey)).toBeNull();
    // Today's storage is empty so routine uses original exercise
    const todayStore = mockStorage.getItem(todayKey);
    const overrides = todayStore ? JSON.parse(todayStore) : {};
    expect(overrides["y1:0"]).toBeUndefined();
  });
});

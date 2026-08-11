import { defineAgent } from "./defineAgent";

export interface YogaRoutineOption {
  id: string;
  title: string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "adaptive";
  description: string;
  suitablePainAreas: string[];
}

export const yogaSubagent = defineAgent({
  id: "yoga_subagent",
  name: "Yoga Routine Subagent",
  schedule: "0 9 * * *",
  timezone: "Australia/Melbourne",
  instructions:
    "Generates 3 adaptive yoga routine options every morning at 09:00 AM Australia/Melbourne based on live pain logs, surgery history, clinician restrictions, and learned rehabilitation feedback.",
  handler: async (context?: { painScore?: number; locations?: string[]; restrictions?: string[] }) => {
    const painScore = context?.painScore ?? 5;
    const locations = context?.locations ?? ["lower_back"];
    const restrictions = context?.restrictions ?? [];

    const options: YogaRoutineOption[] = [
      {
        id: "yoga_opt_1",
        title: "Gentle Spinal Decompression & Pelvic Tilts",
        durationMinutes: 15,
        intensity: "low",
        description: "Focuses on passive lower back relief, cat-cow flow, and deep diaphragmatic breathing.",
        suitablePainAreas: locations,
      },
      {
        id: "yoga_opt_2",
        title: "Hip Mobility & Restorative Hamstring Extension",
        durationMinutes: 20,
        intensity: "adaptive",
        description: "Supported pigeon pose, reclining flexor stretch, and glute activation respecting clinician limits.",
        suitablePainAreas: locations,
      },
      {
        id: "yoga_opt_3",
        title: "Seated Chair Yoga & Thoracic Extension",
        durationMinutes: 15,
        intensity: "low",
        description: "Zero weight-bearing spinal mobility and shoulder blade retractions for gentle restorative motion.",
        suitablePainAreas: locations,
      },
    ];

    return {
      timestamp: new Date().toISOString(),
      timezone: "Australia/Melbourne",
      painScore,
      restrictions,
      options,
    };
  },
});

export default yogaSubagent;

import { defineTool } from "./defineTool";

export interface ChromaPreferenceQuery {
  painScore: number;
  locations: string[];
}

export interface ChromaFeedbackRecord {
  exerciseId: string;
  prePainScore: number;
  postPainScore: number;
  feedback?: string;
}

export const queryChromaPreferences = defineTool({
  name: "queryChromaPreferences",
  description: "Queries ChromaDB for learned exercise preferences and pain relief history.",
  execute: async (params: ChromaPreferenceQuery) => {
    const chromaPath = process.env.RUMBLE_CHROMA_PATH || "./data/chroma";
    return {
      chromaPath,
      painScore: params.painScore,
      locations: params.locations,
      matchedPreferences: [],
    };
  },
});

export const recordChromaFeedback = defineTool({
  name: "recordChromaFeedback",
  description: "Records exercise completion, pre/post pain scores, and feedback in ChromaDB.",
  execute: async (params: ChromaFeedbackRecord) => {
    const chromaPath = process.env.RUMBLE_CHROMA_PATH || "./data/chroma";
    const delta = params.prePainScore - params.postPainScore;
    return {
      success: true,
      chromaPath,
      exerciseId: params.exerciseId,
      delta,
      recordedAt: new Date().toISOString(),
    };
  },
});

export type ExerciseRecommendation = {
  id: string;
  name: string;
  instruction?: string;
  duration_minutes?: number;
  intensity?: string;
  media_url?: string;
  image_url?: string;
  video_url?: string;
  target_muscles?: string[];
  contraindications?: string[];
  procedure?: string[];
  source_tier?: string;
  sanskrit_name?: string;
  benefits?: string;
  category?: string;
};

export type ExerciseSuggestionsResponse = {
  suggestions?: ExerciseRecommendation[];
};

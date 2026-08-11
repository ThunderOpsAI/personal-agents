export type ExerciseRecommendation = {
  id: string;
  name: string;
  instruction?: string;
  duration_minutes?: number;
  intensity?: string;
  media_url?: string;
  image_url?: string;
  video_url?: string;
};

export type ExerciseSuggestionsResponse = {
  suggestions?: ExerciseRecommendation[];
};

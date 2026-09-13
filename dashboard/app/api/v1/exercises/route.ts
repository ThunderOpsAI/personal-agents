import { NextResponse } from "next/server";
import { EXERCISE_DATABASE, searchExercises } from "../../../../lib/exercise-db";
import { getSuggestedYogaRoutines } from "../../../../lib/agents/yoga-engine";

export async function GET(request: Request) {
  try {
    const url = request && request.url ? new URL(request.url) : null;
    const query = url?.searchParams.get("query") || url?.searchParams.get("q") || "";
    const category = url?.searchParams.get("category") || "all";
    const area = url?.searchParams.get("area") || url?.searchParams.get("focus_area") || "all";

    const exercises = searchExercises({
      query: query || undefined,
      category: category !== "all" ? category : undefined,
      focus_area: area !== "all" ? area : undefined,
    });

    const suggestions = exercises.map(r => ({
      id: r.id,
      name: r.name,
      title: r.title,
      category: r.category,
      focus_areas: r.focus_areas,
      duration_minutes: r.duration_minutes,
      intensity: r.intensity,
      instruction: r.instruction,
      description: r.description,
      precautions: r.precautions,
      steps: r.steps
    }));

    return NextResponse.json({
      status: "success",
      total: exercises.length,
      exercises: suggestions,
      suggestions: suggestions.slice(0, 3)
    });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

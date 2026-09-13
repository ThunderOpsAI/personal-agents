import { NextResponse } from "next/server";
import { getSuggestedYogaRoutines } from "../../../../../lib/agents/yoga-engine";
import { EXERCISE_DATABASE } from "../../../../../lib/exercise-db";

export async function POST(request: Request) {
  try {
    const routines = await getSuggestedYogaRoutines();
    const suggestions = routines.map(r => ({
      id: r.id,
      name: r.name || r.title,
      title: r.title || r.name,
      category: r.category,
      focus_areas: r.focus_areas,
      duration_minutes: r.duration_minutes,
      intensity: r.intensity,
      instruction: r.instruction || r.description,
      description: r.description || r.instruction,
      precautions: r.precautions,
      steps: r.steps
    }));
    return NextResponse.json({
      status: "success",
      suggestions,
      all_exercises: EXERCISE_DATABASE
    });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

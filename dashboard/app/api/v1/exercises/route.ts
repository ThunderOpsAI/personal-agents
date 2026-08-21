import { NextResponse } from "next/server";
import { getSuggestedYogaRoutines } from "../../../../lib/agents/yoga-engine";

export async function GET(request: Request) {
  try {
    const routines = await getSuggestedYogaRoutines();
    const suggestions = routines.map(r => ({
        id: r.id,
        name: r.title,
        instruction: r.description,
        duration_minutes: r.duration_minutes,
        intensity: "Adaptive"
    }));
    return NextResponse.json({ status: "success", suggestions });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

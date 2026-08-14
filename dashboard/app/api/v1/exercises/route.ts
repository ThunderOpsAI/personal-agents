import { NextResponse } from "next/server";
import { getLiveExerciseSuggestions, LiveIntegrationUnavailableError } from "../../../../lib/rumble-integrations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const painLevelStr = searchParams.get("pain_level");
  const limitStr = searchParams.get("limit");

  const pain_level = painLevelStr ? parseInt(painLevelStr, 10) : undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  try {
    const suggestions = await getLiveExerciseSuggestions({ pain_level, limit });
    return NextResponse.json({ status: "success", suggestions });
  } catch (error) {
    if (error instanceof LiveIntegrationUnavailableError) {
      return NextResponse.json(
        { status: "unavailable", integration: error.integration, error: "Live exercise recommendations are currently unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

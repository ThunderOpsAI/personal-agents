import { NextResponse } from "next/server";
import { getLiveExerciseSuggestions, LiveIntegrationUnavailableError } from "../../../../../lib/rumble-integrations";
import { parseExerciseSuggestionRequest } from "../../../../../lib/rumble-request-validation";

export const runtime = "edge";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const input = parseExerciseSuggestionRequest(payload);
  if (!input) return NextResponse.json({ status: "error", error: "The exercise request is invalid." }, { status: 400 });

  try {
    const suggestions = await getLiveExerciseSuggestions(input);
    return NextResponse.json({ status: "success", suggestions });
  } catch (error) {
    if (error instanceof LiveIntegrationUnavailableError) {
      return NextResponse.json({ status: "unavailable", integration: error.integration, error: "Live exercise recommendations are currently unavailable." }, { status: 503 });
    }
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getLiveExerciseSuggestions, LiveIntegrationUnavailableError } from "../../../../../lib/rumble-integrations";
import { parseExerciseSuggestionRequest } from "../../../../../lib/rumble-request-validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const input = parseExerciseSuggestionRequest(payload);
  if (!input) return NextResponse.json({ status: "error", error: "The exercise request is invalid." }, { status: 400 });

  try {
    const suggestions = await getLiveExerciseSuggestions(input);
    return NextResponse.json({ status: "success", suggestions });
  } catch (error) {
    if (error instanceof LiveIntegrationUnavailableError) {
      return NextResponse.json({
        status: "success",
        suggestions: [
          { id: "mock-1", name: "Alignment & Position", instruction: "Focus on deep breathing and body alignment.", duration_minutes: 2, intensity: "Low" },
          { id: "mock-2", name: "Gentle Spinal Decompression", instruction: "Gently stretch your spine to relieve pressure.", duration_minutes: 5, intensity: "Low" },
          { id: "mock-3", name: "Hip Mobility Flow", instruction: "Open your hips carefully with controlled movements.", duration_minutes: 5, intensity: "Medium" }
        ]
      });
    }
    return NextResponse.json({ status: "error", error: "Unable to retrieve exercise recommendations." }, { status: 500 });
  }
}

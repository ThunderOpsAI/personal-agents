import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from "next/server";
import { generateBriefing } from "../../../../../lib/agents/briefing-engine";

export async function POST(req: Request) {
  try {
    const authError = rumbleAuth(req);
    if (authError) return authError;
    const body = await req.json();
    const { events, type } = body; // type could be "morning" or "evening"

    if (!events || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const briefing = await generateBriefing(events, type);
    return NextResponse.json({ briefing }, { status: 200 });
  } catch (error) {
    console.error("Error generating executive briefing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

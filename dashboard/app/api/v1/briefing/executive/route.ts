import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from "next/server";
import { generateBriefing } from "../../../../../lib/agents/briefing-engine";
import { getAgendaItems } from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const authError = rumbleAuth(req);
    if (authError) return authError;
    
    let events = [];
    let type = "morning";
    
    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text);
        if (body.events) events = body.events;
        if (body.type) type = body.type;
      }
    } catch(e) {}

    if (events.length === 0) {
      // Fetch today's events if not provided
      const allEvents = await getAgendaItems();
      const today = new Date().toISOString().split('T')[0];
      events = allEvents.filter(e => e.scheduled_time && e.scheduled_time.startsWith(today));
      // Map to expected format
      events = events.map(e => ({ title: e.title, start: e.scheduled_time }));
    }

    const briefing = await generateBriefing(events, type as any);
    return NextResponse.json({ html: briefing }, { status: 200 });
  } catch (error) {
    console.error("Error generating executive briefing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

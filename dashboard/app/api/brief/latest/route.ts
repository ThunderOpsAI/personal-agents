import { NextResponse } from "next/server";
import { generateBriefing } from "../../../../lib/agents/briefing-engine";
import { getAgendaItems } from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const allEvents = await getAgendaItems();
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = allEvents
      .filter(e => e.scheduled_time && e.scheduled_time.startsWith(today))
      .map(e => ({ title: e.title, start: e.scheduled_time }));

    const briefingHtml = await generateBriefing(todayEvents, "morning");
    return NextResponse.json({
      status: "success",
      type: "morning",
      date: today,
      events: todayEvents,
      html: briefingHtml,
    });
  } catch (error: any) {
    console.error("Error generating latest briefing:", error);
    return NextResponse.json({ status: "error", error: error.message || "Failed to generate briefing" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}

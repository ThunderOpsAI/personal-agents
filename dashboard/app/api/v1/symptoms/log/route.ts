import { NextResponse } from "next/server";
import { logPain } from "../../../../../lib/rehab-learning";
import { createPainLog, getPainLogsFromDb } from "../../../../../lib/db";
import { exportPainReportToMarkdown } from "../../../../../lib/agents/intent-router";

export async function GET() {
  try {
    const logs = await getPainLogsFromDb();
    return NextResponse.json({ status: "success", logs });
  } catch (error) {
    console.error("Error in GET /api/v1/symptoms/log:", error);
    return NextResponse.json({ status: "error", error: "Failed to retrieve pain logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", error: "Payload must be an object" }, { status: 400 });
  }

  const score = body.score ?? body.pain_level ?? body.painScore ?? body.pain;
  const rawLocs = body.locations ?? body.generators ?? [];
  const locations = Array.isArray(rawLocs)
    ? rawLocs.map((l: any) => ({
        area: l.area,
        side: l.side || "unspecified",
        weight: l.weight ?? l.percentage ?? 100,
        percentage: l.percentage ?? l.weight ?? 100,
      }))
    : [];
  const mood = body.mood ?? (body.mood_level !== undefined ? String(body.mood_level) : undefined);
  const notes = body.notes ?? body.pain_notes ?? body.mood_notes ?? "";

  const result = logPain({ score, locations, mood, notes });
  if (!result.success || !result.entry) {
    return NextResponse.json(
      { status: "error", error: "Validation failed", details: result.errors },
      { status: 400 }
    );
  }

  let savedRecord = null;
  try {
    savedRecord = await createPainLog({
      id: result.entry.id,
      score: result.entry.score,
      locations: result.entry.locations.map((loc) => ({
        area: loc.area,
        side: loc.side,
        percentage: loc.weight,
      })),
      mood: result.entry.mood,
      notes: result.entry.notes,
    });
  } catch {
    // Database write best effort if memory succeeded
  }

  // Export to agent_reports
  exportPainReportToMarkdown(result.entry);

  const isHighPain = result.entry.score >= 7;
  const primaryLoc = result.entry.locations[0];
  const alertMessage = isHighPain && primaryLoc
    ? `High Pain Alert: ${primaryLoc.side !== "unspecified" ? primaryLoc.side.toUpperCase() + " " : ""}${primaryLoc.area.toUpperCase()} at ${result.entry.score}/10. Agenda adjusted.`
    : null;

  return NextResponse.json(
    {
      status: "success",
      data: result.entry,
      record: savedRecord,
      alert_triggered: isHighPain,
      alert_message: alertMessage,
    },
    { status: 201 }
  );
}

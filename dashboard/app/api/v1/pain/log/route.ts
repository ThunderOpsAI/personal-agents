import { NextResponse } from "next/server";
import { logPain } from "../../../../../lib/rehab-learning";
import { createPainLog, getPainLogsFromDb } from "../../../../../lib/db";

export async function GET() {
  try {
    const logs = await getPainLogsFromDb();
    return NextResponse.json({ status: "success", logs });
  } catch (error) {
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

  const result = logPain(body);
  if (!result.success || !result.entry) {
    return NextResponse.json(
      { status: "error", error: "Validation failed", details: result.errors },
      { status: 400 }
    );
  }

  try {
    await createPainLog({
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

  return NextResponse.json(
    { status: "success", data: result.entry },
    { status: 201 }
  );
}


import { NextResponse } from "next/server";
import { completeRoutine } from "../../../../../lib/rehab-learning";

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

  const result = completeRoutine(body);
  if (!result.success) {
    return NextResponse.json(
      { status: "error", error: "Validation failed", details: result.errors },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { status: "success", data: result.record },
    { status: 201 }
  );
}

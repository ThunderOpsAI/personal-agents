import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "success", proposal: "Review your recent progress and plan your upcoming hydrotherapy sessions." });
}

import { NextResponse } from "next/server";
import { getDbStatus } from "../../lib/db";

export async function GET() {
  const dbStatus = getDbStatus();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
}

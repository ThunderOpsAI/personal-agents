import { NextResponse } from "next/server";
import { getSmsHeartbeatStatus } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const thresholdParam = searchParams.get("threshold_hours");
    const thresholdHours = thresholdParam ? parseFloat(thresholdParam) : 24;

    const heartbeat = await getSmsHeartbeatStatus(thresholdHours);

    return NextResponse.json({
      status: heartbeat.status,
      healthy: heartbeat.healthy,
      last_received_at: heartbeat.last_received_at,
      hours_since_last_received: heartbeat.hours_since_last_received,
      threshold_hours: heartbeat.threshold_hours,
      message: heartbeat.message,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to retrieve SMS heartbeat" },
      { status: 500 }
    );
  }
}

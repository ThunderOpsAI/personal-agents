import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from "next/server";
import { proposeReschedule } from "../../../../../lib/agents/smart-rescheduler";

export async function POST(req: Request) {
  try {
    const authError = rumbleAuth(req);
    if (authError) return authError;
    const body = await req.json();
    const { tasks, schedule } = body;

    if (!tasks || !schedule) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const proposals = await proposeReschedule(tasks, schedule);
    return NextResponse.json({
      proposals,
      requires_confirmation: true,
      message: "Review the proposed schedule changes and confirm to apply."
    }, { status: 200 });
  } catch (error) {
    console.error("Error rescheduling tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

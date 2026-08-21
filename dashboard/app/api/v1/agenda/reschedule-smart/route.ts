import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from "next/server";
import { rescheduleTasks } from "@/lib/agents/smart-rescheduler";

export async function POST(req: Request) {
  try {
    const authError = rumbleAuth(req);
    if (authError) return authError;
    const body = await req.json();
    const { tasks, schedule } = body;

    if (!tasks || !schedule) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rescheduledTasks = await rescheduleTasks(tasks, schedule);
    return NextResponse.json({ rescheduledTasks }, { status: 200 });
  } catch (error) {
    console.error("Error rescheduling tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

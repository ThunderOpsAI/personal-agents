import { NextResponse } from "next/server";
import { getChatLogs } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const logs = await getChatLogs(12);
    return NextResponse.json({ status: "success", history: logs });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

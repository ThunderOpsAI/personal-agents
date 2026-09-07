import { NextResponse } from "next/server";
import { getChatLogs, getPendingAction } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const logs = await getChatLogs(24);
    const pendingAction = await getPendingAction();
    return NextResponse.json({
      status: "success",
      history: logs,
      pending_action: pendingAction
        ? {
            id: pendingAction.id,
            action_data: pendingAction.action_data,
            created_at: pendingAction.created_at,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}


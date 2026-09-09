import { NextResponse } from "next/server";
import { syncTasksWithGoogle } from "../../../../../lib/tasks-sync";
import { getGoogleAuthUrl } from "../../../../../lib/google-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/tasks/sync
 * Triggers a bidirectional synchronization with Google Tasks API.
 * Pulls new/updated remote tasks from Google, and pushes un-synced local tasks up to Google.
 */
export async function POST(request: Request) {
  let taskListId = "@default";
  try {
    const body = await request.json().catch(() => ({}));
    if (body.taskListId) taskListId = body.taskListId;
  } catch {}

  const result = await syncTasksWithGoogle({ taskListId });

  if (result.status === "auth_required") {
    return NextResponse.json(
      {
        status: "auth_required",
        message: result.message || "Google Tasks authorization required",
        authUrl: result.authUrl || getGoogleAuthUrl(),
        tasks: result.tasks,
        syncedWithGoogle: false,
      },
      { status: 401 }
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      {
        status: "error",
        message: result.message || "Failed to sync tasks with Google Tasks",
        tasks: result.tasks,
        syncedWithGoogle: false,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "success",
    tasks: result.tasks,
    syncedWithGoogle: true,
    pulledFromGoogle: result.pulledFromGoogle ?? 0,
    pushedToGoogle: result.pushedToGoogle ?? 0,
  });
}

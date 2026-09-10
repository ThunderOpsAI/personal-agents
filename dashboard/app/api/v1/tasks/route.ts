import { NextResponse } from "next/server";
import {
  syncTasksWithGoogle,
  createTaskWithSync,
  updateTaskWithSync,
  deleteTaskWithSync,
} from "../../../../lib/tasks-sync";
import { getTasksFromDb } from "../../../../lib/db";
import { getGoogleAccessToken, getGoogleAuthUrl } from "../../../../lib/google-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tasks
 * Fetches tasks from database, performing 2-way sync with Google Tasks when requested or when authenticated.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("taskListId") || "@default";
  const shouldSync = searchParams.get("sync") !== "false"; // default true
  const includeCompleted = searchParams.get("includeCompleted") !== "false";

  if (shouldSync) {
    const syncResult = await syncTasksWithGoogle({ taskListId });
    if (syncResult.status === "auth_required" && searchParams.get("strictAuth") === "true") {
      return NextResponse.json(
        {
          status: "auth_required",
          message: syncResult.message || "Google Tasks authorization required",
          authUrl: syncResult.authUrl || getGoogleAuthUrl(),
        },
        { status: 401 }
      );
    }
    return NextResponse.json({
      status: "success",
      tasks: syncResult.tasks,
      syncedWithGoogle: syncResult.syncedWithGoogle,
      pulledFromGoogle: syncResult.pulledFromGoogle ?? 0,
      pushedToGoogle: syncResult.pushedToGoogle ?? 0,
    });
  }

  const tasks = await getTasksFromDb({ taskListId, includeCompleted });
  const auth = await getGoogleAccessToken();

  return NextResponse.json({
    status: "success",
    tasks,
    syncedWithGoogle: false,
    googleAuthenticated: auth.authenticated,
  });
}

/**
 * POST /api/v1/tasks
 * Creates a new task and synchronizes it to Google Tasks if authenticated.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", message: "Payload must be an object" }, { status: 400 });
  }

  const { title, notes, due, status, taskListId, isUrgent } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { status: "error", message: "title is required and must be non-empty" },
      { status: 400 }
    );
  }

  try {
    const result = await createTaskWithSync({
      title: title.trim(),
      notes: notes && typeof notes === "string" ? notes.trim() : null,
      due: due || null,
      status: status === "completed" ? "completed" : "needsAction",
      isUrgent: isUrgent === true,
      task_list_id: taskListId || "@default",
    });

    return NextResponse.json(
      {
        status: "success",
        task: result.task,
        syncedToGoogle: result.syncedToGoogle,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/tasks
 * Updates an existing task by ID and syncs changes to Google Tasks.
 */
export async function PATCH(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  const { id, title, notes, due, status, isUrgent } = body;
  if (!id) {
    return NextResponse.json({ status: "error", message: "id is required for updating" }, { status: 400 });
  }

  try {
    const result = await updateTaskWithSync(id, {
      title,
      notes,
      due,
      isUrgent: typeof isUrgent === "boolean" ? isUrgent : undefined,
      status,
    });

    if (!result.task) {
      return NextResponse.json({ status: "error", message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      task: result.task,
      syncedToGoogle: result.syncedToGoogle,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/tasks
 * Deletes a task by ID (from search query or JSON payload) and deletes on Google Tasks.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  if (!id) {
    const body = await request.json().catch(() => ({}));
    id = body.id;
  }

  if (!id) {
    return NextResponse.json({ status: "error", message: "id is required for deletion" }, { status: 400 });
  }

  try {
    const result = await deleteTaskWithSync(id);
    if (!result.success) {
      return NextResponse.json({ status: "error", message: "Task not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      id,
      syncedToGoogle: result.syncedToGoogle,
      message: "Task deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}

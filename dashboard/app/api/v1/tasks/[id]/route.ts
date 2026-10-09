import { NextResponse } from "next/server";
import { updateTaskWithSync, deleteTaskWithSync } from "../../../../../lib/tasks-sync";
import { getTasksFromDb } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tasks/[id]
 * Retrieves a single task record by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ status: "error", message: "id parameter is required" }, { status: 400 });
  }

  const tasks = await getTasksFromDb({ includeCompleted: true });
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return NextResponse.json({ status: "error", message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "success", task });
}

/**
 * PATCH /api/v1/tasks/[id]
 * Updates a task by ID and syncs to Google Tasks.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ status: "error", message: "id parameter is required" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await updateTaskWithSync(id, body);
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
 * DELETE /api/v1/tasks/[id]
 * Deletes a task by ID from local DB and Google Tasks.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ status: "error", message: "id parameter is required" }, { status: 400 });
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

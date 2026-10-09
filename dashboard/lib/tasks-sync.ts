import {
  fetchLiveTasks,
  createLiveTask,
  updateLiveTask,
  deleteLiveTask,
  getGoogleAccessToken,
  getGoogleAuthUrl,
} from "./google-auth";
import {
  getTasksFromDb,
  createTaskInDb,
  updateTaskInDb,
  deleteTaskInDb,
} from "./db";
import { CreateTaskInput, TaskRecord } from "./schema";

export interface SyncTasksResult {
  status: "success" | "auth_required" | "error";
  tasks: TaskRecord[];
  syncedWithGoogle: boolean;
  pulledFromGoogle?: number;
  pushedToGoogle?: number;
  authUrl?: string;
  message?: string;
}

/**
 * Execute 2-way synchronization between Google Tasks API and local database.
 * 1. Pulls all remote tasks from Google Tasks and inserts/updates local DB records.
 * 2. Pushes any local tasks lacking a google_id up to Google Tasks and records remote ID.
 */
export async function syncTasksWithGoogle(options?: {
  taskListId?: string;
}): Promise<SyncTasksResult> {
  const taskListId = options?.taskListId || "@default";
  const auth = await getGoogleAccessToken();

  if (!auth.authenticated) {
    const localTasks = await getTasksFromDb({ taskListId, includeCompleted: true });
    return {
      status: "auth_required",
      tasks: localTasks,
      syncedWithGoogle: false,
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Tasks authorization required",
    };
  }

  try {
    // 1. Pull from Google Tasks
    const remoteResult = await fetchLiveTasks({
      taskListId,
      showCompleted: true,
      showHidden: true,
    });

    if (remoteResult.status !== "success" || !remoteResult.tasks) {
      const localTasks = await getTasksFromDb({ taskListId, includeCompleted: true });
      return {
        status: remoteResult.status,
        tasks: localTasks,
        syncedWithGoogle: false,
        authUrl: remoteResult.authUrl,
        message: remoteResult.message,
      };
    }

    const remoteTasks = remoteResult.tasks;
    const localTasks = await getTasksFromDb({ taskListId, includeCompleted: true });
    let pulledCount = 0;
    let pushedCount = 0;

    // Map local tasks by google_id
    const localByGoogleId = new Map<string, TaskRecord>();
    localTasks.forEach((t) => {
      if (t.google_id) {
        localByGoogleId.set(t.google_id, t);
      }
    });

    // Process remote tasks (upsert into local DB)
    for (const gTask of remoteTasks) {
      if (!gTask.id) continue;
      const existing = localByGoogleId.get(gTask.id);
      const isDeleted = Boolean(gTask.deleted);
      const taskStatus = gTask.status === "completed" ? "completed" : "needsAction";

      if (existing) {
        // Update local if changed
        if (
          existing.title !== gTask.title ||
          existing.notes !== (gTask.notes || null) ||
          existing.status !== taskStatus ||
          existing.due !== (gTask.due || null) ||
          existing.deleted !== isDeleted
        ) {
          await updateTaskInDb(existing.id, {
            title: gTask.title,
            notes: gTask.notes || null,
            status: taskStatus,
            due: gTask.due || null,
            completed_at: gTask.completed || (taskStatus === "completed" ? new Date().toISOString() : null),
            deleted: isDeleted,
          });
          pulledCount++;
        }
      } else if (!isDeleted) {
        // New remote task -> create locally
        await createTaskInDb({
          google_id: gTask.id,
          task_list_id: taskListId,
          title: gTask.title || "Untitled Task",
          notes: gTask.notes || null,
          status: taskStatus,
          due: gTask.due || null,
          completed_at: gTask.completed || (taskStatus === "completed" ? new Date().toISOString() : null),
          deleted: false,
        });
        pulledCount++;
      }
    }

    // 2. Push unsynced local tasks to Google
    const refreshedLocal = await getTasksFromDb({ taskListId, includeCompleted: true });
    for (const localTask of refreshedLocal) {
      if (!localTask.google_id && !localTask.deleted) {
        const createResult = await createLiveTask({
          taskListId,
          title: localTask.title,
          notes: localTask.notes || undefined,
          due: localTask.due || undefined,
          status: localTask.status,
        });

        if (createResult.status === "success" && createResult.task?.id) {
          await updateTaskInDb(localTask.id, {
            google_id: createResult.task.id,
          });
          pushedCount++;
        }
      }
    }

    // Retrieve final synchronized state
    const finalTasks = await getTasksFromDb({ taskListId, includeCompleted: true });
    return {
      status: "success",
      tasks: finalTasks,
      syncedWithGoogle: true,
      pulledFromGoogle: pulledCount,
      pushedToGoogle: pushedCount,
    };
  } catch (err: any) {
    const fallbackTasks = await getTasksFromDb({ taskListId, includeCompleted: true });
    return {
      status: "error",
      tasks: fallbackTasks,
      syncedWithGoogle: false,
      message: err.message || "Failed to execute 2-way tasks sync",
    };
  }
}

/**
 * Create a task and push to Google Tasks if auth is active.
 */
export async function createTaskWithSync(input: CreateTaskInput): Promise<{
  task: TaskRecord;
  syncedToGoogle: boolean;
}> {
  const taskListId = input.task_list_id || "@default";
  let googleId: string | null = input.google_id || null;
  let syncedToGoogle = false;

  const auth = await getGoogleAccessToken();
  if (auth.authenticated && !googleId) {
    try {
      const gResult = await createLiveTask({
        taskListId,
        title: input.title,
        notes: input.notes || undefined,
        due: input.due || undefined,
        status: input.status || "needsAction",
      });
      if (gResult.status === "success" && gResult.task?.id) {
        googleId = gResult.task.id;
        syncedToGoogle = true;
      }
    } catch (e) {
      console.warn("Could not sync new task to Google Tasks immediately:", e);
    }
  }

  const created = await createTaskInDb({
    ...input,
    google_id: googleId,
    task_list_id: taskListId,
  });

  return { task: created, syncedToGoogle };
}

/**
 * Update a task and push changes to Google Tasks.
 */
export async function updateTaskWithSync(
  id: string,
  updates: Partial<CreateTaskInput>
): Promise<{
  task: TaskRecord | null;
  syncedToGoogle: boolean;
}> {
  const updated = await updateTaskInDb(id, updates);
  if (!updated) return { task: null, syncedToGoogle: false };

  let syncedToGoogle = false;
  const auth = await getGoogleAccessToken();

  if (auth.authenticated) {
    try {
      if (updated.google_id) {
        await updateLiveTask({
          taskId: updated.google_id,
          taskListId: updated.task_list_id || "@default",
          title: updates.title,
          notes: updates.notes || undefined,
          due: updates.due,
          status: updates.status,
          completed: updates.status === "completed" ? updated.completed_at : null,
        });
        syncedToGoogle = true;
      } else {
        // If it lacked a Google ID, create it now
        const gResult = await createLiveTask({
          taskListId: updated.task_list_id || "@default",
          title: updated.title,
          notes: updated.notes || undefined,
          due: updated.due || undefined,
          status: updated.status,
        });
        if (gResult.status === "success" && gResult.task?.id) {
          await updateTaskInDb(updated.id, { google_id: gResult.task.id });
          updated.google_id = gResult.task.id;
          syncedToGoogle = true;
        }
      }
    } catch (e) {
      console.warn("Could not push task update to Google Tasks:", e);
    }
  }

  return { task: updated, syncedToGoogle };
}

/**
 * Delete a task locally and remotely on Google Tasks.
 */
export async function deleteTaskWithSync(id: string): Promise<{
  success: boolean;
  syncedToGoogle: boolean;
}> {
  const tasks = await getTasksFromDb({ includeCompleted: true });
  const target = tasks.find((t) => t.id === id);

  if (!target) {
    return { success: false, syncedToGoogle: false };
  }

  let syncedToGoogle = false;
  const auth = await getGoogleAccessToken();

  if (auth.authenticated && target.google_id) {
    try {
      await deleteLiveTask(target.google_id, target.task_list_id);
      syncedToGoogle = true;
    } catch (e) {
      console.warn("Could not delete task from Google Tasks:", e);
    }
  }

  const success = await deleteTaskInDb(id);
  return { success, syncedToGoogle };
}

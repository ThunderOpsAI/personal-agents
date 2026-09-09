import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { GET as getTasks, POST as postTask, PATCH as patchTask, DELETE as deleteTask } from "./route";
import { GET as getTaskById, PATCH as patchTaskById, DELETE as deleteTaskById } from "./[id]/route";
import { POST as syncTasks } from "./sync/route";
import { initDb, closeDb, getTasksFromDb } from "../../../../lib/db";
import * as googleAuth from "../../../../lib/google-auth";
import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "test_tasks_route.db");

describe("API Routes: Google Tasks Integration & 2-Way Sync", () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    initDb(TEST_DB);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    vi.restoreAllMocks();
  });

  it("creates a local task when unauthenticated and retrieves it via GET /api/v1/tasks", async () => {
    vi.spyOn(googleAuth, "getGoogleAccessToken").mockResolvedValue({
      authenticated: false,
      authUrl: "https://accounts.google.com/auth",
      error: "Google Tasks authorization required",
    });

    const postReq = new Request("https://rumble.test/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Pick up knee brace prescription",
        notes: "Clinician requested DonJoy stabilizer",
        due: "2026-09-15T09:00:00.000Z",
      }),
    });

    const postRes = await postTask(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.status).toBe("success");
    expect(postData.task.title).toBe("Pick up knee brace prescription");
    expect(postData.task.notes).toBe("Clinician requested DonJoy stabilizer");
    expect(postData.task.status).toBe("needsAction");
    expect(postData.task.google_id).toBeNull();
    expect(postData.syncedToGoogle).toBe(false);

    // Retrieve via GET
    const getReq = new Request("https://rumble.test/api/v1/tasks?sync=false");
    const getRes = await getTasks(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.status).toBe("success");
    expect(getData.tasks).toHaveLength(1);
    expect(getData.tasks[0].title).toBe("Pick up knee brace prescription");
  });

  it("pushes a new task to Google Tasks when authenticated", async () => {
    vi.spyOn(googleAuth, "getGoogleAccessToken").mockResolvedValue({
      authenticated: true,
      accessToken: "mock_token_123",
    });

    vi.spyOn(googleAuth, "createLiveTask").mockResolvedValue({
      status: "success",
      task: {
        id: "gtask_remote_999",
        title: "Hydrotherapy follow-up booking",
        status: "needsAction",
      },
    });

    const postReq = new Request("https://rumble.test/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Hydrotherapy follow-up booking",
        notes: "Book 3 sessions with physio",
      }),
    });

    const postRes = await postTask(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.status).toBe("success");
    expect(postData.task.google_id).toBe("gtask_remote_999");
    expect(postData.syncedToGoogle).toBe(true);

    // Verify stored in DB with google_id
    const dbTasks = await getTasksFromDb();
    expect(dbTasks[0].google_id).toBe("gtask_remote_999");
  });

  it("updates task and marks completed via PATCH /api/v1/tasks/[id]", async () => {
    vi.spyOn(googleAuth, "getGoogleAccessToken").mockResolvedValue({
      authenticated: true,
      accessToken: "mock_token_123",
    });

    const updateLiveSpy = vi.spyOn(googleAuth, "updateLiveTask").mockResolvedValue({
      status: "success",
      task: { id: "gtask_remote_999", status: "completed" },
    });

    // Create task
    vi.spyOn(googleAuth, "createLiveTask").mockResolvedValue({
      status: "success",
      task: { id: "gtask_remote_999" },
    });

    const postReq = new Request("https://rumble.test/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Order medication refill" }),
    });
    const postRes = await postTask(postReq);
    const createdTask = (await postRes.json()).task;

    // PATCH update to completed
    const patchReq = new Request(`https://rumble.test/api/v1/tasks/${createdTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const patchRes = await patchTaskById(patchReq, { params: Promise.resolve({ id: createdTask.id }) });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.status).toBe("success");
    expect(patchData.task.status).toBe("completed");
    expect(patchData.task.completed_at).toBeDefined();

    expect(updateLiveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "gtask_remote_999",
        status: "completed",
      })
    );
  });

  it("pulls remote tasks from Google Tasks during sync", async () => {
    vi.spyOn(googleAuth, "getGoogleAccessToken").mockResolvedValue({
      authenticated: true,
      accessToken: "mock_token_123",
    });

    vi.spyOn(googleAuth, "fetchLiveTasks").mockResolvedValue({
      status: "success",
      tasks: [
        {
          id: "gtask_synced_001",
          title: "Buy ergonomic lumbar support pillow",
          notes: "Recommended by physio",
          status: "needsAction",
          due: "2026-09-20T00:00:00.000Z",
        },
      ],
    });

    const syncReq = new Request("https://rumble.test/api/v1/tasks/sync", {
      method: "POST",
    });

    const syncRes = await syncTasks(syncReq);
    expect(syncRes.status).toBe(200);
    const syncData = await syncRes.json();
    expect(syncData.status).toBe("success");
    expect(syncData.syncedWithGoogle).toBe(true);
    expect(syncData.pulledFromGoogle).toBe(1);

    const dbTasks = await getTasksFromDb();
    expect(dbTasks).toHaveLength(1);
    expect(dbTasks[0].google_id).toBe("gtask_synced_001");
    expect(dbTasks[0].title).toBe("Buy ergonomic lumbar support pillow");
  });

  it("deletes a task locally and on Google Tasks via DELETE /api/v1/tasks/[id]", async () => {
    vi.spyOn(googleAuth, "getGoogleAccessToken").mockResolvedValue({
      authenticated: true,
      accessToken: "mock_token_123",
    });

    vi.spyOn(googleAuth, "createLiveTask").mockResolvedValue({
      status: "success",
      task: { id: "gtask_del_123" },
    });

    const deleteLiveSpy = vi.spyOn(googleAuth, "deleteLiveTask").mockResolvedValue({
      status: "success",
    });

    // Create task
    const postReq = new Request("https://rumble.test/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Temporary chore" }),
    });
    const postRes = await postTask(postReq);
    const createdTask = (await postRes.json()).task;

    // Delete task
    const delReq = new Request(`https://rumble.test/api/v1/tasks/${createdTask.id}`, {
      method: "DELETE",
    });
    const delRes = await deleteTaskById(delReq, { params: Promise.resolve({ id: createdTask.id }) });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.status).toBe("success");
    expect(delData.syncedToGoogle).toBe(true);

    expect(deleteLiveSpy).toHaveBeenCalledWith("gtask_del_123", "@default");

    const remainingTasks = await getTasksFromDb();
    expect(remainingTasks).toHaveLength(0);
  });
});

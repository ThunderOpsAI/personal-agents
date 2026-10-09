import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { PATCH, DELETE } from "./route";
import { createNote, getNotes, initDb, closeDb } from "../../../../../lib/db";
import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "test_notes_id_route.db");

describe("API Route: /api/v1/notes/[id]", () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    initDb(TEST_DB);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it("archives and reinstates a note via PATCH", async () => {
    const note = await createNote({ content: "Dr appointment follow up notes", author: "user" });
    expect(note.isArchived).toBe(false);

    // 1. Archive note
    const archiveReq = new Request(`https://rumble.test/api/v1/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    const archiveRes = await PATCH(archiveReq, { params: Promise.resolve({ id: note.id }) });
    expect(archiveRes.status).toBe(200);
    const archiveData = await archiveRes.json();
    expect(archiveData.status).toBe("success");
    expect(archiveData.note.isArchived).toBe(true);

    // Verify in db
    let notes = await getNotes();
    let found = notes.find((n) => n.id === note.id);
    expect(found?.isArchived).toBe(true);

    // 2. Reinstate note
    const reinstateReq = new Request(`https://rumble.test/api/v1/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });
    const reinstateRes = await PATCH(reinstateReq, { params: Promise.resolve({ id: note.id }) });
    expect(reinstateRes.status).toBe(200);
    const reinstateData = await reinstateRes.json();
    expect(reinstateData.status).toBe("success");
    expect(reinstateData.note.isArchived).toBe(false);

    // Verify in db
    notes = await getNotes();
    found = notes.find((n) => n.id === note.id);
    expect(found?.isArchived).toBe(false);
  });

  it("straight-deletes a note via DELETE", async () => {
    const note = await createNote({ content: "Temporary scratch note", author: "user" });
    let notes = await getNotes();
    expect(notes).toHaveLength(1);

    const delReq = new Request(`https://rumble.test/api/v1/notes/${note.id}`, {
      method: "DELETE",
    });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: note.id }) });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.status).toBe("success");

    notes = await getNotes();
    expect(notes).toHaveLength(0);
  });

  it("returns 404 when deleting a non-existent note", async () => {
    const delReq = new Request("https://rumble.test/api/v1/notes/non_existent_id", {
      method: "DELETE",
    });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: "non_existent_id" }) });
    expect(delRes.status).toBe(404);
  });
});

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { GET, POST } from "./route";
import { initDb, closeDb } from "../../../../lib/db";

import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "test_notes_route.db");

describe("API Route: /api/v1/notes", () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    initDb(TEST_DB);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it("creates a note via POST /api/v1/notes and retrieves it via GET /api/v1/notes", async () => {
    const postReq = new Request("https://rumble.test/api/v1/notes", {
      method: "POST",
      body: JSON.stringify({ content: "Buy ergonomic lumbar support cushion", author: "user" }),
    });

    const postRes = await POST(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.status).toBe("success");
    expect(postData.note.content).toBe("Buy ergonomic lumbar support cushion");
    expect(postData.note.id).toBeDefined();

    const getRes = await GET();
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.status).toBe("success");
    expect(getData.notes).toHaveLength(1);
    expect(getData.notes[0].content).toBe("Buy ergonomic lumbar support cushion");
  });

  it("returns 400 when note content is missing or empty", async () => {
    const postReq = new Request("https://rumble.test/api/v1/notes", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });

    const res = await POST(postReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
  });
});

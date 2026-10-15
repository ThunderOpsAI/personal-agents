import { describe, it, expect } from "vitest";
import { ENCYCLOPEDIAS } from "../lib/encyclopedias";
import { GET as getEncyclopedias } from "../app/api/v1/learn/encyclopedias/route";
import { GET as getSingleEncyclopedia } from "../app/api/v1/learn/encyclopedias/[id]/route";
import { POST as saveProgress } from "../app/api/v1/learn/progress/route";
import { POST as saveSummary } from "../app/api/v1/learn/summary/route";
import { GET as getNews } from "../app/api/v1/news/route";
import fs from "fs/promises";
import path from "path";

describe("Encyclopedias & Learning Suite (October Refresh)", () => {
  it("contains all encyclopedias with structured chapters and archival flags", () => {
    expect(ENCYCLOPEDIAS.pain).toBeDefined();
    expect(ENCYCLOPEDIAS.cbt).toBeDefined();
    expect(ENCYCLOPEDIAS.nerves).toBeDefined();
    expect(ENCYCLOPEDIAS.nutrition).toBeDefined();
    expect(ENCYCLOPEDIAS.business).toBeDefined();
    expect(ENCYCLOPEDIAS.ai).toBeDefined();
    expect(ENCYCLOPEDIAS.tech).toBeDefined();

    expect(ENCYCLOPEDIAS.ai.archived).toBe(true);
    expect(ENCYCLOPEDIAS.tech.archived).toBe(true);

    expect(ENCYCLOPEDIAS.nerves.chapters.length).toBeGreaterThanOrEqual(8);
    expect(ENCYCLOPEDIAS.nutrition.chapters.length).toBeGreaterThanOrEqual(8);
    expect(ENCYCLOPEDIAS.business.chapters.length).toBeGreaterThanOrEqual(10);

    for (const enc of Object.values(ENCYCLOPEDIAS)) {
      for (const ch of enc.chapters) {
        expect(ch.title).toBeTruthy();
        expect(ch.summary).toBeTruthy();
        expect(ch.keyTakeaways.length).toBeGreaterThanOrEqual(2);
        expect(ch.content).toBeTruthy();
      }
    }
  });

  it("GET /api/v1/learn/encyclopedias returns the 5 active encyclopedias with progress metadata", async () => {
    const res = await getEncyclopedias();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.encyclopedias).toHaveLength(5);
    const ids = data.encyclopedias.map((e: any) => e.id);
    expect(ids).toContain("pain");
    expect(ids).toContain("cbt");
    expect(ids).toContain("nerves");
    expect(ids).toContain("nutrition");
    expect(ids).toContain("business");
    expect(ids).not.toContain("ai");
    expect(ids).not.toContain("tech");
  });

  it("GET /api/v1/learn/encyclopedias?include_archived=true returns all 7 encyclopedias", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/encyclopedias?include_archived=true");
    const res = await getEncyclopedias(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.encyclopedias).toHaveLength(7);
  });

  it("GET /api/v1/learn/encyclopedias/[id] returns chapter details and navigation", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/encyclopedias/pain?chapter=1");
    const res = await getSingleEncyclopedia(req, { params: Promise.resolve({ id: "pain" }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.encyclopedia.id).toBe("pain");
    expect(data.currentChapter.chapterNumber).toBe(2);
    expect(data.currentChapter.title).toBe("Myofascial Networks & Force Transmission");
  });

  it("POST /api/v1/learn/progress updates bookmark state", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encyclopediaId: "ai",
        chapterIndex: 2,
        completedChapterId: "ai-ch1"
      })
    });
    const res = await saveProgress(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress.current_chapter_index).toBe(2);
    expect(data.progress.completed_chapters).toContain("ai-ch1");
  });

  it("POST /api/v1/learn/summary writes summary markdown to learning/ directory", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encyclopediaId: "tech",
        chapterId: "tech-ch1",
        chapterTitle: "Serverless & Edge Computing Paradigms",
        summary: "Edge runtimes deploy lightweight JavaScript isolates across globally distributed CDN nodes.",
        keyTakeaways: ["Zero cold starts with V8 isolates", "Sub-millisecond execution"],
        notes: "Excellent overview of modern edge architectures."
      })
    });
    const res = await saveSummary(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.filename).toContain("serverless-edge-computing");

    // Verify file exists
    const filePath = data.path;
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("Serverless & Edge Computing Paradigms");
    expect(content).toContain("Zero cold starts with V8 isolates");
  });

  it("GET /api/v1/news fetches ABC News top stories with thumbnails and blurbs", async () => {
    const res = await getNews();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.top_stories).toBeDefined();
    expect(Array.isArray(data.top_stories)).toBe(true);
    if (data.top_stories.length > 0) {
      const story = data.top_stories[0];
      expect(story.title).toBeTruthy();
      expect(story.source).toBeTruthy();
      expect(story.url).toBeTruthy();
    }
  });
});

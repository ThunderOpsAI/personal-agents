import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { ENCYCLOPEDIAS } from "../../../../../lib/encyclopedias";
import { saveLearningProgress } from "../../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { encyclopediaId, chapterId, chapterTitle, summary, keyTakeaways, notes } = body;

    if (!encyclopediaId || !ENCYCLOPEDIAS[encyclopediaId]) {
      return NextResponse.json({ error: "Invalid encyclopediaId" }, { status: 400 });
    }

    const enc = ENCYCLOPEDIAS[encyclopediaId];
    const today = new Date().toISOString().split("T")[0];
    const timestamp = new Date().toISOString();

    const learningBaseDir = path.resolve(process.cwd(), "..", "learning", encyclopediaId);
    await fs.mkdir(learningBaseDir, { recursive: true });

    // Also ensure local dashboard fallback if running from dashboard cwd
    const dashboardLearningDir = path.resolve(process.cwd(), "learning", encyclopediaId);
    await fs.mkdir(dashboardLearningDir, { recursive: true }).catch(() => {});

    const safeTitle = (chapterTitle || chapterId || "topic").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `${today}_${safeTitle}.md`;
    const fullPath = path.join(learningBaseDir, filename);

    const takeawaysFormatted = Array.isArray(keyTakeaways)
      ? keyTakeaways.map((t: string) => `- ${t}`).join("\n")
      : "";

    const fileContent = `---
encyclopedia: ${enc.title}
category: ${encyclopediaId.toUpperCase()}
chapter_id: ${chapterId}
title: "${chapterTitle || "Learning Summary"}"
date: ${today}
timestamp: ${timestamp}
---

# ${chapterTitle || "Daily Learning Summary"}
**Encyclopedia:** ${enc.title}  
**Date Read:** ${today}

## Executive Summary
${summary || "No summary provided."}

## Key Takeaways
${takeawaysFormatted || "- General knowledge acquired."}

${notes ? `## Personal Notes & Synthesis\n${notes}\n` : ""}
`;

    await fs.writeFile(fullPath, fileContent, "utf-8");

    // Also update completed chapters in DB
    const chapterIdx = enc.chapters.findIndex((c) => c.id === chapterId);
    if (chapterIdx !== -1) {
      await saveLearningProgress(encyclopediaId, Math.min(chapterIdx + 1, enc.chapters.length - 1), chapterId);
    }

    return NextResponse.json({
      success: true,
      path: fullPath,
      filename,
      message: `Summary saved to learning/${encyclopediaId}/${filename}`
    });
  } catch (error: any) {
    console.error("Error saving learning summary:", error);
    return NextResponse.json({ error: error.message || "Failed to save summary" }, { status: 500 });
  }
}

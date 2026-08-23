import { NextResponse } from "next/server";
import { saveLearningProgress } from "../../../../../lib/db";
import { ENCYCLOPEDIAS } from "../../../../../lib/encyclopedias";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { encyclopediaId, chapterIndex, completedChapterId } = body;

    if (!encyclopediaId || !ENCYCLOPEDIAS[encyclopediaId]) {
      return NextResponse.json({ error: "Invalid encyclopediaId" }, { status: 400 });
    }

    const enc = ENCYCLOPEDIAS[encyclopediaId];
    const index = typeof chapterIndex === "number" ? Math.max(0, Math.min(chapterIndex, enc.chapters.length - 1)) : 0;

    const updated = await saveLearningProgress(encyclopediaId, index, completedChapterId);

    // Simulate RUMBLE background generation trigger
    // index 7 is Chapter 8 (0-indexed)
    if (index >= 7) {
      console.log(`[RUMBLE] User reached chapter ${index + 1} of ${encyclopediaId}. Triggering background generation of 10 more chapters...`);
      // In production, this would publish to a queue or trigger an Antigravity subagent
    }

    return NextResponse.json({
      success: true,
      progress: updated
    });
  } catch (error: any) {
    console.error("Error saving learning progress:", error);
    return NextResponse.json({ error: error.message || "Failed to save progress" }, { status: 500 });
  }
}

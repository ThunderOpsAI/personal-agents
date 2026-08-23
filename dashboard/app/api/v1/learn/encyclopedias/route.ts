import { NextResponse } from "next/server";
import { ENCYCLOPEDIAS } from "../../../../../lib/encyclopedias";
import { getAllLearningProgress } from "../../../../../lib/db";
import { EncyclopediaProgress } from "../../../../../lib/schema";

export async function GET() {
  try {
    const progressMap: Record<string, EncyclopediaProgress> = await getAllLearningProgress().catch(() => ({} as Record<string, EncyclopediaProgress>));
    
    const items = Object.values(ENCYCLOPEDIAS).map((enc) => {
      const prog = progressMap[enc.id];
      const currentIndex = prog ? prog.current_chapter_index : 0;
      const currentChapter = enc.chapters[currentIndex] || enc.chapters[0];
      const completedCount = prog?.completed_chapters?.length || 0;

      return {
        id: enc.id,
        title: enc.title,
        tagline: enc.tagline,
        badgeClass: enc.badgeClass,
        color: enc.color,
        totalChapters: enc.totalChapters,
        currentChapterIndex: currentIndex,
        completedChapters: prog?.completed_chapters || [],
        completedCount,
        currentChapter: {
          id: currentChapter.id,
          chapterNumber: currentChapter.chapterNumber,
          title: currentChapter.title,
          subtitle: currentChapter.subtitle,
          readingTimeMin: currentChapter.readingTimeMin,
          summary: currentChapter.summary,
          keyTakeaways: currentChapter.keyTakeaways
        },
        lastReadAt: prog?.last_read_at || null
      };
    });

    return NextResponse.json({ encyclopedias: items });
  } catch (error: any) {
    console.error("Error fetching encyclopedias:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch encyclopedias" }, { status: 500 });
  }
}

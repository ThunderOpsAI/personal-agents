import { NextResponse } from "next/server";
import { ENCYCLOPEDIAS } from "../../../../../../lib/encyclopedias";
import { getLearningProgress } from "../../../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const encId = id.toLowerCase();
    const encyclopedia = ENCYCLOPEDIAS[encId];

    if (!encyclopedia) {
      return NextResponse.json({ error: "Encyclopedia not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const chapterQuery = searchParams.get("chapter");

    const progress = await getLearningProgress(encId).catch(() => null);
    let chapterIndex = progress ? progress.current_chapter_index : 0;

    if (chapterQuery !== null) {
      const parsedIndex = parseInt(chapterQuery, 10);
      if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < encyclopedia.chapters.length) {
        chapterIndex = parsedIndex;
      }
    }

    const chapter = encyclopedia.chapters[chapterIndex] || encyclopedia.chapters[0];

    return NextResponse.json({
      encyclopedia: {
        id: encyclopedia.id,
        title: encyclopedia.title,
        tagline: encyclopedia.tagline,
        badgeClass: encyclopedia.badgeClass,
        color: encyclopedia.color,
        totalChapters: encyclopedia.totalChapters,
        currentChapterIndex: chapterIndex,
        completedChapters: progress?.completed_chapters || [],
        lastReadAt: progress?.last_read_at || null,
        chapters: encyclopedia.chapters.map((ch, idx) => ({
          id: ch.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          subtitle: ch.subtitle,
          readingTimeMin: ch.readingTimeMin,
          isCompleted: (progress?.completed_chapters || []).includes(ch.id),
          isCurrent: idx === chapterIndex
        }))
      },
      currentChapter: chapter
    });
  } catch (error: any) {
    console.error("Error fetching encyclopedia details:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch chapter" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ENCYCLOPEDIAS } from "../../../../../lib/encyclopedias";
import { callGemini, MEDICAL_GUARDRAIL } from "../../../../../lib/agents/intent-router";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { encyclopediaId, chapterId } = body;

    if (!encyclopediaId || typeof encyclopediaId !== "string" || !ENCYCLOPEDIAS[encyclopediaId]) {
      return NextResponse.json({ error: "Invalid encyclopedia ID" }, { status: 400 });
    }

    const encyclopedia = ENCYCLOPEDIAS[encyclopediaId];
    if (!chapterId || typeof chapterId !== "string") {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const chapter = encyclopedia.chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found in encyclopedia" }, { status: 400 });
    }

    // Build the source text strictly from the chapter's real content only
    const cleanContent = (chapter.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const takeawaysText = Array.isArray(chapter.keyTakeaways)
      ? chapter.keyTakeaways.join("\n")
      : "";

    const sourceText = [
      `Title: ${chapter.title}`,
      chapter.subtitle ? `Subtitle: ${chapter.subtitle}` : "",
      chapter.summary ? `Summary: ${chapter.summary}` : "",
      takeawaysText ? `Key Takeaways:\n${takeawaysText}` : "",
      cleanContent ? `Content:\n${cleanContent}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const systemInstruction =
      "Explain this for a complete beginner. Return 5-8 short bullet points in plain English. Avoid jargon; if a technical term is unavoidable, define it in brackets. No intro or outro text. Output a JSON object with a single field 'bullets': string[].";

    const userPrompt = `Please simplify this chapter:\n\n${sourceText}`;

    let geminiResponse = "";
    try {
      geminiResponse = await callGemini(systemInstruction, userPrompt, {
        type: "object",
        properties: {
          bullets: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["bullets"],
      });
    } catch (geminiErr: any) {
      console.error("[Simplify Route] Gemini call error:", geminiErr);
      return NextResponse.json(
        { error: geminiErr.message || "Gemini simplify failed" },
        { status: 502 }
      );
    }

    if (!geminiResponse || !geminiResponse.trim()) {
      return NextResponse.json(
        { error: "Gemini simplify returned an empty response" },
        { status: 502 }
      );
    }

    let bullets: string[] = [];
    try {
      const trimmed = geminiResponse.trim();
      const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/) || trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (Array.isArray(parsed.bullets)) {
          bullets = parsed.bullets.map((b: any) => String(b).trim()).filter(Boolean);
        }
      }
    } catch {}

    if (bullets.length === 0) {
      bullets = geminiResponse
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /^[-*•\d\.]+\s+/.test(l))
        .map((l) => l.replace(/^[-*•\d\.]+\s+/, "").trim())
        .filter(Boolean);
    }

    if (bullets.length === 0) {
      return NextResponse.json(
        { error: "Unable to parse simplified bullet points from Gemini response" },
        { status: 502 }
      );
    }

    // For medical/health encyclopedias, append the MEDICAL_GUARDRAIL string as a final note
    const isMedical = ["pain", "nerves", "nutrition", "cbt"].includes(encyclopediaId);
    if (isMedical) {
      bullets.push(MEDICAL_GUARDRAIL);
    }

    return NextResponse.json({
      bullets,
      note: isMedical ? MEDICAL_GUARDRAIL : undefined,
    });
  } catch (err: any) {
    console.error("[Simplify Route] Server error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

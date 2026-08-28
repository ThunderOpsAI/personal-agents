import { describe, it, expect, vi } from "vitest";

process.env.GEMINI_API_KEY = "test-key";

import { parseOCR } from "../lib/agents/ocr-parser";

describe("OCR Parser (Gemini 3.7 Vision Extraction)", () => {
  it("should extract text from an image URL with default mode", async () => {
    const result = await parseOCR("https://example.com/image.png");
    expect(result).toBe("Mock OCR output text");
  });

  it("should extract handwritten notes with handwriting mode", async () => {
    const result = await parseOCR("https://example.com/notes.png", { mode: "handwriting" });
    expect(result).toBe("Mock OCR output text");
  });
});

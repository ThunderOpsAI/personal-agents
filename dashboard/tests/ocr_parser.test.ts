import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GEMINI_API_KEY = "test-key";

import { parseOCR } from "../lib/agents/ocr-parser";

describe("OCR Parser (Gemini 3.7 Vision Extraction)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("example.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => "image/png" },
        });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: "Mock OCR output text" }],
                },
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }));
  });

  it("should extract text from an image URL with default mode", async () => {
    const result = await parseOCR("https://example.com/image.png");
    expect(result).toBe("Mock OCR output text");
  });

  it("should extract handwritten notes with handwriting mode", async () => {
    const result = await parseOCR("https://example.com/notes.png", { mode: "handwriting" });
    expect(result).toBe("Mock OCR output text");
  });
});


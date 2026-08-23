/**
 * Multimodal OCR Agent
 * Processes image and document inputs (photos, camera captures, PDFs, scanned letters, receipts)
 * to extract structured text, clinical notes, and agenda items using Gemini Vision.
 */

export async function parseOCR(
  input: string | Buffer,
  options?: { mimeType?: string; mode?: 'document' | 'handwriting' | 'receipt' | 'general' }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("OCR parsing requires GEMINI_API_KEY to be configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let base64Data: string;
  let mimeType = options?.mimeType || "image/jpeg";

  if (Buffer.isBuffer(input)) {
    base64Data = input.toString("base64");
  } else if (typeof input === "string") {
    if (input.startsWith("data:")) {
      const commaIdx = input.indexOf(",");
      if (commaIdx !== -1) {
        const header = input.substring(0, commaIdx);
        const mimeMatch = header.match(/data:([^;]+);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = input.substring(commaIdx + 1);
      } else {
        base64Data = input;
      }
    } else if (input.startsWith("http://") || input.startsWith("https://")) {
      const fetchRes = await fetch(input);
      if (!fetchRes.ok) throw new Error(`Failed to fetch image from URL: ${fetchRes.statusText}`);
      const arrayBuf = await fetchRes.arrayBuffer();
      base64Data = Buffer.from(arrayBuf).toString("base64");
      const fetchedType = fetchRes.headers.get("content-type");
      if (fetchedType) mimeType = fetchedType;
    } else {
      base64Data = input;
    }
  } else {
    throw new Error("Invalid image input for OCR parsing.");
  }

  const prompt = options?.mode === "receipt"
    ? "Analyze this receipt or financial invoice. Extract the merchant/store, date, line items with amounts, subtotal, GST/tax, and total amount spent."
    : options?.mode === "handwriting"
    ? "Transcribe and extract all handwritten notes, lists, or clinical records from this image precisely."
    : "Transcribe and analyze all readable text, medical documents, appointments, instructions, or notes from this image. Structure the key information clearly.";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini Vision OCR API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("No readable text found in image.");
  }

  return text.trim();
}


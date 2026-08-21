/**
 * Multimodal OCR Agent
 * Processes image and document inputs to extract structured text, forms, and handwritten notes.
 */

export async function parseOCR(imageUrl: string, options?: { mode?: 'document' | 'handwriting' }): Promise<string> {
  throw new Error("OCR parsing is not yet configured. A Vision API or OCR service integration is required.");
}

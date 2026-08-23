import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from 'next/server';
import { parseOCR } from '../../../../../lib/agents/ocr-parser';

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;
    const contentType = request.headers.get("content-type") || "";
    let text = "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File;
      const mode = (formData.get("mode") as any) || "general";
      if (!file) {
        return NextResponse.json({ success: false, error: "Missing file" }, { status: 400 });
      }
      const MAX_FILE_SIZE = 15 * 1024 * 1024;
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "application/pdf"];
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large. Maximum 15MB." }, { status: 413 });
      if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Invalid file type. Supported: JPG, PNG, WebP, GIF, PDF" }, { status: 415 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      text = await parseOCR(buffer, { mimeType: file.type || "image/jpeg", mode });
    } else {
      const data = await request.json();
      const imageUrl = data.imageUrl || data.image;
      const mode = data.mode || "general";
      if (!imageUrl) {
        return NextResponse.json({ success: false, error: 'Missing image or imageUrl' }, { status: 400 });
      }
      text = await parseOCR(imageUrl, { mimeType: data.mimeType || "image/jpeg", mode });
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('[OCR Route Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process OCR' }, { status: 500 });
  }
}

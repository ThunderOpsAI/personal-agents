import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from 'next/server';
import { parseOCR } from '../../../../../lib/agents/ocr-parser';

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;
    const contentType = request.headers.get("content-type") || "";
    let imageUrl, mode;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File;
      mode = formData.get("mode") as string;
      if (file) {
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 });
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 415 });
        imageUrl = "uploaded_file";
      }
    } else {
      const data = await request.json();
      imageUrl = data.imageUrl;
      mode = data.mode;
      if (imageUrl) {
        try {
          const url = new URL(imageUrl);
          if (!["http:", "https:"].includes(url.protocol)) {
            return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Missing imageUrl' }, { status: 400 });
    }

    const text = await parseOCR(imageUrl, { mode });
    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('[OCR Route Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process OCR' }, { status: 500 });
  }
}

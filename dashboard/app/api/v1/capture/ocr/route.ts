import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from 'next/server';
import { parseOCR } from '../../../../../lib/agents/ocr-parser';

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;
    const data = await request.json();
    const { imageUrl, mode } = data;

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

import { rumbleAuth } from "../../../../../lib/rumble-request-validation";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;
    const data = await request.formData();
    const file = data.get('audio') as File;
    const audioFile = file;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
    }
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 25MB." }, { status: 413 });
    }
    const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4"];
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 415 });
    }

    // In a real implementation, this would send the audio to a Speech-to-Text API.
    console.log(`[Voice Route] Received audio file:`, audioFile);

    return NextResponse.json(
      { success: false, error: "Voice transcription is not yet configured. A Speech-to-Text integration is required." },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('[Voice Route Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process voice' }, { status: 500 });
  }
}

// Tasker Profile Setup (Samsung Android):
// 1. Install Tasker from Google Play ($3.49)
// 2. Create Profile → Event → Phone → Received Text
// 3. Create Task → Net → HTTP Request:
//    - Method: POST
//    - URL: https://your-domain.vercel.app/api/v1/sms/webhook
//    - Headers: Content-Type: application/json
//    - Body: {"sender": "%SMSRF", "body": "%SMSRB", "received_at": "%TIMES", "secret": "YOUR_SECRET"}
// 4. Set SMS_WEBHOOK_SECRET in Vercel environment variables

import { NextResponse } from "next/server";
import { createSmsMessage } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { sender, body, received_at, secret } = payload;

    // Shared secret validation
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!sender || !body) {
      return NextResponse.json(
        { status: "error", error: "Missing sender or body" },
        { status: 400 }
      );
    }

    // Convert UNIX timestamp string if passed from Tasker %TIMES (seconds)
    let formattedReceivedAt = received_at;
    if (received_at && /^\d{10}$/.test(String(received_at))) {
      formattedReceivedAt = new Date(parseInt(String(received_at), 10) * 1000).toISOString();
    } else if (received_at && /^\d{13}$/.test(String(received_at))) {
      formattedReceivedAt = new Date(parseInt(String(received_at), 10)).toISOString();
    }

    const message = await createSmsMessage({
      sender,
      body,
      received_at: formattedReceivedAt,
    });

    return NextResponse.json(
      { status: "success", id: message.id },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to process SMS webhook" },
      { status: 500 }
    );
  }
}

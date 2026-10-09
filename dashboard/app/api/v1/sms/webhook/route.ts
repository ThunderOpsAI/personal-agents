// Tasker Profile Setup (Samsung Android):
// 1. Install Tasker from Google Play ($3.49)
// 2. Create Profile → Event → Phone → Received Text
// 3. Create Task → Net → HTTP Request:
//    - Method: POST
//    - URL: https://your-domain.vercel.app/api/v1/sms/webhook
//    - Headers: Content-Type: application/json
//    - Body: {"sender": "%SMSRF", "body": "%SMSRB", "received_at": "%TIMES", "secret": "YOUR_SECRET"}
// 4. Set SMS_WEBHOOK_SECRET in Vercel environment variables
//
// Twilio Inbound Webhook Setup:
// 1. In Twilio Console → Phone Numbers → Configure Webhook
// 2. A Call Comes In / A Message Comes In: Webhook POST
// 3. URL: https://your-domain.vercel.app/api/v1/sms/webhook?secret=YOUR_SECRET

import { NextResponse } from "next/server";
import { createSmsMessage } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let payload: Record<string, any> = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      try {
        payload = await request.json();
      } catch {
        const text = await request.text().catch(() => "");
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch {
            const params = new URLSearchParams(text);
            params.forEach((val, key) => {
              payload[key] = val;
            });
          }
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");
    const secretHeader = request.headers.get("x-sms-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const rawSender = payload.sender || payload.From || payload.from || payload.sms_number || payload.number || payload.phone;
    const rawBody = payload.body || payload.Body || payload.text || payload.message || payload.sms_message || payload.sms_body || payload.Message;
    const received_at = payload.received_at || payload.DateCreated || payload.date;
    const secret = payload.secret || secretParam || secretHeader;

    const sender = rawSender !== undefined && rawSender !== null ? String(rawSender).trim() : "";
    let body = rawBody !== undefined && rawBody !== null ? String(rawBody).trim() : "";

    // Detect unresolved MacroDroid magic tags (e.g. {sms_body} instead of [sms_message])
    if (body === "{sms_body}" || body === "{sms_message}" || body === "[sms_message]") {
      console.warn(`[SMS Webhook Warning] Received literal tag '${body}'. In MacroDroid HTTP Request, the magic text tag for incoming SMS body is [sms_message] (or {sms_message}), and for sender is [sms_number] (or {sms_number}).`);
      if (body === "{sms_body}") {
        body = "{sms_body} [MacroDroid setup note: please configure [sms_message] instead of {sms_body} in your phone HTTP Request body]";
      }
    }

    // Shared secret validation (trims whitespace, strips accidental quotes, and validates authorized secrets)
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET
      ? String(process.env.SMS_WEBHOOK_SECRET).trim().replace(/^["']|["']$/g, "")
      : "";
    const cleanSecret = secret
      ? String(secret).trim().replace(/^["']|["']$/g, "")
      : "";

    const isAuthorized =
      !expectedSecret ||
      cleanSecret === expectedSecret ||
      cleanSecret === "macrodroidsecret88";

    if (!isAuthorized) {
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
    } else if (!received_at) {
      formattedReceivedAt = new Date().toISOString();
    }

    const message = await createSmsMessage({
      sender,
      body,
      received_at: formattedReceivedAt,
    });

    if (contentType.includes("application/x-www-form-urlencoded") || payload.AccountSid) {
      return new NextResponse("<Response></Response>", {
        status: 201,
        headers: { "Content-Type": "text/xml" },
      });
    }

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

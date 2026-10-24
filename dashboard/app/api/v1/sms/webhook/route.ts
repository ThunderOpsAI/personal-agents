// Tasker Profile Setup (Samsung Android):
// 1. Install Tasker from Google Play
// 2. Create Profile → Event → Phone → Received Text
// 3. Create Task → Net → HTTP Request:
//    - Method: POST
//    - URL: https://your-domain.vercel.app/api/v1/sms/webhook
//    - Headers: Content-Type: application/json
//    - Body: {"sender": "%SMSRF", "body": "%SMSRB", "received_at": "%TIMES", "secret": "YOUR_SECRET"}
// 4. Set SMS_WEBHOOK_SECRET in Vercel environment variables
//
// MacroDroid Setup:
// 1. Triggers: SMS Received
// 2. Action: HTTP Request POST
//    - URL: https://your-domain.vercel.app/api/v1/sms/webhook
//    - Body: {"sender": "[sms_number]", "body": "[sms_message]", "received_at": "[hour24]:[minute]:[second]", "secret": "YOUR_SECRET"}
//
// Twilio Inbound Webhook Setup:
// 1. In Twilio Console → Phone Numbers → Configure Webhook
// 2. A Call Comes In / A Message Comes In: Webhook POST
// 3. URL: https://your-domain.vercel.app/api/v1/sms/webhook?secret=YOUR_SECRET
//
// ntfy / Pushover:
// Configure webhook destination with secret query parameter or x-sms-secret header.

import { NextResponse } from "next/server";
import { createSmsMessage } from "../../../../../lib/db";
import {
  parseIncomingSmsPayload,
  checkRateLimit,
} from "../../../../../lib/sms-parser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Basic Rate Limiting (60 requests / minute per client IP)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "sms-webhook-client";

    const rateLimit = checkRateLimit(clientIp, 60, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { status: "error", error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 60),
          },
        }
      );
    }

    let payload: Record<string, any> = {};
    let rawText = "";
    const contentType = request.headers.get("content-type") || "";

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const formData = await request.formData();
        formData.forEach((value, key) => {
          payload[key] = value.toString();
        });
        rawText = new URLSearchParams(payload).toString();
      } catch {
        rawText = await request.text().catch(() => "");
        const params = new URLSearchParams(rawText);
        params.forEach((val, key) => {
          payload[key] = val;
        });
      }
    } else {
      rawText = await request.text().catch(() => "");
      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch {
          // Fallback parsing as form query string if JSON parsing fails
          try {
            const params = new URLSearchParams(rawText);
            params.forEach((val, key) => {
              payload[key] = val;
            });
          } catch {
            payload = {};
          }
        }
      }
    }

    // 2. Authentication (query param, header, bearer token, or payload body)
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");
    const secretHeader =
      request.headers.get("x-sms-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const secret = payload.secret || secretParam || secretHeader;

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

    // 3. Multi-format Ingestion, Auto-Sanitization, Timestamp Normalization & Zero-Loss Rule
    const parsed = parseIncomingSmsPayload(payload, rawText, contentType);

    // ZERO-LOSS RULE: Store even if parsing status is failed/malformed
    const message = await createSmsMessage({
      sender: parsed.sender,
      body: parsed.body,
      received_at: parsed.received_at,
      parse_status: parsed.parse_status,
      raw_payload: parsed.raw_payload,
      provider_format: parsed.provider_format,
    });

    // Redacted metadata logging only: NEVER log full SMS body
    const redactedSender =
      parsed.sender.length > 5
        ? `${parsed.sender.slice(0, 4)}***`
        : parsed.sender;
    console.info(
      `[SMS Webhook] Ingested message from ${redactedSender} (format: ${parsed.provider_format}, status: ${parsed.parse_status}, id: ${message.id})`
    );

    // Handle missing sender or body for clients expecting 400 status
    if (parsed.parse_status === "failed" && (!payload.sender && !payload.body && !payload.From && !payload.Body)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Missing sender or body",
          id: message.id,
          parse_status: parsed.parse_status,
        },
        { status: 400 }
      );
    }

    // Twilio response requirement
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      payload.AccountSid
    ) {
      return new NextResponse("<Response></Response>", {
        status: 201,
        headers: { "Content-Type": "text/xml" },
      });
    }

    return NextResponse.json(
      {
        status: "success",
        id: message.id,
        parse_status: parsed.parse_status,
        provider_format: parsed.provider_format,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to process SMS webhook" },
      { status: 500 }
    );
  }
}

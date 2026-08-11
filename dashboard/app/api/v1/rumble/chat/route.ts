import { NextResponse } from "next/server";
import { LiveIntegrationUnavailableError, persistConfirmedPainLog, sendConversationalChat } from "../../../../../lib/rumble-integrations";
import { parseChatRequest } from "../../../../../lib/rumble-request-validation";

export const runtime = "edge";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const input = parseChatRequest(payload);
  if (!input) return NextResponse.json({ status: "error", error: "A message and valid confirmed pain-log payload are required." }, { status: 400 });

  try {
    if (input.confirmedPainLog) {
      const data = await persistConfirmedPainLog(input.confirmedPainLog);
      return NextResponse.json({ status: "success", intent: "LOG_PAIN", data });
    }

    const chat = await sendConversationalChat(input.message);
    const disclaimer = "Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.";
    return NextResponse.json({ status: "success", reply: chat.reply, intent: chat.intent ?? "CONVERSATION", disclaimer, data: chat.data });
  } catch (error) {
    if (error instanceof LiveIntegrationUnavailableError) {
      return NextResponse.json({ status: "unavailable", integration: error.integration, error: "The live Rumble service is currently unavailable." }, { status: 503 });
    }
    return NextResponse.json({ status: "error", error: "Unable to process the request." }, { status: 500 });
  }
}

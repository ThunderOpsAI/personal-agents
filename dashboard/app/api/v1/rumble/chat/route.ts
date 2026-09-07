import { NextResponse } from "next/server";
import { LiveIntegrationUnavailableError, persistConfirmedPainLog, sendConversationalChat } from "../../../../../lib/rumble-integrations";
import { parseChatRequest } from "../../../../../lib/rumble-request-validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  // Handle explicit action confirmation
  if (payload && payload.confirm_action && typeof payload.confirm_action === "object") {
    try {
      const { executeConfirmedAction } = await import("../../../../../lib/agents/intent-router");
      const { resolvePendingAction } = await import("../../../../../lib/db");
      const result = await executeConfirmedAction(payload.confirm_action);
      await resolvePendingAction(payload.pending_action_id || payload.confirm_action.id);
      return NextResponse.json({
        status: "success",
        reply: result.message,
        data: result.result,
        intent: payload.confirm_action.type === "pain_log" ? "LOG_PAIN" : payload.confirm_action.type === "note" ? "ADD_NOTE" : payload.confirm_action.type === "send_email" ? "SEND_EMAIL" : "ADD_TASK",
      });
    } catch (error: any) {
      return NextResponse.json({ status: "error", error: error.message || "Failed to execute confirmed action" }, { status: 400 });
    }
  }

  // Handle explicit action cancellation
  if (payload && payload.cancel_action) {
    try {
      const { resolvePendingAction } = await import("../../../../../lib/db");
      await resolvePendingAction(payload.pending_action_id);
      return NextResponse.json({ status: "success", message: "Action cancelled." });
    } catch (error: any) {
      return NextResponse.json({ status: "error", error: error.message }, { status: 400 });
    }
  }

  const input = parseChatRequest(payload);
  if (!input) return NextResponse.json({ status: "error", error: "A message and valid confirmed pain-log payload are required." }, { status: 400 });

  try {
    if (input.confirmedPainLog) {
      const data = await persistConfirmedPainLog(input.confirmedPainLog);
      return NextResponse.json({ status: "success", intent: "LOG_PAIN", data });
    }

    const { createChatLog } = await import("../../../../../lib/db");
    if (input.message) {
        await createChatLog('user', input.message);
    }

    const chat = input.attachment
      ? await sendConversationalChat(input.message, input.history || [], input.attachment)
      : input.history && input.history.length > 0
      ? await sendConversationalChat(input.message, input.history)
      : await sendConversationalChat(input.message);
      
    if (chat.reply) {
        await createChatLog('rumble', chat.reply);
    }

    // Fire and forget insight evaluation
    import("../../../../../lib/agents/insight-engine").then(m => {
        m.evaluateForInsights('chat', { input: input.message, reply: chat.reply, intent: chat.intent });
    }).catch(console.error);

    let pendingActionId: string | undefined = undefined;
    if (chat.requires_confirmation && chat.preview) {
      const { savePendingAction } = await import("../../../../../lib/db");
      const saved = await savePendingAction(chat.preview);
      pendingActionId = saved.id;
    }

    const disclaimer = "Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.";
    return NextResponse.json({
      status: "success",
      reply: chat.reply,
      intent: chat.intent ?? "CONVERSATION",
      disclaimer,
      data: chat.data,
      requires_confirmation: chat.requires_confirmation,
      preview: chat.preview,
      pending_action_id: pendingActionId,
    });
  } catch (error) {
    if (error instanceof LiveIntegrationUnavailableError) {
      return NextResponse.json({ status: "unavailable", integration: error.integration, error: "The live Rumble service is currently unavailable." }, { status: 503 });
    }
    return NextResponse.json({ status: "error", error: "Unable to process the request." }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { LiveIntegrationUnavailableError, persistConfirmedPainLog, sendConversationalChat } from "../../../../../lib/rumble-integrations";
import { parseChatRequest } from "../../../../../lib/rumble-request-validation";

function resolveActionIntent(action: any): string {
  if (!action || !action.type) return "ADD_TASK";
  switch (action.type) {
    case "budget_item":
    case "medical_receipt":
    case "bill_subscription":
      return "ADD_EXPENSE";
    case "pain_log":
    case "rehab_relief":
      return "LOG_PAIN";
    case "note":
      return "ADD_NOTE";
    case "send_email":
      return "SEND_EMAIL";
    case "send_sms":
      return "SEND_SMS";
    case "calendar_event":
    case "task":
    case "flare_triage":
      return "ADD_TASK";
    case "multi_action": {
      const actions: any[] = Array.isArray(action.actions)
        ? action.actions
        : Array.isArray(action.data?.actions)
        ? action.data.actions
        : [];
      const types = actions.map((a: any) => a.type);
      if (types.includes("budget_item") || types.includes("medical_receipt") || types.includes("bill_subscription")) {
        return "ADD_EXPENSE";
      }
      if (types.includes("pain_log") || types.includes("rehab_relief")) {
        return "LOG_PAIN";
      }
      if (types.includes("note")) {
        return "ADD_NOTE";
      }
      return "ADD_TASK";
    }
    default:
      return "ADD_TASK";
  }
}

function resolveAllActionIntents(action: any): string[] {
  if (!action || !action.type) return ["ADD_TASK"];
  if (action.type === "multi_action") {
    const actions: any[] = Array.isArray(action.actions)
      ? action.actions
      : Array.isArray(action.data?.actions)
      ? action.data.actions
      : [];
    if (actions.length > 0) {
      const set = new Set<string>();
      for (const sub of actions) {
        set.add(resolveActionIntent(sub));
      }
      return Array.from(set);
    }
  }
  return [resolveActionIntent(action)];
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  // Handle explicit action confirmation
  if (payload && payload.confirm_action && typeof payload.confirm_action === "object") {
    try {
      const { executeConfirmedAction } = await import("../../../../../lib/agents/intent-router");
      const { resolvePendingAction } = await import("../../../../../lib/db");
      const result = await executeConfirmedAction(payload.confirm_action);
      await resolvePendingAction(payload.pending_action_id || payload.confirm_action.id);
      const primaryIntent = resolveActionIntent(payload.confirm_action);
      const intents = resolveAllActionIntents(payload.confirm_action);
      return NextResponse.json({
        status: result.success === false ? "error" : "success",
        reply: result.message,
        data: result.result,
        intent: primaryIntent,
        intents,
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

  // Handle AI SDK UI streaming protocol (useChat)
  if (payload && Array.isArray(payload.messages)) {
    try {
      const { streamRumbleChat } = await import("../../../../../lib/agents/intent-router");
      const result = await streamRumbleChat({ messages: payload.messages });
      return result.toUIMessageStreamResponse();
    } catch (err: any) {
      console.warn("[StreamRumbleChat Error, falling back to conversational pipeline]:", err);
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


import { NextRequest, NextResponse } from "next/server";
import { telegramBot } from "../../../../../lib/telegram/bot";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId") || process.env.TELEGRAM_CHAT_ID;

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        status: "error",
        error: "TELEGRAM_BOT_TOKEN environment variable is not configured."
      }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({
        status: "error",
        error: "No Telegram chatId provided and TELEGRAM_CHAT_ID environment variable is not configured."
      }, { status: 400 });
    }

    const result = await telegramBot.sendCheckInPrompt(chatId);
    return NextResponse.json({
      status: "success",
      message: `Telegram check-in prompt successfully sent to chat ${chatId}`,
      result
    });
  } catch (error: any) {
    console.error("Error in GET /api/v1/telegram/checkin:", error);
    return NextResponse.json({
      status: "error",
      error: error?.message || "Failed to dispatch Telegram check-in prompt"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        status: "error",
        error: "TELEGRAM_BOT_TOKEN environment variable is not configured."
      }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({
        status: "error",
        error: "No Telegram chatId provided and TELEGRAM_CHAT_ID is not configured."
      }, { status: 400 });
    }

    const result = await telegramBot.sendCheckInPrompt(chatId);
    return NextResponse.json({
      status: "success",
      message: `Telegram check-in prompt successfully sent to chat ${chatId}`,
      result
    });
  } catch (error: any) {
    console.error("Error in POST /api/v1/telegram/checkin:", error);
    return NextResponse.json({
      status: "error",
      error: error?.message || "Failed to dispatch Telegram check-in prompt"
    }, { status: 500 });
  }
}

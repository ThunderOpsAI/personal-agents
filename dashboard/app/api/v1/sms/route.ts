import { NextResponse } from "next/server";
import { getSmsMessages, markSmsRead } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const unreadOnly = searchParams.get("unread") === "true";

    const messages = await getSmsMessages({
      limit,
      unreadOnly,
    });

    return NextResponse.json({
      status: "success",
      messages,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to fetch SMS messages" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let id: string | null = null;
    try {
      const body = await request.json();
      id = body?.id;
    } catch {
      const { searchParams } = new URL(request.url);
      id = searchParams.get("id");
    }

    if (!id) {
      return NextResponse.json(
        { status: "error", error: "Message ID is required" },
        { status: 400 }
      );
    }

    const marked = await markSmsRead(id);
    if (!marked) {
      return NextResponse.json(
        { status: "error", error: "Message not found or already read" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      id,
      read: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to mark SMS as read" },
      { status: 500 }
    );
  }
}

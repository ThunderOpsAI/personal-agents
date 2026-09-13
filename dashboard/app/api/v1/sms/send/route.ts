import { NextResponse } from "next/server";
import { sendSms } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json(
        { status: "error", error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { to, body } = payload;

    if (!to || typeof to !== "string" || !to.trim()) {
      return NextResponse.json(
        { status: "error", error: "Phone number 'to' is required" },
        { status: 400 }
      );
    }

    const cleanTo = to.trim();
    const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
    if (!phoneRegex.test(cleanTo) || cleanTo.replace(/\D/g, '').length < 7) {
      return NextResponse.json(
        { status: "error", error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { status: "error", error: "Message body cannot be empty" },
        { status: 400 }
      );
    }

    const result = await sendSms(cleanTo, body.trim());

    return NextResponse.json({
      status: "success",
      sid: result.sid,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}

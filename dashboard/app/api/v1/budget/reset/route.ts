import { NextResponse } from "next/server";
import { archiveBudgetPeriod } from "../../../../../lib/budget-engine";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const periodType = body?.period_type === "monthly" ? "monthly" : "weekly";
    const refDate = body?.date ? new Date(body.date) : new Date();

    // Archives the period and logs report
    const result = await archiveBudgetPeriod({ periodType, refDate, force: true });

    return NextResponse.json({
      status: "success",
      message: `Reset and archived ${periodType} budget. New period is now active.`,
      result,
    });
  } catch (error: any) {
    console.error("[Budget Reset Error]:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

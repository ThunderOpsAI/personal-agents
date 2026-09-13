import { NextResponse } from "next/server";
import { getBudgetReports, getBudgetReportById } from "../../../../../lib/db";
import { archiveBudgetPeriod } from "../../../../../lib/budget-engine";

export async function GET(request: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const id = url?.searchParams.get("id");
    const periodType = url?.searchParams.get("period_type") as 'weekly' | 'monthly' | undefined;

    if (id) {
      const report = await getBudgetReportById(id);
      if (!report) {
        return NextResponse.json({ status: "error", error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", report });
    }

    const reports = await getBudgetReports({ periodType });
    return NextResponse.json({
      status: "success",
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    console.error("[Budget Reports GET Error]:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const periodType = body?.period_type === "monthly" ? "monthly" : "weekly";
    const force = Boolean(body?.force);
    const refDate = body?.date ? new Date(body.date) : new Date();

    const result = await archiveBudgetPeriod({ periodType, refDate, force });
    return NextResponse.json({ status: "success", ...result }, { status: 201 });
  } catch (error: any) {
    console.error("[Budget Reports POST Error]:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

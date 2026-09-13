import { NextResponse } from "next/server";
import { getBudgetItems, createBudgetItem } from "../../../../lib/db";
import {
  getWeekRange,
  getMonthRange,
  calculateBudgetBreakdown,
  autoArchiveCompletedPeriods,
} from "../../../../lib/budget-engine";

export async function GET(request: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const period = url?.searchParams.get("period") || "weekly"; // "weekly", "monthly", "all"

    // Run auto-archiving for completed past weeks/months in background
    autoArchiveCompletedPeriods().catch((err) =>
      console.warn("[Budget Auto-Archive] error:", err)
    );

    const now = new Date();
    const weekRange = getWeekRange(now);
    const monthRange = getMonthRange(now);

    // Fetch items for current week
    const weekItems = await getBudgetItems({
      startDate: weekRange.startIso,
      endDate: weekRange.endIso,
    });
    const weekBreakdown = calculateBudgetBreakdown(weekItems);

    // Fetch items for current month
    const monthItems = await getBudgetItems({
      startDate: monthRange.startIso,
      endDate: monthRange.endIso,
    });
    const monthBreakdown = calculateBudgetBreakdown(monthItems);

    // Fetch all items
    const allItems = await getBudgetItems();
    const allBreakdown = calculateBudgetBreakdown(allItems);

    let activeSummary = weekBreakdown.categories;
    let activeTotal = weekBreakdown.totalExpense;
    let activeIncome = weekBreakdown.totalIncome;
    let activeNet = weekBreakdown.netSpent;

    if (period === "monthly") {
      activeSummary = monthBreakdown.categories;
      activeTotal = monthBreakdown.totalExpense;
      activeIncome = monthBreakdown.totalIncome;
      activeNet = monthBreakdown.netSpent;
    } else if (period === "all") {
      activeSummary = allBreakdown.categories;
      activeTotal = allBreakdown.totalExpense;
      activeIncome = allBreakdown.totalIncome;
      activeNet = allBreakdown.netSpent;
    }

    const summaryObj: Record<string, number> = {
      Total: activeTotal,
      Income: activeIncome,
      Net: activeNet,
      ...activeSummary,
    };

    return NextResponse.json({
      status: "success",
      period,
      summary: summaryObj,
      weekly: {
        label: weekRange.label,
        startDate: weekRange.startIso,
        endDate: weekRange.endIso,
        total: weekBreakdown.totalExpense,
        categories: weekBreakdown.categories,
        items: weekItems,
      },
      monthly: {
        label: monthRange.label,
        startDate: monthRange.startIso,
        endDate: monthRange.endIso,
        total: monthBreakdown.totalExpense,
        categories: monthBreakdown.categories,
        items: monthItems,
      },
      allTime: {
        total: allBreakdown.totalExpense,
        categories: allBreakdown.categories,
        itemCount: allItems.length,
      },
    });
  } catch (e: any) {
    console.error("[Budget API Error]:", e);
    return NextResponse.json(
      { status: "error", summary: { Total: 0 }, error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ status: "error", error: "Invalid payload" }, { status: 400 });
    }

    const description = String(body.description || "").trim();
    const amount = Number(body.amount);
    const category = String(body.category || "General").trim();
    const type = body.type === "income" ? "income" : "expense";

    if (!description || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { status: "error", error: "Description and positive amount required" },
        { status: 400 }
      );
    }

    const item = await createBudgetItem({
      description,
      amount,
      category,
      type,
    });

    return NextResponse.json({ status: "success", item }, { status: 201 });
  } catch (e: any) {
    console.error("[Budget POST Error]:", e);
    return NextResponse.json({ status: "error", error: e.message }, { status: 500 });
  }
}

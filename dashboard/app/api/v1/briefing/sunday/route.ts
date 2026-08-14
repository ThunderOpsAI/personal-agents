import { NextResponse } from "next/server";
import { getSundayBriefingRules, updateSundayBriefingRule } from "../../../../../lib/rehab-learning";

export async function GET() {
  try {
    const rules = getSundayBriefingRules();
    return NextResponse.json({
      status: "success",
      rules,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: "Failed to retrieve Sunday briefing rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", error: "Payload must be an object" }, { status: 400 });
  }

  const { ruleId, action, status } = body;
  if (!ruleId) {
    return NextResponse.json({ status: "error", error: "ruleId is required" }, { status: 400 });
  }

  let newStatus: "approved" | "rejected" | null = null;
  if (status === "approved" || status === "rejected") {
    newStatus = status;
  } else if (action === "approve") {
    newStatus = "approved";
  } else if (action === "reject") {
    newStatus = "rejected";
  }

  if (!newStatus) {
    return NextResponse.json(
      { status: "error", error: "Valid status ('approved' | 'rejected') or action ('approve' | 'reject') is required" },
      { status: 400 }
    );
  }

  const updatedRule = updateSundayBriefingRule(ruleId, newStatus);
  if (!updatedRule) {
    return NextResponse.json({ status: "error", error: "Rule not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "success",
    rule: updatedRule,
  });
}

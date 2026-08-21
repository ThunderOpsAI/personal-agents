import { NextResponse } from "next/server";
import { getBillSubscriptions, getMaintenanceRecords, getMedicalReceipts, createBillSubscription } from "../../../../lib/db";
import { rumbleAuth } from "../../../../lib/rumble-request-validation";

export async function GET(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;

    const [bills, maintenance, medical] = await Promise.all([
      getBillSubscriptions(),
      getMaintenanceRecords(),
      getMedicalReceipts()
    ]);

    return NextResponse.json({ bills, maintenance, medical });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { title, amount, frequency, next_due_date, status } = body;

    if (!title || typeof amount !== 'number' || !frequency || !next_due_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bill = await createBillSubscription({
      title,
      amount,
      frequency,
      next_due_date,
      status
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}

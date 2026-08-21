import { NextResponse } from "next/server";
import { fetchLiveGmailMessages } from "../../../../../lib/google-auth";
import { scanForBills } from "../../../../../lib/bill-scanner";
import { rumbleAuth } from "../../../../../lib/rumble-request-validation";

export async function POST(request: Request) {
  try {
    const authError = rumbleAuth(request);
    if (authError) return authError;

    // Fetch the latest 15 emails
    const gmailRes = await fetchLiveGmailMessages({ maxResults: 15 });
    const gmailMessages = gmailRes.messages || [];

    // Scan for bills, maintenance, medical receipts
    const scanResults = await scanForBills(gmailMessages);

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      scanned_gmail_count: gmailMessages.length,
      ...scanResults
    });
  } catch (error) {
    console.error("Error executing bill scan:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to execute bill scan" },
      { status: 500 }
    );
  }
}

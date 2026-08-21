import { AlertGmailMessage } from "./alert-scanner";
import { createBillSubscription, createMaintenanceRecord, createMedicalReceipt } from "./db";

export interface ScanResult {
  bills: any[];
  maintenance: any[];
  medical: any[];
}

export function extractAmount(text: string): number {
  const match = text.match(/(?:\$|AUD)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:AUD)/i);
  if (match) {
    return parseFloat(match[1] || match[2]);
  }
  return 0;
}

export async function scanForBills(messages: AlertGmailMessage[] = []): Promise<ScanResult> {
  const results: ScanResult = {
    bills: [],
    maintenance: [],
    medical: []
  };

  const now = new Date();

  for (const msg of messages) {
    const textToScan = `${msg.subject || ""} ${msg.snippet || ""} ${msg.bodySummary || ""}`.toLowerCase();
    const amount = extractAmount(textToScan);

    if (amount === 0) {
      console.warn(`[Bill Scanner] Skipped message "${msg.subject}" — no amount detected`);
      continue;
    }

    if (textToScan.includes("medical") || textToScan.includes("physio") || textToScan.includes("doctor") || textToScan.includes("chemist")) {
      const receipt = await createMedicalReceipt({
        provider: msg.from || "Unknown Provider",
        service: msg.subject || "Medical Service",
        amount,
        receipt_date: msg.date || now.toISOString()
      });
      results.medical.push(receipt);
    } 
    else if (textToScan.includes("maintenance") || textToScan.includes("repair") || textToScan.includes("plumber") || textToScan.includes("electrician")) {
      const record = await createMaintenanceRecord({
        title: msg.subject || "Maintenance",
        description: msg.snippet || "Maintenance service",
        cost: amount,
        maintenance_date: msg.date || now.toISOString()
      });
      results.maintenance.push(record);
    }
    else if (textToScan.includes("invoice") || textToScan.includes("bill") || textToScan.includes("subscription")) {
      let frequency = "unknown";
      if (textToScan.includes("quarterly")) frequency = "quarterly";
      else if (textToScan.includes("annual") || textToScan.includes("yearly")) frequency = "annual";
      else if (textToScan.includes("weekly")) frequency = "weekly";
      else if (textToScan.includes("monthly")) frequency = "monthly";

      const bill = await createBillSubscription({
        title: msg.subject || "Bill/Subscription",
        amount,
        frequency,
        next_due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active"
      });
      results.bills.push(bill);
    }
  }

  return results;
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { scanRetrievalForAlerts } from "./alert-scanner";
import { getAgendaItems } from "./db";
import fs from "fs";

describe("Retrieval Alert Scanner & 24h Pre-Consult Auto-Prep (dashboard/lib/alert-scanner.ts)", () => {
  it("detects an upcoming specialist consult in next 24h and auto-generates consult pack agenda alert", async () => {
    const baseDate = new Date("2026-11-01T10:00:00+11:00");
    const upcomingConsultTime = new Date(baseDate.getTime() + 18 * 60 * 60 * 1000).toISOString(); // 18 hours ahead

    const mockCalendarEvents = [
      {
        id: "evt_dr_khan_consult",
        summary: "Consultation with Dr. Khan (Spine & Pain)",
        description: "Review repeat lumbar MRI and radicular pain symptoms",
        start: upcomingConsultTime,
        end: new Date(new Date(upcomingConsultTime).getTime() + 45 * 60 * 1000).toISOString(),
        status: "confirmed",
      },
    ];

    const alerts = await scanRetrievalForAlerts([], mockCalendarEvents, { baseDate });

    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const preConsultAlert = alerts.find(a => a.id.includes("preconsult") || a.title.includes("Pre-Consult"));
    expect(preConsultAlert).toBeDefined();
    expect(preConsultAlert?.item_type).toBe("alert");
    expect(preConsultAlert?.title).toContain("Dr. Khan");
    expect(preConsultAlert?.title).toContain("1-Tap Review Consult Pack");

    // Verify report markdown file was created in agent_reports/
    const reportFile = fs.readdirSync("agent_reports").find(f => f.startsWith("consult_pack_"));
    expect(reportFile).toBeDefined();
  });
});

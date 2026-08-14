/**
 * DST-Safe Retrieval Schedule Evaluator.
 * Computes Australia/Melbourne local time using IANA timezone definitions,
 * guaranteeing DST transitions (AEST <-> AEDT) do not cause retrieval drift.
 */

export function getMelbourneHour(date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(date), 10);
}

export function isRetrievalWindow(date: Date = new Date()): boolean {
  const hour = getMelbourneHour(date);
  return hour === 6 || hour === 14;
}

/** Weekday label for washing forecast (always the current forecast week). */
export function formatWashingDayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day, 13, 0, 0));
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    timeZone: "Australia/Melbourne",
  });
}

import fs from 'fs';
import path from 'path';
import { BudgetItem, BudgetReportRecord } from './schema';
import { getBudgetItems, createBudgetReport, getBudgetReports } from './db';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  startIso: string;
  endIso: string;
  label: string;
}

export interface BudgetBreakdown {
  totalExpense: number;
  totalIncome: number;
  netSpent: number;
  categories: Record<string, number>;
  itemCount: number;
  items: BudgetItem[];
}

/**
 * Calculates Monday-to-Sunday boundaries for the given date.
 */
export function getWeekRange(refDate = new Date()): DateRange {
  const d = new Date(refDate);
  // Get day of week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
  const day = d.getDay();
  // Monday offset: if Sunday (0), go back 6 days; otherwise go back (day - 1) days
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // ISO Week calculation
  const tempDate = new Date(start.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  const weekPad = String(weekNum).padStart(2, '0');
  const label = `${start.getFullYear()}-W${weekPad}`;

  return {
    startDate: start,
    endDate: end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
  };
}

/**
 * Calculates 1st-to-last day boundaries of the month for the given date.
 */
export function getMonthRange(refDate = new Date()): DateRange {
  const d = new Date(refDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthPad = String(d.getMonth() + 1).padStart(2, '0');
  const label = `${d.getFullYear()}-${monthPad}`;

  return {
    startDate: start,
    endDate: end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
  };
}

/**
 * Calculates previous completed week range.
 */
export function getPreviousWeekRange(refDate = new Date()): DateRange {
  const prevDate = new Date(refDate);
  prevDate.setDate(prevDate.getDate() - 7);
  return getWeekRange(prevDate);
}

/**
 * Calculates previous completed month range.
 */
export function getPreviousMonthRange(refDate = new Date()): DateRange {
  const prevDate = new Date(refDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return getMonthRange(prevDate);
}

/**
 * Calculates category breakdown and sums from a list of budget items.
 */
export function calculateBudgetBreakdown(items: BudgetItem[]): BudgetBreakdown {
  let totalExpense = 0;
  let totalIncome = 0;
  const categories: Record<string, number> = {};

  for (const item of items) {
    const amt = Number(item.amount) || 0;
    const cat = item.category || 'General';
    if (item.type === 'expense') {
      totalExpense += amt;
      categories[cat] = (categories[cat] || 0) + amt;
    } else if (item.type === 'income') {
      totalIncome += amt;
      categories[cat] = (categories[cat] || 0) - amt;
    }
  }

  return {
    totalExpense,
    totalIncome,
    netSpent: totalExpense - totalIncome,
    categories,
    itemCount: items.length,
    items,
  };
}

/**
 * Generates a clean Markdown report for a budget period and saves it to agent_reports/
 */
export function generateBudgetMarkdownReport(params: {
  periodType: 'weekly' | 'monthly';
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  breakdown: BudgetBreakdown;
}): string {
  const { periodType, periodLabel, startDate, endDate, breakdown } = params;
  const periodTitle = periodType === 'weekly' ? `Weekly Budget Report (${periodLabel})` : `Monthly Budget Report (${periodLabel})`;
  const startStr = startDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const catRows = Object.entries(breakdown.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const pct = breakdown.totalExpense > 0 ? ((amt / breakdown.totalExpense) * 100).toFixed(1) : '0.0';
      return `| **${cat}** | $${amt.toFixed(2)} | ${pct}% |`;
    })
    .join('\n');

  const itemRows = breakdown.items
    .map((item) => {
      const dateStr = new Date(item.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `| ${dateStr} | ${item.description} | ${item.category} | ${item.type.toUpperCase()} | $${Number(item.amount).toFixed(2)} |`;
    })
    .join('\n');

  const md = `# ${periodTitle}

* **Period:** ${startStr} to ${endStr}
* **Generated At:** ${new Date().toISOString()}
* **Total Spent:** $${breakdown.totalExpense.toFixed(2)}
* **Total Income:** $${breakdown.totalIncome.toFixed(2)}
* **Net Balance:** $${breakdown.netSpent.toFixed(2)}
* **Transaction Count:** ${breakdown.itemCount}

---

## Spending by Category

| Category | Amount | Percentage |
| :--- | :--- | :--- |
${catRows || '| *No expenses logged* | $0.00 | 0.0% |'}

---

## Itemized Transactions

| Date & Time | Description | Category | Type | Amount |
| :--- | :--- | :--- | :--- | :--- |
${itemRows || '| - | *No items recorded in this period* | - | - | $0.00 |'}

---

## Periodic Health Summary

* **Period Total:** $${breakdown.totalExpense.toFixed(2)} across ${breakdown.itemCount} transactions.
* **Top Expense Category:** ${Object.keys(breakdown.categories)[0] || 'None'} ($${(Object.values(breakdown.categories)[0] || 0).toFixed(2)})
* **Status:** Archived & Synthesized for historical review.
`;

  return md;
}

/**
 * Archives a budget period:
 * 1. Computes totals
 * 2. Generates Markdown report
 * 3. Writes report to agent_reports/
 * 4. Saves record in database budget_reports table
 */
export async function archiveBudgetPeriod(params: {
  periodType: 'weekly' | 'monthly';
  refDate?: Date;
  force?: boolean;
}): Promise<{ success: boolean; report?: BudgetReportRecord; message: string }> {
  const { periodType, refDate = new Date(), force = false } = params;
  const range = periodType === 'weekly' ? getWeekRange(refDate) : getMonthRange(refDate);

  // Check if a report for this period label already exists
  const existingReports = await getBudgetReports({ periodType });
  const existing = existingReports.find((r) => r.period_label === range.label);
  if (existing && !force) {
    return {
      success: true,
      report: existing,
      message: `Report for ${range.label} already exists.`,
    };
  }

  const items = await getBudgetItems({
    startDate: range.startIso,
    endDate: range.endIso,
  });

  const breakdown = calculateBudgetBreakdown(items);
  const markdown = generateBudgetMarkdownReport({
    periodType,
    periodLabel: range.label,
    startDate: range.startDate,
    endDate: range.endDate,
    breakdown,
  });

  // Save to agent_reports directory
  try {
    const reportDir = path.resolve(process.cwd(), 'agent_reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    const filename = `budget_${periodType}_${range.label}.md`;
    const filePath = path.join(reportDir, filename);
    fs.writeFileSync(filePath, markdown, 'utf-8');
  } catch (fsErr) {
    console.warn('[Budget Engine] Could not write report to agent_reports:', fsErr);
  }

  const createdReport = await createBudgetReport({
    period_type: periodType,
    period_label: range.label,
    start_date: range.startIso,
    end_date: range.endIso,
    total_spent: breakdown.totalExpense,
    breakdown_json: JSON.stringify(breakdown.categories),
    report_markdown: markdown,
  });

  return {
    success: true,
    report: createdReport,
    message: `Successfully generated and archived ${periodType} budget report for ${range.label}.`,
  };
}

/**
 * Checks and automatically archives previous completed weeks/months if they have items and haven't been archived yet.
 */
export async function autoArchiveCompletedPeriods(refDate = new Date()): Promise<void> {
  try {
    const prevWeek = getPreviousWeekRange(refDate);
    const existingWeekly = await getBudgetReports({ periodType: 'weekly' });
    const hasWeekly = existingWeekly.some((r) => r.period_label === prevWeek.label);
    if (!hasWeekly) {
      const items = await getBudgetItems({
        startDate: prevWeek.startIso,
        endDate: prevWeek.endIso,
      });
      if (items.length > 0) {
        await archiveBudgetPeriod({ periodType: 'weekly', refDate: prevWeek.startDate });
      }
    }

    const prevMonth = getPreviousMonthRange(refDate);
    const existingMonthly = await getBudgetReports({ periodType: 'monthly' });
    const hasMonthly = existingMonthly.some((r) => r.period_label === prevMonth.label);
    if (!hasMonthly) {
      const items = await getBudgetItems({
        startDate: prevMonth.startIso,
        endDate: prevMonth.endIso,
      });
      if (items.length > 0) {
        await archiveBudgetPeriod({ periodType: 'monthly', refDate: prevMonth.startDate });
      }
    }
  } catch (err) {
    console.warn('[Budget Engine] Auto-archive check failed:', err);
  }
}

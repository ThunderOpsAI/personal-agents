import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWeekRange,
  getMonthRange,
  calculateBudgetBreakdown,
  generateBudgetMarkdownReport,
  archiveBudgetPeriod,
} from '../lib/budget-engine';
import { createBudgetItem, getBudgetItems, getBudgetReports } from '../lib/db';
import { GET as getBudget, POST as postBudget } from '../app/api/v1/budget/route';
import { GET as getReports, POST as postReports } from '../app/api/v1/budget/reports/route';
import { POST as resetBudget } from '../app/api/v1/budget/reset/route';

describe('Budget Weekly & Monthly Periodic Reset & Reporting Engine', () => {
  beforeEach(async () => {
    // Ensure test environment runs cleanly with mock DB
  });

  describe('1. Date Boundary Engine', () => {
    it('calculates weekly Monday-to-Sunday boundaries and ISO label', () => {
      // 2026-08-24 is a Monday
      const refDate = new Date('2026-08-24T12:00:00Z');
      const week = getWeekRange(refDate);
      expect(week.label).toBe('2026-W35');
      expect(week.startDate.getDay()).toBe(1); // Monday
      expect(week.endDate.getDay()).toBe(0); // Sunday
    });

    it('calculates monthly boundaries and label', () => {
      const refDate = new Date('2026-08-24T12:00:00Z');
      const month = getMonthRange(refDate);
      expect(month.label).toBe('2026-08');
      expect(month.startDate.getDate()).toBe(1);
      expect(month.endDate.getDate()).toBe(31);
    });
  });

  describe('2. Calculations & Markdown Synthesis', () => {
    it('correctly aggregates category breakdowns, total expense, income, and net balance', () => {
      const items = [
        { id: '1', description: 'Hydrotherapy Physio', amount: 95.0, category: 'Medical', type: 'expense' as const, created_at: new Date().toISOString() },
        { id: '2', description: 'Groceries Fresh', amount: 120.5, category: 'Groceries', type: 'expense' as const, created_at: new Date().toISOString() },
        { id: '3', description: 'Pharmacy Script', amount: 35.0, category: 'Medical', type: 'expense' as const, created_at: new Date().toISOString() },
      ];

      const breakdown = calculateBudgetBreakdown(items);
      expect(breakdown.totalExpense).toBe(250.5);
      expect(breakdown.categories['Medical']).toBe(130.0);
      expect(breakdown.categories['Groceries']).toBe(120.5);
      expect(breakdown.itemCount).toBe(3);
    });

    it('generates clean markdown report with tables', () => {
      const items = [
        { id: '1', description: 'Hydrotherapy Physio', amount: 95.0, category: 'Medical', type: 'expense' as const, created_at: new Date().toISOString() },
      ];
      const breakdown = calculateBudgetBreakdown(items);
      const md = generateBudgetMarkdownReport({
        periodType: 'weekly',
        periodLabel: '2026-W35',
        startDate: new Date('2026-08-24T00:00:00Z'),
        endDate: new Date('2026-08-30T23:59:59Z'),
        breakdown,
      });

      expect(md).toContain('# Weekly Budget Report (2026-W35)');
      expect(md).toContain('Total Spent:');
      expect(md).toContain('| **Medical** | $95.00 |');
      expect(md).toContain('Hydrotherapy Physio');
    });
  });

  describe('3. Archiving and Reset Workflow', () => {
    it('archives weekly and monthly budget reports into database and reports folder', async () => {
      await createBudgetItem({
        description: 'Target Organic Groceries',
        amount: 85.5,
        category: 'Groceries',
        type: 'expense',
      });

      const weeklyResult = await archiveBudgetPeriod({
        periodType: 'weekly',
        refDate: new Date('2026-08-24T12:00:00Z'),
        force: true,
      });

      expect(weeklyResult.success).toBe(true);
      expect(weeklyResult.report?.period_type).toBe('weekly');
      expect(weeklyResult.report?.period_label).toBe('2026-W35');

      const monthlyResult = await archiveBudgetPeriod({
        periodType: 'monthly',
        refDate: new Date('2026-08-24T12:00:00Z'),
        force: true,
      });

      expect(monthlyResult.success).toBe(true);
      expect(monthlyResult.report?.period_type).toBe('monthly');
      expect(monthlyResult.report?.period_label).toBe('2026-08');

      const allReports = await getBudgetReports();
      expect(allReports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. API Endpoints for Periodic Resets', () => {
    it('POST /api/v1/budget adds an expense item and GET returns period summaries', async () => {
      const postReq = new Request('http://localhost/api/v1/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Specialist Consultation',
          amount: 180,
          category: 'Medical',
          type: 'expense',
        }),
      });
      const postRes = await postBudget(postReq);
      const postJson = await postRes.json();
      expect(postRes.status).toBe(201);
      expect(postJson.status).toBe('success');
      expect(postJson.item.description).toBe('Specialist Consultation');

      const getReq = new Request('http://localhost/api/v1/budget?period=weekly');
      const getRes = await getBudget(getReq);
      const getJson = await getRes.json();
      expect(getRes.status).toBe(200);
      expect(getJson.status).toBe('success');
      expect(getJson.weekly).toBeDefined();
      expect(getJson.weekly.total).toBeGreaterThanOrEqual(180);
    });

    it('POST /api/v1/budget/reset triggers report synthesis and archive', async () => {
      const resetReq = new Request('http://localhost/api/v1/budget/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_type: 'weekly',
          date: '2026-08-24',
        }),
      });

      const resetRes = await resetBudget(resetReq);
      const resetJson = await resetRes.json();
      expect(resetRes.status).toBe(200);
      expect(resetJson.status).toBe('success');
      expect(resetJson.result.report.period_label).toBe('2026-W35');
    });

    it('GET /api/v1/budget/reports retrieves archived reports', async () => {
      const reportsReq = new Request('http://localhost/api/v1/budget/reports');
      const reportsRes = await getReports(reportsReq);
      const reportsJson = await reportsRes.json();
      expect(reportsRes.status).toBe(200);
      expect(reportsJson.status).toBe('success');
      expect(Array.isArray(reportsJson.reports)).toBe(true);
      expect(reportsJson.reports.length).toBeGreaterThan(0);
    });
  });
});

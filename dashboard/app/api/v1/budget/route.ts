import { NextResponse } from "next/server";
import { getDbStatus, ensureTableExists } from "../../../../lib/db";
import { Pool } from "pg";
import Database from "better-sqlite3";

export async function GET() {
  await ensureTableExists();
  const status = getDbStatus();
  let summary: Record<string, number> = { Total: 0 };
  
  try {
    if (status.provider === 'neon') {
      const pool = new Pool({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const res = await pool.query('SELECT category, type, SUM(amount) as total FROM budget_items GROUP BY category, type');
      res.rows.forEach(row => {
        const amt = Number(row.total);
        if (row.type === 'expense') summary.Total += amt;
        else if (row.type === 'income') summary.Total -= amt;
        summary[row.category] = (summary[row.category] || 0) + amt;
      });
      await pool.end();
    } else {
      const dbPath = process.env.SQLITE_DB_PATH || 'agenda.db';
      const sqliteDb = new Database(dbPath);
      const stmt = sqliteDb.prepare('SELECT category, type, SUM(amount) as total FROM budget_items GROUP BY category, type');
      const rows = stmt.all() as any[];
      rows.forEach(row => {
        const amt = Number(row.total);
        if (row.type === 'expense') summary.Total += amt;
        else if (row.type === 'income') summary.Total -= amt;
        summary[row.category] = (summary[row.category] || 0) + amt;
      });
    }
    return NextResponse.json({ status: "success", summary });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "error", summary: { Total: 0 } });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { createBudgetItem } = await import("../../../../lib/db");
    const item = await createBudgetItem({
      description: body.description,
      amount: Number(body.amount),
      category: body.category || 'General',
      type: 'expense'
    });
    return NextResponse.json({ status: "success", item });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "error" });
  }
}

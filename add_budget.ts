import dotenv from "dotenv";
dotenv.config();

import { createBudgetItem, initDb } from "./dashboard/lib/db";
import { archiveBudgetPeriod } from "./dashboard/lib/budget-engine";

async function main() {
  initDb();

  const targetDate = "2026-09-27T12:00:00+10:00";

  const items = [
    { description: "Ladbrokes deposit", amount: 280, category: "Ladbrokes", type: "expense" as const, created_at: targetDate },
    { description: "Ladbrokes withdrawal", amount: 190, category: "Ladbrokes", type: "income" as const, created_at: targetDate },
    { description: "Ladbrokes withdrawal", amount: 100, category: "Ladbrokes", type: "income" as const, created_at: targetDate },
    { description: "Ladbrokes withdrawal", amount: 190, category: "Ladbrokes", type: "income" as const, created_at: targetDate },
    { description: "Ladbrokes withdrawal", amount: 80, category: "Ladbrokes", type: "income" as const, created_at: targetDate },
    { description: "Tab deposit", amount: 10, category: "Tab", type: "expense" as const, created_at: targetDate },
    { description: "Tab withdrawal", amount: 22, category: "Tab", type: "income" as const, created_at: targetDate },
    { description: "Sportsbet deposit", amount: 100, category: "Sportsbet", type: "expense" as const, created_at: targetDate },
    { description: "Sportsbet withdrawal", amount: 47.4, category: "Sportsbet", type: "income" as const, created_at: targetDate },
  ];

  for (const item of items) {
    const res = await createBudgetItem(item);
    console.log(`Added: [${item.type.toUpperCase()}] ${item.description} - $${item.amount} (${res.id})`);
  }

  // Archive week ending 27th September 2026 (2026-W39)
  const archiveResult = await archiveBudgetPeriod({
    periodType: "weekly",
    refDate: new Date(targetDate),
    force: true,
  });

  console.log(`\nArchived budget report: ${archiveResult.message}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error executing add_budget:", err);
  process.exit(1);
});

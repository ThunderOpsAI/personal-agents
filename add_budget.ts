import { createBudgetItem } from "./dashboard/lib/db";

async function main() {
  const items = [
    { description: "Ladbrokes deposit", amount: 280, category: "Ladbrokes", type: "expense" },
    { description: "Ladbrokes withdrawal", amount: 190, category: "Ladbrokes", type: "income" },
    { description: "Ladbrokes withdrawal", amount: 100, category: "Ladbrokes", type: "income" },
    { description: "Ladbrokes withdrawal", amount: 190, category: "Ladbrokes", type: "income" },
    { description: "Ladbrokes withdrawal", amount: 80, category: "Ladbrokes", type: "income" },
    { description: "Tab deposit", amount: 10, category: "Tab", type: "expense" },
    { description: "Tab withdrawal", amount: 22, category: "Tab", type: "income" },
    { description: "Sportsbet deposit", amount: 100, category: "Sportsbet", type: "expense" },
    { description: "Sportsbet withdrawal", amount: 47.4, category: "Sportsbet", type: "income" }
  ];

  for (const item of items) {
    const res = await createBudgetItem(item as any);
    console.log(`Added: ${item.description} - $${item.amount}`);
  }
}

main().catch(console.error);

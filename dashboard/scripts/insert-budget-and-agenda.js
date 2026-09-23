const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { Pool } = require('pg');
const crypto = require('crypto');

async function main() {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const now = new Date().toISOString();

  // 1. Budget Items to add
  const budgetItems = [
    { desc: 'Ladbrokes withdrawal', amount: 220, category: 'Ladbrokes', type: 'income' },
    { desc: 'Ladbrokes deposit', amount: 300, category: 'Ladbrokes', type: 'expense' },
    { desc: 'Ladbrokes withdrawal', amount: 120, category: 'Ladbrokes', type: 'income' },
    { desc: 'Ladbrokes withdrawal', amount: 50, category: 'Ladbrokes', type: 'income' },
    { desc: 'Chiro', amount: 65, category: 'Medical', type: 'expense' },
    { desc: 'Medical cannabis', amount: 214, category: 'Medical', type: 'expense' },
    { desc: 'Aldi - Groceries', amount: 94, category: 'Groceries', type: 'expense' },
    { desc: 'Sportsbet deposit', amount: 55, category: 'Sportsbet', type: 'expense' },
    { desc: 'Telstra', amount: 44, category: 'Household', type: 'expense' },
    { desc: 'Afterpay', amount: 250, category: 'Personal', type: 'expense' },
    { desc: 'Rent', amount: 200, category: 'Household', type: 'expense' },
    { desc: 'Bills', amount: 50, category: 'Household', type: 'expense' },
    { desc: 'Aldi - Groceries', amount: 32, category: 'Groceries', type: 'expense' },
  ];

  console.log(`Inserting ${budgetItems.length} budget items...`);
  for (const item of budgetItems) {
    const id = `budget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await pool.query(
      'INSERT INTO budget_items (id, description, amount, category, type, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, item.desc, item.amount, item.category, item.type, now]
    );
    console.log(`  Added budget item: [${item.type.toUpperCase()}] ${item.desc} - $${item.amount} (${item.category})`);
  }

  // 2. Agenda Items (Following 7 days: Thurs 24 Sep -> Wed 30 Sep 2026)
  const agendaItems = [
    // Thurs 24 Sept 2026
    {
      title: 'Post Ebay mousepads, amazon mousepads and message back about other mousepads',
      item_type: 'task',
      scheduled_time: '2026-09-24T09:30:00+10:00',
    },
    {
      title: 'Ladies Night project',
      item_type: 'task',
      scheduled_time: '2026-09-24T11:30:00+10:00',
    },
    {
      title: 'Betmate project',
      item_type: 'task',
      scheduled_time: '2026-09-24T14:00:00+10:00',
    },
    // Friday 25 Sept 2026
    {
      title: 'Check in cops',
      item_type: 'task',
      scheduled_time: '2026-09-25T10:00:00+10:00',
    },
    {
      title: 'Deakin login',
      item_type: 'task',
      scheduled_time: '2026-09-25T11:00:00+10:00',
    },
    // Weekend: Sat 26 Sept & Sun 27 Sept 2026
    {
      title: 'EU Project',
      item_type: 'task',
      scheduled_time: '2026-09-26T11:30:00+10:00',
    },
    {
      title: 'AI compliance project',
      item_type: 'task',
      scheduled_time: '2026-09-27T11:00:00+10:00',
    },
    // Monday 28 Sept 2026
    {
      title: 'Check in cops',
      item_type: 'task',
      scheduled_time: '2026-09-28T10:00:00+10:00',
    },
    // Tuesday 29 Sept 2026
    {
      title: 'Mental Health appointment with Trent',
      item_type: 'appointment',
      scheduled_time: '2026-09-29T10:00:00+10:00',
    },
    // Wednesday 30 Sept 2026
    {
      title: 'Check in cops',
      item_type: 'task',
      scheduled_time: '2026-09-30T10:00:00+10:00',
    },
  ];

  console.log(`\nInserting ${agendaItems.length} agenda items...`);
  for (const ag of agendaItems) {
    const id = `agenda_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const auditTrail = JSON.stringify([
      {
        timestamp: now,
        previous_status: null,
        new_status: 'pending',
        note: 'Added to agenda per user request',
      },
    ]);
    await pool.query(
      `INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8)`,
      [id, ag.item_type, ag.title, ag.scheduled_time, 'pending', auditTrail, now, now]
    );
    console.log(`  Added agenda item: [${ag.scheduled_time}] (${ag.item_type}) ${ag.title}`);

    // Also populate tasks table for task view consistency
    const taskId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO tasks (id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, isUrgent, created_at, updated_at)
       VALUES ($1, NULL, '@default', $2, $3, 'needsAction', $4, NULL, FALSE, FALSE, $5, $6)`,
      [taskId, ag.title, `${ag.item_type.toUpperCase()} scheduled for ${ag.scheduled_time}`, ag.scheduled_time, now, now]
    );
  }

  await pool.end();
  console.log('\nAll budget items and agenda items successfully inserted!');
}

main().catch((err) => {
  console.error('Error inserting records:', err);
  process.exit(1);
});

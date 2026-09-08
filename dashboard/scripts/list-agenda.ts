import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAgendaItems } from '../lib/db';

async function main() {
  const items = await getAgendaItems();
  const pending = items.filter(i => i.status === 'pending');
  
  // Also filter items from this week to see what else we had
  // current date: 2026-09-08
  
  console.log(JSON.stringify(pending, null, 2));
}

main().catch(console.error);

import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAgendaItems } from '../lib/db';

async function checkDb() {
  const items = await getAgendaItems();
  console.log("Found", items.length, "agenda items.");
  console.log(items.slice(0, 3));
}

checkDb().catch(console.error);

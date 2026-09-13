import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchLiveGmailMessages } from '../lib/google-auth';

async function main() {
  const result = await fetchLiveGmailMessages({
    query: 'Wangaratta Court OR duty solicitor',
    maxResults: 5
  });
  
  if (result.status === 'success' && result.messages) {
    result.messages.forEach(msg => {
      console.log(`--- Email ID: ${msg.id} ---`);
      console.log(`Date: ${msg.date}`);
      console.log(`From: ${msg.from}`);
      console.log(`To: ${msg.to}`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Snippet: ${msg.snippet}`);
    });
  } else {
    console.log(result);
  }
}

main().catch(console.error);

import { config } from 'dotenv';
config({ path: '.env.local' });
import { getGoogleAccessToken } from '../lib/google-auth';

async function main() {
  const auth = await getGoogleAccessToken();
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/1a045f4c6949f7e1', {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`
    }
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data.snippet, null, 2));

  function extractText(part: any): string {
    let result = '';
    if (part.body && part.body.data) {
      result += Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    }
    if (part.parts) {
      for (const p of part.parts) {
        result += extractText(p);
      }
    }
    return result;
  }

  console.log(extractText(data.payload));
}

main().catch(console.error);

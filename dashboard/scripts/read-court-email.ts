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
  
  function decodeBase64(str: string) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  }

  // extract body
  if (data.payload?.parts) {
    for (const part of data.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        console.log(decodeBase64(part.body.data));
      }
    }
  } else if (data.payload?.body?.data) {
    console.log(decodeBase64(data.payload.body.data));
  }
}

main().catch(console.error);

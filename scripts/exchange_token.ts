import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../dashboard/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function exchange() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/exchange_token.ts <CODE_OR_REDIRECT_URL>");
    process.exit(1);
  }

  let code = arg.trim();
  if (code.includes("code=")) {
    try {
      const url = new URL(code);
      code = url.searchParams.get("code") || code;
    } catch {
      const match = code.match(/code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (clientSecret) {
    clientSecret = clientSecret.trim().replace(/^GOCSPX-GOCSPX-/, "GOCSPX-");
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/auth/callback";

  console.log("Exchanging code for tokens with redirect_uri:", redirectUri);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Token exchange failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const newRefreshToken = data.refresh_token;
  if (!newRefreshToken) {
    console.warn("No refresh_token returned in response (consent prompt might have been skipped). Scope:", data.scope);
  } else {
    console.log("Successfully obtained new refresh token with Drive scope!");
    
    // Update .env.local and .env
    const envPaths = [
      path.resolve(__dirname, '../dashboard/.env.local'),
      path.resolve(__dirname, '../.env')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf8');
        if (content.includes("GOOGLE_REFRESH_TOKEN=")) {
          content = content.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${newRefreshToken}`);
        } else {
          content += `\nGOOGLE_REFRESH_TOKEN=${newRefreshToken}\n`;
        }
        fs.writeFileSync(envPath, content, 'utf8');
        console.log(`Updated ${path.basename(envPath)} with new refresh token.`);
      }
    }
  }

  // Verify Drive access with access_token
  const accessToken = data.access_token;
  if (accessToken) {
    const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=5", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("Drive Test Status:", driveRes.status, driveRes.statusText);
    const driveData = await driveRes.json();
    console.log("Drive files found:", driveData.files ? driveData.files.length : 0);
  }
}

exchange();

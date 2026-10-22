import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/v1/auth/callback";

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' }, { status: 500 });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token error:", tokenData); return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    // Usually we would save this refresh token to the database or .env
    // For now, let's just return it so they can copy it into .env manually
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2>OAuth Successful!</h2>
          <p>Please copy these values and paste them into your <code>.env</code> file:</p>
          <pre style="background: #eee; padding: 1rem; border-radius: 8px;">
GOOGLE_OAUTH_TOKEN=${tokenData.access_token}
GOOGLE_REFRESH_TOKEN=${tokenData.refresh_token}
          </pre>
          <p>Then restart your server one more time!</p>
        </body>
      </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

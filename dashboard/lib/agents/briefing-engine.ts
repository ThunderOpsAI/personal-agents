export async function generateBriefing(events: any[], type: "morning" | "evening"): Promise<string> {
  const eventsList = events.map(e => {
    let timeStr = e.start;
    try {
        const d = new Date(e.start);
        timeStr = d.toLocaleTimeString('en-AU', { 
            timeZone: 'Australia/Melbourne', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        }).toLowerCase();
    } catch(err) {}
    return `- ${timeStr}: ${e.title}`;
  }).join('\n');

  // Fetch real top tech news from Hacker News API
  let newsList = "";
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await res.json();
    const top3 = ids.slice(0, 3);
    const newsItems = [];
    for (const id of top3) {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await itemRes.json();
      newsItems.push(`- <a href="${item.url}" target="_blank" style="color: var(--neon-blue); text-decoration: underline;">${item.title}</a>`);
    }
    newsList = newsItems.join('\n');
  } catch (err) {
    newsList = "- <a href='https://news.ycombinator.com' target='_blank'>Check out today's top tech news on Hacker News</a>";
  }

  const systemPrompt = type === "morning"
    ? `You are Rumble, an executive AI assistant. Create an interactive, highly engaging morning briefing for James (who has ADHD, so format it to be extremely punchy, scannable, and dopamine-friendly).

Based on these agenda items:
${eventsList}

Here are the real top 3 news articles right now:
${newsList}

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <ul>, <li>, <strong>, <p>. Do not include \`\`\`html blocks, just return raw HTML.
- Include a high-energy, personalized welcome for James.
- Present the schedule clearly and visually using the provided local times (e.g. 9:00 am).
- Present the 3 news articles using the exact HTML anchor links provided above so James can click them.
- End with an interactive question asking James what he wants to tackle first, encouraging him to reply.`
    : `You are Rumble, an executive AI assistant. Create a highly engaging, dopamine-friendly evening wrap-up for James (who has ADHD - keep it extremely punchy, positive, and visually scannable).

Completed agenda items:
${eventsList}

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <ul>, <li>, <strong>, <p>. Do not include \`\`\`html blocks, just return raw HTML.
- Keep it encouraging, celebrate the wins, and ask him a reflective interactive question to close out the day in Rumble Chat.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      return "Error: GEMINI_API_KEY not found in environment. Please add it to your .env.local file.";
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  const fallbackModel = "gemini-3.6-flash";
  let lastErr = "";

  for (const model of [primaryModel, fallbackModel]) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: `Create my ${type} briefing in HTML.` }] }]
          }),
        });
        
        if (!res.ok) {
            throw new Error(`Gemini API returned ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        let htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Briefing generation failed (empty response).";
        // Strip markdown codeblock if the model hallucinates one
        htmlContent = htmlContent.replace(/```html/g, "").replace(/```/g, "");
        return htmlContent;
      } catch (err: any) {
        console.error(`[Briefing Engine] ${model} Attempt ${attempt} Error:`, err.message);
        lastErr = err.message;
        if (err.message.includes("503") || err.message.includes("502") || err.message.includes("429")) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
        }
        break;
      }
    }
  }

  return "<p style='color: red;'>Error generating briefing. Please check your AI provider configuration. Details: " + lastErr + "</p>";
}

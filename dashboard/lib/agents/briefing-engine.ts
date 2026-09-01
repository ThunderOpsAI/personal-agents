function cleanBlurb(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/<[^>]*>?/gm, "").trim();
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  if (text.length > 140) text = text.slice(0, 137) + "...";
  return text;
}

function extractThumbnail(item: any): string | null {
  if (item.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) {
    return item.thumbnail;
  }
  if (item.enclosure && item.enclosure.link && typeof item.enclosure.link === "string" && item.enclosure.link.startsWith("http")) {
    return item.enclosure.link;
  }
  return null;
}

interface NewsItem {
  title: string;
  url: string;
  source: string;
  time: string;
  thumbnail: string | null;
  blurb: string;
}

async function fetchLiveNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.abc.net.au%2Fnews%2Ffeed%2F51120%2Frss.xml", {
      next: { revalidate: 900 }
    });
    if (!res.ok) throw new Error("ABC RSS fetch failed");
    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("Invalid RSS response");

    return data.items.slice(0, 4).map((item: any) => {
      let timeStr = "recently";
      if (item.pubDate) {
        const diffMs = Date.now() - new Date(item.pubDate).getTime();
        const diffHours = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(Math.max(0, diffMs) / (1000 * 60));
          timeStr = `${diffMins} mins ago`;
        } else if (diffHours < 24) {
          timeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        }
      }
      return {
        title: item.title,
        url: item.link,
        source: "ABC News",
        time: timeStr,
        thumbnail: extractThumbnail(item),
        blurb: cleanBlurb(item.description || item.content || "")
      };
    });
  } catch (err) {
    console.error("Error fetching live ABC news for briefing:", err);
    return [
      {
        title: "ABC News - Live Australian News & Analysis",
        url: "https://www.abc.net.au/news",
        source: "ABC News",
        time: "today",
        thumbnail: null,
        blurb: "Catch up on the latest national, state, and breaking Australian headlines."
      }
    ];
  }
}

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

  // Fetch live Australian news reports
  const newsItems = await fetchLiveNews();
  
  // Format visual Google Top Stories style news cards HTML
  const newsCardsHtml = `
<div class="briefing-news-section" style="margin-top: 18px;">
  <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
    <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--neon-red, #ff3c3c);"></span>
      Top Stories (ABC News)
    </h4>
    <a href="https://www.abc.net.au/news" target="_blank" style="font-size: 0.8rem; color: var(--neon-blue, #00e5ff); text-decoration: none;">More news &rarr;</a>
  </div>
  <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 10px;">
    ${newsItems.map(item => `
      <a href="${item.url}" target="_blank" class="news-story-card" style="display: flex; gap: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; text-decoration: none; transition: background 0.2s, border-color 0.2s; align-items: center;">
        <div class="news-story-body" style="flex: 1; min-width: 0;">
          <div class="news-story-meta" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.75rem; color: var(--text-muted, #888);">
            <strong style="color: var(--neon-blue, #00e5ff); font-weight: 600;">${item.source}</strong>
            <span>&bull;</span>
            <span>${item.time}</span>
          </div>
          <div class="news-story-title" style="color: var(--text-primary, #fff); font-size: 0.88rem; font-weight: 600; line-height: 1.35; margin-bottom: 4px;">
            ${item.title}
          </div>
          ${item.blurb ? `<div class="news-story-blurb" style="color: var(--text-secondary, #aaa); font-size: 0.78rem; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.blurb}</div>` : ''}
        </div>
        ${item.thumbnail ? `
          <div class="news-story-thumb-wrap" style="flex-shrink: 0; width: 80px; height: 60px; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.3);">
            <img src="${item.thumbnail}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ''}
      </a>
    `).join('')}
  </div>
</div>
`;

  const systemPrompt = type === "morning"
    ? `You are Rumble, an executive AI assistant. Create an interactive, highly engaging morning briefing for James (who has ADHD, so format it to be extremely punchy, scannable, and dopamine-friendly).

Based on these agenda items:
${eventsList || "No specific calendar events scheduled for today."}

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <ul>, <li>, <strong>, <p>. Do not include \`\`\`html blocks, just return raw HTML.
- Include a high-energy, personalized welcome for James.
- Present the schedule clearly and visually using the provided local times (e.g. 9:00 am).
- Highlight key wins or high-priority targets for today.
- End with an interactive question asking James what he wants to tackle first, encouraging him to reply.`
    : `You are Rumble, an executive AI assistant. Create a highly engaging, dopamine-friendly evening wrap-up for James (who has ADHD - keep it extremely punchy, positive, and visually scannable).

Completed agenda items:
${eventsList || "All pending tasks reviewed."}

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <ul>, <li>, <strong>, <p>. Do not include \`\`\`html blocks, just return raw HTML.
- Keep it encouraging, celebrate the wins, and ask him a reflective interactive question to close out the day in Rumble Chat.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // If no API key, return a clean deterministic HTML fallback with the real news cards
    return `
      <h3>Good morning, James</h3>
      <p>Here is your daily operational briefing:</p>
      <ul>
        ${events.length > 0 ? events.map(e => `<li><strong>${e.start || "Today"}:</strong> ${e.title}</li>`).join('') : '<li>No calendar events currently scheduled for today.</li>'}
      </ul>
      ${newsCardsHtml}
      <p style="margin-top: 15px;"><strong>Ready to start?</strong> Choose an item from your agenda or open an encyclopedia to begin.</p>
    `;
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = "gemini-flash-latest";
  let aiHtml = "";

  for (const model of [primaryModel, fallbackModel]) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
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
        let content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        content = content.replace(/```html/g, "").replace(/```/g, "");
        if (content) {
          aiHtml = content;
          break;
        }
      } catch (err: any) {
        console.error(`[Briefing Engine] ${model} Attempt ${attempt} Error:`, err.message);
        if (err.message.includes("503") || err.message.includes("429")) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        break;
      }
    }
    if (aiHtml) break;
  }

  if (!aiHtml) {
    aiHtml = `
      <h3>Good morning, James</h3>
      <p>Here is your daily operational schedule:</p>
      <ul>
        ${events.length > 0 ? events.map(e => `<li><strong>${e.start || "Today"}:</strong> ${e.title}</li>`).join('') : '<li>No events scheduled.</li>'}
      </ul>
    `;
  }

  // Combine Gemini briefing narrative with real visual Google-style Top Stories cards
  return `${aiHtml}\n${newsCardsHtml}`;
}

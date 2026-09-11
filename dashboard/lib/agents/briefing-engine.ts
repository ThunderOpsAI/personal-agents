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
  const parseItems = (items: any[], source: string): NewsItem[] => {
    return (items || []).map((item: any) => {
      let timeStr = "recently";
      if (item.pubDate) {
        const diffMs = Date.now() - new Date(item.pubDate).getTime();
        const diffHours = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(Math.max(0, diffMs) / (1000 * 60));
          timeStr = `${diffMins} mins ago`;
        } else if (diffHours < 24) {
          timeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else {
          timeStr = new Date(item.pubDate).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
        }
      }
      return {
        title: item.title,
        url: item.link,
        source,
        time: timeStr,
        thumbnail: extractThumbnail(item),
        blurb: cleanBlurb(item.description || item.content || "")
      };
    });
  };

  try {
    const results: NewsItem[] = [];

    // 1. Fetch OKC Thunder news (Thunderous Intentions)
    try {
      const thunderRes = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://thunderousintentions.com/feed/"), {
        next: { revalidate: 900 }
      });
      if (thunderRes.ok) {
        const thunderData = await thunderRes.json();
        if (thunderData.status === "ok" && Array.isArray(thunderData.items)) {
          results.push(...parseItems(thunderData.items.slice(0, 3), "OKC Thunder"));
        }
      }
    } catch (err) {
      console.warn("Error fetching OKC Thunder RSS:", err);
    }

    // 2. Fetch general NBA news (ESPN NBA)
    try {
      const nbaRes = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.espn.com/espn/rss/nba/news"), {
        next: { revalidate: 900 }
      });
      if (nbaRes.ok) {
        const nbaData = await nbaRes.json();
        if (nbaData.status === "ok" && Array.isArray(nbaData.items)) {
          results.push(...parseItems(nbaData.items.slice(0, 2), "ESPN NBA"));
        }
      }
    } catch (err) {
      console.warn("Error fetching ESPN NBA RSS:", err);
    }

    if (results.length > 0) {
      return results.slice(0, 4);
    }

    // Fallback if network feeds fail
    return [
      {
        title: "OKC Thunder: Roster Depth & Championship Contention Outlook",
        url: "https://thunderousintentions.com",
        source: "OKC Thunder",
        time: "today",
        thumbnail: null,
        blurb: "Shai Gilgeous-Alexander and the Thunder core gear up for high-leverage Western Conference competition."
      },
      {
        title: "NBA League Roundup: Western Conference Contenders & Trade Analysis",
        url: "https://www.espn.com/nba",
        source: "ESPN NBA",
        time: "today",
        thumbnail: null,
        blurb: "Key offseason storylines, training camp developments, and rotational depth charts across the association."
      }
    ];
  } catch (err) {
    console.error("Error fetching live NBA and OKC Thunder news:", err);
    return [
      {
        title: "OKC Thunder: Shai Gilgeous-Alexander & Core Roster Trajectory",
        url: "https://thunderousintentions.com",
        source: "OKC Thunder",
        time: "today",
        thumbnail: null,
        blurb: "Thunder momentum, young star progression, and tactical offensive discipline."
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

  // Fetch live OKC Thunder & NBA news
  const newsItems = await fetchLiveNews();
  const thunderNewsContext = newsItems.length > 0
    ? newsItems.map(n => `- [${n.source}] ${n.title}: ${n.blurb}`).join('\n')
    : "- OKC Thunder training camp and roster depth outlook\n- Shai Gilgeous-Alexander MVP trajectory and offensive leadership\n- Chet Holmgren and Jalen Williams development\n- Western Conference title chase and NBA storylines";
  
  // Format visual Google Top Stories style news cards HTML
  const newsCardsHtml = `
<div class="briefing-news-section" style="margin-top: 18px;">
  <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
    <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #007ac1;"></span>
      ⚡ OKC Thunder & NBA Dispatch
    </h4>
    <a href="https://thunderousintentions.com" target="_blank" style="font-size: 0.8rem; color: var(--neon-blue, #00e5ff); text-decoration: none;">Thunder news &rarr;</a>
  </div>
  <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 10px;">
    ${newsItems.map(item => `
      <a href="${item.url}" target="_blank" class="news-story-card" style="display: flex; gap: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; text-decoration: none; transition: background 0.2s, border-color 0.2s; align-items: center;">
        <div class="news-story-body" style="flex: 1; min-width: 0;">
          <div class="news-story-meta" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.75rem; color: var(--text-muted, #888);">
            <strong style="color: ${item.source.includes("Thunder") ? "#007ac1" : "var(--neon-blue, #00e5ff)"}; font-weight: 600;">${item.source}</strong>
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

CRITICAL 50/50 STRUCTURE RULE:
The morning briefing MUST revolve roughly 50% around the NBA with a heavy, dedicated focus on Oklahoma City Thunder (OKC Thunder) news, and 50% on James's daily operations and agenda.

Section 1: 🏀 OKC Thunder & NBA Dispatch (~50% of content)
- Break down the latest Oklahoma City Thunder developments: Shai Gilgeous-Alexander (SGA), Jalen Williams, Chet Holmgren, Mark Daigneault's tactical discipline, roster dynamics, and broader NBA storylines.
- Draw directly from these live headlines:
${thunderNewsContext}
- Connect the Thunder's ruthless drive, selfless ball movement, and championship mindset into fuel for James's daily focus.

Section 2: 📋 Daily Agenda & Priorities (~50% of content)
- Present the schedule clearly and visually using the provided local times (e.g. 1:30 pm):
${eventsList || "No specific calendar events scheduled for today."}
- Highlight high-impact targets, urgent tasks, and operational wins to crush today.

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <h4>, <ul>, <li>, <strong>, <p>, <div>. Do not include \`\`\`html blocks, just return raw HTML.
- Dedicate roughly 50% of the briefing content to NBA & OKC Thunder breakdown/storylines, and 50% to James's daily agenda and action items.
- Include a high-energy, personalized welcome for James.
- End with an interactive question asking James what he wants to tackle first, encouraging him to reply in Rumble Chat.`
    : `You are Rumble, an executive AI assistant. Create a highly engaging, dopamine-friendly evening wrap-up for James (who has ADHD - keep it extremely punchy, positive, and visually scannable).

Completed agenda items:
${eventsList || "All pending tasks reviewed."}

Requirements:
- FORMAT AS SEMANTIC HTML. Do NOT use markdown. Use <h3>, <ul>, <li>, <strong>, <p>. Do not include \`\`\`html blocks, just return raw HTML.
- Keep it encouraging, celebrate the wins, and ask him a reflective interactive question to close out the day in Rumble Chat.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // If no API key, return a clean deterministic HTML fallback with 50/50 Thunder/NBA and Agenda
    return `
      <h3>Good morning, James</h3>
      <div style="margin-bottom: 16px;">
        <h4 style="color: #007ac1; margin-bottom: 6px;">🏀 OKC Thunder & NBA Report (50%)</h4>
        <p>The Oklahoma City Thunder enter the season as prime Western Conference contenders powered by Shai Gilgeous-Alexander's MVP-caliber offensive mastery, Chet Holmgren's two-way rim protection, and Jalen Williams' dynamic playmaking. Fast execution, selfless passing, and relentless defensive pressure set the tone.</p>
      </div>
      <div style="margin-bottom: 16px;">
        <h4 style="color: var(--neon-blue, #00e5ff); margin-bottom: 6px;">📋 Daily Agenda & Key Priorities (50%)</h4>
        <ul>
          ${events.length > 0 ? events.map(e => `<li><strong>${e.start || "Today"}:</strong> ${e.title}</li>`).join('') : '<li>No calendar events currently scheduled for today.</li>'}
        </ul>
      </div>
      ${newsCardsHtml}
      <p style="margin-top: 15px;"><strong>Ready to start?</strong> Choose an item from your agenda or open Rumble Chat to kick off the day.</p>
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
      <div style="margin-bottom: 16px;">
        <h4 style="color: #007ac1; margin-bottom: 6px;">🏀 OKC Thunder & NBA Report (50%)</h4>
        <p>Oklahoma City Thunder basketball brings high-octane pace and defensive intensity into today. Shai Gilgeous-Alexander, Chet Holmgren, and Jalen Williams lead a lethal young core ready for Western Conference supremacy.</p>
      </div>
      <div style="margin-bottom: 16px;">
        <h4 style="color: var(--neon-blue, #00e5ff); margin-bottom: 6px;">📋 Daily Agenda & Priorities (50%)</h4>
        <ul>
          ${events.length > 0 ? events.map(e => `<li><strong>${e.start || "Today"}:</strong> ${e.title}</li>`).join('') : '<li>No events scheduled.</li>'}
        </ul>
      </div>
    `;
  }

  // Combine Gemini briefing narrative with real visual Google-style Top Stories cards
  return `${aiHtml}\n${newsCardsHtml}`;
}

function cleanBlurb(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/<[^>]*>?/gm, "").trim();
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  if (text.length > 130) text = text.slice(0, 127) + "...";
  return text;
}

function extractThumbnail(item: any): string | null {
  if (item.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) {
    return item.thumbnail;
  }
  if (item.enclosure && item.enclosure.link && typeof item.enclosure.link === "string" && item.enclosure.link.startsWith("http")) {
    return item.enclosure.link;
  }
  const contentStr = item.content || item.description || "";
  const match = contentStr.match(/<img[^>]+src="([^">]+)"/);
  if (match && match[1] && match[1].startsWith("http")) {
    return match[1];
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

function getTimeoutSignal(ms: number): any {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return undefined;
  }
  try {
    if (typeof AbortSignal !== "undefined" && typeof (AbortSignal as any).timeout === "function") {
      return (AbortSignal as any).timeout(ms);
    }
  } catch {}
  return undefined;
}

function parseItems(items: any[], source: string): NewsItem[] {
  return (items || []).map((item: any) => {
    let timeStr = "recently";
    if (item.pubDate) {
      const diffMs = Date.now() - new Date(item.pubDate).getTime();
      const diffHours = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(Math.max(0, diffMs) / (1000 * 60));
        timeStr = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeStr = `${diffHours}h ago`;
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
}

async function fetchLiveThunderNbaNews(): Promise<NewsItem[]> {
  try {
    const results: NewsItem[] = [];

    // 1. OKC Thunder news (Thunderous Intentions) with 3.5s timeout
    try {
      const thunderRes = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://thunderousintentions.com/feed/"), {
        signal: getTimeoutSignal(3500),
        next: { revalidate: 900 }
      } as any);
      if (thunderRes.ok) {
        const thunderData = await thunderRes.json();
        if (thunderData.status === "ok" && Array.isArray(thunderData.items)) {
          results.push(...parseItems(thunderData.items.slice(0, 3), "OKC Thunder"));
        }
      }
    } catch (err) {
      console.warn("[Briefing] Thunder RSS timeout/error:", err);
    }

    // 2. ESPN NBA news with 3.5s timeout
    try {
      const nbaRes = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.espn.com/espn/rss/nba/news"), {
        signal: getTimeoutSignal(3500),
        next: { revalidate: 900 }
      } as any);
      if (nbaRes.ok) {
        const nbaData = await nbaRes.json();
        if (nbaData.status === "ok" && Array.isArray(nbaData.items)) {
          results.push(...parseItems(nbaData.items.slice(0, 2), "ESPN NBA"));
        }
      }
    } catch (err) {
      console.warn("[Briefing] NBA RSS timeout/error:", err);
    }

    if (results.length > 0) {
      return results.slice(0, 4);
    }

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
        blurb: "Key storylines, defensive rotations, and depth charts across the association."
      }
    ];
  } catch (err) {
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

async function fetchLiveTechNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://techcrunch.com/feed/"), {
      signal: getTimeoutSignal(3500),
      next: { revalidate: 900 }
    } as any);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok" && Array.isArray(data.items)) {
        const parsed = parseItems(data.items.slice(0, 3), "TechCrunch");
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (err) {
    console.warn("[Briefing] Tech news RSS timeout/error:", err);
  }

  return [
    {
      title: "Agentic AI & Serverless Edge Architecture Breakthroughs",
      url: "https://techcrunch.com",
      source: "TechCrunch",
      time: "today",
      thumbnail: null,
      blurb: "Advancements in autonomous agent frameworks, low-latency edge deployment, and localized AI models."
    },
    {
      title: "Developer Tooling & Next-Gen Systems Infrastructure Trends",
      url: "https://techcrunch.com",
      source: "Tech News",
      time: "today",
      thumbnail: null,
      blurb: "Rapid iteration cycles and resilient distributed state storage patterns for modern engineering teams."
    }
  ];
}

async function fetchLiveAusWorldNews(): Promise<NewsItem[]> {
  try {
    const results: NewsItem[] = [];

    // ABC National news
    try {
      const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.abc.net.au/news/feed/51120/rss.xml"), {
        signal: getTimeoutSignal(3500),
        next: { revalidate: 900 }
      } as any);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok" && Array.isArray(data.items)) {
          results.push(...parseItems(data.items.slice(0, 2), "ABC News"));
        }
      }
    } catch (err) {
      console.warn("[Briefing] ABC news RSS timeout/error:", err);
    }

    // ABC Victoria / Regional news
    try {
      const resVic = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.abc.net.au/news/feed/45910/rss.xml"), {
        signal: getTimeoutSignal(3500),
        next: { revalidate: 900 }
      } as any);
      if (resVic.ok) {
        const dataVic = await resVic.json();
        if (dataVic.status === "ok" && Array.isArray(dataVic.items)) {
          results.push(...parseItems(dataVic.items.slice(0, 2), "ABC Victoria"));
        }
      }
    } catch (err) {
      console.warn("[Briefing] ABC Victoria RSS timeout/error:", err);
    }

    if (results.length > 0) return results.slice(0, 4);
  } catch (err) {
    console.warn("[Briefing] Aus/World news error:", err);
  }

  return [
    {
      title: "Australian National Affairs & Regional Economic Outlook",
      url: "https://www.abc.net.au/news",
      source: "ABC News",
      time: "today",
      thumbnail: null,
      blurb: "Key national headlines, regional infrastructure, and economic updates across Australia."
    },
    {
      title: "Victorian State News & Regional Community Developments",
      url: "https://www.abc.net.au/news",
      source: "ABC Victoria",
      time: "today",
      thumbnail: null,
      blurb: "Essential regional updates, public infrastructure milestones, and local community news."
    }
  ];
}

function renderNewsCards(items: NewsItem[], accentColor: string = "var(--neon-blue)"): string {
  return items.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-story-card">
      <div class="news-story-body">
        <div class="news-story-meta">
          <strong style="color: ${accentColor};">${item.source}</strong>
          <span>&bull;</span>
          <span>${item.time}</span>
        </div>
        <div class="news-story-title">${item.title}</div>
        ${item.blurb ? `<div class="news-story-blurb">${item.blurb}</div>` : ''}
      </div>
      ${item.thumbnail ? `
        <div class="news-story-thumb-wrap">
          <img src="${item.thumbnail}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" />
        </div>
      ` : ''}
    </a>
  `).join('');
}

export async function generateBriefing(events: any[], type: "morning" | "evening"): Promise<string> {
  // Format clean scannable events list
  const formattedEvents = events.map(e => {
    let timeStr = e.start || e.scheduled_time || "Today";
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString('en-AU', { 
          timeZone: 'Australia/Melbourne', 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }).toLowerCase();
      }
    } catch(err) {}
    return { title: e.title || "Scheduled Item", time: timeStr };
  });

  const timelineHtml = formattedEvents.length > 0
    ? formattedEvents.map(ev => `
      <div class="briefing-agenda-item">
        <span class="briefing-agenda-time">${ev.time}</span>
        <span class="briefing-agenda-title">${ev.title}</span>
      </div>
    `).join('')
    : '<div style="font-size: 0.85rem; color: var(--text-secondary); padding: 8px;">No calendar events currently scheduled for today.</div>';

  const eventsSummaryText = formattedEvents.length > 0
    ? formattedEvents.map(e => `- ${e.time}: ${e.title}`).join('\n')
    : "No events scheduled.";

  if (type === "evening") {
    const eveningHero = `
<div class="briefing-hero-bar">
  <div>
    <div class="briefing-hero-title">Evening Wrap-up Briefing</div>
    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Daily execution review and achievements</div>
  </div>
  <div class="briefing-meta-chips">
    <span class="briefing-chip">${events.length} events reviewed</span>
  </div>
</div>
`;
    return `
<div class="briefing-container">
  ${eveningHero}
  <div class="briefing-card-panel">
    <h4>Daily Review &amp; Wins</h4>
    <ul class="briefing-bullet-list">
      <li><strong>Completed Priorities:</strong> Executed agenda items and reviewed scheduled commitments.</li>
      <li><strong>Recovery:</strong> Decompress and prepare restful recovery protocol for tomorrow.</li>
    </ul>
  </div>
  <div class="briefing-card-panel">
    <h4 style="color: var(--neon-purple);">Agenda Items Reviewed</h4>
    <div class="briefing-agenda-timeline">
      ${timelineHtml}
    </div>
  </div>
</div>
`;
  }

  // Morning briefing: Fetch all live feeds concurrently
  const [thunderNews, techNews, ausNews] = await Promise.all([
    fetchLiveThunderNbaNews(),
    fetchLiveTechNews(),
    fetchLiveAusWorldNews()
  ]);

  const thunderNewsContext = thunderNews.length > 0
    ? thunderNews.map(n => `- [${n.source}] ${n.title}: ${n.blurb}`).join('\n')
    : "- OKC Thunder training camp and roster depth outlook\n- Shai Gilgeous-Alexander MVP trajectory and offensive leadership\n- Western Conference title chase and NBA storylines";

  // Morning briefing: strict prompt to guarantee compact, ADHD-friendly, scannable output
  const systemPrompt = `You are Rumble, an executive AI assistant for James (who has ADHD).
Create a high-impact, ultra-punchy morning briefing that can be scanned in 15 seconds.

NON-NEGOTIABLE REQUIREMENTS:
1. WORD LIMIT: Under 140 words total. Zero fluff, zero preamble, zero essays.
2. NO DECORATIVE EMOJI: Do not use decorative emoji anywhere.
3. 50/50 STRUCTURE:
   - 50% Daily Focus & Agenda: Exactly 2-3 short bullet points highlighting scheduled appointments and the top operational priority.
   - 50% OKC Thunder & NBA Dispatch: Exactly 2-3 short tactical bullet points on Thunder pace, Shai Gilgeous-Alexander (SGA), and championship drive based on:
${thunderNewsContext}
4. RETURN RAW HTML WITH EXACTLY THESE TWO BLOCKS:
<div data-section="agenda">
  <ul class="briefing-bullet-list">
    <li><strong>Top Target:</strong> ...actionable focus...</li>
    <li><strong>Operations:</strong> ...key appointment/milestone...</li>
  </ul>
</div>

<div data-section="thunder">
  <ul class="briefing-bullet-list">
    <li><strong>Thunder Pace:</strong> ...SGA and ball movement...</li>
    <li><strong>Championship Mindset:</strong> ...tactical discipline applied to today...</li>
  </ul>
</div>`;

  let agendaContent = "";
  let thunderContent = "";

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallbackModel = "gemini-flash-latest";

    for (const model of [primaryModel, fallbackModel]) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: getTimeoutSignal(6000) as any,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{
              role: "user",
              parts: [{
                text: `Generate today's morning briefing for James.\n\nToday's Events:\n${eventsSummaryText}`
              }]
            }]
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          rawText = rawText.replace(/```html/g, "").replace(/```/g, "").trim();

          const agendaMatch = rawText.match(/<div[^>]*data-section=["']agenda["'][^>]*>([\s\S]*?)<\/div>/i);
          if (agendaMatch) agendaContent = agendaMatch[1].trim();

          const thunderMatch = rawText.match(/<div[^>]*data-section=["']thunder["'][^>]*>([\s\S]*?)<\/div>/i);
          if (thunderMatch) thunderContent = thunderMatch[1].trim();

          if (agendaContent && thunderContent) break;
        }
      } catch (err: any) {
        console.warn(`[Briefing Engine] ${model} error:`, err.message);
      }
    }
  }

  // Deterministic clean fallback if AI offline or parsing failed
  if (!agendaContent) {
    const firstEvent = formattedEvents[0];
    agendaContent = `
      <ul class="briefing-bullet-list">
        <li><strong>Primary Target:</strong> ${firstEvent ? `Lock in preparation for ${firstEvent.title} at ${firstEvent.time}.` : "Execute high-impact tasks and clear urgent priorities."}</li>
        <li><strong>Execution Tempo:</strong> Move through scheduled milestones sequentially without distraction.</li>
      </ul>
    `;
  }

  if (!thunderContent) {
    thunderContent = `
      <ul class="briefing-bullet-list">
        <li><strong>Thunder Pace:</strong> Shai Gilgeous-Alexander, Chet Holmgren, and Jalen Williams lead with selfless passing and defensive intensity.</li>
        <li><strong>Championship Mindset:</strong> Relentless drive, defensive discipline, and high-tempo execution fuel today's operations.</li>
      </ul>
    `;
  }

  // Render cards for each feed
  const thunderCardsHtml = renderNewsCards(thunderNews, "#38bdf8");
  const techCardsHtml = renderNewsCards(techNews, "#10b981");
  const ausCardsHtml = renderNewsCards(ausNews, "#f59e0b");

  // Single scrolling feed (Order: Schedule/Priorities -> OKC/NBA -> AI/Tech -> Aus/World)
  const heroHtml = `
<div class="briefing-hero-bar">
  <div>
    <div class="briefing-hero-title">Executive Morning Briefing</div>
    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
      Laser focus on daily execution, OKC Thunder &amp; NBA, AI/Tech, and world news
    </div>
  </div>
  <div class="briefing-meta-chips">
    <span class="briefing-chip">${events.length} events scheduled</span>
    <span class="briefing-chip purple">OKC Thunder &amp; NBA</span>
    <span class="briefing-chip" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: #10b981;">AI &amp; Tech</span>
    <span class="briefing-chip" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4); color: #f59e0b;">Aus &amp; World</span>
  </div>
</div>
`;

  return `
<div class="briefing-container">
  ${heroHtml}

  <!-- Section 1: Schedule & Priorities -->
  <div class="briefing-card-panel" style="margin-bottom: 14px;">
    <h4>Daily Priorities &amp; Focus</h4>
    ${agendaContent}
  </div>
  <div class="briefing-card-panel" style="margin-bottom: 14px;">
    <h4 style="color: var(--neon-purple);">Today's Schedule Timeline</h4>
    <div class="briefing-agenda-timeline">
      ${timelineHtml}
    </div>
  </div>

  <!-- Section 2: OKC Thunder & NBA Dispatch -->
  <div class="briefing-card-panel" style="margin-bottom: 14px;">
    <h4 class="thunder-header">OKC Thunder &amp; NBA Dispatch</h4>
    ${thunderContent}
  </div>
  <div class="briefing-news-section" style="margin-bottom: 14px; border-top: none; padding-top: 0;">
    <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h4 style="margin: 0; font-size: 0.92rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #007ac1;"></span>
        Live Thunder &amp; NBA Headlines
      </h4>
      <a href="https://thunderousintentions.com" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--neon-blue); text-decoration: none;">Thunder news &rarr;</a>
    </div>
    <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 8px;">
      ${thunderCardsHtml}
    </div>
  </div>

  <!-- Section 3: AI & Tech News -->
  <div class="briefing-news-section" style="margin-bottom: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 14px;">
    <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h4 style="margin: 0; font-size: 0.92rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
        AI &amp; Tech Intelligence
      </h4>
      <a href="https://techcrunch.com" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--neon-blue); text-decoration: none;">Tech news &rarr;</a>
    </div>
    <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 8px;">
      ${techCardsHtml}
    </div>
  </div>

  <!-- Section 4: Australian & World News -->
  <div class="briefing-news-section" style="margin-bottom: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 14px;">
    <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h4 style="margin: 0; font-size: 0.92rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span>
        Australian &amp; World News
      </h4>
      <a href="https://www.abc.net.au/news" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--neon-blue); text-decoration: none;">ABC News &rarr;</a>
    </div>
    <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 8px;">
      ${ausCardsHtml}
    </div>
  </div>
</div>
`;
}

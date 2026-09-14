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

async function fetchLiveNews(): Promise<NewsItem[]> {
  const parseItems = (items: any[], source: string): NewsItem[] => {
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
  };

  try {
    const results: NewsItem[] = [];

    // 1. Fetch OKC Thunder news (Thunderous Intentions) with 3.5s timeout
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

    // 2. Fetch general NBA news (ESPN NBA) with 3.5s timeout
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
    console.error("[Briefing] Error fetching live NBA and OKC Thunder news:", err);
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

  // Fetch live OKC Thunder & NBA news
  const newsItems = await fetchLiveNews();
  const thunderNewsContext = newsItems.length > 0
    ? newsItems.map(n => `- [${n.source}] ${n.title}: ${n.blurb}`).join('\n')
    : "- OKC Thunder training camp and roster depth outlook\n- Shai Gilgeous-Alexander MVP trajectory and offensive leadership\n- Western Conference title chase and NBA storylines";

  const newsCardsHtml = newsItems.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-story-card">
      <div class="news-story-body">
        <div class="news-story-meta">
          <strong style="color: ${item.source.includes("Thunder") ? "#38bdf8" : "var(--neon-blue)"};">${item.source}</strong>
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

  if (type === "evening") {
    const eveningHero = `
<div class="briefing-hero-bar">
  <div>
    <div class="briefing-hero-title">Evening Wrap-up Briefing</div>
    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Daily execution review and achievements</div>
  </div>
  <div class="briefing-meta-chips">
    <span class="briefing-chip">${events.length} Reviewed Items</span>
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

  // Build the complete tabbed UI component
  const heroHtml = `
<div class="briefing-hero-bar">
  <div>
    <div class="briefing-hero-title">Executive Morning Briefing</div>
    <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
      Laser focus on daily execution and OKC Thunder &amp; NBA dispatch
    </div>
  </div>
  <div class="briefing-meta-chips">
    <span class="briefing-chip">${events.length} Agenda Items</span>
    <span class="briefing-chip purple">OKC Thunder &amp; NBA</span>
  </div>
</div>
`;

  const navTabsHtml = `
<div class="briefing-tab-nav" role="tablist" aria-label="Briefing sections">
  <button class="briefing-nav-tab active" data-tab="tab-briefing-agenda" type="button" role="tab" aria-selected="true">
    Schedule &amp; Priorities (${events.length})
  </button>
  <button class="briefing-nav-tab" data-tab="tab-briefing-thunder" type="button" role="tab" aria-selected="false">
    OKC Thunder &amp; NBA
  </button>
  <button class="briefing-nav-tab" data-tab="tab-briefing-all" type="button" role="tab" aria-selected="false">
    Full View
  </button>
</div>
`;

  const agendaPaneHtml = `
<div class="briefing-tab-pane active" id="tab-briefing-agenda" role="tabpanel">
  <div class="briefing-card-panel">
    <h4>Daily Priorities &amp; Focus (50%)</h4>
    ${agendaContent}
  </div>
  <div class="briefing-card-panel">
    <h4 style="color: var(--neon-purple);">Today's Schedule Timeline</h4>
    <div class="briefing-agenda-timeline">
      ${timelineHtml}
    </div>
  </div>
</div>
`;

  const thunderPaneHtml = `
<div class="briefing-tab-pane" id="tab-briefing-thunder" role="tabpanel">
  <div class="briefing-card-panel">
    <h4 class="thunder-header">OKC Thunder &amp; NBA Dispatch (50%)</h4>
    ${thunderContent}
  </div>
  <div class="briefing-news-section" style="margin-top: 14px; border-top: none; padding-top: 0;">
    <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h4 style="margin: 0; font-size: 0.92rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #007ac1;"></span>
        Live Thunder &amp; NBA Headlines
      </h4>
      <a href="https://thunderousintentions.com" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--neon-blue); text-decoration: none;">Thunder news &rarr;</a>
    </div>
    <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 8px;">
      ${newsCardsHtml}
    </div>
  </div>
</div>
`;

  const allPaneHtml = `
<div class="briefing-tab-pane" id="tab-briefing-all" role="tabpanel">
  <div class="briefing-card-panel">
    <h4>Daily Priorities &amp; Focus (50%)</h4>
    ${agendaContent}
  </div>
  <div class="briefing-card-panel">
    <h4 style="color: var(--neon-purple);">Today's Schedule Timeline</h4>
    <div class="briefing-agenda-timeline">
      ${timelineHtml}
    </div>
  </div>
  <div class="briefing-card-panel">
    <h4 class="thunder-header">OKC Thunder &amp; NBA Dispatch (50%)</h4>
    ${thunderContent}
  </div>
  <div class="briefing-news-section" style="margin-top: 14px; border-top: none; padding-top: 0;">
    <div class="briefing-news-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <h4 style="margin: 0; font-size: 0.92rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #007ac1;"></span>
        Live Thunder &amp; NBA Headlines
      </h4>
      <a href="https://thunderousintentions.com" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--neon-blue); text-decoration: none;">Thunder news &rarr;</a>
    </div>
    <div class="briefing-news-grid" style="display: flex; flex-direction: column; gap: 8px;">
      ${newsCardsHtml}
    </div>
  </div>
</div>
`;

  return `
<div class="briefing-container">
  ${heroHtml}
  ${navTabsHtml}
  ${agendaPaneHtml}
  ${thunderPaneHtml}
  ${allPaneHtml}
</div>
`;
}

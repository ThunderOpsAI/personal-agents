import re

with open("dashboard/lib/agents/briefing-engine.ts", "r", encoding="utf-8") as f:
    text = f.read()

new_fetch_and_generate = '''
async function fetchRssFeedSafe(url: string, source: string, maxItems: number = 3): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url), {
      signal: getTimeoutSignal(3500),
      next: { revalidate: 900 }
    } as any);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status === "ok" && Array.isArray(data.items)) {
      return data.items.slice(0, maxItems).map((item: any) => {
        let timeStr = "today";
        if (item.pubDate) {
          const pubDate = new Date(item.pubDate);
          if (!isNaN(pubDate.getTime())) {
            const diffMs = Date.now() - pubDate.getTime();
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
    return [];
  } catch (e) {
    return [];
  }
}

export async function fetchLiveNews(): Promise<NewsItem[]> {
  const [thunder, nba] = await Promise.all([
    fetchRssFeedSafe("https://thunderousintentions.com/feed/", "OKC Thunder", 3),
    fetchRssFeedSafe("https://www.espn.com/espn/rss/nba/news", "ESPN NBA", 2)
  ]);
  const combined = [...thunder, ...nba];
  if (combined.length > 0) return combined.slice(0, 4);
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
}

function renderNewsCardsList(items: NewsItem[], defaultColor: string = "var(--neon-blue)"): string {
  if (!items || items.length === 0) {
    return '<div style="font-size: 0.82rem; color: var(--text-muted); padding: 8px;">No current headlines available.</div>';
  }
  return items.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-story-card">
      <div class="news-story-body">
        <div class="news-story-meta">
          <strong style="color: ${item.source.includes("Thunder") ? "#38bdf8" : defaultColor};">${item.source}</strong>
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
'''

# Find where export async function fetchLiveNews starts and replace up to end of generateBriefing
# Let's inspect the file structure

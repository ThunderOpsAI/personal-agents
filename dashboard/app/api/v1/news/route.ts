import { NextResponse } from "next/server";

function cleanBlurb(raw: string): string {
  if (!raw) return "";
  // Strip HTML tags if present
  let text = raw.replace(/<[^>]*>?/gm, "").trim();
  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  if (text.length > 160) {
    text = text.slice(0, 157) + "...";
  }
  return text;
}

function extractThumbnail(item: any): string | null {
  if (item.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) {
    return item.thumbnail;
  }
  if (item.enclosure && item.enclosure.link && typeof item.enclosure.link === "string" && item.enclosure.link.startsWith("http")) {
    return item.enclosure.link;
  }
  // Try to parse img src from content or description if present
  const contentStr = item.content || item.description || "";
  const match = contentStr.match(/<img[^>]+src="([^">]+)"/);
  if (match && match[1] && match[1].startsWith("http")) {
    return match[1];
  }
  return null;
}

async function fetchFeed(url: string, sourceName: string, maxItems: number = 6) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, {
      next: { revalidate: 900 } // Cache for 15 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceName}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok' || !Array.isArray(data.items)) {
       throw new Error(`Invalid response for ${sourceName}`);
    }
    
    return data.items.slice(0, maxItems).map((item: any) => {
      let timeStr = "";
      if (item.pubDate) {
        const pubDate = new Date(item.pubDate);
        if (!isNaN(pubDate.getTime())) {
          const diffMs = Date.now() - pubDate.getTime();
          const diffHours = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60));
          if (diffHours === 0) {
            const diffMins = Math.floor(Math.max(0, diffMs) / (1000 * 60));
            timeStr = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
          } else if (diffHours < 24) {
            timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          } else {
            const diffDays = Math.floor(diffHours / 24);
            timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
          }
        }
      }

      return {
        title: item.title,
        url: item.link,
        source: sourceName,
        time: timeStr || "recently",
        thumbnail: extractThumbnail(item),
        blurb: cleanBlurb(item.description || item.content || "")
      };
    });
  } catch (error) {
    console.error(`Error fetching ${sourceName} feed:`, error);
    return [];
  }
}

export async function GET() {
  const [abc_top_stories, abc_vic, tech_headlines] = await Promise.all([
    fetchFeed("https://www.abc.net.au/news/feed/51120/rss.xml", "ABC News", 6),
    fetchFeed("https://www.abc.net.au/news/feed/45910/rss.xml", "ABC Victoria", 4),
    fetchFeed("https://techcrunch.com/feed/", "TechCrunch", 4)
  ]);

  // Combine top Australian stories and tech
  const stories = [...abc_top_stories, ...abc_vic];
  // Deduplicate by title/url
  const seen = new Set<string>();
  const top_stories = stories.filter((item) => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  return NextResponse.json({
    top_stories: top_stories.slice(0, 8),
    tech_headlines,
    aus_headlines: abc_top_stories,
    world_headlines: abc_vic
  });
}

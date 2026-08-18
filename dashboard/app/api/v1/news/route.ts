import { NextResponse } from "next/server";

async function fetchFeed(url: string, sourceName: string) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceName}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok' || !Array.isArray(data.items)) {
       throw new Error(`Invalid response for ${sourceName}`);
    }
    
    return data.items.slice(0, 5).map((item: any) => {
      let timeStr = "";
      if (item.pubDate) {
        const pubDate = new Date(item.pubDate);
        if (!isNaN(pubDate.getTime())) {
          const diffMs = Date.now() - pubDate.getTime();
          const diffHours = Math.floor(Math.max(0, diffMs) / (1000 * 60 * 60));
          if (diffHours === 0) {
            const diffMins = Math.floor(Math.max(0, diffMs) / (1000 * 60));
            timeStr = `${diffMins} mins ago`;
          } else {
            timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          }
        }
      }

      return {
        title: item.title,
        url: item.link,
        source: sourceName,
        time: timeStr || "recently"
      };
    });
  } catch (error) {
    console.error(`Error fetching ${sourceName} feed:`, error);
    return [
      {
        title: "Feed temporarily unavailable",
        url: "#",
        source: sourceName,
        time: ""
      }
    ];
  }
}

export async function GET() {
  const [aus_headlines, world_headlines, tech_ai_headlines] = await Promise.all([
    fetchFeed("https://www.abc.net.au/news/feed/51120/rss.xml", "ABC News"),
    fetchFeed("https://feeds.bbci.co.uk/news/world/rss.xml", "BBC World"),
    fetchFeed("https://techcrunch.com/feed/", "TechCrunch")
  ]);

  return NextResponse.json({
    aus_headlines,
    world_headlines,
    tech_ai_headlines
  });
}

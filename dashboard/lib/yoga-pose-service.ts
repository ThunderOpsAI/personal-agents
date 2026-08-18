import fs from 'fs';
import path from 'path';

export interface YogaPose {
  id: string;
  english_name: string;
  sanskrit_name: string;
  procedure: string[];
  targets: string[];
  benefits: string[];
  contraindications: string[];
  image_url: string;
  video_url: string | null;
  duration_seconds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source_tier: 'primary' | 'secondary' | 'local';
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: YogaPose[];
  timestamp: number;
}

let posesCache: CacheEntry | null = null;

const fetchWithTimeout = async (url: string, timeoutMs: number = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const parseDuration = (timeStr: string | undefined): number => {
  if (!timeStr) return 60;
  const time = timeStr.toLowerCase();
  if (time.includes('min')) {
    const mins = parseInt(time) || 1;
    return mins * 60;
  }
  if (time.includes('s')) {
    const secs = parseInt(time) || 60;
    return secs;
  }
  return parseInt(time) || 60;
};

const fetchTier1 = async (): Promise<YogaPose[]> => {
  const url = 'https://raw.githubusercontent.com/LunaticPrakash/yoga-api/main/yoga-api.json';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Tier 1 HTTP Error: ${res.status}`);
  const data = await res.json();
  
  return data.map((item: any) => ({
    id: String(item.id),
    english_name: item.english_name || 'Unknown Pose',
    sanskrit_name: item.sanskrit_name || 'Unknown',
    procedure: Array.isArray(item.procedure) ? item.procedure : [],
    targets: Array.isArray(item.targets) ? item.targets : [],
    benefits: Array.isArray(item.benefits) ? item.benefits : [],
    contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
    image_url: item.image_url || '',
    video_url: (item.yt_videos && item.yt_videos.length > 0) ? item.yt_videos[0] : null,
    duration_seconds: 60,
    difficulty: 'beginner',
    source_tier: 'primary'
  }));
};

const fetchTier2 = async (): Promise<YogaPose[]> => {
  const url = 'https://priyangsubanerjee.github.io/yogism/yogism-api.json';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Tier 2 HTTP Error: ${res.status}`);
  const data = await res.json();
  
  const uniquePoses = new Map<string, YogaPose>();
  
  for (const courseKey of Object.keys(data)) {
    const course = data[courseKey];
    if (course && Array.isArray(course.scheduled)) {
      course.scheduled.forEach((item: any, idx: number) => {
        const englishName = item.english_name || 'Unknown Pose';
        if (!uniquePoses.has(englishName)) {
          const targets = item.target ? item.target.split(',').map((t: string) => t.trim()) : [];
          const benefits = item.benefits ? item.benefits.split('.').filter((b: string) => b.trim().length > 0).map((b: string) => b.trim()) : [];
          
          let difficultyStr = item.category ? item.category.toLowerCase() : 'beginner';
          if (!['beginner', 'intermediate', 'advanced'].includes(difficultyStr)) {
            difficultyStr = 'beginner';
          }

          uniquePoses.set(englishName, {
            id: `t2-${courseKey}-${idx}`,
            english_name: englishName,
            sanskrit_name: item.sanskrit_name || 'Unknown',
            procedure: Array.isArray(item.steps) ? item.steps : (item.description ? [item.description] : []),
            targets,
            benefits,
            contraindications: [],
            image_url: item.image || '',
            video_url: null,
            duration_seconds: parseDuration(item.time),
            difficulty: difficultyStr as 'beginner' | 'intermediate' | 'advanced',
            source_tier: 'secondary'
          });
        }
      });
    }
  }
  
  return Array.from(uniquePoses.values());
};

const fetchTier3 = async (): Promise<YogaPose[]> => {
  const filePath = path.join(process.cwd(), 'data', 'yoga-poses-local.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  return data.map((item: any) => ({
    id: String(item.id),
    english_name: item.english_name || 'Unknown Pose',
    sanskrit_name: item.sanskrit_name || 'Unknown',
    procedure: Array.isArray(item.procedure) ? item.procedure : [],
    targets: Array.isArray(item.targets) ? item.targets : [],
    benefits: Array.isArray(item.benefits) ? item.benefits : [],
    contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
    image_url: item.image_url || `/assets/yoga/${item.id}.jpg`,
    video_url: item.video_url || null,
    duration_seconds: typeof item.duration_seconds === 'number' ? item.duration_seconds : 60,
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(item.difficulty) ? item.difficulty : 'beginner',
    source_tier: 'local'
  }));
};

export async function fetchAllPoses(): Promise<YogaPose[]> {
  const now = Date.now();
  if (posesCache && (now - posesCache.timestamp) < CACHE_DURATION_MS) {
    return posesCache.data;
  }

  let poses: YogaPose[];
  
  try {
    poses = await fetchTier1();
    console.log('[YogaPoseService] Using tier: primary');
  } catch (error) {
    console.error('[YogaPoseService] Tier 1 failed:', error);
    try {
      poses = await fetchTier2();
      console.log('[YogaPoseService] Using tier: secondary');
    } catch (error2) {
      console.error('[YogaPoseService] Tier 2 failed:', error2);
      try {
        poses = await fetchTier3();
        console.log('[YogaPoseService] Using tier: local');
      } catch (error3) {
        console.error('[YogaPoseService] Tier 3 failed:', error3);
        poses = [];
      }
    }
  }

  if (poses.length > 0) {
    posesCache = {
      data: poses,
      timestamp: now
    };
  }

  return poses;
}

export async function getPosesByTargets(targets: string[]): Promise<YogaPose[]> {
  const poses = await fetchAllPoses();
  const searchTargets = targets.map(t => t.toLowerCase());
  
  return poses.filter(pose => 
    pose.targets.some(t => 
      searchTargets.some(st => t.toLowerCase().includes(st))
    )
  );
}

export async function getFilteredPoses(options: { 
  excludeContraindications?: string[], 
  targets?: string[], 
  difficulty?: string 
}): Promise<YogaPose[]> {
  let poses = await fetchAllPoses();

  if (options.excludeContraindications && options.excludeContraindications.length > 0) {
    const excludes = options.excludeContraindications.map(e => e.toLowerCase());
    poses = poses.filter(pose => {
      const hasContraindication = pose.contraindications.some(c => 
        excludes.some(e => c.toLowerCase().includes(e))
      );
      return !hasContraindication;
    });
  }

  if (options.targets && options.targets.length > 0) {
    const searchTargets = options.targets.map(t => t.toLowerCase());
    poses = poses.filter(pose => 
      pose.targets.some(t => 
        searchTargets.some(st => t.toLowerCase().includes(st))
      )
    );
  }

  if (options.difficulty) {
    poses = poses.filter(pose => pose.difficulty === options.difficulty?.toLowerCase());
  }

  return poses;
}

export async function getPoseById(id: string): Promise<YogaPose | null> {
  const poses = await fetchAllPoses();
  return poses.find(pose => pose.id === id) || null;
}

import { defineTool } from "./defineTool";

export interface NormalizedYogaPose {
  id: string | number;
  english_name: string;
  sanskrit_name: string;
  description: string;
  benefits: string;
  target_muscles: string[];
  contraindications: string[];
  procedure: string[];
  image_url: string;
  category?: string;
  source_tier: "tier1_primary_yoga_api" | "tier2_fallback_yogism" | "tier3_failsafe_kaggle";
}

export interface FetchYogaRoutineParams {
  category?: string;
  targetArea?: string;
  level?: "beginner" | "intermediate" | "expert" | "all";
  limit?: number;
  contraindications?: string[];
}

export interface FetchYogaRoutineResult {
  success: boolean;
  tierUsed: "tier1_primary_yoga_api" | "tier2_fallback_yogism" | "tier3_failsafe_kaggle";
  source: string;
  count: number;
  auditLogs: string[];
  poses: NormalizedYogaPose[];
  error?: string;
}

// Tier 3: Local Kaggle Dataset Reference mapping to static self-hosted images in public/assets/yoga
const KAGGLE_LOCAL_YOGA_DATASET: NormalizedYogaPose[] = [
  {
    id: "kaggle_cat_cow",
    english_name: "Cat-Cow Flow",
    sanskrit_name: "Marjaryasana-Bitilasana",
    description: "Gentle spinal flexion and extension on all fours to warm up the back and mobilize the spine.",
    benefits: "Improves spinal flexibility, massages abdominal organs, and relieves mild lumbar tension.",
    target_muscles: ["lumbar spine", "thoracic spine", "core", "neck"],
    contraindications: ["acute cervical injury", "severe wrist pain"],
    procedure: [
      "Start on hands and knees with wrists under shoulders and knees under hips.",
      "Inhale into Cow Pose: arch the back, drop belly toward mat, and gaze upward.",
      "Exhale into Cat Pose: round spine toward ceiling, tuck pelvis, and draw chin to chest.",
      "Repeat rhythmically with diaphragmatic breath for 5-10 cycles."
    ],
    image_url: "/assets/yoga/cat_cow_pose.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_childs_pose",
    english_name: "Child's Pose",
    sanskrit_name: "Balasana",
    description: "Restorative resting pose decompressing the lower back, hips, and ankles.",
    benefits: "Releases lower back tension, gently stretches thighs and hips, and activates parasympathetic calming.",
    target_muscles: ["lumbar", "hips", "glutes", "ankles", "latissimus dorsi"],
    contraindications: ["acute knee injury", "diarrhea"],
    procedure: [
      "Kneel on the floor, touch big toes together, and sit back onto heels.",
      "Separate knees hip-width or mat-width apart.",
      "Exhale and fold forward, draping torso between thighs.",
      "Extend arms forward on the mat with palms flat and rest forehead on the floor."
    ],
    image_url: "/assets/yoga/childs_pose.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_cobra",
    english_name: "Cobra Pose",
    sanskrit_name: "Bhujangasana",
    description: "Gentle prone backbend that strengthens the spine and opens the chest and shoulders.",
    benefits: "Strengthens the vertebral column, expands the chest, and counteracts seated slouching.",
    target_muscles: ["erector spinae", "gluteals", "pectorals", "deltoids"],
    contraindications: ["acute disc herniation", "pregnancy", "carpal tunnel"],
    procedure: [
      "Lie prone on the mat with legs extended and tops of feet flat.",
      "Place palms under shoulders with elbows hugged close to torso.",
      "Inhale and gently press into hands to lift chest, keeping hips and pelvis grounded.",
      "Keep shoulders relaxed away from ears and maintain gentle cervical alignment."
    ],
    image_url: "/assets/yoga/cobra_pose.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_downward_dog",
    english_name: "Downward-Facing Dog",
    sanskrit_name: "Adho Mukha Svanasana",
    description: "Inversion pose that lengthens the entire posterior chain and decompresses the spine.",
    benefits: "Stretches hamstrings, calves, and shoulders while building upper body stability.",
    target_muscles: ["hamstrings", "calves", "shoulders", "spine", "wrists"],
    contraindications: ["severe carpal tunnel syndrome", "uncontrolled high blood pressure"],
    procedure: [
      "From all fours, tuck toes and lift knees off the mat.",
      "Press hips upward and backward to form an inverted V shape.",
      "Engage quadriceps and press heels toward the floor while lengthening the spine.",
      "Keep head between upper arms without collapsing into the neck."
    ],
    image_url: "/assets/yoga/downward_dog.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_seated_twist",
    english_name: "Half Lord of the Fishes Pose",
    sanskrit_name: "Ardha Matsyendrasana",
    description: "Seated spinal twist to improve rotational mobility and relieve stiffness in the middle and lower back.",
    benefits: "Enhances thoracic spine mobility, stretches shoulders and hips, and aids digestive motility.",
    target_muscles: ["obliques", "erector spinae", "rhomboids", "gluteus medius"],
    contraindications: ["severe spinal disc injury", "acute sacroiliac instability"],
    procedure: [
      "Sit upright with legs extended straight in front.",
      "Bend right knee and place right foot outside left thigh.",
      "Inhale to lengthen spine upward; exhale and rotate torso to the right.",
      "Hook left elbow outside right knee and gaze gently over right shoulder."
    ],
    image_url: "/assets/yoga/seated_twist.jpg",
    category: "Intermediate",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_mountain_pose",
    english_name: "Mountain Pose",
    sanskrit_name: "Tadasana",
    description: "Foundational standing posture for postural awareness, axial elongation, and grounded balance.",
    benefits: "Corrects pelvic alignment, strengthens thighs and ankles, and promotes steady somatic grounding.",
    target_muscles: ["quadriceps", "core stabilizers", "tibialis anterior", "paraspinals"],
    contraindications: ["acute dizziness", "lightheadedness"],
    procedure: [
      "Stand with big toes touching or feet hip-width apart.",
      "Distribute weight evenly across all four corners of both feet.",
      "Engage thigh muscles, drop tailbone gently, and lift through crown of head.",
      "Broaden collarbones and relax arms beside torso with palms facing forward."
    ],
    image_url: "/assets/yoga/mountain_pose.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  },
  {
    id: "kaggle_bridge_pose",
    english_name: "Bridge Pose",
    sanskrit_name: "Setu Bandha Sarvangasana",
    description: "Supine gentle backbend activating posterior chain glutes and opening anterior hip flexors.",
    benefits: "Rebuilds gluteal strength, expands the chest, and decompresses tight psoas muscles.",
    target_muscles: ["gluteus maximus", "hamstrings", "psoas", "thoracic extensors"],
    contraindications: ["acute neck injury"],
    procedure: [
      "Lie on back with knees bent and feet flat on floor, hip-width apart.",
      "Place arms along sides with palms pressing down.",
      "Exhale and press into feet to lift hips toward ceiling.",
      "Interlace fingers beneath pelvis or keep palms grounded, keeping thighs parallel."
    ],
    image_url: "/assets/yoga/bridge_pose.jpg",
    category: "Beginner",
    source_tier: "tier3_failsafe_kaggle"
  }
];

export async function fetchFromTier1(params?: FetchYogaRoutineParams): Promise<NormalizedYogaPose[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  
  try {
    const url = "https://yoga-api-nzy4.onrender.com/v1/poses";
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "User-Agent": "RumbleOS/1.0" },
      signal: controller.signal
    });
    
    if (!res.ok) {
      throw new Error(`Tier 1 HTTP Error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    const rawList: any[] = Array.isArray(data) ? data : (data.poses || []);
    
    if (!rawList.length) {
      throw new Error("Tier 1 returned an empty pose list.");
    }
    
    return rawList.map((item: any, idx: number): NormalizedYogaPose => ({
      id: item.id || `tier1_${idx + 1}`,
      english_name: item.english_name || item.name || "Yoga Pose",
      sanskrit_name: item.sanskrit_name || item.sanskrit_name_adapted || "",
      description: item.pose_description || item.description || "",
      benefits: item.pose_benefits || item.benefits || "",
      target_muscles: Array.isArray(item.target_muscles) ? item.target_muscles : (item.target_muscles ? [String(item.target_muscles)] : []),
      contraindications: Array.isArray(item.contraindications) ? item.contraindications : (item.contraindications ? [String(item.contraindications)] : []),
      procedure: Array.isArray(item.procedure) ? item.procedure : (item.procedure ? [String(item.procedure)] : []),
      image_url: item.url_png || item.url_svg || item.url_svg_alt || item.image_url || "",
      category: item.category || "General",
      source_tier: "tier1_primary_yoga_api"
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchFromTier2(params?: FetchYogaRoutineParams): Promise<NormalizedYogaPose[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  
  try {
    const url = "https://priyangsubanerjee.github.io/yogism/yogism-api.json";
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "User-Agent": "RumbleOS/1.0" },
      signal: controller.signal
    });
    
    if (!res.ok) {
      throw new Error(`Tier 2 HTTP Error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    const rawList: any[] = [];
    
    if (Array.isArray(data)) {
      rawList.push(...data);
    } else if (typeof data === 'object' && data !== null) {
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          rawList.push(...data[key]);
        }
      }
    }
    
    if (!rawList.length) {
      throw new Error("Tier 2 returned an empty pose list.");
    }
    
    return rawList.map((item: any, idx: number): NormalizedYogaPose => {
      const stepsArr = typeof item.steps === 'string'
        ? item.steps.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(item.steps) ? item.steps : []);
        
      return {
        id: item.id || `tier2_${idx + 1}`,
        english_name: item.english_name || item.name || "Yoga Pose",
        sanskrit_name: item.sanskrit_name || "",
        description: item.description || "",
        benefits: item.benefits || "",
        target_muscles: item.target ? [item.target] : (item.target_muscles || []),
        contraindications: item.contraindications ? (Array.isArray(item.contraindications) ? item.contraindications : [item.contraindications]) : [],
        procedure: stepsArr,
        image_url: item.image || item.image_url || "",
        category: item.category || "General",
        source_tier: "tier2_fallback_yogism"
      };
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fetchFromTier3(params?: FetchYogaRoutineParams): NormalizedYogaPose[] {
  return KAGGLE_LOCAL_YOGA_DATASET.map(pose => ({ ...pose }));
}

function filterAndRankPoses(poses: NormalizedYogaPose[], params?: FetchYogaRoutineParams): NormalizedYogaPose[] {
  let result = poses;
  
  if (params?.contraindications && params.contraindications.length > 0) {
    const userAvoidAreas = params.contraindications.map(c => c.toLowerCase().trim());
    result = result.filter(pose => {
      const contraStr = pose.contraindications.join(" ").toLowerCase();
      const hasConflict = userAvoidAreas.some(area => contraStr.includes(area));
      return !hasConflict;
    });
  }
  
  if (params?.targetArea) {
    const target = params.targetArea.toLowerCase().trim();
    const matching = result.filter(pose => {
      const allText = `${pose.english_name} ${pose.sanskrit_name} ${pose.description} ${pose.benefits} ${pose.target_muscles.join(" ")}`.toLowerCase();
      return allText.includes(target);
    });
    if (matching.length > 0) {
      result = matching;
    }
  }
  
  if (params?.category && params.category !== "all") {
    const cat = params.category.toLowerCase().trim();
    const matching = result.filter(pose => (pose.category || "").toLowerCase().includes(cat));
    if (matching.length > 0) {
      result = matching;
    }
  }
  
  const limit = params?.limit ?? 3;
  return result.slice(0, limit);
}

export const fetchYogaRoutine = defineTool({
  name: "fetchYogaRoutine",
  description: "Fetches live yoga poses, target muscle groups, contraindications, and image URLs using a 3-tier resilient fallback waterfall (Tier 1: yoga-api, Tier 2: yogism, Tier 3: Kaggle local dataset).",
  execute: async (params?: FetchYogaRoutineParams): Promise<FetchYogaRoutineResult> => {
    const auditLogs: string[] = [];
    const timestamp = () => new Date().toISOString();
    
    // Tier 1: Primary Source (LunaticPrakash yoga-api)
    auditLogs.push(`[${timestamp()}] [Tier 1] Attempting fetch from primary source: LunaticPrakash yoga-api...`);
    try {
      const tier1Poses = await fetchFromTier1(params);
      const filtered = filterAndRankPoses(tier1Poses, params);
      auditLogs.push(`[${timestamp()}] [Tier 1 SUCCESS] Retrieved ${tier1Poses.length} poses from primary yoga-api; selected ${filtered.length}.`);
      
      return {
        success: true,
        tierUsed: "tier1_primary_yoga_api",
        source: "https://github.com/LunaticPrakash/yoga-api (yoga-api-nzy4.onrender.com)",
        count: filtered.length,
        auditLogs,
        poses: filtered
      };
    } catch (tier1Error: any) {
      auditLogs.push(`[${timestamp()}] [Tier 1 FAILED] ${tier1Error.message}. Triggering Fallback Tier 2...`);
    }
    
    // Tier 2: Secondary Source (priyangsubanerjee yogism API)
    auditLogs.push(`[${timestamp()}] [Tier 2] Attempting fetch from secondary source: priyangsubanerjee yogism API...`);
    try {
      const tier2Poses = await fetchFromTier2(params);
      const filtered = filterAndRankPoses(tier2Poses, params);
      auditLogs.push(`[${timestamp()}] [Tier 2 SUCCESS] Retrieved ${tier2Poses.length} poses from secondary yogism API; selected ${filtered.length}.`);
      
      return {
        success: true,
        tierUsed: "tier2_fallback_yogism",
        source: "https://github.com/priyangsubanerjee/yogism (priyangsubanerjee.github.io/yogism)",
        count: filtered.length,
        auditLogs,
        poses: filtered
      };
    } catch (tier2Error: any) {
      auditLogs.push(`[${timestamp()}] [Tier 2 FAILED] ${tier2Error.message}. Triggering Failsafe Tier 3...`);
    }
    
    // Tier 3: Failsafe Source (Local Kaggle Dataset reference mapped to /assets/yoga/)
    auditLogs.push(`[${timestamp()}] [Tier 3] Engaging failsafe source: Local Kaggle Dataset mapped to /assets/yoga/...`);
    try {
      const tier3Poses = fetchFromTier3(params);
      const filtered = filterAndRankPoses(tier3Poses, params);
      auditLogs.push(`[${timestamp()}] [Tier 3 SUCCESS] Loaded ${tier3Poses.length} local Kaggle poses; selected ${filtered.length}.`);
      
      return {
        success: true,
        tierUsed: "tier3_failsafe_kaggle",
        source: "Local Kaggle Reference Dataset (public/assets/yoga)",
        count: filtered.length,
        auditLogs,
        poses: filtered
      };
    } catch (tier3Error: any) {
      auditLogs.push(`[${timestamp()}] [Tier 3 CRITICAL ERROR] ${tier3Error.message}.`);
      return {
        success: false,
        tierUsed: "tier3_failsafe_kaggle",
        source: "None",
        count: 0,
        auditLogs,
        poses: [],
        error: tier3Error.message
      };
    }
  }
});

export default fetchYogaRoutine;

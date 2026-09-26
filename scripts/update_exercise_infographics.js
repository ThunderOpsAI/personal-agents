const fs = require('fs');
const path = require('path');

function chooseInfographic(title, cue, category, focusAreas) {
    const text = ((title || '') + ' ' + (cue || '') + ' ' + (focusAreas || []).join(' ')).toLowerCase();
    
    // 1. Pelvic Tilts & Specific Lumbar Decompression
    if (text.includes('pelvic tilt') || text.includes('pelvic curl') || text.includes('pelvic squeeze') || text.includes('pelvic floor') || text.includes('anterior pelvic') || text.includes('sacrum') || (text.includes('flatten lower back') && !text.includes('child'))) {
        return '/exercises/supine_pelvic_tilts.jpg';
    }
    // 2. Knee to Chest / Lumbar sacral decompression / sciatica / nerve glide
    if (text.includes('knee-to-chest') || text.includes('knee to chest') || text.includes('hug right knee') || text.includes('hug knees') || text.includes('hamstring') || text.includes('floss') || text.includes('sciatic')) {
        return '/exercises/knee_to_chest_stretch.jpg';
    }
    // 3. Supported Child's Pose
    if (text.includes('child\'s pose') || text.includes('childs pose') || text.includes('puppy pose') || text.includes('balasana')) {
        return '/exercises/supported_childs_pose.jpg';
    }
    // 4. Restorative Savasana & Vagus/Breathing Rest
    if (text.includes('savasana') || text.includes('parasympathetic') || text.includes('vagal') || text.includes('4-7-8') || text.includes('surrender') || text.includes('restorative alignment') || text.includes('restorative prone rest') || text.includes('diaphragmatic breath') || text.includes('oculomotor') || text.includes('heart-belly')) {
        return '/exercises/restorative_savasana.jpg';
    }
    // 5. Cervical / Neck / Retraction / Upper Trap
    if (text.includes('cervical') || text.includes('neck') || text.includes('chin') || text.includes('retraction') || text.includes('ear-to-shoulder') || text.includes('shrug') || text.includes('suboccipital') || text.includes('trapezius')) {
        return '/exercises/cervical_neck_mobility.jpg';
    }
    // 6. Thoracic / Twists / Needle / Cactus Chest Openers
    if (text.includes('twist') || text.includes('thoracic') || text.includes('needle') || text.includes('cactus') || text.includes('side body lateral')) {
        return '/exercises/thoracic_spine_mobility.jpg';
    }
    // 7. Hip / Psoas / Lunge / 90/90 / Piriformis / Glute Bridge
    if (text.includes('hip') || text.includes('psoas') || text.includes('lunge') || text.includes('90/90') || text.includes('figure-4') || text.includes('piriformis') || text.includes('bridge') || text.includes('glute')) {
        return '/hip_mobility_routine.jpg';
    }
    // 8. Shoulder & Scapular Rehab
    if (text.includes('scapul') || text.includes('shoulder') || text.includes('wall slide') || text.includes('rotator') || text.includes('arm')) {
        return '/shoulder_rehab_routine.jpg';
    }
    // 9. Core stability / Cat-Cow / Bird-Dog / Dead bug / McGill
    return '/lumbar_core_routine.jpg';
}

// 1. Process dashboard/lib/exercise-db.ts
const dbPath = path.join(__dirname, '../dashboard/lib/exercise-db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

// We can parse EXERCISE_DATABASE
// Let's require ts-node or parse using regex/ast or extract objects
// Instead of complex parsing, let's load it via regex match on each routine definition or evaluate
const exportPrefix = dbContent.indexOf('export const EXERCISE_DATABASE: ExerciseItem[] = [');
const dbPrefix = dbContent.slice(0, exportPrefix + 'export const EXERCISE_DATABASE: ExerciseItem[] = ['.length);
const dbSuffix = dbContent.slice(dbContent.lastIndexOf('];'));

// Let's safely extract routine objects from exercise-db.ts
const routineRegex = /\{\s*id:\s*"([a-z0-9]+)",[\s\S]*?video_url:[^\}]+\}/g;

let updatedDbContent = dbContent.replace(/\{\s*id:\s*"([a-z0-9]+)"[\s\S]*?steps:\s*\[([\s\S]*?)\]\s*,[\s\S]*?video_url:\s*"([^"]*)"\s*\}/g, (match, id, stepsBlock, videoUrl) => {
    // Extract duration_minutes
    const durationMatch = match.match(/duration_minutes:\s*(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 15;
    const targetTotalSecs = durationMinutes * 60;
    
    // Extract focus_areas
    const focusMatch = match.match(/focus_areas:\s*\[([^\]]*)\]/);
    const focusAreas = focusMatch ? focusMatch[1].split(',').map(s => s.replace(/["'\s]/g, '')) : [];
    
    // Extract steps
    const stepRegex = /\{\s*title:\s*"([^"]+)",\s*duration:\s*(\d+),\s*cue:\s*"([^"]+)"[^\}]*\}/g;
    const steps = [];
    let sm;
    while ((sm = stepRegex.exec(stepsBlock)) !== null) {
        steps.push({
            title: sm[1],
            cue: sm[3]
        });
    }
    
    if (steps.length === 0) return match;
    
    // Calculate new durations
    const stepDuration = Math.round(targetTotalSecs / steps.length);
    let allocated = 0;
    
    const newStepsStr = steps.map((s, idx) => {
        const dur = (idx === steps.length - 1) ? (targetTotalSecs - allocated) : stepDuration;
        allocated += dur;
        const img = chooseInfographic(s.title, s.cue, '', focusAreas);
        return `      { title: "${s.title}", duration: ${dur}, cue: "${s.cue}", frames: ["${img}"] }`;
    }).join(',\n');
    
    // Replace steps array in match
    const stepsStart = match.indexOf('steps: [');
    const stepsEnd = match.indexOf('],', stepsStart) + 1;
    const updatedMatch = match.slice(0, stepsStart) + `steps: [\n${newStepsStr}\n    ]` + match.slice(stepsEnd);
    return updatedMatch;
});

fs.writeFileSync(dbPath, updatedDbContent, 'utf8');
console.log('Successfully updated exercise-db.ts');

const fs = require('fs');
const path = require('path');

function chooseInfographic(title, cue, category, focusAreas) {
    const text = ((title || '') + ' ' + (cue || '') + ' ' + (focusAreas || []).join(' ')).toLowerCase();
    
    // 1. Knee to chest / single knee / knee hug / hamstring / flossing / sciatic / supine leg extension
    if (text.includes('knee-to-chest') || text.includes('knee to chest') || text.includes('single knee') || 
        text.includes('hug right knee') || text.includes('hug knee') || text.includes('knees to chest') || 
        text.includes('hamstring') || text.includes('floss') || text.includes('sciatic') || 
        text.includes('strap leg extension') || text.includes('flutter')) {
        return '/exercises/knee_to_chest_stretch.jpg';
    }
    // 2. Pelvic Tilts & Specific Lumbar Decompression
    if (text.includes('pelvic tilt') || text.includes('pelvic curl') || text.includes('pelvic squeeze') || 
        text.includes('pelvic floor') || text.includes('anterior pelvic') || text.includes('sacrum') || 
        text.includes('flatten lower back') || text.includes('pelvic rest')) {
        return '/exercises/supine_pelvic_tilts.jpg';
    }
    // 3. Supported Child's Pose
    if (text.includes('child\'s pose') || text.includes('childs pose') || text.includes('puppy pose') || text.includes('balasana')) {
        return '/exercises/supported_childs_pose.jpg';
    }
    // 4. Restorative Savasana & Vagus/Breathing Rest
    if (text.includes('savasana') || text.includes('parasympathetic') || text.includes('vagal') || 
        text.includes('4-7-8') || text.includes('surrender') || text.includes('restorative alignment') || 
        text.includes('restorative prone rest') || text.includes('diaphragmatic breath') || 
        text.includes('oculomotor') || text.includes('heart-belly') || text.includes('breathing') ||
        text.includes('bound angle') || text.includes('legs up the wall')) {
        return '/exercises/restorative_savasana.jpg';
    }
    // 5. Cervical / Neck / Retraction / Upper Trap
    if (text.includes('cervical') || text.includes('neck') || text.includes('chin') || 
        text.includes('retraction') || text.includes('ear-to-shoulder') || text.includes('shrug') || 
        text.includes('suboccipital') || text.includes('trapezius')) {
        return '/exercises/cervical_neck_mobility.jpg';
    }
    // 6. Thoracic / Twists / Needle / Cactus Chest Openers / Rotation
    if (text.includes('twist') || text.includes('thoracic') || text.includes('needle') || 
        text.includes('cactus') || text.includes('side body lateral') || text.includes('rotation') ||
        text.includes('t-spine') || text.includes('sphinx')) {
        return '/exercises/thoracic_spine_mobility.jpg';
    }
    // 7. Hip / Psoas / Lunge / 90/90 / Piriformis / Glute Bridge
    if (text.includes('hip') || text.includes('psoas') || text.includes('lunge') || 
        text.includes('90/90') || text.includes('figure-4') || text.includes('piriformis') || 
        text.includes('bridge') || text.includes('glute')) {
        return '/hip_mobility_routine.jpg';
    }
    // 8. Shoulder & Scapular Rehab
    if (text.includes('scapul') || text.includes('shoulder') || text.includes('wall slide') || 
        text.includes('rotator') || text.includes('arm')) {
        return '/shoulder_rehab_routine.jpg';
    }
    // 9. Core stability / Cat-Cow / Bird-Dog / Dead bug / McGill
    return '/lumbar_core_routine.jpg';
}

// 1. Process dashboard/lib/exercise-db.ts
const dbPath = path.join(__dirname, '../dashboard/lib/exercise-db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

const parts = dbContent.split(/\n  \{\n    id: \"/);
const header = parts[0];
const processedParts = [];

const allParsedRoutines = {};

for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const id = part.slice(0, part.indexOf('\"'));
    
    // Extract duration_minutes
    const durationMatch = part.match(/duration_minutes:\s*(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 15;
    const targetTotalSecs = durationMinutes * 60;
    
    // Extract title
    const titleMatch = part.match(/title:\s*\"([^\"]+)\"/);
    const title = titleMatch ? titleMatch[1] : id;
    
    // Extract category
    const categoryMatch = part.match(/category:\s*\"([^\"]+)\"/);
    const category = categoryMatch ? categoryMatch[1] : 'yoga';
    
    // Extract focus_areas
    const focusMatch = part.match(/focus_areas:\s*\[([^\]]*)\]/);
    const focusAreas = focusMatch ? focusMatch[1].split(',').map(s => s.replace(/[\"'\\s]/g, '')).filter(Boolean) : [];
    
    // Extract instruction
    const instructionMatch = part.match(/instruction:\s*\"([^\"]+)\"/);
    const instruction = instructionMatch ? instructionMatch[1] : '';
    
    // Extract intensity
    const intensityMatch = part.match(/intensity:\s*\"([^\"]+)\"/);
    const intensity = intensityMatch ? intensityMatch[1] : 'Gentle Restorative';
    
    // Extract precautions
    const precautionsMatch = part.match(/precautions:\s*\[([^\]]*)\]/);
    const precautions = precautionsMatch ? precautionsMatch[1].split(',').map(s => s.replace(/[\"'\\s]/g, '')).filter(Boolean) : [];

    // Extract steps block
    const stepsBlockMatch = part.match(/steps:\s*\[([\s\S]*?)\]\s*(,|\n)/);
    if (!stepsBlockMatch) {
        processedParts.push(part);
        continue;
    }
    
    const stepsBlock = stepsBlockMatch[1];
    const stepRegex = /\{\s*title:\s*\"([^\"]+)\",\s*duration:\s*(\d+),\s*cue:\s*\"([^\"]+)\"[^\}]*\}/g;
    const steps = [];
    let sm;
    while ((sm = stepRegex.exec(stepsBlock)) !== null) {
        steps.push({
            title: sm[1],
            cue: sm[3]
        });
    }
    
    const stepDuration = Math.round(targetTotalSecs / steps.length);
    let allocated = 0;
    
    const newSteps = steps.map((s, idx) => {
        const dur = (idx === steps.length - 1) ? (targetTotalSecs - allocated) : stepDuration;
        allocated += dur;
        const img = chooseInfographic(s.title, s.cue, category, focusAreas);
        return {
            title: s.title,
            duration: dur,
            cue: s.cue,
            frames: [img]
        };
    });
    
    allParsedRoutines[id] = {
        id,
        title,
        category,
        duration_minutes: durationMinutes,
        intensity,
        focus_areas: focusAreas,
        instruction,
        precautions,
        steps: newSteps
    };
    
    const newStepsLines = newSteps.map(s => 
        `      { title: "${s.title}", duration: ${s.duration}, cue: "${s.cue}", frames: ["${s.frames[0]}"] }`
    ).join(',\n');
    
    const updatedPart = part.replace(stepsBlockMatch[0], `steps: [\n${newStepsLines}\n    ]${stepsBlockMatch[2]}`);
    processedParts.push(updatedPart);
}

const newDbContent = header + '\n  {\n    id: "' + processedParts.join('\n  {\n    id: "');
fs.writeFileSync(dbPath, newDbContent, 'utf8');
console.log('Successfully updated exercise-db.ts with all', Object.keys(allParsedRoutines).length, 'routines');

// 2. Update dashboard/public/app.js and dashboard/app.js
const routinesJson = JSON.stringify(allParsedRoutines, null, 8);
const replacement = 'const YOGA_ROUTINES = ' + routinesJson + ';';

for (const targetFile of [path.join(__dirname, '../dashboard/public/app.js'), path.join(__dirname, '../dashboard/app.js')]) {
    let content = fs.readFileSync(targetFile, 'utf8');
    
    // Replace YOGA_ROUTINES
    const startIdx = content.indexOf('const YOGA_ROUTINES = {');
    if (startIdx !== -1) {
        const backlogIdx = content.indexOf('const exerciseBacklog =', startIdx);
        const endIdx = content.lastIndexOf('};', backlogIdx) + 2;
        content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
    }
    
    // Replace exerciseBacklog
    const backlogOld = /const exerciseBacklog = \[[\s\S]*?\];/;
    const backlogNew = 'const exerciseBacklog = [\n        { title: "Lumbar & Core Stability", duration: 225, frames: ["/lumbar_core_routine.jpg"] },\n        { title: "Child\'s Pose Decompression", duration: 225, frames: ["/exercises/supported_childs_pose.jpg"] },\n        { title: "Pelvic Tilt & Spinal Alignment", duration: 225, frames: ["/exercises/supine_pelvic_tilts.jpg"] },\n        { title: "Hip & Lower Body Mobility", duration: 225, frames: ["/hip_mobility_routine.jpg"] },\n        { title: "Shoulder & Scapular Rehab", duration: 225, frames: ["/shoulder_rehab_routine.jpg"] }\n    ];';
    content = content.replace(backlogOld, backlogNew);
    
    // Replace fallback in startRunnerModal
    const fallbackOld = /currentProtocolSteps = \[\s*\{\s*title:\s*\"Supine Pelvic Tilts & Decompression\"[\s\S]*?\}\s*\];/;
    const fallbackNew = 'currentProtocolSteps = [\n                { title: "Supine Pelvic Tilts & Decompression", duration: 225, cue: "Flatten lower back against the mat on exhale, gentle arch on inhale.", frames: ["/exercises/supine_pelvic_tilts.jpg"] },\n                { title: "Supported Child\'s Pose", duration: 225, cue: "Widen knees, rest torso forward on bolster, lengthen spine.", frames: ["/exercises/supported_childs_pose.jpg"] },\n                { title: "Supine Knee-to-Chest Decompression", duration: 225, cue: "Gently hug knees to chest, relaxing sacrum and pelvic floor.", frames: ["/exercises/knee_to_chest_stretch.jpg"] },\n                { title: "Restorative Savasana Release", duration: 225, cue: "Complete still surrender into mat with diaphragmatic breathing.", frames: ["/exercises/restorative_savasana.jpg"] }\n            ];';
    content = content.replace(fallbackOld, fallbackNew);

    // Replace runner duration scaling in startRunnerModal
    const foundRoutineOld = /if \(foundRoutine\) \{\s*currentRoutineRunning = foundRoutine;\s*if \(runnerTitleEl\) runnerTitleEl\.innerText = foundRoutine\.title \|\| foundRoutine\.name;[\s\S]*?currentProtocolSteps = \(foundRoutine\.steps \|\| \[\]\)\.map\(s => \(\{ \.\.\.s \}\)\);[\s\S]*?\}/;
    const foundRoutineNew = 'if (foundRoutine) {\n            currentRoutineRunning = foundRoutine;\n            if (runnerTitleEl) runnerTitleEl.innerText = foundRoutine.title || foundRoutine.name;\n            const targetTotalSecs = (foundRoutine.duration_minutes || 15) * 60;\n            currentProtocolSteps = (foundRoutine.steps || []).map(s => ({ ...s }));\n            if (currentProtocolSteps.length > 0) {\n                const currentSum = currentProtocolSteps.reduce((acc, step) => acc + (step.duration || 45), 0);\n                if (currentSum !== targetTotalSecs && targetTotalSecs > 0) {\n                    const factor = targetTotalSecs / currentSum;\n                    let allocated = 0;\n                    currentProtocolSteps.forEach((s, idx) => {\n                        if (idx === currentProtocolSteps.length - 1) {\n                            s.duration = targetTotalSecs - allocated;\n                        } else {\n                            s.duration = Math.round((s.duration || 45) * factor);\n                            allocated += s.duration;\n                        }\n                    });\n                }\n            }\n        }';
    content = content.replace(foundRoutineOld, foundRoutineNew);

    // Replace updateStepUI frameInterval cycling with single persistent image
    const frameIntervalOld = /if \(step\.frames\.length > 1\) \{\s*frameInterval = setInterval\(\(\) => \{[\s\S]*?\}, 2000\);\s*\}/;
    content = content.replace(frameIntervalOld, '// Persistent single infographic display - no flicking or frame rotation\n                imgEl.style.opacity = "1";');
    
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully updated', targetFile);
}

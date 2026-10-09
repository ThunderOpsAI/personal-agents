import fs from 'fs';
import path from 'path';
import { EXERCISE_DATABASE } from '../dashboard/lib/exercise-db';

// 1. Build clean YOGA_ROUTINES map
const routinesObj: Record<string, any> = {};
for (const ex of EXERCISE_DATABASE) {
  routinesObj[ex.id] = {
    id: ex.id,
    title: ex.title || ex.name,
    category: ex.category,
    duration_minutes: ex.duration_minutes,
    intensity: ex.intensity,
    focus_areas: ex.focus_areas,
    instruction: ex.instruction,
    precautions: ex.precautions,
    steps: ex.steps
  };
}

const routinesJson = JSON.stringify(routinesObj, null, 8);
const replacement = `const YOGA_ROUTINES = ${routinesJson};`;

// 2. Update dashboard/public/app.js and dashboard/app.js
const filesToUpdate = [
  path.join(__dirname, '../dashboard/public/app.js'),
  path.join(__dirname, '../dashboard/app.js')
];

for (const targetFile of filesToUpdate) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Replace YOGA_ROUTINES
  const startIdx = content.indexOf('const YOGA_ROUTINES = {');
  if (startIdx !== -1) {
    const backlogIdx = content.indexOf('const exerciseBacklog =', startIdx);
    const endIdx = content.lastIndexOf('};', backlogIdx) + 2;
    content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  }

  // Replace startRunnerModal implementation
  const startRunnerModalRegex = /async function startRunnerModal\(id\) \{[\s\S]*?startRunnerTimer\(\);\s*\}/;
  const newStartRunnerModal = `async function startRunnerModal(id) {
        const rawId = (id || '').toLowerCase().trim();
        if (rawId.includes('meditation') || rawId.startsWith('med_')) {
            window.open('https://insighttimer.com', '_blank');
            return;
        }

        runnerModal.classList.remove('hidden');
        const runnerTitleEl = document.getElementById('runnerTitle');
        isRunnerPaused = false;
        const btnTogglePause = document.getElementById('btnTogglePauseRunner');
        if (btnTogglePause) btnTogglePause.innerText = 'Pause';
        
        let foundRoutine = YOGA_ROUTINES[rawId];
        
        if (!foundRoutine && typeof cachedExerciseCatalog !== 'undefined') {
            foundRoutine = cachedExerciseCatalog.find(r => (r.id || '').toLowerCase() === rawId || (r.title || '').toLowerCase().includes(rawId) || (r.name || '').toLowerCase().includes(rawId));
        }

        if (!foundRoutine) {
            const matchingKey = Object.keys(YOGA_ROUTINES).find(k => k === rawId || rawId.includes(k) || (YOGA_ROUTINES[k].title || '').toLowerCase().includes(rawId));
            if (matchingKey) foundRoutine = YOGA_ROUTINES[matchingKey];
        }

        if (!foundRoutine) {
            // Intelligent fallback for agenda morning/evening yoga items
            if (rawId.includes('yoga_am') || rawId.includes('morning')) {
                foundRoutine = YOGA_ROUTINES['y1']; // Gentle Lumbar Release (15 min)
            } else if (rawId.includes('yoga_pm') || rawId.includes('evening')) {
                foundRoutine = YOGA_ROUTINES['y3']; // Full Body Restorative Yin (25 min)
            }
        }

        if (!foundRoutine) {
            if (runnerTitleEl) runnerTitleEl.innerText = "Loading routine details...";
            try {
                const res = await fetch("/api/v1/exercises");
                if (res.ok) {
                    const data = await res.json();
                    if (data.exercises && data.exercises.length > 0) {
                        if (typeof cachedExerciseCatalog !== 'undefined') {
                            cachedExerciseCatalog = data.exercises;
                        }
                        foundRoutine = data.exercises.find(r => (r.id || '').toLowerCase() === rawId || (r.title || '').toLowerCase().includes(rawId) || (r.name || '').toLowerCase().includes(rawId));
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch exercise catalog fallback", e);
            }
        }

        if (!foundRoutine) {
            foundRoutine = YOGA_ROUTINES['y1'] || {
                id: rawId || 'y1',
                title: "Gentle Lumbar Release",
                duration_minutes: 15,
                steps: [
                    { title: "Supine Pelvic Tilts", duration: 225, cue: "Flatten lower back against the mat on exhale, gentle arch on inhale.", frames: ["/exercises/supine_pelvic_tilts.jpg"] },
                    { title: "Supported Child's Pose", duration: 225, cue: "Widen knees, rest torso forward on bolster, lengthen spine.", frames: ["/exercises/supported_childs_pose.jpg"] },
                    { title: "Supine Single Knee-to-Chest", duration: 225, cue: "Gently hug right knee, then left knee. Keep sacrum grounded.", frames: ["/exercises/knee_to_chest_stretch.jpg"] },
                    { title: "Restorative Savasana with Bolster", duration: 225, cue: "Place bolster under knees to release psoas and lumbar pressure.", frames: ["/exercises/restorative_savasana.jpg"] }
                ]
            };
        }

        currentRoutineRunning = foundRoutine;
        const routineMins = foundRoutine.duration_minutes || 15;
        totalRoutineDuration = routineMins * 60;
        
        currentProtocolSteps = (foundRoutine.steps || []).map(s => ({ ...s }));
        
        // Calibrate step durations so they strictly add up to the routine's declared duration
        if (currentProtocolSteps.length > 0) {
            const currentSum = currentProtocolSteps.reduce((acc, step) => acc + (step.duration || 45), 0);
            if (currentSum !== totalRoutineDuration && totalRoutineDuration > 0) {
                const factor = totalRoutineDuration / currentSum;
                let allocated = 0;
                currentProtocolSteps.forEach((s, idx) => {
                    if (idx === currentProtocolSteps.length - 1) {
                        s.duration = totalRoutineDuration - allocated;
                    } else {
                        s.duration = Math.round((s.duration || 45) * factor);
                        allocated += s.duration;
                    }
                });
            }
        }

        currentStepIndex = 0;
        timeLeft = currentProtocolSteps[0].duration;
        totalTimeLeft = totalRoutineDuration;

        updateStepUI();
        startRunnerTimer();
    }`;

  content = content.replace(startRunnerModalRegex, newStartRunnerModal);

  // Replace updateStepUI implementation
  const updateStepUIRegex = /function updateStepUI\(\) \{[\s\S]*?if \(btnNext\) btnNext\.innerText = currentStepIndex === currentProtocolSteps\.length - 1 \? 'Finish Routine' : 'Next Step';\s*\}/;
  const newUpdateStepUI = `function updateStepUI() {
        if (currentStepIndex >= currentProtocolSteps.length) return;
        const step = currentProtocolSteps[currentStepIndex];
        
        // Calculate remaining total time
        let remainingAfter = 0;
        for (let i = currentStepIndex + 1; i < currentProtocolSteps.length; i++) {
            remainingAfter += currentProtocolSteps[i].duration;
        }
        totalTimeLeft = timeLeft + remainingAfter;

        const runnerTitleEl = document.getElementById('runnerTitle');
        if (runnerTitleEl && currentRoutineRunning) {
            runnerTitleEl.innerText = currentRoutineRunning.title || currentRoutineRunning.name;
        }

        const runnerTotalBadge = document.getElementById('runnerTotalBadge');
        if (runnerTotalBadge && currentRoutineRunning) {
            runnerTotalBadge.innerText = \`\${currentRoutineRunning.duration_minutes || 15} Min Routine\`;
        }

        const runnerTotalTimeDisplay = document.getElementById('runnerTotalTimeDisplay');
        if (runnerTotalTimeDisplay) {
            runnerTotalTimeDisplay.innerText = \`Total Remaining: \${formatTime(totalTimeLeft)} / \${formatTime(totalRoutineDuration)}\`;
        }

        const runnerTotalTimer = document.getElementById('runnerTotalTimer');
        if (runnerTotalTimer) {
            runnerTotalTimer.innerText = formatTime(totalTimeLeft);
        }

        if (runnerStep) runnerStep.innerText = \`Step \${currentStepIndex + 1} of \${currentProtocolSteps.length}: \${step.title}\`;
        if (runnerTimer) runnerTimer.innerText = formatTime(timeLeft);
        
        const progressBar = document.getElementById('runnerTotalProgressBar');
        if (progressBar && totalRoutineDuration > 0) {
            const pct = Math.min(100, Math.max(0, ((totalRoutineDuration - totalTimeLeft) / totalRoutineDuration) * 100));
            progressBar.style.width = \`\${pct}%\`;
        }

        const runnerCueEl = document.getElementById('runnerCue');
        if (runnerCueEl) {
            runnerCueEl.innerText = step.cue || step.instruction || 'Follow gentle diaphragmatic breath rhythm.';
        }

        const videoEl = document.getElementById('runnerVideo');
        const imgEl = document.getElementById('runnerImg');
        const placeholderEl = document.getElementById('runnerPlaceholder');
        
        clearInterval(frameInterval);
        
        if (step.frames && step.frames.length > 0) {
            if (placeholderEl) placeholderEl.style.display = 'none';
            if (videoEl) {
                videoEl.pause();
                videoEl.style.display = 'none';
            }
            if (imgEl) {
                imgEl.style.display = 'block';
                imgEl.style.opacity = '1';
                imgEl.src = step.frames[0];
                imgEl.onerror = () => {
                    imgEl.style.display = 'none';
                    if (placeholderEl) {
                        placeholderEl.style.display = 'flex';
                        placeholderEl.innerHTML = \`
                            <div style="text-align: center; padding: 15px;">
                                <div style="font-size: 2.2rem; margin-bottom: 6px;">🧘</div>
                                <div style="font-size: 1rem; color: var(--neon-blue); font-weight: 600;">\${escapeHtml(step.title)}</div>
                                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">\${escapeHtml(step.cue || 'Maintain steady rhythm')}</div>
                            </div>
                        \`;
                    }
                };
            }
        } else if (step.video) {
            if (placeholderEl) placeholderEl.style.display = 'none';
            if (imgEl) imgEl.style.display = 'none';
            if (videoEl) {
                videoEl.style.display = 'block';
                if (videoEl.getAttribute('data-src') !== step.video) {
                    videoEl.setAttribute('data-src', step.video);
                    videoEl.src = step.video;
                    videoEl.load();
                }
                const playPromise = videoEl.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.warn("[Runner Video] Autoplay pending or prevented:", err);
                    });
                }
            }
        } else {
            if (imgEl) imgEl.style.display = 'none';
            if (videoEl) {
                videoEl.pause();
                videoEl.removeAttribute('src');
                videoEl.removeAttribute('data-src');
                videoEl.style.display = 'none';
            }
            if (placeholderEl) {
                placeholderEl.style.display = 'flex';
                placeholderEl.innerHTML = \`
                    <div style="text-align: center; padding: 15px;">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">🧘</div>
                        <div style="font-size: 1rem; color: var(--neon-blue); font-weight: 600;">\${escapeHtml(step.title)}</div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">\${escapeHtml(step.cue || 'Maintain steady rhythm')}</div>
                    </div>
                \`;
            }
        }
        
        const btnPrev = document.getElementById('btnPrevStep');
        const btnNext = document.getElementById('btnNextStep');
        if (btnPrev) btnPrev.disabled = currentStepIndex === 0;
        if (btnNext) btnNext.innerText = currentStepIndex === currentProtocolSteps.length - 1 ? 'Finish Routine' : 'Next Step';
    }`;

  content = content.replace(updateStepUIRegex, newUpdateStepUI);

  // Replace startRunnerTimer implementation
  const startRunnerTimerRegex = /function startRunnerTimer\(\) \{[\s\S]*?if \(runnerTimer\) runnerTimer\.innerText = formatTime\(timeLeft\);\s*\}\s*\}, 1000\);\s*\}/;
  const newStartRunnerTimer = `function startRunnerTimer() {
        clearInterval(runnerInterval);
        runnerInterval = setInterval(() => {
            if (isRunnerPaused) return;
            timeLeft--;
            totalTimeLeft--;
            if (totalTimeLeft < 0) totalTimeLeft = 0;

            if (timeLeft < 0) {
                currentStepIndex++;
                if (currentStepIndex >= currentProtocolSteps.length) {
                    clearInterval(runnerInterval);
                    clearInterval(frameInterval);
                    if (runnerStep) runnerStep.innerText = "Routine Complete!";
                    if (runnerTimer) runnerTimer.innerText = "00:00";
                    const runnerTotalTimer = document.getElementById('runnerTotalTimer');
                    if (runnerTotalTimer) runnerTotalTimer.innerText = "00:00";
                    const progressBar = document.getElementById('runnerTotalProgressBar');
                    if (progressBar) progressBar.style.width = "100%";
                    setTimeout(() => {
                        closeRunnerModal();
                        const routineName = currentRoutineRunning?.title || "Yoga Routine";
                        if (reliefExerciseName) reliefExerciseName.innerText = routineName;
                        if (afterPainScore) afterPainScore.value = currentPainLevel || 5;
                        pendingProtocol = { id: currentRoutineRunning?.id || 'y1', name: routineName, beforePain: currentPainLevel || 5 };
                        if (reliefModal) reliefModal.classList.remove('hidden');
                    }, 1200);
                } else {
                    timeLeft = (currentProtocolSteps[currentStepIndex] && currentProtocolSteps[currentStepIndex].duration) || 225;
                    updateStepUI();
                }
            } else {
                if (runnerTimer) runnerTimer.innerText = formatTime(timeLeft);
                const runnerTotalTimer = document.getElementById('runnerTotalTimer');
                if (runnerTotalTimer) runnerTotalTimer.innerText = formatTime(totalTimeLeft);
                const runnerTotalTimeDisplay = document.getElementById('runnerTotalTimeDisplay');
                if (runnerTotalTimeDisplay) {
                    runnerTotalTimeDisplay.innerText = \`Total Remaining: \${formatTime(totalTimeLeft)} / \${formatTime(totalRoutineDuration)}\`;
                }
                const progressBar = document.getElementById('runnerTotalProgressBar');
                if (progressBar && totalRoutineDuration > 0) {
                    const pct = Math.min(100, Math.max(0, ((totalRoutineDuration - totalTimeLeft) / totalRoutineDuration) * 100));
                    progressBar.style.width = \`\${pct}%\`;
                }
            }
        }, 1000);
    }`;

  content = content.replace(startRunnerTimerRegex, newStartRunnerTimer);

  // Add totalTimeLeft and totalRoutineDuration variables if not present
  if (!content.includes('let totalTimeLeft = 0;')) {
    content = content.replace(
      'let isRunnerPaused = false;',
      'let isRunnerPaused = false;\n    let totalTimeLeft = 0;\n    let totalRoutineDuration = 0;'
    );
  }

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully updated runner logic and YOGA_ROUTINES in', targetFile);
}

// 3. Update dashboard/public/index.html to add dual-timer display and bump script version
const htmlPath = path.join(__dirname, '../dashboard/public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace runnerModal in index.html
const oldModalSection = /<!-- Protocol Step Runner Modal -->[\s\S]*?<!-- Swap Exercise Modal -->/;
const newModalSection = `<!-- Protocol Step Runner Modal -->
        <div class="modal-overlay hidden" id="runnerModal">
            <div class="modal-content glass-panel" style="max-width: 540px;">
                <div class="modal-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h2 id="runnerTitle" style="margin: 0;">Protocol Runner</h2>
                            <span class="badge neon-purple" id="runnerTotalBadge">15 Min Routine</span>
                        </div>
                        <div id="runnerTotalTimeDisplay" style="font-size: 0.8rem; color: var(--neon-blue); font-weight: 600; margin-top: 3px;">Total Remaining: 15:00 / 15:00</div>
                    </div>
                    <button class="btn-close" id="btnCancelRunner">&times;</button>
                </div>
                <div class="runner-visual" style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; margin: 15px 0; display: flex; align-items: center; justify-content: center;">
                    <img id="runnerImg" alt="Exercise Demo" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none; transition: opacity 0.4s ease;">
                    <video id="runnerVideo" playsinline autoplay muted loop style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; display: none;"></video>
                    <div class="visual-placeholder" id="runnerPlaceholder" style="z-index: 1;">START</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                        <h3 id="runnerStep" style="margin-bottom: 2px;">Step 1: Alignment & Position</h3>
                        <p id="runnerCue" style="margin: 3px 0 6px 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.35;"></p>
                        <div style="display: flex; align-items: center; gap: 14px; margin-top: 8px;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Current Step</span>
                                <div class="timer" id="runnerTimer" style="cursor: pointer; margin: 0; font-size: 1.5rem;" title="Click to Pause/Resume">03:45</div>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total Routine</span>
                                <div class="timer" id="runnerTotalTimer" style="cursor: pointer; margin: 0; font-size: 1.5rem; color: var(--neon-purple);" title="Total routine time remaining">15:00</div>
                            </div>
                            <button class="btn btn-outline btn-sm" id="btnTogglePauseRunner" style="align-self: flex-end; margin-bottom: 2px;">Pause</button>
                        </div>
                    </div>
                    <button class="btn btn-outline btn-sm" id="btnSwapExercise" style="white-space: nowrap;">Swap Exercise</button>
                </div>
                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 10px;">
                    <div id="runnerTotalProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple)); transition: width 0.3s ease;"></div>
                </div>
                <div class="runner-actions" style="display: flex; justify-content: space-between; margin-top: 14px;">
                    <button class="btn btn-outline" id="btnPrevStep">Prev</button>
                    <button class="btn btn-neon-purple" id="btnNextStep">Next Step</button>
                </div>
            </div>
        </div>

        <!-- Swap Exercise Modal -->`;

html = html.replace(oldModalSection, newModalSection);

// Bump app.js query param to force browser cache refresh
html = html.replace(/app\.js\?v=\d+/, 'app.js?v=20260925_0450');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully updated index.html with dual-timer modal and cache-busting version');

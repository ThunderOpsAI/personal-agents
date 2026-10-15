import re

NEW_PAIN_LOGIC = """    // --- Pain Presets, Mood Model & Clinical Notes ---
    let manualMoodOverride = null;

    function appendNoteChipText(text) {
        if (!unifiedNotesInput || !text) return;
        const cur = unifiedNotesInput.value.trim();
        if (!cur) {
            unifiedNotesInput.value = text;
        } else if (!cur.toLowerCase().includes(text.toLowerCase())) {
            unifiedNotesInput.value = `${cur}; ${text}`;
        }
    }

    function recalculateMood() {
        if (manualMoodOverride !== null) {
            currentMoodLevel = Number(manualMoodOverride.toFixed(1));
        } else {
            let score = 5.0; // Base 5.0

            // Emotional mood tags
            document.querySelectorAll('#moodTagsRow .mood-tag-chip.active').forEach(chip => {
                const w = parseFloat(chip.getAttribute('data-weight') || '0');
                score += w;
            });

            // Physical soreness severity (single select)
            const activeSoreness = document.querySelector('#sorenessChipsRow .soreness-chip.active');
            if (activeSoreness) {
                const w = parseFloat(activeSoreness.getAttribute('data-weight') || '0');
                score += w;
            }

            // Therapy and exertion modifiers
            document.querySelectorAll('#modifiersChipsRow .modifier-chip.active').forEach(chip => {
                const w = parseFloat(chip.getAttribute('data-weight') || '0');
                score += w;
            });

            // Clamp strictly to [0, 10]
            currentMoodLevel = Math.max(0, Math.min(10, Number(score.toFixed(1))));
        }

        // Update displays
        if (moodValDisplay) moodValDisplay.innerText = currentMoodLevel.toFixed(1);

        let label = 'Calm';
        if (currentMoodLevel >= 8) label = 'Happy';
        else if (currentMoodLevel >= 6) label = 'Good';
        else if (currentMoodLevel >= 4) label = 'Calm';
        else if (currentMoodLevel >= 2) label = 'Tired';
        else label = 'Flare';

        if (moodLabelDisplay) moodLabelDisplay.innerText = `(${label})`;

        const formulaTag = document.getElementById('moodFormulaTag');
        if (formulaTag) {
            formulaTag.innerText = manualMoodOverride !== null ? 'Manual Override' : `Calculated: ${currentMoodLevel.toFixed(1)}`;
        }

        // Highlight corresponding integer button in scale
        const roundInt = Math.round(currentMoodLevel);
        document.querySelectorAll('#moodScaleButtons .mood-num').forEach(btn => {
            const val = parseInt(btn.getAttribute('data-val'), 10);
            btn.classList.toggle('active', val === roundInt);
        });
    }

    // Wire Mood Scale Manual Number Clicks
    document.querySelectorAll('#moodScaleButtons .mood-num').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseFloat(btn.getAttribute('data-val'));
            manualMoodOverride = isNaN(val) ? 5.0 : val;
            recalculateMood();
        });
    });

    // Wire Emotional State Multi-Select Tags
    document.querySelectorAll('#moodTagsRow .mood-tag-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            manualMoodOverride = null;
            recalculateMood();
            if (btn.classList.contains('active')) {
                const moodName = btn.getAttribute('data-mood');
                appendNoteChipText(moodName);
            }
        });
    });

    // Wire Soreness Severity Chips (Single-Select)
    document.querySelectorAll('#sorenessChipsRow .soreness-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#sorenessChipsRow .soreness-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            manualMoodOverride = null;
            recalculateMood();
            const soreness = btn.getAttribute('data-soreness');
            if (soreness && soreness !== 'None') {
                appendNoteChipText(`Soreness: ${soreness}`);
            }
        });
    });

    // Wire Therapies & Aggravators Chips
    document.querySelectorAll('#modifiersChipsRow .modifier-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            manualMoodOverride = null;
            recalculateMood();
            if (btn.classList.contains('active')) {
                const mod = btn.getAttribute('data-mod');
                appendNoteChipText(mod);
            }
        });
    });

    // Wire Expanded Clinical Note Quick Chips
    document.querySelectorAll('.pain-rhs-combined .quick-note-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.getAttribute('data-text') || chip.innerText.trim();
            appendNoteChipText(text);
        });
    });

    // Staging Presets (Loads Form State, No Auto-Commit, Explicit Save Required)
    function stagePainPreset(presetKey) {
        let targetAreas = [];
        let noteText = '';
        let sorenessLevel = 'None';
        let activeMoodTags = [];
        let activeModifiers = [];

        if (presetKey === 'standard') {
            const currentRotation = localStorage.getItem('rumble_standard_rotation') || 'B';
            const nextRotation = currentRotation === 'A' ? 'B' : 'A';
            localStorage.setItem('rumble_standard_rotation', nextRotation);

            if (nextRotation === 'A') {
                targetAreas = [
                    { area: 'Right Lumbar', percent: 70, score: 7.5 },
                    { area: 'Right Ankle', percent: 15, score: 5.0 },
                    { area: 'Thoracic', percent: 15, score: 5.0 }
                ];
                noteText = 'Standard check-in (70% lumbar 7.5, 15% ankle 5.0, 15% thoracic 5.0)';
            } else {
                targetAreas = [
                    { area: 'Right Lumbar', percent: 70, score: 7.5 },
                    { area: 'Right Knee', percent: 15, score: 5.0 },
                    { area: 'Neck / Cervical', percent: 15, score: 5.0 }
                ];
                noteText = 'Standard check-in (70% lumbar 7.5, 15% knee 5.0, 15% neck 5.0)';
            }
            sorenessLevel = 'Mild';
            activeMoodTags = ['OK'];
        } else if (presetKey === 'hydro') {
            targetAreas = [
                { area: 'Right Lumbar', percent: 75, score: 6.0 },
                { area: 'Neck / Cervical', percent: 25, score: 4.5 }
            ];
            sorenessLevel = 'Mild';
            activeMoodTags = ['Calm'];
            activeModifiers = ['Hydrotherapy'];
            noteText = 'Good hydrotherapy session, water decompression relief';
        } else if (presetKey === 'thoracic') {
            targetAreas = [
                { area: 'Thoracic', percent: 70, score: 7.5 },
                { area: 'Neck / Cervical', percent: 15, score: 7.5 },
                { area: 'Scapula', percent: 15, score: 7.5 }
            ];
            sorenessLevel = 'Moderate';
            activeMoodTags = ['OK'];
            noteText = 'Thoracic strain & fatigue (70% thoracic, 15% neck, 15% scapula @ 7.5)';
        } else if (presetKey === 'sciatica') {
            targetAreas = [
                { area: 'Sciatica', percent: 100, score: 9.5 }
            ];
            sorenessLevel = 'Extreme';
            activeMoodTags = ['Frustrated'];
            noteText = 'Sciatica pain attack flare, sharp radiating nerve pain';
        } else if (presetKey === 'post_walk') {
            targetAreas = [
                { area: 'Right Lumbar', percent: 70, score: 7.5 },
                { area: 'Right Knee', percent: 30, score: 6.5 }
            ];
            sorenessLevel = 'Moderate';
            activeMoodTags = ['Frustrated'];
            activeModifiers = ['Walking'];
            noteText = 'Post-walk loading flare, lumbar and lower extremity fatigue';
        } else if (presetKey === 'morning_stiffness') {
            targetAreas = [
                { area: 'Right Lumbar', percent: 60, score: 7.0 },
                { area: 'Thoracic', percent: 40, score: 6.5 }
            ];
            sorenessLevel = 'Moderate';
            activeMoodTags = ['OK'];
            noteText = 'Severe morning stiffness, slow mobility';
        } else if (presetKey === 'neck_shoulder') {
            targetAreas = [
                { area: 'Neck / Cervical', percent: 60, score: 7.5 },
                { area: 'Right Shoulder', percent: 40, score: 6.5 }
            ];
            sorenessLevel = 'Moderate';
            activeMoodTags = ['Frustrated'];
            noteText = 'Cervical/trapezius spasm, guarding';
        } else if (presetKey === 'white_fingers') {
            targetAreas = [
                { area: 'Neck / Cervical', percent: 50, score: 7.5 },
                { area: 'Sciatica', percent: 50, score: 7.0 }
            ];
            sorenessLevel = 'Moderate';
            activeMoodTags = ['Anxious'];
            noteText = 'Index fingertip pallor and numbness on cold exposure, radicular flare';
        } else if (presetKey === 'rest_day') {
            targetAreas = [
                { area: 'Right Lumbar', percent: 100, score: 3.5 }
            ];
            sorenessLevel = 'None';
            activeMoodTags = ['Calm', 'Happy'];
            noteText = 'Rest day, managed baseline pain';
        }

        // Stage into form state
        selectedPainAreas = targetAreas;
        renderPainModal();

        // Update soreness chips
        document.querySelectorAll('#sorenessChipsRow .soreness-chip').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-soreness') === sorenessLevel);
        });

        // Update mood tags
        document.querySelectorAll('#moodTagsRow .mood-tag-chip').forEach(btn => {
            btn.classList.toggle('active', activeMoodTags.includes(btn.getAttribute('data-mood')));
        });

        // Update modifier chips
        document.querySelectorAll('#modifiersChipsRow .modifier-chip').forEach(btn => {
            btn.classList.toggle('active', activeModifiers.includes(btn.getAttribute('data-mod')));
        });

        // Recalculate mood
        manualMoodOverride = null;
        recalculateMood();

        // Stage notes
        if (noteText) {
            appendNoteChipText(noteText);
        }

        showToast(`Staged preset: ${presetKey.replace(/_/g, ' ').toUpperCase()} (tap "Save pain log" when ready)`, 'info');
    }

    document.querySelectorAll('.quick-pain-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            if (preset) stagePainPreset(preset);
        });
    });"""

MACRODROID_BANNER_LOGIC = """    // --- MacroDroid Weekly Thursday Banner Check ---
    function checkMacroDroidBanner() {
        const banner = document.getElementById('macrodroidBanner');
        const doneBtn = document.getElementById('btnDoneMacroDroid');
        if (!banner) return;

        // Current time in Australia/Melbourne
        const now = new Date();
        const melbourneFormatter = new Intl.DateTimeFormat('en-AU', {
            timeZone: 'Australia/Melbourne',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        const parts = melbourneFormatter.formatToParts(now);
        let melbYear = now.getFullYear();
        let melbMonth = now.getMonth() + 1;
        let melbDay = now.getDate();
        let melbWeekday = '';
        let melbHour = 0;

        parts.forEach(p => {
            if (p.type === 'year') melbYear = parseInt(p.value, 10);
            if (p.type === 'month') melbMonth = parseInt(p.value, 10);
            if (p.type === 'day') melbDay = parseInt(p.value, 10);
            if (p.type === 'weekday') melbWeekday = p.value;
            if (p.type === 'hour') melbHour = parseInt(p.value, 10);
        });

        // Compute ISO Week
        const melbDate = new Date(Date.UTC(melbYear, melbMonth - 1, melbDay));
        const dayNr = (melbDate.getUTCDay() + 6) % 7; // Mon=0, Thu=3, Sun=6
        melbDate.setUTCDate(melbDate.getUTCDate() - dayNr + 3);
        const firstThu = melbDate.valueOf();
        melbDate.setUTCMonth(0, 1);
        if (melbDate.getUTCDay() !== 4) {
            melbDate.setUTCMonth(0, 1 + ((4 - melbDate.getUTCDay()) + 7) % 7);
        }
        const isoWeekNum = 1 + Math.ceil((firstThu - melbDate.valueOf()) / 604800000);
        const isoWeekKey = `${melbYear}-W${String(isoWeekNum).padStart(2, '0')}`;

        // Active starting Thursday 10:00 AM Australia/Melbourne through end of ISO week
        const isThuActive = (melbWeekday.startsWith('Thu') || melbWeekday.startsWith('Thur')) && melbHour >= 10;
        const isLaterDayActive = melbWeekday.startsWith('Fri') || melbWeekday.startsWith('Sat') || melbWeekday.startsWith('Sun');
        const isTriggerTime = isThuActive || isLaterDayActive;

        const dismissedWeek = localStorage.getItem('macrodroid_banner_dismissed_week') || localStorage.getItem('macrodroid_dismissed_week');

        if (isTriggerTime && dismissedWeek !== isoWeekKey) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }

        if (doneBtn && !doneBtn.dataset.wired) {
            doneBtn.dataset.wired = 'true';
            doneBtn.addEventListener('click', () => {
                localStorage.setItem('macrodroid_banner_dismissed_week', isoWeekKey);
                localStorage.setItem('macrodroid_dismissed_week', isoWeekKey);
                banner.classList.add('hidden');
                showToast('MacroDroid reminder marked Done for this week', 'success');
            });
        }
    }

    checkMacroDroidBanner();
    setInterval(checkMacroDroidBanner, 60000);
"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace the old quick notes / autoLogQuickPreset block
    # Search for: // Quick Note Chips ... renderPainModal();
    old_block_pattern = re.compile(
        r"// Quick Note Chips[\s\S]*?document\.querySelectorAll\('\.quick-pain-btn'\)\.forEach\(btn => \{[\s\S]*?\}\);\s*",
        re.MULTILINE
    )

    if old_block_pattern.search(content):
        content = old_block_pattern.sub(NEW_PAIN_LOGIC + "\n\n", content, count=1)
        print(f"Replaced quick notes and preset block in {filepath}")
    else:
        print(f"WARNING: old block pattern not found in {filepath}")

    # 2. Update moodNumButtons click handler around line 6764
    old_mood_nums = re.compile(
        r"moodNumButtons\.forEach\(btn => \{\s*btn\.addEventListener\('click', \(\) => \{\s*moodNumButtons\.forEach\(b => b\.classList\.remove\('active'\)\);\s*btn\.classList\.add\('active'\);\s*currentMoodLevel = parseInt\(btn\.getAttribute\('data-val'\), 10\);\s*moodValDisplay\.innerText = currentMoodLevel;\s*\}\);\s*\}\);",
        re.MULTILINE
    )
    new_mood_nums = """moodNumButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseFloat(btn.getAttribute('data-val'));
            manualMoodOverride = isNaN(val) ? 5.0 : val;
            if (typeof recalculateMood === 'function') {
                recalculateMood();
            } else {
                currentMoodLevel = manualMoodOverride;
                if (moodValDisplay) moodValDisplay.innerText = currentMoodLevel;
            }
        });
    });"""

    if old_mood_nums.search(content):
        content = old_mood_nums.sub(new_mood_nums, content, count=1)
        print(f"Updated moodNumButtons in {filepath}")
    else:
        print(f"WARNING: moodNumButtons pattern not found in {filepath}")

    # 3. Add MacroDroid banner logic at the bottom before closing "});"
    if "checkMacroDroidBanner()" not in content:
        # Find last "});"
        last_brace_idx = content.rfind("});")
        if last_brace_idx != -1:
            content = content[:last_brace_idx] + "\n" + MACRODROID_BANNER_LOGIC + "\n" + content[last_brace_idx:]
            print(f"Added MacroDroid banner logic to {filepath}")
        else:
            print(f"WARNING: Could not find closing brace in {filepath}")

    # 4. Also call recalculateMood() in btnOpenPainLog listener
    content = content.replace("renderPainModal();\n        if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();",
                              "renderPainModal();\n        if (typeof recalculateMood === 'function') recalculateMood();\n        if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file("dashboard/public/app.js")
update_file("dashboard/app.js")
print("Done!")

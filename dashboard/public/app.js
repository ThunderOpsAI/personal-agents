document.addEventListener('DOMContentLoaded', () => {
    
    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // --- API Endpoints ---
    const API_BASE = (window.NEXT_PUBLIC_API_URL) || (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || '';
    const API_REFLECTION_USAGE = `${API_BASE}/api/v1/reflection/usage`;
    const API_AGENDA_COMPLETE = `${API_BASE}/api/v1/protocols/complete`;
    const API_PAIN_LOG = `${API_BASE}/api/v1/pain/log`;
    const API_LATEST_SYMPTOMS = `${API_BASE}/api/v1/symptoms/latest`;
    const API_RUMBLE_CHAT = `${API_BASE}/api/v1/rumble/chat`;
    const API_NOTES = `${API_BASE}/api/v1/notes`;
    const API_OPS_SYNC = `${API_BASE}/api/v1/retrieval/scan`;
    const API_WEATHER = `${API_BASE}/api/v1/weather/forecast`;
    const API_LEARN_TOPIC = `${API_BASE}/api/v1/learn/topic`;
    const API_LEARN_ROTATE = `${API_BASE}/api/v1/learn/rotate`;
    const API_AGENDA = `${API_BASE}/api/v1/agenda`;
    const API_HEALTHZ = `${API_BASE}/healthz`;
    const API_BUDGET = `${API_BASE}/api/v1/budget`;
    const API_BUDGET_SUMMARY = `${API_BASE}/api/v1/budget/summary`;
    const API_EXERCISE_SUGGEST = `${API_BASE}/api/v1/exercises/suggest`;
    const API_EXERCISE_RELIEF = `${API_BASE}/api/v1/rehab/complete`;
    const API_EXERCISE_REJECT = `${API_BASE}/api/v1/rehab/dismiss`;


    // --- DOM Elements ---
    const alertBanner = document.getElementById('alertBanner');
    const alertBannerText = document.getElementById('alertBannerText');
    const weatherWidget = document.getElementById('weatherWidget');
    
    const croWidget = document.getElementById('croWidget');
    const croMessage = document.getElementById('croMessage');
    const croActions = document.getElementById('croActions');
    const btnDismissCro = document.getElementById('btnDismissCro');
    const btnAcceptCro = document.getElementById('btnAcceptCro');
    const btnDiscussCro = document.getElementById('btnDiscussCro');
    
    const btnOpenRumbleChat = document.getElementById('btnOpenRumbleChat');
    const btnSyncOps = document.getElementById('btnSyncOps');
    const btnOpenNotes = document.getElementById('btnOpenNotes');
    const btnOpenPainLog = document.getElementById('btnOpenPainLog');
    const btnOpenExercises = document.getElementById('btnOpenExercises');
    
    const agendaStream = document.getElementById('agendaStream');
    const weeklyAgendaList = document.getElementById('weeklyAgendaList');
    const monthlyAgendaList = document.getElementById('monthlyAgendaList');

    // Continuous Learning Card Elements
    const learnCategoryTag = document.getElementById('learnCategoryTag');
    const learnTitleText = document.getElementById('learnTitleText');
    const learnSummaryText = document.getElementById('learnSummaryText');
    const btnLearnMore = document.getElementById('btnLearnMore');
    const btnLearnDifferent = document.getElementById('btnLearnDifferent');
    const btnChooseLearnTopic = document.getElementById('btnChooseLearnTopic');
    const chooseLearnModal = document.getElementById('chooseLearnModal');
    const learnTopicInput = document.getElementById('learnTopicInput');

    // Learn Modal Elements
    const learnModal = document.getElementById('learnModal');
    const btnCloseLearnModal = document.getElementById('btnCloseLearnModal');
    const btnCloseLearnDone = document.getElementById('btnCloseLearnDone');
    const btnRotateTopicInsideModal = document.getElementById('btnRotateTopicInsideModal');
    const modalLearnTitle = document.getElementById('modalLearnTitle');
    const modalLearnCategory = document.getElementById('modalLearnCategory');
    const modalLearnDetails = document.getElementById('modalLearnDetails');
    const modalLearnTable = document.getElementById('modalLearnTable').querySelector('tbody');
    
    const notesModal = document.getElementById('notesModal');
    const btnCloseNotes = document.getElementById('btnCloseNotes');
    const notesArea = document.getElementById('notesArea');
    const btnSaveNotes = document.getElementById('btnSaveNotes');
    const btnAskRumbleNote = document.getElementById('btnAskRumbleNote');
    const notesStatus = document.getElementById('notesStatus');
    
    // Logger Elements
    const painValDisplay = document.getElementById('painValDisplay');
    const moodValDisplay = document.getElementById('moodValDisplay');
    const painNumButtons = document.querySelectorAll('.pain-num');
    const moodNumButtons = document.querySelectorAll('.mood-num');
    
    const painAreaSelect = document.getElementById('painAreaSelect');
    const painSideSelect = document.getElementById('painSideSelect');
    const unifiedNotesInput = document.getElementById('unifiedNotesInput');
    const btnLogPain = document.getElementById('btnLogPain');
    const painLogModal = document.getElementById('painLogModal');
    const btnClosePainLog = document.getElementById('btnClosePainLog');
    const btnCancelPainLog = document.getElementById('btnCancelPainLog');
    const btnAddPainLocation = document.getElementById('btnAddPainLocation');
    const painLocations = document.getElementById('painLocations');
    const painWeightTotal = document.getElementById('painWeightTotal');
    const moodEmojiButtons = document.querySelectorAll('.mood-emoji');
    let selectedMoodEmoji = 'Neutral';

    // Add Area Modal Elements
    const addAreaModal = document.getElementById('addAreaModal');
    const btnOpenAddAreaModal = document.getElementById('btnOpenAddAreaModal');
    const btnCloseAddArea = document.getElementById('btnCloseAddArea');
    const btnCancelAddArea = document.getElementById('btnCancelAddArea');
    const btnSaveCustomArea = document.getElementById('btnSaveCustomArea');
    const customAreaName = document.getElementById('customAreaName');
    const customAreaSide = document.getElementById('customAreaSide');
    const customAreaNotes = document.getElementById('customAreaNotes');

    const exerciseModal = document.getElementById('exerciseModal');
    const exerciseSuggestions = document.getElementById('exerciseSuggestions');
    const btnCloseExercises = document.getElementById('btnCloseExercises');

    // Exercise Demo UI removed in favor of runnerModal

    const reliefModal = document.getElementById('reliefModal');
    const btnCloseRelief = document.getElementById('btnCloseRelief');
    const btnSkipRelief = document.getElementById('btnSkipRelief');
    const btnSaveRelief = document.getElementById('btnSaveRelief');
    const afterPainScore = document.getElementById('afterPainScore');
    const reliefExerciseName = document.getElementById('reliefExerciseName');
    let pendingProtocol = null;

    const runnerModal = document.getElementById('runnerModal');
    const btnCancelRunner = document.getElementById('btnCancelRunner');
    const btnNextStep = document.getElementById('btnNextStep');
    const runnerTimer = document.getElementById('runnerTimer');
    const runnerStep = document.getElementById('runnerStep');

    // RUMBLE Chat Modal Elements
    const rumbleChatModal = document.getElementById('rumbleChatModal');
    const btnCloseRumbleChat = document.getElementById('btnCloseRumbleChat');
    const rumbleChatMessages = document.getElementById('rumbleChatMessages');
    const rumbleChatInput = document.getElementById('rumbleChatInput');
    const btnSendRumbleChat = document.getElementById('btnSendRumbleChat');
    const btnRumbleVoice = document.getElementById('btnRumbleVoice');

    let currentPainLevel = 0;
    let currentMoodLevel = 5;
    let currentProposalText = "";
    let currentLearnTopic = null;
    
    const customAreaContextMap = {};

    // --- Server Status Checker ---
    async function checkServerHealth() {
        try {
            const res = await fetch(API_HEALTHZ, { method: 'GET' });
            if (!res.ok) throw new Error("Offline");
            btnSyncOps.classList.remove('btn-offline');
            if (btnSyncOps.innerText === 'Offline') {
                btnSyncOps.innerText = 'Sync';
            }
        } catch (e) {
            btnSyncOps.classList.add('btn-offline');
            btnSyncOps.innerText = 'Offline';
        }
    }
    setInterval(checkServerHealth, 10000);
    checkServerHealth();

    // --- Weather Loader ---
    async function loadWeather() {
        try {
            const res = await fetch(API_WEATHER);
            if (res.ok) {
                const data = await res.json();
                if (data.temp_c !== null && data.temp_c !== undefined) {
                    const washDays = (data.forecast || []).slice().sort((a, b) => a.precipitation_probability_pct - b.precipitation_probability_pct).slice(0, 2).map(day => day.date).join(' and ');
                    weatherWidget.innerHTML = `<span class="weather-text">Wangaratta: ${data.temp_c}°C • Rain now ${data.rain_probability_pct}% • Wash: ${washDays || 'forecast unavailable'}</span>`;
                } else {
                    weatherWidget.innerHTML = `<span class="weather-text">Weather: Offline</span>`;
                }
            }
        } catch (e) {
            weatherWidget.innerHTML = `<span class="weather-text">Weather: Offline</span>`;
        }
    }
    loadWeather();

    // --- Agenda Loader ---
    async function loadAgenda() {
        try {
            const res = await fetch(API_AGENDA);
            if (res.ok) {
                const data = await res.json();
                cachedAgendaData = data;
                
                if (isTomorrowView) {
                    renderTomorrowAgenda();
                    return;
                }

                renderTodayAgenda(data);
            }
        } catch (e) {
            showToast('Failed to load agenda');
            console.error(e);
        }
    }

    function renderTodayAgenda(data) {
        if (dailyAgendaTitle) dailyAgendaTitle.innerText = "Daily Agenda";
        if (agendaDateIndicator) agendaDateIndicator.innerText = "Today";
        if (tomorrowBanner) tomorrowBanner.classList.add('hidden');
        if (btnTomorrowText) btnTomorrowText.innerText = "Continue to Tomorrow's Agenda";
        if (btnTomorrowIcon) btnTomorrowIcon.innerHTML = "&rarr;";

        const dailyItems = data.daily || [];
        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = `${dailyItems.length} Items`;
        
        // Clear existing dynamic cards (leave #protocol-learn)
        document.querySelectorAll('.protocol-card:not(#protocol-learn)').forEach(c => c.remove());

        if (dailyItems.length > 0) {
            dailyItems.forEach(item => {
                if (item.item_type === 'learning' || item.id === 'protocol-learn') return;
                const isCompleted = item.status === 'completed';
                const isDismissed = item.status === 'dismissed';
                if (isDismissed) return;

                const card = document.createElement('div');
                card.className = `protocol-card glass-panel${isCompleted ? ' completed' : ''}`;
                card.id = `protocol-${item.id}`;
                card.innerHTML = `
                    <div class="protocol-info">
                        <h3>${item.time}</h3>
                        <p>${item.title}</p>
                        ${item.choices ? `<small class="form-hint">Choices: ${item.choices.join(' · ')}</small>` : ''}
                    </div>
                    <div class="protocol-actions">
                        <button class="btn btn-neon-purple btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>Show Me</button>
                        <button class="btn btn-neon-green btn-done" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Done' : 'Done'}</button>
                        <button class="btn btn-outline btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? '' : 'disabled'}>Dismiss</button>
                    </div>
                `;
                agendaStream.appendChild(card);
                attachCardEvents(card);
            });
        }
        
        const cards = Array.from(agendaStream.querySelectorAll('.protocol-card'));
        cards.sort((a, b) => {
            const timeStrA = a.querySelector('h3').innerText.trim();
            const timeStrB = b.querySelector('h3').innerText.trim();
            const parseTime = (str) => {
                const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return 0;
                let h = parseInt(match[1]);
                let m = parseInt(match[2]);
                let ampm = match[3].toUpperCase();
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return parseTime(timeStrA) - parseTime(timeStrB);
        });
        cards.forEach(c => agendaStream.appendChild(c));

        renderWeeklyCalendarList(data);
        renderMonthlyCalendarList(data);
    }

    function renderWeeklyCalendarList(data) {
        if (!weeklyAgendaList) return;
        weeklyAgendaList.innerHTML = '';
        if (data.weekly && data.weekly.length > 0) {
            data.weekly.forEach(w => {
                const div = document.createElement('div');
                div.className = 'agenda-item clickable';
                div.innerHTML = `
                    <span class="agenda-date">${w.day || w.date}</span>
                    <span class="agenda-text" style="flex: 1;">${w.title}</span>
                    <span class="badge neon-blue" style="font-size: 0.72rem; padding: 2px 6px;">${w.time || 'Google Cal'}</span>
                `;
                div.addEventListener('click', () => openCalendarEventView(w));
                weeklyAgendaList.appendChild(div);
            });
        } else if (data.calendar_status === 'auth_required') {
            weeklyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text" style="color: var(--neon-blue);">Google Calendar authorization required to sync live events.</span></div>`;
        } else {
            weeklyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text">No calendar events scheduled this week.</span></div>`;
        }
    }

    function renderMonthlyCalendarList(data) {
        if (!monthlyAgendaList) return;
        monthlyAgendaList.innerHTML = '';
        if (data.monthly && data.monthly.length > 0) {
            data.monthly.forEach(m => {
                const div = document.createElement('div');
                div.className = 'agenda-item clickable';
                div.innerHTML = `
                    <span class="agenda-date">${m.date}</span>
                    <span class="agenda-text" style="flex: 1;">${m.title}</span>
                    <span class="badge neon-purple" style="font-size: 0.72rem; padding: 2px 6px;">${m.time || 'Monthly'}</span>
                `;
                div.addEventListener('click', () => openCalendarEventView(m));
                monthlyAgendaList.appendChild(div);
            });
        } else if (data.calendar_status === 'auth_required') {
            monthlyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text" style="color: var(--neon-purple);">Google Calendar authorization required.</span></div>`;
        } else {
            monthlyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text">No calendar events scheduled this month.</span></div>`;
        }
    }

    function renderTomorrowAgenda() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayStr = tomorrow.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        
        if (tomorrowDateSub) tomorrowDateSub.innerText = `${dayStr} • Prepare and review upcoming tasks`;
        if (dailyAgendaTitle) dailyAgendaTitle.innerText = "Tomorrow's Agenda";
        if (agendaDateIndicator) agendaDateIndicator.innerText = "Tomorrow (Prep Mode)";
        if (tomorrowBanner) tomorrowBanner.classList.remove('hidden');
        if (btnTomorrowText) btnTomorrowText.innerText = "Return to Today's Agenda";
        if (btnTomorrowIcon) btnTomorrowIcon.innerHTML = "&larr;";
        
        // Remove non-learning cards
        document.querySelectorAll('.protocol-card:not(#protocol-learn)').forEach(c => c.remove());
        
        const tomorrowProtocols = [
            { id: 'tom_retrieval_0600', time: '06:00 AM', title: 'Automated Retrieval: Scrape Gmail & Calendar', item_type: 'retrieval', status: 'pending' },
            { id: 'tom_yoga_0900', time: '09:00 AM', title: 'Adaptive Morning Yoga Routine (3 Options Dynamic)', item_type: 'yoga', status: 'pending', choices: ['Hip Flow', 'Lumbar Core', 'Shoulder Rehab'] },
            { id: 'tom_hydro_1030', time: '10:30 AM', title: 'Hydrotherapy Session (Rumble Target: 3/week)', item_type: 'hydrotherapy', status: 'pending' },
            { id: 'tom_wash_1300', time: '01:00 PM', title: 'Weather-Optimized Washing (Lowest Precip Window)', item_type: 'washing', status: 'pending' },
            { id: 'tom_email_1400', time: '02:00 PM', title: 'Automated Afternoon Email & Calendar Scrape', item_type: 'retrieval', status: 'pending' },
            { id: 'tom_med_2100', time: '09:00 PM', title: 'Evening Meditation Protocol & Somatic Unwind', item_type: 'meditation', status: 'pending' },
            { id: 'tom_rest_0000', time: '12:00 AM', title: 'Midnight Restorative Decompression', item_type: 'meditation', status: 'pending' }
        ];

        // Also append any tomorrow calendar events
        if (cachedAgendaData?.weekly) {
            const tomShort = tomorrow.toLocaleDateString('en-AU', { weekday: 'short' });
            cachedAgendaData.weekly.forEach(w => {
                if ((w.day || '').includes(tomShort)) {
                    tomorrowProtocols.push({
                        id: w.id || `tom_cal_${Date.now()}`,
                        time: w.time || '10:00 AM',
                        title: `Calendar: ${w.title}`,
                        item_type: 'calendar_event',
                        status: 'pending'
                    });
                }
            });
        }
        
        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = `${tomorrowProtocols.length + 1} Items (Prep)`;
        
        tomorrowProtocols.forEach(item => {
            const card = document.createElement('div');
            card.className = 'protocol-card glass-panel';
            card.id = `protocol-${item.id}`;
            card.innerHTML = `
                <div class="protocol-info">
                    <h3>${item.time} <span class="badge neon-blue" style="font-size: 0.72rem;">Tomorrow</span></h3>
                    <p>${item.title}</p>
                    ${item.choices ? `<small class="form-hint">Choices: ${item.choices.join(' · ')}</small>` : ''}
                </div>
                <div class="protocol-actions">
                    <button class="btn btn-neon-purple btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}">Preview</button>
                    <button class="btn btn-neon-green btn-done" data-id="${item.id}" data-type="${item.item_type || ''}">Pre-Done</button>
                    <button class="btn btn-outline btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}">Dismiss</button>
                </div>
            `;
            agendaStream.appendChild(card);
            attachCardEvents(card);
        });
        
        showToast('Tomorrow\'s agenda prep loaded', 'info');
    }

    // Tomorrow Agenda Toggle Listeners
    if (btnTomorrowAgenda) {
        btnTomorrowAgenda.addEventListener('click', () => {
            isTomorrowView = !isTomorrowView;
            if (isTomorrowView) {
                renderTomorrowAgenda();
            } else if (cachedAgendaData) {
                renderTodayAgenda(cachedAgendaData);
            } else {
                loadAgenda();
            }
        });
    }

    if (btnReturnToday) {
        btnReturnToday.addEventListener('click', () => {
            isTomorrowView = false;
            if (cachedAgendaData) {
                renderTodayAgenda(cachedAgendaData);
            } else {
                loadAgenda();
            }
        });
    }

    // --- Google Calendar Interactive View & Edit Engine ---
    function openCalendarEventView(event) {
        activeCalendarEvent = event;
        if (!calendarEventViewModal) return;

        if (viewCalEventTitle) viewCalEventTitle.innerText = event.title || event.summary || 'Calendar Event';
        if (viewCalEventBadge) viewCalEventBadge.innerText = event.source === 'google_calendar' ? 'Google Calendar' : 'Rumble Schedule';
        if (viewCalEventStatus) viewCalEventStatus.innerText = 'Confirmed';
        
        const whenText = `${event.day || event.date || 'Today'} ${event.time ? '• ' + event.time : ''}`;
        if (viewCalEventWhen) viewCalEventWhen.innerText = whenText;

        if (event.location) {
            if (viewCalEventLocationRow) viewCalEventLocationRow.style.display = 'block';
            if (viewCalEventLocation) viewCalEventLocation.innerText = event.location;
        } else {
            if (viewCalEventLocationRow) viewCalEventLocationRow.style.display = 'none';
        }

        if (viewCalEventDesc) {
            viewCalEventDesc.innerText = event.description || event.desc || 'No additional notes provided.';
        }

        calendarEventViewModal.classList.remove('hidden');
    }

    function openCalendarEventEdit(event) {
        if (!calendarEventEditModal) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        if (calEventId) calEventId.value = event?.id || '';
        if (calInputTitle) calInputTitle.value = event?.title || event?.summary || '';
        if (calInputDate) calInputDate.value = event?.rawDate || todayStr;
        if (calInputLocation) calInputLocation.value = event?.location || '';
        if (calInputStartTime) calInputStartTime.value = event?.startTime || '09:00';
        if (calInputEndTime) calInputEndTime.value = event?.endTime || '10:00';
        if (calInputDesc) calInputDesc.value = event?.description || event?.desc || '';
        
        if (editCalModalTitle) {
            editCalModalTitle.innerText = event?.id ? 'Edit Calendar Event' : 'Add Calendar Event';
        }

        if (calendarEventViewModal) calendarEventViewModal.classList.add('hidden');
        calendarEventEditModal.classList.remove('hidden');
    }

    if (btnCloseCalView) btnCloseCalView.addEventListener('click', () => calendarEventViewModal.classList.add('hidden'));
    if (btnDoneCalView) btnDoneCalView.addEventListener('click', () => calendarEventViewModal.classList.add('hidden'));
    
    if (btnEditCalendarEvent) {
        btnEditCalendarEvent.addEventListener('click', () => {
            if (activeCalendarEvent) openCalendarEventEdit(activeCalendarEvent);
        });
    }

    if (btnDeleteCalendarEvent) {
        btnDeleteCalendarEvent.addEventListener('click', async () => {
            if (!activeCalendarEvent) return;
            const confirmDelete = confirm(`Are you sure you want to delete the event: "${activeCalendarEvent.title || activeCalendarEvent.summary}"?`);
            if (!confirmDelete) return;

            try {
                const res = await fetch(`${API_CALENDAR_EVENTS}?eventId=${encodeURIComponent(activeCalendarEvent.id)}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    showToast('Event deleted from Calendar', 'info');
                    calendarEventViewModal.classList.add('hidden');
                    loadAgenda();
                } else {
                    showToast('Failed to delete event');
                }
            } catch (err) {
                showToast('Error deleting calendar event');
                console.error(err);
            }
        });
    }

    if (btnAddWeeklyEvent) {
        btnAddWeeklyEvent.addEventListener('click', () => openCalendarEventEdit(null));
    }

    if (btnAddMonthlyEvent) {
        btnAddMonthlyEvent.addEventListener('click', () => openCalendarEventEdit(null));
    }

    if (btnCloseCalEdit) btnCloseCalEdit.addEventListener('click', () => calendarEventEditModal.classList.add('hidden'));
    if (btnCancelCalEdit) btnCancelCalEdit.addEventListener('click', () => calendarEventEditModal.classList.add('hidden'));

    if (calEventForm) {
        calEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = calEventId.value.trim();
            const title = calInputTitle.value.trim();
            const date = calInputDate.value;
            const startTime = calInputStartTime.value;
            const endTime = calInputEndTime.value;
            const location = calInputLocation.value.trim();
            const desc = calInputDesc.value.trim();

            if (!title || !date || !startTime || !endTime) {
                showToast('Please fill in all required fields.');
                return;
            }

            const startIso = `${date}T${startTime}:00+10:00`;
            const endIso = `${date}T${endTime}:00+10:00`;

            const payload = {
                eventId: id || undefined,
                summary: title,
                description: desc,
                location: location,
                start: startIso,
                end: endIso,
            };

            try {
                const res = await fetch(API_CALENDAR_EVENTS, {
                    method: id ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast(id ? 'Calendar event updated!' : 'Calendar event created!', 'info');
                    calendarEventEditModal.classList.add('hidden');
                    loadAgenda();
                } else {
                    const errData = await res.json().catch(() => ({}));
                    showToast(errData.message || 'Failed to save calendar event');
                }
            } catch (err) {
                showToast('Network error saving calendar event');
                console.error(err);
            }
        });
    }

    // --- Continuous Learning Topic Engine ---
    async function loadLearnTopic() {
        try {
            const res = await fetch(API_LEARN_TOPIC);
            if (res.ok) {
                const data = await res.json();
                updateLearnCard(data.topic);
            }
        } catch (e) {
            showToast('Failed to load learn topic');
            console.error(e);
        }
    }

    function updateLearnCard(topic) {
        currentLearnTopic = topic;
        if (!topic) return;
        learnCategoryTag.innerText = topic.category;
        learnTitleText.innerText = `Learn: ${topic.title}`;
        learnSummaryText.innerText = topic.summary;
    }

    async function rotateLearnTopic() {
        btnLearnDifferent.innerText = "Rotating...";
        try {
            const res = await fetch(API_LEARN_ROTATE, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                updateLearnCard(data.topic);
            }
        } catch (e) {
            showToast('Failed to rotate learn topic');
            console.error(e);
        }
        setTimeout(() => { btnLearnDifferent.innerText = "Learn Something Different"; }, 600);
    }

    btnLearnDifferent.addEventListener('click', rotateLearnTopic);
    btnChooseLearnTopic.addEventListener('click', () => chooseLearnModal.classList.remove('hidden'));
    document.getElementById('btnCloseChooseLearn').addEventListener('click', () => chooseLearnModal.classList.add('hidden'));
    document.getElementById('btnCancelChooseLearn').addEventListener('click', () => chooseLearnModal.classList.add('hidden'));
    document.getElementById('btnSaveChooseLearn').addEventListener('click', async () => {
        const topic = learnTopicInput.value.trim();
        if (!topic) return showToast('Enter a topic to continue');
        const response = await fetch(`${API_BASE}/api/v1/learn/topic`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({topic}) });
        if (!response.ok) return showToast('Could not save learning topic');
        updateLearnCard((await response.json()).topic);
        chooseLearnModal.classList.add('hidden');
        learnTopicInput.value = '';
    });

    function openLearnModal() {
        if (!currentLearnTopic) return;
        modalLearnCategory.innerText = currentLearnTopic.category;
        modalLearnTitle.innerText = currentLearnTopic.title;
        modalLearnDetails.innerText = currentLearnTopic.details;

        modalLearnTable.innerHTML = '';
        if (currentLearnTopic.table) {
            currentLearnTopic.table.forEach(row => {
                const tr = document.createElement('tr');
                const keys = Object.keys(row);
                tr.innerHTML = `<td><strong>${row[keys[0]]}</strong></td><td>${row[keys[1]] || row[keys[2]] || 'N/A'}</td>`;
                modalLearnTable.appendChild(tr);
            });
        }
        learnModal.classList.remove('hidden');
    }

    btnLearnMore.addEventListener('click', openLearnModal);
    btnCloseLearnModal.addEventListener('click', () => learnModal.classList.add('hidden'));
    btnCloseLearnDone.addEventListener('click', () => learnModal.classList.add('hidden'));
    btnRotateTopicInsideModal.addEventListener('click', async () => {
        await rotateLearnTopic();
        openLearnModal();
    });

    loadLearnTopic();

    // --- 1. Rumble Insights & Chat ("Discuss" & "Rumble" Header Button) ---
    async function loadRumbleInsights() {
        try {
            const response = await fetch(API_REFLECTION_USAGE);
            if (response.ok) {
                const data = await response.json();
                currentProposalText = data.proposal || "Chief Rumble Officer engine ready.";
                croMessage.innerText = `Proposal: ${currentProposalText}`;
            } else {
                croMessage.innerText = "Insights engine active.";
            }
            croActions.classList.remove('hidden');
        } catch (error) {
            croMessage.innerText = "Insights engine active.";
            croActions.classList.remove('hidden');
        }
    }
    
    btnDismissCro.addEventListener('click', () => {
        croWidget.style.display = 'none';
    });
    
    btnAcceptCro.addEventListener('click', () => {
        croMessage.innerText = "Proposal accepted and integrated into Daily Agenda.";
        croActions.classList.add('hidden');
        setTimeout(() => { croWidget.style.display = 'none'; }, 2000);
    });

    btnDiscussCro.addEventListener('click', () => {
        rumbleChatModal.classList.remove('hidden');
    });

    btnOpenRumbleChat.addEventListener('click', () => {
        rumbleChatModal.classList.remove('hidden');
    });

    btnCloseRumbleChat.addEventListener('click', () => {
        rumbleChatModal.classList.add('hidden');
    });

    let pendingChatAction = null;
    let chatHistory = [];


    async function sendRumbleChatMessage(textToSend, explicitAction) {
        const msg = (textToSend || rumbleChatInput.value).trim();
        if (!msg) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.innerHTML = `<strong>You:</strong> ${msg}`;
        rumbleChatMessages.appendChild(userDiv);
        rumbleChatInput.value = '';
        rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

        const isConfirmation = explicitAction || (pendingChatAction && /^(?:yes|confirm|confirmed|save|commit|proceed|do it|add it)\b/i.test(msg));
        const actionToCommit = explicitAction || (isConfirmation ? pendingChatAction : null);

        const payload = {
            message: msg,
            history: chatHistory,
            proposal_context: currentProposalText,
            ...(actionToCommit ? { confirm_action: actionToCommit } : {})
        };
        
        chatHistory.push({ role: 'user', content: msg });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

        try {
            const response = await fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            chatHistory.push({ role: 'model', content: data.reply || "Understood." });
            
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> ${data.reply || "Understood."}`;

            if (data.requires_confirmation && data.preview) {
                pendingChatAction = data.preview;
                const actionsRow = document.createElement('div');
                actionsRow.style.cssText = 'margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;';
                
                const btnConfirm = document.createElement('button');
                btnConfirm.className = 'btn btn-neon-green btn-sm';
                btnConfirm.innerText = 'Confirm';
                btnConfirm.onclick = () => {
                    actionsRow.remove();
                    sendRumbleChatMessage('Confirm', data.preview);
                };

                const btnCancel = document.createElement('button');
                btnCancel.className = 'btn btn-outline btn-sm';
                btnCancel.innerText = 'Cancel';
                btnCancel.onclick = () => {
                    pendingChatAction = null;
                    actionsRow.remove();
                    const cancelNote = document.createElement('small');
                    cancelNote.style.color = 'var(--text-muted)';
                    cancelNote.innerText = 'Action cancelled.';
                    rumbleDiv.appendChild(cancelNote);
                };

                actionsRow.appendChild(btnConfirm);
                actionsRow.appendChild(btnCancel);
                rumbleDiv.appendChild(actionsRow);
            } else if (actionToCommit && data.status === 'success') {
                pendingChatAction = null;
            }

            rumbleChatMessages.appendChild(rumbleDiv);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

            if (data.intent) {
                if (data.intent === 'ADD_NOTE' && actionToCommit) {
                    if (typeof loadNotes === 'function') loadNotes();
                    showToast('Note saved to notebook', 'success');
                } else if (data.intent === 'LOG_PAIN' && actionToCommit) {
                    showToast('Pain log recorded', 'success');
                } else if (data.intent === 'ADD_TASK' && actionToCommit) {
                    if (typeof loadAgenda === 'function') loadAgenda();
                    showToast('Task added to agenda', 'success');
                } else if (data.intent === 'ADD_EXPENSE') {
                    if (typeof loadBudget === 'function') loadBudget();
                }
            }
        } catch (err) {
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> Communication error. Unable to reach backend.`;
            rumbleChatMessages.appendChild(rumbleDiv);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;
        }
    }

    btnSendRumbleChat.addEventListener('click', () => sendRumbleChatMessage());
    rumbleChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendRumbleChatMessage();
    });


    // Voice Input inside Rumble Chat Modal
    let chatRecognition = null;
    let isChatRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        chatRecognition = new SpeechRecognition();
        chatRecognition.continuous = false;
        chatRecognition.interimResults = true;

        chatRecognition.onresult = (event) => {
            let transcriptStr = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcriptStr += event.results[i][0].transcript;
            }
            rumbleChatInput.value = transcriptStr;
        };

        chatRecognition.onend = () => {
            isChatRecording = false;
            btnRumbleVoice.innerText = 'Voice';
            if (rumbleChatInput.value.trim()) {
                sendRumbleChatMessage();
            }
        };

        chatRecognition.onerror = () => {
            isChatRecording = false;
            btnRumbleVoice.innerText = 'Voice';
        };
    }

    btnRumbleVoice.addEventListener('click', () => {
        if (!chatRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isChatRecording) {
            chatRecognition.stop();
            isChatRecording = false;
            btnRumbleVoice.innerText = 'Voice';
        } else {
            rumbleChatInput.value = '';
            chatRecognition.start();
            isChatRecording = true;
            btnRumbleVoice.innerText = 'Listening...';
        }
    });

    loadRumbleInsights();

    // --- 2. Persistent Notes Modal ---
    btnOpenNotes.addEventListener('click', () => {
        notesModal.classList.remove('hidden');
        loadNotes();
    });

    function closePainLog() { painLogModal.classList.add('hidden'); }
    btnOpenPainLog.addEventListener('click', () => painLogModal.classList.remove('hidden'));
    btnClosePainLog.addEventListener('click', closePainLog);
    btnCancelPainLog.addEventListener('click', closePainLog);

    // painHistoryModal UI removed in favor of direct insights

    function updatePainWeightTotal() {
        const total = [...painLocations.querySelectorAll('.pain-percentage')]
            .reduce((sum, input) => sum + (parseInt(input.value, 10) || 0), 0);
        painWeightTotal.innerText = `Total: ${total}%`;
        painWeightTotal.classList.toggle('weight-invalid', total !== 100);
        return total;
    }

    function wirePainLocationRow(row) {
        row.querySelector('.pain-percentage').addEventListener('input', updatePainWeightTotal);
        row.querySelector('.remove-location').addEventListener('click', () => {
            if (painLocations.children.length > 1) row.remove();
            updatePainWeightTotal();
        });
    }
    wirePainLocationRow(painLocations.querySelector('.pain-location-row'));
    btnAddPainLocation.addEventListener('click', () => {
        const first = painLocations.querySelector('.pain-location-row');
        const row = first.cloneNode(true);
        row.querySelector('.pain-percentage').value = '0';
        row.querySelector('.pain-area-select').value = 'knee';
        row.querySelector('.pain-side-select').value = 'left';
        painLocations.appendChild(row);
        wirePainLocationRow(row);
        updatePainWeightTotal();
    });

    moodEmojiButtons.forEach(button => button.addEventListener('click', () => {
        moodEmojiButtons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        selectedMoodEmoji = button.dataset.emoji;
    }));

    btnCloseNotes.addEventListener('click', () => {
        notesModal.classList.add('hidden');
    });

    async function loadNotes() {
        try {
            const res = await fetch(API_NOTES);
            if (res.ok) {
                const data = await res.json();
                const container = document.getElementById('notesGrid');
                if (!container) return;
                
                container.innerHTML = '';
                
                if (data.notes && data.notes.length > 0) {
                    data.notes.forEach(note => {
                        let isPinned = false;
                        let color = 'rgba(255,255,255,0.05)';
                        
                        let noteHtml = `
                            ${isPinned ? '<div style="position: absolute; top: 10px; right: 10px; cursor: pointer;" title="Pinned">📌</div>' : ''}
                            <h4 style="margin: 0 0 8px 0; font-size: 1.1em;">${note.author === 'rumble' ? '🤖 Rumble Note' : 'Note'}</h4>
                            <p style="margin: 0; font-size: 0.9em; opacity: 0.9; white-space: pre-wrap;">${note.content}</p>
                            <small style="display:block; margin-top:10px; color:var(--text-dim); font-size:0.75rem;">${new Date(note.created_at).toLocaleDateString()}</small>
                        `;
                        
                        const noteEl = document.createElement('div');
                        noteEl.className = 'keep-note glass-panel';
                        noteEl.style.cssText = `background: ${color}; border-left: 4px solid #fff; padding: 15px; border-radius: 8px; position: relative; cursor: pointer;`;
                        noteEl.innerHTML = noteHtml;
                        
                        noteEl.addEventListener('click', () => {
                            if (window.currentEditingNote !== undefined) {
                                window.currentEditingNote = noteEl;
                                document.getElementById('editNoteTitle').value = note.author === 'rumble' ? 'Rumble Note' : 'Note';
                                document.getElementById('editNoteBody').value = note.content;
                                document.getElementById('noteEditorContainer').classList.remove('hidden');
                            }
                        });
                        
                        container.appendChild(noteEl);
                    });
                } else {
                    container.innerHTML = '<p class="form-hint" style="grid-column: 1/-1;">No notes yet.</p>';
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Notes modal event listeners removed; Keep Notes logic is at the end of the file

    loadNotes();

    // --- 3. Sync Button ---
    btnSyncOps.addEventListener('click', async () => {
        if (btnSyncOps.classList.contains('btn-offline')) return;

        btnSyncOps.innerText = "Syncing...";
        btnSyncOps.disabled = true;

        try {
            const res = await fetch(API_OPS_SYNC, { method: 'POST' });
            const data = await res.json();
            
            if (data.added_event) {
                const card = document.createElement('div');
                card.className = 'protocol-card glass-panel';
                card.id = `protocol-${data.added_event.id}`;
                card.innerHTML = `
                    <div class="protocol-info">
                        <h3>${data.added_event.time}</h3>
                        <p>${data.added_event.title}</p>
                    </div>
                    <div class="protocol-actions">
                        <button class="btn btn-neon-purple btn-show-me" data-id="${data.added_event.id}">Show Me</button>
                        <button class="btn btn-neon-green btn-done" data-id="${data.added_event.id}">Done</button>
                    </div>
                `;
                agendaStream.prepend(card);
                attachCardEvents(card);
            }
            btnSyncOps.innerText = "Synced";
            setTimeout(() => {
                btnSyncOps.innerText = "Sync";
                btnSyncOps.disabled = false;
            }, 2000);
        } catch (e) {
            btnSyncOps.innerText = "Offline";
            btnSyncOps.classList.add('btn-offline');
        }
    });

    // --- 4. Daily Agenda Cards ---
    function attachCardEvents(card) {
        const showBtn = card.querySelector('.btn-show-me');
        const doneBtn = card.querySelector('.btn-done');
        const dismissBtn = card.querySelector('.btn-dismiss');
        
        const type = showBtn?.getAttribute('data-type') || doneBtn?.getAttribute('data-type') || '';
        const id = showBtn?.getAttribute('data-id') || doneBtn?.getAttribute('data-id') || dismissBtn?.getAttribute('data-id') || '';
        
        function isExercise() {
            const t = type.toLowerCase();
            const i = id.toLowerCase();
            const title = (card.querySelector('.protocol-info p')?.innerText || '').toLowerCase();
            return t === 'yoga' || t === 'rehab' || t === 'meditation' || t === 'exercise' ||
                   i.startsWith('y') || i.includes('yoga') || i.includes('meditation') || i.includes('hydro') || i.includes('rehab') ||
                   title.includes('yoga') || title.includes('meditation');
        }

        if (showBtn) {
            showBtn.addEventListener('click', () => {
                const title = card.querySelector('.protocol-info p')?.innerText || id;
                if (isExercise()) {
                    const cleanId = id ? id.toLowerCase().trim() : '';
                    if (cleanId && (cleanId.startsWith('y') || cleanId.includes('meditation') || cleanId.includes('rehab'))) {
                        startRunnerModal(cleanId);
                    } else if (cleanId.includes('yoga')) {
                        loadExerciseSuggestions();
                    } else {
                        startRunnerModal(cleanId || 'y1');
                    }
                } else {
                    rumbleChatModal.classList.remove('hidden');
                    sendRumbleChatMessage(`Show me details for: ${title}`);
                }
            });
        }

        if (doneBtn) {
            doneBtn.addEventListener('click', async () => {
                const title = card.querySelector('.protocol-info p')?.innerText || id;
                card.classList.add('completed');
                doneBtn.innerText = "Done";
                doneBtn.disabled = true;
                if (dismissBtn) {
                    dismissBtn.disabled = false;
                }
                
                // Move greyed out card to the bottom of the daily agenda stream
                agendaStream.appendChild(card);

                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'completed' })
                    }).catch(() => {});
                }
                
                if (isExercise()) {
                    pendingProtocol = { id, name: title, beforePain: currentPainLevel || 1, card, doneBtn };
                    reliefExerciseName.innerText = pendingProtocol.name;
                    afterPainScore.value = pendingProtocol.beforePain;
                    reliefModal.classList.remove('hidden');
                }
            });
        }
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                card.remove();
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'dismissed' })
                    }).catch(() => {});
                }
            });
        }
    }

    async function finishPendingProtocol(withRelief) {
        if (!pendingProtocol) return;
        const payload = { id: pendingProtocol.id, action: 'update_status', status: 'completed' };
        try {
            const res = await fetch(API_AGENDA, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (withRelief) {
                await fetch(API_EXERCISE_RELIEF, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        routineId: pendingProtocol.id,
                        routineTitle: pendingProtocol.name,
                        prePainScore: pendingProtocol.beforePain,
                        postPainScore: parseInt(afterPainScore.value, 10),
                    })
                }).catch(() => {});
            }
            const card = pendingProtocol.card;
            reliefModal.classList.add('hidden');
            pendingProtocol = null;
            if (card) {
                card.classList.add('completed');
                agendaStream.appendChild(card);
            }
        } catch (err) {
            showToast('Failed to complete agenda item');
            console.error(err);
        }
    }


    document.querySelectorAll('.protocol-card').forEach(attachCardEvents);

    let runnerInterval;
    let frameInterval;
    let currentProtocolSteps = [];
    let currentStepIndex = 0;
    let timeLeft = 0;

    const YOGA_ROUTINES = {
        'y1': {
            title: "Gentle Lumbar Release",
            steps: [
                { title: "Cat-Cow Pelvic Tilt", duration: 45, frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Child's Pose Decompression", duration: 60, frames: ["/exercises/childs_pose_1.jpg", "/exercises/childs_pose_2.jpg"] },
                { title: "Gentle Lumbar Extension", duration: 45, frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Restorative Mat Release", duration: 60, frames: ["/exercises/childs_pose_2.jpg", "/exercises/cat_cow_1.jpg"] }
            ]
        },
        'y2': {
            title: "Cervical Mobility Flow",
            steps: [
                { title: "Seated Neck & Shoulder Release", duration: 45, frames: ["/shoulder_rehab_routine.jpg", "/exercises/childs_pose_1.jpg"] },
                { title: "Thoracic & Cervical Opener", duration: 45, frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Restorative Alignment", duration: 60, frames: ["/exercises/childs_pose_2.jpg"] }
            ]
        },
        'y3': {
            title: "Full Body Restorative",
            steps: [
                { title: "Mindful Breath & Centering", duration: 60, frames: ["/exercises/childs_pose_1.jpg"] },
                { title: "Cat-Cow Spine Wave", duration: 60, frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Restorative Mat Decompression", duration: 60, frames: ["/exercises/childs_pose_2.jpg"] },
                { title: "Gentle Core Stability", duration: 45, frames: ["/lumbar_core_routine.jpg"] }
            ]
        },
        'y4': {
            title: "Shoulder & Thoracic Opener",
            steps: [
                { title: "Thoracic Spine Mobility", duration: 45, frames: ["/shoulder_rehab_routine.jpg"] },
                { title: "Seated Upper Back Extension", duration: 60, frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Restorative Scapular Flow", duration: 45, frames: ["/exercises/childs_pose_2.jpg", "/exercises/cat_cow_1.jpg"] }
            ]
        },
        'y5': {
            title: "Hip Flexor & Psoas Stretch",
            steps: [
                { title: "Hip Flexor Kneeling Lunge", duration: 60, frames: ["/hip_mobility_routine.jpg"] },
                { title: "Deep Psoas & 90/90 Stretch", duration: 60, frames: ["/hip_mobility_routine.jpg", "/exercises/childs_pose_2.jpg"] },
                { title: "Restorative Mat Release", duration: 60, frames: ["/exercises/childs_pose_2.jpg"] }
            ]
        },
        'y6': {
            title: "Morning Activation",
            steps: [
                { title: "Cat-Cow Spine Awakening", duration: 45, frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Core & Pelvic Activation", duration: 45, frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Gentle Spinal Mobility", duration: 45, frames: ["/exercises/cat_cow_1.jpg", "/exercises/childs_pose_1.jpg"] },
                { title: "Restorative Child's Pose", duration: 45, frames: ["/exercises/childs_pose_2.jpg"] }
            ]
        }
    };

    // Backlog of alternative exercises for swapping
    const exerciseBacklog = [
        { title: "Cat-Cow Flow", duration: 45, frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
        { title: "Child's Pose Decompression", duration: 60, frames: ["/exercises/childs_pose_1.jpg", "/exercises/childs_pose_2.jpg"] },
        { title: "Lumbar & Core Stability", duration: 60, frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_1.jpg"] },
        { title: "Hip & Lower Body Mobility", duration: 60, frames: ["/hip_mobility_routine.jpg", "/exercises/childs_pose_2.jpg"] },
        { title: "Shoulder & Scapular Rehab", duration: 45, frames: ["/shoulder_rehab_routine.jpg", "/exercises/childs_pose_1.jpg"] }
    ];

    function startRunnerModal(id) {
        runnerModal.classList.remove('hidden');
        
        const rawId = (id || '').toLowerCase().trim();
        const runnerTitleEl = document.getElementById('runnerTitle');
        
        if (YOGA_ROUTINES[rawId]) {
            const routine = YOGA_ROUTINES[rawId];
            if (runnerTitleEl) runnerTitleEl.innerText = routine.title;
            currentProtocolSteps = routine.steps.map(s => ({ ...s }));
        } else if (rawId.startsWith('y') || rawId.includes('yoga') || rawId.includes('rehab') || rawId.includes('stretch') || rawId.includes('exercise')) {
            if (runnerTitleEl) runnerTitleEl.innerText = "Yoga & Rehab Protocol";
            currentProtocolSteps = [
                { title: "Cat-Cow Spine Awakening", duration: 45, frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Child's Pose & Restorative Hold", duration: 60, frames: ["/exercises/childs_pose_1.jpg", "/exercises/childs_pose_2.jpg"] },
                { title: "Lumbar Core Decompression", duration: 45, frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
                { title: "Restorative Release", duration: 60, frames: ["/exercises/childs_pose_2.jpg"] }
            ];
        } else if (rawId.includes('meditation')) {
            if (runnerTitleEl) runnerTitleEl.innerText = "Meditation Protocol";
            currentProtocolSteps = [
                { title: "Find a Comfortable Position", duration: 30, frames: ["/exercises/childs_pose_1.jpg"] },
                { title: "Box Breathing", duration: 120, frames: ["/exercises/childs_pose_1.jpg"] },
                { title: "Body Scan", duration: 180, frames: ["/exercises/childs_pose_2.jpg"] },
                { title: "Gentle Return", duration: 30, frames: ["/exercises/childs_pose_1.jpg"] }
            ];
        } else {
            if (runnerTitleEl) runnerTitleEl.innerText = "Protocol Runner";
            currentProtocolSteps = [
                { title: "Alignment & Position", duration: 30, frames: ["/exercises/cat_cow_1.jpg"] },
                { title: "Restorative Flow", duration: 60, frames: ["/exercises/childs_pose_2.jpg"] }
            ];
        }
        
        currentStepIndex = 0;
        timeLeft = currentProtocolSteps[currentStepIndex].duration;
        updateStepUI();
        startRunnerTimer();
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateStepUI() {
        if (currentStepIndex >= currentProtocolSteps.length) return;
        const step = currentProtocolSteps[currentStepIndex];
        runnerStep.innerText = `Step ${currentStepIndex + 1}: ${step.title}`;
        runnerTimer.innerText = formatTime(timeLeft);
        
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
                let fIdx = 0;
                imgEl.src = step.frames[0];
                if (step.frames.length > 1) {
                    frameInterval = setInterval(() => {
                        fIdx = (fIdx + 1) % step.frames.length;
                        imgEl.style.opacity = '0.7';
                        setTimeout(() => {
                            imgEl.src = step.frames[fIdx];
                            imgEl.style.opacity = '1';
                        }, 150);
                    }, 2000);
                }
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
                placeholderEl.style.display = 'block';
                placeholderEl.innerText = step.title.substring(0, 8).toUpperCase();
            }
        }
        
        const btnPrev = document.getElementById('btnPrevStep');
        const btnNext = document.getElementById('btnNextStep');
        if (btnPrev) btnPrev.disabled = currentStepIndex === 0;
        if (btnNext) btnNext.innerText = currentStepIndex === currentProtocolSteps.length - 1 ? 'Finish' : 'Next Step';
    }
    
    function closeRunnerModal() {
        runnerModal.classList.add('hidden');
        clearInterval(runnerInterval);
        clearInterval(frameInterval);
        const videoEl = document.getElementById('runnerVideo');
        if (videoEl) {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.removeAttribute('data-src');
        }
    }

    function startRunnerTimer() {
        clearInterval(runnerInterval);
        runnerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) {
                currentStepIndex++;
                if (currentStepIndex >= currentProtocolSteps.length) {
                    clearInterval(runnerInterval);
                    runnerStep.innerText = "Routine Complete!";
                    runnerTimer.innerText = "00:00";
                    setTimeout(() => {
                        closeRunnerModal();
                    }, 1500);
                } else {
                    timeLeft = currentProtocolSteps[currentStepIndex].duration;
                    updateStepUI();
                }
            } else {
                runnerTimer.innerText = formatTime(timeLeft);
            }
        }, 1000);
    }

    btnCancelRunner.addEventListener('click', closeRunnerModal);

    document.getElementById('btnPrevStep').addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            timeLeft = currentProtocolSteps[currentStepIndex].duration;
            updateStepUI();
        }
    });

    btnNextStep.addEventListener('click', () => {
        currentStepIndex++;
        if (currentStepIndex >= currentProtocolSteps.length) {
            closeRunnerModal();
        } else {
            timeLeft = currentProtocolSteps[currentStepIndex].duration;
            updateStepUI();
        }
    });

    // --- Swap Logic ---
    const swapModal = document.getElementById('swapModal');
    const btnSwapExercise = document.getElementById('btnSwapExercise');
    const swapList = document.getElementById('swapList');

    if (btnSwapExercise) {
        btnSwapExercise.addEventListener('click', () => {
            clearInterval(runnerInterval); // Pause timer while swapping
            const videoEl = document.getElementById('runnerVideo');
            if (videoEl) videoEl.pause();
            
            swapList.innerHTML = '';
            exerciseBacklog.forEach((ex) => {
                const item = document.createElement('div');
                item.className = 'agenda-item';
                item.style.cursor = 'pointer';
                item.style.justifyContent = 'space-between';
                item.innerHTML = `
                    <div>
                        <span class="agenda-text" style="font-weight: 600;">${ex.title}</span>
                        <br><small style="color: var(--text-dim);">${formatTime(ex.duration)}</small>
                    </div>
                    <button class="btn btn-outline btn-sm">Select</button>
                `;
                item.addEventListener('click', () => {
                    currentProtocolSteps[currentStepIndex] = { ...ex };
                    timeLeft = ex.duration;
                    swapModal.classList.add('hidden');
                    updateStepUI();
                    startRunnerTimer(); // Resume timer
                });
                swapList.appendChild(item);
            });
            
            swapModal.classList.remove('hidden');
        });
    }

    const btnCloseSwap = document.getElementById('btnCloseSwap');
    if (btnCloseSwap) {
        btnCloseSwap.addEventListener('click', () => {
            swapModal.classList.add('hidden');
            startRunnerTimer();
            const videoEl = document.getElementById('runnerVideo');
            if (videoEl && videoEl.src) {
                videoEl.play().catch(() => {});
            }
        });
    }

    // --- 5. Dual 0-10 Scales (Pain & Mood) ---
    painNumButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            painNumButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPainLevel = parseInt(btn.getAttribute('data-val'), 10);
            painValDisplay.innerText = currentPainLevel;

            const area = painAreaSelect.value;
            const side = painSideSelect.value;

            if (currentPainLevel >= 7) {
                alertBannerText.innerText = `High Pain Alert: ${side.toUpperCase()} ${area.toUpperCase()} at ${currentPainLevel}/10. Agenda adjusted.`;
                alertBanner.classList.remove('hidden');
            } else {
                alertBanner.classList.add('hidden');
            }
        });
    });

    moodNumButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            moodNumButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMoodLevel = parseInt(btn.getAttribute('data-val'), 10);
            if (moodValDisplay) moodValDisplay.innerText = currentMoodLevel;
        });
    });

    // --- 6. Custom Body Part Modal Window ---
    if (btnOpenAddAreaModal) btnOpenAddAreaModal.addEventListener('click', () => {
        addAreaModal.classList.remove('hidden');
        customAreaName.value = '';
        customAreaNotes.value = '';
    });

    const closeCustomAreaModal = () => {
        addAreaModal.classList.add('hidden');
    };

    if (btnCloseAddArea) btnCloseAddArea.addEventListener('click', closeCustomAreaModal);
    if (btnCancelAddArea) btnCancelAddArea.addEventListener('click', closeCustomAreaModal);

    if (btnSaveCustomArea) btnSaveCustomArea.addEventListener('click', () => {
        const name = customAreaName.value.trim();
        const side = customAreaSide.value;
        const notes = customAreaNotes.value.trim();

        if (!name) return;

        const valKey = name.toLowerCase().replace(/\s+/g, '_');
        
        let opt = painAreaSelect.querySelector(`option[value="${valKey}"]`);
        if (!opt) {
            opt = document.createElement('option');
            opt.value = valKey;
            opt.innerText = name.charAt(0).toUpperCase() + name.slice(1);
            painAreaSelect.appendChild(opt);
        }
        
        painAreaSelect.value = valKey;
        painSideSelect.value = side;

        if (notes) {
            customAreaContextMap[valKey] = notes;
        }

        closeCustomAreaModal();
    });

    // --- 7. Log Entry Submission ---
    btnLogPain.addEventListener('click', async () => {
        const total = updatePainWeightTotal();
        if (total !== 100) {
            showToast('Location percentages must total 100%');
            return;
        }
        const generators = [...painLocations.querySelectorAll('.pain-location-row')].map(row => ({
            area: row.querySelector('.pain-area-select').value,
            side: row.querySelector('.pain-side-select').value,
            percentage: parseInt(row.querySelector('.pain-percentage').value, 10)
        }));
        const userNotes = unifiedNotesInput.value.trim();

        btnLogPain.innerText = "Logged";
        btnLogPain.style.background = "var(--neon-green)";

        try {
            const res = await fetch(API_PAIN_LOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain_level: currentPainLevel,
                    generators,
                    pain_notes: userNotes,
                    mood_level: currentMoodLevel,
                    mood_notes: userNotes,
                    mood_emoji: selectedMoodEmoji
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Pain log failed');
            if (data.alert_triggered) {
                alertBannerText.innerText = data.alert_message;
                alertBanner.classList.remove('hidden');
            }
            closePainLog();
            showToast('Pain log saved to live database', 'success');
        } catch (e) {
            showToast(e.message || 'Pain log could not be saved');
        }

        setTimeout(() => {
            btnLogPain.innerText = "Log Entry";
            btnLogPain.style.background = "";
            unifiedNotesInput.value = "";
        }, 2000);
    });

    // --- 8. Proactive Exercise Recommendations ---
    async function loadExerciseSuggestions() {
        exerciseModal.classList.remove('hidden');
        exerciseSuggestions.innerHTML = '<p class="form-hint">Loading recommendations from your latest pain log...</p>';
        try {
            let latest = null;
            try {
                const latestRes = await fetch(API_PAIN_LOG);
                if (latestRes.ok) {
                    const data = await latestRes.json();
                    if (data.logs && data.logs.length > 0) {
                        latest = data.logs[0];
                    }
                }
            } catch (error) {
                console.warn('Latest pain log unavailable', error);
            }
            const painLevel = latest?.total_pain_level ?? currentPainLevel;
            const liveGenerators = latest?.active_symptoms?.map((value) => {
                const match = value.match(/^(Left|Right|Both) ([^(]+) \((\d+)%\)$/i);
                return match ? { side: match[1].toLowerCase(), area: match[2].trim().toLowerCase(), percentage: Number(match[3]) } : null;
            }).filter(Boolean) || [];
            const res = await fetch(API_EXERCISE_SUGGEST, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain_level: painLevel,
                    generators: liveGenerators.length ? liveGenerators : [...painLocations.querySelectorAll('.pain-location-row')].map(row => ({
                        area: row.querySelector('.pain-area-select').value,
                        side: row.querySelector('.pain-side-select').value,
                        percentage: parseInt(row.querySelector('.pain-percentage').value, 10) || 0
                    }))
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Recommendation request failed');
            exerciseSuggestions.innerHTML = '';
            data.suggestions.forEach(exercise => {
                const card = document.createElement('article');
                card.className = 'exercise-card';
                card.innerHTML = `<div><h3>${exercise.name}</h3><p>${exercise.instruction}</p><small>${exercise.duration_minutes} min · ${exercise.intensity}</small></div><div class="exercise-actions"><button class="btn btn-neon-green btn-sm exercise-done">Done</button><button class="btn btn-outline btn-sm exercise-show">Show Me</button><button class="btn btn-outline btn-sm exercise-reject">Dismiss</button><div class="reject-reasons hidden"><button class="btn btn-sm btn-outline reject-reason" data-reason="Too tired">Too tired</button><button class="btn btn-sm btn-outline reject-reason" data-reason="Hurts">Hurts</button></div></div>`;
                card.querySelector('.exercise-done').addEventListener('click', () => {
                    pendingProtocol = { id: exercise.id, name: exercise.name, beforePain: painLevel };
                    reliefExerciseName.innerText = exercise.name;
                    afterPainScore.value = currentPainLevel;
                    exerciseModal.classList.add('hidden');
                    reliefModal.classList.remove('hidden');
                });
                card.querySelector('.exercise-show').addEventListener('click', () => {
                    exerciseModal.classList.add('hidden');
                    startRunnerModal(exercise.id);
                });
                const reasons = card.querySelector('.reject-reasons');
                card.querySelector('.exercise-reject').addEventListener('click', () => reasons.classList.toggle('hidden'));
                reasons.querySelectorAll('.reject-reason').forEach(button => button.addEventListener('click', async () => {
                    await fetch(API_EXERCISE_REJECT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercise_id: exercise.id, reason: button.dataset.reason }) });
                    card.remove();
                }));
                exerciseSuggestions.appendChild(card);
            });
        } catch (error) {
            exerciseSuggestions.innerHTML = `<p class="form-hint">${error.message}</p>`;
        }
    }
    btnOpenExercises.addEventListener('click', loadExerciseSuggestions);
    btnCloseExercises.addEventListener('click', () => exerciseModal.classList.add('hidden'));
    btnCloseRelief.addEventListener('click', () => reliefModal.classList.add('hidden'));
    btnSkipRelief.addEventListener('click', () => {
        if (pendingProtocol?.card) finishPendingProtocol(false);
        else reliefModal.classList.add('hidden');
    });
    btnSaveRelief.addEventListener('click', async () => {
        if (!pendingProtocol) return;
        const after = parseInt(afterPainScore.value, 10);
        if (!after || after < 1 || after > 10) return showToast('Enter a pain score from 1 to 10');
        if (pendingProtocol.card) {
            await finishPendingProtocol(true);
            return;
        }
        await fetch(API_EXERCISE_RELIEF, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exercise_id: pendingProtocol.id, before_pain: pendingProtocol.beforePain, after_pain: after }) });
        reliefModal.classList.add('hidden');
        pendingProtocol = null;
        showToast('Relief delta saved for future recommendations', 'success');
    });

    // --- 9. Budget Loader ---
    const budgetSummaryContainer = document.getElementById('budgetSummary');
    const budgetTotalSpent = document.getElementById('budgetTotalSpent');
    const btnLogBudget = document.getElementById('btnLogBudget');

    async function loadBudget() {
        try {
            const res = await fetch(API_BUDGET);
            if (res.ok) {
                const data = await res.json();
                if (data.status === "success") {
                    let summaryHtml = '';
                    if (data.summary) {
                        for (const [cat, val] of Object.entries(data.summary)) {
                            if (cat !== 'Total') {
                                summaryHtml += `<span class="badge neon-blue">${cat}: $${val}</span>`;
                            }
                        }
                    }
                    if (budgetSummaryContainer) budgetSummaryContainer.innerHTML = summaryHtml;
                    if (budgetTotalSpent && data.summary) budgetTotalSpent.innerText = `Spent: $${data.summary.Total || 0}`;
                }
            }
        } catch (e) {
            showToast('Failed to load budget');
            console.error(e);
        }
    }

    if (btnLogBudget) {
        btnLogBudget.addEventListener('click', async () => {
            const description = document.getElementById('budgetDesc').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);
            const category = document.getElementById('budgetCategory').value;
            const notes = document.getElementById('budgetNotes').value;

            if (!description || isNaN(amount)) {
                showToast('Description and valid amount required');
                return;
            }

            try {
                const res = await fetch(API_BUDGET, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, category, notes })
                });
                if (res.ok) {
                    showToast('Expense added successfully', 'success');
                    document.getElementById('budgetDesc').value = '';
                    document.getElementById('budgetAmount').value = '';
                    document.getElementById('budgetNotes').value = '';
                    loadBudget();
                } else {
                    showToast('Failed to add expense');
                }
            } catch (e) {
                showToast('Failed to add expense');
                console.error(e);
            }
        });
    }

    loadBudget();

});
// Settings Modal Logic
const btnSettings = document.getElementById('btnSettings');
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');

const tabProfile = document.getElementById('tabProfile');
const tabPreferences = document.getElementById('tabPreferences');
const tabIntegrations = document.getElementById('tabIntegrations');

const settingsProfile = document.getElementById('settingsProfile');
const settingsPreferences = document.getElementById('settingsPreferences');
const settingsIntegrations = document.getElementById('settingsIntegrations');

if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
}
[btnCloseSettings, btnCancelSettings].forEach(btn => {
    if (btn) btn.addEventListener('click', () => settingsModal.classList.add('hidden'));
});
if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        // Save logic would go here
    });
}

function switchTab(activeTab, activeContent) {
    [tabProfile, tabPreferences, tabIntegrations].forEach(t => t && t.classList.replace('btn-neon-blue', 'btn-outline'));
    [settingsProfile, settingsPreferences, settingsIntegrations].forEach(c => c && c.classList.add('hidden'));
    
    if (activeTab) activeTab.classList.replace('btn-outline', 'btn-neon-blue');
    if (activeContent) activeContent.classList.remove('hidden');
}

if (tabProfile) tabProfile.addEventListener('click', () => switchTab(tabProfile, settingsProfile));
if (tabPreferences) tabPreferences.addEventListener('click', () => switchTab(tabPreferences, settingsPreferences));
if (tabIntegrations) tabIntegrations.addEventListener('click', () => switchTab(tabIntegrations, settingsIntegrations));

// Keep-Style Notes Logic
const btnNewNote = document.getElementById('btnNewNote');
const noteEditorContainer = document.getElementById('noteEditorContainer');
const btnCancelNoteEdit = document.getElementById('btnCancelNoteEdit');
const btnSaveNoteEdit = document.getElementById('btnSaveNoteEdit');
const notesGrid = document.getElementById('notesGrid');
const editNoteTitle = document.getElementById('editNoteTitle');
const editNoteBody = document.getElementById('editNoteBody');
const editNoteColor = document.getElementById('editNoteColor');
const btnPinNote = document.getElementById('btnPinNote');

let currentEditingNote = null;
let isPinned = false;

if (btnNewNote) {
    btnNewNote.addEventListener('click', () => {
        currentEditingNote = null;
        editNoteTitle.value = '';
        editNoteBody.value = '';
        editNoteColor.value = 'default';
        isPinned = false;
        btnPinNote.classList.replace('btn-neon-green', 'btn-outline');
        noteEditorContainer.classList.remove('hidden');
    });
}

if (btnCancelNoteEdit) {
    btnCancelNoteEdit.addEventListener('click', () => {
        noteEditorContainer.classList.add('hidden');
    });
}

if (btnPinNote) {
    btnPinNote.addEventListener('click', () => {
        isPinned = !isPinned;
        if (isPinned) {
            btnPinNote.classList.replace('btn-outline', 'btn-neon-green');
        } else {
            btnPinNote.classList.replace('btn-neon-green', 'btn-outline');
        }
    });
}

if (btnSaveNoteEdit) {
    btnSaveNoteEdit.addEventListener('click', () => {
        const title = editNoteTitle.value.trim() || 'Untitled';
        const body = editNoteBody.value.trim();
        const color = editNoteColor.value === 'default' ? 'rgba(255,255,255,0.05)' : editNoteColor.value;
        
        let noteHtml = `
            ${isPinned ? '<div style="position: absolute; top: 10px; right: 10px; cursor: pointer;" title="Pinned">📌</div>' : ''}
            <h4 style="margin: 0 0 8px 0; font-size: 1.1em;">${title}</h4>
            <p style="margin: 0; font-size: 0.9em; opacity: 0.9; white-space: pre-wrap;">${body}</p>
        `;
        
        if (currentEditingNote) {
            currentEditingNote.innerHTML = noteHtml;
            currentEditingNote.style.borderLeft = `4px solid ${color}`;
        } else {
            const noteEl = document.createElement('div');
            noteEl.className = 'keep-note glass-panel';
            noteEl.style.cssText = `background: rgba(255,255,255,0.05); border-left: 4px solid ${color}; padding: 15px; border-radius: 8px; position: relative; cursor: pointer;`;
            noteEl.innerHTML = noteHtml;
            
            noteEl.addEventListener('click', () => {
                currentEditingNote = noteEl;
                editNoteTitle.value = title;
                editNoteBody.value = body;
                noteEditorContainer.classList.remove('hidden');
            });
            
            if (isPinned) {
                notesGrid.prepend(noteEl);
            } else {
                notesGrid.appendChild(noteEl);
            }
        }
        
        noteEditorContainer.classList.add('hidden');
    });
}


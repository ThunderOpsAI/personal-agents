document.addEventListener('DOMContentLoaded', () => {

    // --- Notification Scheduler ---
    let notificationPermissionRequested = false;

    function requestNotificationPermission() {
        if (notificationPermissionRequested) return;
        if ('Notification' in window && Notification.permission === 'default') {
            notificationPermissionRequested = true;
            Notification.requestPermission();
        }
    }

    // Request permission on first user interaction (required by modern browsers)
    document.addEventListener('click', requestNotificationPermission, { once: true });

    function schedulePainLogNotifications() {
        let lastFiredHour = -1;

        function checkNotification() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // 6am, 9am, 12pm, 3pm, 6pm, 9pm, 12am (0)
            const validHours = [0, 6, 9, 12, 15, 18, 21];
            if (validHours.includes(hours) && minutes === 0 && lastFiredHour !== hours) {
                lastFiredHour = hours;
                triggerPainLogPrompt();
            }
            // Reset once we leave the trigger minute
            if (minutes !== 0) {
                lastFiredHour = -1;
            }
        }

        setInterval(checkNotification, 10000);
    }

    function triggerPainLogPrompt() {
        const title = 'Time to Log Your Pain';
        const options = {
            body: 'Please take a moment to record your current pain levels and mood.',
            icon: '/Rumble_Icon.png'
        };

        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(title, options);
            notif.onclick = () => {
                window.focus();
                const painLogModal = document.getElementById('painLogModal');
                if (painLogModal) painLogModal.classList.remove('hidden');
            };
        } else {
            const alertBanner = document.getElementById('alertBanner');
            const alertBannerText = document.getElementById('alertBannerText');
            if (alertBanner && alertBannerText) {
                alertBannerText.innerText = title + ' - ' + options.body;
                alertBanner.classList.remove('hidden');
                setTimeout(() => alertBanner.classList.add('hidden'), 10000);
            }
        }
    }

    schedulePainLogNotifications();

    
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
    
    // const croWidget = null;
    // const croMessage = null;
    // const croActions = null;
    // const btnDismissCro = null;
    const postponeModal = document.getElementById('postponeModal');
    const btnClosePostpone = document.getElementById('btnClosePostpone');
    const btnCancelPostpone = document.getElementById('btnCancelPostpone');
    const btnConfirmPostpone = document.getElementById('btnConfirmPostpone');
    const postponeDateInput = document.getElementById('postponeDate');
    let itemToPostpone = null;
    // const btnAcceptCro = null;
    // const btnDiscussCro = null;
    
    const btnOpenRumbleChat = document.getElementById('btnOpenRumbleChat');
    const btnSyncOps = document.getElementById('btnSyncOps');
    const btnOpenNotes = document.getElementById('btnOpenNotes');
    const btnOpenPainLog = document.getElementById('btnOpenPainLog');
    const btnOpenExercises = document.getElementById('btnOpenExercises');
    
    const agendaStream = document.getElementById('agendaStream');
    const weeklyAgendaList = document.getElementById('weeklyAgendaList');
    const monthlyAgendaList = document.getElementById('monthlyAgendaList');

    // Continuous Learning & Encyclopedias Elements
    const painProgressBadge = document.getElementById('painProgressBadge');
    const painCurrentTitle = document.getElementById('painCurrentTitle');
    const aiProgressBadge = document.getElementById('aiProgressBadge');
    const aiCurrentTitle = document.getElementById('aiCurrentTitle');
    const techProgressBadge = document.getElementById('techProgressBadge');
    const techCurrentTitle = document.getElementById('techCurrentTitle');

    // Encyclopedia Reader Modal Elements
    const learnModal = document.getElementById('learnModal');
    const btnCloseLearnModal = document.getElementById('btnCloseLearnModal');
    const btnCloseLearnDone = document.getElementById('btnCloseLearnDone');
    const modalLearnTitle = document.getElementById('modalLearnTitle');
    const modalLearnSubtitle = document.getElementById('modalLearnSubtitle');
    const modalLearnCategory = document.getElementById('modalLearnCategory');
    const modalLearnReadingTime = document.getElementById('modalLearnReadingTime');
    const modalChapterIndicator = document.getElementById('modalChapterIndicator');
    const modalProgressBar = document.getElementById('modalProgressBar');
    const modalChapterSelect = document.getElementById('modalChapterSelect');
    const modalLearnContent = document.getElementById('modalLearnContent');
    const modalLearnTakeaways = document.getElementById('modalLearnTakeaways');
    const btnPrevChapter = document.getElementById('btnPrevChapter');
    const btnNextChapter = document.getElementById('btnNextChapter');
    const btnSaveSummaryLearn = document.getElementById('btnSaveSummaryLearn');
    
    const notesModal = document.getElementById('notesModal');
    const btnCloseNotes = document.getElementById('btnCloseNotes');
    const notesGrid = document.getElementById('notesGrid');
    const pinnedNotesGrid = document.getElementById('pinnedNotesGrid');
    const notesSectionTitle = document.getElementById('notesSectionTitle');
    const unpinnedNotesSectionTitle = document.getElementById('unpinnedNotesSectionTitle');
    const btnToggleArchiveView = document.getElementById('btnToggleArchiveView');
    
    // Inline Note Editor
    const noteEditorCollapsed = document.getElementById('noteEditorCollapsed');
    const noteEditorExpanded = document.getElementById('noteEditorExpanded');
    const editNoteTitle = document.getElementById('editNoteTitle');
    const editNoteBody = document.getElementById('editNoteBody');
    const btnSaveNoteEdit = document.getElementById('btnSaveNoteEdit');
    const btnCancelNoteEdit = document.getElementById('btnCancelNoteEdit');
    const btnPinNote = document.getElementById('btnPinNote');
    
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
    const btnCloseExercises = document.getElementById('btnCloseExercises');
    const exerciseSuggestions = document.getElementById('exerciseSuggestions');
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
    const btnChatCamera = document.getElementById('btnChatCamera');
    const btnChatAttach = document.getElementById('btnChatAttach');
    const chatFileInput = document.getElementById('chatFileInput');
    const chatCameraInput = document.getElementById('chatCameraInput');
    const chatAttachmentPreview = document.getElementById('chatAttachmentPreview');
    const chatAttachmentImg = document.getElementById('chatAttachmentImg');
    const chatAttachmentFileIcon = document.getElementById('chatAttachmentFileIcon');
    const chatAttachmentName = document.getElementById('chatAttachmentName');
    const chatAttachmentSize = document.getElementById('chatAttachmentSize');
    const btnRemoveChatAttachment = document.getElementById('btnRemoveChatAttachment');
    let currentChatAttachment = null;

    let currentPainLevel = 0;
    let currentMoodLevel = 5;
    let currentProposalText = "";
    let currentLearnTopic = null;
    let currentAgendaView = 'today';
    
    const customAreaContextMap = {};

    // --- Server Status Checker ---
    async function checkServerHealth() {
        try {
            const res = await fetch(API_HEALTHZ, { method: 'GET' });
            if (!res.ok) throw new Error("Offline");
            btnSyncOps.classList.remove('btn-offline');
            const syncIcon = btnSyncOps.querySelector('.sync-icon');
            if (syncIcon && syncIcon.textContent !== '🔄' && syncIcon.textContent !== '✅') {
                syncIcon.textContent = '🔄';
            }
            btnSyncOps.title = "Sync Live Data";
        } catch (e) {
            btnSyncOps.classList.add('btn-offline');
            const syncIcon = btnSyncOps.querySelector('.sync-icon');
            if (syncIcon) syncIcon.textContent = '⚠️';
            btnSyncOps.title = "Offline";
        }
    }
    setInterval(checkServerHealth, 10000);
    checkServerHealth();

    // --- Weather Loader ---
    async function loadWeather() {
        if (!weatherWidget) return;
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
            if (weatherWidget) weatherWidget.innerHTML = `<span class="weather-text">Weather: Offline</span>`;
        }
    }
    loadWeather();
    loadAgenda();
    // --- Agenda Auto-Refresh (picks up injected alerts) ---
    setInterval(loadAgenda, 60000);

    // --- Agenda Loader ---
    async function loadAgenda() {
        try {
            const res = await fetch(API_AGENDA);
            if (res.ok) {
                const data = await res.json();
                cachedAgendaData = data;
                
                if (data.calendar_status === 'auth_required' && window.authRecoveryBanner) {
                    window.authRecoveryBanner.classList.remove('hidden');
                } else if (window.authRecoveryBanner) {
                    window.authRecoveryBanner.classList.add('hidden');
                }

                if (currentAgendaView === 'tomorrow') {
                    renderTomorrowAgenda();
                    return;
                } else if (currentAgendaView === 'yesterday') {
                    renderYesterdayAgenda();
                    return;
                }

                renderTodayAgenda(data);
            } else if (res.status === 401) {
                if (window.authRecoveryBanner) window.authRecoveryBanner.classList.remove('hidden');
                console.error("Calendar OAuth token expired (401)");
            } else {
                console.error("Failed to load agenda with status:", res.status);
            }
        } catch (e) {
            showToast('Failed to load agenda');
            console.error(e);
        }
    }

    function renderTodayAgenda(data) {
        const today = new Date();
        const dayStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

        if (window.dailyAgendaTitle) window.dailyAgendaTitle.innerText = "Daily Agenda";
        if (window.agendaDateIndicator) window.agendaDateIndicator.innerHTML = `<span class="badge neon-blue" style="margin-right: 6px;">Today</span> <span style="color: var(--text-primary); font-weight: 500;">${dayStr}</span>`;
        if (window.tomorrowBanner) window.tomorrowBanner.classList.add('hidden');
        
        if (window.btnTomorrowText) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomShort = tomorrow.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
            window.btnTomorrowText.innerText = `Continue to Tomorrow's Agenda (${tomShort})`;
        }
        if (window.btnTomorrowIcon) window.btnTomorrowIcon.innerHTML = "&rarr;";
        if (window.btnYesterdayText) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yestShort = yesterday.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
            window.btnYesterdayText.innerText = `Return to Yesterday (${yestShort})`;
        }
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'flex';
        if (window.btnTomorrowAgenda) window.btnTomorrowAgenda.style.display = 'flex';

        const dailyItems = data.daily || [];
        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = `${dailyItems.length} Items`;
        
        document.querySelectorAll('.protocol-card:not(#protocol-learn):not(#executive-briefing)').forEach(c => c.remove());

        if (dailyItems.length > 0) {
            dailyItems.forEach(item => {
                if (item.item_type === 'learning' || item.id === 'protocol-learn') return;
                const isCompleted = item.status === 'completed';
                const isDismissed = item.status === 'dismissed';

                const card = document.createElement('div');
                card.className = `protocol-card glass-panel${isCompleted ? ' completed' : ''}${isDismissed ? ' dismissed' : ''}`;
                card.id = `protocol-${item.id}`;
                
                if (isDismissed) {
                    card.style.opacity = '0.5';
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3>${item.time}</h3>
                            <p style="text-decoration: line-through;">${item.title}</p>
                            <small class="form-hint">Dismissed</small>
                        </div>
                        <div class="protocol-actions">
                            <button class="btn btn-outline btn-sm btn-reinstate" data-id="${item.id}" data-type="${item.item_type || ''}">Reinstate</button>
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3>${item.time}</h3>
                            <p>${item.title}</p>
                            ${item.choices ? `<small class="form-hint">Choices: ${item.choices.join(' · ')}</small>` : ''}
                        </div>
                        <div class="protocol-actions">
                            <button class="btn btn-neon-purple btn-sm btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>View</button>
                            <button class="btn btn-neon-green btn-sm btn-done" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Done' : 'Done'}</button>
                            <button class="btn btn-outline btn-sm btn-postpone" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>Delay</button>
                            <button class="btn btn-outline btn-sm btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? '' : 'disabled'}>Skip</button>
                        </div>
                    `;
                }
                document.getElementById("agendaStream").appendChild(card);
                attachCardEvents(card);
            });
        }
        
        const cards = Array.from(document.getElementById("agendaStream").querySelectorAll('.protocol-card'));
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
        cards.forEach(c => document.getElementById("agendaStream").appendChild(c));

        renderInteractiveCalendar(data);
    }

    let interactiveCalendar = null;
    function renderInteractiveCalendar(data) {
        const calendarEl = document.getElementById('fullCalendar');
        if (!calendarEl || typeof FullCalendar === 'undefined') return;

        if (!interactiveCalendar) {
            interactiveCalendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                height: 'auto',
                selectable: true,
                dateClick: function(info) {
                    let datePart = info.dateStr;
                    let timePart = '09:00';
                    if (info.dateStr.includes('T')) {
                        const parts = info.dateStr.split('T');
                        datePart = parts[0];
                        timePart = parts[1].substring(0, 5); // get HH:MM
                    }
                    openCalendarEventEdit({ rawDate: datePart, startTime: timePart });
                },
                eventClick: function(info) {
                    if (info.event.extendedProps.originalEvent) {
                        openCalendarEventView(info.event.extendedProps.originalEvent);
                    }
                }
            });
            interactiveCalendar.render();
        }

        const events = [];
        
        const parseEventDate = (item) => {
            // item.date is likely "YYYY-MM-DD" or similar, or item.rawDate.
            let dateStr = item.rawDate || item.date;
            if (!dateStr) return null;
            if (item.time) {
                // simple parser for AM/PM to 24h
                const match = item.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    let h = parseInt(match[1]);
                    let m = parseInt(match[2]);
                    let ampm = match[3].toUpperCase();
                    if (ampm === 'PM' && h < 12) h += 12;
                    if (ampm === 'AM' && h === 12) h = 0;
                    const hStr = h.toString().padStart(2, '0');
                    const mStr = m.toString().padStart(2, '0');
                    return `${dateStr}T${hStr}:${mStr}:00`;
                }
            }
            return dateStr;
        };

        if (data.weekly) {
            data.weekly.forEach(w => {
                events.push({
                    title: w.title,
                    start: w.rawDate || w.date || w.day,
                    extendedProps: { originalEvent: w }
                });
            });
        }
        
        if (data.monthly) {
            data.monthly.forEach(m => {
                // Avoid duplicates if weekly covers the same events
                if (!events.find(e => e.extendedProps.originalEvent.id === m.id)) {
                    events.push({
                        title: m.title,
                        start: parseEventDate(m) || m.rawDate || m.date,
                        extendedProps: { originalEvent: m }
                    });
                }
            });
        }

        interactiveCalendar.getEvents().forEach(e => e.remove());
        interactiveCalendar.addEventSource(events);
    }

    
    function renderYesterdayAgenda() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dayStr = yesterday.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        
        const today = new Date();
        const todayShort = today.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

        if (window.dailyAgendaTitle) window.dailyAgendaTitle.innerText = "Yesterday's Agenda";
        if (window.agendaDateIndicator) window.agendaDateIndicator.innerHTML = `<span class="badge neon-purple" style="margin-right: 6px;">Yesterday</span> <span style="color: var(--neon-blue); font-weight: 500;">${dayStr}</span>`;
        if (window.tomorrowBanner) window.tomorrowBanner.classList.add('hidden');
        
        if (window.btnYesterdayText) window.btnYesterdayText.innerText = `Return to Today's Agenda (${todayShort})`;
        if (window.btnYesterdayIcon) window.btnYesterdayIcon.innerHTML = "&rarr;";
        if (window.btnTomorrowAgenda) window.btnTomorrowAgenda.style.display = 'none';
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'flex';

        // Remove non-learning cards
        document.querySelectorAll('.protocol-card:not(#protocol-learn):not(#executive-briefing)').forEach(c => c.remove());
        
        const yesterdayProtocols = [
            { id: 'yest_retrieval_0600', time: '06:00 AM', title: 'Automated Retrieval: Scrape Gmail & Calendar', item_type: 'retrieval', status: 'completed' },
            { id: 'yest_yoga_0900', time: '09:00 AM', title: 'Adaptive Morning Yoga Routine', item_type: 'yoga', status: 'completed' },
            { id: 'yest_med_2100', time: '09:00 PM', title: 'Evening Meditation Protocol', item_type: 'meditation', status: 'completed' }
        ];

        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = `${yesterdayProtocols.length} Items (Past)`;
        
        yesterdayProtocols.forEach(item => {
            const card = document.createElement('div');
            card.className = 'protocol-card glass-panel completed';
            card.id = `protocol-${item.id}`;
            card.innerHTML = `
                <div class="protocol-info">
                    <h3>${item.time} <span class="badge neon-purple" style="font-size: 0.72rem;">Yesterday</span></h3>
                    <p>${item.title}</p>
                </div>
                <div class="protocol-actions">
                    <button class="btn btn-neon-green btn-sm btn-done" disabled>Done</button>
                </div>
            `;
            document.getElementById("agendaStream").appendChild(card);
        });
        
        showToast('Yesterday\'s agenda loaded', 'info');
    }

    function renderTomorrowAgenda() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayStr = tomorrow.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        
        const today = new Date();
        const todayShort = today.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

        if (tomorrowDateSub) tomorrowDateSub.innerText = `${dayStr} • Prepare and review upcoming tasks`;
        if (dailyAgendaTitle) dailyAgendaTitle.innerText = "Tomorrow's Agenda";
        if (agendaDateIndicator) agendaDateIndicator.innerHTML = `<span class="badge neon-purple" style="margin-right: 6px;">Tomorrow</span> <span style="color: var(--neon-blue); font-weight: 500;">${dayStr}</span>`;
        if (tomorrowBanner) tomorrowBanner.classList.remove('hidden');
        if (window.btnTomorrowText) window.btnTomorrowText.innerText = `Return to Today's Agenda (${todayShort})`;
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'none';
        if (btnTomorrowIcon) btnTomorrowIcon.innerHTML = "&larr;";
        
        // Remove non-learning cards
        document.querySelectorAll('.protocol-card:not(#protocol-learn):not(#executive-briefing)').forEach(c => c.remove());
        
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
                    <button class="btn btn-neon-purple btn-sm btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}">Preview</button>
                    <button class="btn btn-neon-green btn-sm btn-done" data-id="${item.id}" data-type="${item.item_type || ''}">Pre-Done</button>
                    <button class="btn btn-outline btn-sm btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}">Skip</button>
                </div>
            `;
            document.getElementById("agendaStream").appendChild(card);
            attachCardEvents(card);
        });
        
        showToast('Tomorrow\'s agenda prep loaded', 'info');
    }

    // Tomorrow Agenda Toggle Listeners
    if (window.btnTomorrowAgenda) {
        window.btnTomorrowAgenda.addEventListener('click', () => {
            if (currentAgendaView === 'today') {
                currentAgendaView = 'tomorrow';
            } else if (currentAgendaView === 'tomorrow') {
                currentAgendaView = 'today';
            } else if (currentAgendaView === 'yesterday') {
                currentAgendaView = 'today';
            }
            if (currentAgendaView === 'tomorrow') {
                renderTomorrowAgenda();
            } else if (currentAgendaView === 'today') {
                if (cachedAgendaData) {
                    renderTodayAgenda(cachedAgendaData);
                } else {
                    loadAgenda();
                }
            }
        });
    }

    if (window.btnYesterdayAgenda) {
        window.btnYesterdayAgenda.addEventListener('click', () => {
            if (currentAgendaView === 'today') {
                currentAgendaView = 'yesterday';
                renderYesterdayAgenda();
            } else if (currentAgendaView === 'yesterday') {
                currentAgendaView = 'today';
                if (cachedAgendaData) {
                    renderTodayAgenda(cachedAgendaData);
                } else {
                    loadAgenda();
                }
            } else if (currentAgendaView === 'tomorrow') {
                currentAgendaView = 'today';
                if (cachedAgendaData) {
                    renderTodayAgenda(cachedAgendaData);
                } else {
                    loadAgenda();
                }
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

    // Postpone Modal Logic
    
    if (btnClosePostpone) btnClosePostpone.addEventListener('click', () => postponeModal.classList.add('hidden'));
    if (btnCancelPostpone) btnCancelPostpone.addEventListener('click', () => postponeModal.classList.add('hidden'));
    
    if (btnConfirmPostpone) {
        btnConfirmPostpone.addEventListener('click', () => {
            if (itemToPostpone && postponeDateInput.value) {
                fetch(API_AGENDA, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: itemToPostpone,
                        action: 'reschedule',
                        new_date: postponeDateInput.value
                    })
                }).then(() => {
                    postponeModal.classList.add('hidden');
                    loadAgenda();
                }).catch(err => {
                    console.error('Failed to reschedule:', err);
                    showToast('Failed to postpone item');
                });
            }
        });
    }
    
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
                } else if (res.status === 401) {
                    if (window.authRecoveryBanner) window.authRecoveryBanner.classList.remove('hidden');
                    showToast('Google Calendar re-authorization required', 'error');
                } else {
                    showToast('Failed to delete event');
                }
            } catch (err) {
                showToast('Error deleting calendar event');
                console.error(err);
            }
        });
    }

    const btnAddCalendarEvent = document.getElementById('btnAddCalendarEvent');
    if (btnAddCalendarEvent) {
        btnAddCalendarEvent.addEventListener('click', () => openCalendarEventEdit(null));
    }

    if (typeof btnAddWeeklyEvent !== "undefined" && btnAddWeeklyEvent) {
        btnAddWeeklyEvent.addEventListener('click', () => openCalendarEventEdit(null));
    }

    if (typeof btnAddMonthlyEvent !== "undefined" && btnAddMonthlyEvent) {
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
                } else if (res.status === 401) {
                    if (window.authRecoveryBanner) window.authRecoveryBanner.classList.remove('hidden');
                    showToast('Google Calendar re-authorization required', 'error');
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

    // --- 3 Encyclopedias (Pain, AI, Tech) Engine ---
    let activeEncyclopediaId = "pain";
    let activeChapterIndex = 0;
    let currentChapterData = null;
    let currentEncyclopediaMeta = null;

    async function loadEncyclopediasSummary() {
        try {
            const res = await fetch('/api/v1/learn/encyclopedias');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.encyclopedias) return;

            data.encyclopedias.forEach(enc => {
                const badgeText = `Ch. ${(enc.currentChapterIndex || 0) + 1}/${enc.totalChapters}`;
                const titleText = enc.currentChapter ? enc.currentChapter.title : 'Loading...';
                
                if (enc.id === 'pain') {
                    if (painProgressBadge) painProgressBadge.innerText = badgeText;
                    if (painCurrentTitle) painCurrentTitle.innerText = titleText;
                } else if (enc.id === 'ai') {
                    if (aiProgressBadge) aiProgressBadge.innerText = badgeText;
                    if (aiCurrentTitle) aiCurrentTitle.innerText = titleText;
                } else if (enc.id === 'tech') {
                    if (techProgressBadge) techProgressBadge.innerText = badgeText;
                    if (techCurrentTitle) techCurrentTitle.innerText = titleText;
                }
            });
        } catch (e) {
            console.error('Failed to load encyclopedias summary:', e);
        }
    }

    async function openEncyclopediaReader(encyclopediaId, chapterIndex = null) {
        activeEncyclopediaId = encyclopediaId;
        try {
            const url = chapterIndex !== null 
                ? `/api/v1/learn/encyclopedias/${encyclopediaId}?chapter=${chapterIndex}`
                : `/api/v1/learn/encyclopedias/${encyclopediaId}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load encyclopedia chapter');
            const data = await res.json();

            currentEncyclopediaMeta = data.encyclopedia;
            currentChapterData = data.currentChapter;
            activeChapterIndex = data.encyclopedia.currentChapterIndex;

            renderEncyclopediaReader();
            if (learnModal) learnModal.classList.remove('hidden');
        } catch (e) {
            showToast('Could not load encyclopedia', 'error');
            console.error(e);
        }
    }

    function renderEncyclopediaReader() {
        if (!currentEncyclopediaMeta || !currentChapterData) return;

        if (modalLearnCategory) {
            modalLearnCategory.innerText = currentEncyclopediaMeta.id.toUpperCase();
            modalLearnCategory.className = `badge ${currentEncyclopediaMeta.badgeClass}`;
        }
        if (modalLearnReadingTime) {
            modalLearnReadingTime.innerText = `${currentChapterData.readingTimeMin || 4} min read`;
        }
        if (modalLearnTitle) {
            modalLearnTitle.innerText = `${currentChapterData.chapterNumber}. ${currentChapterData.title}`;
        }
        if (modalLearnSubtitle) {
            modalLearnSubtitle.innerText = currentChapterData.subtitle || currentEncyclopediaMeta.title;
        }
        if (modalChapterIndicator) {
            modalChapterIndicator.innerText = `Chapter ${activeChapterIndex + 1} of ${currentEncyclopediaMeta.totalChapters}`;
        }
        if (modalProgressBar) {
            const pct = Math.round(((activeChapterIndex + 1) / currentEncyclopediaMeta.totalChapters) * 100);
            modalProgressBar.style.width = `${pct}%`;
            modalProgressBar.style.background = currentEncyclopediaMeta.color || 'var(--neon-blue)';
        }

        // Chapter selector dropdown
        if (modalChapterSelect && currentEncyclopediaMeta.chapters) {
            modalChapterSelect.innerHTML = '';
            currentEncyclopediaMeta.chapters.forEach((ch, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.innerText = `Ch. ${ch.chapterNumber}: ${ch.title}`;
                if (idx === activeChapterIndex) opt.selected = true;
                modalChapterSelect.appendChild(opt);
            });
        }

        // Content
        if (modalLearnContent) {
            modalLearnContent.innerHTML = currentChapterData.content || `<p>${currentChapterData.summary}</p>`;
        }

        // Key Takeaways
        if (modalLearnTakeaways) {
            modalLearnTakeaways.innerHTML = '';
            if (Array.isArray(currentChapterData.keyTakeaways)) {
                currentChapterData.keyTakeaways.forEach(t => {
                    const li = document.createElement('li');
                    li.innerText = t;
                    modalLearnTakeaways.appendChild(li);
                });
            }
        }

        // Navigation buttons state
        if (btnPrevChapter) {
            btnPrevChapter.disabled = activeChapterIndex <= 0;
            btnPrevChapter.style.opacity = activeChapterIndex <= 0 ? '0.5' : '1';
        }
        if (btnNextChapter) {
            btnNextChapter.disabled = activeChapterIndex >= currentEncyclopediaMeta.totalChapters - 1;
            btnNextChapter.style.opacity = activeChapterIndex >= currentEncyclopediaMeta.totalChapters - 1 ? '0.5' : '1';
        }
    }

    // Save Summary to learning/ folder and advance
    async function saveChapterSummary() {
        if (!currentEncyclopediaMeta || !currentChapterData) return;
        if (btnSaveSummaryLearn) btnSaveSummaryLearn.innerText = "Saving...";

        try {
            const res = await fetch('/api/v1/learn/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encyclopediaId: activeEncyclopediaId,
                    chapterId: currentChapterData.id,
                    chapterTitle: currentChapterData.title,
                    summary: currentChapterData.summary,
                    keyTakeaways: currentChapterData.keyTakeaways
                })
            });

            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();
            showToast(`Summary saved to ${data.filename}`, 'success');

            // Refresh progress on dashboard
            loadEncyclopediasSummary();

            // Advance to next chapter if available
            if (activeChapterIndex < currentEncyclopediaMeta.totalChapters - 1) {
                openEncyclopediaReader(activeEncyclopediaId, activeChapterIndex + 1);
            } else {
                if (learnModal) learnModal.classList.add('hidden');
                showToast(`Finished ${currentEncyclopediaMeta.title}!`, 'success');
            }
        } catch (e) {
            showToast('Failed to save summary to learning folder', 'error');
            console.error(e);
        } finally {
            if (btnSaveSummaryLearn) btnSaveSummaryLearn.innerText = "Save Summary & Finish";
        }
    }

    // Bind Encyclopedia buttons
    document.querySelectorAll('.encyclopedia-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const encId = btn.getAttribute('data-enc');
            if (encId) openEncyclopediaReader(encId);
        });
    });

    if (modalChapterSelect) {
        modalChapterSelect.addEventListener('change', (e) => {
            const targetIdx = parseInt(e.target.value, 10);
            if (!isNaN(targetIdx)) openEncyclopediaReader(activeEncyclopediaId, targetIdx);
        });
    }

    if (btnPrevChapter) {
        btnPrevChapter.addEventListener('click', () => {
            if (activeChapterIndex > 0) openEncyclopediaReader(activeEncyclopediaId, activeChapterIndex - 1);
        });
    }

    if (btnNextChapter) {
        btnNextChapter.addEventListener('click', () => {
            if (currentEncyclopediaMeta && activeChapterIndex < currentEncyclopediaMeta.totalChapters - 1) {
                openEncyclopediaReader(activeEncyclopediaId, activeChapterIndex + 1);
            }
        });
    }

    if (btnSaveSummaryLearn) {
        btnSaveSummaryLearn.addEventListener('click', saveChapterSummary);
    }

    if (btnCloseLearnModal) {
        btnCloseLearnModal.addEventListener('click', () => {
            if (learnModal) learnModal.classList.add('hidden');
            loadEncyclopediasSummary();
        });
    }

    if (btnCloseLearnDone) {
        btnCloseLearnDone.addEventListener('click', () => {
            if (learnModal) learnModal.classList.add('hidden');
            loadEncyclopediasSummary();
        });
    }

    loadEncyclopediasSummary();

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
    
    /* CRO EVENTS REMOVED */

    btnOpenRumbleChat.addEventListener('click', () => {
        rumbleChatModal.classList.remove('hidden');
    });

    btnCloseRumbleChat.addEventListener('click', () => {
        rumbleChatModal.classList.add('hidden');
    });

    let pendingChatAction = null;


    function handleChatFileSelection(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            currentChatAttachment = {
                data: e.target.result,
                mimeType: file.type || 'application/octet-stream',
                filename: file.name
            };
            if (chatAttachmentName) chatAttachmentName.innerText = file.name;
            if (chatAttachmentSize) chatAttachmentSize.innerText = `${Math.round(file.size / 1024)} KB`;
            if (file.type.startsWith('image/')) {
                if (chatAttachmentImg) {
                    chatAttachmentImg.src = e.target.result;
                    chatAttachmentImg.style.display = 'block';
                }
                if (chatAttachmentFileIcon) chatAttachmentFileIcon.style.display = 'none';
            } else {
                if (chatAttachmentImg) chatAttachmentImg.style.display = 'none';
                if (chatAttachmentFileIcon) chatAttachmentFileIcon.style.display = 'block';
            }
            if (chatAttachmentPreview) chatAttachmentPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    if (btnChatAttach && chatFileInput) {
        btnChatAttach.addEventListener('click', () => chatFileInput.click());
        chatFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleChatFileSelection(e.target.files[0]);
            }
        });
    }

    if (btnChatCamera && chatCameraInput) {
        btnChatCamera.addEventListener('click', () => chatCameraInput.click());
        chatCameraInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleChatFileSelection(e.target.files[0]);
            }
        });
    }

    function clearChatAttachment() {
        currentChatAttachment = null;
        if (chatFileInput) chatFileInput.value = '';
        if (chatCameraInput) chatCameraInput.value = '';
        if (chatAttachmentPreview) chatAttachmentPreview.classList.add('hidden');
        if (chatAttachmentImg) {
            chatAttachmentImg.src = '';
            chatAttachmentImg.style.display = 'none';
        }
    }

    if (btnRemoveChatAttachment) {
        btnRemoveChatAttachment.addEventListener('click', clearChatAttachment);
    }

    async function sendRumbleChatMessage(textToSend, explicitAction) {
        const msg = (textToSend || rumbleChatInput.value).trim();
        const attached = currentChatAttachment;
        if (!msg && !attached && !explicitAction) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        let userContent = `<strong>You:</strong> ${msg || 'Attached photo/document for analysis'}`;
        if (attached) {
            if (attached.mimeType.startsWith('image/')) {
                userContent += `<div style="margin-top: 6px;"><img src="${attached.data}" style="max-width: 180px; max-height: 140px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);"></div>`;
            } else {
                userContent += `<div style="margin-top: 6px; font-size: 0.85rem; color: var(--neon-blue);">📄 ${attached.filename || 'Attached document'}</div>`;
            }
        }
        userDiv.innerHTML = userContent;
        rumbleChatMessages.appendChild(userDiv);
        rumbleChatInput.value = '';
        clearChatAttachment();
        rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

        const isConfirmation = explicitAction || (pendingChatAction && /^(?:yes|confirm|confirmed|save|commit|proceed|do it|add it)\b/i.test(msg));
        const actionToCommit = explicitAction || (isConfirmation ? pendingChatAction : null);

        const payload = {
            message: msg || 'Please analyze this attached photo/document and extract relevant appointments, instructions, or notes.',
            proposal_context: currentProposalText,
            ...(attached ? { attachment: attached } : {}),
            ...(actionToCommit ? { confirm_action: actionToCommit } : {})
        };

        try {
            const response = await fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
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
                    showToast('Expense added', 'success');
                }
            }

            if (actionToCommit) {
                if (typeof loadAgenda === 'function') loadAgenda();
                if (typeof loadNotes === 'function') loadNotes();
                if (typeof loadBudget === 'function') loadBudget();
            }
        } catch (err) {
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> Communication error. Unable to reach backend.`;
            rumbleChatMessages.appendChild(rumbleDiv);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;
        }
    }

    // --- 11. Settings Logic ---
    const btnSettings = document.getElementById('btnSettings');

    const tabProfile = document.getElementById('tabProfile');
    const tabPreferences = document.getElementById('tabPreferences');
    const tabIntegrations = document.getElementById('tabIntegrations');
    
    const settingsProfile = document.getElementById('settingsProfile');
    const settingsPreferences = document.getElementById('settingsPreferences');
    const settingsIntegrations = document.getElementById('settingsIntegrations');

    function switchSettingsTab(activeTab, activeContent) {
        [tabProfile, tabPreferences, tabIntegrations].forEach(t => {
            if(t) {
                t.classList.remove('active', 'btn-neon-blue');
                t.classList.add('btn-outline');
            }
        });
        [settingsProfile, settingsPreferences, settingsIntegrations].forEach(c => {
            if(c) c.classList.add('hidden');
        });

        if(activeTab) {
            activeTab.classList.remove('btn-outline');
            activeTab.classList.add('active', 'btn-neon-blue');
        }
        if(activeContent) {
            activeContent.classList.remove('hidden');
        }
    }

    if (tabProfile) tabProfile.addEventListener('click', () => switchSettingsTab(tabProfile, settingsProfile));
    if (tabPreferences) tabPreferences.addEventListener('click', () => switchSettingsTab(tabPreferences, settingsPreferences));
    if (tabIntegrations) tabIntegrations.addEventListener('click', () => switchSettingsTab(tabIntegrations, settingsIntegrations));

    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const themeSelector = document.getElementById('themeSelector');

    if (btnSettings && settingsModal) {
        btnSettings.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    if (themeSelector) {
        // Load saved theme
        const savedTheme = localStorage.getItem('rumble_theme') || 'theme-default';
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);

        themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            applyTheme(newTheme);
            localStorage.setItem('rumble_theme', newTheme);
        });
    }

    function applyTheme(themeName) {
        // Remove existing theme classes
        document.body.classList.remove('theme-default', 'theme-midnight', 'theme-cyberpunk', 'theme-forest');
        if (themeName !== 'theme-default') {
            document.body.classList.add(themeName);
        }
    }

    btnSendRumbleChat.addEventListener('click', () => sendRumbleChatMessage());
    rumbleChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendRumbleChatMessage();
    });


    // Voice Input inside Rumble Chat Modal (Audio Capture)
    let mediaRecorder = null;
    let audioChunks = [];
    let isChatRecording = false;

    btnRumbleVoice.addEventListener('click', async () => {
        if (isChatRecording) {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isChatRecording = false;
            btnRumbleVoice.innerText = 'Voice';
            btnRumbleVoice.classList.remove('recording');
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    showToast('Audio captured, processing...', 'info');
                    
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "recording.webm");
                    try {
                      const res = await fetch("/api/v1/capture/voice", { method: "POST", body: formData });
                      const data = await res.json();
                      if (data.success && data.text) {
                        rumbleChatInput.value = data.text;
                        sendRumbleChatMessage();
                      } else {
                        showToast(data.error || "Voice transcription unavailable", "error");
                      }
                    } catch (err) {
                      showToast("Voice processing failed", "error");
                    }
                    
                    stream.getTracks().forEach(track => track.stop());
                };

                rumbleChatInput.value = '';
                mediaRecorder.start();
                isChatRecording = true;
                btnRumbleVoice.innerText = 'Recording...';
                btnRumbleVoice.classList.add('recording');
            } catch (err) {
                console.error("Error accessing microphone:", err);
                showToast("Could not access microphone for recording");
            }
        }
    });

    // --- Media Upload & OCR Dropzone ---
    const uploadModal = document.getElementById('uploadModal');
    const btnCloseUpload = document.getElementById('btnCloseUpload');
    const btnCancelUpload = document.getElementById('btnCancelUpload');
    const btnConfirmUpload = document.getElementById('btnConfirmUpload');
    const mediaDropzone = document.getElementById('mediaDropzone');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImg');
    const btnRemoveMedia = document.getElementById('btnRemoveMedia');
    let currentUploadFile = null;

    if (uploadModal) {
        function resetUpload() {
            currentUploadFile = null;
            if (mediaFileInput) mediaFileInput.value = '';
            if (uploadPreview) uploadPreview.classList.add('hidden');
            if (mediaDropzone) mediaDropzone.style.display = 'block';
            if (previewImg) previewImg.src = '';
        }

        if (btnCloseUpload) btnCloseUpload.addEventListener('click', () => { uploadModal.classList.add('hidden'); resetUpload(); });
        if (btnCancelUpload) btnCancelUpload.addEventListener('click', () => { uploadModal.classList.add('hidden'); resetUpload(); });

        if (mediaDropzone) {
            mediaDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                mediaDropzone.classList.add('drag-over');
            });
            mediaDropzone.addEventListener('dragleave', () => {
                mediaDropzone.classList.remove('drag-over');
            });
            mediaDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                mediaDropzone.classList.remove('drag-over');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });
            mediaDropzone.addEventListener('click', () => {
                if (mediaFileInput) mediaFileInput.click();
            });
        }

        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                }
            });
        }

        function handleFileSelect(file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file');
                return;
            }
            currentUploadFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImg) previewImg.src = e.target.result;
                if (mediaDropzone) mediaDropzone.style.display = 'none';
                if (uploadPreview) uploadPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        if (btnRemoveMedia) {
            btnRemoveMedia.addEventListener('click', resetUpload);
        }

        if (btnConfirmUpload) {
            btnConfirmUpload.addEventListener('click', async () => {
                if (!currentUploadFile) {
                    showToast('No file selected');
                    return;
                }
                
                showToast('Processing OCR upload...', 'info');
                const formData = new FormData();
                formData.append("image", currentUploadFile);
                try {
                  const res = await fetch("/api/v1/capture/ocr", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.success) {
                    showToast('Document processed', 'success');
                  } else {
                    showToast(data.error || "OCR processing unavailable");
                  }
                } catch (err) {
                  showToast("Upload failed");
                }
                uploadModal.classList.add('hidden');
                resetUpload();
            });
        }
    }

    // --- Briefing Modal Triggers ---
    const btnViewBriefing = document.getElementById('btnViewBriefing');
    const briefingModal = document.getElementById('briefingModal');
    const btnCloseBriefing = document.getElementById('btnCloseBriefing');
    const btnDismissBriefing = document.getElementById('btnDismissBriefing');
    const briefingLoading = document.getElementById('briefingLoading');
    const briefingContent = document.getElementById('briefingContent');
    const btnDoneBriefing = document.getElementById('btnDoneBriefing');
    const btnDismissBriefingCard = document.getElementById('btnDismissBriefingCard');
    const executiveBriefingCard = document.getElementById('executive-briefing');

    if (btnViewBriefing && briefingModal) {
        btnViewBriefing.addEventListener('click', async () => {
            briefingModal.classList.remove('hidden');
            briefingLoading.classList.remove('hidden');
            briefingContent.classList.add('hidden');
            briefingContent.innerHTML = '';
            
            try {
                const res = await fetch('/api/v1/briefing/executive', { method: 'POST' });
                const data = await res.json();
                
                if (data.html || data.markdown) {
                    // Very simple markdown formatting just for display if needed
                    briefingContent.innerHTML = data.html || data.markdown.replace(/\n/g, '<br>');
                } else {
                    briefingContent.innerHTML = 'Error loading briefing.';
                }
            } catch (err) {
                console.error(err);
                briefingContent.innerHTML = 'Failed to load briefing.';
            } finally {
                briefingLoading.classList.add('hidden');
                briefingContent.classList.remove('hidden');
            }
        });
        
        const closeBriefingModal = () => briefingModal.classList.add('hidden');
        if (btnCloseBriefing) btnCloseBriefing.addEventListener('click', closeBriefingModal);
        if (btnDismissBriefing) btnDismissBriefing.addEventListener('click', closeBriefingModal);
    }
    
    if (btnDoneBriefing && executiveBriefingCard) {
        btnDoneBriefing.addEventListener('click', () => {
            executiveBriefingCard.classList.add('completed');
            showToast('Executive Briefing marked as done', 'success');
        });
    }
    
    if (btnDismissBriefingCard && executiveBriefingCard) {
        btnDismissBriefingCard.addEventListener('click', () => {
            executiveBriefingCard.style.display = 'none';
            showToast('Executive Briefing dismissed', 'info');
        });
    }

    // loadRumbleInsights();

    // --- 2. Persistent Notes Modal ---
    btnOpenNotes.addEventListener('click', () => {
        notesModal.classList.remove('hidden');
    });

    function closePainLog() { painLogModal.classList.add('hidden'); }
    btnOpenPainLog.addEventListener('click', () => painLogModal.classList.remove('hidden'));
    btnClosePainLog.addEventListener('click', closePainLog);
    btnCancelPainLog.addEventListener('click', closePainLog);

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

    let currentNotes = [];
    let currentNotesTab = 'active'; // 'active', 'pinned', 'archive'
    let editingNoteId = null;

    function renderNotesGrid() {
        if (!notesGrid || !pinnedNotesGrid) return;
        notesGrid.innerHTML = '';
        pinnedNotesGrid.innerHTML = '';
        
        const isArchiveView = currentNotesTab === 'archive';
        const filteredNotes = currentNotes.filter(n => isArchiveView ? n.isArchived : !n.isArchived);

        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = `<p style="color: var(--text-secondary); width: 100%; text-align: center; margin-top: 20px;">No notes found in ${isArchiveView ? 'Archive' : 'Active'}.</p>`;
            notesSectionTitle.style.display = 'none';
            unpinnedNotesSectionTitle.style.display = 'none';
            return;
        }

        const pinnedNotes = filteredNotes.filter(n => n.pinned);
        const unpinnedNotes = filteredNotes.filter(n => !n.pinned);

        const showSections = !isArchiveView && pinnedNotes.length > 0;
        notesSectionTitle.style.display = showSections ? 'block' : 'none';
        unpinnedNotesSectionTitle.style.display = showSections && unpinnedNotes.length > 0 ? 'block' : 'none';
        
        const renderCard = (note, container) => {
            const lines = note.content.split('\n');
            const title = lines.length > 0 && lines[0].trim().startsWith('# ') ? lines[0].replace('# ', '') : (lines[0].length > 30 ? lines[0].substring(0, 30) + '...' : lines[0]);
            const body = lines.slice(1).join('<br>').substring(0, 150) || lines.join('<br>').substring(0, 150);

            const card = document.createElement('div');
            card.className = 'keep-note glass-panel';
            card.style.cssText = `
                break-inside: avoid; margin-bottom: 15px; 
                background: rgba(30, 30, 30, 0.6); 
                border: 1px solid rgba(255,255,255,0.2); 
                padding: 16px; border-radius: 8px; 
                position: relative; cursor: pointer; 
                display: flex; flex-direction: column; 
                min-height: 120px; transition: box-shadow 0.2s, background 0.2s;
            `;
            
            card.addEventListener('mouseenter', () => card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)');
            card.addEventListener('mouseleave', () => card.style.boxShadow = 'none');

            const pinIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
            const archiveIcon = note.isArchived 
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="12" y1="12" x2="12" y2="16"></line><polyline points="10 14 12 12 14 14"></polyline></svg>` 
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 1.1em; font-weight: 500; color: var(--text-primary);">${title}</h4>
                    <button class="btn-icon btn-pin-toggle" data-id="${note.id}" style="background: none; border: none; color: ${note.pinned ? '#ffeb3b' : 'rgba(255,255,255,0.5)'}; cursor: pointer; padding: 4px;" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${pinIcon}
                    </button>
                </div>
                <div style="flex-grow: 1;">
                    <p style="margin: 0; font-size: 0.95em; color: rgba(255,255,255,0.85); overflow-wrap: anywhere; line-height: 1.4;">${body}</p>
                </div>
                <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; opacity: 0.7;">
                    <div style="font-size: 0.75em; color: rgba(255,255,255,0.5);">${new Date(note.created_at).toLocaleDateString()}</div>
                    <button class="btn-icon btn-archive-toggle" data-id="${note.id}" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;" title="${note.isArchived ? 'Restore' : 'Archive'}">
                        ${archiveIcon}
                    </button>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                openNoteEditor(note);
            });

            card.querySelector('.btn-pin-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNotePin(note);
            });

            card.querySelector('.btn-archive-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNoteArchive(note);
            });

            container.appendChild(card);
        };

        if (!isArchiveView) {
            pinnedNotes.forEach(note => renderCard(note, pinnedNotesGrid));
            unpinnedNotes.forEach(note => renderCard(note, notesGrid));
        } else {
            filteredNotes.forEach(note => renderCard(note, notesGrid));
        }
    }

    async function loadNotes() {
        try {
            const res = await fetch(API_NOTES);
            if (res.ok) {
                const data = await res.json();
                currentNotes = data.notes || [];
                renderNotesGrid();
            }
        } catch (e) {
            showToast('Failed to load notes');
            console.error(e);
        }
    }

    async function saveNote(noteData) {
        try {
            if (editingNoteId) {
                const res = await fetch(`\${API_NOTES}/\${editingNoteId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(noteData)
                });
                if (res.ok) showToast('Note updated', 'success');
            } else {
                const res = await fetch(API_NOTES, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...noteData, author: 'user' })
                });
                if (res.ok) showToast('Note created', 'success');
            }
            noteEditorExpanded.classList.add('hidden');
            noteEditorCollapsed.classList.remove('hidden');
            editingNoteId = null;
            loadNotes();
        } catch (e) {
            showToast('Failed to save note');
            console.error(e);
        }
    }

    async function toggleNotePin(note) {
        try {
            await fetch(`\${API_NOTES}/\${note.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinned: !note.pinned })
            });
            loadNotes();
        } catch (e) {
            showToast('Failed to update note status');
        }
    }

    async function toggleNoteArchive(note) {
        try {
            await fetch(`\${API_NOTES}/\${note.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: !note.isArchived })
            });
            loadNotes();
        } catch (e) {
            showToast('Failed to archive note');
        }
    }

    function openNoteEditor(note = null) {
        if (note) {
            editingNoteId = note.id;
            const lines = note.content.split('\\n');
            if (lines.length > 0 && lines[0].startsWith('# ')) {
                editNoteTitle.value = lines[0].replace('# ', '');
                editNoteBody.value = lines.slice(1).join('\\n');
            } else {
                editNoteTitle.value = '';
                editNoteBody.value = note.content;
            }
            btnPinNote.classList.toggle('btn-neon-blue', note.pinned);
            btnPinNote.dataset.pinned = note.pinned ? "true" : "false";
        } else {
            editingNoteId = null;
            editNoteTitle.value = '';
            editNoteBody.value = '';
            btnPinNote.classList.remove('btn-neon-blue');
            btnPinNote.dataset.pinned = "false";
        }
        noteEditorCollapsed.classList.add('hidden');
        noteEditorExpanded.classList.remove('hidden');
        if (!note) {
            editNoteTitle.focus();
        }
    }

    noteEditorCollapsed.addEventListener('click', () => openNoteEditor());
    
    function closeAndSaveNote() {
        const title = editNoteTitle.value.trim();
        const body = editNoteBody.value.trim();
        if (title || body) {
            const content = title ? `# ${title}\n${body}` : body;
            const pinned = btnPinNote.dataset.pinned === "true";
            saveNote({ content, pinned });
        } else {
            noteEditorExpanded.classList.add('hidden');
            noteEditorCollapsed.classList.remove('hidden');
            editingNoteId = null;
        }
    }

    btnCancelNoteEdit.addEventListener('click', closeAndSaveNote);
    
    btnPinNote.addEventListener('click', () => {
        const isPinned = btnPinNote.dataset.pinned === "true";
        btnPinNote.dataset.pinned = !isPinned ? "true" : "false";
        btnPinNote.style.color = !isPinned ? '#ffeb3b' : 'rgba(255,255,255,0.5)';
        btnPinNote.querySelector('svg').setAttribute('fill', !isPinned ? 'currentColor' : 'none');
    });

    if (btnToggleArchiveView) {
        btnToggleArchiveView.addEventListener('click', () => {
            currentNotesTab = currentNotesTab === 'archive' ? 'active' : 'archive';
            btnToggleArchiveView.style.color = currentNotesTab === 'archive' ? '#2196f3' : 'rgba(255,255,255,0.7)';
            renderNotesGrid();
        });
    }

    loadNotes();

    // --- 3. Sync Button ---
    btnSyncOps.addEventListener('click', async () => {
        if (btnSyncOps.classList.contains('btn-offline')) return;

        const syncIcon = btnSyncOps.querySelector('.sync-icon');
        if (syncIcon) syncIcon.classList.add('spinning');
        btnSyncOps.title = "Syncing...";
        btnSyncOps.disabled = true;

        try {
            const res = await fetch(API_OPS_SYNC, { method: 'POST' });
            if (res.status === 401) {
                if (window.authRecoveryBanner) window.authRecoveryBanner.classList.remove('hidden');
                throw new Error("Calendar OAuth token expired (401)");
            }
            const data = await res.json();
            
            if (data.calendar_status === 'auth_required' || data.error === 'auth_required') {
                if (window.authRecoveryBanner) window.authRecoveryBanner.classList.remove('hidden');
            } else if (window.authRecoveryBanner) {
                window.authRecoveryBanner.classList.add('hidden');
            }

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
                        <button class="btn btn-neon-purple btn-sm btn-show-me" data-id="${data.added_event.id}">View</button>
                        <button class="btn btn-neon-green btn-sm btn-done" data-id="${data.added_event.id}">Done</button>
                    </div>
                `;
                agendaStream.prepend(card);
                attachCardEvents(card);
            }

            // Immediately reload and render daily, weekly, and monthly agenda panels
            await loadAgenda();

            if (syncIcon) {
                syncIcon.classList.remove('spinning');
                syncIcon.textContent = '✅';
            }
            btnSyncOps.title = "Synced";
            const syncedCount = (data.scanned_calendar_count || 0) + (data.scanned_gmail_count || 0);
            showToast(syncedCount > 0 ? `Synced ${syncedCount} Gmail & Calendar items with Agenda` : "Gmail & Calendar synchronized with Agenda", "success");
            setTimeout(() => {
                if (syncIcon) syncIcon.textContent = '🔄';
                btnSyncOps.title = "Sync Live Data";
                btnSyncOps.disabled = false;
            }, 2000);
        } catch (e) {
            if (syncIcon) {
                syncIcon.classList.remove('spinning');
                syncIcon.textContent = '⚠️';
            }
            btnSyncOps.title = "Offline";
            btnSyncOps.classList.add('btn-offline');
            btnSyncOps.disabled = false;
        }
    });

    // --- 4. Daily Agenda Cards ---
    function attachCardEvents(card) {
        const showBtn = card.querySelector('.btn-show-me');
        const doneBtn = card.querySelector('.btn-done');
        const dismissBtn = card.querySelector('.btn-dismiss');
        const postponeBtn = card.querySelector('.btn-postpone');
        const reinstateBtn = card.querySelector('.btn-reinstate');
        
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
        
        function isPainLog() {
            const t = type.toLowerCase();
            const i = id.toLowerCase();
            const title = (card.querySelector('.protocol-info p')?.innerText || '').toLowerCase();
            return title.includes('log pain') || title.includes('pain log') || i.includes('pain_log') || t.includes('pain');
        }

        if (showBtn) {
            showBtn.addEventListener('click', () => {
                const title = card.querySelector('.protocol-info p')?.innerText || id;
                if (isPainLog()) {
                    document.getElementById('painLogModal').classList.remove('hidden');
                } else if (isExercise()) {
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
                try {
                    const title = card.querySelector('.protocol-info p')?.innerText || id;
                    card.classList.add('completed');
                    doneBtn.innerText = "Done";
                    doneBtn.disabled = true;
                    if (id) {
                        await fetch(API_AGENDA, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, action: 'update_status', status: 'completed' })
                        });
                        loadAgenda();
                    }
                } catch (err) {
                    showToast('Failed to complete agenda item');
                    console.error(err);
                }
            });
        }

        
        if (postponeBtn) {
            postponeBtn.addEventListener('click', () => {
                if (id) {
                    itemToPostpone = id;
                    const tmr = new Date();
                    tmr.setDate(tmr.getDate() + 1);
                    tmr.setHours(10, 0, 0, 0);
                    const tzOffset = tmr.getTimezoneOffset() * 60000;
                    const localIso = new Date(tmr - tzOffset).toISOString().slice(0, 16);
                    if (postponeDateInput) postponeDateInput.value = localIso;
                    postponeModal.classList.remove('hidden');
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'dismissed' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                } else {
                    card.remove();
                }
            });
        }
        
        if (reinstateBtn) {
            reinstateBtn.addEventListener('click', () => {
                if (id) {
                    fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'update_status', status: 'pending' })
                    }).then(() => { loadAgenda(); }).catch(() => {});
                }
            });
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

    btnNextStep.addEventListener('click', () => {
        currentStepIndex++;
        if (currentStepIndex >= currentProtocolSteps.length) {
            closeRunnerModal();
        } else {
            timeLeft = currentProtocolSteps[currentStepIndex].duration;
            updateStepUI();
        }
    });

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
            moodValDisplay.innerText = currentMoodLevel;
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
                const latestRes = await fetch(API_LATEST_SYMPTOMS);
                if (latestRes.ok) latest = (await latestRes.json()).log;
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
                card.innerHTML = `<div><h3>${exercise.name}</h3><p>${exercise.instruction}</p><small>${exercise.duration_minutes} min · ${exercise.intensity}</small></div><div class="exercise-actions"><button class="btn btn-neon-green btn-sm exercise-done">Done</button><button class="btn btn-outline btn-sm exercise-show">View</button><button class="btn btn-outline btn-sm exercise-reject">Skip</button><div class="reject-reasons hidden"><button class="btn btn-sm btn-outline reject-reason" data-reason="Too tired">Too tired</button><button class="btn btn-sm btn-outline reject-reason" data-reason="Hurts">Hurts</button></div></div>`;
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
    const budgetWidget = document.getElementById('budgetWidget');
    const budgetSummaryContainer = document.getElementById('budgetSummary');
    const budgetTotalSpent = document.getElementById('budgetTotalSpent');
    const btnLogBudget = document.getElementById('btnLogBudget');
    const budgetForm = document.getElementById('budgetForm');

    if (budgetWidget && budgetForm) {
        budgetWidget.style.cursor = 'pointer';
        budgetWidget.addEventListener('click', (e) => {
            // Do not toggle if clicking inside the form or on the total spent badge (which opens modal)
            if (e.target.closest('.budget-form') || e.target.id === 'budgetTotalSpent') return;
            budgetForm.classList.toggle('hidden');
        });
    }

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
                                summaryHtml += `<span class="badge neon-blue">${cat}: $${Number(val).toFixed(2)}</span>`;
                            }
                        }
                    }
                    if (budgetSummaryContainer) budgetSummaryContainer.innerHTML = summaryHtml;
                    if (budgetTotalSpent && data.summary) budgetTotalSpent.innerText = `Spent: $${Number(data.summary.Total || 0).toFixed(2)}`;
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

    // --- 10. Budget Overview Modal & Chart ---
    const budgetOverviewModal = document.getElementById('budgetOverviewModal');
    const btnCloseBudgetOverview = document.getElementById('btnCloseBudgetOverview');
    const budgetMonthSelect = document.getElementById('budgetMonthSelect');
    let budgetChartInstance = null;

    if (budgetTotalSpent) {
        budgetTotalSpent.style.cursor = 'pointer';
        budgetTotalSpent.addEventListener('click', () => {
            if (budgetOverviewModal) {
                budgetOverviewModal.classList.remove('hidden');
                renderBudgetChart();
            }
        });
    }

    if (btnCloseBudgetOverview) {
        btnCloseBudgetOverview.addEventListener('click', () => {
            budgetOverviewModal.classList.add('hidden');
        });
    }

    if (budgetMonthSelect) {
        budgetMonthSelect.addEventListener('change', () => {
            renderBudgetChart();
        });
    }

    function renderBudgetChart() {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;
        
        // Mock data for weekly overviews grouped by month
        const month = budgetMonthSelect ? budgetMonthSelect.value : '2026-08';
        
        // In a real scenario, this data would come from the API grouped by week.
        const mockData = {
            '2026-08': {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                groceries: [120, 150, 110, 180],
                medical: [50, 0, 200, 0],
                entertainment: [30, 40, 20, 50],
                other: [10, 15, 5, 20]
            },
            '2026-07': {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                groceries: [110, 140, 120, 130],
                medical: [0, 0, 50, 0],
                entertainment: [40, 30, 40, 30],
                other: [20, 10, 15, 10]
            },
            '2026-06': {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                groceries: [130, 160, 140, 120],
                medical: [100, 50, 0, 0],
                entertainment: [20, 50, 30, 40],
                other: [5, 5, 10, 15]
            }
        };

        const data = mockData[month] || mockData['2026-08'];

        if (budgetChartInstance) {
            budgetChartInstance.destroy();
        }

        budgetChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Groceries',
                        data: data.groceries,
                        backgroundColor: 'rgba(0, 230, 118, 0.7)',
                        borderColor: 'rgba(0, 230, 118, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Medical',
                        data: data.medical,
                        backgroundColor: 'rgba(255, 61, 0, 0.7)',
                        borderColor: 'rgba(255, 61, 0, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Entertainment',
                        data: data.entertainment,
                        backgroundColor: 'rgba(0, 176, 255, 0.7)',
                        borderColor: 'rgba(0, 176, 255, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Other',
                        data: data.other,
                        backgroundColor: 'rgba(158, 158, 158, 0.7)',
                        borderColor: 'rgba(158, 158, 158, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                }
            }
        });

        // Update detailed stats
        const statsContainer = document.getElementById('budgetDetailedStats');
        if (statsContainer) {
            const totalGroceries = data.groceries.reduce((a, b) => a + b, 0);
            const totalMedical = data.medical.reduce((a, b) => a + b, 0);
            const totalEntertainment = data.entertainment.reduce((a, b) => a + b, 0);
            const totalOther = data.other.reduce((a, b) => a + b, 0);
            const grandTotal = totalGroceries + totalMedical + totalEntertainment + totalOther;

            statsContainer.innerHTML = `
                <div class="glass-panel" style="padding: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Total Spent</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #fff;">$${grandTotal}</div>
                </div>
                <div class="glass-panel" style="padding: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Groceries</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: rgba(0, 230, 118, 1);">$${totalGroceries}</div>
                </div>
                <div class="glass-panel" style="padding: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Medical</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: rgba(255, 61, 0, 1);">$${totalMedical}</div>
                </div>
                <div class="glass-panel" style="padding: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Entertainment</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: rgba(0, 176, 255, 1);">$${totalEntertainment}</div>
                </div>
            `;
        }
    }

    const btnPrintBudgetReport = document.getElementById('btnPrintBudgetReport');
    if (btnPrintBudgetReport) {
        btnPrintBudgetReport.addEventListener('click', () => {
            window.print();
        });
    }

    loadBudget();
    // --- 11. Settings Logic ---
    const btnSettings = document.getElementById('btnSettings');

    const tabProfile = document.getElementById('tabProfile');
    const tabPreferences = document.getElementById('tabPreferences');
    const tabIntegrations = document.getElementById('tabIntegrations');
    
    const settingsProfile = document.getElementById('settingsProfile');
    const settingsPreferences = document.getElementById('settingsPreferences');
    const settingsIntegrations = document.getElementById('settingsIntegrations');

    function switchSettingsTab(activeTab, activeContent) {
        [tabProfile, tabPreferences, tabIntegrations].forEach(t => {
            if(t) {
                t.classList.remove('active', 'btn-neon-blue');
                t.classList.add('btn-outline');
            }
        });
        [settingsProfile, settingsPreferences, settingsIntegrations].forEach(c => {
            if(c) c.classList.add('hidden');
        });

        if(activeTab) {
            activeTab.classList.remove('btn-outline');
            activeTab.classList.add('active', 'btn-neon-blue');
        }
        if(activeContent) {
            activeContent.classList.remove('hidden');
        }
    }

    if (tabProfile) tabProfile.addEventListener('click', () => switchSettingsTab(tabProfile, settingsProfile));
    if (tabPreferences) tabPreferences.addEventListener('click', () => switchSettingsTab(tabPreferences, settingsPreferences));
    if (tabIntegrations) tabIntegrations.addEventListener('click', () => switchSettingsTab(tabIntegrations, settingsIntegrations));

    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const themeSelector = document.getElementById('themeSelector');

    if (btnSettings && settingsModal) {
        btnSettings.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    if (themeSelector) {
        // Load saved theme
        const savedTheme = localStorage.getItem('rumble_theme') || 'theme-default';
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);

        themeSelector.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            applyTheme(newTheme);
            localStorage.setItem('rumble_theme', newTheme);
        });
    }

    function applyTheme(themeName) {
        // Remove existing theme classes
        document.body.classList.remove('theme-default', 'theme-midnight', 'theme-cyberpunk', 'theme-forest');
        if (themeName !== 'theme-default') {
            document.body.classList.add(themeName);
        }
    }

});

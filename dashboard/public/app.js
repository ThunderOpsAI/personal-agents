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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
    const API_CALENDAR_EVENTS = `${API_BASE}/api/v1/calendar/events`;
    const API_BUDGET_SUMMARY = `${API_BASE}/api/v1/budget/summary`;
    const API_BUDGET_REPORTS = `${API_BASE}/api/v1/budget/reports`;
    const API_BUDGET_RESET = `${API_BASE}/api/v1/budget/reset`;
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
    const postponeItemSummary = document.getElementById('postponeItemSummary');
    let itemToPostpone = null;

    const dismissConfirmModal = document.getElementById('dismissConfirmModal');
    const btnCloseDismissConfirm = document.getElementById('btnCloseDismissConfirm');
    const btnCancelDismiss = document.getElementById('btnCancelDismiss');
    const btnConfirmDismiss = document.getElementById('btnConfirmDismiss');
    const dismissConfirmItemTitle = document.getElementById('dismissConfirmItemTitle');
    let itemToDismiss = null;
    let cardToDismiss = null;
    
    const btnOpenRumbleChat = document.getElementById('btnOpenRumbleChat');
    const btnSyncOps = document.getElementById('btnSyncOps');
    const btnOpenNotes = document.getElementById('btnOpenNotes');
    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settingsModal');
    const btnOpenPainLog = document.getElementById('btnOpenPainLog');
    const painAnalyticsModal = document.getElementById('painAnalyticsModal');
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
    const cbtProgressBadge = document.getElementById('cbtProgressBadge');
    const cbtCurrentTitle = document.getElementById('cbtCurrentTitle');

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
    const btnToggleFollowUpView = document.getElementById('btnToggleFollowUpView');
    const followUpWorkspace = document.getElementById('followUpWorkspace');
    const standardNotesWorkspace = document.getElementById('standardNotesWorkspace');
    const followUpTextarea = document.getElementById('followUpTextarea');
    const btnSaveFollowUp = document.getElementById('btnSaveFollowUp');
    const followUpSaveStatus = document.getElementById('followUpSaveStatus');
    const inlineNoteEditorContainer = document.getElementById('inlineNoteEditorContainer');
    let followUpNoteId = null;
    
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
    let cachedAgendaData = null;
    
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
    function showAgendaSkeleton() {
        const stream = document.getElementById("agendaStream");
        if (!stream) return;
        if (stream.querySelector('.agenda-skeleton-card')) return;
        const skeletonHtml = `
            <div class="protocol-card glass-panel agenda-skeleton-card">
                <div class="protocol-info">
                    <div class="skeleton-line" style="width: 35%; height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 75%; height: 14px;"></div>
                </div>
            </div>
            <div class="protocol-card glass-panel agenda-skeleton-card">
                <div class="protocol-info">
                    <div class="skeleton-line" style="width: 30%; height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 85%; height: 14px;"></div>
                </div>
            </div>
        `;
        stream.insertAdjacentHTML('beforeend', skeletonHtml);
    }

    function removeAgendaSkeletons() {
        document.querySelectorAll('.agenda-skeleton-card').forEach(s => s.remove());
    }

    async function loadAgenda() {
        if (!cachedAgendaData) {
            showAgendaSkeleton();
        }
        try {
            const res = await fetch(API_AGENDA, { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            removeAgendaSkeletons();
            if (res.ok) {
                const data = await res.json();
                cachedAgendaData = data;
                
                // Clear any previous error boundary
                document.querySelectorAll('.agenda-error-card').forEach(e => e.remove());

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
            removeAgendaSkeletons();
            showToast('Failed to load agenda', 'error');
            console.error(e);
            const stream = document.getElementById("agendaStream");
            if (stream && !stream.querySelector('.agenda-error-card') && !stream.querySelector('.protocol-card:not(#protocol-learn):not(#executive-briefing)')) {
                const errCard = document.createElement('div');
                errCard.className = 'protocol-card glass-panel agenda-error-card';
                errCard.innerHTML = `
                    <div class="protocol-info">
                        <h3 style="color: var(--neon-red);">⚠️ Sync Latency</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Failed to connect to live agenda service. Tap retry to reconnect.</p>
                    </div>
                    <div class="protocol-actions">
                        <button class="btn btn-neon-blue btn-sm btn-retry-agenda">Retry Sync</button>
                    </div>
                `;
                stream.appendChild(errCard);
                errCard.querySelector('.btn-retry-agenda')?.addEventListener('click', () => {
                    errCard.remove();
                    loadAgenda();
                });
            }
        }
    }

    const optimisticRemovedTasks = new Set();

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

        const dailyItems = (data.daily || []).filter(item => 
            !optimisticRemovedTasks.has(item.id)
        );
        const countBadge = document.getElementById('agendaCount');
        const remainingCount = dailyItems.filter(i => i.status === 'pending').length;
        if (countBadge) countBadge.textContent = `${remainingCount} Remaining`;
        
        document.querySelectorAll('.protocol-card:not(#protocol-learn):not(#executive-briefing):not(.agenda-skeleton-card):not(.agenda-error-card)').forEach(c => c.remove());

        if (dailyItems.length > 0) {
            dailyItems.forEach(item => {
                if (item.item_type === 'learning' || item.id === 'protocol-learn') return;
                const isCompleted = item.status === 'completed';
                const isDismissed = item.status === 'dismissed';

                const card = document.createElement('div');
                card.className = `protocol-card glass-panel${isCompleted ? ' completed' : ''}${isDismissed ? ' dismissed' : ''}`;
                card.id = `protocol-${item.id}`;
                
                if (isCompleted) {
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3>${item.time}</h3>
                            <p style="text-decoration: line-through; opacity: 0.65;">${escapeHtml(item.title)}</p>
                            <small class="form-hint" style="color: var(--neon-green);">Completed</small>
                        </div>
                        <div class="protocol-actions">
                            <span class="badge neon-green" style="margin-right: 4px;">Done</span>
                            <button class="btn btn-outline btn-sm btn-reinstate" data-id="${item.id}" data-type="${item.item_type || ''}" title="Reopen item">Undo</button>
                        </div>
                    `;
                } else if (isDismissed) {
                    card.style.opacity = '0.5';
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3>${item.time}</h3>
                            <p style="text-decoration: line-through; opacity: 0.5;">${escapeHtml(item.title)}</p>
                            <small class="form-hint" style="color: var(--text-muted);">Dismissed</small>
                        </div>
                        <div class="protocol-actions">
                            <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); margin-right: 4px;">Dismissed</span>
                            <button class="btn btn-outline btn-sm btn-reinstate" data-id="${item.id}" data-type="${item.item_type || ''}" title="Reinstate item">Reinstate</button>
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3>${item.time}</h3>
                            <p>${escapeHtml(item.title)}</p>
                            ${item.choices ? `<small class="form-hint">Choices: ${item.choices.join(' · ')}</small>` : ''}
                        </div>
                        <div class="protocol-actions">
                            <button class="btn btn-neon-purple btn-sm btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}">View</button>
                            <button class="btn btn-neon-green btn-sm btn-done" data-id="${item.id}" data-type="${item.item_type || ''}">Done</button>
                            <button class="btn btn-outline btn-sm btn-postpone" data-id="${item.id}" data-type="${item.item_type || ''}">Delay</button>
                            <button class="btn btn-outline btn-sm btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}">Dismiss</button>
                        </div>
                    `;
                }
                document.getElementById("agendaStream").appendChild(card);
                attachCardEvents(card);
            });
        }
        
        const cards = Array.from(document.getElementById("agendaStream").querySelectorAll('.protocol-card:not(.agenda-skeleton-card):not(.agenda-error-card)'));
        cards.sort((a, b) => {
            const isDoneA = a.classList.contains('completed') || a.classList.contains('dismissed');
            const isDoneB = b.classList.contains('completed') || b.classList.contains('dismissed');
            if (isDoneA !== isDoneB) {
                return isDoneA ? 1 : -1;
            }
            const h3A = a.querySelector('h3');
            const h3B = b.querySelector('h3');
            const timeStrA = h3A ? h3A.innerText.trim() : '';
            const timeStrB = h3B ? h3B.innerText.trim() : '';
            const parseTime = (str) => {
                const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return 999;
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
                weekends: false,
                firstDay: 1,
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
            { id: 'yest_med_2100', time: '09:00 PM', title: 'Sleep Meditation', item_type: 'meditation', status: 'completed' }
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
            { id: 'tom_yoga_1700', time: '05:00 PM', title: 'Shoulder & Neck Decompression', item_type: 'yoga', status: 'pending' },
            { id: 'tom_med_2100', time: '09:00 PM', title: 'Sleep Meditation', item_type: 'meditation', status: 'pending' }
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

    // Postpone / Delay Modal Logic
    let activePostponeItemTitle = '';
    let activePostponeItemType = 'task';
    let activeDismissItemTitle = '';
    let activeDismissItemType = 'task';

    if (btnClosePostpone) btnClosePostpone.addEventListener('click', () => postponeModal && postponeModal.classList.add('hidden'));
    if (btnCancelPostpone) btnCancelPostpone.addEventListener('click', () => postponeModal && postponeModal.classList.add('hidden'));
    
    // Close modal when clicking on backdrop
    if (postponeModal) {
        postponeModal.addEventListener('click', (e) => {
            if (e.target === postponeModal) postponeModal.classList.add('hidden');
        });
    }
    if (dismissConfirmModal) {
        dismissConfirmModal.addEventListener('click', (e) => {
            if (e.target === dismissConfirmModal) dismissConfirmModal.classList.add('hidden');
        });
    }

    // Quick Postpone Preset Buttons
    document.querySelectorAll('.btn-quick-postpone').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.btn-quick-postpone').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const hours = btn.getAttribute('data-hours');
            const tomorrowTime = btn.getAttribute('data-tomorrow');
            let targetDate = new Date();

            if (hours) {
                targetDate.setHours(targetDate.getHours() + parseInt(hours, 10));
            } else if (tomorrowTime) {
                const [h, m] = tomorrowTime.split(':').map(n => parseInt(n, 10));
                targetDate.setDate(targetDate.getDate() + 1);
                targetDate.setHours(h, m, 0, 0);
            }

            const tzOffset = targetDate.getTimezoneOffset() * 60000;
            const localIso = new Date(targetDate - tzOffset).toISOString().slice(0, 16);

            if (postponeDateInput) {
                postponeDateInput.value = localIso;
            }
        });
    });

    if (btnConfirmPostpone) {
        btnConfirmPostpone.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!itemToPostpone) return;

            const selectedDate = postponeDateInput?.value;
            if (!selectedDate) {
                showToast('Please select a date and time');
                return;
            }

            btnConfirmPostpone.disabled = true;
            btnConfirmPostpone.innerText = 'Rescheduling...';

            try {
                const res = await fetch(API_AGENDA, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: itemToPostpone,
                        action: 'reschedule',
                        new_date: selectedDate,
                        title: activePostponeItemTitle || 'Daily Protocol',
                        item_type: activePostponeItemType || 'task'
                    })
                });

                if (!res.ok) {
                    throw new Error(`Status ${res.status}`);
                }

                if (postponeModal) postponeModal.classList.add('hidden');
                showToast('Agenda item rescheduled', 'success');
                loadAgenda();
            } catch (err) {
                console.error('Failed to reschedule:', err);
                showToast('Failed to postpone item');
            } finally {
                btnConfirmPostpone.disabled = false;
                btnConfirmPostpone.innerText = 'Reschedule';
            }
        });
    }

    // Dismiss Confirmation Modal Logic
    if (btnCloseDismissConfirm) btnCloseDismissConfirm.addEventListener('click', () => dismissConfirmModal && dismissConfirmModal.classList.add('hidden'));
    if (btnCancelDismiss) btnCancelDismiss.addEventListener('click', () => dismissConfirmModal && dismissConfirmModal.classList.add('hidden'));

    if (btnConfirmDismiss) {
        btnConfirmDismiss.addEventListener('click', async () => {
            if (dismissConfirmModal) dismissConfirmModal.classList.add('hidden');
            if (itemToDismiss) {
                try {
                    const currentCard = cardToDismiss || document.getElementById(`protocol-${itemToDismiss}`);
                    if (currentCard) {
                        currentCard.classList.add('dismissed');
                        const textP = currentCard.querySelector('.protocol-info p');
                        if (textP) {
                            textP.style.textDecoration = 'line-through';
                            textP.style.opacity = '0.5';
                        }
                        const actionsDiv = currentCard.querySelector('.protocol-actions');
                        if (actionsDiv) {
                            actionsDiv.innerHTML = `
                                <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); margin-right: 4px;">Dismissed</span>
                                <button class="btn btn-outline btn-sm btn-reinstate" data-id="${itemToDismiss}" data-type="${activeDismissItemType || ''}">Reinstate</button>
                            `;
                            actionsDiv.querySelector('.btn-reinstate')?.addEventListener('click', () => {
                                fetch(API_AGENDA, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: itemToDismiss, action: 'update_status', status: 'pending' })
                                }).then(() => loadAgenda()).catch(() => {});
                            });
                        }
                        const stream = document.getElementById("agendaStream");
                        if (stream) stream.appendChild(currentCard);
                    }
                    showToast('Item dismissed from agenda', 'info');

                    await fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: itemToDismiss, action: 'update_status', status: 'dismissed' })
                    });
                    loadAgenda();
                } catch (err) {
                    console.error('Failed to dismiss:', err);
                    showToast('Failed to dismiss item');
                }
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
                } else if (enc.id === 'cbt') {
                    if (cbtProgressBadge) cbtProgressBadge.innerText = badgeText;
                    if (cbtCurrentTitle) cbtCurrentTitle.innerText = titleText;
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

    const btnExportChat = document.getElementById('btnExportChat');
    if (btnExportChat) {
        btnExportChat.addEventListener('click', () => {
            const msgs = Array.from(rumbleChatMessages.querySelectorAll('.message')).map(m => {
                const isUser = m.classList.contains('user-message');
                return { role: isUser ? 'user' : 'rumble', text: m.innerText };
            });
            navigator.clipboard.writeText(JSON.stringify(msgs, null, 2)).then(() => {
                showToast('Chat exported to clipboard');
            }).catch(e => {
                showToast('Failed to export chat');
                console.error(e);
            });
        });
    }

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

    function formatRumbleMarkdown(raw) {
        if (!raw) return "Understood.";
        let text = raw.trim();

        // 1. Clean up internal bracket confirmations
        text = text.replace(/⚠️\s*Confirmation required:.*$/im, "").trim();

        // 2. Separate medical disclaimer to render as styled footer
        let disclaimerHtml = "";
        const disclaimerMatch = text.match(/(Medical output is decision support, not diagnosis\..*)$/i);
        if (disclaimerMatch) {
            disclaimerHtml = `<div class="chat-disclaimer">${escapeHtml(disclaimerMatch[1])}</div>`;
            text = text.substring(0, text.length - disclaimerMatch[0].length).trim();
        }

        // 3. Highlight email drafts if present
        text = text.replace(/(?:^|\n)(To:\s*[^\n]+\nSubject:\s*[^\n]+[\s\S]*?(?=\n\n|\n---|$))/gi, (match) => {
            return `\n<div class="chat-highlight-card">` + match.trim().split('\n').map(l => {
                if (/^To:/i.test(l)) return `<div style="font-weight: 600; color: var(--neon-blue);">${escapeHtml(l)}</div>`;
                if (/^Subject:/i.test(l)) return `<div style="font-weight: 600; margin-bottom: 8px;">${escapeHtml(l)}</div>`;
                return `<div>${escapeHtml(l)}</div>`;
            }).join('') + `</div>\n`;
        });

        // 4. Convert markdown bold and code
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.4); padding: 2px 5px; border-radius: 4px; color: var(--neon-blue);">$1</code>');

        // 5. Convert markdown headers (### Header, ## Header)
        text = text.replace(/^###\s+([^\n]+)/gm, '<h4 style="margin: 12px 0 4px 0; color: var(--neon-blue);">$1</h4>');
        text = text.replace(/^##\s+([^\n]+)/gm, '<h3 style="margin: 14px 0 6px 0; color: var(--neon-blue); font-size: 1.05rem;">$1</h3>');

        // 6. Convert bullet lists
        text = text.replace(/^\s*[\*\-•]\s+([^\n]+)/gm, '<li style="margin-left: 18px; margin-bottom: 4px;">$1</li>');

        // 7. Convert horizontal rules
        text = text.replace(/^---+$/gm, '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;">');

        // 8. Convert remaining newlines
        text = text.replace(/\n\n+/g, '<div style="height: 8px;"></div>');
        text = text.replace(/\n/g, '<br>');

        return text + disclaimerHtml;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    if (btnChatAttach && chatFileInput) {
        btnChatAttach.addEventListener('click', () => {
            chatFileInput.click();
        });
    }

    if (chatFileInput) {
        chatFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleChatFileSelection(e.target.files[0]);
            }
        });
    }

    if (chatCameraInput) {
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
        let userContent = `<strong>You:</strong> ${escapeHtml(msg) || 'Attached photo/document for analysis'}`;
        if (attached) {
            if (attached.mimeType.startsWith('image/')) {
                userContent += `<div style="margin-top: 6px;"><img src="${attached.data}" style="max-width: 180px; max-height: 140px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);"></div>`;
            } else {
                userContent += `<div style="margin-top: 6px; font-size: 0.85rem; color: var(--neon-blue);">📄 ${escapeHtml(attached.filename) || 'Attached document'}</div>`;
            }
        }
        userDiv.innerHTML = userContent;
        rumbleChatMessages.appendChild(userDiv);
        rumbleChatInput.value = '';
        rumbleChatInput.style.height = 'auto';
        clearChatAttachment();
        rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

        const isConfirmation = explicitAction || (pendingChatAction && /^(?:yes|confirm|confirmed|save|commit|proceed|do it|add it)\b/i.test(msg));
        const actionToCommit = explicitAction || (isConfirmation ? pendingChatAction : null);

        try {
            const payload = {
                message: msg || 'Please analyze this attached photo/document and extract relevant appointments, instructions, or notes.',
                proposal_context: currentProposalText,
                ...(attached ? { attachment: attached } : {}),
                ...(actionToCommit ? { confirm_action: actionToCommit } : {})
            };

            const response = await fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> ${formatRumbleMarkdown(data.reply)}`;

            if (data.requires_confirmation && data.preview) {
                pendingChatAction = data.preview;
                const actionsRow = document.createElement('div');
                actionsRow.style.cssText = 'margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;';
                
                let confirmLabel = 'Confirm';
                const hasSendEmail = data.preview.type === 'send_email' || (data.preview.data?.actions && data.preview.data.actions.some(a => a.type === 'send_email'));
                if (hasSendEmail) {
                    confirmLabel = 'Confirm & Send Email';
                } else if (data.preview.type === 'pain_log') {
                    confirmLabel = 'Confirm Pain Log';
                }

                const btnConfirm = document.createElement('button');
                btnConfirm.className = 'btn btn-neon-green btn-sm';
                btnConfirm.innerText = confirmLabel;
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

    const btnCancelSettings = document.getElementById('btnCancelSettings');
    if (btnCancelSettings && settingsModal) {
        btnCancelSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings && settingsModal) {
        btnSaveSettings.addEventListener('click', () => {
            showToast('Settings saved successfully', 'success');
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
    
    rumbleChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendRumbleChatMessage();
        }
    });

    rumbleChatInput.addEventListener('input', () => {
        rumbleChatInput.style.height = 'auto';
        rumbleChatInput.style.height = Math.min(rumbleChatInput.scrollHeight, 220) + 'px';
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
    if (btnOpenPainLog) btnOpenPainLog.addEventListener('click', () => {
        renderPainModal();
        if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();
        painLogModal.classList.remove('hidden');
    });
    if (btnClosePainLog) btnClosePainLog.addEventListener('click', closePainLog);
    if (btnCancelPainLog) btnCancelPainLog.addEventListener('click', closePainLog);

    // Dynamic 1-3 Pain Areas State
    let selectedPainAreas = [
        { area: "Right Lumbar", percent: 75, score: 7.5 },
        { area: "Neck / Cervical", percent: 25, score: 5.0 }
    ];

    const dynamicPainCardsContainer = document.getElementById('dynamicPainCardsContainer');
    const painAnatomyChipsGrid = document.getElementById('painAnatomyChipsGrid');
    const painSelectedCountBadge = document.getElementById('painSelectedCountBadge');
    const painTotalPercentDisplay = document.getElementById('painTotalPercentDisplay');
    const btnAutoBalancePain = document.getElementById('btnAutoBalancePain');
    const moodLabelDisplay = document.getElementById('moodLabelDisplay');

    function getPainTotalPercent() {
        return selectedPainAreas.reduce((sum, s) => sum + Number(s.percent), 0);
    }

    function autoBalancePainModal() {
        const count = selectedPainAreas.length;
        if (count === 1) {
            selectedPainAreas[0].percent = 100;
        } else if (count === 2) {
            selectedPainAreas[0].percent = 75;
            selectedPainAreas[1].percent = 25;
        } else if (count === 3) {
            selectedPainAreas[0].percent = 70;
            selectedPainAreas[1].percent = 20;
            selectedPainAreas[2].percent = 10;
        }
    }

    function togglePainAreaSelection(areaName) {
        const existingIdx = selectedPainAreas.findIndex(s => s.area === areaName);
        if (existingIdx !== -1) {
            if (selectedPainAreas.length <= 1) {
                showToast('You must keep at least 1 pain area selected');
                return;
            }
            selectedPainAreas.splice(existingIdx, 1);
            autoBalancePainModal();
        } else {
            if (selectedPainAreas.length >= 3) {
                showToast('Maximum 3 pain areas can be selected at a time');
                return;
            }
            selectedPainAreas.push({
                area: areaName,
                percent: 10,
                score: 5.0
            });
            autoBalancePainModal();
        }
        renderPainModal();
    }

    function adjustPainSlotPercent(areaName, delta) {
        const slot = selectedPainAreas.find(s => s.area === areaName);
        if (!slot) return;

        const currentTotal = getPainTotalPercent();
        const maxAllowed = 100 - (currentTotal - slot.percent);

        if (delta > 0) {
            const nextVal = Math.min(maxAllowed, slot.percent + delta);
            slot.percent = Math.floor(nextVal / 5) * 5;
        } else {
            const nextVal = Math.max(5, slot.percent + delta);
            slot.percent = Math.floor(nextVal / 5) * 5;
        }
        renderPainModal();
    }

    function renderPainModal() {
        if (!dynamicPainCardsContainer || !painAnatomyChipsGrid) return;
        
        const totalPct = getPainTotalPercent();
        const selectedNames = selectedPainAreas.map(s => s.area);

        // Update Top Chips
        painAnatomyChipsGrid.querySelectorAll('.anatomy-chip-btn').forEach(btn => {
            const area = btn.getAttribute('data-area');
            const isSel = selectedNames.includes(area);
            btn.classList.toggle('selected', isSel);
            btn.innerText = (isSel ? '✓ ' : '') + area;
        });

        // Update Count Badge
        if (painSelectedCountBadge) {
            painSelectedCountBadge.innerText = `${selectedPainAreas.length}/3 Selected`;
        }

        // Render Dynamic Cards
        const borderColors = ['#00f0ff', '#a855f7', '#00e676'];
        dynamicPainCardsContainer.innerHTML = selectedPainAreas.map((slot, idx) => {
            const color = borderColors[idx % borderColors.length];
            const canStepUp = totalPct < 100;
            const canStepDown = slot.percent > 5;

            return `
                <div class="pain-slot-card" style="border-left: 4px solid ${color};">
                    <div class="pain-slot-header">
                        <strong style="color: ${color}; font-size: 0.9rem;">
                            Section ${idx + 1}: ${slot.area}
                        </strong>
                        ${selectedPainAreas.length > 1 ? `
                            <button type="button" class="btn btn-sm btn-outline btn-deselect-pain-slot" data-area="${slot.area}" style="font-size: 0.72rem; padding: 2px 8px; color: #ff6e40; border-color: rgba(255, 61, 0, 0.4);">
                                Deselect
                            </button>
                        ` : ''}
                    </div>
                    <div class="pain-slot-controls">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Pain % Weight</label>
                            <div class="stepper-box-5pct">
                                <button type="button" class="btn-step-down-pain" data-area="${slot.area}" ${!canStepDown ? 'disabled' : ''} title="Decrease 5%">▼</button>
                                <span class="stepper-val">${slot.percent}%</span>
                                <button type="button" class="btn-step-up-pain" data-area="${slot.area}" ${!canStepUp ? 'disabled' : ''} title="Increase 5%">▲</button>
                            </div>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>Pain Score</span>
                                <strong style="color: var(--neon-red);" class="pain-score-val-label">${slot.score}/10</strong>
                            </label>
                            <input type="range" class="glass-input pain-slot-slider" data-area="${slot.area}" min="0" max="10" step="0.5" value="${slot.score}" style="width: 100%; height: 6px; padding: 0;">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Wire Event Listeners inside Dynamic Cards
        dynamicPainCardsContainer.querySelectorAll('.btn-deselect-pain-slot').forEach(btn => {
            btn.addEventListener('click', () => {
                const area = btn.getAttribute('data-area');
                togglePainAreaSelection(area);
            });
        });

        dynamicPainCardsContainer.querySelectorAll('.btn-step-up-pain').forEach(btn => {
            btn.addEventListener('click', () => {
                const area = btn.getAttribute('data-area');
                adjustPainSlotPercent(area, 5);
            });
        });

        dynamicPainCardsContainer.querySelectorAll('.btn-step-down-pain').forEach(btn => {
            btn.addEventListener('click', () => {
                const area = btn.getAttribute('data-area');
                adjustPainSlotPercent(area, -5);
            });
        });

        dynamicPainCardsContainer.querySelectorAll('.pain-slot-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const area = slider.getAttribute('data-area');
                const slot = selectedPainAreas.find(s => s.area === area);
                if (slot) {
                    slot.score = Number(e.target.value);
                    const label = slider.parentElement.querySelector('.pain-score-val-label');
                    if (label) label.innerText = `${slot.score}/10`;
                }
            });
        });

        // Update Total Percentage Bar
        if (painTotalPercentDisplay) {
            painTotalPercentDisplay.innerText = `${totalPct}% ${totalPct === 100 ? '(Balanced ✓)' : `(${100 - totalPct}% remaining)`}`;
            painTotalPercentDisplay.style.color = totalPct === 100 ? 'var(--neon-green)' : 'var(--neon-red)';
        }
        if (btnAutoBalancePain) {
            btnAutoBalancePain.style.display = totalPct !== 100 ? 'inline-block' : 'none';
        }
    }

    // Top Area Chips listener
    if (painAnatomyChipsGrid) {
        painAnatomyChipsGrid.querySelectorAll('.anatomy-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const area = btn.getAttribute('data-area');
                togglePainAreaSelection(area);
            });
        });
    }

    if (btnAutoBalancePain) {
        btnAutoBalancePain.addEventListener('click', () => {
            autoBalancePainModal();
            renderPainModal();
        });
    }

    // Quick Note Chips
    document.querySelectorAll('.pain-rhs-combined .quick-note-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.getAttribute('data-text');
            if (unifiedNotesInput) {
                unifiedNotesInput.value = unifiedNotesInput.value ? `${unifiedNotesInput.value}; ${text}` : text;
            }
        });
    });

    moodEmojiButtons.forEach(button => button.addEventListener('click', () => {
        moodEmojiButtons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        selectedMoodEmoji = button.dataset.emoji;
        if (moodLabelDisplay && button.dataset.label) {
            moodLabelDisplay.innerText = `(${button.dataset.label})`;
        }
    }));

    // Initial render of pain modal
    renderPainModal();

    // --- Today's Logged Check-ins Feed Logic ---
    async function loadTodaysPainLogs() {
        const todaysListEl = document.getElementById('todaysPainLogsList');
        const countBadge = document.getElementById('todaysPainLogsCount');
        if (!todaysListEl) return;

        try {
            const res = await fetch('/api/v1/symptoms/log');
            if (!res.ok) throw new Error('Failed to fetch pain logs');
            const data = await res.json();
            const logs = Array.isArray(data) ? data : (data.logs || []);

            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const todaysLogs = logs.filter(item => {
                const ts = item.created_at || item.timestamp;
                if (!ts) return false;
                const d = new Date(ts);
                return d.toLocaleDateString('en-CA') === todayStr;
            });

            if (countBadge) {
                countBadge.innerText = `${todaysLogs.length} Logged Today`;
            }

            if (todaysLogs.length === 0) {
                todaysListEl.innerHTML = '<div class="empty-history-hint">No pain check-ins logged yet today. Use the form above to record one.</div>';
                return;
            }

            todaysListEl.innerHTML = todaysLogs.map(item => {
                const ts = item.created_at || item.timestamp;
                const timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
                const score = Number(item.score ?? item.pain_level ?? 0);
                const scoreColor = score >= 8 ? 'var(--neon-red)' : score >= 6 ? '#ff6e40' : 'var(--neon-green)';
                const badgeBg = score >= 8 ? 'rgba(255, 61, 0, 0.2)' : score >= 6 ? 'rgba(255, 110, 64, 0.2)' : 'rgba(0, 230, 118, 0.2)';

                let locText = "Standard Distribution";
                if (Array.isArray(item.locations) && item.locations.length > 0) {
                    locText = item.locations.map(l => {
                        const side = l.side && l.side !== 'unspecified' ? `${l.side.charAt(0).toUpperCase() + l.side.slice(1)} ` : '';
                        const area = (l.area || '').toUpperCase();
                        const pct = l.percentage ?? l.weight ?? '';
                        return `${pct ? pct + '% ' : ''}${side}${area}`;
                    }).join(', ');
                } else if (Array.isArray(item.generators) && item.generators.length > 0) {
                    locText = item.generators.map(g => {
                        const side = g.side && g.side !== 'unspecified' ? `${g.side.charAt(0).toUpperCase() + g.side.slice(1)} ` : '';
                        const area = (g.area || '').toUpperCase();
                        return `${g.percentage ? g.percentage + '% ' : ''}${side}${area}`;
                    }).join(', ');
                }

                const moodText = item.mood_emoji ? `${item.mood_emoji} ${item.mood_level ?? item.mood ?? ''}` : (item.mood ? `Mood: ${item.mood}` : '');
                const notesText = item.notes || item.pain_notes || item.mood_notes || '';

                return `
                    <div class="todays-log-item">
                        <div class="todays-log-item-left">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="todays-log-time">${timeStr}</span>
                                <span class="todays-log-areas">${locText}</span>
                            </div>
                            ${notesText ? `<div class="todays-log-notes">"${escapeHtml(notesText)}"</div>` : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                            <div class="todays-log-score-badge" style="background: ${badgeBg}; color: ${scoreColor}; border: 1px solid ${scoreColor};">
                                ${score.toFixed(1)}/10
                            </div>
                            ${moodText ? `<span style="font-size: 0.72rem; color: #94a3b8;">${moodText}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.warn("Failed to load today's pain logs:", err);
            if (todaysListEl) {
                todaysListEl.innerHTML = '<div class="empty-history-hint">Could not load today\'s history feed.</div>';
            }
        }
    }

    // --- On-Demand Telegram Check-in Trigger ---
    async function triggerTelegramCheckinPrompt() {
        showToast('Sending check-in prompt to Telegram...', 'info');
        try {
            const res = await fetch('/api/v1/telegram/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to dispatch Telegram prompt');
            }
            showToast('Telegram check-in prompt sent to your bot!', 'success');
        } catch (err) {
            showToast(err.message || 'Could not send Telegram check-in', 'error');
        }
    }

    const btnTriggerTelegramCheckin = document.getElementById('btnTriggerTelegramCheckin');
    if (btnTriggerTelegramCheckin) {
        btnTriggerTelegramCheckin.addEventListener('click', triggerTelegramCheckinPrompt);
    }
    const btnTriggerTelegramCheckinFromModal = document.getElementById('btnTriggerTelegramCheckinFromModal');
    if (btnTriggerTelegramCheckinFromModal) {
        btnTriggerTelegramCheckinFromModal.addEventListener('click', triggerTelegramCheckinPrompt);
    }

    const btnOpenPainAnalyticsBottom = document.getElementById('btnOpenPainAnalyticsBottom');
    if (btnOpenPainAnalyticsBottom && painAnalyticsModal) {
        btnOpenPainAnalyticsBottom.addEventListener('click', () => {
            painAnalyticsModal.classList.remove('hidden');
            loadPainAnalytics();
        });
    }

    const btnOpenPainAnalyticsFromModal = document.getElementById('btnOpenPainAnalyticsFromModal');
    if (btnOpenPainAnalyticsFromModal && painAnalyticsModal) {
        btnOpenPainAnalyticsFromModal.addEventListener('click', () => {
            painLogModal.classList.add('hidden');
            painAnalyticsModal.classList.remove('hidden');
            loadPainAnalytics();
        });
    }

    btnCloseNotes.addEventListener('click', () => {
        notesModal.classList.add('hidden');
    });

    let currentNotes = [];
    let currentNotesTab = 'active'; // 'active', 'pinned', 'archive'
    let editingNoteId = null;

    function renderNotesGrid() {
        if (currentNotesTab === 'followup') {
            if (standardNotesWorkspace) standardNotesWorkspace.classList.add('hidden');
            if (inlineNoteEditorContainer) inlineNoteEditorContainer.classList.add('hidden');
            if (followUpWorkspace) followUpWorkspace.classList.remove('hidden');
            return;
        } else {
            if (standardNotesWorkspace) standardNotesWorkspace.classList.remove('hidden');
            if (inlineNoteEditorContainer) inlineNoteEditorContainer.classList.remove('hidden');
            if (followUpWorkspace) followUpWorkspace.classList.add('hidden');
        }

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
                
                // Extract Follow Up Note
                const followUpNote = currentNotes.find(n => n.author === 'system_followup');
                if (followUpNote) {
                    followUpNoteId = followUpNote.id;
                    if (followUpTextarea && document.activeElement !== followUpTextarea) {
                        followUpTextarea.value = followUpNote.content;
                    }
                } else if (followUpTextarea && document.activeElement !== followUpTextarea) {
                    followUpTextarea.value = '';
                }
                
                // Filter out system notes from regular display
                currentNotes = currentNotes.filter(n => n.author !== 'system_followup');
                
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
        
    if (btnToggleFollowUpView) {
        btnToggleFollowUpView.addEventListener('click', () => {
            if (currentNotesTab === 'followup') {
                currentNotesTab = 'active';
                btnToggleFollowUpView.style.color = 'rgba(255,255,255,0.7)';
            } else {
                currentNotesTab = 'followup';
                btnToggleFollowUpView.style.color = '#ff3c3c';
                if (btnToggleArchiveView) btnToggleArchiveView.style.color = 'rgba(255,255,255,0.7)';
            }
            renderNotesGrid();
        });
    }

    if (btnSaveFollowUp) {
        btnSaveFollowUp.addEventListener('click', async () => {
            btnSaveFollowUp.disabled = true;
            btnSaveFollowUp.innerText = 'Saving...';
            try {
                if (followUpNoteId) {
                    await fetch(`${API_NOTES}/${followUpNoteId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: followUpTextarea.value })
                    });
                } else {
                    await fetch(API_NOTES, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: followUpTextarea.value, author: 'system_followup', pinned: true })
                    });
                }
                if (followUpSaveStatus) {
                    followUpSaveStatus.innerText = 'Saved!';
                    setTimeout(() => followUpSaveStatus.innerText = '', 2000);
                }
                loadNotes();
            } catch (e) {
                console.error('Failed to save follow up list', e);
                if (followUpSaveStatus) followUpSaveStatus.innerText = 'Error saving';
            } finally {
                btnSaveFollowUp.disabled = false;
                btnSaveFollowUp.innerText = 'Save Follow Up List';
            }
        });
    }

    btnToggleArchiveView.addEventListener('click', () => {
            currentNotesTab = currentNotesTab === 'archive' ? 'active' : 'archive';
            if (btnToggleFollowUpView) btnToggleFollowUpView.style.color = 'rgba(255,255,255,0.7)';
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
                    
                    // Mark as completed immediately in the UI
                    card.classList.add('completed');
                    const textP = card.querySelector('.protocol-info p');
                    if (textP) {
                        textP.style.textDecoration = 'line-through';
                        textP.style.opacity = '0.65';
                    }
                    const actionsDiv = card.querySelector('.protocol-actions');
                    if (actionsDiv) {
                        actionsDiv.innerHTML = `
                            <span class="badge neon-green" style="margin-right: 4px;">Done</span>
                            <button class="btn btn-outline btn-sm btn-reinstate" data-id="${id}" data-type="${type || ''}" title="Reopen item">Undo</button>
                        `;
                        const undoBtn = actionsDiv.querySelector('.btn-reinstate');
                        if (undoBtn) {
                            undoBtn.addEventListener('click', () => {
                                if (id) {
                                    fetch(API_AGENDA, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id, action: 'update_status', status: 'pending' })
                                    }).then(() => loadAgenda()).catch(() => {});
                                }
                            });
                        }
                    }

                    // Move card to the bottom of agenda stream
                    const stream = document.getElementById("agendaStream");
                    if (stream) {
                        stream.appendChild(card);
                    }
                    showToast(`Completed: ${title}`, 'success');

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
                    const title = card.querySelector('.protocol-info p')?.innerText || id;
                    activePostponeItemTitle = title;
                    activePostponeItemType = type || 'task';
                    if (postponeItemSummary) {
                        postponeItemSummary.textContent = title ? `Reschedule: ${title}` : 'Choose when you would like to reschedule this item:';
                    }
                    const tmr = new Date();
                    tmr.setDate(tmr.getDate() + 1);
                    tmr.setHours(9, 0, 0, 0);
                    const tzOffset = tmr.getTimezoneOffset() * 60000;
                    const localIso = new Date(tmr - tzOffset).toISOString().slice(0, 16);
                    if (postponeDateInput) postponeDateInput.value = localIso;

                    document.querySelectorAll('.btn-quick-postpone').forEach(b => b.classList.remove('selected'));
                    const defaultPreset = document.querySelector('.btn-quick-postpone[data-tomorrow="09:00"]');
                    if (defaultPreset) defaultPreset.classList.add('selected');

                    if (postponeModal) postponeModal.classList.remove('hidden');
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                const rawTitle = card.querySelector('.protocol-info p')?.innerText || '';
                const shortTitle = rawTitle.length > 80 ? rawTitle.substring(0, 80) + '...' : rawTitle;
                itemToDismiss = id;
                cardToDismiss = card;
                activeDismissItemTitle = rawTitle;
                activeDismissItemType = type || 'task';
                if (dismissConfirmItemTitle) {
                    dismissConfirmItemTitle.textContent = shortTitle
                        ? `Are you sure you want to dismiss "${shortTitle}" from today's agenda?`
                        : 'Are you sure you want to dismiss this item from today\'s agenda?';
                }
                if (dismissConfirmModal) {
                    dismissConfirmModal.classList.remove('hidden');
                } else {
                    if (confirm(`Are you sure you want to dismiss "${shortTitle || 'this item'}"?`)) {
                        card.classList.add('dismissed');
                        const textP = card.querySelector('.protocol-info p');
                        if (textP) {
                            textP.style.textDecoration = 'line-through';
                            textP.style.opacity = '0.5';
                        }
                        const actionsDiv = card.querySelector('.protocol-actions');
                        if (actionsDiv) {
                            actionsDiv.innerHTML = `
                                <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); margin-right: 4px;">Dismissed</span>
                                <button class="btn btn-outline btn-sm btn-reinstate" data-id="${id}" data-type="${type || ''}" title="Reinstate item">Reinstate</button>
                            `;
                            actionsDiv.querySelector('.btn-reinstate')?.addEventListener('click', () => {
                                if (id) {
                                    fetch(API_AGENDA, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id, action: 'update_status', status: 'pending' })
                                    }).then(() => loadAgenda()).catch(() => {});
                                }
                            });
                        }
                        const stream = document.getElementById("agendaStream");
                        if (stream) stream.appendChild(card);
                        
                        if (id) {
                            fetch(API_AGENDA, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id, action: 'update_status', status: 'dismissed', title: rawTitle, item_type: type || 'task' })
                            }).then(() => { loadAgenda(); }).catch(() => {});
                        }
                    }
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
        "y1": {
                "id": "y1",
                "title": "Gentle Lumbar Release",
                "category": "yoga",
                "duration_minutes": 15,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "lumbar",
                        "lower back",
                        "pelvis"
                ],
                "instruction": "Slow pelvic tilts, supported child's pose, and gentle supine knee-to-chest holds to safely decompress the lumbar spine.",
                "precautions": [
                        "Avoid aggressive lumbar flexion during acute disc flare-ups."
                ],
                "steps": [
                        {
                                "title": "Supine Pelvic Tilts",
                                "duration": 45,
                                "cue": "Flatten lower back against the mat on exhale, gentle arch on inhale.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Supported Child's Pose",
                                "duration": 60,
                                "cue": "Widen knees, rest torso forward on bolster, lengthen spine.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg",
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Supine Single Knee-to-Chest",
                                "duration": 45,
                                "cue": "Gently hug right knee, then left knee. Keep sacrum grounded.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Savasana with Bolster",
                                "duration": 60,
                                "cue": "Place bolster under knees to release psoas and lumbar pressure.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        }
                ]
        },
        "y2": {
                "id": "y2",
                "title": "Cervical Mobility Flow",
                "category": "yoga",
                "duration_minutes": 10,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "cervical",
                        "neck",
                        "upper trapezius"
                ],
                "instruction": "Gentle seated neck retractions, slow lateral tilts, and upper trapezius relaxation for post-surgical cervical safety.",
                "precautions": [
                        "No rapid cervical rotations or forced extension post-cervical surgery."
                ],
                "steps": [
                        {
                                "title": "Seated Axial Retraction",
                                "duration": 45,
                                "cue": "Gently draw chin backwards creating a double chin, lengthening back of neck.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Lateral Ear-to-Shoulder",
                                "duration": 45,
                                "cue": "Drop right ear to right shoulder without lifting left shoulder. Repeat left.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Shoulder Shrug & Release",
                                "duration": 45,
                                "cue": "Inhale lift shoulders to ears, exhale drop down with sigh.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Alignment Breathing",
                                "duration": 60,
                                "cue": "Sit upright, focus on diaphragmatic 360 breathing relaxing neck muscles.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "y3": {
                "id": "y3",
                "title": "Full Body Restorative Yin",
                "category": "yoga",
                "duration_minutes": 25,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "full body",
                        "nervous system",
                        "spine"
                ],
                "instruction": "Passive supported poses using bolsters and blocks to downregulate sympathetic tone and relieve chronic muscular tension.",
                "precautions": [
                        "Maintain comfortable support under all joints."
                ],
                "steps": [
                        {
                                "title": "Supported Reclined Bound Angle",
                                "duration": 90,
                                "cue": "Feet together, knees open supported by pillows, hands on lower abdomen.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Cat-Cow Spine Wave",
                                "duration": 60,
                                "cue": "Flow gently with breath, avoiding end-range extremes.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Supported Gentle Sphinx",
                                "duration": 60,
                                "cue": "Rest elbows on mat, gentle passive thoracic extension.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Legs Up the Wall Relaxation",
                                "duration": 120,
                                "cue": "Elevate legs against wall to facilitate venous return and spinal decompression.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "y4": {
                "id": "y4",
                "title": "Shoulder & Thoracic Opener",
                "category": "yoga",
                "duration_minutes": 20,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "shoulder",
                        "thoracic",
                        "scapula",
                        "chest"
                ],
                "instruction": "Targeted mobility for the mid-back and pectoral girdle to counter rounded desk posture and relieve neck strain.",
                "precautions": [
                        "Avoid overhead impingement angles if shoulder pain is sharp."
                ],
                "steps": [
                        {
                                "title": "Thread the Needle",
                                "duration": 60,
                                "cue": "Slide right arm under torso, rest right shoulder and temple on mat.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Puppy Pose Thoracic Stretch",
                                "duration": 60,
                                "cue": "Hips stay over knees, walk hands forward melting chest towards floor.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Seated Cactus Arm Openers",
                                "duration": 45,
                                "cue": "Draw elbows back and down, opening anterior chest wall.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Scapular Retraction & Rest",
                                "duration": 60,
                                "cue": "Rest in prone or seated, focusing on mid-back breathing.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        }
                ]
        },
        "y5": {
                "id": "y5",
                "title": "Hip Flexor & Psoas Flow",
                "category": "yoga",
                "duration_minutes": 15,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "hip",
                        "psoas",
                        "pelvis",
                        "lumbar"
                ],
                "instruction": "Gentle low lunges and 90/90 pelvic alignments to release anterior hip tightness that pulls on the lumbar spine.",
                "precautions": [
                        "Tuck pelvis under (posterior pelvic tilt) to avoid hyperextending lower back."
                ],
                "steps": [
                        {
                                "title": "Low Kneeling Lunge",
                                "duration": 60,
                                "cue": "Step right foot forward, tuck tailbone, feel stretch in left front hip.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "90/90 Seated Hip Flow",
                                "duration": 60,
                                "cue": "Rotate knees side to side gently to mobilize internal and external rotation.",
                                "frames": [
                                        "/hip_mobility_routine.jpg",
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Reclined Figure-4",
                                "duration": 60,
                                "cue": "Cross right ankle over left thigh, hold left hamstring gently.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Savasana Psoas Rest",
                                "duration": 60,
                                "cue": "Lie flat with gentle diaphragmatic expansion.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "y6": {
                "id": "y6",
                "title": "Morning Spine Awakening",
                "category": "yoga",
                "duration_minutes": 15,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "spine",
                        "core",
                        "full body"
                ],
                "instruction": "Gentle multi-directional spinal mobilization to lubricate facet joints and stimulate spinal cord circulation upon waking.",
                "precautions": [
                        "Start slowly without forcing range of motion in early morning."
                ],
                "steps": [
                        {
                                "title": "Cat-Cow Spine Awakening",
                                "duration": 45,
                                "cue": "Coordinate slow spinal flexion and extension with deep breathing.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Side Body Lateral Stretch",
                                "duration": 45,
                                "cue": "Walk hands to the right in child's pose, then left.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Supine Torso Twist",
                                "duration": 45,
                                "cue": "Drop knees gently to right, look center or left. Keep shoulders relaxed.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Prone Rest",
                                "duration": 45,
                                "cue": "Rest face down on hands, allowing spine to settle in neutral.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "y7": {
                "id": "y7",
                "title": "Chair Yoga for Desk Decompression",
                "category": "yoga",
                "duration_minutes": 10,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "spine",
                        "neck",
                        "hips",
                        "chest"
                ],
                "instruction": "Zero-floor routine performed entirely in an ergonomic chair to break up prolonged sitting intervals.",
                "precautions": [
                        "Keep chair stable on firm ground."
                ],
                "steps": [
                        {
                                "title": "Seated Cat-Cow",
                                "duration": 45,
                                "cue": "Hands on knees, inhale arch chest forward, exhale round mid-back.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Seated Figure-4 Hip Opener",
                                "duration": 60,
                                "cue": "Ankle on opposite knee, lean gently forward with straight back.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Seated Upper Trapezius Drop",
                                "duration": 45,
                                "cue": "Hold chair base with right hand, tilt head to left.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Seated Chest Expansion",
                                "duration": 45,
                                "cue": "Interlace hands behind lower back or chair frame, gently lift collarbones.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "y8": {
                "id": "y8",
                "title": "Vagus Nerve & Restorative Breath",
                "category": "yoga",
                "duration_minutes": 15,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "nervous system",
                        "diaphragm",
                        "cervical"
                ],
                "instruction": "Pranayama, suboccipital release, and gentle eye movements designed to activate the parasympathetic vagal brake.",
                "precautions": [
                        "Breathe at a comfortable rhythm without breath-holding dizziness."
                ],
                "steps": [
                        {
                                "title": "4-7-8 Parasympathetic Breathing",
                                "duration": 90,
                                "cue": "Inhale 4 sec through nose, hold 7 sec, exhale 8 sec through pursed lips.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Suboccipital Massage with Towel",
                                "duration": 60,
                                "cue": "Rest base of skull on rolled towel, gentle micro-turns of head.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Oculomotor Vagal Reset",
                                "duration": 60,
                                "cue": "Keep head straight, look fully right for 30s until swallow/sigh, then left.",
                                "frames": [
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Heart-Belly Grounding",
                                "duration": 60,
                                "cue": "One hand on heart, one on belly. Feel warmth and safety.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "y9": {
                "id": "y9",
                "title": "Hamstring & Posterior Chain Release",
                "category": "yoga",
                "duration_minutes": 15,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "hamstrings",
                        "calves",
                        "sciatic nerve",
                        "pelvis"
                ],
                "instruction": "Supine strap stretches to lengthen posterior fascia without placing flexion load on the lumbar discs.",
                "precautions": [
                        "Keep slight bend in knee; do not pull into sharp nerve pain."
                ],
                "steps": [
                        {
                                "title": "Supine Strap Leg Extension",
                                "duration": 60,
                                "cue": "Loop strap under right foot, extend leg upward keeping pelvis flat.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Gentle IT Band Cross-Body",
                                "duration": 45,
                                "cue": "Draw straight leg slightly across midline (2-3 inches max).",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Reclined Hamstring Flutter",
                                "duration": 45,
                                "cue": "Gentle micro-bends and straightening of knee to desensitize nerve.",
                                "frames": [
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Leg Rest",
                                "duration": 60,
                                "cue": "Rest legs long on mat, noticing length through lower back.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "y10": {
                "id": "y10",
                "title": "Evening Restorative Wind-Down",
                "category": "yoga",
                "duration_minutes": 20,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "full body",
                        "nervous system",
                        "sleep"
                ],
                "instruction": "Pre-bed restorative yoga protocol designed to drop core body temperature and release nighttime muscle guarding.",
                "precautions": [
                        "Keep lighting low and room comfortable."
                ],
                "steps": [
                        {
                                "title": "Wide Knee Child's Pose",
                                "duration": 90,
                                "cue": "Allow belly to soften between thighs, long slow exhales.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg",
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Supported Bridge Pose",
                                "duration": 60,
                                "cue": "Block or pillow under sacrum, arms relaxed overhead.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Spinal Twist with Pillow",
                                "duration": 60,
                                "cue": "Pillow between knees, slow gentle twist to each side.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Corpse Pose Deep Relaxation",
                                "duration": 120,
                                "cue": "Complete still surrender into mattress or mat.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "p1": {
                "id": "p1",
                "title": "Neutral Pelvis & Transverse Abdominis Activation",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Core Stabilization",
                "focus_areas": [
                        "core",
                        "pelvic floor",
                        "lumbar",
                        "transverse abdominis"
                ],
                "instruction": "Foundational clinical Pilates finding neutral spine, gentle pelvic floor cues, and deep abdominal bracing.",
                "precautions": [
                        "Do not tilt pelvis into excessive posterior or anterior tuck."
                ],
                "steps": [
                        {
                                "title": "Finding Neutral Spine",
                                "duration": 45,
                                "cue": "ASIS hips and pubic bone in a level flat plane.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Transverse Abdominis Draw-In",
                                "duration": 60,
                                "cue": "Exhale gently drawing navel toward spine without flattening lower back.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Supine Heel Slides",
                                "duration": 60,
                                "cue": "Slide right heel forward along mat and return while keeping pelvis totally still.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Pelvic Rest",
                                "duration": 45,
                                "cue": "Soft belly breathing, releasing tension.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "p2": {
                "id": "p2",
                "title": "Deadbug & Lumbar Control",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Core Stabilization",
                "focus_areas": [
                        "core",
                        "lumbar stability",
                        "hip flexors"
                ],
                "instruction": "Antagonistic limb reach while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
                "precautions": [
                        "Lower limb only as far as you can maintain neutral lower back."
                ],
                "steps": [
                        {
                                "title": "Deadbug Level 1 (Arm Reach Only)",
                                "duration": 45,
                                "cue": "Knees at tabletop (90 deg), reach right arm overhead and return.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Deadbug Level 2 (Heel Tap Only)",
                                "duration": 60,
                                "cue": "Keep arms still, lower right heel to tap floor, return.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Deadbug Level 3 (Opposite Arm & Leg)",
                                "duration": 60,
                                "cue": "Extend opposite arm and leg simultaneously while maintaining rock-solid core.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Knees to Chest Neutral Reset",
                                "duration": 45,
                                "cue": "Soft hold, resting hip flexors.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "p3": {
                "id": "p3",
                "title": "Quadruped Bird-Dog Stabilization",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Core Stabilization",
                "focus_areas": [
                        "multifidus",
                        "glutes",
                        "thoracic",
                        "core"
                ],
                "instruction": "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
                "precautions": [
                        "Do not lift leg above hip level to avoid lumbar extension arching."
                ],
                "steps": [
                        {
                                "title": "Quadruped Neutral Alignment",
                                "duration": 45,
                                "cue": "Hands under shoulders, knees under hips, neck in neutral line.",
                                "frames": [
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Bird-Dog Reach (Right Arm, Left Leg)",
                                "duration": 60,
                                "cue": "Reach straight out, thumb up, heel pushed back. Hold 6 seconds.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Bird-Dog Reach (Left Arm, Right Leg)",
                                "duration": 60,
                                "cue": "Keep pelvis level like balancing a cup of water on lower back.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Child's Pose Decompression",
                                "duration": 45,
                                "cue": "Sink hips back, lengthening spinal erectors.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "p4": {
                "id": "p4",
                "title": "Side-Lying Clamshell & Glute Medius",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "glute medius",
                        "hip abductors",
                        "pelvis stability"
                ],
                "instruction": "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
                "precautions": [
                        "Do not roll top hip backwards; keep hips stacked perpendicularly."
                ],
                "steps": [
                        {
                                "title": "Clamshell Level 1 (Right Side)",
                                "duration": 60,
                                "cue": "Heels together, open top knee like a clamshell, squeeze outer glute.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Side-Lying Leg Lift (Right Side)",
                                "duration": 45,
                                "cue": "Straighten top leg, lift 6 inches with slight internal rotation.",
                                "frames": [
                                        "/hip_mobility_routine.jpg",
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Clamshell Level 1 (Left Side)",
                                "duration": 60,
                                "cue": "Switch sides. Keep core engaged and hips stacked.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Side-Lying Leg Lift (Left Side)",
                                "duration": 45,
                                "cue": "Lift top leg with control, avoiding hip rotation.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        }
                ]
        },
        "p5": {
                "id": "p5",
                "title": "Glute Bridge & Hip Extension Articulation",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "glutes",
                        "hamstrings",
                        "lumbar stability"
                ],
                "instruction": "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
                "precautions": [
                        "Drive through heels and squeeze glutes; avoid arching lower back at peak."
                ],
                "steps": [
                        {
                                "title": "Basic Glute Bridge (Feet Flat)",
                                "duration": 60,
                                "cue": "Exhale lift hips until straight line from knees to shoulders, hold 3s.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Bridge with Pelvic Squeeze",
                                "duration": 45,
                                "cue": "Place small ball/block between knees, squeeze gently while bridging.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Single Leg Bridge Marching",
                                "duration": 60,
                                "cue": "Hold bridge, lift right foot 1 inch off floor without dipping pelvis. Repeat left.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Spine Articulation Roll Down",
                                "duration": 45,
                                "cue": "Lower spine down bone by bone, finishing in neutral.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "p6": {
                "id": "p6",
                "title": "Pilates Hundred (Neutral Spine Adaptation)",
                "category": "pilates",
                "duration_minutes": 10,
                "intensity": "Core Stabilization",
                "focus_areas": [
                        "core",
                        "breath endurance",
                        "transverse abdominis"
                ],
                "instruction": "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
                "precautions": [
                        "Head stays grounded if cervical fusion/strain is present."
                ],
                "steps": [
                        {
                                "title": "Arm Pump Preparation",
                                "duration": 30,
                                "cue": "Arms long by side, legs in tabletop, head resting comfortably.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "The Hundred: Set 1-50",
                                "duration": 60,
                                "cue": "Inhale 5 arm pumps, exhale 5 arm pumps with abdominal brace.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "The Hundred: Set 51-100",
                                "duration": 60,
                                "cue": "Maintain steady rhythmic breathing and flat lower abdomen.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Full Body Stretch Release",
                                "duration": 45,
                                "cue": "Extend arms and legs long, releasing abdominal wall.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "p7": {
                "id": "p7",
                "title": "Spine Twist & Thoracic Mobility",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "thoracic",
                        "obliques",
                        "ribcage"
                ],
                "instruction": "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
                "precautions": [
                        "Rotation comes purely from ribs/chest, not twisting lower back."
                ],
                "steps": [
                        {
                                "title": "Seated Spine Twist with Ball",
                                "duration": 60,
                                "cue": "Sit upright, hug ball to chest, exhale rotate ribs 20 degrees right, then left.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Side-Lying Pinwheel Arm Flow",
                                "duration": 60,
                                "cue": "Circle top arm overhead opening chest to ceiling, follow with eyes.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Opposite Side Pinwheel",
                                "duration": 60,
                                "cue": "Switch sides. Feel opening through anterior shoulder and ribcage.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Prone Breath",
                                "duration": 45,
                                "cue": "Feel posterior ribcage expand with every inhalation.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "p8": {
                "id": "p8",
                "title": "Single Leg Stretch & Core Control",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Core Stabilization",
                "focus_areas": [
                        "core",
                        "hip flexors",
                        "lumbar stability"
                ],
                "instruction": "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
                "precautions": [
                        "Keep head down if experiencing neck fatigue."
                ],
                "steps": [
                        {
                                "title": "Single Leg Stretch (Head Down)",
                                "duration": 60,
                                "cue": "Hug right knee, extend left leg at 45 deg angle, switch rhythmically.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Double Leg Tap Adaptation",
                                "duration": 45,
                                "cue": "Both knees bent, tap toes to mat and return with locked core.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Single Leg Stretch Set 2",
                                "duration": 60,
                                "cue": "Focus on smooth breathing and rock-steady pelvis.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Knees to Chest Reset",
                                "duration": 45,
                                "cue": "Gentle rocking side to side.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "p9": {
                "id": "p9",
                "title": "Shoulder Bridge & Articulation",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "spine articulation",
                        "glutes",
                        "hamstrings"
                ],
                "instruction": "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
                "precautions": [
                        "Weight stays on shoulder blades, never pressing into cervical neck."
                ],
                "steps": [
                        {
                                "title": "Pelvic Curl Preparation",
                                "duration": 45,
                                "cue": "Tuck pelvis, lift only sacrum off mat, and roll back down.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Full Segmental Bridge Roll",
                                "duration": 60,
                                "cue": "Peel spine up vertebra by vertebra to upper thoracic, hold and roll down.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Bridge with Arm Reaches",
                                "duration": 60,
                                "cue": "At top of bridge, float arms back overhead, then roll spine down.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Rest",
                                "duration": 45,
                                "cue": "Neutral spine alignment rest.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "p10": {
                "id": "p10",
                "title": "Swimming & Posterior Chain Endurance",
                "category": "pilates",
                "duration_minutes": 15,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "erector spinae",
                        "glutes",
                        "scapula",
                        "upper back"
                ],
                "instruction": "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
                "precautions": [
                        "Place small pillow under lower abdomen/pelvis to prevent hyperextension."
                ],
                "steps": [
                        {
                                "title": "Prone Arm Float Only",
                                "duration": 45,
                                "cue": "Lie prone, pillow under belly, float right arm 1 inch, then left.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Prone Leg Float Only",
                                "duration": 45,
                                "cue": "Squeeze glute, float straight leg 1 inch, then opposite.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Slow Swimming Flutter",
                                "duration": 60,
                                "cue": "Alternate opposite arm and leg fluttering rhythmically.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Prone Relaxation & Breath",
                                "duration": 45,
                                "cue": "Turn head to side, relax glutes and back completely.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "s1": {
                "id": "s1",
                "title": "Piriformis & Deep Glute Stretch",
                "category": "stretches",
                "duration_minutes": 12,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "glutes",
                        "piriformis",
                        "sciatic nerve",
                        "hips"
                ],
                "instruction": "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
                "precautions": [
                        "Stop if numbness or tingling shoots down the leg."
                ],
                "steps": [
                        {
                                "title": "Supine Figure-4 (Right)",
                                "duration": 60,
                                "cue": "Cross right ankle over left thigh, reach through and draw left leg in.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Figure-4 (Left)",
                                "duration": 60,
                                "cue": "Repeat on left side, keeping shoulders and neck relaxed.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Seated Chair Glute Stretch",
                                "duration": 60,
                                "cue": "Sit tall, cross ankle on knee, hinge forward from hips with flat back.",
                                "frames": [
                                        "/hip_mobility_routine.jpg",
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Hip Shakes",
                                "duration": 45,
                                "cue": "Gently shake legs to release residual muscle tone.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "s2": {
                "id": "s2",
                "title": "Cervical Scalene & Upper Trap Release",
                "category": "stretches",
                "duration_minutes": 10,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "scalenes",
                        "upper trapezius",
                        "levator scapulae",
                        "neck"
                ],
                "instruction": "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
                "precautions": [
                        "Never pull hard on head; use gentle weight of hand only."
                ],
                "steps": [
                        {
                                "title": "Scalene Anterior Stretch",
                                "duration": 45,
                                "cue": "Tilt head right, rotate chin 15 deg upward, feel stretch in front-left neck.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Levator Scapulae 'Nose to Armpit'",
                                "duration": 45,
                                "cue": "Turn head 45 deg right, gently drop chin towards right armpit.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Opposite Side Scalene & Levator",
                                "duration": 90,
                                "cue": "Repeat carefully on opposite side with relaxed shoulders.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Suboccipital Nod Release",
                                "duration": 45,
                                "cue": "Tiny nodding motions like saying 'yes' without flexing lower neck.",
                                "frames": [
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        }
                ]
        },
        "s3": {
                "id": "s3",
                "title": "Hamstring Doorframe Decompression",
                "category": "stretches",
                "duration_minutes": 15,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "hamstrings",
                        "posterior chain",
                        "lumbar"
                ],
                "instruction": "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
                "precautions": [
                        "Other leg extends through doorframe flat on the floor."
                ],
                "steps": [
                        {
                                "title": "Doorframe Stretch (Right Leg)",
                                "duration": 90,
                                "cue": "Right leg up doorframe, left leg flat on floor through doorway. Breathe deeply.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Doorframe Stretch (Left Leg)",
                                "duration": 90,
                                "cue": "Switch sides. Relax hips and sacrum flat against mat.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Ankle Pumps in Stretch",
                                "duration": 45,
                                "cue": "Point and flex toes gently while elevated to floss sciatic pathway.",
                                "frames": [
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Supine Rest",
                                "duration": 45,
                                "cue": "Both legs down, resting pelvis in neutral.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "s4": {
                "id": "s4",
                "title": "Thoracic Open Book Mobility",
                "category": "stretches",
                "duration_minutes": 12,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "thoracic spine",
                        "chest",
                        "ribcage",
                        "shoulders"
                ],
                "instruction": "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
                "precautions": [
                        "Knees stay clamped together on floor or pillow to lock lumbar spine."
                ],
                "steps": [
                        {
                                "title": "Open Book (Right Arm Opening)",
                                "duration": 60,
                                "cue": "Side-lying on left, sweep right arm open across body, look towards right hand.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Open Book Static Hold",
                                "duration": 45,
                                "cue": "Hold open for 3 deep breaths into right chest wall.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Open Book (Left Arm Opening)",
                                "duration": 60,
                                "cue": "Switch sides. Sweep left arm open, keeping knees glued together.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Open Book Static Hold Left",
                                "duration": 45,
                                "cue": "Deep ribcage breathing.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "s5": {
                "id": "s5",
                "title": "Gastrocnemius & Soleus Calf Stretch",
                "category": "stretches",
                "duration_minutes": 10,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "calves",
                        "achilles",
                        "ankle mobility",
                        "plantar fascia"
                ],
                "instruction": "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
                "precautions": [
                        "Keep heel firmly planted on ground; do not let arch collapse."
                ],
                "steps": [
                        {
                                "title": "Straight-Leg Gastrocnemius (Right)",
                                "duration": 45,
                                "cue": "Hands on wall, step right leg back straight, press heel down.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Bent-Knee Soleus (Right)",
                                "duration": 45,
                                "cue": "Bend back right knee slightly, shifting stretch deeper towards Achilles.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Straight-Leg Gastrocnemius (Left)",
                                "duration": 45,
                                "cue": "Switch legs. Step left leg back straight, heel grounded.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Bent-Knee Soleus (Left)",
                                "duration": 45,
                                "cue": "Bend left knee slightly, keeping heel pinned down.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "s6": {
                "id": "s6",
                "title": "Quadriceps & Rectus Femoris Wall Stretch",
                "category": "stretches",
                "duration_minutes": 12,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "quadriceps",
                        "rectus femoris",
                        "patella",
                        "hips"
                ],
                "instruction": "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
                "precautions": [
                        "Tuck pelvis under to engage glute; avoid arching lower back."
                ],
                "steps": [
                        {
                                "title": "Side-Lying Quad Stretch (Right)",
                                "duration": 60,
                                "cue": "Lie on left side, hold right ankle, gently draw heel toward glute.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Side-Lying Quad Stretch (Left)",
                                "duration": 60,
                                "cue": "Switch sides, keeping knees aligned and hips stacked.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Prone Quad Stretch with Towel",
                                "duration": 60,
                                "cue": "Lie prone, loop towel around ankle if reaching is difficult.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Prone Hip Rocking Reset",
                                "duration": 45,
                                "cue": "Gently rock hips side to side to release hip flexors.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "s7": {
                "id": "s7",
                "title": "Latissimus Dorsi & Side Body Opener",
                "category": "stretches",
                "duration_minutes": 12,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "latissimus dorsi",
                        "thoracolumbar fascia",
                        "side body"
                ],
                "instruction": "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
                "precautions": [
                        "Do not lean so far as to pinch the opposite side waist."
                ],
                "steps": [
                        {
                                "title": "Side-Reaching Child's Pose (Right)",
                                "duration": 60,
                                "cue": "In child's pose, walk both hands to the left, feel stretch down right lat.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Side-Reaching Child's Pose (Left)",
                                "duration": 60,
                                "cue": "Walk hands to the right, feel deep stretch through left ribcage and lat.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Doorframe Lat Hang",
                                "duration": 45,
                                "cue": "Hold doorframe at shoulder height, sink hips back and away gently.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Center Breath",
                                "duration": 45,
                                "cue": "Breathe into lateral ribcage.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "s8": {
                "id": "s8",
                "title": "Wrist, Forearm & Median Nerve Floss",
                "category": "stretches",
                "duration_minutes": 10,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "wrists",
                        "forearms",
                        "median nerve",
                        "carpal tunnel"
                ],
                "instruction": "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
                "precautions": [
                        "Never force through sharp wrist or hand pain."
                ],
                "steps": [
                        {
                                "title": "Wrist Flexor Stretch",
                                "duration": 45,
                                "cue": "Arm straight, palm facing out fingers down, gently draw fingers back.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Wrist Extensor Stretch",
                                "duration": 45,
                                "cue": "Palm facing in, gently press back of hand down and toward body.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Median Nerve Gliding Flow",
                                "duration": 60,
                                "cue": "Extend arm out to side, extend wrist, tilt head away, then return.",
                                "frames": [
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Wrist Circles & Finger Shakes",
                                "duration": 45,
                                "cue": "Gentle rolling circles and shaking out hands.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "s9": {
                "id": "s9",
                "title": "Pectoralis Doorway & Anterior Chest Opener",
                "category": "stretches",
                "duration_minutes": 10,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "pec major",
                        "pec minor",
                        "anterior shoulder",
                        "thoracic"
                ],
                "instruction": "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
                "precautions": [
                        "Keep forearm flat against doorframe; do not twist shoulder joint."
                ],
                "steps": [
                        {
                                "title": "90-Degree Doorway Stretch (Right)",
                                "duration": 45,
                                "cue": "Elbow at 90 deg on doorframe, step right foot through doorway gently.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "120-Degree High Doorway Stretch (Right)",
                                "duration": 45,
                                "cue": "Elbow slightly higher to target lower pec fibers.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Doorway Stretch (Left Side)",
                                "duration": 90,
                                "cue": "Repeat 90 and 120 degree angles on left side with relaxed neck.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Shoulder Rolls & Posture Reset",
                                "duration": 45,
                                "cue": "Roll shoulders back and down 5 times.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "s10": {
                "id": "s10",
                "title": "Ankle Dorsiflexion & Plantar Fascia Mobility",
                "category": "stretches",
                "duration_minutes": 10,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "ankles",
                        "plantar fascia",
                        "feet",
                        "tibialis anterior"
                ],
                "instruction": "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
                "precautions": [
                        "Do not roll ball aggressively over acute plantar fasciitis pain points."
                ],
                "steps": [
                        {
                                "title": "Half-Kneeling Ankle Rocking",
                                "duration": 60,
                                "cue": "Half-kneeling, drive front knee forward over second toe keeping heel flat.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Opposite Ankle Rocking",
                                "duration": 60,
                                "cue": "Switch sides, mobilizing left ankle dorsiflexion.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Tennis Ball Foot Roll",
                                "duration": 60,
                                "cue": "Roll ball along arch of foot for 30s per foot, releasing fascia.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        },
                        {
                                "title": "Seated Toe Spreading",
                                "duration": 30,
                                "cue": "Wiggle and spread toes wide to activate intrinsic foot muscles.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "r1": {
                "id": "r1",
                "title": "McGill Big 3 Spinal Stabilization",
                "category": "rehab",
                "duration_minutes": 20,
                "intensity": "Stabilization",
                "focus_areas": [
                        "lumbar spine",
                        "core",
                        "quadratus lumborum",
                        "multifidus"
                ],
                "instruction": "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
                "precautions": [
                        "Hands stay under lumbar spine during curl-up; no spinal flexion."
                ],
                "steps": [
                        {
                                "title": "McGill Modified Curl-Up",
                                "duration": 60,
                                "cue": "Hands under lower back, one knee bent, lift only head/shoulders 1 inch. Hold 6s.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "McGill Side Bridge (From Knees)",
                                "duration": 60,
                                "cue": "Prop on elbow and knees, lift hips into straight alignment. Hold 6s per rep.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "McGill Quadruped Bird-Dog",
                                "duration": 60,
                                "cue": "Extend opposite arm and leg, hold 6s. Focus on neutral spine stability.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Spine Decompression Rest",
                                "duration": 60,
                                "cue": "Rest in prone or supported child's pose.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "r2": {
                "id": "r2",
                "title": "Sciatic Nerve Flossing Protocol",
                "category": "rehab",
                "duration_minutes": 12,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "sciatic nerve",
                        "hamstrings",
                        "lumbar roots",
                        "dura"
                ],
                "instruction": "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
                "precautions": [
                        "Never pull into sharp radiating pain; flossing should be gentle and rhythmic."
                ],
                "steps": [
                        {
                                "title": "Seated Sciatic Slider Setup",
                                "duration": 30,
                                "cue": "Sit on edge of chair with hands behind back, spine relaxed.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Sciatic Slider (Right Leg)",
                                "duration": 60,
                                "cue": "Extend right knee while looking UP at ceiling, bend knee while looking DOWN.",
                                "frames": [
                                        "/hip_mobility_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Sciatic Slider (Left Leg)",
                                "duration": 60,
                                "cue": "Repeat smooth flossing motion on left leg for 10 slow reps.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Rest & Sensation Check",
                                "duration": 45,
                                "cue": "Lie flat and observe reduction in nerve sensitivity.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "r3": {
                "id": "r3",
                "title": "Cervical Retraction & Deep Neck Flexor Training",
                "category": "rehab",
                "duration_minutes": 12,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "longus colli",
                        "longus capitis",
                        "cervical spine"
                ],
                "instruction": "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
                "precautions": [
                        "Do not use sternocleidomastoid (front surface muscles); keep jaw relaxed."
                ],
                "steps": [
                        {
                                "title": "Supine Chin Tuck (Cranial Nod)",
                                "duration": 60,
                                "cue": "Lie supine with small towel under neck, gently nod chin as if flattening back of neck.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Chin Tuck with 5s Hold",
                                "duration": 60,
                                "cue": "Nod chin gently, hold for 5 seconds breathing normally through nose.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Wall Retraction with Foam Roller",
                                "duration": 60,
                                "cue": "Stand against wall, press back of head gently into small soft ball.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Postural Breathing Reset",
                                "duration": 45,
                                "cue": "Sit tall, crown of head reaching toward ceiling.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "r4": {
                "id": "r4",
                "title": "Scapular Wall Slides & Serratus Activation",
                "category": "rehab",
                "duration_minutes": 15,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "serratus anterior",
                        "lower trapezius",
                        "scapula",
                        "thoracic"
                ],
                "instruction": "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
                "precautions": [
                        "Keep forearms glued to wall and ribs tucked down."
                ],
                "steps": [
                        {
                                "title": "Forearm Wall Slide Setup",
                                "duration": 45,
                                "cue": "Forearms vertical on wall with foam roller or towel, step one foot forward.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Wall Slide Upward Sweep",
                                "duration": 60,
                                "cue": "Slide forearms upward pushing into wall, shrug slightly at top, return with control.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Scapular Protraction Push-Plus (Wall)",
                                "duration": 60,
                                "cue": "Hands on wall, push chest away rounding upper back without bending elbows.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Shoulder Roll Down",
                                "duration": 45,
                                "cue": "Shake out arms and breathe deeply.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "r5": {
                "id": "r5",
                "title": "Thoracic Outlet Syndrome Neuro-Mobility",
                "category": "rehab",
                "duration_minutes": 12,
                "intensity": "Gentle Restorative",
                "focus_areas": [
                        "brachial plexus",
                        "first rib",
                        "pectoralis minor",
                        "scalenes"
                ],
                "instruction": "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
                "precautions": [
                        "Do not stretch into tingling sensations; stay within comfortable boundaries."
                ],
                "steps": [
                        {
                                "title": "First Rib Self-Depression with Strap",
                                "duration": 60,
                                "cue": "Loop strap over right collarbone, pull down across left hip while tilting head right.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Brachial Plexus Tension-Free Glide",
                                "duration": 60,
                                "cue": "Extend arm out, bend wrist up while tilting head towards arm, then alternate.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_1.jpg"
                                ]
                        },
                        {
                                "title": "Opposite Side TOS Release",
                                "duration": 60,
                                "cue": "Repeat first rib depression and gliding on left side.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Diaphragmatic Rib Expansion",
                                "duration": 45,
                                "cue": "Breathe deeply into lower ribcage, avoiding upper chest clavicular breathing.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "r6": {
                "id": "r6",
                "title": "Isometric Cervical Strengthening",
                "category": "rehab",
                "duration_minutes": 12,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "cervical spine",
                        "neck extensors",
                        "neck rotators"
                ],
                "instruction": "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
                "precautions": [
                        "Apply only 20-30% of maximum force; never strain."
                ],
                "steps": [
                        {
                                "title": "Isometric Cervical Flexion",
                                "duration": 45,
                                "cue": "Palm on forehead, gently press head forward into palm without moving head. Hold 6s.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Isometric Cervical Extension",
                                "duration": 45,
                                "cue": "Hands behind head, gently press head backward into palms without tilting.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg",
                                        "/exercises/cat_cow_2.jpg"
                                ]
                        },
                        {
                                "title": "Isometric Lateral Flexion (Left & Right)",
                                "duration": 60,
                                "cue": "Palm against side of head, press gently for 6s each side.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Restorative Alignment Rest",
                                "duration": 45,
                                "cue": "Sit tall with relaxed jaw and dropped shoulders.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "h1": {
                "id": "h1",
                "title": "Hydrotherapy Buoyancy Spinal Decompression",
                "category": "hydrotherapy",
                "duration_minutes": 25,
                "intensity": "Decompression",
                "focus_areas": [
                        "lumbar",
                        "cervical",
                        "spine",
                        "water buoyancy"
                ],
                "instruction": "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
                "precautions": [
                        "Use pool noodles or buoyancy belt for effortless floating."
                ],
                "steps": [
                        {
                                "title": "Buoyant Vertical Traction",
                                "duration": 90,
                                "cue": "Noodle under arms in deep water, allow legs and spine to hang weightlessly.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Gentle Water Knee-to-Chest",
                                "duration": 60,
                                "cue": "Slowly draw knees towards chest in water, feeling gentle lumbar opening.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Aquatic Torso Pendulum",
                                "duration": 60,
                                "cue": "Gentle sway of legs side to side in water column.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supine Water Float with Head Support",
                                "duration": 120,
                                "cue": "Full supine float supported by pillows, deep parasympathetic relaxation.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "h2": {
                "id": "h2",
                "title": "Aquatic Multi-Planar Gait & Walking",
                "category": "hydrotherapy",
                "duration_minutes": 20,
                "intensity": "Adaptive Mobility",
                "focus_areas": [
                        "gait",
                        "hip flexors",
                        "glutes",
                        "balance"
                ],
                "instruction": "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
                "precautions": [
                        "Maintain upright posture; do not lean forward against water resistance."
                ],
                "steps": [
                        {
                                "title": "Forward Water Marching",
                                "duration": 90,
                                "cue": "High knee marching forward in chest-deep water with normal arm swing.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Backward Heel-to-Toe Walking",
                                "duration": 90,
                                "cue": "Walk backward with control, engaging glutes and posterior chain.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Lateral Sidestepping",
                                "duration": 90,
                                "cue": "Step sideways across lane, engaging glute medius against water drag.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Warm Water Calming Rest",
                                "duration": 60,
                                "cue": "Stand against pool wall, enjoying warmth and hydrostatic pressure.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        }
                ]
        },
        "h3": {
                "id": "h3",
                "title": "Aquatic Hip & Core Stabilization",
                "category": "hydrotherapy",
                "duration_minutes": 20,
                "intensity": "Targeted Strengthening",
                "focus_areas": [
                        "glutes",
                        "hip abductors",
                        "core",
                        "pelvis"
                ],
                "instruction": "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
                "precautions": [
                        "Move at a steady controlled speed; water resistance increases with speed."
                ],
                "steps": [
                        {
                                "title": "Aquatic Standing Hip Abduction",
                                "duration": 60,
                                "cue": "Hold pool wall, sweep right leg out to side against water resistance. Repeat left.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Kickboard Core Press-Down",
                                "duration": 60,
                                "cue": "Hold kickboard with both hands, push down into water, engage abs.",
                                "frames": [
                                        "/lumbar_core_routine.jpg"
                                ]
                        },
                        {
                                "title": "Aquatic Bicycle Pedaling",
                                "duration": 60,
                                "cue": "Rest back on noodles, pedal legs smoothly like riding a bike.",
                                "frames": [
                                        "/lumbar_core_routine.jpg",
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Floating Spine Rest",
                                "duration": 90,
                                "cue": "Rest supported on water surface.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
                ]
        },
        "h4": {
                "id": "h4",
                "title": "Warm Water Relaxation & Lymphatic Flush",
                "category": "hydrotherapy",
                "duration_minutes": 20,
                "intensity": "Decompression",
                "focus_areas": [
                        "lymphatic drainage",
                        "edema",
                        "nervous system",
                        "circulation"
                ],
                "instruction": "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
                "precautions": [
                        "Hydrate with water before and after pool session."
                ],
                "steps": [
                        {
                                "title": "Deep Water Submersion Breathing",
                                "duration": 90,
                                "cue": "Chest submerged, feel hydrostatic pressure assist deep exhalations.",
                                "frames": [
                                        "/exercises/childs_pose_1.jpg"
                                ]
                        },
                        {
                                "title": "Aquatic Arm Sweeps (Lymphatic Flow)",
                                "duration": 60,
                                "cue": "Smooth sweeping circles with hands submerged in water.",
                                "frames": [
                                        "/shoulder_rehab_routine.jpg"
                                ]
                        },
                        {
                                "title": "Ankle & Foot Water Mobility",
                                "duration": 60,
                                "cue": "Point, flex, and rotate ankles in warm water.",
                                "frames": [
                                        "/hip_mobility_routine.jpg"
                                ]
                        },
                        {
                                "title": "Supported Supine Water Float",
                                "duration": 120,
                                "cue": "Complete still surrender in warm hydro pool.",
                                "frames": [
                                        "/exercises/childs_pose_2.jpg"
                                ]
                        }
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
        const rawId = (id || '').toLowerCase().trim();
        if (rawId.includes('meditation')) {
            window.open('https://insighttimer.com', '_blank');
            return;
        }

        runnerModal.classList.remove('hidden');
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

    function parseAreaAndSide(name) {
        const lower = name.toLowerCase();
        let side = 'unspecified';
        if (lower.includes('right')) side = 'right';
        else if (lower.includes('left')) side = 'left';
        
        let area = 'lumbar';
        if (lower.includes('lumbar')) area = 'lumbar';
        else if (lower.includes('cervical') || lower.includes('neck')) area = 'cervical';
        else if (lower.includes('thoracic') || lower.includes('mid-back')) area = 'thoracic';
        else if (lower.includes('ankle')) area = 'ankle';
        else if (lower.includes('knee')) area = 'knee';
        else if (lower.includes('shoulder')) area = 'shoulder';
        else if (lower.includes('hip')) area = 'hip';
        else if (lower.includes('elbow')) area = 'elbow';
        
        return { area, side };
    }

    // --- 7. Log Entry Submission ---
    btnLogPain.addEventListener('click', async () => {
        const total = getPainTotalPercent();
        if (total !== 100) {
            showToast(`Location percentages must total 100% (currently ${total}%)`);
            return;
        }

        const generators = selectedPainAreas.map(p => {
            const parsed = parseAreaAndSide(p.area);
            return {
                area: parsed.area,
                side: parsed.side,
                percentage: p.percent,
                pain_score: p.score
            };
        });

        const weightedPainSum = selectedPainAreas.reduce((sum, s) => sum + (s.score * s.percent), 0);
        const overallScore = total > 0 ? Number((weightedPainSum / total).toFixed(1)) : 5.0;

        const userNotes = unifiedNotesInput ? unifiedNotesInput.value.trim() : "";

        btnLogPain.innerText = "Logged";
        btnLogPain.style.background = "var(--neon-green)";

        try {
            const res = await fetch(API_PAIN_LOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain_level: overallScore,
                    score: overallScore,
                    generators,
                    locations: generators,
                    pain_notes: userNotes,
                    mood_level: currentMoodLevel,
                    mood: String(currentMoodLevel),
                    mood_notes: userNotes,
                    mood_emoji: selectedMoodEmoji
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Pain log failed');
            if (data.alert_triggered) {
                alertBannerText.innerText = data.alert_message;
                alertBanner.classList.remove('hidden');
            }
            closePainLog();
            showToast('Pain log saved to live database', 'success');
            if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();
            if (typeof loadPainAnalytics === 'function') loadPainAnalytics();
            if (typeof loadAgendaItems === 'function') loadAgendaItems();
        } catch (e) {
            showToast(e.message || 'Pain log could not be saved');
        }

        setTimeout(() => {
            btnLogPain.innerText = "Save pain log";
            btnLogPain.style.background = "";
            if (unifiedNotesInput) unifiedNotesInput.value = "";
        }, 2000);
    });

    // --- 8. Proactive Exercise Recommendations & Full Explorer Library ---
    let cachedExerciseCatalog = [];
    let cachedExerciseRecommendations = [];
    let activeExerciseCategory = "all";
    let activeExerciseArea = "all";
    let exerciseSearchQuery = "";

    const exerciseSearchInput = document.getElementById("exerciseSearchInput");
    const btnClearExerciseSearch = document.getElementById("btnClearExerciseSearch");
    const exerciseCategoryFilters = document.getElementById("exerciseCategoryFilters");
    const exerciseAreaFilters = document.getElementById("exerciseAreaFilters");
    const exerciseRecomList = document.getElementById("exerciseRecomList");
    const exerciseRecommendationsSection = document.getElementById("exerciseRecommendationsSection");
    const exerciseCatalogCount = document.getElementById("exerciseCatalogCount");
    const exerciseActiveFilterLabel = document.getElementById("exerciseActiveFilterLabel");
    const recomContextNote = document.getElementById("recomContextNote");

    function renderExerciseCard(exercise, isRecommendation, painLevel) {
        if (!painLevel) painLevel = 5;
        const card = document.createElement("article");
        card.className = "exercise-card" + (isRecommendation ? " exercise-card-recom" : "");
        
        const catClass = (exercise.category || "yoga").toLowerCase();
        const catLabel = exercise.category ? exercise.category.toUpperCase() : "ROUTINE";
        const areas = (exercise.focus_areas || []).slice(0, 3).join(", ");
        
        card.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px;">
                    <span class="exercise-tag ${catClass}">${catLabel}</span>
                    <h3 style="margin: 0; font-size: 0.96rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(exercise.name || exercise.title)}</h3>
                </div>
                <p style="margin: 3px 0 5px 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.35;">${escapeHtml(exercise.instruction || exercise.description || "")}</p>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <small style="color: var(--neon-blue); font-weight: 500;">${exercise.duration_minutes || 15} min · ${exercise.intensity || "Adaptive"}</small>
                    ${areas ? `<small style="color: var(--text-muted);">Areas: ${escapeHtml(areas)}</small>` : ""}
                </div>
            </div>
            <div class="exercise-actions" style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end; min-width: 95px;">
                <button class="btn btn-neon-purple btn-sm exercise-show" style="width: 100%; white-space: nowrap;">Start Routine</button>
                <button class="btn btn-outline btn-sm exercise-done" style="width: 100%; white-space: nowrap;">Log Relief</button>
            </div>
        `;

        card.querySelector(".exercise-show").addEventListener("click", () => {
            exerciseModal.classList.add("hidden");
            startRunnerModal(exercise.id);
        });

        card.querySelector(".exercise-done").addEventListener("click", () => {
            pendingProtocol = { id: exercise.id, name: exercise.name || exercise.title, beforePain: painLevel };
            if (reliefExerciseName) reliefExerciseName.innerText = exercise.name || exercise.title;
            if (afterPainScore) afterPainScore.value = currentPainLevel || 5;
            exerciseModal.classList.add("hidden");
            if (reliefModal) reliefModal.classList.remove("hidden");
        });

        return card;
    }

    function filterAndRenderCatalog() {
        if (!exerciseSuggestions) return;
        
        let filtered = [...cachedExerciseCatalog];

        if (activeExerciseCategory && activeExerciseCategory !== "all") {
            const cat = activeExerciseCategory.toLowerCase();
            filtered = filtered.filter(e => (e.category || "").toLowerCase() === cat);
        }

        if (activeExerciseArea && activeExerciseArea !== "all") {
            const area = activeExerciseArea.toLowerCase();
            filtered = filtered.filter(e => 
                (e.focus_areas || []).some(fa => fa.toLowerCase().includes(area) || area.includes(fa.toLowerCase()))
            );
        }

        if (exerciseSearchQuery && exerciseSearchQuery.trim()) {
            const q = exerciseSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(e => 
                (e.name || e.title || "").toLowerCase().includes(q) ||
                (e.instruction || e.description || "").toLowerCase().includes(q) ||
                (e.category || "").toLowerCase().includes(q) ||
                (e.intensity || "").toLowerCase().includes(q) ||
                (e.focus_areas || []).some(fa => fa.toLowerCase().includes(q))
            );
        }

        if (exerciseCatalogCount) exerciseCatalogCount.textContent = filtered.length;
        if (exerciseActiveFilterLabel) {
            const parts = [];
            if (activeExerciseCategory !== "all") parts.push(activeExerciseCategory.toUpperCase());
            if (activeExerciseArea !== "all") parts.push("Focus: " + activeExerciseArea);
            if (exerciseSearchQuery) parts.push("Search: \"" + exerciseSearchQuery + "\"");
            exerciseActiveFilterLabel.textContent = parts.length > 0 ? parts.join(" · ") : "Showing all " + filtered.length + " routines";
        }

        exerciseSuggestions.innerHTML = "";
        if (filtered.length === 0) {
            exerciseSuggestions.innerHTML = "<div style=\"text-align: center; padding: 25px 10px; color: var(--text-muted);\"><p>No routines match your search criteria.</p><button class=\"btn btn-outline btn-sm\" id=\"btnResetExerciseFilters\" style=\"margin-top: 8px;\">Reset Filters</button></div>";
            const btnReset = document.getElementById("btnResetExerciseFilters");
            if (btnReset) {
                btnReset.addEventListener("click", () => {
                    activeExerciseCategory = "all";
                    activeExerciseArea = "all";
                    exerciseSearchQuery = "";
                    if (exerciseSearchInput) exerciseSearchInput.value = "";
                    document.querySelectorAll("#exerciseCategoryFilters .btn-filter-chip").forEach(b => b.classList.toggle("active", b.dataset.category === "all"));
                    document.querySelectorAll("#exerciseAreaFilters .btn-area-chip").forEach(b => b.classList.toggle("active", b.dataset.area === "all"));
                    filterAndRenderCatalog();
                });
            }
            return;
        }

        filtered.forEach(ex => {
            const card = renderExerciseCard(ex, false, currentPainLevel);
            exerciseSuggestions.appendChild(card);
        });
    }

    async function loadExerciseSuggestions() {
        if (exerciseModal) exerciseModal.classList.remove("hidden");
        if (exerciseSuggestions) exerciseSuggestions.innerHTML = "<p class=\"form-hint\">Loading comprehensive routine library...</p>";
        
        try {
            let latest = null;
            try {
                const latestRes = await fetch(API_LATEST_SYMPTOMS);
                if (latestRes.ok) latest = (await latestRes.json()).log;
            } catch (error) {
                console.warn("Latest pain log unavailable", error);
            }
            const painLevel = latest?.total_pain_level ?? currentPainLevel ?? 5;
            const liveGenerators = latest?.active_symptoms?.map((value) => {
                const match = value.match(/^(Left|Right|Both) ([^(]+) \((\d+)%\)$/i);
                return match ? { side: match[1].toLowerCase(), area: match[2].trim().toLowerCase(), percentage: Number(match[3]) } : null;
            }).filter(Boolean) || [];

            const res = await fetch(API_EXERCISE_SUGGEST, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pain_level: painLevel,
                    generators: liveGenerators.length ? liveGenerators : [...painLocations.querySelectorAll(".pain-location-row")].map(row => ({
                        area: row.querySelector(".pain-area-select").value,
                        side: row.querySelector(".pain-side-select").value,
                        percentage: parseInt(row.querySelector(".pain-percentage").value, 10) || 0
                    }))
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Recommendation request failed");

            cachedExerciseRecommendations = data.suggestions || [];
            cachedExerciseCatalog = data.all_exercises || Object.values(YOGA_ROUTINES);

            // Render top recommendations
            if (exerciseRecomList) {
                exerciseRecomList.innerHTML = "";
                if (recomContextNote) {
                    recomContextNote.textContent = "Matched to Pain Score " + painLevel + "/10";
                }
                cachedExerciseRecommendations.forEach(ex => {
                    const card = renderExerciseCard(ex, true, painLevel);
                    exerciseRecomList.appendChild(card);
                });
            }

            filterAndRenderCatalog();
        } catch (error) {
            console.error("Failed to load exercises:", error);
            cachedExerciseCatalog = Object.values(YOGA_ROUTINES);
            cachedExerciseRecommendations = cachedExerciseCatalog.slice(0, 3);
            if (exerciseRecomList) {
                exerciseRecomList.innerHTML = "";
                cachedExerciseRecommendations.forEach(ex => {
                    const card = renderExerciseCard(ex, true, currentPainLevel);
                    exerciseRecomList.appendChild(card);
                });
            }
            filterAndRenderCatalog();
        }
    }

    // Attach Search & Filter Listeners
    if (exerciseSearchInput) {
        exerciseSearchInput.addEventListener("input", (e) => {
            exerciseSearchQuery = e.target.value;
            filterAndRenderCatalog();
        });
    }

    if (btnClearExerciseSearch) {
        btnClearExerciseSearch.addEventListener("click", () => {
            exerciseSearchQuery = "";
            if (exerciseSearchInput) exerciseSearchInput.value = "";
            filterAndRenderCatalog();
        });
    }

    if (exerciseCategoryFilters) {
        exerciseCategoryFilters.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-filter-chip");
            if (!btn) return;
            exerciseCategoryFilters.querySelectorAll(".btn-filter-chip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeExerciseCategory = btn.dataset.category || "all";
            filterAndRenderCatalog();
        });
    }

    if (exerciseAreaFilters) {
        exerciseAreaFilters.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-area-chip");
            if (!btn) return;
            exerciseAreaFilters.querySelectorAll(".btn-area-chip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeExerciseArea = btn.dataset.area || "all";
            filterAndRenderCatalog();
        });
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

    // --- 9. Budget Loader & Periodic Reset Engine ---
    let currentBudgetPeriod = 'weekly';
    const budgetWidget = document.getElementById('budgetWidget');
    const budgetSummaryContainer = document.getElementById('budgetSummary');
    const budgetTotalSpent = document.getElementById('budgetTotalSpent');
    const budgetPeriodBadge = document.getElementById('budgetPeriodBadge');
    const btnToggleBudgetPeriod = document.getElementById('btnToggleBudgetPeriod');
    const btnLogBudget = document.getElementById('btnLogBudget');
    const budgetForm = document.getElementById('budgetForm');

    if (budgetWidget && budgetForm) {
        budgetWidget.style.cursor = 'pointer';
        budgetWidget.addEventListener('click', (e) => {
            // Do not toggle if clicking inside the form or on button/spent badge
            if (e.target.closest('.budget-form') || e.target.closest('button') || e.target.id === 'budgetTotalSpent') return;
            budgetForm.classList.toggle('hidden');
        });
    }

    if (btnToggleBudgetPeriod) {
        btnToggleBudgetPeriod.addEventListener('click', (e) => {
            e.stopPropagation();
            currentBudgetPeriod = currentBudgetPeriod === 'weekly' ? 'monthly' : 'weekly';
            btnToggleBudgetPeriod.innerText = currentBudgetPeriod === 'weekly' ? 'Show Month' : 'Show Week';
            if (budgetPeriodBadge) {
                budgetPeriodBadge.innerText = currentBudgetPeriod === 'weekly' ? 'Weekly' : 'Monthly';
            }
            loadBudget();
        });
    }

    const btnViewBudgetEntries = document.getElementById('btnViewBudgetEntries');
    const budgetEntriesList = document.getElementById('budgetEntriesList');
    if (btnViewBudgetEntries && budgetEntriesList) {
        btnViewBudgetEntries.addEventListener('click', (e) => {
            e.stopPropagation();
            budgetEntriesList.classList.toggle('hidden');
        });
    }

    async function loadBudget() {
        try {
            const res = await fetch(`${API_BUDGET}?period=${currentBudgetPeriod}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === "success") {
                    let summaryHtml = '';
                    if (data.summary) {
                        for (const [cat, val] of Object.entries(data.summary)) {
                            if (cat !== 'Total' && cat !== 'Income' && cat !== 'Net') {
                                summaryHtml += `<span class="badge neon-blue">${cat}: $${Number(val).toFixed(2)}</span>`;
                            }
                        }
                    }
                    if (budgetSummaryContainer) budgetSummaryContainer.innerHTML = summaryHtml || '<span style="font-size:0.8rem; color:var(--text-secondary);">No entries in this period</span>';
                    
                    const spentVal = Number(data.summary?.Total || 0).toFixed(2);
                    const incomeVal = Number(data.summary?.Income || 0).toFixed(2);
                    const totalVal = (Number(incomeVal) - Number(spentVal)).toFixed(2);
                    const periodLabel = currentBudgetPeriod === 'weekly' ? `Week (${data.weekly?.label || ''})` : `Month (${data.monthly?.label || ''})`;
                    if (budgetTotalSpent) {
                        budgetTotalSpent.innerText = `IN: ${incomeVal} | OUT: ${spentVal} | TOTAL: ${totalVal}`;
                    }
                    if (budgetPeriodBadge) budgetPeriodBadge.innerText = periodLabel;
                    
                    const entriesList = document.getElementById('budgetEntriesList');
                    if (entriesList) {
                        const items = currentBudgetPeriod === 'weekly' ? data.weekly?.items : data.monthly?.items;
                        if (items && items.length > 0) {
                            let tableHtml = `<table style="width: 100%; border-collapse: collapse;">`;
                            tableHtml += `<tr><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Date</th><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Desc</th><th style="text-align: left; padding: 4px; border-bottom: 1px solid var(--glass-border);">Cat</th><th style="text-align: right; padding: 4px; border-bottom: 1px solid var(--glass-border);">Amount</th></tr>`;
                            items.forEach(item => {
                                const d = new Date(item.created_at).toLocaleDateString('en-AU', {day: '2-digit', month: 'short'});
                                const amtColor = item.type === 'income' ? 'var(--neon-green)' : 'var(--text-primary)';
                                tableHtml += `<tr>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">${d}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">${item.description.replace(/</g, "&lt;")}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">${item.category.replace(/</g, "&lt;")}</td>
                                    <td style="padding: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: ${amtColor};">${Number(item.amount).toFixed(2)}</td>
                                </tr>`;
                            });
                            tableHtml += `</table>`;
                            entriesList.innerHTML = tableHtml;
                        } else {
                            entriesList.innerHTML = '<div style="color: var(--text-secondary);">No entries logged.</div>';
                        }
                    }
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
            const type = document.getElementById('budgetType') ? document.getElementById('budgetType').value : 'expense';

            if (!description || isNaN(amount) || amount <= 0) {
                showToast('Description and positive amount required');
                return;
            }

            try {
                const res = await fetch(API_BUDGET, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, category, notes, type })
                });
                if (res.ok) {
                    showToast('Entry added successfully', 'success');
                    document.getElementById('budgetDesc').value = '';
                    document.getElementById('budgetAmount').value = '';
                    document.getElementById('budgetNotes').value = '';
                    loadBudget();
                } else {
                    showToast('Failed to add entry');
                }
            } catch (e) {
                showToast('Failed to add entry');
                console.error(e);
            }
        });
    }

    // --- 10. Budget Overview Modal, Archive Reports & Chart ---
    const budgetOverviewModal = document.getElementById('budgetOverviewModal');
    const btnCloseBudgetOverview = document.getElementById('btnCloseBudgetOverview');
    const btnDismissBudgetModal = document.getElementById('btnDismissBudgetModal');
    const budgetMonthSelect = document.getElementById('budgetMonthSelect');
    const budgetReportsList = document.getElementById('budgetReportsList');
    const budgetReportDetail = document.getElementById('budgetReportDetail');
    const budgetReportDetailTitle = document.getElementById('budgetReportDetailTitle');
    const budgetReportDetailContent = document.getElementById('budgetReportDetailContent');
    const btnCloseReportDetail = document.getElementById('btnCloseReportDetail');
    const btnArchiveResetWeek = document.getElementById('btnArchiveResetWeek');
    const btnArchiveResetMonth = document.getElementById('btnArchiveResetMonth');
    let budgetChartInstance = null;

    if (budgetTotalSpent) {
        budgetTotalSpent.style.cursor = 'pointer';
        budgetTotalSpent.addEventListener('click', () => {
            if (budgetOverviewModal) {
                budgetOverviewModal.classList.remove('hidden');
                renderBudgetChart();
                loadBudgetReports();
            }
        });
    }

    if (btnCloseBudgetOverview) {
        btnCloseBudgetOverview.addEventListener('click', () => {
            budgetOverviewModal.classList.add('hidden');
        });
    }

    if (btnDismissBudgetModal) {
        btnDismissBudgetModal.addEventListener('click', () => {
            budgetOverviewModal.classList.add('hidden');
        });
    }

    if (btnCloseReportDetail && budgetReportDetail) {
        btnCloseReportDetail.addEventListener('click', () => {
            budgetReportDetail.classList.add('hidden');
        });
    }

    if (budgetMonthSelect) {
        budgetMonthSelect.addEventListener('change', () => {
            renderBudgetChart();
        });
    }

    async function loadBudgetReports() {
        if (!budgetReportsList) return;
        try {
            const res = await fetch(API_BUDGET_REPORTS);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && Array.isArray(data.reports) && data.reports.length > 0) {
                    budgetReportsList.innerHTML = data.reports.map(r => `
                        <div class="glass-panel" style="padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); border-radius: 8px;">
                            <div>
                                <strong style="color: var(--neon-blue); font-size: 0.9rem;">${r.period_type === 'weekly' ? 'Weekly' : 'Monthly'} Report (${r.period_label})</strong>
                                <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                                    ${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()} &bull; Total: <span style="color: var(--neon-green); font-weight: bold;">$${Number(r.total_spent).toFixed(2)}</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline btn-view-report" data-report-id="${r.id}" style="padding: 3px 8px; font-size: 0.75rem;">View Report</button>
                        </div>
                    `).join('');

                    document.querySelectorAll('.btn-view-report').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const target = e.currentTarget;
                            const reportId = target ? target.getAttribute('data-report-id') : null;
                            const selectedReport = data.reports.find(item => item.id === reportId);
                            if (selectedReport && budgetReportDetail && budgetReportDetailContent) {
                                if (budgetReportDetailTitle) budgetReportDetailTitle.innerText = `${selectedReport.period_type === 'weekly' ? 'Weekly' : 'Monthly'} Budget Report (${selectedReport.period_label})`;
                                budgetReportDetailContent.innerText = selectedReport.report_markdown;
                                budgetReportDetail.classList.remove('hidden');
                                budgetReportDetail.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    });
                } else {
                    budgetReportsList.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem; padding: 6px;">No archived reports yet. Click "Archive & Reset" to close out the current period.</div>';
                }
            }
        } catch (e) {
            console.error('Failed to load budget reports:', e);
            budgetReportsList.innerHTML = '<div style="color: #ff5252; font-size: 0.85rem;">Failed to load reports.</div>';
        }
    }

    if (btnArchiveResetWeek) {
        btnArchiveResetWeek.addEventListener('click', async () => {
            if (!confirm('Close out and archive the current week budget report into agent_reports/? Weekly spend will reset.')) return;
            try {
                const res = await fetch(API_BUDGET_RESET, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ period_type: 'weekly' })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast('Weekly budget archived to agent_reports/ & reset', 'success');
                    loadBudget();
                    loadBudgetReports();
                } else {
                    showToast('Failed to archive weekly budget');
                }
            } catch (e) {
                showToast('Error archiving weekly budget');
                console.error(e);
            }
        });
    }

    if (btnArchiveResetMonth) {
        btnArchiveResetMonth.addEventListener('click', async () => {
            if (!confirm('Close out and archive the current month budget report into agent_reports/? Monthly spend will reset.')) return;
            try {
                const res = await fetch(API_BUDGET_RESET, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ period_type: 'monthly' })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast('Monthly budget archived to agent_reports/ & reset', 'success');
                    loadBudget();
                    loadBudgetReports();
                } else {
                    showToast('Failed to archive monthly budget');
                }
            } catch (e) {
                showToast('Error archiving monthly budget');
                console.error(e);
            }
        });
    }

    function renderBudgetChart() {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;
        
        const month = budgetMonthSelect ? budgetMonthSelect.value : '2026-08';
        
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

    // --- 12. Pain Analytics & GP Report Logic ---
    const btnOpenPainAnalytics = document.getElementById('btnOpenPainAnalytics');
    const btnClosePainAnalytics = document.getElementById('btnClosePainAnalytics');
    const btnDismissPainAnalytics = document.getElementById('btnDismissPainAnalytics');
    const btnPrintPainReport = document.getElementById('btnPrintPainReport');
    const btnAskRumbleForGP = document.getElementById('btnAskRumbleForGP');

    let currentPainAnalyticsPeriod = 'month';
    let painTrendsChartInstance = null;
    let painAnatomyChartInstance = null;

    if (btnOpenPainAnalytics && painAnalyticsModal) {
        btnOpenPainAnalytics.addEventListener('click', () => {
            painAnalyticsModal.classList.remove('hidden');
            loadPainAnalytics(currentPainAnalyticsPeriod);
        });
    }

    // Period buttons
    document.querySelectorAll('.pain-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.pain-period-btn').forEach(b => {
                b.classList.remove('active', 'btn-neon-blue');
                b.classList.add('btn-outline');
            });
            const target = e.currentTarget;
            target.classList.remove('btn-outline');
            target.classList.add('active', 'btn-neon-blue');
            const selectedPeriod = target.getAttribute('data-period') || 'month';
            currentPainAnalyticsPeriod = selectedPeriod;
            loadPainAnalytics(selectedPeriod);
        });
    });

    if (btnClosePainAnalytics && painAnalyticsModal) {
        btnClosePainAnalytics.addEventListener('click', () => {
            painAnalyticsModal.classList.add('hidden');
        });
    }

    if (btnDismissPainAnalytics && painAnalyticsModal) {
        btnDismissPainAnalytics.addEventListener('click', () => {
            painAnalyticsModal.classList.add('hidden');
        });
    }

    if (btnPrintPainReport) {
        btnPrintPainReport.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnAskRumbleForGP) {
        btnAskRumbleForGP.addEventListener('click', () => {
            if (painAnalyticsModal) painAnalyticsModal.classList.add('hidden');
            if (rumbleChatModal) rumbleChatModal.classList.remove('hidden');
            sendRumbleChatMessage(`Please generate a concise, structured clinical summary of my ${currentPainAnalyticsPeriod === 'day' ? "today's" : currentPainAnalyticsPeriod === 'week' ? "last 7 days'" : "last month's"} pain logs, flare patterns, and functional restrictions for my upcoming GP appointment.`);
        });
    }

    async function loadPainAnalytics(period = 'month') {
        try {
            const res = await fetch(`/api/v1/pain/analytics?period=${encodeURIComponent(period)}`);
            if (!res.ok) throw new Error("Failed to load pain analytics");
            const data = await res.json();
            if (data.status !== "success") return;

            const badge = document.getElementById('painAnalyticsPeriodBadge');
            if (badge) badge.innerText = `Showing ${data.period_label || period}`;

            const statPainAvgLabel = document.getElementById('statPainAvgLabel');
            if (statPainAvgLabel) statPainAvgLabel.innerText = `${data.period_label || 'Period'} Average Pain`;

            // Populate KPI metrics
            const statPainAvg = document.getElementById('statPainAvg');
            const statPainRange = document.getElementById('statPainRange');
            const statPainPrimary = document.getElementById('statPainPrimary');
            const statPainPrimaryPct = document.getElementById('statPainPrimaryPct');
            const statPainTotalLogs = document.getElementById('statPainTotalLogs');
            const statPainMorningNight = document.getElementById('statPainMorningNight');

            if (statPainAvg) statPainAvg.innerText = `${data.average_score} / 10`;
            if (statPainRange) statPainRange.innerText = `Range: ${data.min_score} - ${data.max_score}`;
            
            // Determine primary generator
            const sortedAnatomy = Object.entries(data.anatomical_distribution || {}).sort((a, b) => b[1] - a[1]);
            if (sortedAnatomy.length > 0) {
                if (statPainPrimary) statPainPrimary.innerText = sortedAnatomy[0][0];
                if (statPainPrimaryPct) statPainPrimaryPct.innerText = `${sortedAnatomy[0][1]}% of Total Burden`;
            } else {
                if (statPainPrimary) statPainPrimary.innerText = 'None';
                if (statPainPrimaryPct) statPainPrimaryPct.innerText = '0% of Total Burden';
            }

            if (statPainTotalLogs) statPainTotalLogs.innerText = `${data.total_logs} Entries`;

            // Morning vs night
            const morningSlot = (data.time_of_day_distribution || []).find(t => t.slot.includes('Morning'));
            const eveningSlot = (data.time_of_day_distribution || []).find(t => t.slot.includes('Evening'));
            if (statPainMorningNight) {
                if (morningSlot && eveningSlot) {
                    statPainMorningNight.innerText = `${morningSlot.average} AM · ${eveningSlot.average} PM`;
                } else if (morningSlot) {
                    statPainMorningNight.innerText = `${morningSlot.average} AM (Morning)`;
                } else if (eveningSlot) {
                    statPainMorningNight.innerText = `${eveningSlot.average} PM (Evening)`;
                } else {
                    statPainMorningNight.innerText = `${data.average_score} Avg`;
                }
            }

            // Render Chart 1: Pain Trajectory Line Chart
            const trendsCtx = document.getElementById('painTrendsChart');
            if (trendsCtx && typeof Chart !== 'undefined') {
                if (painTrendsChartInstance) painTrendsChartInstance.destroy();

                let labels = [];
                let datasets = [];

                if (period === 'day') {
                    // Intra-day points
                    const intraList = data.intra_day_trends || [];
                    labels = intraList.length > 0 ? intraList.map(d => d.time) : ['No entries today'];
                    const scores = intraList.length > 0 ? intraList.map(d => d.score) : [0];

                    datasets = [
                        {
                            label: 'Intra-Day Pain Score',
                            data: scores,
                            borderColor: 'rgba(0, 240, 255, 1)',
                            backgroundColor: 'rgba(0, 240, 255, 0.15)',
                            borderWidth: 2.5,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointBackgroundColor: 'rgba(0, 240, 255, 1)'
                        }
                    ];
                } else {
                    // Multi-day trends
                    const dailyList = data.daily_trends || [];
                    labels = dailyList.length > 0 ? dailyList.map(d => d.date) : ['No entries'];
                    const avgData = dailyList.length > 0 ? dailyList.map(d => d.avg) : [0];
                    const peakData = dailyList.length > 0 ? dailyList.map(d => d.peak) : [0];

                    datasets = [
                        {
                            label: 'Daily Average Score',
                            data: avgData,
                            borderColor: 'rgba(0, 240, 255, 1)',
                            backgroundColor: 'rgba(0, 240, 255, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 3,
                            pointBackgroundColor: 'rgba(0, 240, 255, 1)'
                        },
                        {
                            label: 'Peak Flare Spike',
                            data: peakData,
                            borderColor: 'rgba(255, 0, 85, 0.8)',
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            borderDash: [4, 4],
                            pointRadius: 2,
                            pointBackgroundColor: 'rgba(255, 0, 85, 1)'
                        }
                    ];
                }

                painTrendsChartInstance = new Chart(trendsCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                min: 0,
                                max: 10,
                                grid: { color: 'rgba(255,255,255,0.08)' },
                                ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 2 }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: 'rgba(255,255,255,0.6)', maxTicksLimit: 12 }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: 'rgba(255,255,255,0.8)', font: { size: 11 } } }
                        }
                    }
                });
            }

            // Render Chart 2: Anatomical Burden Doughnut Chart
            const anatomyCtx = document.getElementById('painAnatomyChart');
            if (anatomyCtx && typeof Chart !== 'undefined') {
                if (painAnatomyChartInstance) painAnatomyChartInstance.destroy();

                const anatomyLabels = sortedAnatomy.length > 0 ? sortedAnatomy.map(a => a[0]) : ['No data'];
                const anatomyValues = sortedAnatomy.length > 0 ? sortedAnatomy.map(a => a[1]) : [100];
                const colors = sortedAnatomy.length > 0 ? [
                    'rgba(255, 0, 85, 0.85)',
                    'rgba(180, 0, 255, 0.85)',
                    'rgba(0, 240, 255, 0.85)',
                    'rgba(0, 230, 118, 0.85)',
                    'rgba(255, 170, 0, 0.85)',
                    'rgba(100, 100, 255, 0.7)'
                ] : ['rgba(255,255,255,0.1)'];

                painAnatomyChartInstance = new Chart(anatomyCtx, {
                    type: 'doughnut',
                    data: {
                        labels: anatomyLabels,
                        datasets: [{
                            data: anatomyValues,
                            backgroundColor: colors.slice(0, anatomyLabels.length),
                            borderColor: '#121218',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: 'rgba(255,255,255,0.8)', font: { size: 11 }, boxWidth: 12 }
                            }
                        }
                    }
                });
            }

            // Populate Table
            const tableBody = document.getElementById('painLogsTableBody');
            const displayLogs = data.logs || data.recent_logs || [];
            if (tableBody) {
                if (displayLogs.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 16px; color: var(--text-secondary);">No check-ins logged for ${data.period_label || period}.</td></tr>`;
                } else {
                    tableBody.innerHTML = '';
                    displayLogs.forEach(log => {
                        const row = document.createElement('tr');
                        row.style.borderBottom = '1px solid rgba(255,255,255,0.06)';

                        const dateStr = new Date(log.created_at).toLocaleString('en-AU', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne'
                        });

                        const locsStr = Array.isArray(log.locations) && log.locations.length > 0
                            ? log.locations.map(l => `${l.side && l.side !== 'unspecified' ? l.side + ' ' : ''}${l.area} (${l.percentage || l.weight}%)`).join(', ')
                            : 'Unspecified';

                        const scoreVal = Number(log.score);
                        const scoreColor = scoreVal >= 8 ? 'var(--neon-red)' : scoreVal >= 6 ? 'var(--neon-orange, #ffaa00)' : 'var(--neon-green)';

                        row.innerHTML = `
                            <td style="padding: 8px; color: var(--text-secondary); white-space: nowrap;">${escapeHtml(dateStr)}</td>
                            <td style="padding: 8px; font-weight: 700; color: ${scoreColor};">${scoreVal}/10</td>
                            <td style="padding: 8px; color: var(--text-primary);">${escapeHtml(locsStr)}</td>
                            <td style="padding: 8px; color: var(--text-secondary);">${escapeHtml(log.mood ? String(log.mood) + '/10' : 'N/A')}</td>
                            <td style="padding: 8px; color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(log.notes || '—')}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
            }
        } catch (err) {
            console.error("Error loading pain analytics:", err);
        }
    }

});

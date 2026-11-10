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
    const API_TASKS = `${API_BASE}/api/v1/tasks`;
    const API_TASKS_SYNC = `${API_BASE}/api/v1/tasks/sync`;


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
    const btnSimplifyLearn = document.getElementById('btnSimplifyLearn');
    const learnSimplifyPanel = document.getElementById('learnSimplifyPanel');
    const learnSimplifyContent = document.getElementById('learnSimplifyContent');
    const btnToggleSimplifyPanel = document.getElementById('btnToggleSimplifyPanel');
    const simplifyMemoryCache = new Map();
    
    const notesModal = document.getElementById('notesModal');
    const btnCloseNotes = document.getElementById('btnCloseNotes');
    const notesGrid = document.getElementById('notesGrid');
    const pinnedNotesGrid = document.getElementById('pinnedNotesGrid');
    const archivedNotesGrid = document.getElementById('archivedNotesGrid');
    const notesSectionTitle = document.getElementById('notesSectionTitle');
    const unpinnedNotesSectionTitle = document.getElementById('unpinnedNotesSectionTitle');
    const archivedNotesSectionTitle = document.getElementById('archivedNotesSectionTitle');
    const btnToggleArchiveView = document.getElementById('btnToggleArchiveView');
    const btnToggleFollowUpView = document.getElementById('btnToggleFollowUpView');
    const followUpWorkspace = document.getElementById('followUpWorkspace');
    const standardNotesWorkspace = document.getElementById('standardNotesWorkspace');
    const followUpTextarea = document.getElementById('followUpTextarea');
    const btnSaveFollowUp = document.getElementById('btnSaveFollowUp');
    const followUpSaveStatus = document.getElementById('followUpSaveStatus');
    const inlineNoteEditorContainer = document.getElementById('inlineNoteEditorContainer');
    const btnDeleteNoteEditor = document.getElementById('btnDeleteNoteEditor');
    let followUpNoteId = null;
    
    // Inline Note Editor
    const noteEditorCollapsed = document.getElementById('noteEditorCollapsed');
    const noteEditorExpanded = document.getElementById('noteEditorExpanded');
    const editNoteTitle = document.getElementById('editNoteTitle');
    const editNoteBody = document.getElementById('editNoteBody');
    const btnSaveNoteEdit = document.getElementById('btnSaveNoteEdit');
    const btnCancelNoteEdit = document.getElementById('btnCancelNoteEdit');
    const btnPinNote = document.getElementById('btnPinNote');
    const noteFileInput = document.getElementById('noteFileInput');
    const noteCameraInput = document.getElementById('noteCameraInput');
    const btnNoteAttachCollapsed = document.getElementById('btnNoteAttachCollapsed');
    const btnNoteCameraCollapsed = document.getElementById('btnNoteCameraCollapsed');
    const btnNoteAttachExpanded = document.getElementById('btnNoteAttachExpanded');
    const btnNoteCameraExpanded = document.getElementById('btnNoteCameraExpanded');
    const noteAttachmentPreview = document.getElementById('noteAttachmentPreview');
    const noteAttachmentImg = document.getElementById('noteAttachmentImg');
    const noteAttachmentFileIcon = document.getElementById('noteAttachmentFileIcon');
    const noteAttachmentName = document.getElementById('noteAttachmentName');
    const noteAttachmentSize = document.getElementById('noteAttachmentSize');
    const noteOcrStatus = document.getElementById('noteOcrStatus');
    const btnRemoveNoteAttachment = document.getElementById('btnRemoveNoteAttachment');
    let currentNoteAttachment = null;
    let currentNoteAttachmentUploadPromise = null;
    
    // Lightbox Elements
    const imageLightboxModal = document.getElementById('imageLightboxModal');
    const btnCloseImageLightbox = document.getElementById('btnCloseImageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    
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
    const btnExportChat = document.getElementById('btnExportChat');
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
                    const formatWashDay = (isoDate) => {
                        const [y, m, d] = String(isoDate).split('-').map(Number);
                        if (!y || !m || !d) return isoDate;
                        return new Date(Date.UTC(y, m - 1, d, 13, 0, 0)).toLocaleDateString('en-AU', { weekday: 'long', timeZone: 'Australia/Melbourne' });
                    };
                    const washDays = (data.forecast || []).slice().sort((a, b) => a.precipitation_probability_pct - b.precipitation_probability_pct).slice(0, 2).map(day => formatWashDay(day.date)).join(' and ');
                    const maxTemp = data.max_temp_c !== null ? `${data.max_temp_c}°C` : '--';
                    const rainDay = data.rain_probability_pct_day !== undefined ? data.rain_probability_pct_day : (data.rain_probability_pct || 0);
                    weatherWidget.innerHTML = `<span class="weather-text">Wangaratta: ${data.temp_c}°C (Max: ${maxTemp}) • ${rainDay}% chance of rain today • Wash: ${washDays || 'forecast unavailable'}</span>`;
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
    loadTasks();
    // --- Agenda & Tasks Auto-Refresh (picks up injected alerts and synced tasks) ---
    setInterval(loadAgenda, 60000);
    setInterval(loadTasks, 120000);

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
                if (item.scheduled_time) card.setAttribute('data-scheduled-time', item.scheduled_time);
                if (item.id) card.setAttribute('data-agenda-id', item.id);
                
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
                    const isOverdue = item.scheduled_time && !isNaN(new Date(item.scheduled_time).getTime()) && new Date(item.scheduled_time) < new Date();
                    if (isOverdue) {
                        card.style.borderLeft = '4px solid var(--neon-red)';
                        card.style.background = 'rgba(255, 0, 60, 0.08)';
                    }
                    card.innerHTML = `
                        <div class="protocol-info">
                            <h3${isOverdue ? ' style="color: var(--neon-red);"' : ''}>${item.time}${isOverdue ? ' <span class="badge" style="background: rgba(255,0,60,0.25); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 0.72rem; margin-left: 6px; padding: 1px 6px;">Overdue</span>' : ''}</h3>
                            <p>${escapeHtml(item.title)}</p>
                            ${item.routine_details && item.routine_details.length > 0 ? `
                                <div class="yoga-routine-badges" style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                                    ${item.routine_details.map(rd => `
                                        <div style="font-size: 0.78rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 4px 8px; border-radius: 4px; border-left: 2px solid var(--neon-purple);">
                                            <strong style="color: var(--text-normal);">${escapeHtml(rd.title)}</strong> (${rd.duration_minutes || 15}m)
                                            ${rd.selection_reason ? `<br><span class="badge neon-blue" style="font-size: 0.7rem; padding: 1px 5px; margin-top: 2px; display: inline-block;">${escapeHtml(rd.selection_reason)}</span>` : ''}
                                            ${rd.adapted ? ` <span class="badge neon-green" style="font-size: 0.7rem; padding: 1px 5px;">${rd.adapted_poses || 1} pose adapted</span>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : (item.choices ? `<small class="form-hint">Choices: ${item.choices.join(' · ')}</small>` : '')}
                        </div>
                        <div class="protocol-actions">
                            ${item.item_type === 'insight' ? `
                                <button class="btn btn-neon-blue btn-sm btn-done" data-id="${item.id}" data-type="insight">Approve</button>
                                <button class="btn btn-outline btn-sm btn-dismiss" data-id="${item.id}" data-type="insight">Reject</button>
                            ` : `
                                <button class="btn btn-neon-purple btn-sm btn-show-me" data-id="${item.id}" data-type="${item.item_type || ''}" data-scheduled-time="${item.scheduled_time || ''}">View</button>
                                <button class="btn btn-neon-green btn-sm btn-done" data-id="${item.id}" data-type="${item.item_type || ''}">Done</button>
                                <button class="btn btn-outline btn-sm btn-postpone" data-id="${item.id}" data-type="${item.item_type || ''}">Delay</button>
                                <button class="btn btn-outline btn-sm btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}">Dismiss</button>
                            `}
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
            const calendarConfig = {
                initialView: 'dayGridMonth',
                weekends: true,
                firstDay: 1,
                dayHeaders: true,
                nowIndicator: true,
                selectable: true,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listWeek'
                },
                buttonText: {
                    today: 'Today',
                    dayGridMonth: 'Month',
                    listWeek: 'Week'
                },
                eventTimeFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                },
                views: {
                    dayGridMonth: {
                        dayHeaderFormat: { weekday: 'short' },
                        dayMaxEvents: 2
                    },
                    listWeek: {
                        dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
                        noEventsContent: 'No events scheduled this week'
                    }
                },
                height: 'auto',
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
            };

            interactiveCalendar = new FullCalendar.Calendar(calendarEl, calendarConfig);
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
            { id: 'tom_court_0930', time: '09:30 AM', title: 'Email Court Coordinator regarding appearing via video conference (Webex/AVL)', item_type: 'task', status: 'pending' },
            { id: 'tom_complaints_1000', time: '10:00 AM', title: 'Review & Lodge Regulatory Complaints (ACCC, VPA & CAV)', item_type: 'complaints', status: 'pending' },
            { id: 'tom_hydro_1030', time: '10:30 AM', title: 'Hydrotherapy Session (Rumble Target: 3/week)', item_type: 'hydrotherapy', status: 'pending' },
            { id: 'tom_supabase_1100', time: '11:00 AM', title: 'Enable Row-Level Security (RLS) on Supabase project ladies-night & review Oct 30 GRANT changes', item_type: 'task', status: 'pending' },
            { id: 'tom_chiro_1130', time: '11:30 AM', title: 'Pay Alpine Chiropractic Invoice #0033571 (emailed by Rosanna 21 Oct)', item_type: 'task', status: 'pending' },
            { id: 'tom_wash_1300', time: '01:00 PM', title: 'Weather-Optimized Washing (Lowest Precip Window)', item_type: 'washing', status: 'pending' },
            { id: 'tom_email_1400', time: '02:00 PM', title: 'Automated Afternoon Email & Calendar Scrape', item_type: 'retrieval', status: 'pending' },
            { id: 'tom_deakin_1430', time: '02:30 PM', title: 'Verify S306 Computer Science minor selection in Deakin StudentConnect & unlock MFA', item_type: 'task', status: 'pending' },
            { id: 'tom_stickeroo_1530', time: '03:30 PM', title: 'Reply to Reggie at Stickeroo with exact sticker dimensions to finalize custom quote', item_type: 'task', status: 'pending' },
            { id: 'tom_axs_1630', time: '04:30 PM', title: 'Reply to AXS Support Ticket #13237399 & verify Foo Fighters Order #1000748351 in zinta_cook@live.com.au', item_type: 'task', status: 'pending' },
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
                const taskMatch = (cachedTasks || []).find(x => x.id === itemToPostpone);
                if (taskMatch) {
                    const res = await fetch(`${API_TASKS}/${encodeURIComponent(itemToPostpone)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ due: new Date(selectedDate).toISOString() })
                    });
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    if (postponeModal) postponeModal.classList.add('hidden');
                    showToast('Task delayed and rescheduled', 'success');
                    itemToPostpone = null;
                    await loadTasks();
                    return;
                }

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
                    const taskMatch = (cachedTasks || []).find(x => x.id === itemToDismiss);
                    if (taskMatch) {
                        const res = await fetch(`${API_TASKS}/${encodeURIComponent(itemToDismiss)}`, {
                            method: 'DELETE'
                        });
                        if (res.ok) {
                            showToast(`Dismissed: ${taskMatch.title}`, 'info');
                            await loadTasks();
                        } else {
                            showToast('Failed to dismiss task');
                        }
                        itemToDismiss = null;
                        return;
                    }

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

    // --- Google Tasks Tab & Interactive Calendar Engine ---
    let tasksCalendar = null;
    let cachedTasks = [];
    let activeTask = null;

    const tabBtnCalendar = document.getElementById('tabBtnCalendar');
    const tabBtnTasks = document.getElementById('tabBtnTasks');
    const calendarSection = document.getElementById('calendarSection');
    const tasksSection = document.getElementById('tasksSection');
    const tasksTabBadge = document.getElementById('tasksTabBadge');
    const tasksActiveCountBadge = document.getElementById('tasksActiveCountBadge');
    const tasksCompletedCountBadge = document.getElementById('tasksCompletedCountBadge');
    const btnSyncTasks = document.getElementById('btnSyncTasks');
    const btnAddTask = document.getElementById('btnAddTask');

    // Task View Modal elements
    const taskViewModal = document.getElementById('taskViewModal');
    const viewTaskTitle = document.getElementById('viewTaskTitle');
    const btnCloseTaskView = document.getElementById('btnCloseTaskView');
    const viewTaskBadge = document.getElementById('viewTaskBadge');
    const viewTaskSourceBadge = document.getElementById('viewTaskSourceBadge');
    const viewTaskDue = document.getElementById('viewTaskDue');
    const viewTaskNotes = document.getElementById('viewTaskNotes');
    const btnDeleteTask = document.getElementById('btnDeleteTask');
    const btnToggleTaskComplete = document.getElementById('btnToggleTaskComplete');
    const btnEditTask = document.getElementById('btnEditTask');
    const btnDoneTaskView = document.getElementById('btnDoneTaskView');

    // Task Edit Modal elements
    const taskEditModal = document.getElementById('taskEditModal');
    const editTaskModalTitle = document.getElementById('editTaskModalTitle');
    const btnCloseTaskEdit = document.getElementById('btnCloseTaskEdit');
    const btnCancelTaskEdit = document.getElementById('btnCancelTaskEdit');
    const taskForm = document.getElementById('taskForm');
    const taskId = document.getElementById('taskId');
    const taskInputTitle = document.getElementById('taskInputTitle');
    const taskInputDate = document.getElementById('taskInputDate');
    const taskInputTime = document.getElementById('taskInputTime');
    const taskInputStatus = document.getElementById('taskInputStatus');
    const taskInputUrgent = document.getElementById('taskInputUrgent');
    const taskInputNotes = document.getElementById('taskInputNotes');
    const btnSaveTask = document.getElementById('btnSaveTask');

    function switchScheduleTab(activeTab) {
        if (activeTab === 'tasks') {
            if (tabBtnTasks) {
                tabBtnTasks.classList.add('btn-neon-blue', 'active');
                tabBtnTasks.classList.remove('btn-outline');
                tabBtnTasks.setAttribute('aria-selected', 'true');
            }
            if (tabBtnCalendar) {
                tabBtnCalendar.classList.remove('btn-neon-blue', 'active');
                tabBtnCalendar.classList.add('btn-outline');
                tabBtnCalendar.setAttribute('aria-selected', 'false');
            }
            if (tasksSection) tasksSection.classList.remove('hidden');
            if (calendarSection) calendarSection.classList.add('hidden');

            if (tasksCalendar) {
                setTimeout(() => tasksCalendar.updateSize(), 50);
            } else {
                renderTasksCalendar(cachedTasks);
            }
        } else {
            if (tabBtnCalendar) {
                tabBtnCalendar.classList.add('btn-neon-blue', 'active');
                tabBtnCalendar.classList.remove('btn-outline');
                tabBtnCalendar.setAttribute('aria-selected', 'true');
            }
            if (tabBtnTasks) {
                tabBtnTasks.classList.remove('btn-neon-blue', 'active');
                tabBtnTasks.classList.add('btn-outline');
                tabBtnTasks.setAttribute('aria-selected', 'false');
            }
            if (calendarSection) calendarSection.classList.remove('hidden');
            if (tasksSection) tasksSection.classList.add('hidden');

            if (interactiveCalendar) {
                setTimeout(() => interactiveCalendar.updateSize(), 50);
            }
        }
    }

    if (tabBtnCalendar) tabBtnCalendar.addEventListener('click', () => switchScheduleTab('calendar'));
    if (tabBtnTasks) tabBtnTasks.addEventListener('click', () => switchScheduleTab('tasks'));

    async function loadTasks(sync = false) {
        try {
            const url = sync ? `${API_TASKS}?sync=true` : API_TASKS;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            cachedTasks = data.tasks || [];
            updateTaskBadges(cachedTasks);
            renderTasksCalendar(cachedTasks);
        } catch (err) {
            console.error('Failed to load tasks:', err);
        }
    }

    let urgentBannerDismissed = false;
    const btnDismissUrgentBanner = document.getElementById('btnDismissUrgentBanner');
    if (btnDismissUrgentBanner) {
        btnDismissUrgentBanner.addEventListener('click', () => {
            const urgentBanner = document.getElementById('urgentTasksBanner');
            const now = new Date();
            const persistentUrgent = (cachedTasks || []).some(t => t.status !== 'completed' && Boolean(t.isUrgent) && t.due && !isNaN(new Date(t.due).getTime()) && new Date(t.due) < now);
            if (persistentUrgent) {
                showToast('Overdue urgent tasks are persistent. Please resolve each task with Done, Delay, or Dismiss.', 'info');
                return;
            }
            if (urgentBanner) urgentBanner.classList.add('hidden');
            urgentBannerDismissed = true;
        });
    }

    function updateTaskBadges(tasks) {
        const pendingCount = tasks.filter(t => t.status !== 'completed').length;
        const doneCount = tasks.filter(t => t.status === 'completed').length;

        if (tasksTabBadge) tasksTabBadge.textContent = pendingCount.toString();
        
        const urgentBanner = document.getElementById('urgentTasksBanner');
        const urgentText = document.getElementById('urgentTasksBannerText');
        const urgentList = document.getElementById('urgentTasksBannerList');
        const now = new Date();

        const criticalOverdueTasks = tasks.filter(t => {
            if (t.status === 'completed') return false;
            const isOverdue = t.due && !isNaN(new Date(t.due).getTime()) && new Date(t.due) < now;
            return Boolean(t.isUrgent) && isOverdue;
        });

        const allUrgentTasks = tasks.filter(t => {
            if (t.status === 'completed') return false;
            const isOverdue = t.due && !isNaN(new Date(t.due).getTime()) && new Date(t.due) < now;
            return Boolean(t.isUrgent) || isOverdue;
        });

        // If there are critical overdue urgent tasks, banner is strictly PERSISTENT
        const isPersistent = criticalOverdueTasks.length > 0;
        if (isPersistent) {
            urgentBannerDismissed = false;
        }
        
        if (urgentBanner && urgentText) {
            if (allUrgentTasks.length > 0 && (!urgentBannerDismissed || isPersistent)) {
                urgentBanner.classList.remove('hidden');

                if (isPersistent) {
                    urgentBanner.style.background = 'rgba(255, 0, 60, 0.28)';
                    urgentBanner.style.border = '2px solid var(--neon-red)';
                    urgentBanner.style.borderLeft = '6px solid var(--neon-red)';
                    urgentBanner.style.boxShadow = '0 0 18px rgba(255, 0, 60, 0.45)';
                    urgentText.innerHTML = `<strong>PERSISTENT URGENT:</strong> ${criticalOverdueTasks.length} task${criticalOverdueTasks.length > 1 ? 's' : ''} overdue &mdash; action required`;
                    if (btnDismissUrgentBanner) btnDismissUrgentBanner.style.display = 'none';
                } else {
                    urgentBanner.style.background = 'rgba(220, 38, 38, 0.2)';
                    urgentBanner.style.border = '1px solid var(--neon-red)';
                    urgentBanner.style.borderLeft = '4px solid var(--neon-red)';
                    urgentBanner.style.boxShadow = 'none';
                    urgentText.textContent = `${allUrgentTasks.length} urgent / overdue task${allUrgentTasks.length > 1 ? 's' : ''}`;
                    if (btnDismissUrgentBanner) btnDismissUrgentBanner.style.display = 'inline-block';
                }
                
                if (urgentList) {
                    urgentList.innerHTML = allUrgentTasks.map(t => {
                        const isOverdue = t.due && !isNaN(new Date(t.due).getTime()) && new Date(t.due) < now;
                        const isCritical = Boolean(t.isUrgent) && isOverdue;
                        let dueStr = '';
                        if (t.due) {
                            const d = new Date(t.due);
                            dueStr = t.due.includes('T') && !t.due.endsWith('T00:00:00.000Z')
                                ? d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
                                : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
                        }
                        return `
                            <div class="urgent-task-item" style="display: flex; justify-content: space-between; align-items: center; background: ${isCritical ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'}; padding: 8px 12px; border-radius: 6px; border: ${isCritical ? '2px solid var(--neon-red)' : '1px solid rgba(255,0,60,0.3)'}; gap: 10px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;">
                                    <span style="color: var(--neon-red); font-size: 1.1rem; line-height: 1;">${isCritical ? '🚨' : '&#x25cf;'}</span>
                                    <div>
                                        <span class="urgent-task-title" data-id="${t.id}" style="color: var(--text-primary); font-weight: ${isCritical ? '700' : '500'}; cursor: pointer; text-decoration: underline;" title="Click to view task">${escapeHtml(t.title)}</span>
                                        <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                                            ${isCritical ? '<span class="badge" style="background: var(--neon-red); color: #fff; font-size: 0.68rem; font-weight: 800; padding: 1px 6px;">OVERDUE URGENT</span>' : (isOverdue ? '<span class="badge" style="background: rgba(255,170,0,0.25); border: 1px solid var(--neon-orange, #ffaa00); color: var(--neon-orange, #ffaa00); font-size: 0.7rem; padding: 1px 5px;">Overdue</span>' : '<span class="badge" style="background: rgba(255,0,60,0.2); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 0.7rem; padding: 1px 5px;">Urgent</span>')}
                                            ${dueStr ? `<small style="color: ${isOverdue ? 'var(--neon-red)' : 'var(--text-muted)'}; font-size: 0.75rem; font-weight: ${isOverdue ? '600' : 'normal'};">Due: ${dueStr}</small>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                    <button class="btn btn-neon-green btn-sm btn-done-urgent" data-id="${t.id}" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 600;">✓ Done</button>
                                    <button class="btn btn-neon-blue btn-sm btn-delay-urgent" data-id="${t.id}" style="padding: 4px 10px; font-size: 0.78rem;">🕒 Delay</button>
                                    <button class="btn btn-outline btn-sm btn-dismiss-urgent" data-id="${t.id}" style="padding: 4px 10px; font-size: 0.78rem; border-color: rgba(255,0,60,0.5); color: var(--neon-red);" title="Dismiss task">✕ Dismiss</button>
                                </div>
                            </div>
                        `;
                    }).join('');

                    urgentList.querySelectorAll('.urgent-task-title').forEach(el => {
                        el.addEventListener('click', () => {
                            const taskId = el.getAttribute('data-id');
                            const found = (cachedTasks || []).find(x => x.id === taskId);
                            if (found) openTaskView(found);
                        });
                    });

                    urgentList.querySelectorAll('.btn-done-urgent').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const taskId = btn.getAttribute('data-id');
                            btn.disabled = true;
                            btn.innerText = 'Completing...';
                            try {
                                const res = await fetch(`${API_TASKS}/${encodeURIComponent(taskId)}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'completed' })
                                });
                                if (res.ok) {
                                    showToast('Urgent task marked complete!', 'info');
                                    await loadTasks();
                                } else {
                                    showToast('Failed to complete task');
                                    btn.disabled = false;
                                    btn.innerText = '✓ Done';
                                }
                            } catch (err) {
                                console.error(err);
                                showToast('Network error completing task');
                                btn.disabled = false;
                                btn.innerText = '✓ Done';
                            }
                        });
                    });

                    urgentList.querySelectorAll('.btn-delay-urgent').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const taskId = btn.getAttribute('data-id');
                            const found = (cachedTasks || []).find(x => x.id === taskId);
                            if (!found) return;

                            itemToPostpone = taskId;
                            activePostponeItemTitle = found.title;
                            activePostponeItemType = 'task';

                            if (postponeItemSummary) {
                                postponeItemSummary.textContent = `Delay Urgent Task: "${found.title}"`;
                            }

                            const tmr = new Date();
                            tmr.setHours(tmr.getHours() + 2);
                            const tzOffset = tmr.getTimezoneOffset() * 60000;
                            const localIso = new Date(tmr - tzOffset).toISOString().slice(0, 16);
                            if (postponeDateInput) postponeDateInput.value = localIso;

                            document.querySelectorAll('.btn-quick-postpone').forEach(b => b.classList.remove('selected'));
                            const preset2h = document.querySelector('.btn-quick-postpone[data-hours="2"]');
                            if (preset2h) preset2h.classList.add('selected');

                            if (postponeModal) postponeModal.classList.remove('hidden');
                        });
                    });

                    urgentList.querySelectorAll('.btn-dismiss-urgent').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const taskId = btn.getAttribute('data-id');
                            const found = (cachedTasks || []).find(x => x.id === taskId);
                            if (!found) return;

                            itemToDismiss = taskId;
                            cardToDismiss = null;
                            activeDismissItemTitle = found.title;
                            activeDismissItemType = 'task';

                            if (dismissConfirmItemTitle) {
                                dismissConfirmItemTitle.textContent = `Are you sure you want to dismiss the urgent task: "${found.title}"?`;
                            }
                            if (dismissConfirmModal) {
                                dismissConfirmModal.classList.remove('hidden');
                            } else {
                                if (confirm(`Dismiss urgent task "${found.title}"?`)) {
                                    fetch(`${API_TASKS}/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
                                        .then(() => {
                                            showToast('Task dismissed', 'info');
                                            loadTasks();
                                        }).catch(console.error);
                                }
                            }
                        });
                    });
                }
            } else {
                urgentBanner.classList.add('hidden');
                if (urgentList) urgentList.innerHTML = '';
            }
        }
        if (tasksActiveCountBadge) tasksActiveCountBadge.textContent = `${pendingCount} Pending`;
        if (tasksCompletedCountBadge) {
            tasksCompletedCountBadge.textContent = `${doneCount} Done`;
            tasksCompletedCountBadge.style.display = doneCount > 0 ? 'inline-block' : 'none';
        }
    }

    function renderTasksCalendar(tasks) {
        const tasksCalendarEl = document.getElementById('tasksCalendar');
        if (!tasksCalendarEl || typeof FullCalendar === 'undefined') return;

        if (!tasksCalendar) {
            const tasksCalendarConfig = {
                initialView: 'dayGridMonth',
                weekends: true,
                firstDay: 1,
                dayHeaders: true,
                nowIndicator: true,
                selectable: true,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listWeek'
                },
                buttonText: {
                    today: 'Today',
                    dayGridMonth: 'Month',
                    listWeek: 'Week'
                },
                eventTimeFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                },
                views: {
                    dayGridMonth: {
                        dayHeaderFormat: { weekday: 'short' },
                        dayMaxEvents: 2
                    },
                    listWeek: {
                        dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
                        noEventsContent: 'No tasks scheduled this week'
                    }
                },
                height: 'auto',
                dateClick: function(info) {
                    let datePart = info.dateStr;
                    let timePart = '09:00';
                    if (info.dateStr.includes('T')) {
                        const parts = info.dateStr.split('T');
                        datePart = parts[0];
                        timePart = parts[1].substring(0, 5);
                    }
                    openTaskEdit({ rawDate: datePart, startTime: timePart });
                },
                eventClick: function(info) {
                    if (info.event.extendedProps.task) {
                        openTaskView(info.event.extendedProps.task);
                    }
                }
            };

            tasksCalendar = new FullCalendar.Calendar(tasksCalendarEl, tasksCalendarConfig);
            tasksCalendar.render();
        }

        const events = [];
        (tasks || []).forEach(t => {
            const isDone = t.status === 'completed';
            const isOverdue = !isDone && t.due && !isNaN(new Date(t.due).getTime()) && new Date(t.due) < new Date();
            const isUrgent = Boolean(t.isUrgent) || isOverdue;

            let start = t.due ? t.due.slice(0, 19) : (t.created_at ? t.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
            const hasTime = t.due && t.due.includes('T') && !t.due.endsWith('T00:00:00.000Z');

            let bg = isDone ? 'rgba(0, 255, 102, 0.15)' : 'rgba(0, 240, 255, 0.15)';
            let border = isDone ? 'var(--neon-green)' : 'var(--neon-blue)';
            let text = isDone ? 'rgba(255, 255, 255, 0.6)' : '#ffffff';

            if (isUrgent && !isDone) {
                bg = 'rgba(255, 0, 60, 0.25)';
                border = 'var(--neon-red)';
                text = '#ff6b8b';
            }

            events.push({
                id: t.id,
                title: `${isDone ? '✓ ' : (isOverdue ? '⚠️ ' : (t.isUrgent ? '❗ ' : '○ '))}${t.title}`,
                start: start,
                allDay: !hasTime,
                backgroundColor: bg,
                borderColor: border,
                textColor: text,
                className: isUrgent && !isDone ? 'task-event-urgent' : '',
                extendedProps: { task: t, isUrgent, isOverdue }
            });
        });

        tasksCalendar.getEvents().forEach(e => e.remove());
        tasksCalendar.addEventSource(events);
    }

    function openTaskView(task) {
        activeTask = task;
        if (!taskViewModal) return;

        if (viewTaskTitle) viewTaskTitle.innerText = task.title || 'Task Details';
        const isDone = task.status === 'completed';
        if (viewTaskBadge) {
            viewTaskBadge.innerText = isDone ? 'Completed' : 'Pending';
            viewTaskBadge.className = isDone ? 'badge neon-green' : 'badge neon-blue';
        }
        
        const viewTaskUrgentBadge = document.getElementById('viewTaskUrgentBadge');
        const btnToggleTaskUrgent = document.getElementById('btnToggleTaskUrgent');
        const isOverdue = !isDone && task.due && !isNaN(new Date(task.due).getTime()) && new Date(task.due) < new Date();

        if (viewTaskUrgentBadge) {
            if (task.isUrgent || isOverdue) {
                viewTaskUrgentBadge.classList.remove('hidden');
                viewTaskUrgentBadge.innerText = isOverdue ? 'Overdue' : 'Urgent';
            } else {
                viewTaskUrgentBadge.classList.add('hidden');
            }
        }

        if (btnToggleTaskUrgent) {
            btnToggleTaskUrgent.innerText = task.isUrgent ? 'Unmark Urgent' : '! Mark Urgent';
            btnToggleTaskUrgent.style.borderColor = task.isUrgent ? 'var(--text-muted)' : 'var(--neon-red)';
            btnToggleTaskUrgent.style.color = task.isUrgent ? 'var(--text-secondary)' : 'var(--neon-red)';
        }

        if (viewTaskSourceBadge) {
            viewTaskSourceBadge.innerText = task.google_task_id ? 'Google Tasks Synced' : 'Local Task';
        }

        let dueDisplay = 'No due date';
        if (task.due) {
            const d = new Date(task.due);
            if (!isNaN(d.getTime())) {
                const dateStr = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = task.due.includes('T') && !task.due.endsWith('T00:00:00.000Z')
                    ? ' • ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
                    : '';
                dueDisplay = `${dateStr}${timeStr}${isOverdue ? ' (Overdue)' : ''}`;
            }
        }
        if (viewTaskDue) viewTaskDue.innerText = dueDisplay;

        if (viewTaskNotes) {
            viewTaskNotes.innerText = task.notes || 'No additional notes provided.';
        }

        if (btnToggleTaskComplete) {
            btnToggleTaskComplete.innerText = isDone ? 'Mark Incomplete' : '✓ Mark Complete';
        }

        taskViewModal.classList.remove('hidden');
    }

    function openTaskEdit(taskOrPrefill) {
        if (!taskEditModal) return;

        const isEditing = Boolean(taskOrPrefill && taskOrPrefill.id);
        const todayStr = new Date().toISOString().split('T')[0];

        if (taskId) taskId.value = isEditing ? taskOrPrefill.id : '';
        if (taskInputTitle) taskInputTitle.value = isEditing ? taskOrPrefill.title : '';
        if (taskInputUrgent) taskInputUrgent.checked = isEditing ? Boolean(taskOrPrefill.isUrgent) : false;
        
        let dateVal = '';
        let timeVal = '09:00';
        if (isEditing && taskOrPrefill.due) {
            const d = new Date(taskOrPrefill.due);
            if (!isNaN(d.getTime())) {
                dateVal = d.toISOString().split('T')[0];
                if (taskOrPrefill.due.includes('T') && !taskOrPrefill.due.endsWith('T00:00:00.000Z')) {
                    timeVal = d.toISOString().split('T')[1].substring(0, 5);
                }
            }
        } else if (taskOrPrefill && taskOrPrefill.rawDate) {
            dateVal = taskOrPrefill.rawDate;
            timeVal = taskOrPrefill.startTime || '09:00';
        } else {
            dateVal = todayStr;
        }

        if (taskInputDate) taskInputDate.value = dateVal;
        if (taskInputTime) taskInputTime.value = timeVal;
        if (taskInputStatus) taskInputStatus.value = isEditing ? (taskOrPrefill.status || 'needsAction') : 'needsAction';
        if (taskInputNotes) taskInputNotes.value = isEditing ? (taskOrPrefill.notes || '') : '';

        if (editTaskModalTitle) {
            editTaskModalTitle.innerText = isEditing ? 'Edit Task' : 'Add Task';
        }

        if (taskViewModal) taskViewModal.classList.add('hidden');
        taskEditModal.classList.remove('hidden');
    }

    if (btnCloseTaskView) btnCloseTaskView.addEventListener('click', () => taskViewModal && taskViewModal.classList.add('hidden'));
    if (btnDoneTaskView) btnDoneTaskView.addEventListener('click', () => taskViewModal && taskViewModal.classList.add('hidden'));

    if (btnCloseTaskEdit) btnCloseTaskEdit.addEventListener('click', () => taskEditModal && taskEditModal.classList.add('hidden'));
    if (btnCancelTaskEdit) btnCancelTaskEdit.addEventListener('click', () => taskEditModal && taskEditModal.classList.add('hidden'));

    if (btnAddTask) {
        btnAddTask.addEventListener('click', () => openTaskEdit(null));
    }

    if (btnEditTask) {
        btnEditTask.addEventListener('click', () => {
            if (activeTask) openTaskEdit(activeTask);
        });
    }

    if (btnToggleTaskComplete) {
        btnToggleTaskComplete.addEventListener('click', async () => {
            if (!activeTask) return;
            const newStatus = activeTask.status === 'completed' ? 'needsAction' : 'completed';
            try {
                const res = await fetch(`${API_TASKS}/${encodeURIComponent(activeTask.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    const updated = await res.json();
                    activeTask = updated.task || updated;
                    showToast(newStatus === 'completed' ? 'Task marked complete!' : 'Task marked pending!', 'info');
                    openTaskView(activeTask);
                    urgentBannerDismissed = false;
                    await loadTasks();
                } else {
                    showToast('Failed to update task status');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error updating task status');
            }
        });
    }

    const btnToggleTaskUrgent = document.getElementById('btnToggleTaskUrgent');
    if (btnToggleTaskUrgent) {
        btnToggleTaskUrgent.addEventListener('click', async () => {
            if (!activeTask) return;
            const newUrgent = !activeTask.isUrgent;
            btnToggleTaskUrgent.disabled = true;
            try {
                const res = await fetch(`${API_TASKS}/${encodeURIComponent(activeTask.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isUrgent: newUrgent })
                });
                if (res.ok) {
                    const updated = await res.json();
                    activeTask = updated.task || { ...activeTask, isUrgent: newUrgent };
                    showToast(newUrgent ? 'Task marked as Urgent!' : 'Task unmarked as urgent', 'info');
                    openTaskView(activeTask);
                    urgentBannerDismissed = false;
                    await loadTasks();
                } else {
                    showToast('Failed to update urgent status');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error updating task');
            } finally {
                btnToggleTaskUrgent.disabled = false;
            }
        });
    }

    if (btnDeleteTask) {
        btnDeleteTask.addEventListener('click', async () => {
            if (!activeTask) return;
            const confirmDelete = confirm(`Are you sure you want to delete the task: "${activeTask.title}"?`);
            if (!confirmDelete) return;

            try {
                const res = await fetch(`${API_TASKS}/${encodeURIComponent(activeTask.id)}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    showToast('Task deleted successfully', 'info');
                    if (taskViewModal) taskViewModal.classList.add('hidden');
                    activeTask = null;
                    await loadTasks();
                } else {
                    showToast('Failed to delete task');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error deleting task');
            }
        });
    }

    if (btnSyncTasks) {
        btnSyncTasks.addEventListener('click', async () => {
            btnSyncTasks.disabled = true;
            btnSyncTasks.innerHTML = '🔄 Syncing...';
            try {
                const res = await fetch(API_TASKS_SYNC, { method: 'POST' });
                const result = await res.json();
                if (res.ok && result.success) {
                    showToast(`Synced with Google Tasks (${result.pulled} pulled, ${result.pushed} pushed)`, 'info');
                    await loadTasks();
                } else {
                    showToast(result.error || 'Sync with Google Tasks failed');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error syncing tasks');
            } finally {
                btnSyncTasks.disabled = false;
                btnSyncTasks.innerHTML = '🔄 Sync Tasks';
            }
        });
    }

    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = taskId ? taskId.value.trim() : '';
            const title = taskInputTitle ? taskInputTitle.value.trim() : '';
            const date = taskInputDate ? taskInputDate.value : '';
            const time = taskInputTime ? taskInputTime.value : '';
            const status = taskInputStatus ? taskInputStatus.value : 'needsAction';
            const isUrgent = taskInputUrgent ? taskInputUrgent.checked : false;
            const notes = taskInputNotes ? taskInputNotes.value.trim() : '';

            if (!title) {
                showToast('Please enter a task title');
                return;
            }

            let dueIso = null;
            if (date) {
                if (time) {
                    dueIso = `${date}T${time}:00+10:00`;
                } else {
                    dueIso = `${date}T09:00:00+10:00`;
                }
            }

            const payload = {
                title,
                notes: notes || undefined,
                due: dueIso || undefined,
                status,
                isUrgent
            };

            try {
                const url = id ? `${API_TASKS}/${encodeURIComponent(id)}` : API_TASKS;
                const method = id ? 'PATCH' : 'POST';
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast(id ? 'Task updated!' : 'Task created!', 'info');
                    if (taskEditModal) taskEditModal.classList.add('hidden');
                    await loadTasks();
                } else {
                    const errData = await res.json().catch(() => ({}));
                    showToast(errData.error || 'Failed to save task');
                }
            } catch (err) {
                console.error(err);
                showToast('Network error saving task');
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
                
                const badgeEl = document.getElementById(`${enc.id}ProgressBadge`);
                const titleEl = document.getElementById(`${enc.id}CurrentTitle`);
                if (badgeEl) badgeEl.innerText = badgeText;
                if (titleEl) titleEl.innerText = titleText;
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

        // Simplified Summary State
        const simplifyKey = `${activeEncyclopediaId}:${currentChapterData.id}`;
        if (simplifyMemoryCache.has(simplifyKey)) {
            if (learnSimplifyPanel) learnSimplifyPanel.classList.remove('hidden');
            renderSimplifyView(simplifyMemoryCache.get(simplifyKey));
        } else {
            if (learnSimplifyPanel) learnSimplifyPanel.classList.add('hidden');
            if (learnSimplifyContent) learnSimplifyContent.innerHTML = '';
            if (btnSimplifyLearn) {
                btnSimplifyLearn.disabled = false;
                btnSimplifyLearn.innerText = "Summarise for Dummies";
            }
        }
    }

    function renderSimplifyView(data) {
        if (!learnSimplifyContent) return;
        if (!data || !Array.isArray(data.bullets) || data.bullets.length === 0) {
            learnSimplifyContent.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No summary points available.</div>';
            return;
        }
        const bulletsHtml = data.bullets.map(b => `<li style="margin-bottom: 6px;">${escapeHtml(b)}</li>`).join('');
        const noteHtml = data.note ? `<div style="margin-top: 10px; padding: 8px 12px; background: rgba(0, 229, 255, 0.08); border-left: 3px solid var(--neon-blue); border-radius: 4px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;"><strong>Clinical Note:</strong> ${escapeHtml(data.note)}</div>` : '';
        learnSimplifyContent.innerHTML = `
            <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                ${bulletsHtml}
            </ul>
            ${noteHtml}
        `;
    }

    async function handleSimplifyChapter() {
        if (!activeEncyclopediaId || !currentChapterData) return;
        const cacheKey = `${activeEncyclopediaId}:${currentChapterData.id}`;

        if (learnSimplifyPanel) learnSimplifyPanel.classList.remove('hidden');

        if (simplifyMemoryCache.has(cacheKey)) {
            renderSimplifyView(simplifyMemoryCache.get(cacheKey));
            return;
        }

        if (btnSimplifyLearn) {
            btnSimplifyLearn.disabled = true;
            btnSimplifyLearn.innerText = "Summarising...";
        }
        if (learnSimplifyContent) {
            learnSimplifyContent.innerHTML = '<div style="padding: 10px 0; color: var(--neon-blue); font-size: 0.85rem;">Simplifying chapter for complete beginners with Gemini...</div>';
        }

        try {
            const res = await fetch('/api/v1/learn/simplify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encyclopediaId: activeEncyclopediaId,
                    chapterId: currentChapterData.id
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server returned ${res.status}`);
            }

            const data = await res.json();
            simplifyMemoryCache.set(cacheKey, data);
            renderSimplifyView(data);
        } catch (err) {
            if (learnSimplifyContent) {
                learnSimplifyContent.innerHTML = `
                    <div style="padding: 10px 14px; background: rgba(255, 68, 68, 0.08); border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 6px;">
                        <p style="margin: 0 0 8px 0; color: #ff6b6b; font-size: 0.85rem;">Failed to simplify: ${escapeHtml(err.message || 'Unknown error')}</p>
                        <button id="btnRetrySimplify" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 3px 10px;">Retry</button>
                    </div>
                `;
                const retryBtn = document.getElementById('btnRetrySimplify');
                if (retryBtn) {
                    retryBtn.addEventListener('click', handleSimplifyChapter);
                }
            }
        } finally {
            if (btnSimplifyLearn) {
                btnSimplifyLearn.disabled = false;
                btnSimplifyLearn.innerText = "Summarise for Dummies";
            }
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

    if (btnSimplifyLearn) {
        btnSimplifyLearn.addEventListener('click', handleSimplifyChapter);
    }

    if (btnToggleSimplifyPanel) {
        btnToggleSimplifyPanel.addEventListener('click', () => {
            if (learnSimplifyPanel) learnSimplifyPanel.classList.add('hidden');
        });
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

    let pendingChatAction = null;
    let cachedChatHistory = [];

    function renderPendingActionButtons(preview, actionId, targetContainer) {
        if (!preview) return;
        pendingChatAction = preview;
        if (actionId) {
            pendingChatAction.id = actionId;
        }

        const actionsRow = document.createElement('div');
        actionsRow.className = 'pending-action-buttons-row';
        actionsRow.style.cssText = 'margin-top: 10px; display: flex; flex-direction: column; gap: 8px;';
        
        // Check if multi_action or receipt split
        const isMulti = preview.type === 'multi_action' && Array.isArray(preview.data?.actions);
        const subActions = isMulti ? preview.data.actions : [preview];

        // Render Itemized breakdown if multiple actions
        if (isMulti && subActions.length > 0) {
            const card = document.createElement('div');
            card.className = 'pending-actions-card';
            card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; font-size: 0.85rem;';
            card.innerHTML = `<strong style="display:block; margin-bottom: 6px; color: var(--accent-cyan, #00e5ff);">Itemized Action Plan (${subActions.length} items):</strong>` +
                subActions.map((a) => {
                    let desc = a.type;
                    if (a.type === 'budget_item') desc = `Expense: ${a.data?.description || 'Item'} ($${a.data?.amount}) • ${a.data?.category || 'General'}`;
                    else if (a.type === 'medical_receipt') desc = `Medical Receipt: ${a.data?.provider || 'Provider'} ($${a.data?.amount}) • ${a.data?.service || 'Consult'}`;
                    else if (a.type === 'rehab_relief') desc = `Rehab Relief: ${a.data?.routineTitle || 'Routine'} (${a.data?.prePainScore} → ${a.data?.postPainScore})`;
                    else if (a.type === 'pain_log') desc = `Pain Log: Score ${a.data?.score}/10`;
                    else if (a.type === 'task') desc = `Agenda Task: ${a.data?.title || 'Task'}`;
                    else if (a.type === 'calendar_event') desc = `Calendar Event: ${a.data?.summary || 'Event'}`;
                    else if (a.type === 'note') desc = `Note: ${a.data?.content || ''}`;
                    else if (a.type === 'bill_subscription') desc = `Bill: ${a.data?.title} ($${a.data?.amount}) Due: ${a.data?.next_due_date}`;
                    return `<div style="padding: 2px 0; border-bottom: 1px dashed rgba(255,255,255,0.05);">• ${desc}</div>`;
                }).join('');
            actionsRow.appendChild(card);
        }

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; align-items: center;';

        const isReceiptSplit = isMulti && subActions.every(a => a.type === 'budget_item');

        if (isReceiptSplit) {
            // Option 1: Confirm Itemized Splits
            const btnConfirmSplits = document.createElement('button');
            btnConfirmSplits.className = 'btn btn-neon-green btn-sm';
            btnConfirmSplits.innerText = `Confirm Itemized Splits (${subActions.length})`;
            btnConfirmSplits.onclick = () => {
                actionsRow.remove();
                sendRumbleChatMessage('Confirm', preview);
            };
            buttonsContainer.appendChild(btnConfirmSplits);

            // Option 2: Merge into Single Total
            const totalSum = subActions.reduce((sum, a) => sum + (Number(a.data?.amount) || 0), 0);
            const btnMerge = document.createElement('button');
            btnMerge.className = 'btn btn-outline btn-sm';
            btnMerge.innerText = `Merge as Single Total ($${totalSum.toFixed(2)})`;
            btnMerge.onclick = () => {
                actionsRow.remove();
                const mergedPreview = {
                    type: 'budget_item',
                    data: {
                        description: 'Merged Receipt Expense',
                        amount: parseFloat(totalSum.toFixed(2)),
                        category: subActions[0]?.data?.category || 'Groceries',
                        type: 'expense'
                    }
                };
                sendRumbleChatMessage('Confirm', mergedPreview);
            };
            buttonsContainer.appendChild(btnMerge);
        } else {
            let confirmLabel = isMulti ? `Confirm All (${subActions.length} Actions)` : 'Confirm';
            const hasSendEmail = preview.type === 'send_email' || (subActions.some(a => a.type === 'send_email'));
            if (hasSendEmail) confirmLabel = 'Confirm & Send Email';
            else if (preview.type === 'pain_log') confirmLabel = 'Confirm Pain Log';

            const btnConfirm = document.createElement('button');
            btnConfirm.className = 'btn btn-neon-green btn-sm';
            btnConfirm.innerText = confirmLabel;
            btnConfirm.onclick = () => {
                actionsRow.remove();
                sendRumbleChatMessage('Confirm', preview);
            };
            buttonsContainer.appendChild(btnConfirm);
        }

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-outline btn-sm';
        btnCancel.innerText = 'Cancel';
        btnCancel.onclick = () => {
            const cancelActionId = actionId || (pendingChatAction && pendingChatAction.id);
            pendingChatAction = null;
            actionsRow.remove();
            const cancelNote = document.createElement('small');
            cancelNote.style.color = 'var(--text-muted)';
            cancelNote.innerText = 'Action cancelled.';
            if (targetContainer) {
                targetContainer.appendChild(cancelNote);
            }
            fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancel_action: true, pending_action_id: cancelActionId })
            }).catch(console.error);
        };

        buttonsContainer.appendChild(btnCancel);
        actionsRow.appendChild(buttonsContainer);

        if (targetContainer) {
            targetContainer.appendChild(actionsRow);
        } else {
            rumbleChatMessages.appendChild(actionsRow);
        }
    }

    btnOpenRumbleChat.addEventListener('click', async () => {
        rumbleChatModal.classList.remove('hidden');
        try {
            const res = await fetch('/api/v1/rumble/chat/history');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.status === 'success') {
                if (Array.isArray(data.history)) {
                    cachedChatHistory = [...data.history];
                }
                if (data.history && data.history.length > 0) {
                    rumbleChatMessages.innerHTML = '';
                    data.history.forEach(msg => {
                        const div = document.createElement('div');
                        div.className = `message ${msg.role === 'user' ? 'user-message' : 'rumble-message'}`;
                        div.innerHTML = `<strong>${msg.role === 'user' ? 'You:' : 'RUMBLE:'}</strong> ${msg.role === 'rumble' ? formatRumbleMarkdown(msg.text) : escapeHtml(msg.text)}`;
                        rumbleChatMessages.appendChild(div);
                    });
                    rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;
                }

                // Restore pending confirmation state if exists
                if (data.pending_action && data.pending_action.action_data) {
                    const existingRow = rumbleChatMessages.querySelector('.pending-action-buttons-row');
                    if (existingRow) existingRow.remove();

                    const rumbleMsgs = rumbleChatMessages.querySelectorAll('.rumble-message');
                    const lastRumbleMsg = rumbleMsgs.length > 0 ? rumbleMsgs[rumbleMsgs.length - 1] : null;
                    renderPendingActionButtons(data.pending_action.action_data, data.pending_action.id, lastRumbleMsg || rumbleChatMessages);
                }
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
            const notice = document.createElement('div');
            notice.className = 'message rumble-message';
            notice.style.opacity = '0.7';
            notice.style.fontStyle = 'italic';
            notice.innerHTML = `<em>Previous messages unavailable</em>`;
            rumbleChatMessages.appendChild(notice);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;
        }
    });

    btnCloseRumbleChat.addEventListener('click', () => {
        rumbleChatModal.classList.add('hidden');
    });

    if (btnExportChat) {
        btnExportChat.addEventListener('click', () => {
            const msgs = Array.from(rumbleChatMessages.querySelectorAll('.message')).map(m => {
                const isUser = m.classList.contains('user-message');
                return { role: isUser ? 'user' : 'rumble', text: m.innerText };
            });
            navigator.clipboard.writeText(JSON.stringify(msgs, null, 2)).then(() => {
                showToast('Chat exported to clipboard', 'success');
            }).catch(e => {
                showToast('Failed to export chat', 'error');
                console.error(e);
            });
        });
    }


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
            if (!cachedChatHistory || cachedChatHistory.length === 0) {
                try {
                    const hRes = await fetch('/api/v1/rumble/chat/history');
                    if (hRes.ok) {
                        const hData = await hRes.json();
                        if (hData.status === 'success' && Array.isArray(hData.history)) {
                            cachedChatHistory = [...hData.history];
                        }
                    }
                } catch (hErr) {
                    console.warn("Could not pre-fetch chat history", hErr);
                }
            }

            const msgsNodes = Array.from(rumbleChatMessages.querySelectorAll('.message'));
            const previousMsgs = msgsNodes.slice(0, -1); // Exclude the user message just appended
            const domHistory = previousMsgs.map(m => {
                const isUser = m.classList.contains('user-message');
                let text = m.innerText || '';
                if (isUser && text.startsWith('You:')) text = text.substring(4).trim();
                else if (!isUser && text.startsWith('RUMBLE:')) text = text.substring(7).trim();
                text = text.replace(/Confirm.*|Cancel.*|Action cancelled\..*/g, '').trim();
                return { role: isUser ? 'user' : 'rumble', text };
            }).filter(m => m.text && !m.text.includes('Previous messages unavailable'));

            // Merge DB history with any new DOM messages not yet persisted
            const mergedHistory = [...cachedChatHistory];
            for (const dm of domHistory) {
                const exists = mergedHistory.some(h => h.role === dm.role && h.text === dm.text);
                if (!exists) {
                    mergedHistory.push(dm);
                }
            }

            const history = mergedHistory.slice(-20); // Keep last 20 messages for context

            const payload = {
                message: msg || 'Please analyze this attached photo/document and extract relevant appointments, instructions, or notes.',
                proposal_context: currentProposalText,
                history: history,
                ...(attached ? { attachment: attached } : {}),
                ...(actionToCommit ? { confirm_action: actionToCommit, pending_action_id: actionToCommit.id } : {})
            };

            const response = await fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            // Update cached history on message send/receive
            if (msg) {
                cachedChatHistory.push({ role: 'user', text: msg });
            }
            if (data.reply) {
                cachedChatHistory.push({ role: 'rumble', text: data.reply });
            }
            
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> ${formatRumbleMarkdown(data.reply)}`;

            if (data.requires_confirmation && data.preview) {
                renderPendingActionButtons(data.preview, data.pending_action_id, rumbleDiv);
            } else if (actionToCommit && data.status === 'success') {
                pendingChatAction = null;
            }

            rumbleChatMessages.appendChild(rumbleDiv);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

            const activeIntents = Array.isArray(data.intents) ? data.intents : (data.intent ? [data.intent] : []);
            for (const it of activeIntents) {
                if (it === 'ADD_NOTE' && actionToCommit) {
                    if (typeof loadNotes === 'function') loadNotes();
                    showToast('Note saved to notebook', 'success');
                } else if (it === 'LOG_PAIN' && actionToCommit) {
                    if (typeof loadPainAnalytics === 'function') loadPainAnalytics();
                    showToast('Pain log recorded', 'success');
                } else if (it === 'ADD_TASK' && actionToCommit) {
                    if (typeof loadAgenda === 'function') loadAgenda();
                    showToast('Task added to agenda', 'success');
                } else if (it === 'ADD_EXPENSE') {
                    if (typeof loadBudget === 'function') loadBudget();
                    showToast('Expense added to budget', 'success');
                } else if (it === 'SEND_EMAIL' && actionToCommit) {
                    if (data.status === 'success') {
                        showToast('Email sent via Gmail', 'success');
                    } else {
                        showToast('Email could not be sent', 'error');
                    }
                }
            }

            if (actionToCommit) {
                if (typeof loadAgenda === 'function') loadAgenda();
                if (typeof loadNotes === 'function') loadNotes();
                if (typeof loadBudget === 'function') loadBudget();
                if (typeof loadPainAnalytics === 'function') loadPainAnalytics();
            }
        } catch (err) {
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> Communication error. Unable to reach backend.`;
            const btnRetry = document.createElement('button');
            btnRetry.className = 'btn btn-outline btn-sm';
            btnRetry.innerText = 'Retry';
            btnRetry.style.marginTop = '6px';
            btnRetry.onclick = () => { rumbleDiv.remove(); sendRumbleChatMessage(msg); };
            rumbleDiv.appendChild(btnRetry);
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

        // Tab navigation within the briefing modal
        if (briefingContent) {
            briefingContent.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.briefing-nav-tab');
                if (!tabBtn) return;
                const targetId = tabBtn.getAttribute('data-tab');
                if (!targetId) return;

                const container = tabBtn.closest('.briefing-container') || briefingContent;
                container.querySelectorAll('.briefing-nav-tab').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                container.querySelectorAll('.briefing-tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });

                tabBtn.classList.add('active');
                tabBtn.setAttribute('aria-selected', 'true');
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add('active');
            });
        }

        const btnBriefingOpenChat = document.getElementById('btnBriefingOpenChat');
        if (btnBriefingOpenChat) {
            btnBriefingOpenChat.addEventListener('click', () => {
                briefingModal.classList.add('hidden');
                const rumbleChatModal = document.getElementById('rumbleChatModal');
                if (rumbleChatModal) {
                    rumbleChatModal.classList.remove('hidden');
                }
            });
        }
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
    const NOTES_PIN = '1446';
    let isNotesUnlocked = false;

    if (btnOpenNotes) {
        btnOpenNotes.addEventListener('click', () => {
            if (isNotesUnlocked) {
                notesModal.classList.remove('hidden');
                return;
            }
            const entered = window.prompt('Doctor Presentation Mode Active\nEnter 4-digit PIN to access Notes:');
            if (entered === NOTES_PIN) {
                isNotesUnlocked = true;
                notesModal.classList.remove('hidden');
                showToast('Notes unlocked', 'success');
            } else if (entered !== null) {
                showToast('Access Denied: Incorrect PIN', 'error');
            }
        });
    }

    if (btnCloseNotes) {
        btnCloseNotes.addEventListener('click', () => {
            isNotesUnlocked = false;
        });
    }

    let activePainLogScheduledTime = null;
    let activePainLogAgendaId = null;

    function computeRandomOffsetTimestamp(scheduledTimeStr) {
        if (!scheduledTimeStr) return null;
        let baseDate = null;
        const parsed = new Date(scheduledTimeStr);
        if (!isNaN(parsed.getTime())) {
            baseDate = parsed;
        } else {
            const match = scheduledTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (match) {
                let h = parseInt(match[1]);
                const m = parseInt(match[2]);
                const ampm = match[3] ? match[3].toUpperCase() : null;
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                baseDate = new Date();
                baseDate.setHours(h, m, 0, 0);
            }
        }
        if (!baseDate || isNaN(baseDate.getTime())) return null;

        // Random offset between -10 minutes and +10 minutes (-600 to +600 seconds)
        const offsetSeconds = Math.floor(Math.random() * 1201) - 600;
        return new Date(baseDate.getTime() + offsetSeconds * 1000).toISOString();
    }

    function closePainLog() {
        activePainLogScheduledTime = null;
        activePainLogAgendaId = null;
        painLogModal.classList.add('hidden');
    }
    if (btnOpenPainLog) btnOpenPainLog.addEventListener('click', () => {
        activePainLogScheduledTime = null;
        activePainLogAgendaId = null;
        renderPainModal();
        if (typeof recalculateMood === 'function') recalculateMood();
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
                            <label style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span>Pain Score</span>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <input type="number" class="pain-score-input-cell" data-area="${slot.area}" min="0" max="10" step="0.1" inputmode="decimal" value="${slot.score}" style="width: 52px; padding: 2px 4px; text-align: right; font-weight: bold; color: var(--neon-red); background: rgba(0,0,0,0.5); border: 1px solid rgba(255, 75, 75, 0.4); border-radius: 4px; font-size: 0.85rem;" title="Click to enter exact decimal score (e.g. 5.7, 8.3)">
                                    <span style="font-size: 0.75rem; color: var(--text-secondary);">/10</span>
                                </div>
                            </label>
                            <input type="range" class="glass-input pain-slot-slider" data-area="${slot.area}" min="0" max="10" step="0.1" value="${slot.score}" style="width: 100%; height: 6px; padding: 0;">
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
                    const parsed = parseFloat(e.target.value);
                    slot.score = isNaN(parsed) ? 5.0 : Number(parsed.toFixed(1));
                    const numInput = slider.closest('.pain-slot-controls')?.querySelector(`.pain-score-input-cell[data-area="${area}"]`);
                    if (numInput && document.activeElement !== numInput) {
                        numInput.value = slot.score;
                    }
                }
            });
        });

        dynamicPainCardsContainer.querySelectorAll('.pain-score-input-cell').forEach(numInput => {
            const handleScoreInput = (e) => {
                const area = numInput.getAttribute('data-area');
                const slot = selectedPainAreas.find(s => s.area === area);
                if (slot) {
                    let parsed = parseFloat(e.target.value);
                    if (isNaN(parsed)) parsed = 0;
                    parsed = Math.max(0, Math.min(10, parsed));
                    slot.score = Number(parsed.toFixed(1));
                    const slider = numInput.closest('.pain-slot-controls')?.querySelector(`.pain-slot-slider[data-area="${area}"]`);
                    if (slider && document.activeElement !== slider) {
                        slider.value = slot.score;
                    }
                }
            };
            numInput.addEventListener('input', handleScoreInput);
            numInput.addEventListener('change', (e) => {
                handleScoreInput(e);
                numInput.value = slot?.score ?? numInput.value;
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

        // --- Pain Presets, Mood Model & Clinical Notes ---
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
    });

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

            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' }); // YYYY-MM-DD
            const todaysLogs = logs.filter(item => {
                const ts = item.created_at || item.timestamp;
                if (!ts) return false;
                const d = new Date(ts);
                return d.toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' }) === todayStr;
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
        if (archivedNotesGrid) archivedNotesGrid.innerHTML = '';
        
        const activeNotes = currentNotes.filter(n => !n.isArchived);
        const archivedNotes = currentNotes.filter(n => n.isArchived);

        if (activeNotes.length === 0 && archivedNotes.length === 0) {
            notesGrid.innerHTML = `<p style="color: var(--text-secondary); width: 100%; text-align: center; margin-top: 20px;">No notes found.</p>`;
            notesSectionTitle.style.display = 'none';
            unpinnedNotesSectionTitle.style.display = 'none';
            if (archivedNotesSectionTitle) archivedNotesSectionTitle.style.display = 'none';
            return;
        }

        const pinnedNotes = activeNotes.filter(n => n.pinned);
        const unpinnedNotes = activeNotes.filter(n => !n.pinned);

        const showSections = pinnedNotes.length > 0;
        notesSectionTitle.style.display = showSections ? 'block' : 'none';
        unpinnedNotesSectionTitle.style.display = showSections && unpinnedNotes.length > 0 ? 'block' : 'none';
        
        const renderCard = (note, container, isArchived = false) => {
            let rawContent = note.content || '';
            
            // Check for image markdown
            const imgMatch = rawContent.match(/!\[(.*?)\]\(([\s\S]*?)\)/);
            let cardImageHtml = '';
            let imgSrcForCard = '';
            let imgAltForCard = '';
            if (imgMatch) {
                imgSrcForCard = imgMatch[2].trim();
                imgAltForCard = escapeHtml(imgMatch[1] || 'Note photo');
                cardImageHtml = `
                    <div class="note-card-img-wrap" style="margin-bottom: 10px; border-radius: 6px; overflow: hidden; max-height: 200px; background: rgba(0,0,0,0.3); position: relative; cursor: zoom-in;">
                        <img src="${imgSrcForCard}" alt="${imgAltForCard}" style="width: 100%; max-height: 200px; object-fit: cover; display: block;">
                        <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; pointer-events: none;">🔍 View Photo</span>
                    </div>
                `;
                rawContent = rawContent.replace(imgMatch[0], '').trim();
            }

            // Check for attachment link/tag
            const attachMatch = rawContent.match(/\[Attachment:\s*([^\]]+)\]/);
            let cardAttachmentHtml = '';
            if (attachMatch) {
                cardAttachmentHtml = `<div style="margin-top: 6px; font-size: 0.8rem; color: var(--neon-blue); display: flex; align-items: center; gap: 4px;">📎 ${escapeHtml(attachMatch[1])}</div>`;
                rawContent = rawContent.replace(attachMatch[0], '').trim();
            }

            const lines = rawContent.split('\n');
            let title = '';
            let body = '';
            if (lines.length > 0 && lines[0].trim().startsWith('# ')) {
                title = lines[0].replace(/^#\s*/, '').trim();
                body = lines.slice(1).join('<br>').substring(0, 150);
            } else if (lines.length > 0 && lines[0].trim()) {
                title = lines[0].length > 30 ? lines[0].substring(0, 30) + '...' : lines[0];
                body = lines.slice(1).join('<br>').substring(0, 150) || lines.join('<br>').substring(0, 150);
            } else if (imgMatch) {
                title = imgMatch[1] || 'Photo Note';
            }

            const card = document.createElement('div');
            card.className = 'keep-note glass-panel';
            const cardBg = isArchived ? 'rgba(25, 25, 30, 0.5)' : 'rgba(30, 30, 30, 0.6)';
            const cardBorder = isArchived ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
            const cardOpacity = isArchived ? '0.85' : '1';
            card.style.cssText = `
                break-inside: avoid; margin-bottom: 15px; 
                background: ${cardBg}; 
                border: 1px solid ${cardBorder}; 
                padding: 16px; border-radius: 8px; 
                position: relative; cursor: pointer; 
                display: flex; flex-direction: column; 
                min-height: 120px; transition: box-shadow 0.2s, background 0.2s, border-color 0.2s;
                opacity: ${cardOpacity};
            `;
            
            card.addEventListener('mouseenter', () => {
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
                card.style.borderColor = 'rgba(255,255,255,0.4)';
                card.style.opacity = '1';
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = 'none';
                card.style.borderColor = cardBorder;
                card.style.opacity = cardOpacity;
            });

            const pinIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
            const archiveIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`;
            const reinstateIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
            const trashIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

            const actionButtonsHtml = isArchived ? `
                <button class="btn-icon btn-reinstate-note" data-id="${note.id}" style="background: none; border: 1px solid rgba(0, 229, 255, 0.4); border-radius: 4px; color: var(--neon-blue); cursor: pointer; padding: 3px 8px; font-size: 0.76rem; display: inline-flex; align-items: center; gap: 4px;" title="Reinstate note to active">
                    ${reinstateIcon} Reinstate
                </button>
                <button class="btn-icon btn-delete-note" data-id="${note.id}" style="background: none; border: none; color: rgba(255,100,100,0.75); cursor: pointer; padding: 4px;" title="Delete note permanently">
                    ${trashIcon}
                </button>
            ` : `
                <button class="btn-icon btn-archive-toggle" data-id="${note.id}" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;" title="Archive Note">
                    ${archiveIcon}
                </button>
                <button class="btn-icon btn-delete-note" data-id="${note.id}" style="background: none; border: none; color: rgba(255,100,100,0.75); cursor: pointer; padding: 4px;" title="Delete Note">
                    ${trashIcon}
                </button>
            `;

            card.innerHTML = `
                ${cardImageHtml}
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 1.1em; font-weight: 500; color: var(--text-primary);">${escapeHtml(title)}</h4>
                    ${!isArchived ? `
                    <button class="btn-icon btn-pin-toggle" data-id="${note.id}" style="background: none; border: none; color: ${note.pinned ? '#ffeb3b' : 'rgba(255,255,255,0.5)'}; cursor: pointer; padding: 4px;" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${pinIcon}
                    </button>
                    ` : ''}
                </div>
                <div style="flex-grow: 1;">
                    <p style="margin: 0; font-size: 0.95em; color: rgba(255,255,255,0.85); overflow-wrap: anywhere; line-height: 1.4;">${body}</p>
                    ${cardAttachmentHtml}
                </div>
                <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; opacity: 0.85;">
                    <div style="font-size: 0.75em; color: rgba(255,255,255,0.5);">${new Date(note.created_at).toLocaleDateString()}${isArchived ? ' (Archived)' : ''}</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${actionButtonsHtml}
                    </div>
                </div>
            `;

            const imgWrap = card.querySelector('.note-card-img-wrap');
            if (imgWrap && imgSrcForCard) {
                imgWrap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openImageLightbox(imgSrcForCard, imgAltForCard || title);
                });
            }
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                openNoteEditor(note);
            });

            const pinBtn = card.querySelector('.btn-pin-toggle');
            if (pinBtn) {
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleNotePin(note);
                });
            }

            const archiveBtn = card.querySelector('.btn-archive-toggle');
            if (archiveBtn) {
                archiveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleNoteArchive(note, true);
                });
            }

            const reinstateBtn = card.querySelector('.btn-reinstate-note');
            if (reinstateBtn) {
                reinstateBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleNoteArchive(note, false);
                });
            }

            const deleteBtn = card.querySelector('.btn-delete-note');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                });
            }

            container.appendChild(card);
        };

        pinnedNotes.forEach(note => renderCard(note, pinnedNotesGrid, false));
        unpinnedNotes.forEach(note => renderCard(note, notesGrid, false));

        if (archivedNotes.length > 0 && archivedNotesGrid) {
            if (archivedNotesSectionTitle) archivedNotesSectionTitle.style.display = 'block';
            archivedNotes.forEach(note => renderCard(note, archivedNotesGrid, true));
        } else if (archivedNotesSectionTitle) {
            archivedNotesSectionTitle.style.display = 'none';
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
                } else if (followUpTextarea && document.activeElement !== followUpTextarea && !followUpTextarea.value) {
                    followUpTextarea.value = [
                        "- [URGENT - Legal] Email Court Coordinator regarding appearing via video conference (Webex/AVL) due to spinal mobility restrictions",
                        "- [URGENT - Security] Enable Row-Level Security (RLS) on public table in Supabase project 'ladies-night' (cicibqblyiuibiqeaqoa) and review Oct 30 public schema GRANT changes",
                        "- [Medical] Follow up Dr. Nathan Anderson / Brett Toddhunter (20 Oct consult): Psychiatrist referral (S8 dexamphetamine), 3T Lumbar MRI, and Spinal Cord Stimulator (SCS) escalation",
                        "- [Medical / Billing] Pay Alpine Chiropractic Invoice #0033571 (emailed by Rosanna 21 Oct 2026)",
                        "- [Medical] Confirm Dr Khan received MRI imaging report from I-MED",
                        "- [Legal] Follow up Maryse Andrinopoulos-Tsigolis (Shine Lawyers - (03) 9616 4234) regarding Medical Negligence Claim scope & review VLA ATLAS grant outcome letter (14 Oct)",
                        "- [Legal] Upload Chemist Warehouse outreach statement to Solicitor folder",
                        "- [University] Check Deakin MFA unlock status with Student Central & verify S306 Computer Science minor selection in StudentConnect before T1 2027 changes",
                        "- [Finance / Admin] Redeem $200.00 Coles eGift Card (Blackhawk / Afterpay email 21 Oct) & check ING Fire Extinguisher 10 balance after declined $200 transfer to Splurge 10",
                        "- [Orders / Tickets] Reply to Reggie at Stickeroo with exact sticker dimensions to finalize custom vinyl sheet quote",
                        "- [Orders / Tickets] Reply to AXS Customer Support (Ticket #13237399 / Request #12767724) before auto-close & verify Foo Fighters Order #1000748351 in zinta_cook@live.com.au"
                    ].join('\n');
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

    async function toggleNoteArchive(note, forceState) {
        const targetArchived = forceState !== undefined ? forceState : !note.isArchived;
        try {
            const res = await fetch(`${API_NOTES}/${note.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: targetArchived })
            });
            if (res.ok) {
                showToast(targetArchived ? 'Note moved to Archive' : 'Note reinstated to active', 'success');
                loadNotes();
            } else {
                showToast('Failed to update note archive status');
            }
        } catch (e) {
            showToast('Failed to archive note');
        }
    }

    async function deleteNote(noteId) {
        if (!confirm('Are you sure you want to permanently delete this note?')) return;
        try {
            const res = await fetch(`${API_NOTES}/${noteId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('Note deleted', 'info');
                if (editingNoteId === noteId) {
                    noteEditorExpanded.classList.add('hidden');
                    noteEditorCollapsed.classList.remove('hidden');
                    editingNoteId = null;
                    clearNoteAttachment();
                }
                loadNotes();
            } else {
                showToast('Failed to delete note');
            }
        } catch (e) {
            showToast('Failed to delete note');
            console.error(e);
        }
    }

    function clearNoteAttachment() {
        currentNoteAttachment = null;
        currentNoteAttachmentUploadPromise = null;
        if (noteFileInput) noteFileInput.value = '';
        if (noteCameraInput) noteCameraInput.value = '';
        if (noteAttachmentPreview) noteAttachmentPreview.classList.add('hidden');
        if (noteAttachmentImg) {
            noteAttachmentImg.src = '';
            noteAttachmentImg.style.display = 'none';
        }
        if (noteAttachmentFileIcon) noteAttachmentFileIcon.style.display = 'none';
        if (noteOcrStatus) noteOcrStatus.innerText = '';
    }

    if (btnRemoveNoteAttachment) {
        btnRemoveNoteAttachment.addEventListener('click', (e) => {
            e.stopPropagation();
            clearNoteAttachment();
        });
    }

    async function handleNoteFileSelection(file) {
        if (!file) return;
        openNoteEditor(null, false);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target.result;
            currentNoteAttachment = {
                data: dataUrl,
                mimeType: file.type || 'image/jpeg',
                filename: file.name || 'photo.jpg'
            };

            if (noteAttachmentName) noteAttachmentName.innerText = file.name || 'photo.jpg';
            if (noteAttachmentSize) noteAttachmentSize.innerText = `${Math.round((file.size || (dataUrl.length * 0.75)) / 1024)} KB`;
            if (file.type.startsWith('image/') || (!file.type && dataUrl.startsWith('data:image/'))) {
                if (noteAttachmentImg) {
                    noteAttachmentImg.src = dataUrl;
                    noteAttachmentImg.style.display = 'block';
                }
                if (noteAttachmentFileIcon) noteAttachmentFileIcon.style.display = 'none';
            } else {
                if (noteAttachmentImg) noteAttachmentImg.style.display = 'none';
                if (noteAttachmentFileIcon) noteAttachmentFileIcon.style.display = 'block';
            }
            if (noteAttachmentPreview) noteAttachmentPreview.classList.remove('hidden');

            // Upload image to Vercel Blob
            if (file.type.startsWith('image/') || (!file.type && dataUrl.startsWith('data:image/'))) {
                if (noteOcrStatus) noteOcrStatus.innerText = 'Uploading to cloud...';
                const uploadFormData = new FormData();
                uploadFormData.append('image', file);
                currentNoteAttachmentUploadPromise = fetch('/api/v1/notes/upload', {
                    method: 'POST',
                    body: uploadFormData
                }).then(async (res) => {
                    if (res.ok) {
                        const uploadData = await res.json();
                        if (uploadData.url && currentNoteAttachment) {
                            currentNoteAttachment.data = uploadData.url;
                            if (noteOcrStatus && (noteOcrStatus.innerText === 'Uploading to cloud...' || !noteOcrStatus.innerText)) {
                                noteOcrStatus.innerText = 'Cloud Uploaded';
                            }
                        }
                    } else {
                        console.error('Blob upload failed');
                        if (noteOcrStatus && noteOcrStatus.innerText === 'Uploading to cloud...') {
                            noteOcrStatus.innerText = 'Upload failed';
                        }
                    }
                }).catch((uploadErr) => {
                    console.error('Blob upload error:', uploadErr);
                    if (noteOcrStatus && noteOcrStatus.innerText === 'Uploading to cloud...') {
                        noteOcrStatus.innerText = 'Upload failed';
                    }
                });
            }

            // If image or PDF, trigger OCR text extraction
            if (file.type.startsWith('image/') || file.type === 'application/pdf' || dataUrl.startsWith('data:image/')) {
                if (noteOcrStatus) noteOcrStatus.innerText = 'Scanning text...';
                try {
                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('mode', 'document');

                    const res = await fetch('/api/v1/capture/ocr', {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const ocrData = await res.json();
                        if (ocrData.success && ocrData.text) {
                            if (noteOcrStatus) noteOcrStatus.innerText = 'Text extracted!';
                            const existingBody = editNoteBody.value.trim();
                            if (!existingBody) {
                                editNoteBody.value = ocrData.text;
                            } else {
                                editNoteBody.value = existingBody + '\n\n--- Extracted Text ---\n' + ocrData.text;
                            }
                            if (!editNoteTitle.value.trim()) {
                                const firstLine = ocrData.text.split('\n')[0].replace(/^#+\s*/, '').trim();
                                editNoteTitle.value = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine || `Document (${file.name || 'Photo'})`;
                            }
                            showToast('Document text transcribed into note', 'success');
                        } else {
                            if (noteOcrStatus) noteOcrStatus.innerText = 'Attached';
                        }
                    } else {
                        if (noteOcrStatus) noteOcrStatus.innerText = 'Attached';
                    }
                } catch (ocrErr) {
                    console.error('OCR Error:', ocrErr);
                    if (noteOcrStatus) noteOcrStatus.innerText = 'Attached';
                }
            } else {
                if (noteOcrStatus) noteOcrStatus.innerText = 'Attached';
            }
        };
        reader.readAsDataURL(file);
    }

    if (noteFileInput) {
        noteFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleNoteFileSelection(e.target.files[0]);
            }
        });
    }

    if (noteCameraInput) {
        noteCameraInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleNoteFileSelection(e.target.files[0]);
            }
        });
    }

    function openImageLightbox(src, caption = '') {
        if (!imageLightboxModal || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.innerText = caption;
        imageLightboxModal.classList.remove('hidden');
    }

    if (btnCloseImageLightbox) {
        btnCloseImageLightbox.addEventListener('click', () => {
            if (imageLightboxModal) imageLightboxModal.classList.add('hidden');
        });
    }
    if (imageLightboxModal) {
        imageLightboxModal.addEventListener('click', (e) => {
            if (e.target === imageLightboxModal) {
                imageLightboxModal.classList.add('hidden');
            }
        });
    }

    function openNoteEditor(note = null, clearAttachment = true) {
        if (clearAttachment) {
            clearNoteAttachment();
        }
        if (note) {
            editingNoteId = note.id;
            if (btnDeleteNoteEditor) btnDeleteNoteEditor.style.display = 'inline-block';
            let content = note.content || '';

            // Extract any attached image markdown ![alt](src)
            const imgMatch = content.match(/!\[(.*?)\]\(([\s\S]*?)\)/);
            if (imgMatch) {
                const alt = imgMatch[1] || 'Photo';
                const src = imgMatch[2].trim();
                currentNoteAttachment = {
                    data: src,
                    mimeType: src.startsWith('data:image/') ? src.split(';')[0].replace('data:', '') : 'image/jpeg',
                    filename: alt
                };
                if (noteAttachmentName) noteAttachmentName.innerText = alt;
                if (noteAttachmentSize) {
                    const estimatedKb = Math.round((src.length * 0.75) / 1024);
                    noteAttachmentSize.innerText = src.startsWith('http') ? 'Cloud Image' : (estimatedKb > 0 ? `${estimatedKb} KB` : 'Attached');
                }
                if (noteAttachmentImg) {
                    noteAttachmentImg.src = src;
                    noteAttachmentImg.style.display = 'block';
                    noteAttachmentImg.style.cursor = 'pointer';
                    noteAttachmentImg.title = 'Click to enlarge';
                    noteAttachmentImg.onclick = (e) => {
                        e.stopPropagation();
                        openImageLightbox(src, alt);
                    };
                }
                if (noteAttachmentFileIcon) noteAttachmentFileIcon.style.display = 'none';
                if (noteAttachmentPreview) noteAttachmentPreview.classList.remove('hidden');

                // Remove image markdown from text body so editor doesn't show huge base64 or URL
                content = content.replace(imgMatch[0], '').trim();
            }

            // Extract attachment placeholder if any [Attachment: name]
            const attachMatch = content.match(/\[Attachment:\s*([^\]]+)\]/);
            if (attachMatch && !currentNoteAttachment) {
                const filename = attachMatch[1];
                currentNoteAttachment = {
                    data: '',
                    mimeType: 'application/octet-stream',
                    filename: filename
                };
                if (noteAttachmentName) noteAttachmentName.innerText = filename;
                if (noteAttachmentFileIcon) noteAttachmentFileIcon.style.display = 'block';
                if (noteAttachmentImg) noteAttachmentImg.style.display = 'none';
                if (noteAttachmentPreview) noteAttachmentPreview.classList.remove('hidden');
                content = content.replace(attachMatch[0], '').trim();
            }

            const lines = content.split('\n');
            if (lines.length > 0 && lines[0].startsWith('# ')) {
                editNoteTitle.value = lines[0].replace('# ', '');
                editNoteBody.value = lines.slice(1).join('\n').trim();
            } else {
                editNoteTitle.value = '';
                editNoteBody.value = content;
            }
            btnPinNote.classList.toggle('btn-neon-blue', note.pinned);
            btnPinNote.dataset.pinned = note.pinned ? "true" : "false";
            btnPinNote.style.color = note.pinned ? '#ffeb3b' : 'rgba(255,255,255,0.5)';
            btnPinNote.querySelector('svg')?.setAttribute('fill', note.pinned ? 'currentColor' : 'none');

            if (inlineNoteEditorContainer) {
                inlineNoteEditorContainer.style.borderColor = 'var(--neon-blue)';
                inlineNoteEditorContainer.style.boxShadow = '0 0 16px rgba(0, 229, 255, 0.35)';
                inlineNoteEditorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (clearAttachment) {
            editingNoteId = null;
            if (btnDeleteNoteEditor) btnDeleteNoteEditor.style.display = 'none';
            editNoteTitle.value = '';
            editNoteBody.value = '';
            btnPinNote.classList.remove('btn-neon-blue');
            btnPinNote.dataset.pinned = "false";
            btnPinNote.style.color = 'rgba(255,255,255,0.5)';
            btnPinNote.querySelector('svg')?.setAttribute('fill', 'none');
            if (inlineNoteEditorContainer) {
                inlineNoteEditorContainer.style.borderColor = 'rgba(255,255,255,0.2)';
                inlineNoteEditorContainer.style.boxShadow = 'none';
            }
        }
        noteEditorCollapsed.classList.add('hidden');
        noteEditorExpanded.classList.remove('hidden');
        if (!note && clearAttachment) {
            editNoteTitle.focus();
        } else if (note) {
            editNoteBody.focus();
        }
    }

    noteEditorCollapsed.addEventListener('click', (e) => {
        if (e.target !== btnNoteAttachCollapsed && !btnNoteAttachCollapsed?.contains(e.target) &&
            e.target !== btnNoteCameraCollapsed && !btnNoteCameraCollapsed?.contains(e.target)) {
            openNoteEditor();
        }
    });
    
    async function closeAndSaveNote() {
        if (currentNoteAttachmentUploadPromise) {
            try {
                await currentNoteAttachmentUploadPromise;
            } catch (e) {
                console.error('Wait for upload error:', e);
            }
        }
        const title = editNoteTitle.value.trim();
        let body = editNoteBody.value.trim();
        if (title || body || currentNoteAttachment) {
            let content = title ? `# ${title}\n${body}` : body;
            if (currentNoteAttachment) {
                const isImage = currentNoteAttachment.mimeType?.startsWith('image/') || currentNoteAttachment.data?.startsWith('data:image/') || currentNoteAttachment.data?.startsWith('http');
                if (isImage && currentNoteAttachment.data) {
                    if (!content.includes(currentNoteAttachment.data)) {
                        content += `\n\n![${currentNoteAttachment.filename || 'Photo'}](${currentNoteAttachment.data})`;
                    }
                } else if (currentNoteAttachment.filename) {
                    if (!content.includes(currentNoteAttachment.filename)) {
                        content += `\n\n[Attachment: ${currentNoteAttachment.filename}]`;
                    }
                }
            }
            const pinned = btnPinNote.dataset.pinned === "true";
            saveNote({ content, pinned });
            clearNoteAttachment();
        } else {
            noteEditorExpanded.classList.add('hidden');
            noteEditorCollapsed.classList.remove('hidden');
            editingNoteId = null;
            if (btnDeleteNoteEditor) btnDeleteNoteEditor.style.display = 'none';
            clearNoteAttachment();
        }
        if (inlineNoteEditorContainer) {
            inlineNoteEditorContainer.style.borderColor = 'rgba(255,255,255,0.2)';
            inlineNoteEditorContainer.style.boxShadow = 'none';
        }
    }

    btnCancelNoteEdit.addEventListener('click', closeAndSaveNote);

    if (btnDeleteNoteEditor) {
        btnDeleteNoteEditor.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (editingNoteId) {
                await deleteNote(editingNoteId);
            }
        });
    }
    
    btnPinNote.addEventListener('click', () => {
        const isPinned = btnPinNote.dataset.pinned === "true";
        btnPinNote.dataset.pinned = !isPinned ? "true" : "false";
        btnPinNote.style.color = !isPinned ? '#ffeb3b' : 'rgba(255,255,255,0.5)';
        btnPinNote.querySelector('svg').setAttribute('fill', !isPinned ? 'currentColor' : 'none');
    });

    if (btnToggleFollowUpView) {
        btnToggleFollowUpView.addEventListener('click', () => {
            if (currentNotesTab === 'followup') {
                currentNotesTab = 'active';
                btnToggleFollowUpView.style.color = 'rgba(255,255,255,0.7)';
            } else {
                currentNotesTab = 'followup';
                btnToggleFollowUpView.style.color = '#ff3c3c';
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

    if (btnToggleArchiveView) {
        btnToggleArchiveView.addEventListener('click', () => {
            if (archivedNotesSectionTitle && archivedNotesSectionTitle.style.display !== 'none') {
                archivedNotesSectionTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                showToast('No archived notes yet', 'info');
            }
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

        function isConsultChecklist() {
            const combined = `${id} ${type} ${(card.querySelector('.protocol-info p')?.innerText || '')}`.toLowerCase();
            return combined.includes('clancy') || combined.includes('khan') || 
                   combined.includes('solicitor') || combined.includes('lawyer') ||
                   combined.includes('court prep') || combined.includes('doctor consult');
        }

        if (showBtn) {
            showBtn.addEventListener('click', () => {
                const title = card.querySelector('.protocol-info p')?.innerText || id;
                if (id === 'tom_complaints_1000' || id.includes('complaints') || type === 'complaints' || title.toLowerCase().includes('regulatory complaints')) {
                    if (typeof openComplaintsModal === 'function') {
                        openComplaintsModal('cav');
                    } else {
                        const m = document.getElementById('complaintsModal');
                        if (m) m.classList.remove('hidden');
                    }
                    return;
                }
                if (id.toLowerCase().includes('court') || title.toLowerCase().includes('court') || type.toLowerCase().includes('court')) {
                    if (typeof openCourtModal === 'function') {
                        openCourtModal();
                    } else {
                        const m = document.getElementById('courtModal');
                        if (m) m.classList.remove('hidden');
                        else window.open('https://csvic.webex.com/meet/26517100652', '_blank');
                    }
                    return;
                }
                if (isPainLog()) {
                    let schedTime = showBtn.getAttribute('data-scheduled-time') || card.getAttribute('data-scheduled-time') || '';
                    if (!schedTime) {
                        const h3Text = card.querySelector('.protocol-info h3')?.innerText || '';
                        const idMatch = id.match(/pain_log_reminder_(\d{2})(\d{2})\d{2}_(\d{4}-\d{2}-\d{2})/);
                        if (idMatch) {
                            schedTime = `${idMatch[3]}T${idMatch[1]}:${idMatch[2]}:00+11:00`;
                        } else if (h3Text) {
                            schedTime = h3Text.trim();
                        }
                    }
                    activePainLogScheduledTime = schedTime || null;
                    activePainLogAgendaId = id || card.getAttribute('data-agenda-id') || null;
                    if (typeof renderPainModal === 'function') renderPainModal();
                    if (typeof recalculateMood === 'function') recalculateMood();
                    if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();
                    document.getElementById('painLogModal').classList.remove('hidden');
                } else if (isExercise()) {
                    const cleanId = id ? id.toLowerCase().trim() : '';
                    if (cleanId.includes('meditation') || cleanId.startsWith('med_')) {
                        window.open('https://insighttimer.com', '_blank');
                    } else if (YOGA_ROUTINES[cleanId] || cleanId.match(/^(y|p|s|r|h)\d+$/i) || cleanId.includes('yoga') || cleanId.includes('rehab')) {
                        startRunnerModal(cleanId);
                    } else {
                        loadExerciseSuggestions();
                    }
                } else if (isConsultChecklist()) {
                    const combined = `${id} ${title}`.toLowerCase();
                    const initialTab = (combined.includes('khan') || combined.includes('dr')) ? 'drkhan' : 'clancy';
                    openConsultChecklistModal(initialTab);
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

                    if (type === 'insight') {
                        showToast('Rule approved to Rumble Brain & SOUL.md', 'success');
                        if (id) {
                            await fetch(API_AGENDA, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id, action: 'approve_insight' })
                            });
                            loadAgenda();
                        }
                        return;
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
            "name": "Gentle Lumbar Release",
            "title": "Gentle Lumbar Release",
            "category": "yoga",
            "focus_areas": [
                        "lumbar",
                        "lower back",
                        "pelvis"
            ],
            "duration_minutes": 20,
            "intensity": "Gentle Restorative",
            "instruction": "Progressive supine lumbar decompression protocol: diaphragmatic awakening, gentle pelvic clocks, single knee-to-chest releases, supported bridge holds, and restorative bolster grounding.",
            "description": "Progressive supine lumbar decompression protocol: diaphragmatic awakening, gentle pelvic clocks, single knee-to-chest releases, supported bridge holds, and restorative bolster grounding.",
            "precautions": [
                        "Avoid aggressive lumbar flexion during acute disc flare-ups.",
                        "Keep movements gentle and pain-free."
            ],
            "contraindications": [
                        "acute disc herniation"
            ],
            "steps": [
                        {
                                    "title": "Diaphragmatic 360 Core Awakening",
                                    "duration": 120,
                                    "cue": "Lie supine with knees bent, breathe deep into lateral ribs and lower abdomen.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Pelvic Tilts & Neutral Finding",
                                    "duration": 120,
                                    "cue": "Flatten lower back gently on exhale, slight neutral arch on inhale.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Pelvic Clocks & Transverse Holds",
                                    "duration": 120,
                                    "cue": "Gentle circular micro-mobilization of the pelvis without straining lumbar discs.",
                                    "frames": [
                                                "/exercises/supine_pelvic_clocks_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Single Knee-to-Chest (Right)",
                                    "duration": 120,
                                    "cue": "Hug right knee gently towards shoulder, keeping left foot grounded flat.",
                                    "frames": [
                                                "/exercises/knee_to_chest_right_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Single Knee-to-Chest (Left)",
                                    "duration": 120,
                                    "cue": "Switch and hug left knee gently, decompressing lumbar facet joints.",
                                    "frames": [
                                                "/exercises/knee_to_chest_left_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Supported Bridge Activation",
                                    "duration": 120,
                                    "cue": "Press through heels to lift pelvis slightly, engaging glutes without arching lumbar spine.",
                                    "frames": [
                                                "/exercises/hip_glute_bridge_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Child's Pose Decompression",
                                    "duration": 120,
                                    "cue": "Knees wide, sink hips toward heels, rest torso on cushion or mat.",
                                    "frames": [
                                                "/exercises/supported_childs_pose_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Cat-Cow Spine Awakening",
                                    "duration": 120,
                                    "cue": "Gentle rhythmic undulation of spine on hands and knees, keeping neck neutral.",
                                    "frames": [
                                                "/exercises/cat_cow_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Supine Torso Twist",
                                    "duration": 120,
                                    "cue": "Drop knees gently 45 degrees to each side to mobilize lumbar rotation safely.",
                                    "frames": [
                                                "/exercises/gentle_supine_torso_twist_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Restorative Savasana with Bolster",
                                    "duration": 120,
                                    "cue": "Rest with bolster beneath knees to unload psoas and settle lumbar spine.",
                                    "frames": [
                                                "/exercises/restorative_savasana_hud.jpg"
                                    ]
                        }
            ]
},
        "y2": {
            "id": "y2",
            "name": "Cervical Mobility Flow",
            "title": "Cervical Mobility Flow",
            "category": "yoga",
            "focus_areas": [
                        "cervical",
                        "neck",
                        "upper trapezius"
            ],
            "duration_minutes": 15,
            "intensity": "Gentle",
            "instruction": "Gentle seated neck retractions, slow lateral tilts, scapular shrugs, and thoracic decompression for post-surgical cervical safety.",
            "description": "Gentle seated neck retractions, slow lateral tilts, scapular shrugs, and thoracic decompression for post-surgical cervical safety.",
            "precautions": [
                        "No rapid cervical rotations or forced extension post-cervical surgery."
            ],
            "contraindications": [
                        "acute cervical radiculopathy with progressive weakness"
            ],
            "steps": [
                        {
                                    "title": "Seated Axial Retraction (Chin Tuck)",
                                    "duration": 110,
                                    "cue": "Sit tall, draw chin straight back into gentle double chin without tilting head down. Hold 5s.",
                                    "frames": [
                                                "/exercises/cervical_chin_tuck_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Gentle Lateral Ear-to-Shoulder",
                                    "duration": 110,
                                    "cue": "Slowly tilt right ear toward right shoulder, keep opposite shoulder down, breathe 30s. Repeat opposite.",
                                    "frames": [
                                                "/exercises/cervical_lateral_ear_shoulder_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Shoulder Shrug & Scapular Release",
                                    "duration": 110,
                                    "cue": "Inhale lift shoulders toward ears, exhale let them drop completely to release upper trapezius tension.",
                                    "frames": [
                                                "/exercises/cervical_shoulder_shrug_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Gentle Neck AROM Rotation (Supine)",
                                    "duration": 110,
                                    "cue": "Lie supine with neck supported, smoothly rotate head 45 degrees side-to-side without strain.",
                                    "frames": [
                                                "/exercises/supine_cervical_rotation_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Cactus Arm Chest Expansion",
                                    "duration": 110,
                                    "cue": "Bring elbows to 90 degrees at shoulder height, gently draw shoulder blades together to expand chest.",
                                    "frames": [
                                                "/exercises/thoracic_cactus_expansion_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Thread the Needle Upper Spine Release",
                                    "duration": 120,
                                    "cue": "From tabletop, glide right arm under torso, resting shoulder and temple gently on floor or block.",
                                    "frames": [
                                                "/exercises/thread_the_needle_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Constructive Rest Position",
                                    "duration": 110,
                                    "cue": "Lie supine with knees bent and feet wide, knees resting together to unload psoas and cervical spine.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Restorative Alignment Breathing",
                                    "duration": 110,
                                    "cue": "Breathe slowly into lower ribs, allowing neck and upper traps to remain completely soft and relaxed.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        }
            ]
},
        "y3": {
            "id": "y3",
            "name": "Full Body Restorative Yin",
            "title": "Full Body Restorative Yin",
            "category": "yoga",
            "focus_areas": [
                        "full body",
                        "nervous system",
                        "restorative"
            ],
            "duration_minutes": 30,
            "intensity": "Very Gentle / Yin",
            "instruction": "Passive, prop-supported postures held for extended periods to stimulate the parasympathetic nervous system and safely release fascial tension.",
            "description": "Passive, prop-supported postures held for extended periods to stimulate the parasympathetic nervous system and safely release fascial tension.",
            "precautions": [
                        "Use ample cushions and bolsters.",
                        "Never force range of motion."
            ],
            "contraindications": [
                        "acute joint inflammation"
            ],
            "steps": [
                        {
                                    "title": "Supported Reclined Bound Angle",
                                    "duration": 180,
                                    "cue": "Soles of feet together, knees supported by blocks or cushions, arms relaxed by sides.",
                                    "frames": [
                                                "/exercises/supported_reclined_bound_angle.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Diaphragmatic Breath Grounding",
                                    "duration": 180,
                                    "cue": "Inhale 4 counts, exhale 6 counts. Feel belly rise and fall under hands.",
                                    "frames": [
                                                "/exercises/gentle_diaphragmatic_breath_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Cat-Cow Spine Wave",
                                    "duration": 180,
                                    "cue": "Slow, undulating breath-synchronized spine mobilization on hands and knees.",
                                    "frames": [
                                                "/exercises/gentle_cat_cow.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Gentle Sphinx",
                                    "duration": 180,
                                    "cue": "Forearms grounded, elbows under shoulders, gentle passive thoracic extension.",
                                    "frames": [
                                                "/exercises/supported_gentle_sphinx.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Child's Pose with Bolster",
                                    "duration": 180,
                                    "cue": "Torso resting on long bolster between knees, head turned gently to one side.",
                                    "frames": [
                                                "/exercises/supported_childs_pose_bolster_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Supine Torso Twist",
                                    "duration": 180,
                                    "cue": "Drop knees softly to right with bolster support; switch to left halfway through.",
                                    "frames": [
                                                "/exercises/gentle_supine_torso_twist_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Pelvic Bridge on Block",
                                    "duration": 180,
                                    "cue": "Low foam block under sacrum, arms relaxed, allowing hip flexors to passively open.",
                                    "frames": [
                                                "/exercises/supported_bridge_block_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Constructive Rest Position with Bolster",
                                    "duration": 180,
                                    "cue": "Knees bent and knocked together, bolster under thighs, lower back flat and grounded.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Legs Up the Wall (Viparita Karani)",
                                    "duration": 180,
                                    "cue": "Hips close to wall, legs extending vertically, letting gravity passively drain lower limbs.",
                                    "frames": [
                                                "/exercises/legs_up_the_wall.jpg"
                                    ]
                        },
                        {
                                    "title": "Acupressure Mat & Bolster Wind-Down Savasana",
                                    "duration": 180,
                                    "cue": "Rest upper back on acupressure mat with bolster under knees, melting into floor.",
                                    "frames": [
                                                "/exercises/acupressure_mat_savasana_hud.jpg"
                                    ]
                        }
            ]
},
        "y4": {
            "id": "y4",
            "name": "Shoulder & Thoracic Opener",
            "title": "Shoulder & Thoracic Opener",
            "category": "yoga",
            "focus_areas": [
                        "thoracic",
                        "shoulders",
                        "chest",
                        "scapula"
            ],
            "duration_minutes": 20,
            "intensity": "Gentle",
            "instruction": "Targeted protocol to decompress mid-back kyphosis, open anterior shoulder capsule, and mobilize thoracic cage without lumbar hyperextension.",
            "description": "Targeted protocol to decompress mid-back kyphosis, open anterior shoulder capsule, and mobilize thoracic cage without lumbar hyperextension.",
            "precautions": [
                        "Avoid forcing shoulder external rotation if shoulder impingement is present."
            ],
            "contraindications": [
                        "acute shoulder dislocation"
            ],
            "steps": [
                        {
                                    "title": "Diaphragmatic Breath & Rib Expansion",
                                    "duration": 120,
                                    "cue": "Inhale into 360 lateral ribcage, expanding lower intercostals without elevating shoulders.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Cervical Chin Tucks & Neck Lengthening",
                                    "duration": 120,
                                    "cue": "Sit tall, gently glide head straight back to decompress cervical spine and lengthen posterior neck.",
                                    "frames": [
                                                "/exercises/cervical_chin_tuck_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Cat-Cow Thoracic Waves",
                                    "duration": 120,
                                    "cue": "Rhythmic spinal mobilization on all fours, focusing wave movement through mid-thoracic spine.",
                                    "frames": [
                                                "/exercises/gentle_cat_cow.jpg"
                                    ]
                        },
                        {
                                    "title": "Thread the Needle (Right Side)",
                                    "duration": 120,
                                    "cue": "Slide right arm under torso across mat, resting right shoulder and ear down to open right thoracic ribs.",
                                    "frames": [
                                                "/exercises/thread_the_needle_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Thread the Needle (Left Side)",
                                    "duration": 120,
                                    "cue": "Switch sides, sliding left arm under torso, rotating thoracic spine gently without forcing lumbar twist.",
                                    "frames": [
                                                "/exercises/thread_the_needle_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Puppy Pose Thoracic Stretch",
                                    "duration": 120,
                                    "cue": "Hips stacked over knees, walk hands forward and melt chest toward floor to reverse thoracic kyphosis.",
                                    "frames": [
                                                "/exercises/puppy_pose_thoracic_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Cactus Arm Openers",
                                    "duration": 120,
                                    "cue": "Elbows at 90 degrees, draw shoulder blades together and down, lifting sternum gently.",
                                    "frames": [
                                                "/exercises/thoracic_cactus_expansion_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Open Book Thoracic Rotations",
                                    "duration": 120,
                                    "cue": "Side-lying with knees stacked at 90 degrees, fan top arm open across chest in a smooth rotational arc.",
                                    "frames": [
                                                "/exercises/open_book_thoracic_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supported Gentle Sphinx",
                                    "duration": 120,
                                    "cue": "Forearms on mat parallel, lift chest gently without compressing lumbar spine.",
                                    "frames": [
                                                "/exercises/supported_gentle_sphinx.jpg"
                                    ]
                        },
                        {
                                    "title": "Constructive Rest & Scapular Settle",
                                    "duration": 120,
                                    "cue": "Lie supine with knees bent and feet wide, feeling shoulder blades melt flat onto the floor.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "y5": {
            "id": "y5",
            "name": "Hip Flexor & Psoas Flow",
            "title": "Hip Flexor & Psoas Flow",
            "category": "yoga",
            "focus_areas": [
                        "hips",
                        "psoas",
                        "pelvis",
                        "glutes"
            ],
            "duration_minutes": 20,
            "intensity": "Gentle",
            "instruction": "Systematic lengthening of the iliopsoas, rectus femoris, and deep hip rotators to relieve anterior hip impingement and lumbar hyperlordosis.",
            "description": "Systematic lengthening of the iliopsoas, rectus femoris, and deep hip rotators to relieve anterior hip impingement and lumbar hyperlordosis.",
            "precautions": [
                        "Do not let lumbar spine hyperextend during kneeling lunges; tuck tailbone under."
            ],
            "contraindications": [
                        "acute hip labral tear with groin pinch"
            ],
            "steps": [
                        {
                                    "title": "Diaphragmatic Breath & Psoas Awareness",
                                    "duration": 120,
                                    "cue": "Lie supine, breathe deep into pelvis, visualizing psoas releasing tension on each long exhale.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Pelvic Tilts to Neutral",
                                    "duration": 120,
                                    "cue": "Flatten lumbar curve gently into mat on exhale, return to neutral on inhale without straining.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Glute Bridge Activation",
                                    "duration": 120,
                                    "cue": "Drive through heels, squeeze glutes to lift hips to knee height, opening front of hip flexors.",
                                    "frames": [
                                                "/exercises/hip_glute_bridge_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Low Kneeling Lunge (Right Hip Flexor)",
                                    "duration": 120,
                                    "cue": "Step left foot forward, right knee cushioned on mat. Tuck tailbone under to feel front right hip stretch.",
                                    "frames": [
                                                "/exercises/hip_kneeling_lunge_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Low Kneeling Lunge (Left Hip Flexor)",
                                    "duration": 120,
                                    "cue": "Step right foot forward, left knee cushioned on mat. Maintain posterior pelvic tilt to stretch left psoas.",
                                    "frames": [
                                                "/exercises/hip_kneeling_lunge_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "90/90 Seated Hip Rotations",
                                    "duration": 120,
                                    "cue": "Sit on floor with both legs at 90-degree angles. Gently hinge chest forward over front knee, spine tall.",
                                    "frames": [
                                                "/exercises/hip_ninety_ninety_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Reclined Figure-4 Hip Opener (Right)",
                                    "duration": 120,
                                    "cue": "Supine, cross right ankle over left knee. Hug left hamstring gently to release right piriformis and glute.",
                                    "frames": [
                                                "/exercises/hip_figure_four_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Reclined Figure-4 Hip Opener (Left)",
                                    "duration": 120,
                                    "cue": "Supine, cross left ankle over right knee. Hug right thigh toward chest to decompress left hip capsule.",
                                    "frames": [
                                                "/exercises/hip_figure_four_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supported Reclined Bound Angle",
                                    "duration": 120,
                                    "cue": "Soles of feet together, knees supported by pillows or blocks, releasing adductors and groin passively.",
                                    "frames": [
                                                "/exercises/supported_reclined_bound_angle.jpg"
                                    ]
                        },
                        {
                                    "title": "Savasana Psoas Decompression",
                                    "duration": 120,
                                    "cue": "Rest flat with bolster under knees to keep psoas slack and lower back fully settled.",
                                    "frames": [
                                                "/exercises/restorative_savasana.jpg"
                                    ]
                        }
            ]
},
        "y6": {
            "id": "y6",
            "name": "Morning Spine Awakening",
            "title": "Morning Spine Awakening",
            "category": "yoga",
            "focus_areas": [
                        "spine",
                        "core",
                        "morning routine",
                        "mobility"
            ],
            "duration_minutes": 20,
            "intensity": "Gentle Wakeup",
            "instruction": "Early morning progressive mobilization: gentle diaphragmatic awakening, rhythmic cat-cow, thoracic rotations, and restorative settling.",
            "description": "Early morning progressive mobilization: gentle diaphragmatic awakening, rhythmic cat-cow, thoracic rotations, and restorative settling.",
            "precautions": [
                        "Move slowly through early morning spinal stiffness; no forceful end-range stretches."
            ],
            "contraindications": [
                        "acute spinal fracture"
            ],
            "steps": [
                        {
                                    "title": "Morning Breath & Centering",
                                    "duration": 120,
                                    "cue": "Awaken diaphragm with 5 deep breaths, expanding lower abdomen and ribcage smoothly.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Cat-Cow Rhythmic Spine Mobilization",
                                    "duration": 120,
                                    "cue": "Hands and knees, undulate spine smoothly from tailbone to crown in sync with breath.",
                                    "frames": [
                                                "/exercises/cat_cow_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Child's Pose Lateral Side Stretch",
                                    "duration": 120,
                                    "cue": "Sink hips to heels, walk hands gently toward right corner of mat to open left flank, then switch.",
                                    "frames": [
                                                "/exercises/supported_childs_pose.jpg"
                                    ]
                        },
                        {
                                    "title": "Puppy Pose Thoracic Melt",
                                    "duration": 120,
                                    "cue": "Hips high over knees, melt chest and sternum downward to unlock thoracic extension.",
                                    "frames": [
                                                "/exercises/puppy_pose_thoracic_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Open Book Thoracic Opener (Right)",
                                    "duration": 120,
                                    "cue": "Side-lying on left side, sweep right arm open across chest, rotating head and eyes toward right hand.",
                                    "frames": [
                                                "/exercises/open_book_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Open Book Thoracic Opener (Left)",
                                    "duration": 120,
                                    "cue": "Side-lying on right side, sweep left arm open in a smooth arc, keeping knees glued together.",
                                    "frames": [
                                                "/exercises/open_book_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supported Low Kneeling Lunge",
                                    "duration": 120,
                                    "cue": "Half-kneeling with hands on front knee or blocks, gently open hip flexor chain without lumbar overarching.",
                                    "frames": [
                                                "/exercises/hip_kneeling_lunge_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Gentle Supine Torso Twist",
                                    "duration": 120,
                                    "cue": "Supine, drop both knees gently to the side with shoulders grounded to restore rotational ease.",
                                    "frames": [
                                                "/exercises/gentle_supine_torso_twist_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Gentle Sphinx Micro-Lifts",
                                    "duration": 120,
                                    "cue": "Prone on forearms, gently draw elbows toward hips to extend thoracic spine with zero lumbar pinch.",
                                    "frames": [
                                                "/exercises/supported_sphinx_microlifts_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Constructive Rest Neutral Settle",
                                    "duration": 120,
                                    "cue": "Rest supine with knees bent and supported, letting the entire spine imprint into neutral alignment.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "y7": {
            "id": "y7",
            "name": "Chair Yoga for Desk Decompression",
            "title": "Chair Yoga for Desk Decompression",
            "category": "yoga",
            "focus_areas": [
                        "desk posture",
                        "thoracic",
                        "neck",
                        "hips",
                        "ergonomics"
            ],
            "duration_minutes": 15,
            "intensity": "Gentle Chair-Based",
            "instruction": "Accessible, zero-floor chair routine for midday desk workers: reverses seated kyphosis, unglues piriformis tension, and releases upper trap spasms.",
            "description": "Accessible, zero-floor chair routine for midday desk workers: reverses seated kyphosis, unglues piriformis tension, and releases upper trap spasms.",
            "precautions": [
                        "Use a stable chair without wheels.",
                        "Keep feet firmly planted during seated twists."
            ],
            "contraindications": [
                        "severe postural orthostatic tachycardia syndrome without supervision"
            ],
            "steps": [
                        {
                                    "title": "Seated Diaphragmatic Breath",
                                    "duration": 110,
                                    "cue": "Sit tall away from chair back, feet flat. Breathe into lateral ribs to down-regulate nervous system.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Seated Cat-Cow",
                                    "duration": 110,
                                    "cue": "Hands on knees: inhale arch chest forward, exhale round spine back, releasing desk tension.",
                                    "frames": [
                                                "/exercises/chair_seated_cat_cow_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Figure-4 Hip Opener (Right)",
                                    "duration": 110,
                                    "cue": "Cross right ankle over left knee. Keep spine straight and gently hinge from hips until right glute stretches.",
                                    "frames": [
                                                "/exercises/chair_seated_figure_four_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Figure-4 Hip Opener (Left)",
                                    "duration": 110,
                                    "cue": "Cross left ankle over right knee. Hinge forward with neutral spine to decompress left hip capsule.",
                                    "frames": [
                                                "/exercises/chair_seated_figure_four_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Upper Trapezius Drop (Right)",
                                    "duration": 110,
                                    "cue": "Anchor right hand under chair seat, gently tilt left ear toward left shoulder to release right upper trap.",
                                    "frames": [
                                                "/exercises/chair_upper_trapezius_drop_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Upper Trapezius Drop (Left)",
                                    "duration": 110,
                                    "cue": "Anchor left hand under chair seat, tilt right ear toward right shoulder, relaxing left shoulder downward.",
                                    "frames": [
                                                "/exercises/chair_upper_trapezius_drop_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Chest Expansion",
                                    "duration": 110,
                                    "cue": "Interlace fingers behind lower back or hold chair back, roll shoulders back and lift sternum gently.",
                                    "frames": [
                                                "/exercises/chair_seated_chest_expansion_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Seated Alignment & Grounding",
                                    "duration": 110,
                                    "cue": "Rest hands on thighs, stack ears over shoulders and shoulders over hips in effortless neutral posture.",
                                    "frames": [
                                                "/exercises/seated_alignment_grounding_hud.svg"
                                    ]
                        }
            ]
},
        "y8": {
            "id": "y8",
            "name": "Vagus Nerve & Restorative Breath",
            "title": "Vagus Nerve & Restorative Breath",
            "category": "yoga",
            "focus_areas": [
                        "vagus nerve",
                        "autonomic",
                        "parasympathetic",
                        "breathing"
            ],
            "duration_minutes": 20,
            "intensity": "Very Gentle Restorative",
            "instruction": "Clinically designed vagal neuromodulation: 4-7-8 breathing, auricular ear clip setup, suboccipital release, and oculomotor vagal reflexes to break chronic pain loops.",
            "description": "Clinically designed vagal neuromodulation: 4-7-8 breathing, auricular ear clip setup, suboccipital release, and oculomotor vagal reflexes to break chronic pain loops.",
            "precautions": [
                        "If feeling lightheaded, discontinue breath holds and return to natural tidal breathing."
            ],
            "contraindications": [
                        "cardiac pacemaker without doctor approval for electrical stimulation"
            ],
            "steps": [
                        {
                                    "title": "4-7-8 Parasympathetic Breathing",
                                    "duration": 150,
                                    "cue": "Inhale through nose 4s, hold breath 7s, exhale slowly through mouth 8s to stimulate vagal brake.",
                                    "frames": [
                                                "/exercises/vagal_478_breathing_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Caremax Auricular Ear Clip Setup (Optional)",
                                    "duration": 150,
                                    "cue": "Attach ear clip to left tragus or concha for transcutaneous auricular vagus nerve stimulation (tVNS).",
                                    "frames": [
                                                "/exercises/caremax_ear_clip_vagus_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Suboccipital Massage with Towel",
                                    "duration": 150,
                                    "cue": "Rest base of skull on rolled towel or two tennis balls, letting weight of head release occipital tension.",
                                    "frames": [
                                                "/exercises/suboccipital_release_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Oculomotor Vagal Reset",
                                    "duration": 150,
                                    "cue": "Supine with head neutral, shift eyes to far right for 30s until swallow/sigh, then repeat left.",
                                    "frames": [
                                                "/exercises/restorative_savasana.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Reclined Bound Angle",
                                    "duration": 150,
                                    "cue": "Supine with bolster along spine and cushions under knees, letting heart and chest soften open.",
                                    "frames": [
                                                "/exercises/supported_reclined_bound_angle.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Heart-Belly Grounding",
                                    "duration": 150,
                                    "cue": "One hand on heart, one on lower abdomen. Feel warmth and grounding rhythm under hands on each breath.",
                                    "frames": [
                                                "/exercises/heart_belly_grounding_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Constructive Rest Position",
                                    "duration": 150,
                                    "cue": "Knees bent 90 degrees resting against each other, lower back flat and completely slack.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Legs-Elevated Vagal Calming",
                                    "duration": 150,
                                    "cue": "Rest calves on chair or bolster, legs elevated above hips to promote venous return and deep calm.",
                                    "frames": [
                                                "/exercises/legs_elevated_relaxation_hud.svg"
                                    ]
                        }
            ]
},
        "y9": {
            "id": "y9",
            "name": "Hamstring & Posterior Chain Release",
            "title": "Hamstring & Posterior Chain Release",
            "category": "yoga",
            "focus_areas": [
                        "hamstrings",
                        "calves",
                        "posterior chain",
                        "sciatic path"
            ],
            "duration_minutes": 20,
            "intensity": "Gentle",
            "instruction": "Supine strap-assisted lengthening of the biceps femoris, semitendinosus, and gastrocnemius without rounding or straining the lumbar spine.",
            "description": "Supine strap-assisted lengthening of the biceps femoris, semitendinosus, and gastrocnemius without rounding or straining the lumbar spine.",
            "precautions": [
                        "Keep a micro-bend in the knee; never lock knee or force foot past 90 degrees."
            ],
            "contraindications": [
                        "acute hamstring avulsion"
            ],
            "steps": [
                        {
                                    "title": "Diaphragmatic Breath & Pelvic Alignment",
                                    "duration": 150,
                                    "cue": "Establish diaphragmatic breathing, ensuring pelvis is neutral before posterior chain stretching.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Pelvic Tilts",
                                    "duration": 150,
                                    "cue": "Gentle pelvic rocking to warm lumbar spine and loosen hamstring proximal attachments at sit bones.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Strap Leg Extension (Right)",
                                    "duration": 150,
                                    "cue": "Loop strap around right ball of foot, gently extend leg upward with micro-bent knee, keeping pelvis grounded.",
                                    "frames": [
                                                "/exercises/supine_strap_hamstring_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supine Strap Leg Extension (Left)",
                                    "duration": 150,
                                    "cue": "Loop strap around left ball of foot, extend toward ceiling until gentle hamstring stretch is felt.",
                                    "frames": [
                                                "/exercises/supine_strap_hamstring_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Gentle IT Band Cross-Body (Right)",
                                    "duration": 150,
                                    "cue": "Right leg extended in strap, bring leg 15 degrees across midline while keeping right hip pinned to mat.",
                                    "frames": [
                                                "/exercises/it_band_crossbody_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Gentle IT Band Cross-Body (Left)",
                                    "duration": 150,
                                    "cue": "Left leg in strap, draw leg 15 degrees across body toward right, feeling lateral thigh and IT band release.",
                                    "frames": [
                                                "/exercises/it_band_crossbody_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Ankle & Foot Mobility Pumps",
                                    "duration": 150,
                                    "cue": "Point and flex ankles 20 times, then gentle circles both directions to mobilize neural tissue.",
                                    "frames": [
                                                "/exercises/ankle_foot_mobility_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Restorative Leg Rest Savasana",
                                    "duration": 150,
                                    "cue": "Extend both legs onto mat or bolster, letting posterior fascia absorb the decompression.",
                                    "frames": [
                                                "/exercises/restorative_savasana.jpg"
                                    ]
                        }
            ]
},
        "y10": {
            "id": "y10",
            "name": "Evening Restorative Wind-Down",
            "title": "Evening Restorative Wind-Down",
            "category": "yoga",
            "focus_areas": [
                        "parasympathetic",
                        "sleep",
                        "full body",
                        "nervous system"
            ],
            "duration_minutes": 25,
            "intensity": "Very Gentle / Evening",
            "instruction": "Down-regulating bedtime sequence combining deep diaphragmatic breathing, supported hip openers, gentle spinal twists, and supported inversion.",
            "description": "Down-regulating bedtime sequence combining deep diaphragmatic breathing, supported hip openers, gentle spinal twists, and supported inversion.",
            "precautions": [
                        "Move at 50% normal speed.",
                        "Dim lighting and prioritize stillness over stretch intensity."
            ],
            "contraindications": [
                        "none"
            ],
            "steps": [
                        {
                                    "title": "Diaphragmatic Parasympathetic Reset",
                                    "duration": 150,
                                    "cue": "Lie supine, exhale twice as long as inhale to trigger nocturnal parasympathetic dominance.",
                                    "frames": [
                                                "/exercises/diaphragmatic_breathing_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supported Reclined Bound Angle",
                                    "duration": 150,
                                    "cue": "Soles together with bolster under spine, letting hips and chest passively open.",
                                    "frames": [
                                                "/exercises/supported_reclined_bound_angle.jpg"
                                    ]
                        },
                        {
                                    "title": "Gentle Pelvic Tilts & Lumbopelvic Clocks",
                                    "duration": 150,
                                    "cue": "Slow circular micro-tilts of pelvis to release accumulated daily lumbar disc tension.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Single Knee-to-Chest Hug",
                                    "duration": 150,
                                    "cue": "Hug right knee, then left, gently decompressing lower lumbar facet joints without strain.",
                                    "frames": [
                                                "/exercises/knee_to_chest_stretch.jpg"
                                    ]
                        },
                        {
                                    "title": "Wide Knee Child's Pose with Bolster",
                                    "duration": 150,
                                    "cue": "Knees wide, rest torso and cheek completely on supportive bolster, breathing into back ribs.",
                                    "frames": [
                                                "/exercises/supported_childs_pose_bolster_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Thread the Needle Shoulder Glide",
                                    "duration": 150,
                                    "cue": "Gentle thoracic twist on all fours, releasing tension along thoracic spine and between scapulae.",
                                    "frames": [
                                                "/exercises/thread_the_needle_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supported Bridge on Soft Block",
                                    "duration": 150,
                                    "cue": "Pelvis resting on low foam block, letting hip flexors open passively without glute contraction.",
                                    "frames": [
                                                "/exercises/supported_bridge_block_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Supine Gentle Twist with Bolster",
                                    "duration": 150,
                                    "cue": "Drop knees to side onto a bolster, keeping opposite shoulder flat for restorative spinal ease.",
                                    "frames": [
                                                "/exercises/gentle_supine_torso_twist_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Legs-Elevated Relaxation (Wall or Bolster)",
                                    "duration": 150,
                                    "cue": "Elevate legs up on wall or bolster to unload circulatory and lymphatic pressure before sleep.",
                                    "frames": [
                                                "/exercises/legs_elevated_relaxation_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Corpse Pose Deep Relaxation (Savasana)",
                                    "duration": 150,
                                    "cue": "Fully supported corpse pose with eye pillow, entering deep restful restorative state.",
                                    "frames": [
                                                "/exercises/restorative_savasana.jpg"
                                    ]
                        }
            ]
},
                "p1": {
            "id": "p1",
            "name": "Neutral Pelvis & Transverse Abdominis Activation",
            "title": "Neutral Pelvis & Transverse Abdominis Activation",
            "category": "pilates",
            "focus_areas": [
                        "pelvis",
                        "transverse abdominis",
                        "deep core",
                        "neutral spine"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Core Re-education",
            "instruction": "Foundational clinical Pilates establishing neutral lumbopelvic alignment, sub-maximal transverse abdominis recruitment, and diaphragmatic dissociation without pelvic tucking.",
            "description": "Foundational clinical Pilates establishing neutral lumbopelvic alignment, sub-maximal transverse abdominis recruitment, and diaphragmatic dissociation without pelvic tucking.",
            "precautions": [
                        "Do not tilt pelvis into excessive posterior or anterior tuck.",
                        "Keep contraction sub-maximal (20-30%)."
            ],
            "contraindications": [
                        "acute abdominal wall tear or hernia"
            ],
            "steps": [
                        {
                                    "title": "Finding Neutral Spine",
                                    "duration": 60,
                                    "cue": "Lie supine hooklying. Rock pelvis between anterior and posterior tilt to settle on relaxed neutral balance.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts.jpg"
                                    ]
                        },
                        {
                                    "title": "Transverse Abdominis Draw-In",
                                    "duration": 75,
                                    "cue": "Breathe out gently and draw navel toward spine by 20-30%, engaging deep corset without moving pelvis.",
                                    "frames": [
                                                "/exercises/pilates_ta_draw_in_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supine Heel Slides",
                                    "duration": 90,
                                    "cue": "Maintain steady neutral pelvis as one heel slides away along the mat, then slide slowly back.",
                                    "frames": [
                                                "/exercises/pilates_heel_slide_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Restorative Pelvic Rest",
                                    "duration": 75,
                                    "cue": "Rest in constructive rest with knees resting together, allowing deep core and hip flexors to fully relax.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "p2": {
            "id": "p2",
            "name": "Deadbug & Lumbar Control",
            "title": "Deadbug & Lumbar Control",
            "category": "pilates",
            "focus_areas": [
                        "lumbar control",
                        "anterior chain",
                        "anti-extension",
                        "coordination"
            ],
            "duration_minutes": 6,
            "intensity": "Gentle to Moderate",
            "instruction": "Progressive anti-extension loading: limb reaches while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
            "description": "Progressive anti-extension loading: limb reaches while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
            "precautions": [
                        "Lower limb only as far as you can maintain neutral lower back.",
                        "Stop if lower back arches off mat."
            ],
            "contraindications": [
                        "acute spondylolisthesis grade 3+"
            ],
            "steps": [
                        {
                                    "title": "Deadbug Level 1 (Arm Reach Only)",
                                    "duration": 75,
                                    "cue": "Feet flat on floor, reach one arm slowly overhead while keeping ribs connected and lumbar neutral.",
                                    "frames": [
                                                "/exercises/pilates_deadbug_level1_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Deadbug Level 2 (Heel Tap Only)",
                                    "duration": 90,
                                    "cue": "Bring knees to 90/90 tabletop. Slowly lower one heel toward the mat, hinging at hip without arching back.",
                                    "frames": [
                                                "/exercises/pilates_deadbug_level2_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Deadbug Level 3 (Opposite Arm & Leg)",
                                    "duration": 105,
                                    "cue": "Simultaneously reach opposite arm and leg away. Return smoothly, keeping spine glued to neutral.",
                                    "frames": [
                                                "/exercises/pilates_deadbug_level3_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Knees to Chest Neutral Reset",
                                    "duration": 60,
                                    "cue": "Gently hug both knees toward chest to unload lower back and reset hip flexors.",
                                    "frames": [
                                                "/exercises/knee_to_chest_stretch.jpg"
                                    ]
                        }
            ]
},
        "p3": {
            "id": "p3",
            "name": "Quadruped Bird-Dog Stabilization",
            "title": "Quadruped Bird-Dog Stabilization",
            "category": "pilates",
            "focus_areas": [
                        "multifidus",
                        "glutes",
                        "posterior oblique sling",
                        "rotary stability"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Stabilization",
            "instruction": "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
            "description": "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
            "precautions": [
                        "Do not lift leg above hip level to avoid lumbar extension arching.",
                        "Maintain chin tuck."
            ],
            "contraindications": [
                        "acute wrist fracture or carpal tunnel flare-up"
            ],
            "steps": [
                        {
                                    "title": "Quadruped Neutral Alignment",
                                    "duration": 60,
                                    "cue": "Hands under shoulders, knees under hips. Find flat neutral spine and gently engage transverse core.",
                                    "frames": [
                                                "/exercises/pilates_birddog_tabletop_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Bird-Dog Reach (Right Arm, Left Leg)",
                                    "duration": 90,
                                    "cue": "Reach right arm forward and left leg straight back to hip height. Hold 6s without tilting pelvis.",
                                    "frames": [
                                                "/exercises/pilates_birddog_reach_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Bird-Dog Reach (Left Arm, Right Leg)",
                                    "duration": 90,
                                    "cue": "Reach left arm forward and right leg back. Keep hips parallel to floor and core braced.",
                                    "frames": [
                                                "/exercises/pilates_birddog_reach_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Child's Pose Decompression",
                                    "duration": 60,
                                    "cue": "Sink hips back to heels and lengthen arms forward, resting forehead down to decompress spine.",
                                    "frames": [
                                                "/exercises/supported_childs_pose_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "p4": {
            "id": "p4",
            "name": "Side-Lying Clamshell & Glute Medius",
            "title": "Side-Lying Clamshell & Glute Medius",
            "category": "pilates",
            "focus_areas": [
                        "gluteus medius",
                        "hip stability",
                        "pelvic level",
                        "Trendelenburg control"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Isolation",
            "instruction": "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
            "description": "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
            "precautions": [
                        "Do not roll top hip backwards; keep hips stacked perpendicularly.",
                        "Movement is small and targeted."
            ],
            "contraindications": [
                        "acute trochanteric bursitis flare-up with severe local pain"
            ],
            "steps": [
                        {
                                    "title": "Clamshell Level 1 (Right Side)",
                                    "duration": 75,
                                    "cue": "Lie on left side with knees bent 90\u00b0, hips stacked. Rotate top right knee open keeping feet together.",
                                    "frames": [
                                                "/exercises/pilates_clamshell_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Side-Lying Leg Lift (Right Side)",
                                    "duration": 75,
                                    "cue": "Extend right leg straight. Lift leg 30\u00b0 with toes angled slightly downward to target posterior glute medius.",
                                    "frames": [
                                                "/exercises/pilates_side_leg_lift_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Clamshell Level 1 (Left Side)",
                                    "duration": 75,
                                    "cue": "Switch to right side. Open top left knee smoothly while keeping pelvis completely stable.",
                                    "frames": [
                                                "/exercises/pilates_clamshell_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Side-Lying Leg Lift (Left Side)",
                                    "duration": 75,
                                    "cue": "Extend left leg straight, lift with control without rolling hips back.",
                                    "frames": [
                                                "/exercises/pilates_side_leg_lift_left_hud.svg"
                                    ]
                        }
            ]
},
        "p5": {
            "id": "p5",
            "name": "Glute Bridge & Hip Extension Articulation",
            "title": "Glute Bridge & Hip Extension Articulation",
            "category": "pilates",
            "focus_areas": [
                        "gluteus maximus",
                        "hamstrings",
                        "pelvic articulation",
                        "hip extension"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle to Moderate",
            "instruction": "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
            "description": "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
            "precautions": [
                        "Drive through heels and squeeze glutes; avoid arching lower back at peak."
            ],
            "contraindications": [
                        "acute lumbar disc herniation with extension sensitivity"
            ],
            "steps": [
                        {
                                    "title": "Basic Glute Bridge (Feet Flat)",
                                    "duration": 75,
                                    "cue": "Drive through heels to lift hips to knee height, squeezing glutes firmly without arching lower back.",
                                    "frames": [
                                                "/exercises/hip_glute_bridge_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Bridge with Pelvic Squeeze",
                                    "duration": 75,
                                    "cue": "At top of bridge, place a block or imagine squeezing knees together to recruit adductors and pelvic base.",
                                    "frames": [
                                                "/exercises/pilates_bridge_pelvic_squeeze_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Single Leg Bridge Marching",
                                    "duration": 90,
                                    "cue": "Hold steady bridge while lifting one foot 2 inches off mat in alternating march, keeping pelvis level.",
                                    "frames": [
                                                "/exercises/pilates_bridge_marching_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Spine Articulation Roll Down",
                                    "duration": 60,
                                    "cue": "Lower spine vertebra-by-vertebra down to mat, finishing by settling into neutral pelvis.",
                                    "frames": [
                                                "/exercises/pilates_bridge_roll_down_hud.svg"
                                    ]
                        }
            ]
},
        "p6": {
            "id": "p6",
            "name": "Pilates Hundred (Neutral Spine Adaptation)",
            "title": "Pilates Hundred (Neutral Spine Adaptation)",
            "category": "pilates",
            "focus_areas": [
                        "cardiorespiratory",
                        "transverse core",
                        "endurance",
                        "cervical safety"
            ],
            "duration_minutes": 5,
            "intensity": "Moderate Endurance",
            "instruction": "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
            "description": "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
            "precautions": [
                        "Head stays grounded if cervical fusion/strain is present.",
                        "Breathe through diaphragm, not chest."
            ],
            "contraindications": [
                        "uncontrolled hypertension"
            ],
            "steps": [
                        {
                                    "title": "Arm Pump Preparation",
                                    "duration": 60,
                                    "cue": "Lie supine with knees in tabletop, head resting comfortably on mat. Hover arms 2 inches off floor.",
                                    "frames": [
                                                "/exercises/pilates_hundred_prep_hud.svg"
                                    ]
                        },
                        {
                                    "title": "The Hundred: Set 1-50",
                                    "duration": 75,
                                    "cue": "Pump arms vigorously with inhale for 5 counts and exhale for 5 counts, keeping core engaged.",
                                    "frames": [
                                                "/exercises/pilates_hundred_pulse_hud.svg"
                                    ]
                        },
                        {
                                    "title": "The Hundred: Set 51-100",
                                    "duration": 75,
                                    "cue": "Maintain rhythmic arm pulses and controlled breathing, keeping lower back anchored in neutral.",
                                    "frames": [
                                                "/exercises/pilates_hundred_endurance_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Full Body Stretch Release",
                                    "duration": 60,
                                    "cue": "Extend arms overhead and legs long on mat, taking deep diaphragmatic breaths to release core.",
                                    "frames": [
                                                "/exercises/restorative_savasana.jpg"
                                    ]
                        }
            ]
},
        "p7": {
            "id": "p7",
            "name": "Spine Twist & Thoracic Mobility",
            "title": "Spine Twist & Thoracic Mobility",
            "category": "pilates",
            "focus_areas": [
                        "thoracic rotation",
                        "ribcage",
                        "obliques",
                        "seated mobility"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Rotational",
            "instruction": "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
            "description": "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
            "precautions": [
                        "Rotation comes purely from ribs/chest, not twisting lower back."
            ],
            "contraindications": [
                        "acute rib fracture or costochondritis flare-up"
            ],
            "steps": [
                        {
                                    "title": "Seated Spine Twist with Ball",
                                    "duration": 75,
                                    "cue": "Sit tall holding ball at chest. Rotate ribcage smoothly left and right, keeping pelvis anchored.",
                                    "frames": [
                                                "/exercises/pilates_seated_spine_twist_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Side-Lying Pinwheel Arm Flow (Right)",
                                    "duration": 75,
                                    "cue": "Lie on left side with knees bent. Sweep right arm in a wide circular arc overhead and open to side.",
                                    "frames": [
                                                "/exercises/open_book_right_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Opposite Side Pinwheel (Left)",
                                    "duration": 75,
                                    "cue": "Lie on right side. Sweep left arm overhead and across in full circle, following with relaxed gaze.",
                                    "frames": [
                                                "/exercises/open_book_left_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Restorative Relaxation Breath",
                                    "duration": 60,
                                    "cue": "Rest in constructive rest, allowing thoracic spine and shoulders to soften into mat.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "p8": {
            "id": "p8",
            "name": "Single Leg Stretch & Core Control",
            "title": "Single Leg Stretch & Core Control",
            "category": "pilates",
            "focus_areas": [
                        "anterior chain",
                        "hip disassociation",
                        "lumbar control",
                        "hip flexors"
            ],
            "duration_minutes": 5,
            "intensity": "Moderate",
            "instruction": "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
            "description": "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
            "precautions": [
                        "Keep head down if experiencing neck fatigue.",
                        "Reach extended leg at 45\u00b0 to reduce shear."
            ],
            "contraindications": [
                        "acute inguinal hernia"
            ],
            "steps": [
                        {
                                    "title": "Single Leg Stretch (Head Down)",
                                    "duration": 75,
                                    "cue": "Head grounded. Hug right knee toward chest while extending left leg 45\u00b0 off mat. Hold with neutral core.",
                                    "frames": [
                                                "/exercises/pilates_single_leg_stretch_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Double Leg Tap Adaptation",
                                    "duration": 75,
                                    "cue": "Both knees in tabletop. Lower both toes toward mat together from hips, stopping before back arches.",
                                    "frames": [
                                                "/exercises/pilates_double_leg_tap_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Single Leg Stretch Set 2",
                                    "duration": 90,
                                    "cue": "Switch sides dynamically, reaching one leg long as opposite knee draws in with smooth breathing.",
                                    "frames": [
                                                "/exercises/pilates_single_leg_alternation_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Knees to Chest Reset",
                                    "duration": 60,
                                    "cue": "Hug both knees comfortably toward chest to restore neutral lower back curve.",
                                    "frames": [
                                                "/exercises/knee_to_chest_stretch.jpg"
                                    ]
                        }
            ]
},
        "p9": {
            "id": "p9",
            "name": "Shoulder Bridge & Articulation",
            "title": "Shoulder Bridge & Articulation",
            "category": "pilates",
            "focus_areas": [
                        "spinal articulation",
                        "hamstrings",
                        "glutes",
                        "thoracic extension"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Articulation",
            "instruction": "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
            "description": "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
            "precautions": [
                        "Weight stays on shoulder blades, never pressing into cervical neck."
            ],
            "contraindications": [
                        "cervical spine instability or acute anterior cervical fusion"
            ],
            "steps": [
                        {
                                    "title": "Pelvic Curl Preparation",
                                    "duration": 60,
                                    "cue": "Inhale prepare, exhale imprint lower back and peel sacrum slightly off mat, warming segmental spine.",
                                    "frames": [
                                                "/exercises/supine_pelvic_tilts.jpg"
                                    ]
                        },
                        {
                                    "title": "Full Segmental Bridge Roll",
                                    "duration": 75,
                                    "cue": "Roll spine up to bridge one vertebra at a time until hips and knees form a straight line.",
                                    "frames": [
                                                "/exercises/hip_glute_bridge_hud.jpg"
                                    ]
                        },
                        {
                                    "title": "Bridge with Arm Reaches",
                                    "duration": 75,
                                    "cue": "Hold top of bridge, float arms overhead to floor, then slowly roll spine down before lowering arms.",
                                    "frames": [
                                                "/exercises/pilates_bridge_overhead_reach_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Supine Rest",
                                    "duration": 60,
                                    "cue": "Rest flat on back with knees bent and feet wide, letting lumbar spine decompress completely.",
                                    "frames": [
                                                "/exercises/constructive_rest_bolster_hud.jpg"
                                    ]
                        }
            ]
},
        "p10": {
            "id": "p10",
            "name": "Swimming & Posterior Chain Endurance",
            "title": "Swimming & Posterior Chain Endurance",
            "category": "pilates",
            "focus_areas": [
                        "posterior chain",
                        "erector spinae",
                        "glutes",
                        "scapula",
                        "prone endurance"
            ],
            "duration_minutes": 5,
            "intensity": "Gentle Endurance",
            "instruction": "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
            "description": "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
            "precautions": [
                        "Place small pillow under lower abdomen/pelvis to prevent hyperextension."
            ],
            "contraindications": [
                        "active abdominal surgical incision"
            ],
            "steps": [
                        {
                                    "title": "Prone Arm Float Only",
                                    "duration": 60,
                                    "cue": "Lie prone with pillow under pelvis. Lift alternating arms 2 inches off mat, keeping forehead grounded.",
                                    "frames": [
                                                "/exercises/pilates_swimming_arm_float_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Prone Leg Float Only",
                                    "duration": 60,
                                    "cue": "Rest forehead on hands. Squeeze glute to float one leg straight off mat without arching lumbar spine.",
                                    "frames": [
                                                "/exercises/pilates_swimming_leg_float_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Slow Swimming Flutter",
                                    "duration": 90,
                                    "cue": "Simultaneously float right arm and left leg, then switch in slow, controlled rhythm.",
                                    "frames": [
                                                "/exercises/pilates_swimming_contralateral_hud.svg"
                                    ]
                        },
                        {
                                    "title": "Prone Relaxation & Breath",
                                    "duration": 60,
                                    "cue": "Rest in supported sphinx or child's pose, breathing deeply into lower back to release all tension.",
                                    "frames": [
                                                "/exercises/supported_childs_pose_bolster_hud.jpg"
                                    ]
                        }
            ]
},
          "s1": {
    "id": "s1",
    "name": "Piriformis & Deep Glute Stretch",
    "title": "Piriformis & Deep Glute Stretch",
    "category": "stretches",
    "focus_areas": [
      "glutes",
      "piriformis",
      "sciatic_nerve",
      "hips"
    ],
    "duration_minutes": 12,
    "intensity": "Gentle Restorative",
    "description": "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    "instruction": "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    "precautions": [
      "Avoid forcing knee toward opposite shoulder if hip impingement or labral symptoms occur. Keep neck relaxed."
    ],
    "contraindications": [
      "Acute severe sciatica with motor deficit",
      "Recent hip replacement"
    ],
    "steps": [
      {
        "title": "Supine Figure-4 (Right)",
        "duration": 180,
        "cue": "Cross right ankle over left thigh, reach through and draw left leg in toward chest. Relax shoulders.",
        "frames": [
          "/exercises/hip_figure_four_right_hud.svg"
        ]
      },
      {
        "title": "Supine Figure-4 (Left)",
        "duration": 180,
        "cue": "Cross left ankle over right knee, clasp behind right hamstring, drawing leg toward chest.",
        "frames": [
          "/exercises/hip_figure_four_left_hud.svg"
        ]
      },
      {
        "title": "Seated Chair Glute Stretch",
        "duration": 180,
        "cue": "Sit tall on chair edge, cross ankle over knee, hinge forward from hips with flat spine.",
        "frames": [
          "/exercises/chair_seated_figure_four_right_hud.svg"
        ]
      },
      {
        "title": "Constructive Rest & Pelvic Release",
        "duration": 180,
        "cue": "Rest knees together or draped over bolster, letting pelvic floor and gluteal tension release completely.",
        "frames": [
          "/exercises/constructive_rest_bolster_hud.jpg"
        ]
      }
    ]
  },
  "s2": {
    "id": "s2",
    "name": "Cervical Scalene & Upper Trap Release",
    "title": "Cervical Scalene & Upper Trap Release",
    "category": "stretches",
    "focus_areas": [
      "neck",
      "scalenes",
      "levator_scapulae",
      "upper_trapezius"
    ],
    "duration_minutes": 10,
    "intensity": "Gentle Restorative",
    "description": "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    "instruction": "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    "precautions": [
      "Never pull or yank the head. Use only the weight of your hand for gentle overpressure."
    ],
    "contraindications": [
      "Vertebrobasilar insufficiency",
      "Acute cervical radiculopathy"
    ],
    "steps": [
      {
        "title": "Scalene Anterior Stretch (Right)",
        "duration": 150,
        "cue": "Tilt head gently to right, rotate chin 15 degrees upward to feel stretch along the left anterior neck.",
        "frames": [
          "/exercises/cervical_scalene_right_hud.svg"
        ]
      },
      {
        "title": "Levator Scapulae 'Nose to Armpit'",
        "duration": 150,
        "cue": "Turn head 45 degrees to right, gently drop chin toward right armpit feeling postero-lateral neck stretch.",
        "frames": [
          "/exercises/levator_scapulae_stretch_hud.svg"
        ]
      },
      {
        "title": "Scalene Anterior Stretch (Left)",
        "duration": 150,
        "cue": "Tilt head gently to left, rotate chin 15 degrees upward to elongate the right anterior scalene.",
        "frames": [
          "/exercises/cervical_scalene_left_hud.svg"
        ]
      },
      {
        "title": "Suboccipital Nod Release",
        "duration": 150,
        "cue": "Perform tiny nodding motions at skull base like saying 'yes' without flexing your lower neck.",
        "frames": [
          "/exercises/suboccipital_nod_release_hud.svg"
        ]
      }
    ]
  },
  "s3": {
    "id": "s3",
    "name": "Hamstring Doorframe Decompression",
    "title": "Hamstring Doorframe Decompression",
    "category": "stretches",
    "focus_areas": [
      "hamstrings",
      "sciatic_nerve",
      "pelvis",
      "lumbar"
    ],
    "duration_minutes": 15,
    "intensity": "Gentle Restorative",
    "description": "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    "instruction": "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    "precautions": [
      "Keep pelvis flat on floor. Do not allow lower back to peel or curl off the mat."
    ],
    "contraindications": [
      "Acute hamstring tear",
      "Acute disc herniation in flexion"
    ],
    "steps": [
      {
        "title": "Doorframe Stretch (Right Leg)",
        "duration": 225,
        "cue": "Right leg extended up doorframe, left leg flat on floor through doorway. Breathe deeply with pelvis level.",
        "frames": [
          "/exercises/doorframe_hamstring_right_hud.svg"
        ]
      },
      {
        "title": "Doorframe Stretch (Left Leg)",
        "duration": 225,
        "cue": "Switch sides. Left leg up frame, right leg flat along floor. Relax hips and sacrum flat against mat.",
        "frames": [
          "/exercises/doorframe_hamstring_left_hud.svg"
        ]
      },
      {
        "title": "Doorframe Sciatic Floss",
        "duration": 225,
        "cue": "Point and flex toes rhythmically while leg is elevated to gently glide the sciatic pathway without strain.",
        "frames": [
          "/exercises/doorframe_ankle_pumps_hud.svg"
        ]
      },
      {
        "title": "Supine Rest & Neural Reset",
        "duration": 225,
        "cue": "Lower both legs down, resting pelvis in complete neutral with smooth diaphragmatic breaths.",
        "frames": [
          "/exercises/restorative_savasana.jpg"
        ]
      }
    ]
  },
  "s4": {
    "id": "s4",
    "name": "Thoracic Open Book Mobility",
    "title": "Thoracic Open Book Mobility",
    "category": "stretches",
    "focus_areas": [
      "thoracic_spine",
      "ribcage",
      "pectorals",
      "shoulders"
    ],
    "duration_minutes": 12,
    "intensity": "Adaptive Mobility",
    "description": "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    "instruction": "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    "precautions": [
      "Keep knees clamped together to lock out lumbar rotation and isolate thoracic mobility."
    ],
    "contraindications": [
      "Severe osteoporotic thoracic compression fracture",
      "Acute rib fracture"
    ],
    "steps": [
      {
        "title": "Open Book Dynamic Rotation (Right)",
        "duration": 180,
        "cue": "Side-lying on left with knees stacked at 90 degrees. Sweep right arm in a wide arc open across body.",
        "frames": [
          "/exercises/open_book_right_hud.svg"
        ]
      },
      {
        "title": "Open Book Static Hold (Right)",
        "duration": 180,
        "cue": "Hold right arm open at end-range, breathing deeply into right rib cage while keeping knees pinned together.",
        "frames": [
          "/exercises/open_book_static_hold_right_hud.svg"
        ]
      },
      {
        "title": "Open Book Dynamic Rotation (Left)",
        "duration": 180,
        "cue": "Lie on right side with knees stacked. Sweep left arm open across body, tracking thumb with eyes.",
        "frames": [
          "/exercises/open_book_left_hud.svg"
        ]
      },
      {
        "title": "Open Book Static Hold (Left)",
        "duration": 180,
        "cue": "Hold left arm open at end-range for sustained lateral expansion and ribcage ventilation.",
        "frames": [
          "/exercises/open_book_static_hold_left_hud.svg"
        ]
      }
    ]
  },
  "s5": {
    "id": "s5",
    "name": "Gastrocnemius & Soleus Calf Stretch",
    "title": "Gastrocnemius & Soleus Calf Stretch",
    "category": "stretches",
    "focus_areas": [
      "calves",
      "gastrocnemius",
      "soleus",
      "achilles",
      "ankles"
    ],
    "duration_minutes": 10,
    "intensity": "Adaptive Mobility",
    "description": "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    "instruction": "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    "precautions": [
      "Keep rear heel firmly glued to floor and toes pointing straight forward, not splayed out."
    ],
    "contraindications": [
      "Acute Achilles tendon rupture",
      "Severe calf strain"
    ],
    "steps": [
      {
        "title": "Straight-Leg Gastrocnemius (Right)",
        "duration": 150,
        "cue": "Hands against wall, step right leg straight back, press heel into floor with kneecap lifted.",
        "frames": [
          "/exercises/wall_calf_gastroc_right_hud.svg"
        ]
      },
      {
        "title": "Bent-Knee Soleus (Right)",
        "duration": 150,
        "cue": "Softly bend right back knee 20 degrees while keeping heel pinned down to isolate the deeper soleus.",
        "frames": [
          "/exercises/wall_calf_soleus_right_hud.svg"
        ]
      },
      {
        "title": "Straight-Leg Gastrocnemius (Left)",
        "duration": 150,
        "cue": "Step left leg straight back, driving heel firmly down into floor with toes aligned forward.",
        "frames": [
          "/exercises/wall_calf_gastroc_left_hud.svg"
        ]
      },
      {
        "title": "Bent-Knee Soleus (Left)",
        "duration": 150,
        "cue": "Bend back left knee slightly, keeping heel anchored to shift stretch into lower Achilles.",
        "frames": [
          "/exercises/wall_calf_soleus_left_hud.svg"
        ]
      }
    ]
  },
  "s6": {
    "id": "s6",
    "name": "Quadriceps & Rectus Femoris Wall Stretch",
    "title": "Quadriceps & Rectus Femoris Wall Stretch",
    "category": "stretches",
    "focus_areas": [
      "quadriceps",
      "rectus_femoris",
      "hip_flexors",
      "knees"
    ],
    "duration_minutes": 12,
    "intensity": "Adaptive Mobility",
    "description": "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    "instruction": "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    "precautions": [
      "Avoid overarching the lumbar spine. Engage core gently and tuck pelvis to protect lower back."
    ],
    "contraindications": [
      "Patellar subluxation",
      "Severe meniscus tear in deep flexion"
    ],
    "steps": [
      {
        "title": "Side-Lying Quad Stretch (Right)",
        "duration": 180,
        "cue": "Lie on left side, grasp right ankle with right hand, gently draw heel toward glute with knees together.",
        "frames": [
          "/exercises/side_lying_quad_right_hud.svg"
        ]
      },
      {
        "title": "Side-Lying Quad Stretch (Left)",
        "duration": 180,
        "cue": "Switch sides, lie on right side, draw left heel back toward glute keeping pelvis tucked neutral.",
        "frames": [
          "/exercises/side_lying_quad_left_hud.svg"
        ]
      },
      {
        "title": "Prone Quad Stretch with Strap",
        "duration": 180,
        "cue": "Lie prone, loop strap around ankle if reaching is difficult, gently drawing heel toward glute.",
        "frames": [
          "/exercises/prone_quad_strap_hud.svg"
        ]
      },
      {
        "title": "Prone Hip Rocking Reset",
        "duration": 180,
        "cue": "Lie face down and gently rock hips side-to-side to release hip flexor and lumbar tension.",
        "frames": [
          "/exercises/prone_hip_rocking_hud.svg"
        ]
      }
    ]
  },
  "s7": {
    "id": "s7",
    "name": "Latissimus Dorsi & Side Body Opener",
    "title": "Latissimus Dorsi & Side Body Opener",
    "category": "stretches",
    "focus_areas": [
      "latissimus_dorsi",
      "thoracolumbar_fascia",
      "intercostals",
      "shoulders"
    ],
    "duration_minutes": 12,
    "intensity": "Adaptive Mobility",
    "description": "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    "instruction": "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    "precautions": [
      "Ease out of lateral reach if any pinch is felt in anterior shoulder or hip crease."
    ],
    "contraindications": [
      "Subacromial impingement with severe sharp pain",
      "Acute shoulder dislocation"
    ],
    "steps": [
      {
        "title": "Side-Reaching Child's Pose (Right)",
        "duration": 180,
        "cue": "From child's pose, walk both hands diagonally left, anchoring right hip back onto heel to stretch right lat.",
        "frames": [
          "/exercises/childs_pose_side_reach_right_hud.svg"
        ]
      },
      {
        "title": "Side-Reaching Child's Pose (Left)",
        "duration": 180,
        "cue": "Walk hands diagonally right, keeping left hip grounded on heel, breathing into left flank.",
        "frames": [
          "/exercises/childs_pose_side_reach_left_hud.svg"
        ]
      },
      {
        "title": "Doorframe Lat Hang Decompression",
        "duration": 180,
        "cue": "Grip doorframe at shoulder height, sink hips back and away to create gentle spinal and lat traction.",
        "frames": [
          "/exercises/doorframe_lat_hang_hud.svg"
        ]
      },
      {
        "title": "Restorative Center Breath",
        "duration": 180,
        "cue": "Lie back in neutral, breathing 360 degrees into lateral ribcage and belly.",
        "frames": [
          "/exercises/diaphragmatic_breathing_hud.jpg"
        ]
      }
    ]
  },
  "s8": {
    "id": "s8",
    "name": "Wrist, Forearm & Median Nerve Floss",
    "title": "Wrist, Forearm & Median Nerve Floss",
    "category": "stretches",
    "focus_areas": [
      "wrists",
      "forearms",
      "median_nerve",
      "carpal_tunnel"
    ],
    "duration_minutes": 10,
    "intensity": "Gentle Restorative",
    "description": "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    "instruction": "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    "precautions": [
      "Never push nerve glides into pain, sharp tingling, or numbness. Keep movements smooth and oscillating."
    ],
    "contraindications": [
      "Acute median nerve compression requiring decompression",
      "Recent wrist fracture"
    ],
    "steps": [
      {
        "title": "Wrist Flexor Stretch",
        "duration": 150,
        "cue": "Extend right arm forward palm outward fingers pointing down. Gently draw fingers back with opposite hand.",
        "frames": [
          "/exercises/wrist_flexor_stretch_hud.svg"
        ]
      },
      {
        "title": "Wrist Extensor Stretch",
        "duration": 150,
        "cue": "Extend arm palm facing inward fingers curled down. Gently press on back of hand toward body.",
        "frames": [
          "/exercises/wrist_extensor_stretch_hud.svg"
        ]
      },
      {
        "title": "Median Nerve Gliding Flow",
        "duration": 150,
        "cue": "Extend arm out to side, extend wrist back, gently tilt head to opposite side, then release in rhythmic cycles.",
        "frames": [
          "/exercises/median_nerve_glide_hud.svg"
        ]
      },
      {
        "title": "Wrist Circles & Finger Shakes",
        "duration": 150,
        "cue": "Rotate wrists through smooth 360-degree circles, then shake hands and fingers out lightly.",
        "frames": [
          "/exercises/wrist_circles_shakes_hud.svg"
        ]
      }
    ]
  },
  "s9": {
    "id": "s9",
    "name": "Pectoralis Doorway & Anterior Chest Opener",
    "title": "Pectoralis Doorway & Anterior Chest Opener",
    "category": "stretches",
    "focus_areas": [
      "pectorals",
      "anterior_deltoid",
      "thoracic_spine",
      "shoulders"
    ],
    "duration_minutes": 10,
    "intensity": "Adaptive Mobility",
    "description": "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    "instruction": "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    "precautions": [
      "Do not hyperextend lumbar spine when stepping forward; maintain tall, stacked ribs over pelvis."
    ],
    "contraindications": [
      "Anterior glenohumeral instability",
      "Pectoralis tendon repair"
    ],
    "steps": [
      {
        "title": "90-Degree Doorway Pec Major (Right)",
        "duration": 150,
        "cue": "Place right elbow and forearm against doorframe at 90 degrees. Step right foot forward until chest opens.",
        "frames": [
          "/exercises/doorway_pec_90_right_hud.svg"
        ]
      },
      {
        "title": "120-Degree High Doorway Pec Minor (Right)",
        "duration": 150,
        "cue": "Raise right elbow higher to 120 degrees on frame to target deep pectoralis minor fibers.",
        "frames": [
          "/exercises/doorway_pec_120_right_hud.svg"
        ]
      },
      {
        "title": "Doorway Pec Stretch (Left Side)",
        "duration": 150,
        "cue": "Repeat on left side at 90 and 120-degree angles, stepping left foot forward with relaxed neck.",
        "frames": [
          "/exercises/doorway_pec_left_hud.svg"
        ]
      },
      {
        "title": "Scapular Rolls & Posture Reset",
        "duration": 150,
        "cue": "Roll shoulders up, back, and down 5-8 times, settling scapulae flat against ribcage.",
        "frames": [
          "/exercises/shoulder_rolls_reset_hud.svg"
        ]
      }
    ]
  },
  "s10": {
    "id": "s10",
    "name": "Ankle Dorsiflexion & Plantar Fascia Mobility",
    "title": "Ankle Dorsiflexion & Plantar Fascia Mobility",
    "category": "stretches",
    "focus_areas": [
      "ankles",
      "plantar_fascia",
      "feet",
      "tibialis_anterior"
    ],
    "duration_minutes": 10,
    "intensity": "Adaptive Mobility",
    "description": "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    "instruction": "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    "precautions": [
      "Avoid sharp pain on bottom of heel. Use moderate, tolerable pressure when rolling ball."
    ],
    "contraindications": [
      "Acute severe plantar fasciitis flare",
      "Recent ankle syndesmosis injury"
    ],
    "steps": [
      {
        "title": "Half-Kneeling Ankle Rocking (Right)",
        "duration": 150,
        "cue": "Half-kneeling with right foot forward, drive knee forward over second toe while keeping right heel pinned flat.",
        "frames": [
          "/exercises/ankle_rocking_half_kneeling_right_hud.svg"
        ]
      },
      {
        "title": "Half-Kneeling Ankle Rocking (Left)",
        "duration": 150,
        "cue": "Switch sides, driving left knee forward over toes to mobilize left ankle dorsiflexion without lifting heel.",
        "frames": [
          "/exercises/ankle_rocking_half_kneeling_left_hud.svg"
        ]
      },
      {
        "title": "Plantar Fascia Ball Mobilization",
        "duration": 150,
        "cue": "Stand or sit, roll tennis ball slowly along the longitudinal arch of each foot, pausing on tight trigger points.",
        "frames": [
          "/exercises/tennis_ball_plantar_roll_hud.svg"
        ]
      },
      {
        "title": "Seated Intrinsic Toe Spreading",
        "duration": 150,
        "cue": "Actively spread and fan all ten toes wide, lifting and pressing them down to activate deep foot intrinsic muscles.",
        "frames": [
          "/exercises/seated_toe_spreading_hud.svg"
        ]
      }
    ]
  },
  "r1": {
    "id": "r1",
    "name": "McGill Big 3 Spinal Stabilization",
    "title": "McGill Big 3 Spinal Stabilization",
    "category": "rehab",
    "focus_areas": [
      "lumbar spine",
      "core",
      "quadratus lumborum",
      "multifidus"
    ],
    "duration_minutes": 20,
    "intensity": "Stabilization",
    "instruction": "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    "description": "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    "precautions": [
      "Hands stay under lumbar spine during curl-up; no spinal flexion."
    ],
    "contraindications": [
      "Acute severe spinal fracture",
      "Unstable disc sequestration"
    ],
    "steps": [
      {
        "title": "McGill Modified Curl-Up",
        "duration": 300,
        "cue": "Hands under lumbar spine, one knee bent at 90°, opposite leg straight. Lift head and shoulder blades 1 inch off floor without bending neck. Hold 6s.",
        "frames": [
          "/exercises/mcgill_curl_up_hud.svg"
        ]
      },
      {
        "title": "McGill Side Bridge (From Knees)",
        "duration": 300,
        "cue": "Prop onto elbow and knees, align shoulder-hip-knee in straight line, elevate pelvis. Hold 6s per repetition, alternating sides.",
        "frames": [
          "/exercises/mcgill_side_bridge_hud.svg"
        ]
      },
      {
        "title": "McGill Quadruped Bird-Dog",
        "duration": 300,
        "cue": "From hands and knees, brace abdominal wall and extend opposite arm and leg parallel to floor. Hold 6s without pelvic rotation.",
        "frames": [
          "/exercises/mcgill_bird_dog_hud.svg"
        ]
      },
      {
        "title": "Spine Decompression Rest",
        "duration": 300,
        "cue": "Rest back hips towards heels, chest supported on bolster or mat, relaxing lumbar paraspinals.",
        "frames": [
          "/exercises/supported_childs_pose.jpg"
        ]
      }
    ]
  },
  "r2": {
    "id": "r2",
    "name": "Sciatic Nerve Flossing Protocol",
    "title": "Sciatic Nerve Flossing Protocol",
    "category": "rehab",
    "focus_areas": [
      "sciatic nerve",
      "hamstrings",
      "lumbar roots",
      "dura"
    ],
    "duration_minutes": 12,
    "intensity": "Gentle Restorative",
    "instruction": "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    "description": "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    "precautions": [
      "Never pull into sharp radiating pain; flossing should be gentle and rhythmic."
    ],
    "contraindications": [
      "Acute progressive cauda equina syndrome",
      "Severe acute radicular inflammation"
    ],
    "steps": [
      {
        "title": "Seated Sciatic Slider Setup",
        "duration": 180,
        "cue": "Sit upright on edge of firm chair, hands clasped behind lumbar spine, neutral pelvis, feet flat on floor.",
        "frames": [
          "/exercises/seated_sciatic_slider_setup_hud.svg"
        ]
      },
      {
        "title": "Sciatic Slider (Right Leg)",
        "duration": 180,
        "cue": "Slowly extend right knee while tilting head back toward ceiling; bend knee as chin returns down toward chest. Smooth, tension-free glide.",
        "frames": [
          "/exercises/seated_sciatic_slider_right_hud.svg"
        ]
      },
      {
        "title": "Sciatic Slider (Left Leg)",
        "duration": 180,
        "cue": "Slowly extend left knee while looking UP at ceiling; flex knee while looking DOWN. Never force through acute nerve pain.",
        "frames": [
          "/exercises/seated_sciatic_slider_left_hud.svg"
        ]
      },
      {
        "title": "Supine Rest & Sensation Check",
        "duration": 180,
        "cue": "Lie flat on back with knees supported, observing neural calm and reduction in distal radiating symptoms.",
        "frames": [
          "/exercises/restorative_savasana.jpg"
        ]
      }
    ]
  },
  "r3": {
    "id": "r3",
    "name": "Cervical Retraction & Deep Neck Flexor Training",
    "title": "Cervical Retraction & Deep Neck Flexor Training",
    "category": "rehab",
    "focus_areas": [
      "longus colli",
      "longus capitis",
      "cervical spine"
    ],
    "duration_minutes": 12,
    "intensity": "Targeted Strengthening",
    "instruction": "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    "description": "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    "precautions": [
      "Do not use sternocleidomastoid (front surface muscles); keep jaw relaxed."
    ],
    "contraindications": [
      "Unstable cervical spine",
      "Vertebral artery insufficiency"
    ],
    "steps": [
      {
        "title": "Supine Chin Tuck (Cranial Nod)",
        "duration": 180,
        "cue": "Lie supine with small head towel. Gently nod chin as if rotating around ears, flattening back of neck toward floor without firing SCM.",
        "frames": [
          "/exercises/supine_chin_tuck_nod_hud.svg"
        ]
      },
      {
        "title": "Supine Chin Tuck with 5s Hold",
        "duration": 180,
        "cue": "Perform gentle cranial nod, hold isometric contraction for 5 seconds while breathing through nose, then relax slowly.",
        "frames": [
          "/exercises/supine_chin_tuck_hold_hud.svg"
        ]
      },
      {
        "title": "Wall Retraction with Foam Roller",
        "duration": 180,
        "cue": "Stand back against wall with soft ball or towel behind occiput. Gently press head straight back into support without tilting chin up.",
        "frames": [
          "/exercises/wall_cervical_retraction_hud.svg"
        ]
      },
      {
        "title": "Postural Breathing Reset",
        "duration": 180,
        "cue": "Sit tall with crown reaching toward ceiling, shoulders dropped, ribs expanding laterally on each nasal inhale.",
        "frames": [
          "/exercises/diaphragmatic_breathing_hud.jpg"
        ]
      }
    ]
  },
  "r4": {
    "id": "r4",
    "name": "Scapular Wall Slides & Serratus Activation",
    "title": "Scapular Wall Slides & Serratus Activation",
    "category": "rehab",
    "focus_areas": [
      "serratus anterior",
      "lower trapezius",
      "scapula",
      "thoracic"
    ],
    "duration_minutes": 15,
    "intensity": "Targeted Strengthening",
    "instruction": "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    "description": "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    "precautions": [
      "Keep forearms glued to wall and ribs tucked down."
    ],
    "contraindications": [
      "Acute acromioclavicular dislocation",
      "Severe acute rotator cuff tear"
    ],
    "steps": [
      {
        "title": "Forearm Wall Slide Setup",
        "duration": 225,
        "cue": "Forearms vertical on wall at shoulder width, elbows bent 90°, slight abdominal brace with neutral lumbar spine.",
        "frames": [
          "/exercises/scapular_wall_slide_setup_hud.svg"
        ]
      },
      {
        "title": "Wall Slide Upward Sweep",
        "duration": 225,
        "cue": "Slide forearms smoothly upward in a shallow 'V' shape, maintaining constant wall contact and upward scapular rotation.",
        "frames": [
          "/exercises/scapular_wall_slide_upward_hud.svg"
        ]
      },
      {
        "title": "Scapular Protraction Push-Plus (Wall)",
        "duration": 225,
        "cue": "Hands flat on wall at shoulder height. Push chest away from wall, broadening across shoulder blades without shrugging.",
        "frames": [
          "/exercises/scapular_push_plus_wall_hud.svg"
        ]
      },
      {
        "title": "Shoulder Roll Down",
        "duration": 225,
        "cue": "Roll shoulders up, back, and smoothly down, releasing upper trapezius and levator tension.",
        "frames": [
          "/exercises/shoulder_rolls_reset_hud.svg"
        ]
      }
    ]
  },
  "r5": {
    "id": "r5",
    "name": "Thoracic Outlet Syndrome Neuro-Mobility",
    "title": "Thoracic Outlet Syndrome Neuro-Mobility",
    "category": "rehab",
    "focus_areas": [
      "brachial plexus",
      "first rib",
      "pectoralis minor",
      "scalenes"
    ],
    "duration_minutes": 12,
    "intensity": "Gentle Restorative",
    "instruction": "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    "description": "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    "precautions": [
      "Do not stretch into tingling sensations; stay within comfortable boundaries."
    ],
    "contraindications": [
      "Subclavian artery thrombosis",
      "Severe vascular TOS needing surgery"
    ],
    "steps": [
      {
        "title": "First Rib Self-Depression with Strap",
        "duration": 180,
        "cue": "Loop soft strap over right first rib / clavicular junction, pulling downward toward opposite hip while gently tilting head away.",
        "frames": [
          "/exercises/first_rib_depression_strap_hud.svg"
        ]
      },
      {
        "title": "Brachial Plexus Tension-Free Glide",
        "duration": 180,
        "cue": "Extend right arm laterally at 90°, bend wrist backward as head tilts towards arm, release wrist as head tilts away. Smooth glide.",
        "frames": [
          "/exercises/brachial_plexus_glide_hud.svg"
        ]
      },
      {
        "title": "Opposite Side TOS Release",
        "duration": 180,
        "cue": "Perform strap depression and tension-free neuro-mobilization on left side, keeping breathing smooth and effortless.",
        "frames": [
          "/exercises/brachial_plexus_glide_left_hud.svg"
        ]
      },
      {
        "title": "Diaphragmatic Rib Expansion",
        "duration": 180,
        "cue": "Place hands on lateral lower rib cage. Inhale through nose expanding ribs sideways, avoiding clavicular elevation.",
        "frames": [
          "/exercises/diaphragmatic_breathing_hud.jpg"
        ]
      }
    ]
  },
  "r6": {
    "id": "r6",
    "name": "Isometric Cervical Strengthening",
    "title": "Isometric Cervical Strengthening",
    "category": "rehab",
    "focus_areas": [
      "cervical spine",
      "neck extensors",
      "neck rotators"
    ],
    "duration_minutes": 12,
    "intensity": "Targeted Strengthening",
    "instruction": "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    "description": "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    "precautions": [
      "Apply only 20-30% of maximum force; never strain."
    ],
    "contraindications": [
      "Acute atlantoaxial instability",
      "Recent cervical fusion (< 6 weeks)"
    ],
    "steps": [
      {
        "title": "Isometric Cervical Flexion",
        "duration": 180,
        "cue": "Place palm against forehead. Press head forward into palm at 20-30% effort with zero cervical movement. Hold 6s.",
        "frames": [
          "/exercises/isometric_cervical_flexion_hud.svg"
        ]
      },
      {
        "title": "Isometric Cervical Extension",
        "duration": 180,
        "cue": "Clasp hands behind occiput. Press head straight back into hands at gentle 20-30% resistance without tilting. Hold 6s.",
        "frames": [
          "/exercises/isometric_cervical_extension_hud.svg"
        ]
      },
      {
        "title": "Isometric Lateral Flexion (Left & Right)",
        "duration": 180,
        "cue": "Place palm flat against side of head above ear. Gently resist side-bending for 6s. Repeat on opposite side.",
        "frames": [
          "/exercises/isometric_cervical_lateral_hud.svg"
        ]
      },
      {
        "title": "Restorative Alignment Rest",
        "duration": 180,
        "cue": "Rest supine with knees bent over bolster, jaw unhinged, cervical spine neutral, relaxing paraspinals.",
        "frames": [
          "/exercises/constructive_rest_bolster_hud.jpg"
        ]
      }
    ]
  },
  "h1": {
    "id": "h1",
    "name": "Hydrotherapy Buoyancy Spinal Decompression",
    "title": "Hydrotherapy Buoyancy Spinal Decompression",
    "category": "hydrotherapy",
    "focus_areas": [
      "lumbar",
      "cervical",
      "spine",
      "water buoyancy"
    ],
    "duration_minutes": 25,
    "intensity": "Decompression",
    "instruction": "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    "description": "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    "precautions": [
      "Use pool noodles or buoyancy belt for effortless floating."
    ],
    "contraindications": [
      "Open surgical wounds",
      "Active systemic fever or infection"
    ],
    "steps": [
      {
        "title": "Buoyant Vertical Traction",
        "duration": 375,
        "cue": "Place pool noodle under armpits in chest-deep to deep water, allowing pelvis and lower limbs to hang weightlessly in zero-gravity traction.",
        "frames": [
          "/exercises/hydro_vertical_traction_hud.svg"
        ]
      },
      {
        "title": "Gentle Water Knee-to-Chest",
        "duration": 375,
        "cue": "Supported by buoyancy, slowly draw knees upward toward chest, allowing warm water buoyancy to gently open lumbar facet joints.",
        "frames": [
          "/exercises/hydro_knee_to_chest_hud.svg"
        ]
      },
      {
        "title": "Aquatic Torso Pendulum",
        "duration": 375,
        "cue": "Gently sway submerged legs side to side in slow pendulum motion, offloading spinal compression with hydrodynamic fluid support.",
        "frames": [
          "/exercises/hydro_torso_pendulum_hud.svg"
        ]
      },
      {
        "title": "Supine Water Float with Head Support",
        "duration": 375,
        "cue": "Rest in full supine float supported by cervical float and waist noodle, surrendering completely to warm water sensory calm.",
        "frames": [
          "/exercises/hydro_supine_float_hud.svg"
        ]
      }
    ]
  },
  "h2": {
    "id": "h2",
    "name": "Aquatic Multi-Planar Gait & Walking",
    "title": "Aquatic Multi-Planar Gait & Walking",
    "category": "hydrotherapy",
    "focus_areas": [
      "gait",
      "hip flexors",
      "glutes",
      "balance"
    ],
    "duration_minutes": 20,
    "intensity": "Adaptive Mobility",
    "instruction": "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    "description": "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    "precautions": [
      "Maintain upright posture; do not lean forward against water resistance."
    ],
    "contraindications": [
      "Severe cardiac decompensation",
      "Uncontrolled seizures"
    ],
    "steps": [
      {
        "title": "Forward Water Marching",
        "duration": 300,
        "cue": "Chest-deep water: March forward with deliberate high-knee gait and reciprocal arm drive against buoyant water drag.",
        "frames": [
          "/exercises/hydro_forward_walking_hud.svg"
        ]
      },
      {
        "title": "Retro (Backward) Water Walking",
        "duration": 300,
        "cue": "Walk backward toe-to-heel in water with upright spine, activating gluteals and posterior chain without joint compression.",
        "frames": [
          "/exercises/hydro_retro_walking_hud.svg"
        ]
      },
      {
        "title": "Lateral Sidestepping",
        "duration": 300,
        "cue": "Step sideways along pool lane leading with outer foot, engaging gluteus medius stabilizers against hydrostatic drag.",
        "frames": [
          "/exercises/hydro_lateral_stepping_hud.svg"
        ]
      },
      {
        "title": "Rail-Assisted Calf Pumps in Water",
        "duration": 300,
        "cue": "Hold pool gutter or rail, rise up onto balls of feet and slowly lower heels down, using water pressure to boost venous return.",
        "frames": [
          "/exercises/hydro_rail_calf_pumps_hud.svg"
        ]
      }
    ]
  },
  "h3": {
    "id": "h3",
    "name": "Aquatic Hip & Core Stabilization",
    "title": "Aquatic Hip & Core Stabilization",
    "category": "hydrotherapy",
    "focus_areas": [
      "glutes",
      "hip abductors",
      "core",
      "pelvis"
    ],
    "duration_minutes": 20,
    "intensity": "Targeted Strengthening",
    "instruction": "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    "description": "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    "precautions": [
      "Move at a steady controlled speed; water resistance increases with speed."
    ],
    "contraindications": [
      "Recent acute hernia surgery",
      "Severe balance loss without therapist in water"
    ],
    "steps": [
      {
        "title": "Pool Noodle Bicycle Pedaling",
        "duration": 300,
        "cue": "Support upper body on two noodles under arms, pedal legs smoothly in continuous fluid cycling circles, bracing deep core.",
        "frames": [
          "/exercises/hydro_noodle_bicycle_hud.svg"
        ]
      },
      {
        "title": "Single-Leg Balance with Hydrofoil Paddle",
        "duration": 300,
        "cue": "Stand on one foot in waist-to-chest water, hold kickboard or paddle submerged, stabilizing core against water eddies.",
        "frames": [
          "/exercises/hydro_single_leg_balance_hud.svg"
        ]
      },
      {
        "title": "Wall-Supported Scissor Kicks",
        "duration": 300,
        "cue": "Rest back against pool edge with forearms on deck, extend legs horizontally in water and perform gentle alternating scissor kicks.",
        "frames": [
          "/exercises/hydro_wall_scissor_kicks_hud.svg"
        ]
      },
      {
        "title": "Supported Prone Water Glide",
        "duration": 300,
        "cue": "Hold kickboard out in front with arms extended, glide effortlessly through warm water with gentle flutter kicks.",
        "frames": [
          "/exercises/hydro_prone_water_glide_hud.svg"
        ]
      }
    ]
  },
  "h4": {
    "id": "h4",
    "name": "Warm Water Relaxation & Lymphatic Flush",
    "title": "Warm Water Relaxation & Lymphatic Flush",
    "category": "hydrotherapy",
    "focus_areas": [
      "lymphatic drainage",
      "edema",
      "nervous system",
      "circulation"
    ],
    "duration_minutes": 20,
    "intensity": "Decompression",
    "instruction": "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    "description": "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    "precautions": [
      "Hydrate with water before and after pool session."
    ],
    "contraindications": [
      "Active skin lesion or dermatitis",
      "Chlorine sensitivity flare"
    ],
    "steps": [
      {
        "title": "Submerged Torso Rotations",
        "duration": 300,
        "cue": "Stand in chest-deep water with feet wide. Slowly rotate torso and sweep submerged hands through water like fluid Tai Chi.",
        "frames": [
          "/exercises/hydro_submerged_torso_rotations_hud.svg"
        ]
      },
      {
        "title": "Submerged Banded Hip Abduction",
        "duration": 300,
        "cue": "Hold pool rail, sweep leg outward into water resistance with hydro cuff or band, engaging hip abductors and rotators.",
        "frames": [
          "/exercises/hydro_banded_hip_abduction_hud.svg"
        ]
      },
      {
        "title": "Rail-Supported Squat Mobilization",
        "duration": 300,
        "cue": "Hold pool gutter, sit hips back into buoyant squat, using water lift to achieve deep hip/knee flexion without joint loading.",
        "frames": [
          "/exercises/hydro_rail_squat_hud.svg"
        ]
      },
      {
        "title": "Deep Relaxation Water Float",
        "duration": 300,
        "cue": "Floating supine with flotation rings, eyes closed, breathing rhythmically with pool temperature soothing peripheral nerves.",
        "frames": [
          "/exercises/hydro_deep_relaxation_float_hud.svg"
        ]
      }
    ]
  }
};

    // Backlog of alternative exercises for swapping
    const exerciseBacklog = [
        { title: "Lumbar & Core Stability", duration: 225, frames: ["/exercises/supine_pelvic_tilts.jpg"] },
        { title: "Child's Pose Decompression", duration: 225, frames: ["/exercises/supported_childs_pose.jpg"] },
        { title: "Pelvic Tilt & Spinal Alignment", duration: 225, frames: ["/exercises/supine_pelvic_tilts.jpg"] },
        { title: "Hip & Lower Body Mobility", duration: 225, frames: ["/exercises/hip_glute_bridge.jpg"] },
        { title: "Shoulder & Scapular Rehab", duration: 225, frames: ["/exercises/scapular_wall_slide_setup_hud.svg"] }
    ];

    let currentRoutineRunning = null;
    let isRunnerPaused = false;
    let totalTimeLeft = 0;
    let totalRoutineDuration = 0;

    async function startRunnerModal(id) {
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
                foundRoutine = YOGA_ROUTINES['y1']; // Gentle Lumbar Release (20 min)
            } else if (rawId.includes('yoga_pm') || rawId.includes('evening')) {
                foundRoutine = YOGA_ROUTINES['y3']; // Full Body Restorative Yin (30 min)
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
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateStepUI() {
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
            runnerTotalBadge.innerText = `${currentRoutineRunning.duration_minutes || 15} Min Routine`;
        }

        const runnerTotalTimeDisplay = document.getElementById('runnerTotalTimeDisplay');
        if (runnerTotalTimeDisplay) {
            runnerTotalTimeDisplay.innerText = `Total Remaining: ${formatTime(totalTimeLeft)} / ${formatTime(totalRoutineDuration)}`;
        }

        const runnerTotalTimer = document.getElementById('runnerTotalTimer');
        if (runnerTotalTimer) {
            runnerTotalTimer.innerText = formatTime(totalTimeLeft);
        }

        if (runnerStep) runnerStep.innerText = `Step ${currentStepIndex + 1} of ${currentProtocolSteps.length}: ${step.title}`;
        if (runnerTimer) runnerTimer.innerText = formatTime(timeLeft);
        const runnerStepTimer = document.getElementById('runnerStepTimer');
        if (runnerStepTimer) runnerStepTimer.innerText = formatTime(timeLeft);
        
        const progressBar = document.getElementById('runnerTotalProgressBar');
        if (progressBar && totalRoutineDuration > 0) {
            const pct = Math.min(100, Math.max(0, ((totalRoutineDuration - totalTimeLeft) / totalRoutineDuration) * 100));
            progressBar.style.width = `${pct}%`;
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
                        placeholderEl.innerHTML = `
                            <div style="text-align: center; padding: 15px;">
                                <div style="font-size: 2.2rem; margin-bottom: 6px;">🧘</div>
                                <div style="font-size: 1rem; color: var(--neon-blue); font-weight: 600;">${escapeHtml(step.title)}</div>
                                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(step.cue || 'Maintain steady rhythm')}</div>
                            </div>
                        `;
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
                placeholderEl.innerHTML = `
                    <div style="text-align: center; padding: 15px;">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">🧘</div>
                        <div style="font-size: 1rem; color: var(--neon-blue); font-weight: 600;">${escapeHtml(step.title)}</div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(step.cue || 'Maintain steady rhythm')}</div>
                    </div>
                `;
            }
        }
        
        const btnPrev = document.getElementById('btnPrevStep');
        const btnNext = document.getElementById('btnNextStep');
        if (btnPrev) btnPrev.disabled = currentStepIndex === 0;
        if (btnNext) btnNext.innerText = currentStepIndex === currentProtocolSteps.length - 1 ? 'Finish Routine' : 'Next Step';
    }
    
    function closeRunnerModal() {
        runnerModal.classList.add('hidden');
        clearInterval(runnerInterval);
        clearInterval(frameInterval);
        isRunnerPaused = false;
        const videoEl = document.getElementById('runnerVideo');
        if (videoEl) {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.removeAttribute('data-src');
        }
    }

    function togglePauseRunner() {
        isRunnerPaused = !isRunnerPaused;
        const btnTogglePause = document.getElementById('btnTogglePauseRunner');
        if (btnTogglePause) {
            btnTogglePause.innerText = isRunnerPaused ? 'Resume' : 'Pause';
        }
    }

    function startRunnerTimer() {
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
                    const runnerStepTimer = document.getElementById('runnerStepTimer');
                    if (runnerStepTimer) runnerStepTimer.innerText = "00:00";
                    const runnerTotalTimer = document.getElementById('runnerTotalTimer');
                    if (runnerTotalTimer) runnerTotalTimer.innerText = "00:00";
                    const runnerTotalTimeDisplay = document.getElementById('runnerTotalTimeDisplay');
                    if (runnerTotalTimeDisplay) runnerTotalTimeDisplay.innerText = `Total Remaining: 00:00 / ${formatTime(totalRoutineDuration)}`;
                    const progressBar = document.getElementById('runnerTotalProgressBar');
                    if (progressBar) progressBar.style.width = "100%";
                    const progressPct = document.getElementById('runnerTotalProgressPct');
                    if (progressPct) progressPct.innerText = "100%";
                    const stepProgressBar = document.getElementById('runnerStepProgressBar');
                    if (stepProgressBar) stepProgressBar.style.width = "100%";
                    const stepProgressPct = document.getElementById('runnerStepProgressPct');
                    if (stepProgressPct) stepProgressPct.innerText = "100%";
                    setTimeout(() => {
                        closeRunnerModal();
                        const routineName = currentRoutineRunning?.title || "Yoga Routine";
                        if (reliefExerciseName) reliefExerciseName.innerText = routineName;
                        if (afterPainScore) afterPainScore.value = currentPainLevel || 5;
                        pendingProtocol = { id: currentRoutineRunning?.id || 'y1', name: routineName, beforePain: currentPainLevel || 5 };
                        if (reliefModal) reliefModal.classList.remove('hidden');
                    }, 1200);
                } else {
                    timeLeft = (currentProtocolSteps[currentStepIndex] && currentProtocolSteps[currentStepIndex].duration) || 120;
                    updateStepUI();
                }
            } else {
                // Update Current Step countdown (e.g. 02:00 hold countdown)
                if (runnerTimer) runnerTimer.innerText = formatTime(timeLeft);
                const runnerStepTimer = document.getElementById('runnerStepTimer');
                if (runnerStepTimer) runnerStepTimer.innerText = formatTime(timeLeft);
                
                // Update Total Routine countdown (e.g. 25:00 countdown)
                const runnerTotalTimer = document.getElementById('runnerTotalTimer');
                if (runnerTotalTimer) runnerTotalTimer.innerText = formatTime(totalTimeLeft);
                
                const runnerTotalTimeDisplay = document.getElementById('runnerTotalTimeDisplay');
                if (runnerTotalTimeDisplay) {
                    runnerTotalTimeDisplay.innerText = `Total Remaining: ${formatTime(totalTimeLeft)} / ${formatTime(totalRoutineDuration)}`;
                }
                
                // Total progress bar and percentage
                const progressBar = document.getElementById('runnerTotalProgressBar');
                const progressPct = document.getElementById('runnerTotalProgressPct');
                if (progressBar && totalRoutineDuration > 0) {
                    const pct = Math.min(100, Math.max(0, Math.round(((totalRoutineDuration - totalTimeLeft) / totalRoutineDuration) * 100)));
                    progressBar.style.width = `${pct}%`;
                    if (progressPct) progressPct.innerText = `${pct}%`;
                }

                // Step hold progress bar and percentage
                const stepProgressBar = document.getElementById('runnerStepProgressBar');
                const stepProgressPct = document.getElementById('runnerStepProgressPct');
                const curStep = currentProtocolSteps[currentStepIndex];
                const stepDuration = (curStep && curStep.duration) || 120;
                if (stepProgressBar && stepDuration > 0) {
                    const stepPct = Math.min(100, Math.max(0, Math.round(((stepDuration - timeLeft) / stepDuration) * 100)));
                    stepProgressBar.style.width = `${stepPct}%`;
                    if (stepProgressPct) stepProgressPct.innerText = `${stepPct}%`;
                }
            }
        }, 1000);
    }

    if (btnCancelRunner) btnCancelRunner.addEventListener('click', closeRunnerModal);

    const btnPrevStep = document.getElementById('btnPrevStep');
    if (btnPrevStep) {
        btnPrevStep.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                timeLeft = (currentProtocolSteps[currentStepIndex] && currentProtocolSteps[currentStepIndex].duration) || 120;
                updateStepUI();
            }
        });
    }

    if (btnNextStep) {
        btnNextStep.addEventListener('click', () => {
            currentStepIndex++;
            if (currentStepIndex >= currentProtocolSteps.length) {
                closeRunnerModal();
                const routineName = currentRoutineRunning?.title || "Yoga Routine";
                if (reliefExerciseName) reliefExerciseName.innerText = routineName;
                if (afterPainScore) afterPainScore.value = currentPainLevel || 5;
                pendingProtocol = { id: currentRoutineRunning?.id || 'y1', name: routineName, beforePain: currentPainLevel || 5 };
                if (reliefModal) reliefModal.classList.remove('hidden');
            } else {
                timeLeft = (currentProtocolSteps[currentStepIndex] && currentProtocolSteps[currentStepIndex].duration) || 120;
                updateStepUI();
            }
        });
    }

    const btnTogglePauseRunner = document.getElementById('btnTogglePauseRunner');
    if (btnTogglePauseRunner) {
        btnTogglePauseRunner.addEventListener('click', togglePauseRunner);
    }
    if (runnerTimer) {
        runnerTimer.addEventListener('click', togglePauseRunner);
    }

    // Swap Routine & Swap Exercise Modal Logic
    const btnSwapRoutine = document.getElementById('btnSwapRoutine');
    const btnSwapExercise = document.getElementById('btnSwapExercise');
    const swapModal = document.getElementById('swapModal');
    const swapModalTitle = document.getElementById('swapModalTitle');
    const swapModalHint = document.getElementById('swapModalHint');
    const swapSearchInput = document.getElementById('swapSearchInput');
    const btnCloseSwap = document.getElementById('btnCloseSwap');
    const swapList = document.getElementById('swapList');

    let currentSwapMode = 'routine'; // 'routine' | 'exercise'

    function getAllUniqueExercises() {
        const map = new Map();
        if (typeof YOGA_ROUTINES === 'object' && YOGA_ROUTINES !== null) {
            Object.values(YOGA_ROUTINES).forEach(routine => {
                const cat = (routine.category || 'yoga').toLowerCase();
                if (Array.isArray(routine.steps)) {
                    routine.steps.forEach(step => {
                        const normTitle = (step.title || '').trim().toLowerCase();
                        if (normTitle && !map.has(normTitle)) {
                            map.set(normTitle, {
                                title: step.title.trim(),
                                cue: step.cue || '',
                                frames: Array.isArray(step.frames) ? [...step.frames] : [],
                                duration: step.duration || 120,
                                category: cat,
                                routineTitle: routine.title || routine.name || ''
                            });
                        }
                    });
                }
            });
        }
        if (typeof exerciseBacklog !== 'undefined' && Array.isArray(exerciseBacklog)) {
            exerciseBacklog.forEach(item => {
                const normTitle = (item.title || '').trim().toLowerCase();
                if (normTitle && !map.has(normTitle)) {
                    map.set(normTitle, {
                        title: item.title.trim(),
                        cue: item.cue || '',
                        frames: Array.isArray(item.frames) ? [...item.frames] : [],
                        duration: item.duration || 120,
                        category: (item.category || 'rehab').toLowerCase(),
                        routineTitle: 'Backlog'
                    });
                }
            });
        }
        return Array.from(map.values());
    }

    function renderSwapModalList(filterText = '') {
        if (!swapList) return;
        swapList.innerHTML = '';
        const q = (filterText || '').trim().toLowerCase();

        if (currentSwapMode === 'routine') {
            const allRoutines = Object.values(YOGA_ROUTINES);
            const filtered = allRoutines.filter(r => {
                if (!q) return true;
                const matchTitle = (r.title || r.name || '').toLowerCase().includes(q);
                const matchCat = (r.category || '').toLowerCase().includes(q);
                const matchDesc = (r.instruction || r.description || '').toLowerCase().includes(q);
                return matchTitle || matchCat || matchDesc;
            });

            if (filtered.length === 0) {
                swapList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No routines match your search.</div>';
                return;
            }

            filtered.forEach(r => {
                const item = document.createElement('div');
                item.className = 'glass-panel';
                item.style.cssText = 'padding: 10px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; transition: background 0.2s;';
                item.innerHTML = `
                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <span class="exercise-tag ${(r.category || 'yoga').toLowerCase()}">${(r.category || 'YOGA').toUpperCase()}</span>
                            <strong style="color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(r.title || r.name)}</strong>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px;">${r.duration_minutes || 15} min · ${r.intensity || 'Adaptive'} (${(r.steps || []).length} steps)</div>
                    </div>
                    <button class="btn btn-outline btn-sm" style="white-space: nowrap;">Start Routine</button>
                `;
                item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.08)');
                item.addEventListener('mouseleave', () => item.style.background = 'rgba(255,255,255,0.02)');
                item.addEventListener('click', () => {
                    if (swapModal) swapModal.classList.add('hidden');
                    startRunnerModal(r.id);
                });
                swapList.appendChild(item);
            });
        } else {
            // Exercise swap mode: list individual deduplicated exercises, excluding currently active step
            const currentStepTitle = (currentProtocolSteps && currentProtocolSteps[currentStepIndex]) ? (currentProtocolSteps[currentStepIndex].title || '').trim().toLowerCase() : '';
            const allExercises = getAllUniqueExercises().filter(ex => ex.title.trim().toLowerCase() !== currentStepTitle);
            const filtered = allExercises.filter(ex => {
                if (!q) return true;
                const matchTitle = ex.title.toLowerCase().includes(q);
                const matchCat = ex.category.toLowerCase().includes(q);
                const matchCue = ex.cue.toLowerCase().includes(q);
                const matchRoutine = ex.routineTitle.toLowerCase().includes(q);
                return matchTitle || matchCat || matchCue || matchRoutine;
            });

            if (filtered.length === 0) {
                swapList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No exercises match your search.</div>';
                return;
            }

            filtered.forEach(ex => {
                const item = document.createElement('div');
                item.className = 'glass-panel';
                item.style.cssText = 'padding: 10px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; transition: background 0.2s;';
                item.innerHTML = `
                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <span class="exercise-tag ${ex.category}">${ex.category.toUpperCase()}</span>
                            <strong style="color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(ex.title)}</strong>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; line-height: 1.3;">${escapeHtml(ex.cue)}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">From: ${escapeHtml(ex.routineTitle)}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" style="white-space: nowrap;">Swap Step</button>
                `;
                item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.08)');
                item.addEventListener('mouseleave', () => item.style.background = 'rgba(255,255,255,0.02)');
                item.addEventListener('click', () => {
                    if (currentProtocolSteps && currentProtocolSteps[currentStepIndex]) {
                        // In-place exercise step replacement preserving step's allocated duration
                        const preservedDuration = currentProtocolSteps[currentStepIndex].duration || ex.duration || 120;
                        currentProtocolSteps[currentStepIndex] = {
                            ...currentProtocolSteps[currentStepIndex],
                            title: ex.title,
                            cue: ex.cue,
                            frames: Array.isArray(ex.frames) ? [...ex.frames] : []
                        };
                        timeLeft = preservedDuration;
                        updateStepUI();
                    }
                    if (swapModal) swapModal.classList.add('hidden');
                    isRunnerPaused = false;
                    if (btnTogglePauseRunner) btnTogglePauseRunner.innerText = 'Pause';
                });
                swapList.appendChild(item);
            });
        }
    }

    if (btnSwapRoutine) {
        btnSwapRoutine.addEventListener('click', () => {
            isRunnerPaused = true;
            if (btnTogglePauseRunner) btnTogglePauseRunner.innerText = 'Resume';
            currentSwapMode = 'routine';
            if (swapModalTitle) swapModalTitle.innerText = 'Swap Routine';
            if (swapModalHint) swapModalHint.innerText = 'Select a different routine to start from the beginning.';
            if (swapSearchInput) swapSearchInput.value = '';
            renderSwapModalList('');
            if (swapModal) swapModal.classList.remove('hidden');
            if (swapSearchInput) swapSearchInput.focus();
        });
    }

    if (btnSwapExercise) {
        btnSwapExercise.addEventListener('click', () => {
            isRunnerPaused = true;
            if (btnTogglePauseRunner) btnTogglePauseRunner.innerText = 'Resume';
            currentSwapMode = 'exercise';
            if (swapModalTitle) swapModalTitle.innerText = 'Swap Exercise';
            if (swapModalHint) swapModalHint.innerText = 'Select an individual exercise to replace the current step in-place.';
            if (swapSearchInput) swapSearchInput.value = '';
            renderSwapModalList('');
            if (swapModal) swapModal.classList.remove('hidden');
            if (swapSearchInput) swapSearchInput.focus();
        });
    }

    if (swapSearchInput) {
        swapSearchInput.addEventListener('input', (e) => {
            renderSwapModalList(e.target.value);
        });
    }

    if (btnCloseSwap) {
        btnCloseSwap.addEventListener('click', () => {
            if (swapModal) swapModal.classList.add('hidden');
            isRunnerPaused = false;
            if (btnTogglePauseRunner) btnTogglePauseRunner.innerText = 'Pause';
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
            const val = parseFloat(btn.getAttribute('data-val'));
            manualMoodOverride = isNaN(val) ? 5.0 : val;
            if (typeof recalculateMood === 'function') {
                recalculateMood();
            } else {
                currentMoodLevel = manualMoodOverride;
                if (moodValDisplay) moodValDisplay.innerText = currentMoodLevel;
            }
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
        if (lower.includes('sciatica')) area = 'sciatica';
        else if (lower.includes('scapula')) area = 'scapula';
        else if (lower.includes('lumbar')) area = 'lumbar';
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

        let payloadTimestamp = null;
        if (activePainLogScheduledTime) {
            payloadTimestamp = computeRandomOffsetTimestamp(activePainLogScheduledTime);
        }

        btnLogPain.innerText = "Logged";
        btnLogPain.style.background = "var(--neon-green)";

        const payload = {
            pain_level: overallScore,
            score: overallScore,
            generators,
            locations: generators,
            pain_notes: userNotes,
            mood_level: currentMoodLevel,
            mood: String(currentMoodLevel),
            mood_notes: userNotes,
            mood_emoji: selectedMoodEmoji
        };
        if (payloadTimestamp) {
            payload.created_at = payloadTimestamp;
            payload.timestamp = payloadTimestamp;
        }

        try {
            const res = await fetch(API_PAIN_LOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Pain log failed');
            if (data.alert_triggered) {
                alertBannerText.innerText = data.alert_message;
                alertBanner.classList.remove('hidden');
                const btnTriage = document.getElementById('btnActivateFlareTriage');
                if (btnTriage) {
                    if (data.flare_triage_proposal && data.flare_triage_proposal.deferredTasks && data.flare_triage_proposal.deferredTasks.length > 0) {
                        btnTriage.classList.remove('hidden');
                        btnTriage.onclick = async () => {
                            btnTriage.disabled = true;
                            btnTriage.innerText = 'Activating...';
                            try {
                                const triageRes = await fetch('/api/v1/rumble/chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        confirm_action: {
                                            type: 'flare_triage',
                                            data: data.flare_triage_proposal
                                        }
                                    })
                                });
                                const triageData = await triageRes.json();
                                if (triageRes.ok) {
                                    showToast(triageData.reply || 'Low-Spoon Flare Triage activated', 'success');
                                    btnTriage.classList.add('hidden');
                                    alertBanner.classList.add('hidden');
                                    if (typeof loadAgenda === 'function') loadAgenda();
                                    else if (typeof loadAgendaItems === 'function') loadAgendaItems();
                                } else {
                                    showToast(triageData.error || 'Failed to activate triage');
                                }
                            } catch (triageErr) {
                                showToast(triageErr.message || 'Error executing flare triage');
                            } finally {
                                btnTriage.disabled = false;
                                btnTriage.innerText = 'Activate Flare Triage';
                            }
                        };
                    } else {
                        btnTriage.classList.add('hidden');
                    }
                }
            }
            if (activePainLogAgendaId) {
                try {
                    await fetch(API_AGENDA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: activePainLogAgendaId, action: 'update_status', status: 'completed' })
                    });
                } catch (agendaErr) {
                    console.error('Error marking agenda card completed:', agendaErr);
                }
            }
            closePainLog();
            showToast('Pain log saved to live database', 'success');
            if (typeof loadTodaysPainLogs === 'function') loadTodaysPainLogs();
            if (typeof loadPainAnalytics === 'function') loadPainAnalytics();
            if (typeof loadAgenda === 'function') loadAgenda();
            else if (typeof loadAgendaItems === 'function') loadAgendaItems();
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
                showToast('Failed to add expense');
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

    // --- Text Messages (SMS) Logic ---
    const btnComposeSms = document.getElementById('btnComposeSms');
    const btnCloseComposeSms = document.getElementById('btnCloseComposeSms');
    const btnCancelComposeSms = document.getElementById('btnCancelComposeSms');
    const btnSubmitSendSms = document.getElementById('btnSubmitSendSms');
    const composeSmsModalEl = document.getElementById('composeSmsModal');

    function composeSmsModal(show = true) {
        if (!composeSmsModalEl) return;
        if (show) {
            composeSmsModalEl.classList.remove('hidden');
            const toInput = document.getElementById('smsToInput');
            const bodyInput = document.getElementById('smsBodyInput');
            const errDiv = document.getElementById('smsSendError');
            if (errDiv) { errDiv.style.display = 'none'; errDiv.innerText = ''; }
            if (toInput) { toInput.value = ''; toInput.focus(); }
            if (bodyInput) { bodyInput.value = ''; }
        } else {
            composeSmsModalEl.classList.add('hidden');
        }
    }

    async function sendSmsMessage(to, body) {
        const res = await fetch('/api/v1/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, body })
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
            throw new Error(data.error || 'Failed to send SMS');
        }
        return data;
    }

    async function markSmsRead(id) {
        try {
            const res = await fetch('/api/v1/sms', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            return data.status === 'success';
        } catch (e) {
            console.error("Failed to mark SMS as read", e);
            return false;
        }
    }

    async function loadSmsMessages() {
        const listEl = document.getElementById('smsMessagesList');
        const badgeEl = document.getElementById('smsUnreadBadge');
        if (!listEl) return;

        try {
            const res = await fetch('/api/v1/sms?limit=20');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.messages)) {
                const messages = data.messages;
                const unreadCount = messages.filter(m => !m.read).length;
                if (badgeEl) {
                    badgeEl.innerText = `${unreadCount} Unread`;
                    badgeEl.className = unreadCount > 0 ? 'badge neon-blue' : 'badge';
                }

                if (messages.length === 0) {
                    listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.88rem; text-align: center; padding: 20px;">No text messages found.</div>';
                    return;
                }

                listEl.innerHTML = '';
                messages.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'sms-message-card';
                    item.style.cssText = `
                        background: ${msg.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 229, 255, 0.05)'};
                        border: 1px solid ${msg.read ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 229, 255, 0.3)'};
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    `;

                    const timeStr = msg.received_at ? new Date(msg.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '';
                    const bodyPreview = escapeHtml(msg.body || '');
                    const isUnresolvedTag = msg.body && (msg.body === '{sms_body}' || msg.body.includes('{sms_body}'));
                    const tagWarning = isUnresolvedTag
                        ? `<div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 0.76rem;">
                            ⚠️ <strong>Tag Issue:</strong> Phone sent <code>{sms_body}</code>. In MacroDroid HTTP Request body, change <code>{sms_body}</code> to <code>[sms_message]</code>.
                           </div>`
                        : '';

                    item.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(msg.sender || 'Unknown')}</strong>
                                ${!msg.read ? '<span class="badge neon-blue" style="font-size: 0.7rem; padding: 1px 6px;">New</span>' : ''}
                            </div>
                            <span style="color: var(--text-muted); font-size: 0.75rem; white-space: nowrap;">${timeStr}</span>
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.4;">${bodyPreview}</div>
                        ${tagWarning}
                        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                            ${!msg.read ? '<button class="btn btn-outline btn-sm btn-mark-read" style="font-size: 0.75rem; padding: 2px 8px;">Mark Read</button>' : ''}
                            <button class="btn btn-neon-blue btn-sm btn-reply-sms" style="font-size: 0.75rem; padding: 2px 8px;">Reply</button>
                        </div>
                    `;

                    const btnMarkRead = item.querySelector('.btn-mark-read');
                    if (btnMarkRead) {
                        btnMarkRead.onclick = async () => {
                            btnMarkRead.disabled = true;
                            const ok = await markSmsRead(msg.id);
                            if (ok) {
                                loadSmsMessages();
                            } else {
                                btnMarkRead.disabled = false;
                            }
                        };
                    }

                    const btnReply = item.querySelector('.btn-reply-sms');
                    if (btnReply) {
                        btnReply.onclick = () => {
                            if (rumbleChatModal) {
                                rumbleChatModal.classList.remove('hidden');
                            }
                            if (rumbleChatInput) {
                                const snippet = (msg.body || '').substring(0, 80);
                                rumbleChatInput.value = `Reply to SMS from ${msg.sender}: ${snippet}`;
                                rumbleChatInput.focus();
                            }
                        };
                    }

                    listEl.appendChild(item);
                });
            }
        } catch (e) {
            console.error("Failed to load SMS messages", e);
            if (listEl) {
                listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.88rem; text-align: center; padding: 20px;">Failed to load text messages.</div>';
            }
        }
    }

    if (btnComposeSms) {
        btnComposeSms.addEventListener('click', () => composeSmsModal(true));
    }
    if (btnCloseComposeSms) {
        btnCloseComposeSms.addEventListener('click', () => composeSmsModal(false));
    }
    if (btnCancelComposeSms) {
        btnCancelComposeSms.addEventListener('click', () => composeSmsModal(false));
    }
    if (btnSubmitSendSms) {
        btnSubmitSendSms.addEventListener('click', async () => {
            const to = document.getElementById('smsToInput')?.value.trim();
            const body = document.getElementById('smsBodyInput')?.value.trim();
            const errDiv = document.getElementById('smsSendError');
            if (!to || !body) {
                if (errDiv) {
                    errDiv.innerText = 'Phone number and message body are required.';
                    errDiv.style.display = 'block';
                }
                return;
            }
            btnSubmitSendSms.disabled = true;
            try {
                await sendSmsMessage(to, body);
                if (typeof showToast === 'function') showToast('SMS message sent', 'success');
                composeSmsModal(false);
                loadSmsMessages();
            } catch (err) {
                if (errDiv) {
                    errDiv.innerText = err.message || 'Failed to send message';
                    errDiv.style.display = 'block';
                }
            } finally {
                btnSubmitSendSms.disabled = false;
            }
        });
    }

    loadSmsMessages();
    setInterval(loadSmsMessages, 20000);

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

    // Toggle Doctor Mode (Distraction-free high-contrast clinical view)
    let isDoctorMode = false;
    const btnToggleDoctorMode = document.getElementById('btnToggleDoctorMode');
    const doctorSpecialtyFilter = document.getElementById('doctorSpecialtyFilter');
    const btnCopyDoctorSummary = document.getElementById('btnCopyDoctorSummary');

    if (btnToggleDoctorMode) {
        btnToggleDoctorMode.addEventListener('click', () => {
            isDoctorMode = !isDoctorMode;
            const docContainer = document.getElementById('doctorBriefingContainer');
            if (isDoctorMode) {
                btnToggleDoctorMode.classList.remove('btn-outline');
                btnToggleDoctorMode.classList.add('active', 'btn-neon-green');
                btnToggleDoctorMode.innerText = '👨‍⚕️ Exit Doctor View';
                if (docContainer) {
                    docContainer.style.background = 'rgba(0, 240, 255, 0.12)';
                    docContainer.style.border = '2px solid var(--neon-green)';
                }
            } else {
                btnToggleDoctorMode.classList.remove('active', 'btn-neon-green');
                btnToggleDoctorMode.classList.add('btn-outline');
                btnToggleDoctorMode.innerText = '👨‍⚕️ Doctor Desk View';
                if (docContainer) {
                    docContainer.style.background = 'rgba(0, 240, 255, 0.04)';
                    docContainer.style.border = '1px solid var(--glass-border)';
                    docContainer.style.borderLeft = '4px solid var(--neon-blue)';
                }
            }
        });
    }

    if (doctorSpecialtyFilter) {
        doctorSpecialtyFilter.addEventListener('change', () => {
            loadPainAnalytics(currentPainAnalyticsPeriod);
        });
    }

    let latestAnalyticsData = null;

    if (btnCopyDoctorSummary) {
        btnCopyDoctorSummary.addEventListener('click', () => {
            if (!latestAnalyticsData) return;
            const syn = latestAnalyticsData.clinical_synopsis || {};
            const textToCopy = `CLINICAL SUMMARY & LONGITUDINAL PAIN DATA
Patient: James Jones (DOB: 20/01/1986)
Period: ${latestAnalyticsData.period_label || 'Current Period'} (Total Logs: ${latestAnalyticsData.total_logs} of ${latestAnalyticsData.total_all_time_logs || latestAnalyticsData.total_logs} all-time)
Average Pain: ${latestAnalyticsData.average_score}/10 (Range: ${latestAnalyticsData.min_score}-${latestAnalyticsData.max_score}/10)
Primary Pain Generator: ${syn.primary_generator || 'Right Lumbar Spine'}
Diurnal Variation: ${syn.diurnal_pattern || 'Morning stiffness escalating into evening'}

ACUTE NEUROLOGICAL RED FLAGS:
${(syn.neurological_red_flags || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}

SURGICAL BASELINE:
${syn.surgical_context || 'C5-C7 ACDF (Prof Greg Cunningham). Right L4-L5/L5-S1 disc protrusion with radiculopathy.'}

CONSULT ACTION REQUESTS:
${(syn.recommended_consult_questions || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const prev = btnCopyDoctorSummary.innerText;
                btnCopyDoctorSummary.innerText = '✅ Copied to Clipboard!';
                setTimeout(() => { btnCopyDoctorSummary.innerText = prev; }, 2500);
            }).catch(err => {
                console.error("Failed to copy doctor text:", err);
            });
        });
    }

    if (btnAskRumbleForGP) {
        btnAskRumbleForGP.addEventListener('click', () => {
            if (painAnalyticsModal) painAnalyticsModal.classList.add('hidden');
            if (rumbleChatModal) rumbleChatModal.classList.remove('hidden');
            sendRumbleChatMessage(`Please generate a concise, structured clinical summary of my ${currentPainAnalyticsPeriod === 'day' ? "today's" : currentPainAnalyticsPeriod === 'week' ? "last 7 days'" : "last month's"} pain logs, flare patterns, and functional restrictions for my upcoming GP appointment.`);
        });
    }

    const btnExportConsultPack = document.getElementById('btnExportConsultPack');
    if (btnExportConsultPack) {
        btnExportConsultPack.addEventListener('click', async () => {
            try {
                const specialty = doctorSpecialtyFilter ? doctorSpecialtyFilter.value : 'gp';
                btnExportConsultPack.disabled = true;
                btnExportConsultPack.innerText = 'Generating...';

                const res = await fetch('/api/v1/pain/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        specialist: specialty === 'all' ? 'gp' : specialty,
                        period: currentPainAnalyticsPeriod
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    showToast(`Consult pack saved to ${result.file_path}`, 'success');
                    const blob = new Blob([result.markdown], { type: 'text/markdown' });
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `consult_pack_${specialty}_${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                } else {
                    showToast('Failed to export consult pack');
                }
            } catch (err) {
                console.error("Export error:", err);
                showToast('Failed to export consult pack');
            } finally {
                btnExportConsultPack.disabled = false;
                btnExportConsultPack.innerText = 'Export Consult Pack';
            }
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

            latestAnalyticsData = data;

            // Render Doctor Clinical Briefing Box
            const syn = data.clinical_synopsis;
            if (syn) {
                const redFlagsEl = document.getElementById('briefingRedFlagsList');
                if (redFlagsEl && Array.isArray(syn.neurological_red_flags)) {
                    redFlagsEl.innerHTML = syn.neurological_red_flags.map(f => `<li>${escapeHtml(f)}</li>`).join('');
                }

                const actionsEl = document.getElementById('briefingActionItemsList');
                if (actionsEl && Array.isArray(syn.recommended_consult_questions)) {
                    // Adapt if specialty filter is set
                    const specialty = doctorSpecialtyFilter ? doctorSpecialtyFilter.value : 'all';
                    let displayedActions = syn.recommended_consult_questions;
                    if (specialty === 'pain') {
                        displayedActions = [
                            "Evaluate candidacy & timing for Spinal Cord Stimulation (SCS) trial vs dorsal column stimulation",
                            "Review diagnostic nerve blocks / radiofrequency ablation for persistent facet/lumbar pain",
                            "Assess nocturnal neuropathic breakthrough pain and adjust neuromodulator dosing"
                        ];
                    } else if (specialty === 'neuro') {
                        displayedActions = [
                            "Distinguish acute L4/L5 LMN root compression vs cervical UMN myelomalacic recurrence",
                            "Assess necessity of urgent decompressive lumbar discectomy/foraminotomy",
                            "Evaluate fall risk & verify immediate AFO orthotic splinting indication"
                        ];
                    } else if (specialty === 'rehab') {
                        displayedActions = [
                            "Gait re-education protocol with high-steppage compensation reduction",
                            "Active hydrotherapy progression targeting lumbar core stabilization within restriction",
                            "Ankle dorsiflexion active-assisted rehabilitation and proprioceptive balance training"
                        ];
                    }
                    actionsEl.innerHTML = displayedActions.map(a => `<li>${escapeHtml(a)}</li>`).join('');
                }

                const diurnalNote = document.getElementById('briefingDiurnalNote');
                if (diurnalNote && syn.diurnal_pattern) {
                    diurnalNote.innerHTML = `<strong style="color: var(--text-primary);">Diurnal Load:</strong> ${escapeHtml(syn.diurnal_pattern)}`;
                }

                const alertBadge = document.getElementById('briefingAlertBadge');
                if (alertBadge) {
                    alertBadge.innerText = `${syn.neurological_red_flags?.length || 3} Neurological Red Flags`;
                }
            }

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

            if (statPainTotalLogs) {
                const allTimeTotal = data.total_all_time_logs || data.total_logs;
                statPainTotalLogs.innerText = `${allTimeTotal} Entries`;
                const statPainTotalSubtext = document.getElementById('statPainTotalSubtext');
                if (statPainTotalSubtext) {
                    statPainTotalSubtext.innerText = period === 'all' 
                        ? 'All-Time Cumulative' 
                        : `${data.total_logs} in ${data.period_label || period} · ${allTimeTotal} Total`;
                }
            }

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

            // Populate Period-over-Period Deltas
            const deltas = data.period_deltas;
            const painDeltasLabel = document.getElementById('painDeltasLabel');
            const deltaMeanScore = document.getElementById('deltaMeanScore');
            const deltaSevereFlares = document.getElementById('deltaSevereFlares');
            const deltaDiurnalSlope = document.getElementById('deltaDiurnalSlope');

            if (painDeltasLabel && deltas) {
                painDeltasLabel.innerText = deltas.prior_period_label ? `Compared against ${deltas.prior_period_label}` : 'Prior Period Baseline';
            }
            if (deltaMeanScore && deltas) {
                if (deltas.score_delta !== null && deltas.score_delta !== undefined) {
                    const prefix = deltas.score_delta > 0 ? '+' : '';
                    const color = deltas.score_delta > 0 ? 'var(--neon-red)' : deltas.score_delta < 0 ? 'var(--neon-green)' : 'var(--text-secondary)';
                    const label = deltas.score_delta > 0 ? 'Worsening' : deltas.score_delta < 0 ? 'Improving' : 'Stable';
                    deltaMeanScore.innerHTML = `<span style="color: ${color};">${prefix}${deltas.score_delta} pts</span> <span style="font-size: 0.72rem; color: var(--text-muted);">(${label})</span>`;
                } else {
                    deltaMeanScore.innerHTML = `<span style="color: var(--text-muted);">Baseline Period</span>`;
                }
            }
            if (deltaSevereFlares && deltas) {
                if (deltas.severe_count_delta !== null && deltas.severe_count_delta !== undefined) {
                    const prefix = deltas.severe_count_delta > 0 ? '+' : '';
                    const color = deltas.severe_count_delta > 0 ? 'var(--neon-red)' : deltas.severe_count_delta < 0 ? 'var(--neon-green)' : 'var(--text-secondary)';
                    deltaSevereFlares.innerHTML = `<span style="color: ${color};">${prefix}${deltas.severe_count_delta} flares</span> <span style="font-size: 0.72rem; color: var(--text-muted);">(${deltas.current_severe_count} current)</span>`;
                } else {
                    deltaSevereFlares.innerHTML = `<span>${deltas.current_severe_count || 0} flares</span>`;
                }
            }
            if (deltaDiurnalSlope && deltas) {
                if (deltas.diurnal_slope?.escalation !== null && deltas.diurnal_slope?.escalation !== undefined) {
                    const esc = deltas.diurnal_slope.escalation;
                    const prefix = esc > 0 ? '+' : '';
                    const color = esc >= 1.0 ? 'var(--neon-red)' : 'var(--neon-blue)';
                    deltaDiurnalSlope.innerHTML = `<span style="color: ${color};">${prefix}${esc} pts</span> <span style="font-size: 0.72rem; color: var(--text-muted);">(Morning ${deltas.diurnal_slope.morning_avg || '—'} → Evening ${deltas.diurnal_slope.evening_avg || '—'})</span>`;
                } else {
                    deltaDiurnalSlope.innerHTML = `<span style="color: var(--text-muted);">Stable Baseline</span>`;
                }
            }

            // Populate Anatomical Migration Shifts
            const migrationListEl = document.getElementById('anatomicalMigrationList');
            if (migrationListEl && Array.isArray(data.anatomical_migration)) {
                if (data.anatomical_migration.length === 0) {
                    migrationListEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">No migration shifts detected for this period.</div>`;
                } else {
                    migrationListEl.innerHTML = data.anatomical_migration.map(m => {
                        const trendColor = m.trend === 'increasing' ? 'var(--neon-red)' : m.trend === 'decreasing' ? 'var(--neon-green)' : 'var(--text-muted)';
                        const prefix = m.delta_pct > 0 ? '+' : '';
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.82rem;">
                                <div>
                                    <strong style="color: var(--text-primary);">${escapeHtml(m.area)}</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 6px;">${m.prior_pct}% → ${m.current_pct}%</span>
                                </div>
                                <span class="badge" style="background: rgba(255,255,255,0.06); color: ${trendColor}; font-size: 0.72rem;">
                                    ${prefix}${m.delta_pct}% ${m.trend}
                                </span>
                            </div>
                        `;
                    }).join('');
                }
            }

            // Populate NLP Symptom Progression Timeline
            const symptomProgressionEl = document.getElementById('symptomProgressionList');
            if (symptomProgressionEl && Array.isArray(data.symptom_progression)) {
                symptomProgressionEl.innerHTML = data.symptom_progression.map(s => {
                    const badgeClass = s.mention_count >= 2 ? 'neon-red' : s.mention_count === 1 ? 'neon-orange' : '';
                    return `
                        <div style="padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.82rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong style="color: var(--text-primary);">${escapeHtml(s.category)}</strong>
                                <span class="badge ${badgeClass}" style="font-size: 0.7rem;">${s.mention_count} log${s.mention_count === 1 ? '' : 's'}</span>
                            </div>
                            ${s.recent_snippets && s.recent_snippets.length > 0 ? `
                                <div style="font-size: 0.73rem; color: var(--text-muted); margin-top: 2px; font-style: italic;">
                                    "${escapeHtml(s.recent_snippets[0])}"
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            }

            // Populate Intervention Efficacy & Flare Triggers (Correlation Matrix)
            const reliefDriversEl = document.getElementById('reliefDriversList');
            if (reliefDriversEl) {
                const drivers = data.correlation_matrix?.relief_drivers || [];
                if (drivers.length === 0) {
                    reliefDriversEl.innerHTML = `<div style="padding: 6px 0; color: var(--text-muted);">No recorded rehabilitation sessions for this period.</div>`;
                } else {
                    reliefDriversEl.innerHTML = drivers.map(d => `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span>${escapeHtml(d.intervention)} (${d.session_count} session${d.session_count === 1 ? '' : 's'})</span>
                            <strong style="color: var(--neon-green);">${d.avg_relief > 0 ? '-' : ''}${d.avg_relief} pts avg relief</strong>
                        </div>
                    `).join('');
                }
            }

            const flareTriggersEl = document.getElementById('flareTriggersList');
            if (flareTriggersEl) {
                const triggers = data.correlation_matrix?.flare_triggers || [];
                if (triggers.length === 0) {
                    flareTriggersEl.innerHTML = `<div style="padding: 6px 0; color: var(--text-muted);">No flare triggers detected in log notes.</div>`;
                } else {
                    flareTriggersEl.innerHTML = triggers.map(t => `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span>${escapeHtml(t.trigger)} (${t.sample_count} log${t.sample_count === 1 ? '' : 's'})</span>
                            <strong style="color: var(--neon-red);">${t.flare_association_pct}% flare correlation</strong>
                        </div>
                    `).join('');
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

    // --- Consult Action Checklist Modal (Solicitor & Doctor - High Stress / ADHD-Optimized) ---
    const consultChecklistModal = document.getElementById('consultChecklistModal');
    const tabClancy = document.getElementById('tabClancy');
    const tabDrKhan = document.getElementById('tabDrKhan');
    const btnCloseConsultChecklist = document.getElementById('btnCloseConsultChecklist');
    const btnDoneConsultChecklist = document.getElementById('btnDoneConsultChecklist');
    const btnResetChecklist = document.getElementById('btnResetChecklist');
    const btnCopyVerbatim = document.getElementById('btnCopyVerbatim');
    const verbatimLabel = document.getElementById('verbatimLabel');
    const verbatimText = document.getElementById('verbatimText');
    const consultChecklistTitle = document.getElementById('consultChecklistTitle');
    const consultChecklistBadge = document.getElementById('consultChecklistBadge');
    const consultChecklistSub = document.getElementById('consultChecklistSub');
    const checklistProgressText = document.getElementById('checklistProgressText');
    const checklistProgressBar = document.getElementById('checklistProgressBar');
    const checklistItemsList = document.getElementById('checklistItemsList');
    const inputNewChecklistItem = document.getElementById('inputNewChecklistItem');
    const btnAddChecklistItem = document.getElementById('btnAddChecklistItem');
    const consultLiveNotes = document.getElementById('consultLiveNotes');
    const btnSaveToRumbleNotes = document.getElementById('btnSaveToRumbleNotes');
    const notesSavedFeedback = document.getElementById('notesSavedFeedback');

    let currentConsultTab = 'clancy';

    const CONSULT_CHECKLIST_DATA = {
        clancy: {
            title: "Geoff Clancy - Solicitor Conference",
            badge: "8:30 AM Legal",
            sub: "Direct Custody Risk & R v Smith Hardship",
            verbatimLabel: "Say This First to Clancy (Custody Check)",
            verbatim: "Before we get into details, I need a direct, realistic assessment: Looking at these charges and my history, is immediate custody on the table, or are we looking at a CCO (Community Correction Order), fine, or adjourned undertaking?",
            notesPlaceholder: "Write down Clancy's assessment, advice, required medical wording, and next court dates here...",
            storageKey: "rumble_checklist_clancy_v1",
            notesKey: "rumble_notes_clancy_v1",
            defaultItems: [
                { id: "c1", text: "Demand realistic sentence risk assessment immediately (custody vs CCO/fine).", sub: "Know the worst-case scenario in the first 2 minutes so you can plan the rest of the day." },
                { id: "c2", text: "Present cervical fusion & active spinal cord risk under R v Smith principles.", sub: "Argue that imprisonment is disproportionately harsh and dangerous, warranting a non-custodial CCO." },
                { id: "c3", text: "Request Magistrate Urgent Medical Alert endorsement on warrant if custody is threatened.", sub: "Instructs corrections and Justice Health for immediate intake triage regarding spinal cord vulnerability." },
                { id: "c4", text: "Ask office to pre-lodge surgical & medical records with Justice Health (MAP) prior to court.", sub: "Ensures MAP reception has clinical records on file before any appearance." },
                { id: "c5", text: "Get exact medical report requirements & wording to hand to Dr Khan at 3:00 PM.", sub: "Note down specific clinical tests, phrasing, or specialist attachments required by the court." }
            ]
        },
        drkhan: {
            title: "Dr Khan - Clinical Consult & Court Documentation",
            badge: "3:00 PM Medical",
            sub: "Reflex Assessment, Hardship Letters & Analgesic Review",
            verbatimLabel: "Say This First to Dr Khan (Hardship & Reflexes)",
            verbatim: "I need an urgent bedside neurological reflex check for hyperreflexia (knee kicking out) and two formal court letters today: one for remote AVL appearance, and one detailing custodial medical hardship under R v Smith.",
            notesPlaceholder: "Write down Dr Khan's clinical reflex findings, script details, or specialist referrals here...",
            storageKey: "rumble_checklist_drkhan_v1",
            notesKey: "rumble_notes_drkhan_v1",
            defaultItems: [
                { id: "d1", text: "Bedside neurological check: Test patellar reflexes for hyperreflexia and ankle clonus.", sub: "Ensure Dr Khan notes down brisk reflexes/clonus with today's date in medical records." },
                { id: "d2", text: "Court Medical Hardship Report (R v Smith): Letter to Presiding Magistrate.", sub: "Details 24 June 2026 fusion, active cord compression risk, fatal/paralysis danger in prison, lack of hydrotherapy." },
                { id: "d3", text: "Remote Court Appearance Certificate (AVL / Webex).", sub: "States prolonged static sitting/standing causes disabling pain (8-9/10), making courtroom attendance unsafe." },
                { id: "d4", text: "Printouts of RMH Surgical Summary & Signed Current Medication Chart.", sub: "Physical copies of Royal Melbourne Hospital fusion summary and scripts (Panadeine Forte) for Justice Health." },
                { id: "d5", text: "Prescription repeat & neurosurgical follow-up referral.", sub: "PBS Authority repeat for Panadeine Forte and referral update to Prof. Greg Cunningham (RMH)." }
            ]
        }
    };

    function loadChecklistItems(tab) {
        const conf = CONSULT_CHECKLIST_DATA[tab];
        try {
            const raw = localStorage.getItem(conf.storageKey);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error("Error reading checklist from storage", e);
        }
        return conf.defaultItems.map(item => ({ ...item, checked: false }));
    }

    function saveChecklistItems(tab, items) {
        const conf = CONSULT_CHECKLIST_DATA[tab];
        try {
            localStorage.setItem(conf.storageKey, JSON.stringify(items));
        } catch (e) {
            console.error("Error saving checklist to storage", e);
        }
    }

    function renderConsultChecklist() {
        const conf = CONSULT_CHECKLIST_DATA[currentConsultTab];
        if (!conf) return;

        // Header and Verbatim box
        if (consultChecklistTitle) consultChecklistTitle.innerText = conf.title;
        if (consultChecklistBadge) consultChecklistBadge.innerText = conf.badge;
        if (consultChecklistSub) consultChecklistSub.innerText = conf.sub;
        if (verbatimLabel) verbatimLabel.innerText = conf.verbatimLabel;
        if (verbatimText) verbatimText.innerText = conf.verbatim;

        // Tab styling
        if (tabClancy && tabDrKhan) {
            if (currentConsultTab === 'clancy') {
                tabClancy.style.borderColor = 'var(--neon-purple)';
                tabClancy.style.background = 'rgba(181, 0, 255, 0.15)';
                tabClancy.style.opacity = '1';
                tabDrKhan.style.borderColor = 'var(--glass-border)';
                tabDrKhan.style.background = 'transparent';
                tabDrKhan.style.opacity = '0.65';
            } else {
                tabDrKhan.style.borderColor = 'var(--neon-blue)';
                tabDrKhan.style.background = 'rgba(0, 240, 255, 0.15)';
                tabDrKhan.style.opacity = '1';
                tabClancy.style.borderColor = 'var(--glass-border)';
                tabClancy.style.background = 'transparent';
                tabClancy.style.opacity = '0.65';
            }
        }

        // Load items & notes
        const items = loadChecklistItems(currentConsultTab);
        
        // Progress
        const total = items.length;
        const completed = items.filter(i => i.checked).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        if (checklistProgressText) checklistProgressText.innerText = `${completed} of ${total} actions completed (${pct}%)`;
        if (checklistProgressBar) checklistProgressBar.style.width = `${pct}%`;

        // Render items
        if (checklistItemsList) {
            checklistItemsList.innerHTML = '';
            items.forEach((item, idx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'glass-panel';
                itemDiv.style.padding = '10px 12px';
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'flex-start';
                itemDiv.style.gap = '12px';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.border = item.checked ? '1px solid rgba(0, 255, 102, 0.3)' : '1px solid var(--glass-border)';
                itemDiv.style.background = item.checked ? 'rgba(0, 255, 102, 0.04)' : 'rgba(255, 255, 255, 0.02)';
                itemDiv.style.transition = 'all 0.2s ease';

                itemDiv.innerHTML = `
                    <input type="checkbox" id="chk_${currentConsultTab}_${idx}" data-idx="${idx}" ${item.checked ? 'checked' : ''} style="width: 20px; height: 20px; margin-top: 2px; accent-color: var(--neon-green); cursor: pointer; flex-shrink: 0;">
                    <div style="flex: 1;">
                        <label for="chk_${currentConsultTab}_${idx}" style="display: block; font-size: 0.92rem; font-weight: 600; color: ${item.checked ? 'var(--neon-green)' : '#fff'}; text-decoration: ${item.checked ? 'line-through' : 'none'}; opacity: ${item.checked ? '0.75' : '1'}; cursor: pointer;">
                            <span style="display: inline-block; width: 18px; color: var(--neon-blue); font-size: 0.8rem; font-weight: 700;">${idx + 1}.</span> ${escapeHtml(item.text)}
                        </label>
                        ${item.sub ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; line-height: 1.35; margin-left: 18px;">${escapeHtml(item.sub)}</div>` : ''}
                    </div>
                    <button type="button" class="btn-delete-checklist-item" data-idx="${idx}" title="Delete item" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 0 4px; line-height: 1;">&times;</button>
                `;

                const checkbox = itemDiv.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.addEventListener('change', (e) => {
                        items[idx].checked = e.target.checked;
                        saveChecklistItems(currentConsultTab, items);
                        renderConsultChecklist();
                    });
                }

                const deleteBtn = itemDiv.querySelector('.btn-delete-checklist-item');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        items.splice(idx, 1);
                        saveChecklistItems(currentConsultTab, items);
                        renderConsultChecklist();
                    });
                }

                checklistItemsList.appendChild(itemDiv);
            });
        }

        // Live Notes
        if (consultLiveNotes) {
            consultLiveNotes.placeholder = conf.notesPlaceholder;
            const savedNotes = localStorage.getItem(conf.notesKey) || '';
            consultLiveNotes.value = savedNotes;
        }
    }

    function openConsultChecklistModal(initialTab = 'clancy') {
        currentConsultTab = initialTab;
        renderConsultChecklist();
        if (consultChecklistModal) {
            consultChecklistModal.classList.remove('hidden');
        }
    }

    if (tabClancy) {
        tabClancy.addEventListener('click', () => {
            currentConsultTab = 'clancy';
            renderConsultChecklist();
        });
    }

    if (tabDrKhan) {
        tabDrKhan.addEventListener('click', () => {
            currentConsultTab = 'drkhan';
            renderConsultChecklist();
        });
    }

    if (btnCopyVerbatim) {
        btnCopyVerbatim.addEventListener('click', async () => {
            const conf = CONSULT_CHECKLIST_DATA[currentConsultTab];
            if (!conf || !conf.verbatim) return;
            try {
                await navigator.clipboard.writeText(conf.verbatim);
                const originalText = btnCopyVerbatim.innerText;
                btnCopyVerbatim.innerText = 'Copied!';
                btnCopyVerbatim.style.borderColor = 'var(--neon-green)';
                btnCopyVerbatim.style.color = 'var(--neon-green)';
                setTimeout(() => {
                    btnCopyVerbatim.innerText = originalText;
                    btnCopyVerbatim.style.borderColor = 'var(--neon-blue)';
                    btnCopyVerbatim.style.color = 'var(--neon-blue)';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text', err);
            }
        });
    }

    if (btnAddChecklistItem && inputNewChecklistItem) {
        const handleAdd = () => {
            const val = inputNewChecklistItem.value.trim();
            if (!val) return;
            const items = loadChecklistItems(currentConsultTab);
            items.push({
                id: `custom_${Date.now()}`,
                text: val,
                sub: "Custom added during consult prep",
                checked: false
            });
            saveChecklistItems(currentConsultTab, items);
            inputNewChecklistItem.value = '';
            renderConsultChecklist();
        };

        btnAddChecklistItem.addEventListener('click', handleAdd);
        inputNewChecklistItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
            }
        });
    }

    if (consultLiveNotes) {
        consultLiveNotes.addEventListener('input', () => {
            const conf = CONSULT_CHECKLIST_DATA[currentConsultTab];
            if (conf) {
                localStorage.setItem(conf.notesKey, consultLiveNotes.value);
                if (notesSavedFeedback) {
                    const now = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                    notesSavedFeedback.innerText = `Auto-saved to device at ${now}`;
                }
            }
        });
    }

    if (btnSaveToRumbleNotes) {
        btnSaveToRumbleNotes.addEventListener('click', async () => {
            const conf = CONSULT_CHECKLIST_DATA[currentConsultTab];
            const content = consultLiveNotes ? consultLiveNotes.value.trim() : '';
            if (!content) {
                showToast('Type notes before saving to permanent notes', 'info');
                return;
            }
            btnSaveToRumbleNotes.disabled = true;
            btnSaveToRumbleNotes.innerText = 'Saving...';
            try {
                const noteTitle = currentConsultTab === 'clancy' ? 'Legal Consult Notes (Geoff Clancy)' : 'Medical Consult Notes (Dr Khan)';
                const formattedContent = `# ${noteTitle}\nDate: ${new Date().toLocaleDateString('en-AU')}\n\n${content}`;
                const res = await fetch(API_NOTES, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: formattedContent,
                        author: 'user',
                        pinned: true
                    })
                });
                if (res.ok) {
                    showToast('Saved to Rumble Notes & Neon DB', 'success');
                    if (notesSavedFeedback) {
                        notesSavedFeedback.innerText = 'Permanently saved to Rumble Notes database.';
                    }
                    loadNotes();
                } else {
                    showToast('Failed to save permanent note', 'error');
                }
            } catch (err) {
                console.error('Error saving note', err);
                showToast('Network error saving note', 'error');
            } finally {
                btnSaveToRumbleNotes.disabled = false;
                btnSaveToRumbleNotes.innerText = 'Save to Permanent Notes';
            }
        });
    }

    if (btnResetChecklist) {
        btnResetChecklist.addEventListener('click', () => {
            const conf = CONSULT_CHECKLIST_DATA[currentConsultTab];
            if (conf && confirm('Reset checklist items to default?')) {
                const defaults = conf.defaultItems.map(i => ({ ...i, checked: false }));
                saveChecklistItems(currentConsultTab, defaults);
                renderConsultChecklist();
                showToast('Checklist reset to defaults', 'info');
            }
        });
    }

    if (btnCloseConsultChecklist && consultChecklistModal) {
        btnCloseConsultChecklist.addEventListener('click', () => {
            consultChecklistModal.classList.add('hidden');
        });
    }

    if (btnDoneConsultChecklist && consultChecklistModal) {
        btnDoneConsultChecklist.addEventListener('click', () => {
            consultChecklistModal.classList.add('hidden');
        });
    }


    // --- MacroDroid Weekly Thursday Banner Check ---
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

    // --- Regulatory Complaints Manifest Modal (CAV, ACCC, VPA) ---
    const COMPLAINTS_DATA = {
        cav: {
            recipient: "consumer@justice.vic.gov.au",
            reference: "Consumer Affairs Victoria",
            badge: "CAV Consumer Rights Complaint",
            badgeClass: "neon-green",
            subject: "Formal Consumer Complaint: Chemist Warehouse Wangaratta – Breach of Consumer Guarantees (ACL Section 60), Disgraceful Customer Service & Record Suppression",
            body: `To Consumer Affairs Victoria,

RE: Formal Consumer Complaint – Chemist Warehouse (Wangaratta, VIC)
Complainant: James Jones
Residential Address: 158 Tone Rd, Wangaratta VIC 3677
Phone: 0402 270 259
Email: thunderops.ai@gmail.com
Trader: Chemist Warehouse Wangaratta (CW Retail Services Pty Ltd)
Trader Internal Case Reference: Case #516500 (Logged 13 October 2026 – Unresolved)
ACCC Report Reference: REF4785185

I am writing to formally lodge a consumer complaint against Chemist Warehouse Wangaratta under the Australian Consumer Law (Victoria) for serious failures to provide services with due care and skill, unlawful cancellation of active prescriptions, gross customer service failure, and obstruction of complaint mechanisms.

Summary of Grounds:

1. Unilateral Prescription Cancellations & Health Endangerment:
   Active, valid medical prescriptions presented to this pharmacy were repeatedly cancelled without patient consultation, notice, or consent. This failure directly severed therapeutic continuity and access to vital pain management.

2. Disgraceful Customer Service & Contemptuous Pharmacist Conduct:
   The dispensing pharmacists at the Wangaratta store displayed appalling customer service and total hostility when questioned about missing medications and cancelled scripts. They exhibited zero professional care, refused to examine dispensary logs or stock reconciliations, and treated legitimate patient inquiries with contempt.

3. Complete Obstruction of Complaint Channels & Staff Incompetence:
   During an in-person store visit, I specifically asked a front-counter staff member how to lodge a complaint—prompting her with standard channels: an email address, telephone number, feedback form, website link, or a duty manager to speak with. The staff member stated she had absolutely no idea, could provide none of those channels, and had no avenue to record my grievance. When asked how long she had worked there, she stated 5 years. A retail pharmacy employee of 5 years having zero knowledge of any complaints pathway illustrates deliberate institutional obstruction and a systemic corporate failure to provide accessible consumer recourse.

4. Unaccounted Schedule 8 Medication:
   Dispensary stock reconciliations for my prescribed Schedule 8 medication (Targin) could not be accounted for by dispensary staff during in-person visits. In-store staff refused to take responsibility or provide a record of dispensing attempts.

5. Digital Consumer Record Suppression:
   Historical communications, enquiries, and digital transaction history within the proprietary Chemist Warehouse application have been purged or rendered inaccessible, obstructing documentation of previous dispensing requests.

6. Total Breakdown in Corporate Dispute Resolution:
   A formal complaint was lodged with head office customer service on 13 October 2026 (Case #516500). Despite repeated written follow-ups requesting urgent management contact, the business has completely ignored the case and failed to provide any phone or email contact after nearly two weeks.

Remedy Sought:
1. Formal conciliation compelling Chemist Warehouse to provide full dispensary audit logs and archived communication transcripts.
2. Written reconciliation of the unaccounted Schedule 8 medication.
3. Investigation into Chemist Warehouse's practice of cancelling valid prescriptions without consumer notification and obstructing consumer dispute resolution in store.

Kind regards,

James Jones
158 Tone Rd, Wangaratta VIC 3677
Phone: 0402 270 259
Email: thunderops.ai@gmail.com`
        },
        accc: {
            recipient: "info.centre@accc.gov.au",
            reference: "ACCC Ref: REF4785185",
            badge: "ACCC Supplementary Report",
            badgeClass: "neon-blue",
            subject: "Re: We received your report (Reference: REF4785185) – Supplementary Evidence & Systemic Failure Update",
            body: `Attn: Infocentre,
Australian Competition and Consumer Commission (ACCC),

RE: Supplementary Update to Consumer Report REF4785185
Business: Chemist Warehouse (Wangaratta, VIC branch / CW Retail Services Pty Ltd)
Complainant: James Jones
Phone: 0402 270 259
Email: thunderops.ai@gmail.com

I am writing to provide an urgent evidentiary update to my consumer report REF4785185 regarding Chemist Warehouse Wangaratta.

Following my initial lodging on 13 October 2026:
1. Total Customer Service Failure: Chemist Warehouse assigned internal Case #516500 on 13 October 2026. Despite scheduled medication (Targin) being unaccounted for and repeated written requests for management contact, the business has completely failed to respond after nearly two weeks.
2. Obstruction of In-Store Complaint Pathways: During in-person visits to the Wangaratta store, front-counter staff employed for over 5 years explicitly stated they had zero avenues, forms, email addresses, or phone numbers to receive consumer complaints, representing an intentional barrier to dispute resolution.
3. Hostile Pharmacist Conduct: Dispensing pharmacists exhibited unacceptable customer service, refusing to investigate missing scripts or provide accountability.
4. Suppression of Digital Consumer Records: Historical communication records and prescription histories within the proprietary Chemist Warehouse mobile app have vanished/been removed, hindering consumer access to transaction records and documentation of dispensing requests.
5. Health & Safety Risk: Repeated cancellations of active, valid scripts without prior notice or clinical consultation represents an unreasonable failure to render services with due care and skill under Section 60 of the Australian Consumer Law.

This documentation is submitted to form part of the ACCC's compliance intelligence regarding unfair practices, obstruction of complaint mechanisms, and electronic record suppression by this pharmacy group.

Kind regards,

James Jones
0402 270 259
thunderops.ai@gmail.com`
        },
        vpa: {
            recipient: "enquiries@pharmacy.vic.gov.au",
            reference: "Premises: Chemist Warehouse Wangaratta",
            badge: "VPA Operational & S8 Complaint",
            badgeClass: "neon-purple",
            subject: "Formal Complaint: Chemist Warehouse Wangaratta – Pharmacy Operations, Record Keeping & Unaccounted Schedule 8 Prescription (Targin)",
            body: `To the Registrar & Complaints Officer,
Victorian Pharmacy Authority (VPA),

RE: Formal Complaint – Pharmacy Operations & S8 Medication Record Keeping
Premises: Chemist Warehouse Wangaratta (VIC)
Patient / Complainant: James Jones
Phone: 0402 270 259
Email: thunderops.ai@gmail.com

I am writing to formally lodge a complaint regarding serious operational and record-keeping deficiencies at Chemist Warehouse Wangaratta, specifically concerning the handling and dispensing of my Schedule 8 prescription medication (Targin).

Key grounds of complaint:
1. Unaccounted Schedule 8 Medication / Script Discrepancy:
   - On multiple occasions over recent months, valid electronic/hard-copy prescriptions for Targin presented for dispensing were cancelled or remained unfulfilled without clinical explanation or notification.
   - Repeated in-store visits to resolve the discrepancy with the dispensing pharmacist revealed that a box of Targin could not be accounted for on the dispensary records.
2. Lack of Clinical Governance & Unprofessional Conduct:
   - In-store dispensary staff and front-counter employees repeatedly refused or were unable to provide records of dispensing attempts, escalate to the supervising pharmacy owner/manager, or provide a complaints pathway.
   - Staff employed at the store for over 5 years stated they have no complaints process or management contact available.
   - Digital communication records and chat history within the Chemist Warehouse patient portal have been cleared or rendered inaccessible.
3. Failure to Respond to Serious Prescription Enquiries:
   - A formal complaint was lodged with head office (Internal Case #516500) on 13 October 2026 requesting audit of dispensary logs and CCTV. To date, no pharmacist or management representative has contacted me.

Given the strict regulatory requirements governing Schedule 8 poisons and dispensary audit trails under the Pharmacy Regulation Act 2010 (Vic) and Drugs, Poisons and Controlled Substances Act 1981, I respectfully request that the Authority investigate the dispensary procedures, register reconciliation, and operational practices at this premises.

Supporting correspondence and incident timelines can be provided upon request.

Kind regards,

James Jones
158 Tone Rd, Wangaratta VIC 3677
Phone: 0402 270 259
Email: thunderops.ai@gmail.com`
        }
    };

    let currentComplaintTab = 'cav';

    function renderComplaintView(tabKey = 'cav') {
        currentComplaintTab = tabKey;
        const data = COMPLAINTS_DATA[tabKey];
        if (!data) return;

        const badge = document.getElementById('complaintBadge');
        const ref = document.getElementById('complaintRef');
        const recipient = document.getElementById('complaintRecipient');
        const subject = document.getElementById('complaintSubject');
        const bodyText = document.getElementById('complaintBodyText');

        if (badge) {
            badge.className = `badge ${data.badgeClass}`;
            badge.textContent = data.badge;
        }
        if (ref) ref.textContent = data.reference;
        if (recipient) recipient.textContent = data.recipient;
        if (subject) subject.textContent = data.subject;
        if (bodyText) bodyText.textContent = data.body;

        const tabCav = document.getElementById('tabComplaintsCav');
        const tabAccc = document.getElementById('tabComplaintsAccc');
        const tabVpa = document.getElementById('tabComplaintsVpa');
        [tabCav, tabAccc, tabVpa].forEach(btn => {
            if (btn) btn.className = 'btn btn-sm btn-outline';
        });
        if (tabKey === 'cav' && tabCav) tabCav.className = 'btn btn-sm btn-neon-green active';
        if (tabKey === 'accc' && tabAccc) tabAccc.className = 'btn btn-sm btn-neon-blue active';
        if (tabKey === 'vpa' && tabVpa) tabVpa.className = 'btn btn-sm btn-neon-purple active';
    }

    function openComplaintsModal(initialTab = 'cav') {
        renderComplaintView(initialTab);
        const modal = document.getElementById('complaintsModal');
        if (modal) modal.classList.remove('hidden');
    }

    const modalComplaints = document.getElementById('complaintsModal');
    const btnCloseComplaints = document.getElementById('btnCloseComplaintsModal');
    const btnDoneComplaints = document.getElementById('btnDoneComplaintsModal');
    const btnCopyComplaint = document.getElementById('btnCopyComplaintText');

    [btnCloseComplaints, btnDoneComplaints].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (modalComplaints) modalComplaints.classList.add('hidden');
            });
        }
    });

    const tabCav = document.getElementById('tabComplaintsCav');
    const tabAccc = document.getElementById('tabComplaintsAccc');
    const tabVpa = document.getElementById('tabComplaintsVpa');

    if (tabCav) tabCav.addEventListener('click', () => renderComplaintView('cav'));
    if (tabAccc) tabAccc.addEventListener('click', () => renderComplaintView('accc'));
    if (tabVpa) tabVpa.addEventListener('click', () => renderComplaintView('vpa'));

    if (btnCopyComplaint) {
        btnCopyComplaint.addEventListener('click', () => {
            const data = COMPLAINTS_DATA[currentComplaintTab];
            if (data && data.body) {
                navigator.clipboard.writeText(data.body);
                const originalText = btnCopyComplaint.textContent;
                btnCopyComplaint.textContent = "✓ Copied to Clipboard";
                setTimeout(() => {
                    btnCopyComplaint.textContent = originalText;
                }, 2000);
            }
        });
    }

    function openCourtModal() {
        const modal = document.getElementById('courtModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            window.open('https://csvic.webex.com/meet/26517100652', '_blank');
        }
    }
    window.openCourtModal = openCourtModal;

    const modalCourt = document.getElementById('courtModal');
    const btnCloseCourt = document.getElementById('btnCloseCourtModal');
    const btnCloseCourtBtn = document.getElementById('btnCloseCourtBtn');
    const btnCopyCourtPw = document.getElementById('btnCopyCourtPassword');

    [btnCloseCourt, btnCloseCourtBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (modalCourt) modalCourt.classList.add('hidden');
            });
        }
    });

    if (btnCopyCourtPw) {
        btnCopyCourtPw.addEventListener('click', () => {
            navigator.clipboard.writeText('7VDyhKbVX74');
            const orig = btnCopyCourtPw.textContent;
            btnCopyCourtPw.textContent = '✓ Password Copied';
            if (typeof showToast === 'function') {
                showToast('Webex Password copied: 7VDyhKbVX74', 'success');
            }
            setTimeout(() => {
                btnCopyCourtPw.textContent = orig;
            }, 2500);
        });
    }

    checkMacroDroidBanner();
    setInterval(checkMacroDroidBanner, 60000);

});

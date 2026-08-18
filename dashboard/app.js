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
                                <button class="btn btn-neon-purple btn-show-me" data-id="${item.id}" ${isCompleted ? 'disabled' : ''}>Show Me</button>
                                <button class="btn btn-neon-green btn-done" data-id="${item.id}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Done' : 'Done'}</button>
                                <button class="btn btn-outline btn-dismiss" data-id="${item.id}" ${isCompleted ? '' : 'disabled'}>Dismiss</button>
                            </div>
                        `;
                        agendaStream.appendChild(card);
                        attachCardEvents(card);
                    });
                }
                
                if (weeklyAgendaList) {
                    weeklyAgendaList.innerHTML = '';
                    if (data.weekly && data.weekly.length > 0) {
                        data.weekly.forEach(w => {
                            const div = document.createElement('div');
                            div.className = 'agenda-item';
                            div.innerHTML = `<span class="agenda-date">${w.day || w.date}</span><span class="agenda-text">${w.title}</span>`;
                            weeklyAgendaList.appendChild(div);
                        });
                    } else if (data.calendar_status === 'auth_required') {
                        weeklyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text" style="color: var(--neon-blue);">Google Calendar authorization required to sync live events.</span></div>`;
                    } else {
                        weeklyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text">No calendar events scheduled this week.</span></div>`;
                    }
                }

                if (monthlyAgendaList) {
                    monthlyAgendaList.innerHTML = '';
                    if (data.monthly && data.monthly.length > 0) {
                        data.monthly.forEach(m => {
                            const div = document.createElement('div');
                            div.className = 'agenda-item';
                            div.innerHTML = `<span class="agenda-date">${m.date}</span><span class="agenda-text">${m.title}</span>`;
                            monthlyAgendaList.appendChild(div);
                        });
                    } else if (data.calendar_status === 'auth_required') {
                        monthlyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text" style="color: var(--neon-purple);">Google Calendar authorization required.</span></div>`;
                    } else {
                        monthlyAgendaList.innerHTML = `<div class="agenda-item"><span class="agenda-text">No calendar events scheduled this month.</span></div>`;
                    }
                }
            }
        } catch (e) {
            showToast('Failed to load agenda');
            console.error(e);
        }
    }

    loadAgenda();

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
            proposal_context: currentProposalText,
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

    async function loadNotes() {
        try {
            const res = await fetch(API_NOTES);
            if (res.ok) {
                const data = await res.json();
                if (data.notes && data.notes.length > 0) {
                    const textList = data.notes.map(n => `- ${n.content}`).join('\n');
                    notesArea.value = textList;
                } else {
                    notesArea.value = '';
                }
            }
        } catch (e) {
            showToast('Failed to load notes');
            console.error(e);
        }
    }

    btnSaveNotes.addEventListener('click', async () => {
        const content = notesArea.value.trim();
        notesStatus.innerText = "Saving...";
        try {
            await fetch(API_NOTES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content, author: 'user' })
            });
            notesStatus.innerText = "Saved";
            setTimeout(() => { notesStatus.innerText = "Synced with Neon DB"; }, 2000);
        } catch (e) {
            notesStatus.innerText = "Save failed";
            setTimeout(() => { notesStatus.innerText = "Synced with Neon DB"; }, 2000);
        }
    });

    btnAskRumbleNote.addEventListener('click', () => {
        notesModal.classList.add('hidden');
        rumbleChatModal.classList.remove('hidden');
        rumbleChatInput.value = "Rumble, please record a directive note regarding my recovery agenda.";
    });

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

        if (showBtn) {
            showBtn.addEventListener('click', () => {
                const id = showBtn.getAttribute('data-id');
                startRunnerModal(id);
            });
        }

        if (doneBtn) {
            doneBtn.addEventListener('click', async () => {
                const id = doneBtn.getAttribute('data-id');
                card.classList.add('completed');
                doneBtn.innerText = "Done";
                doneBtn.disabled = true;
                const dismissBtn = card.querySelector('.btn-dismiss');
                if (dismissBtn) {
                    dismissBtn.disabled = false;
                    dismissBtn.addEventListener('click', () => card.remove());
                }
                pendingProtocol = { id, name: card.querySelector('.protocol-info p')?.innerText || id, beforePain: currentPainLevel || 1, card, doneBtn };
                reliefExerciseName.innerText = pendingProtocol.name;
                afterPainScore.value = pendingProtocol.beforePain;
                reliefModal.classList.remove('hidden');
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
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(100%)';
                    setTimeout(() => card.remove(), 400);
                }, 200);
            }
        } catch (err) {
            showToast('Failed to complete agenda item');
            console.error(err);
        }
    }


    document.querySelectorAll('.protocol-card').forEach(attachCardEvents);

    let runnerInterval;
    function startRunnerModal(id) {
        runnerModal.classList.remove('hidden');
        
        let steps = [];
        if (id && id.toLowerCase().includes('yoga')) {
            steps = [
                { title: "Alignment & Position", duration: 30 },
                { title: "Gentle Spinal Decompression", duration: 60 },
                { title: "Hip Mobility Flow", duration: 45 },
                { title: "Restorative Hamstring Extension", duration: 60 }
            ];
        } else if (id && id.toLowerCase().includes('meditation')) {
            steps = [
                { title: "Find a Comfortable Position", duration: 30 },
                { title: "Box Breathing", duration: 120 },
                { title: "Body Scan", duration: 180 },
                { title: "Gentle Return", duration: 30 }
            ];
        } else {
            steps = [{ title: "Alignment & Position", duration: 30 }];
        }
        
        let currentStepIndex = 0;
        let timeLeft = steps[currentStepIndex].duration;
        
        function formatTime(secs) {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        function updateStepUI() {
            runnerStep.innerText = `Step ${currentStepIndex + 1}: ${steps[currentStepIndex].title}`;
            runnerTimer.innerText = formatTime(timeLeft);
        }
        
        updateStepUI();
        clearInterval(runnerInterval);
        
        runnerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) {
                currentStepIndex++;
                if (currentStepIndex >= steps.length) {
                    clearInterval(runnerInterval);
                    runnerStep.innerText = "Routine Complete!";
                    runnerTimer.innerText = "00:00";
                } else {
                    timeLeft = steps[currentStepIndex].duration;
                    updateStepUI();
                }
            } else {
                runnerTimer.innerText = formatTime(timeLeft);
            }
        }, 1000);
    }

    btnCancelRunner.addEventListener('click', () => {
        runnerModal.classList.add('hidden');
        clearInterval(runnerInterval);
    });

    btnNextStep.addEventListener('click', () => {
        runnerModal.classList.add('hidden');
        clearInterval(runnerInterval);
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
                    rumbleChatModal.classList.remove('hidden');
                    // We don't have currentProposalText in scope properly, so we just send the chat directly
                    sendRumbleChatMessage(`Show me how to do the ${exercise.name} routine step-by-step. It is a ${exercise.duration_minutes} minute routine focusing on ${exercise.instruction}.`);
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

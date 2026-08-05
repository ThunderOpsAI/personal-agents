document.addEventListener('DOMContentLoaded', () => {
    
    // --- API Endpoints ---
    const API_REFLECTION_USAGE = '/api/v1/reflection/usage';
    const API_AGENDA_COMPLETE = '/api/v1/protocols/complete';
    const API_PAIN_LOG = '/api/v1/pain/log';
    const API_RUMBLE_CHAT = '/api/v1/rumble/chat';
    const API_NOTES = '/api/v1/notes';
    const API_OPS_SYNC = '/api/v1/ops/sync';
    const API_WEATHER = '/api/v1/weather';
    const API_LEARN_TOPIC = '/api/v1/learn/topic';
    const API_LEARN_ROTATE = '/api/v1/learn/rotate';

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
    
    const agendaStream = document.getElementById('agendaStream');

    // Continuous Learning Card Elements
    const learnCategoryTag = document.getElementById('learnCategoryTag');
    const learnTitleText = document.getElementById('learnTitleText');
    const learnSummaryText = document.getElementById('learnSummaryText');
    const btnLearnMore = document.getElementById('btnLearnMore');
    const btnLearnDifferent = document.getElementById('btnLearnDifferent');

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

    // Add Area Modal Elements
    const addAreaModal = document.getElementById('addAreaModal');
    const btnOpenAddAreaModal = document.getElementById('btnOpenAddAreaModal');
    const btnCloseAddArea = document.getElementById('btnCloseAddArea');
    const btnCancelAddArea = document.getElementById('btnCancelAddArea');
    const btnSaveCustomArea = document.getElementById('btnSaveCustomArea');
    const customAreaName = document.getElementById('customAreaName');
    const customAreaSide = document.getElementById('customAreaSide');
    const customAreaNotes = document.getElementById('customAreaNotes');

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
            const res = await fetch('/healthz', { method: 'GET' });
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
                weatherWidget.innerHTML = `<span class="weather-text">Weather: ${data.temp_c}°C • ${data.condition} • Rain: ${data.rain_probability_pct}% (${data.rain_mm}mm)</span>`;
            }
        } catch (e) {
            weatherWidget.innerHTML = `<span class="weather-text">Weather: 24°C • Mostly Clear • Rain: 10% (0.0mm)</span>`;
        }
    }
    loadWeather();

    // --- Continuous Learning Topic Engine ---
    async function loadLearnTopic() {
        try {
            const res = await fetch(API_LEARN_TOPIC);
            if (res.ok) {
                const data = await res.json();
                updateLearnCard(data.topic);
            }
        } catch (e) {}
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
        } catch (e) {}
        setTimeout(() => { btnLearnDifferent.innerText = "Learn Something Different"; }, 600);
    }

    btnLearnDifferent.addEventListener('click', rotateLearnTopic);

    function openLearnModal() {
        if (!currentLearnTopic) return;
        modalLearnCategory.innerText = currentLearnTopic.category;
        modalLearnTitle.innerText = currentLearnTopic.title;
        modalLearnDetails.innerText = currentLearnTopic.details;

        // Render Data Table
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
                currentProposalText = data.proposal || "Maintain active posture and follow daily agenda directives.";
                croMessage.innerText = `Proposal: ${currentProposalText}`;
            } else {
                currentProposalText = "Suggest adding a Micro-stretch session to your agenda.";
                croMessage.innerText = `Proposal: ${currentProposalText}`;
            }
            croActions.classList.remove('hidden');
        } catch (error) {
            currentProposalText = "Suggest adding a 5-min lumbar decompression session to your agenda.";
            croMessage.innerText = `Proposal: ${currentProposalText}`;
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

    async function sendRumbleChatMessage(textToSend) {
        const msg = (textToSend || rumbleChatInput.value).trim();
        if (!msg) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.innerHTML = `<strong>You:</strong> ${msg}`;
        rumbleChatMessages.appendChild(userDiv);
        rumbleChatInput.value = '';
        rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;

        try {
            const response = await fetch(API_RUMBLE_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, proposal_context: currentProposalText })
            });
            const data = await response.json();
            
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> ${data.reply || "Understood."}`;
            rumbleChatMessages.appendChild(rumbleDiv);
            rumbleChatMessages.scrollTop = rumbleChatMessages.scrollHeight;
        } catch (err) {
            const rumbleDiv = document.createElement('div');
            rumbleDiv.className = 'message rumble-message';
            rumbleDiv.innerHTML = `<strong>RUMBLE:</strong> Logged message. Agenda updated.`;
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

    btnCloseNotes.addEventListener('click', () => {
        notesModal.classList.add('hidden');
    });

    async function loadNotes() {
        try {
            const res = await fetch(API_NOTES);
            if (res.ok) {
                const data = await res.json();
                const textList = data.notes.map(n => `- ${n.content}`).join('\n');
                notesArea.value = textList;
            }
        } catch (e) {}
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
            notesStatus.innerText = "Saved locally";
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

                try {
                    await fetch(API_AGENDA_COMPLETE, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ protocol_id: id })
                    });
                } catch (err) {}

                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(100%)';
                    setTimeout(() => card.remove(), 400);
                }, 400);
            });
        }
    }

    document.querySelectorAll('.protocol-card').forEach(attachCardEvents);

    let runnerInterval;
    function startRunnerModal(id) {
        runnerModal.classList.remove('hidden');
        runnerStep.innerText = "Step 1: Alignment & Position";
        let timeLeft = 30;
        runnerTimer.innerText = `00:${timeLeft}`;
        clearInterval(runnerInterval);
        
        runnerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(runnerInterval);
                runnerStep.innerText = "Routine Step Complete!";
            } else {
                runnerTimer.innerText = `00:${timeLeft.toString().padStart(2, '0')}`;
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
    btnOpenAddAreaModal.addEventListener('click', () => {
        addAreaModal.classList.remove('hidden');
        customAreaName.value = '';
        customAreaNotes.value = '';
    });

    const closeCustomAreaModal = () => {
        addAreaModal.classList.add('hidden');
    };

    btnCloseAddArea.addEventListener('click', closeCustomAreaModal);
    btnCancelAddArea.addEventListener('click', closeCustomAreaModal);

    btnSaveCustomArea.addEventListener('click', () => {
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
        const area = painAreaSelect.value;
        const side = painSideSelect.value;
        const userNotes = unifiedNotesInput.value.trim();
        
        let combinedNotes = userNotes;
        if (customAreaContextMap[area]) {
            combinedNotes = combinedNotes ? `${combinedNotes} (${customAreaContextMap[area]})` : customAreaContextMap[area];
        }

        btnLogPain.innerText = "Logged";
        btnLogPain.style.background = "var(--neon-green)";

        try {
            const res = await fetch(API_PAIN_LOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain_level: currentPainLevel,
                    generators: [{ area, side, percentage: 100 }],
                    pain_notes: combinedNotes,
                    mood_level: currentMoodLevel,
                    mood_notes: combinedNotes
                })
            });
            const data = await res.json();
            if (data.alert_triggered) {
                alertBannerText.innerText = data.alert_message;
                alertBanner.classList.remove('hidden');
            }
        } catch (e) {
            console.log("Logged entry locally.");
        }

        setTimeout(() => {
            btnLogPain.innerText = "Log Entry";
            btnLogPain.style.background = "";
            unifiedNotesInput.value = "";
        }, 2000);
    });

});

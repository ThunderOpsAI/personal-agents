const fs = require('fs');

let content = fs.readFileSync('dashboard/app.js', 'utf8');

// A. Replace `isTomorrowView` with `currentAgendaView` in loadAgenda
content = content.replace(
    /if \(isTomorrowView\) \{\s*renderTomorrowAgenda\(\);\s*return;\s*\}/,
    `if (currentAgendaView === 'tomorrow') {
                    renderTomorrowAgenda();
                    return;
                } else if (currentAgendaView === 'yesterday') {
                    renderYesterdayAgenda();
                    return;
                }`
);

// Add currentAgendaView state
content = content.replace(
    /let currentLearnTopic = null;/,
    "let currentLearnTopic = null;\n    let currentAgendaView = 'today';"
);

// B. In renderTodayAgenda: handle dismissed items and UI
let renderTodayAgendaSrc = `
    function renderTodayAgenda(data) {
        const today = new Date();
        const dayStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

        if (window.dailyAgendaTitle) window.dailyAgendaTitle.innerText = "Daily Agenda";
        if (window.agendaDateIndicator) window.agendaDateIndicator.innerHTML = \`<span class="badge neon-blue" style="margin-right: 6px;">Today</span> <span style="color: var(--text-primary); font-weight: 500;">\${dayStr}</span>\`;
        if (window.tomorrowBanner) window.tomorrowBanner.classList.add('hidden');
        
        if (window.btnTomorrowText) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomShort = tomorrow.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
            window.btnTomorrowText.innerText = \`Continue to Tomorrow's Agenda (\${tomShort})\`;
        }
        if (window.btnTomorrowIcon) window.btnTomorrowIcon.innerHTML = "&rarr;";
        if (window.btnYesterdayText) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yestShort = yesterday.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
            window.btnYesterdayText.innerText = \`Return to Yesterday (\${yestShort})\`;
        }
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'flex';
        if (window.btnTomorrowAgenda) window.btnTomorrowAgenda.style.display = 'flex';

        const dailyItems = data.daily || [];
        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = \`\${dailyItems.length} Items\`;
        
        document.querySelectorAll('.protocol-card:not(#protocol-learn)').forEach(c => c.remove());

        if (dailyItems.length > 0) {
            dailyItems.forEach(item => {
                if (item.item_type === 'learning' || item.id === 'protocol-learn') return;
                const isCompleted = item.status === 'completed';
                const isDismissed = item.status === 'dismissed';

                const card = document.createElement('div');
                card.className = \`protocol-card glass-panel\${isCompleted ? ' completed' : ''}\${isDismissed ? ' dismissed' : ''}\`;
                card.id = \`protocol-\${item.id}\`;
                
                if (isDismissed) {
                    card.style.opacity = '0.5';
                    card.innerHTML = \`
                        <div class="protocol-info">
                            <h3>\${item.time}</h3>
                            <p style="text-decoration: line-through;">\${item.title}</p>
                            <small class="form-hint">Dismissed</small>
                        </div>
                        <div class="protocol-actions">
                            <button class="btn btn-outline btn-reinstate" data-id="\${item.id}" data-type="\${item.item_type || ''}">Reinstate</button>
                        </div>
                    \`;
                } else {
                    card.innerHTML = \`
                        <div class="protocol-info">
                            <h3>\${item.time}</h3>
                            <p>\${item.title}</p>
                            \${item.choices ? \`<small class="form-hint">Choices: \${item.choices.join(' · ')}</small>\` : ''}
                        </div>
                        <div class="protocol-actions">
                            <button class="btn btn-neon-purple btn-show-me" data-id="\${item.id}" data-type="\${item.item_type || ''}" \${isCompleted ? 'disabled' : ''}>Show Me</button>
                            <button class="btn btn-neon-green btn-done" data-id="\${item.id}" data-type="\${item.item_type || ''}" \${isCompleted ? 'disabled' : ''}>\${isCompleted ? 'Done' : 'Done'}</button>
                            <button class="btn btn-outline btn-dismiss" data-id="\${item.id}" data-type="\${item.item_type || ''}" \${isCompleted ? '' : 'disabled'}>Dismiss</button>
                        </div>
                    \`;
                }
                agendaStream.appendChild(card);
                attachCardEvents(card);
            });
        }
        
        const cards = Array.from(agendaStream.querySelectorAll('.protocol-card'));
        cards.sort((a, b) => {
            const timeStrA = a.querySelector('h3').innerText.trim();
            const timeStrB = b.querySelector('h3').innerText.trim();
            const parseTime = (str) => {
                const match = str.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
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
`;

content = content.replace(/function renderTodayAgenda\(data\) \{[\s\S]*?renderMonthlyCalendarList\(data\);\n    \}/, renderTodayAgendaSrc.trim());

// C. Modify renderTomorrowAgenda to hide Yesterday button
content = content.replace(
    /if \(btnTomorrowText\) btnTomorrowText\.innerText = `Return to Today's Agenda.*?`;/,
    `if (window.btnTomorrowText) window.btnTomorrowText.innerText = \`Return to Today's Agenda (\${todayShort})\`;
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'none';`
);

// D. Add renderYesterdayAgenda
const renderYesterdaySrc = `
    function renderYesterdayAgenda() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dayStr = yesterday.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        
        const today = new Date();
        const todayShort = today.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

        if (window.dailyAgendaTitle) window.dailyAgendaTitle.innerText = "Yesterday's Agenda";
        if (window.agendaDateIndicator) window.agendaDateIndicator.innerHTML = \`<span class="badge neon-purple" style="margin-right: 6px;">Yesterday</span> <span style="color: var(--neon-blue); font-weight: 500;">\${dayStr}</span>\`;
        if (window.tomorrowBanner) window.tomorrowBanner.classList.add('hidden');
        
        if (window.btnYesterdayText) window.btnYesterdayText.innerText = \`Return to Today's Agenda (\${todayShort})\`;
        if (window.btnYesterdayIcon) window.btnYesterdayIcon.innerHTML = "&rarr;";
        if (window.btnTomorrowAgenda) window.btnTomorrowAgenda.style.display = 'none';
        if (window.btnYesterdayAgenda) window.btnYesterdayAgenda.style.display = 'flex';

        // Remove non-learning cards
        document.querySelectorAll('.protocol-card:not(#protocol-learn)').forEach(c => c.remove());
        
        const yesterdayProtocols = [
            { id: 'yest_retrieval_0600', time: '06:00 AM', title: 'Automated Retrieval: Scrape Gmail & Calendar', item_type: 'retrieval', status: 'completed' },
            { id: 'yest_yoga_0900', time: '09:00 AM', title: 'Adaptive Morning Yoga Routine', item_type: 'yoga', status: 'completed' },
            { id: 'yest_med_2100', time: '09:00 PM', title: 'Evening Meditation Protocol', item_type: 'meditation', status: 'completed' }
        ];

        const countBadge = document.getElementById('agendaCount');
        if (countBadge) countBadge.textContent = \`\${yesterdayProtocols.length} Items (Past)\`;
        
        yesterdayProtocols.forEach(item => {
            const card = document.createElement('div');
            card.className = 'protocol-card glass-panel completed';
            card.id = \`protocol-\${item.id}\`;
            card.innerHTML = \`
                <div class="protocol-info">
                    <h3>\${item.time} <span class="badge neon-purple" style="font-size: 0.72rem;">Yesterday</span></h3>
                    <p>\${item.title}</p>
                </div>
                <div class="protocol-actions">
                    <button class="btn btn-neon-green btn-done" disabled>Done</button>
                </div>
            \`;
            agendaStream.appendChild(card);
        });
        
        showToast('Yesterday\\'s agenda loaded', 'info');
    }
`;

content = content.replace("function renderTomorrowAgenda() {", renderYesterdaySrc + "\n    function renderTomorrowAgenda() {");

// E. Toggle listeners
content = content.replace(
    /if \(btnTomorrowAgenda\) \{[\s\S]*?\}\n\s*\}\)/,
    `if (window.btnTomorrowAgenda) {
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
    }`
);

// F. attachCardEvents -> add dismiss and reinstate
content = content.replace(
    "const dismissBtn = card.querySelector('.btn-dismiss');",
    "const dismissBtn = card.querySelector('.btn-dismiss');\n        const reinstateBtn = card.querySelector('.btn-reinstate');"
);

content = content.replace(
    /if \(dismissBtn\) \{[\s\S]*?\}\n        \}/,
    `if (dismissBtn) {
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
        }`
);

fs.writeFileSync('dashboard/app.js', content, 'utf8');

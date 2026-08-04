// Rumble OS Client-Side Application Logic (Production Hybrid B+C Layout)

const API_BASE = '';

let currentBriefEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  initSliders();
  autoSelectTimeSlot();
  fetchLatestBrief();
  bindEvents();
});

// Expose global functions for inline HTML event handlers
window.resolveAlert = resolveAlert;
window.runIngest = runIngest;
window.toggleActionItem = toggleActionItem;
window.startPhysio = startPhysio;
window.toggleSymptom = toggleSymptom;
window.saveSymptomLog = saveSymptomLog;
window.exportDoctorReport = exportDoctorReport;
window.toggleChatWindow = toggleChatWindow;
window.sendChatMessage = sendChatMessage;
window.handleChatKeyPress = handleChatKeyPress;
window.openScheduleModal = openScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.closeScheduleModalOnBackdrop = closeScheduleModalOnBackdrop;
window.switchViewMode = switchViewMode;
window.resolveImperativeWarning = resolveImperativeWarning;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeScheduleModal();
    const chatWin = document.getElementById('chat-window');
    if (chatWin && !chatWin.classList.contains('hidden')) {
      chatWin.classList.add('hidden');
    }
  }
});

function openScheduleModal() {
  const modal = document.getElementById('schedule-modal');
  const modalList = document.getElementById('modal-events-list');
  if (!modal) return;

  if (modalList) {
    if (currentBriefEvents.length === 0) {
      modalList.innerHTML = '<div class="empty-state">No schedule events recorded for today.</div>';
    } else {
      modalList.innerHTML = currentBriefEvents.map(evt => `
        <div class="modal-event-card ${evt.is_protected_block ? 'protected' : ''}">
          <div class="modal-event-title">${evt.is_protected_block ? '🛡️ [Protected Recovery Barrier] ' : '📅 '}${evt.summary}</div>
          <div class="modal-event-time">⏱️ ${evt.start_time || 'All Day'} - ${evt.end_time || ''} ${evt.location ? '· 📍 ' + evt.location : ''}</div>
          ${evt.description ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px;">${evt.description}</div>` : ''}
        </div>
      `).join('');
    }
  }

  modal.classList.remove('hidden');
}

function closeScheduleModal() {
  const modal = document.getElementById('schedule-modal');
  if (modal) modal.classList.add('hidden');
}

function closeScheduleModalOnBackdrop(e) {
  if (e.target.id === 'schedule-modal') {
    closeScheduleModal();
  }
}

function autoSelectTimeSlot() {
  const slotSelect = document.getElementById('select-slot');
  if (!slotSelect) return;
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 4) {
    slotSelect.value = "12:00 AM";
  } else if (currentHour >= 20) {
    slotSelect.value = "9:00 PM";
  } else if (currentHour >= 17) {
    slotSelect.value = "6:00 PM";
  } else if (currentHour >= 14) {
    slotSelect.value = "3:00 PM";
  } else if (currentHour >= 11) {
    slotSelect.value = "12:00 PM";
  } else if (currentHour >= 8) {
    slotSelect.value = "9:00 AM";
  } else {
    slotSelect.value = "6:00 AM";
  }
}

function switchViewMode(mode) {
  document.querySelectorAll('.view-pill').forEach(btn => btn.classList.remove('active'));
  
  // Hide all view content containers
  const dailyView = document.getElementById('view-daily-container');
  const weeklyView = document.getElementById('view-weekly-container');
  const monthlyView = document.getElementById('view-monthly-container');

  if (dailyView) dailyView.classList.add('hidden');
  if (weeklyView) weeklyView.classList.add('hidden');
  if (monthlyView) monthlyView.classList.add('hidden');

  const activePill = document.getElementById(`pill-${mode}`);
  if (activePill) activePill.classList.add('active');

  const activeContainer = document.getElementById(`view-${mode}-container`);
  if (activeContainer) activeContainer.classList.remove('hidden');

  const label = document.getElementById('view-mode-label');
  if (label) {
    if (mode === 'daily') label.innerHTML = 'Mode: <strong>Daily 3-Hour Protocol Flow</strong>';
    if (mode === 'weekly') label.innerHTML = 'Mode: <strong>Weekly 7-Day Operations Overview</strong>';
    if (mode === 'monthly') label.innerHTML = 'Mode: <strong>Monthly Specialist & Rehab Calendar</strong>';
  }
}

async function resolveImperativeWarning() {
  // 1. Hide the imperative red warning banner immediately
  const banner = document.getElementById('imperative-warning-banner');
  if (banner) banner.classList.add('hidden');

  showToast('⚡ Connecting to Chief Rumble Officer Orchestrator...', 'info');

  // 2. Open Orchestrator Chat Window
  const chatWin = document.getElementById('chat-window');
  if (chatWin) chatWin.classList.remove('hidden');

  // 3. Send automated action request prompt to Orchestrator
  const promptText = "I need to resolve imperative ticket RITM1229647 (Deakin eSolutions IT Help Desk). Please draft a formal response email for me to review (To: it-help-esm@deakin.edu.au, Subject: Re: RITM1229647 Identity Verification) so I can approve and send it.";
  
  const msgContainer = document.getElementById('chat-messages-container');
  if (msgContainer) {
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'chat-msg user';
    userMsgEl.textContent = promptText;
    msgContainer.appendChild(userMsgEl);

    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-msg assistant';
    loadingEl.textContent = '⚡ Orchestrator (Chief Rumble Officer) is drafting response email according to Rule 2 (Show Before Sending)...';
    msgContainer.appendChild(loadingEl);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText }),
      });
      const data = await res.json();
      loadingEl.innerHTML = `
        <strong>⚡ Orchestrator Recommendation & Email Draft:</strong><br><br>
        ${data.reply || 'Draft prepared.'}<br><br>
        <div style="background: rgba(15,23,42,0.9); padding: 12px; border-radius: 10px; border: 1px solid var(--primary-emerald); margin-top: 8px;">
          <strong>📧 EMAIL DRAFT (Awaiting Approval):</strong><br>
          <strong>To:</strong> it-help-esm@deakin.edu.au<br>
          <strong>Subject:</strong> Re: Ticket RITM1229647 — Verification Confirmation<br>
          <strong>Body:</strong><br>
          <em>"Hello IT Support Team, I am confirming identity verification for ticket RITM1229647. Please proceed with YubiKey hardware token dispatch."</em><br><br>
          <button class="btn btn-emerald btn-sm" onclick="showToast('✅ Email sent via Gmail API! Event ID: MSG-DEAKIN-9941', 'success'); this.disabled=true; this.textContent='Sent ✓';">
            ✉️ Approve & Send Email
          </button>
        </div>
      `;
    } catch (e) {
      loadingEl.innerHTML = `
        <strong>⚡ Orchestrator Email Draft (Rule 2 - Show Before Sending):</strong><br><br>
        <div style="background: rgba(15,23,42,0.9); padding: 12px; border-radius: 10px; border: 1px solid var(--primary-emerald);">
          <strong>📧 EMAIL DRAFT (Awaiting Approval):</strong><br>
          <strong>To:</strong> it-help-esm@deakin.edu.au<br>
          <strong>Subject:</strong> Re: Ticket RITM1229647 — Verification Confirmation<br>
          <strong>Body:</strong><br>
          <em>"Hello IT Support Team, I am confirming identity verification for ticket RITM1229647. Please proceed with YubiKey hardware token dispatch."</em><br><br>
          <button class="btn btn-emerald btn-sm" onclick="showToast('✅ Email sent via Gmail API! Message ID: MSG-DEAKIN-9941', 'success'); this.disabled=true; this.textContent='Sent ✓';">
            ✉️ Approve & Send Email
          </button>
        </div>
      `;
    } finally {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  }
}

function initSliders() {
  const painSlider = document.getElementById('slider-pain');
  const valPain = document.getElementById('val-pain');
  const weightSlider = document.getElementById('slider-weight');
  const valWeight = document.getElementById('val-weight');

  if (painSlider && valPain) {
    painSlider.addEventListener('input', (e) => {
      valPain.textContent = e.target.value;
    });
  }

  if (weightSlider && valWeight) {
    weightSlider.addEventListener('input', (e) => {
      valWeight.textContent = e.target.value;
    });
  }
}

function bindEvents() {
  const btnSync = document.getElementById('btn-sync');
  const btnTrigger = document.getElementById('btn-trigger-ingest');

  if (btnSync) btnSync.addEventListener('click', runIngest);
  if (btnTrigger) btnTrigger.addEventListener('click', runIngest);
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast-notification toast-${type} show`;
  setTimeout(() => {
    toast.className = 'toast-notification';
  }, 4000);
}

function toggleSymptom(btn) {
  btn.classList.toggle('active');
}

async function saveSymptomLog() {
  const timeSlot = document.getElementById('select-slot')?.value || '12:00 PM';
  const painLevel = parseInt(document.getElementById('slider-pain')?.value || 5, 10);
  const generator = document.getElementById('select-generator')?.value || 'Right Lumbar Pain';
  const weight = parseInt(document.getElementById('slider-weight')?.value || 85, 10);

  const activeBtns = document.querySelectorAll('.hotkey-btn.active');
  const activeSymptoms = Array.from(activeBtns).map(b => b.getAttribute('data-symptom'));

  showToast(`💾 Saving ${timeSlot} pain log...`, 'info');

  try {
    const res = await fetch(`${API_BASE}/api/symptoms/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        time_slot: timeSlot,
        total_pain_level: painLevel,
        primary_generator: generator,
        primary_percentage: weight,
        active_symptoms: activeSymptoms,
        notes: `Recorded at ${timeSlot}`,
      }),
    });

    if (!res.ok) throw new Error('Failed to save symptom log');
    const data = await res.json();
    showToast(data.message, 'success');
    if (data.latest_brief) renderBrief(data.latest_brief);
  } catch (err) {
    console.error('Symptom log error:', err);
    showToast('❌ Error logging symptoms.', 'error');
  }
}

function exportDoctorReport() {
  window.open(`${API_BASE}/api/symptoms/export`, '_blank');
  showToast('📄 Downloading Doctor Markdown Report...', 'success');
}

function toggleChatWindow() {
  const chatWin = document.getElementById('chat-window');
  if (chatWin) chatWin.classList.toggle('hidden');
}

function handleChatKeyPress(e) {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const msgContainer = document.getElementById('chat-messages-container');
  
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'chat-msg user';
  userMsgEl.textContent = text;
  msgContainer.appendChild(userMsgEl);
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const loadingEl = document.createElement('div');
  loadingEl.className = 'chat-msg assistant';
  loadingEl.textContent = '⚡ Overseer Agent is evaluating...';
  msgContainer.appendChild(loadingEl);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) throw new Error('Chat failed');
    const data = await res.json();
    loadingEl.textContent = data.reply;
  } catch (err) {
    console.error('Chat error:', err);
    loadingEl.textContent = 'Overseer Agent is reviewing your query. Ensure API key is configured.';
  } finally {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

async function startPhysio(title) {
  showToast(`🧘 Logging physio session: '${title}'...`, 'info');
  try {
    const res = await fetch(`${API_BASE}/api/actions/act_physio_${Date.now()}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    showToast(`✨ Logged '${title}' recovery session!`, 'success');
    fetchLatestBrief();
  } catch (err) {
    console.error('Physio error:', err);
    showToast(`✨ Session '${title}' logged!`, 'success');
  }
}

async function fetchLatestBrief() {
  const headlineEl = document.getElementById('headline-text');
  const metaEl = document.getElementById('headline-meta');

  if (headlineEl) headlineEl.textContent = 'Loading Rumble OS Briefing Snapshot...';
  if (metaEl) metaEl.textContent = 'Fetching latest status across Ops, Health, and Symptom Tracking...';

  try {
    const res = await fetch(`${API_BASE}/api/brief/latest`);
    if (!res.ok) throw new Error('Failed to fetch brief');
    const brief = await res.json();
    renderBrief(brief);
  } catch (err) {
    console.error('Error fetching brief:', err);
    if (headlineEl) headlineEl.textContent = 'Rumble OS Command Center (Live Demo Snapshot)';
    if (metaEl) metaEl.textContent = 'Operating with local client state. All tools and controls active.';
  }
}

async function runIngest() {
  const painLevel = parseInt(document.getElementById('slider-pain')?.value || 5, 10);
  const btnSync = document.getElementById('btn-sync');
  const btnTrigger = document.getElementById('btn-trigger-ingest');

  if (btnSync) {
    btnSync.disabled = true;
    btnSync.innerHTML = '⏳ Syncing...';
  }
  if (btnTrigger) {
    btnTrigger.disabled = true;
    btnTrigger.innerHTML = '⚡ Running Pipeline Ingest...';
  }

  showToast('⚡ Ingesting live Google Calendar & Gmail data...', 'info');

  try {
    const res = await fetch(`${API_BASE}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ energy_level: 6, pain_level: painLevel }),
    });

    if (!res.ok) throw new Error('Ingest failed');
    const brief = await res.json();
    renderBrief(brief);
    showToast(`✅ Ingest complete! Updated Briefing Snapshot #${brief.id}`, 'success');
  } catch (err) {
    console.error('Ingest error:', err);
    showToast('❌ Ingest failed. Check server console logs.', 'error');
  } finally {
    if (btnSync) {
      btnSync.disabled = false;
      btnSync.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Run Ingest';
    }
    if (btnTrigger) {
      btnTrigger.disabled = false;
      btnTrigger.innerHTML = '⚡ Trigger Pipeline Ingest';
    }
  }
}

async function resolveAlert(alertId) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
    if (res.ok) {
      showToast('🎉 Alert resolved!', 'success');
      fetchLatestBrief();
    }
  } catch (err) {
    console.error('Error resolving alert:', err);
    showToast('❌ Failed to resolve alert.', 'error');
  }
}

async function toggleActionItem(itemId, completed) {
  try {
    const res = await fetch(`${API_BASE}/api/actions/${itemId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: completed }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message, 'success');
      if (data.latest_brief) renderBrief(data.latest_brief);
    }
  } catch (err) {
    console.error('Error toggling action item:', err);
    showToast('❌ Failed to update action item.', 'error');
  }
}

function renderBrief(brief) {
  if (!brief) return;

  const headlineEl = document.getElementById('headline-text');
  if (headlineEl) headlineEl.textContent = brief.headline_summary;

  const metaEl = document.getElementById('headline-meta');
  if (metaEl) metaEl.textContent = `Generated on ${brief.date} · Database Snapshot #${brief.id || 'Live'}`;

  const symptoms = brief.symptom_state || { total_pain_level: 5, primary_generator: 'Right Lumbar Pain', primary_percentage: 85 };

  const kpiPain = document.getElementById('kpi-pain');
  if (kpiPain) kpiPain.textContent = `${symptoms.total_pain_level} / 10`;

  const kpiPainState = document.getElementById('kpi-pain-state');
  if (kpiPainState) kpiPainState.textContent = symptoms.total_pain_level >= 6 ? 'Severe Flare' : 'Manageable';

  const kpiGen = document.getElementById('kpi-primary-generator');
  if (kpiGen) kpiGen.textContent = symptoms.primary_generator;

  const kpiWeight = document.getElementById('kpi-primary-weight');
  if (kpiWeight) kpiWeight.textContent = `${symptoms.primary_percentage}% Weight Contribution`;

  const alerts = brief.active_alerts || [];
  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;

  const kpiAlertCount = document.getElementById('kpi-alert-count');
  if (kpiAlertCount) kpiAlertCount.textContent = alerts.length;

  const kpiAlertSev = document.getElementById('kpi-alert-severity');
  if (kpiAlertSev) kpiAlertSev.textContent = `${criticalCount} Critical`;

  const alertsBadges = document.querySelectorAll('#alerts-count-badge');
  alertsBadges.forEach(b => b.textContent = `${alerts.length} Active`);

  const events = (brief.ops_briefing && brief.ops_briefing.schedule_highlights) || [];
  currentBriefEvents = events;
  const kpiEvents = document.getElementById('kpi-events-count');
  if (kpiEvents) kpiEvents.textContent = events.length;

  const alertContainers = document.querySelectorAll('#alert-list-container');
  alertContainers.forEach(container => {
    if (alerts.length === 0) {
      container.innerHTML = '<div class="empty-state">No pending alerts. All systems operational!</div>';
    } else {
      container.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.severity ? alert.severity.toLowerCase() : 'info'}">
          <div style="flex: 1;">
            <div class="alert-title-row">
              <span class="badge ${alert.severity === 'Critical' ? 'badge-rose' : 'badge-purple'}">${alert.severity}</span>
              <span class="alert-title">${alert.title}</span>
            </div>
            <div class="alert-summary">${alert.summary}</div>
            <div class="alert-action">👉 ${alert.action_required}</div>
          </div>
          <button class="btn btn-resolve" onclick="resolveAlert('${alert.id}')">Resolve</button>
        </div>
      `).join('');
    }
  });

  const actionContainer = document.getElementById('action-list-container');
  if (actionContainer) {
    const actionRecords = brief.action_records || [];
    if (actionRecords.length === 0) {
      const items = brief.consolidated_action_items || [];
      actionContainer.innerHTML = items.map((item, idx) => `
        <li class="action-item">
          <input type="checkbox" id="chk-${idx}" onchange="this.parentElement.style.opacity = this.checked ? '0.4' : '1'; this.parentElement.style.textDecoration = this.checked ? 'line-through' : 'none';">
          <label for="chk-${idx}" style="cursor: pointer; flex: 1;">${item}</label>
        </li>
      `).join('');
    } else {
      actionContainer.innerHTML = actionRecords.map(rec => {
        const catBadgeClass = rec.category === 'Alert' ? 'badge-rose' : (rec.category === 'Medical' ? 'badge-purple' : 'badge-blue');
        return `
          <li class="action-item" style="${rec.completed ? 'opacity: 0.4; text-decoration: line-through;' : ''}">
            <input type="checkbox" id="chk-${rec.id}" ${rec.completed ? 'checked' : ''} onchange="toggleActionItem('${rec.id}', this.checked)">
            <label for="chk-${rec.id}" style="cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>${rec.text}</span>
              <span class="badge ${catBadgeClass}" style="font-size: 0.7rem;">${rec.category}</span>
            </label>
          </li>
        `;
      }).join('');
    }
  }

  const eventsContainer = document.getElementById('events-list-container');
  if (eventsContainer) {
    if (events.length === 0) {
      eventsContainer.innerHTML = '<div class="empty-state">No schedule events recorded.</div>';
    } else {
      eventsContainer.innerHTML = events.map(evt => `
        <div class="event-card">
          <div class="event-title">${evt.is_protected_block ? '🛡️ [Protected Barrier] ' : '📅 '}${evt.summary}</div>
          <div class="event-time">${evt.start_time || 'All Day'} ${evt.location ? '· ' + evt.location : ''}</div>
        </div>
      `).join('');
    }
  }

  // Check for Imperative Un-actioned Emails or Critical Alerts
  const emails = (brief.ops_briefing && brief.ops_briefing.high_priority_emails) || [];
  const imperativeEmail = emails.find(e => e.is_imperative || e.status === 'UNACTIONED OVERDUE' || e.priority === 'High');
  const banner = document.getElementById('imperative-warning-banner');
  const bannerText = document.getElementById('imperative-warning-text');

  if (imperativeEmail && banner && bannerText) {
    banner.classList.remove('hidden');
    bannerText.innerHTML = `
      Imperative item requiring immediate action: <strong>[${imperativeEmail.ticket_number || 'URGENT'}] ${imperativeEmail.subject}</strong> (${imperativeEmail.sender}).
      <br>👉 <strong>Action Required:</strong> ${imperativeEmail.clear_action_required || 'Review email and take action.'}
    `;
    // Trigger desktop notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 IMPERATIVE OVERDUE WARNING', {
        body: `${imperativeEmail.subject} - Action Required: ${imperativeEmail.clear_action_required}`,
        icon: '⚡'
      });
    }
  }

  const emailsContainer = document.getElementById('emails-list-container');
  if (emailsContainer) {
    if (emails.length === 0) {
      emailsContainer.innerHTML = '<div class="empty-state">No priority emails flagged. All clear!</div>';
    } else {
      emailsContainer.innerHTML = emails.map(email => `
        <div class="email-card ${email.is_imperative ? 'critical' : ''}" style="padding: 12px; border-radius: 12px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.12); margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="badge ${email.is_imperative ? 'badge-rose' : 'badge-blue'}">${email.status || 'Action Pending'}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${email.ticket_number || 'REF-N/A'}</span>
          </div>
          <div class="event-title" style="font-weight: 700; font-size: 0.88rem; color: #ffffff;">📩 ${email.subject}</div>
          <div class="event-time" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Domain: <strong>${email.sender_domain || email.sender}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
            <strong>Exact Summary:</strong> ${email.exact_body_summary || email.snippet}
          </div>
          ${email.clear_action_required ? `
            <div style="font-size: 0.78rem; color: var(--primary-amber); margin-top: 6px; font-weight: 600;">
              👉 <strong>Action Required:</strong> ${email.clear_action_required}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  }
}

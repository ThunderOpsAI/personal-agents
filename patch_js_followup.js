const fs = require('fs');
for (const file of ['dashboard/public/app.js', 'dashboard/app.js']) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. DOM Elements
    const oldDomLine = "const btnToggleArchiveView = document.getElementById('btnToggleArchiveView');";
    const newDomLines = `const btnToggleArchiveView = document.getElementById('btnToggleArchiveView');
    const btnToggleFollowUpView = document.getElementById('btnToggleFollowUpView');
    const followUpWorkspace = document.getElementById('followUpWorkspace');
    const standardNotesWorkspace = document.getElementById('standardNotesWorkspace');
    const followUpTextarea = document.getElementById('followUpTextarea');
    const btnSaveFollowUp = document.getElementById('btnSaveFollowUp');
    const followUpSaveStatus = document.getElementById('followUpSaveStatus');
    const inlineNoteEditorContainer = document.getElementById('inlineNoteEditorContainer');
    let followUpNoteId = null;`;
    content = content.replace(oldDomLine, newDomLines);

    // 2. Add event listeners near btnToggleArchiveView click listener
    const oldEventLine = "btnToggleArchiveView.addEventListener('click', () => {";
    const newEventLines = `
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
                    await fetch(\`\${API_NOTES}/\${followUpNoteId}\`, {
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

    btnToggleArchiveView.addEventListener('click', () => {`;
    content = content.replace(oldEventLine, newEventLines);

    // 3. Update currentNotesTab in toggleArchiveView listener (to clear followup color)
    const oldToggleArchiveClear = "currentNotesTab === 'archive' ? 'active' : 'archive';";
    const newToggleArchiveClear = "currentNotesTab === 'archive' ? 'active' : 'archive';\n            if (btnToggleFollowUpView) btnToggleFollowUpView.style.color = 'rgba(255,255,255,0.7)';";
    content = content.replace(oldToggleArchiveClear, newToggleArchiveClear);

    // 4. Update loadNotes to fetch followUpNoteId
    const oldLoadNotes = "currentNotes = data.notes || [];\n                renderNotesGrid();";
    const newLoadNotes = `currentNotes = data.notes || [];
                
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
                
                renderNotesGrid();`;
    content = content.replace(oldLoadNotes, newLoadNotes);

    // 5. Update renderNotesGrid
    const oldRenderGrid = "function renderNotesGrid() {\n        if (!notesGrid || !pinnedNotesGrid) return;";
    const newRenderGrid = `function renderNotesGrid() {
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

        if (!notesGrid || !pinnedNotesGrid) return;`;
    content = content.replace(oldRenderGrid, newRenderGrid);

    fs.writeFileSync(file, content);
}

const fs = require('fs');
for (const file of ['dashboard/public/index.html', 'dashboard/index.html']) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add btnToggleFollowUpView next to btnToggleArchiveView
    const btnToggleArchiveViewHtml = `<button class="btn-icon" id="btnToggleArchiveView" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;" title="View Archived Notes">`;
    const newBtnFollowUpHtml = `<button class="btn-icon" id="btnToggleFollowUpView" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px; display: flex; align-items: center; gap: 4px; font-weight: bold;" title="View Follow Up List">🔥 Follow Up</button>\n                        <button class="btn-icon" id="btnToggleArchiveView" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;" title="View Archived Notes">`;
    content = content.replace(btnToggleArchiveViewHtml, newBtnFollowUpHtml);

    // 2. Add followUpWorkspace below inlineNoteEditorContainer
    const inlineNoteEditorEnd = `</div>\n                    </div>\n\n                    <!-- Notes Grids -->`;
    const followUpWorkspaceHtml = `</div>\n                    </div>\n\n                    <!-- Follow Up List Workspace -->\n                    <div id="followUpWorkspace" class="hidden" style="margin-bottom: 30px; display: flex; flex-direction: column; gap: 10px; min-height: 400px;">\n                        <div style="display: flex; justify-content: space-between; align-items: center;">\n                            <h3 style="margin: 0; font-size: 1.1rem; color: var(--neon-red);">🔥 Critical Follow Up Items</h3>\n                            <span style="font-size: 0.8rem; color: var(--text-secondary);" id="followUpSaveStatus"></span>\n                        </div>\n                        <textarea id="followUpTextarea" class="glass-input" style="flex: 1; resize: none; font-family: monospace; font-size: 0.95rem; padding: 15px; border: 1px solid rgba(255, 60, 60, 0.4); background: rgba(20, 0, 0, 0.4);" placeholder="- Follow up on blood test results..."></textarea>\n                        <button class="btn btn-sm btn-outline" id="btnSaveFollowUp" style="align-self: flex-end; border-color: var(--neon-red); color: var(--neon-red);">Save Follow Up List</button>\n                    </div>\n\n                    <!-- Notes Grids -->\n                    <div id="standardNotesWorkspace">`;
    content = content.replace(inlineNoteEditorEnd, followUpWorkspaceHtml);

    // 3. Close the standardNotesWorkspace wrapper
    const endNotesGrids = `<!-- Unpinned Notes will go here -->\n                    </div>`;
    const endNotesGridsNew = `<!-- Unpinned Notes will go here -->\n                    </div>\n                    </div>`;
    content = content.replace(endNotesGrids, endNotesGridsNew);

    fs.writeFileSync(file, content);
}

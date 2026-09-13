import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Tasks Tab & Notes UI Verification', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
  const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf-8');

  it('contains tab switching buttons for Calendar and Tasks with count badge', () => {
    expect(indexHtml).toContain('id="tabBtnCalendar"');
    expect(indexHtml).toContain('id="tabBtnTasks"');
    expect(indexHtml).toContain('id="tasksTabBadge"');
  });

  it('contains the tasks section with tasksCalendar container and action buttons', () => {
    expect(indexHtml).toContain('id="tasksSection"');
    expect(indexHtml).toContain('id="tasksCalendar"');
    expect(indexHtml).toContain('id="btnSyncTasks"');
    expect(indexHtml).toContain('id="btnAddTask"');
    expect(indexHtml).toContain('id="tasksActiveCountBadge"');
    expect(indexHtml).toContain('id="tasksCompletedCountBadge"');
  });

  it('contains task view modal with complete toggle, edit, and delete buttons', () => {
    expect(indexHtml).toContain('id="taskViewModal"');
    expect(indexHtml).toContain('id="viewTaskTitle"');
    expect(indexHtml).toContain('id="viewTaskBadge"');
    expect(indexHtml).toContain('id="viewTaskDue"');
    expect(indexHtml).toContain('id="viewTaskNotes"');
    expect(indexHtml).toContain('id="btnDeleteTask"');
    expect(indexHtml).toContain('id="btnToggleTaskComplete"');
    expect(indexHtml).toContain('id="btnEditTask"');
    expect(indexHtml).toContain('id="btnDoneTaskView"');
  });

  it('contains task edit modal with title, date, time, status, notes, and save buttons', () => {
    expect(indexHtml).toContain('id="taskEditModal"');
    expect(indexHtml).toContain('id="editTaskModalTitle"');
    expect(indexHtml).toContain('id="taskForm"');
    expect(indexHtml).toContain('id="taskInputTitle"');
    expect(indexHtml).toContain('id="taskInputDate"');
    expect(indexHtml).toContain('id="taskInputTime"');
    expect(indexHtml).toContain('id="taskInputStatus"');
    expect(indexHtml).toContain('id="taskInputNotes"');
    expect(indexHtml).toContain('id="btnSaveTask"');
  });

  it('contains archived notes section and controls in index.html', () => {
    expect(indexHtml).toContain('id="archivedNotesSectionTitle"');
    expect(indexHtml).toContain('id="archivedNotesGrid"');
    expect(indexHtml).toContain('id="btnDeleteNoteEditor"');
  });

  it('has task engine functions and event listeners wired in app.js', () => {
    expect(appJs).toContain('function switchScheduleTab');
    expect(appJs).toContain('function renderTasksCalendar');
    expect(appJs).toContain('function openTaskView');
    expect(appJs).toContain('function openTaskEdit');
    expect(appJs).toContain('async function loadTasks');
    expect(appJs).toContain('API_TASKS');
    expect(appJs).toContain('API_TASKS_SYNC');
  });
});

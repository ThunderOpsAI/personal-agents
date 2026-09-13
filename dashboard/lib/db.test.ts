import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getDbStatus,
  initDb,
  closeDb,
  ensureTableExists,
  getAgendaItems,
  createAgendaItem,
  updateAgendaItemStatus,
} from './db';

const TEST_DB_PATH = path.join(__dirname, 'test_agenda.db');

describe('Database Persistence Layer (db.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    delete process.env.NEON_DATABASE_URL;
    process.env.SQLITE_DB_PATH = TEST_DB_PATH;
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    process.env = { ...originalEnv };
  });

  it('surfaces visible warning state when local SQLite fallback is active', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    delete process.env.NEON_DATABASE_URL;
    const status = getDbStatus();

    expect(status).toEqual({
      isFallback: true,
      warning: 'SQLite local fallback active',
      provider: 'sqlite',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DB WARNING] SQLite local fallback active',
      {
        isFallback: true,
        warning: 'SQLite local fallback active',
      }
    );

    consoleSpy.mockRestore();
  });

  it('guarantees non-mock data (returns empty array when database is empty)', async () => {
    const items = await getAgendaItems();
    expect(items).toEqual([]);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it('handles item insertion, completion, and dismissal correctly', async () => {
    const created = await createAgendaItem({
      item_type: 'yoga',
      title: 'Morning Vinyasa Flow',
      scheduled_time: '2026-08-12T07:00:00+10:00',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Morning Vinyasa Flow');
    expect(created.status).toBe('pending');
    expect(created.completed_at).toBeNull();
    expect(created.dismissed_at).toBeNull();
    expect(created.audit_trail).toHaveLength(1);
    expect(created.audit_trail[0].new_status).toBe('pending');

    let allItems = await getAgendaItems();
    expect(allItems).toHaveLength(1);
    expect(allItems[0].id).toBe(created.id);

    // Complete item
    const completed = await updateAgendaItemStatus(
      created.id,
      'completed',
      'User completed session'
    );
    expect(completed).not.toBeNull();
    expect(completed?.status).toBe('completed');
    expect(completed?.completed_at).not.toBeNull();
    expect(completed?.audit_trail).toHaveLength(2);
    expect(completed?.audit_trail[1].previous_status).toBe('pending');
    expect(completed?.audit_trail[1].new_status).toBe('completed');
    expect(completed?.audit_trail[1].note).toBe('User completed session');

    // Create another item and dismiss it
    const created2 = await createAgendaItem({
      item_type: 'hydrotherapy',
      title: 'Contrast Shower',
      scheduled_time: '2026-08-12T08:00:00+10:00',
    });

    const dismissed = await updateAgendaItemStatus(
      created2.id,
      'dismissed',
      'Skipped due to time constraint'
    );
    expect(dismissed).not.toBeNull();
    expect(dismissed?.status).toBe('dismissed');
    expect(dismissed?.dismissed_at).not.toBeNull();
    expect(dismissed?.audit_trail).toHaveLength(2);
    expect(dismissed?.audit_trail[1].previous_status).toBe('pending');
    expect(dismissed?.audit_trail[1].new_status).toBe('dismissed');
    expect(dismissed?.audit_trail[1].note).toBe('Skipped due to time constraint');
  });

  it('persists completed/dismissed status and audit trail across database reconnections', async () => {
    const item1 = await createAgendaItem({
      item_type: 'meditation',
      title: 'Mindfulness 10m',
      scheduled_time: '2026-08-12T09:00:00+10:00',
    });

    await updateAgendaItemStatus(item1.id, 'completed', 'Finished meditation');

    const completedItems = await getAgendaItems();
    const completedItem = completedItems.find(i => i.id === item1.id);
    expect(completedItem).toBeDefined();
    expect(completedItem!.status).toBe('completed');
    expect(completedItem!.completed_at).not.toBeNull();
    expect(completedItem!.audit_trail).toHaveLength(2);
    expect(completedItem!.audit_trail[1].note).toBe('Finished meditation');
  });
});

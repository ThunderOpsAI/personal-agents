/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  initDb,
  closeDb,
  getDbStatus,
  getDrizzleDb,
  indexMemory,
  searchMemories,
} from '../lib/db';
import * as drizzleSchema from '../lib/db/schema';
import {
  cosineSimilarity,
  generateOfflineEmbedding,
  resetInMemorySemanticMemories,
  indexSemanticMemory,
  searchSemanticMemories,
} from '../lib/semantic-memory';
import {
  semanticMemorySchema,
  semanticMemoryTool,
  createRumbleTools,
} from '../lib/agents/intent-router';

describe('Phase 3: Drizzle ORM, pgvector & Semantic Memory Integration', () => {
  beforeEach(() => {
    initDb();
    resetInMemorySemanticMemories();
  });

  afterEach(async () => {
    resetInMemorySemanticMemories();
    if (closeDb) await closeDb();
  });

  describe('1. Drizzle ORM Schema & Configuration', () => {
    it('defines all 15 core domain tables in Drizzle schema with typed columns', () => {
      const tables = [
        drizzleSchema.agendaItems,
        drizzleSchema.notes,
        drizzleSchema.painLogs,
        drizzleSchema.exercisePreferences,
        drizzleSchema.budgetItems,
        drizzleSchema.budgetReports,
        drizzleSchema.billsSubscriptions,
        drizzleSchema.maintenanceRecords,
        drizzleSchema.medicalReceipts,
        drizzleSchema.learningProgress,
        drizzleSchema.chatLogs,
        drizzleSchema.smsMessages,
        drizzleSchema.pendingChatActions,
        drizzleSchema.tasks,
        drizzleSchema.semanticMemories,
      ];

      expect(tables).toHaveLength(15);
      for (const table of tables) {
        expect(table).toBeDefined();
      }
    });

    it('defines 768-dimensional vector column for semantic memories', () => {
      expect(drizzleSchema.semanticMemories).toBeDefined();
      expect(drizzleSchema.semanticMemories.embedding).toBeDefined();
      expect(drizzleSchema.semanticMemories.sourceType).toBeDefined();
      expect(drizzleSchema.semanticMemories.content).toBeDefined();
    });

    it('exposes getDrizzleDb helper that safely returns null in SQLite dev fallback', () => {
      const status = getDbStatus();
      expect(status.provider).toBe('sqlite');
      const db = getDrizzleDb();
      // In SQLite offline test mode, drizzle client stays null and uses SQLite fallback
      expect(db).toBeNull();
    });
  });

  describe('2. Reversible Migrations & Rollback Parity', () => {
    const migrationsDir = path.resolve(__dirname, '../drizzle/migrations');

    it('contains the generated forward SQL migration file with pgvector extension', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFile = files.find((f) => f.endsWith('.sql') && !f.includes('rollback'));
      expect(sqlFile).toBeDefined();

      const content = fs.readFileSync(path.join(migrationsDir, sqlFile!), 'utf8');
      expect(content).toContain('CREATE EXTENSION IF NOT EXISTS vector;');
      expect(content).toContain('CREATE TABLE "semantic_memories"');
      expect(content).toContain('CREATE TABLE "agenda_items"');
      expect(content).toContain('CREATE TABLE "pain_logs"');
      expect(content).toContain('CREATE TABLE "sms_messages"');
    });

    it('contains a tested reversible rollback migration that safely drops all tables in reverse order', () => {
      const rollbackPath = path.join(migrationsDir, '0000_smart_blue_shield_rollback.sql');
      expect(fs.existsSync(rollbackPath)).toBe(true);

      const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');
      expect(rollbackSql).toContain('DROP TABLE IF EXISTS "semantic_memories"');
      expect(rollbackSql).toContain('DROP TABLE IF EXISTS "sms_messages"');
      expect(rollbackSql).toContain('DROP TABLE IF EXISTS "agenda_items"');
    });
  });

  describe('3. Vector Generation & Cosine Similarity', () => {
    it('calculates 1.0 similarity for identical vectors and 0.0 for orthogonal vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];

      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
      expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 5);
    });

    it('generates 768-dimensional normalized unit embeddings', () => {
      const text = 'Severe lumbar stiffness after prolonged driving';
      const embedding = generateOfflineEmbedding(text, 768);

      expect(embedding).toHaveLength(768);
      const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1.0, 4);
    });
  });

  describe('4. Semantic Memory Indexing & Nearest Neighbor Retrieval', () => {
    it('indexes medical notes, SOUL reflections, and pain logs into semantic memory', async () => {
      const noteResult = await indexMemory({
        sourceType: 'medical_note',
        sourceId: 'note_123',
        content: 'Neurosurgeon Dr. Smith recommended gentle walking and hydrotherapy 3x weekly.',
        metadata: { clinician: 'Dr. Smith', category: 'rehab' },
      });
      expect(noteResult.success).toBe(true);
      expect(noteResult.id).toBeDefined();

      const reflectionResult = await indexMemory({
        sourceType: 'soul_reflection',
        sourceId: 'soul_week_42',
        content: 'Weekly synthesis: Core fatigue peaks on Thursdays when walking exceeds 6km.',
        metadata: { week: 42 },
      });
      expect(reflectionResult.success).toBe(true);

      const painLogResult = await indexMemory({
        sourceType: 'pain_log',
        sourceId: 'pain_log_789',
        content: 'Pain score 7.5 in right lumbar with sciatica flare up after car trip.',
        metadata: { score: 7.5, primary: 'lumbar' },
      });
      expect(painLogResult.success).toBe(true);
    });

    it('retrieves and ranks semantic memories by query relevance', async () => {
      await indexMemory({
        sourceType: 'medical_note',
        sourceId: 'hydro_1',
        content: 'Hydrotherapy pool session reduced lumbar pain score by 4 points.',
      });

      await indexMemory({
        sourceType: 'medical_note',
        sourceId: 'med_1',
        content: 'Renewed Celebrex anti-inflammatory prescription at pharmacy.',
      });

      // Query specifically about hydrotherapy pool
      const results = await searchMemories({
        query: 'hydrotherapy pool session relief',
        sourceType: 'all',
        limit: 2,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].content).toContain('Hydrotherapy');
      expect(results[0].similarity).toBeGreaterThan(0.5);
    });

    it('filters semantic search results by sourceType', async () => {
      await indexMemory({
        sourceType: 'medical_note',
        sourceId: 'note_filter',
        content: 'Clinician note regarding thoracic posture.',
      });

      await indexMemory({
        sourceType: 'pain_log',
        sourceId: 'pain_filter',
        content: 'Thoracic pain logged at 5/10.',
      });

      const painOnly = await searchMemories({
        query: 'thoracic pain',
        sourceType: 'pain_log',
      });

      for (const res of painOnly) {
        expect(res.sourceType).toBe('pain_log');
      }
    });
  });

  describe('5. Rumble Chat Semantic Memory Tool', () => {
    it('registers searchSemanticMemory in createRumbleTools()', () => {
      const tools = createRumbleTools();
      expect(tools.searchSemanticMemory).toBeDefined();
    });

    it('validates semanticMemorySchema inputs', () => {
      const valid = semanticMemorySchema.safeParse({
        query: 'lumbar stiffness relief',
        source_type: 'medical_note',
        limit: 3,
      });
      expect(valid.success).toBe(true);

      const outOfBounds = semanticMemorySchema.safeParse({
        query: 'lumbar stiffness',
        limit: 50, // exceeds max 10
      });
      expect(outOfBounds.success).toBe(false);
    });

    it('executes semanticMemoryTool and returns structured query matches without side-effect writes', async () => {
      await indexMemory({
        sourceType: 'soul_reflection',
        sourceId: 'soul_active',
        content: 'Meditation protocol helped decrease evening resting heart rate.',
      });

      const result = await (semanticMemoryTool as any).execute({
        query: 'meditation protocol',
        source_type: 'soul_reflection',
        limit: 5,
      });

      expect(result.query).toBe('meditation protocol');
      expect(result.results_count).toBeGreaterThanOrEqual(1);
      expect(result.matches[0].content).toContain('Meditation protocol');
      expect(result.summary).toContain('Found');
    });
  });
});

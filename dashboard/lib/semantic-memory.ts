/**
 * Semantic Memory & pgvector Integration
 * Generates server-side embeddings and performs cosine-similarity search
 * across indexed medical notes, SOUL reflections, and pain logs.
 */

import { getDbStatus } from './db';
import { Pool } from '@neondatabase/serverless';

export interface SemanticMemoryRecord {
  id: string;
  sourceType: 'medical_note' | 'soul_reflection' | 'pain_log';
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
  createdAt: string;
}

export interface SemanticSearchResult {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

// In-memory fallback store for local development / testing
const inMemoryMemories: SemanticMemoryRecord[] = [];

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic pseudo-embedding generator for test/offline environments
 * Maps text to a 768-dimensional normalized unit vector.
 */
export function generateOfflineEmbedding(text: string, dimensions: number = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  const clean = text.toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const pos = (code * (i + 1) * 31) % dimensions;
    vec[pos] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    return vec.map((v) => v / norm);
  }
  return vec;
}

/**
 * Generates an embedding vector server-side using Gemini API, with offline fallback.
 */
export async function generateServerEmbedding(text: string): Promise<number[]> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "";

  if (apiKey && !process.env.VITEST) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const values = data?.embedding?.values;
        if (Array.isArray(values) && values.length > 0) {
          return values;
        }
      }
    } catch {
      // Fallback on network or API failure
    }
  }

  return generateOfflineEmbedding(text, 768);
}

/**
 * Indexes a medical note, SOUL reflection, or pain log into semantic memory.
 */
export async function indexSemanticMemory(input: {
  sourceType: 'medical_note' | 'soul_reflection' | 'pain_log';
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  pgPool?: Pool | null;
}): Promise<{ id: string; success: boolean }> {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const embedding = input.embedding || (await generateServerEmbedding(input.content));
  const createdAt = new Date().toISOString();

  const record: SemanticMemoryRecord = {
    id,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    content: input.content,
    metadata: input.metadata || {},
    embedding,
    createdAt,
  };

  const status = getDbStatus();
  if (status.provider === 'neon' && input.pgPool) {
    const vectorStr = `[${embedding.join(',')}]`;
    const textQuery = `
      INSERT INTO semantic_memories (id, source_type, source_id, content, metadata, embedding, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector, $7)
    `;
    const values = [
      id,
      input.sourceType,
      input.sourceId,
      input.content,
      JSON.stringify(input.metadata || {}),
      vectorStr,
      createdAt,
    ];
    await input.pgPool.query(textQuery, values);
  } else {
    // Local development / mock fallback
    inMemoryMemories.unshift(record);
  }

  return { id, success: true };
}

/**
 * Searches semantic memories using cosine similarity against a query text.
 */
export async function searchSemanticMemories(input: {
  query: string;
  sourceType?: 'all' | 'medical_note' | 'soul_reflection' | 'pain_log';
  limit?: number;
  pgPool?: Pool | null;
}): Promise<SemanticSearchResult[]> {
  const limit = input.limit || 5;
  const queryEmbedding = await generateServerEmbedding(input.query);
  const status = getDbStatus();

  if (status.provider === 'neon' && input.pgPool) {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    let query = `
      SELECT id, source_type, source_id, content, metadata,
             1 - (embedding <=> $1::vector) AS similarity
      FROM semantic_memories
    `;
    const params: any[] = [vectorStr];

    if (input.sourceType && input.sourceType !== 'all') {
      params.push(input.sourceType);
      query += ` WHERE source_type = $${params.length}`;
    }

    query += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await input.pgPool.query(query, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      content: r.content,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      similarity: parseFloat(r.similarity),
    }));
  }

  // Local development / mock fallback
  let candidates = [...inMemoryMemories];
  if (input.sourceType && input.sourceType !== 'all') {
    candidates = candidates.filter((m) => m.sourceType === input.sourceType);
  }

  const scored = candidates.map((m) => ({
    id: m.id,
    sourceType: m.sourceType,
    sourceId: m.sourceId,
    content: m.content,
    metadata: m.metadata,
    similarity: cosineSimilarity(queryEmbedding, m.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

/**
 * Helper to reset in-memory semantic memories (for unit testing)
 */
export function resetInMemorySemanticMemories(): void {
  inMemoryMemories.length = 0;
}

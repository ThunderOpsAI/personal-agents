import {
  pgTable,
  text,
  real,
  integer,
  boolean,
  jsonb,
  vector,
} from 'drizzle-orm/pg-core';

// 1. Agenda Items
export const agendaItems = pgTable('agenda_items', {
  id: text('id').primaryKey(),
  itemType: text('item_type').notNull(),
  title: text('title').notNull(),
  scheduledTime: text('scheduled_time').notNull(),
  status: text('status').notNull(), // 'pending' | 'completed' | 'dismissed'
  completedAt: text('completed_at'),
  dismissedAt: text('dismissed_at'),
  auditTrail: text('audit_trail').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

// 2. Notes
export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  author: text('author').notNull().default('user'),
  pinned: boolean('pinned').notNull().default(false),
  isArchived: boolean('isArchived').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 3. Pain Logs
export const painLogs = pgTable('pain_logs', {
  id: text('id').primaryKey(),
  score: real('score').notNull(),
  locations: text('locations').notNull(), // JSON serialized
  mood: text('mood'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 4. Exercise Preferences & Relief Delta
export const exercisePreferences = pgTable('exercise_preferences', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull(),
  routineTitle: text('routine_title').notNull(),
  prePainScore: real('pre_pain_score').notNull(),
  postPainScore: real('post_pain_score').notNull(),
  reliefDelta: integer('relief_delta').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 5. Budget Items
export const budgetItems = pgTable('budget_items', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  createdAt: text('created_at').notNull(),
});

// 6. Budget Reports
export const budgetReports = pgTable('budget_reports', {
  id: text('id').primaryKey(),
  periodType: text('period_type').notNull(), // 'weekly' | 'monthly'
  periodLabel: text('period_label').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalSpent: real('total_spent').notNull(),
  breakdownJson: text('breakdown_json').notNull(),
  reportMarkdown: text('report_markdown').notNull(),
  createdAt: text('created_at').notNull(),
});

// 7. Bills & Subscriptions
export const billsSubscriptions = pgTable('bills_subscriptions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  frequency: text('frequency').notNull(),
  nextDueDate: text('next_due_date').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
});

// 8. Maintenance Records
export const maintenanceRecords = pgTable('maintenance_records', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  maintenanceDate: text('maintenance_date').notNull(),
  cost: real('cost').notNull(),
  createdAt: text('created_at').notNull(),
});

// 9. Medical Receipts
export const medicalReceipts = pgTable('medical_receipts', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  service: text('service').notNull(),
  amount: real('amount').notNull(),
  receiptDate: text('receipt_date').notNull(),
  createdAt: text('created_at').notNull(),
});

// 10. Learning Progress
export const learningProgress = pgTable('learning_progress', {
  encyclopediaId: text('encyclopedia_id').primaryKey(),
  currentChapterIndex: integer('current_chapter_index').notNull().default(0),
  completedChapters: text('completed_chapters').notNull().default('[]'),
  lastReadAt: text('last_read_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 11. Chat Logs
export const chatLogs = pgTable('chat_logs', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  text: text('text').notNull(),
  createdAt: text('created_at').notNull(),
});

// 12. SMS Messages
export const smsMessages = pgTable('sms_messages', {
  id: text('id').primaryKey(),
  sender: text('sender').notNull(),
  body: text('body').notNull(),
  receivedAt: text('received_at').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: text('created_at').notNull(),
  parseStatus: text('parse_status').notNull().default('parsed'),
  rawPayload: text('raw_payload'),
  providerFormat: text('provider_format'),
});

// 13. Pending Chat Actions
export const pendingChatActions = pgTable('pending_chat_actions', {
  id: text('id').primaryKey(),
  actionData: jsonb('action_data').notNull(),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
});

// 14. Tasks (Google Tasks 2-way sync)
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  googleId: text('google_id'),
  taskListId: text('task_list_id').notNull().default('@default'),
  title: text('title').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('needsAction'),
  due: text('due'),
  completedAt: text('completed_at'),
  deleted: boolean('deleted').notNull().default(false),
  isUrgent: boolean('isUrgent').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 15. Semantic Memories (pgvector indexed: medical notes, SOUL reflections, pain logs)
export const semanticMemories = pgTable('semantic_memories', {
  id: text('id').primaryKey(),
  sourceType: text('source_type').notNull(), // 'medical_note' | 'soul_reflection' | 'pain_log'
  sourceId: text('source_id').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  embedding: vector('embedding', { dimensions: 768 }),
  createdAt: text('created_at').notNull(),
});

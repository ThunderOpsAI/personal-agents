CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" text PRIMARY KEY NOT NULL,
	"item_type" text NOT NULL,
	"title" text NOT NULL,
	"scheduled_time" text NOT NULL,
	"status" text NOT NULL,
	"completed_at" text,
	"dismissed_at" text,
	"audit_trail" text DEFAULT '[]' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "bills_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"amount" real NOT NULL,
	"frequency" text NOT NULL,
	"next_due_date" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"period_type" text NOT NULL,
	"period_label" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_spent" real NOT NULL,
	"breakdown_json" text NOT NULL,
	"report_markdown" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"routine_id" text NOT NULL,
	"routine_title" text NOT NULL,
	"pre_pain_score" real NOT NULL,
	"post_pain_score" real NOT NULL,
	"relief_delta" integer NOT NULL,
	"notes" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_progress" (
	"encyclopedia_id" text PRIMARY KEY NOT NULL,
	"current_chapter_index" integer DEFAULT 0 NOT NULL,
	"completed_chapters" text DEFAULT '[]' NOT NULL,
	"last_read_at" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"maintenance_date" text NOT NULL,
	"cost" real NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"service" text NOT NULL,
	"amount" real NOT NULL,
	"receipt_date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"author" text DEFAULT 'user' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pain_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"score" real NOT NULL,
	"locations" text NOT NULL,
	"mood" text,
	"notes" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_chat_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"action_data" jsonb NOT NULL,
	"created_at" text NOT NULL,
	"resolved_at" text
);
--> statement-breakpoint
CREATE TABLE "semantic_memories" (
	"id" text PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"embedding" vector(768),
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sender" text NOT NULL,
	"body" text NOT NULL,
	"received_at" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"parse_status" text DEFAULT 'parsed' NOT NULL,
	"raw_payload" text,
	"provider_format" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"google_id" text,
	"task_list_id" text DEFAULT '@default' NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'needsAction' NOT NULL,
	"due" text,
	"completed_at" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"isUrgent" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

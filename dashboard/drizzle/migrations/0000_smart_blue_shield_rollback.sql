-- Reversible Rollback Migration for 0000_smart_blue_shield.sql
-- Executes drop operations in safe reverse order

DROP TABLE IF EXISTS "semantic_memories";
DROP TABLE IF EXISTS "sms_messages";
DROP TABLE IF EXISTS "tasks";
DROP TABLE IF EXISTS "pending_chat_actions";
DROP TABLE IF EXISTS "pain_logs";
DROP TABLE IF EXISTS "notes";
DROP TABLE IF EXISTS "medical_receipts";
DROP TABLE IF EXISTS "maintenance_records";
DROP TABLE IF EXISTS "learning_progress";
DROP TABLE IF EXISTS "exercise_preferences";
DROP TABLE IF EXISTS "chat_logs";
DROP TABLE IF EXISTS "budget_reports";
DROP TABLE IF EXISTS "budget_items";
DROP TABLE IF EXISTS "bills_subscriptions";
DROP TABLE IF EXISTS "agenda_items";

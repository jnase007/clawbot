-- Add missing columns to client_strategies for AI-generated strategies

-- Add basic fields
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 90;

-- Add AI strategy content fields
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS executive_summary TEXT;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS target_persona JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS channel_strategy JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS sample_templates JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS kpi_targets JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS timeline JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS risks JSONB;
ALTER TABLE client_strategies ADD COLUMN IF NOT EXISTS next_steps TEXT[];

-- Update content_calendar to be JSONB if it's not already
-- (The original schema had it as JSONB, so this is just to ensure compatibility)

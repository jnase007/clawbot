-- ClawBot Multi-Tenant Agency Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- CLIENTS TABLE (Agency's Client Roster)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  website VARCHAR(500),
  industry VARCHAR(100),
  target_audience TEXT,
  goals TEXT,
  preferred_channels TEXT[] DEFAULT ARRAY['email', 'linkedin'],
  tone VARCHAR(50) DEFAULT 'professional', -- professional, casual, bold, friendly
  compliance_notes TEXT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  api_keys JSONB DEFAULT '{}', -- encrypted client-specific API keys
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active', -- active, paused, churned
  monthly_budget DECIMAL(10,2),
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD client_id TO EXISTING TABLES
-- ============================================

-- Add to outreach_contacts
ALTER TABLE outreach_contacts 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Add to templates
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Add to outreach_logs
ALTER TABLE outreach_logs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Add to campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- ============================================
-- CLIENT STRATEGY PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, archived
  duration_days INTEGER DEFAULT 90,
  
  -- AI-Generated Plan
  executive_summary TEXT,
  target_persona JSONB,
  channel_strategy JSONB,
  content_calendar JSONB,
  sample_templates JSONB,
  kpi_targets JSONB,
  compliance_guardrails TEXT[],
  
  -- Execution Config
  skills_config JSONB, -- which skills to use
  schedule_config JSONB, -- cron schedules
  
  -- Metrics
  total_outreach INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  total_meetings INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENT REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES client_strategies(id),
  report_type VARCHAR(50) DEFAULT 'weekly', -- daily, weekly, monthly, custom
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  metrics JSONB NOT NULL,
  highlights TEXT[],
  recommendations TEXT[],
  
  -- Generated content
  markdown_content TEXT,
  pdf_url VARCHAR(500),
  
  sent_to_client BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_client ON outreach_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_templates_client ON templates(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_client ON outreach_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_strategies_client ON client_strategies(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON client_reports(client_id);

-- ============================================
-- SAMPLE CLIENT (Your First Test)
-- ============================================
INSERT INTO clients (name, slug, description, industry, target_audience, goals, preferred_channels, tone)
VALUES (
  'Demo Agency',
  'demo',
  'Internal testing client for ClawBot',
  'Technology',
  'Startup founders and technical decision makers looking for AI solutions',
  'Generate 20 qualified leads per month, book 5 demo calls',
  ARRAY['email', 'linkedin', 'twitter'],
  'professional'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================
-- Uncomment these if you want RLS enabled

-- ALTER TABLE outreach_contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Filter by client" ON outreach_contacts
--   FOR ALL USING (client_id = current_setting('app.current_client_id')::uuid);

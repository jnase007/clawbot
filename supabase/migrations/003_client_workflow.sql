-- Client Workflow Tables for Brandastic
-- Discovery → Strategy → Execution

-- ============ CLIENTS TABLE ============
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery', 'strategy', 'execution', 'optimization', 'completed')),
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'paused', 'churned')),
  assigned_to TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CLIENT DISCOVERIES TABLE ============
CREATE TABLE IF NOT EXISTS client_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Business Overview
  business_description TEXT,
  target_audience TEXT,
  unique_value_proposition TEXT,
  
  -- Current State
  current_marketing_channels TEXT[] DEFAULT '{}',
  current_monthly_budget DECIMAL(10, 2),
  current_pain_points TEXT[] DEFAULT '{}',
  
  -- Competitors
  competitors TEXT[] DEFAULT '{}',
  competitor_analysis TEXT,
  
  -- Goals
  primary_goals TEXT[] DEFAULT '{}',
  success_metrics TEXT[] DEFAULT '{}',
  timeline TEXT,
  
  -- Technical
  existing_tools TEXT[] DEFAULT '{}',
  website_analytics JSONB,
  social_presence JSONB,
  
  -- Notes
  discovery_notes TEXT,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CLIENT STRATEGIES TABLE ============
CREATE TABLE IF NOT EXISTS client_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Goals & KPIs
  strategic_goals TEXT[] DEFAULT '{}',
  kpis JSONB[] DEFAULT '{}',
  
  -- Audience
  target_personas JSONB[] DEFAULT '{}',
  audience_segments TEXT[] DEFAULT '{}',
  
  -- Channels & Tactics
  recommended_channels TEXT[] DEFAULT '{}',
  tactics JSONB[] DEFAULT '{}',
  
  -- Content Strategy
  content_themes TEXT[] DEFAULT '{}',
  content_calendar JSONB,
  
  -- Budget & Timeline
  proposed_budget DECIMAL(10, 2),
  budget_allocation JSONB,
  timeline_phases JSONB[] DEFAULT '{}',
  
  -- AI Recommendations
  ai_recommendations TEXT,
  
  -- Approval
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CLIENT CAMPAIGNS TABLE ============
CREATE TABLE IF NOT EXISTS client_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('awareness', 'traffic', 'leads', 'conversions', 'retention')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  budget DECIMAL(10, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  goals JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_clients_stage ON clients(stage);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_client_discoveries_client_id ON client_discoveries(client_id);
CREATE INDEX IF NOT EXISTS idx_client_strategies_client_id ON client_strategies(client_id);
CREATE INDEX IF NOT EXISTS idx_client_campaigns_client_id ON client_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_client_campaigns_status ON client_campaigns(status);

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_discoveries_updated_at ON client_discoveries;
CREATE TRIGGER update_client_discoveries_updated_at
  BEFORE UPDATE ON client_discoveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_strategies_updated_at ON client_strategies;
CREATE TRIGGER update_client_strategies_updated_at
  BEFORE UPDATE ON client_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_campaigns_updated_at ON client_campaigns;
CREATE TRIGGER update_client_campaigns_updated_at
  BEFORE UPDATE ON client_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_campaigns ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (for now)
CREATE POLICY "Allow all for authenticated" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON client_discoveries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON client_strategies FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON client_campaigns FOR ALL USING (true);

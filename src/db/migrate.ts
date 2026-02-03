import { getSupabaseClient } from './supabase.js';

/**
 * SQL migrations for Supabase
 * Run these in your Supabase SQL Editor or via this script
 */

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Outreach Contacts table
CREATE TABLE IF NOT EXISTS outreach_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('email', 'linkedin', 'reddit')),
  handle TEXT NOT NULL,
  name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'engaged', 'replied', 'unsubscribed', 'bounced')),
  notes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, handle)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('email', 'linkedin', 'reddit')),
  type TEXT NOT NULL CHECK (type IN ('post', 'message', 'email', 'comment')),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Logs table
CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES outreach_contacts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('email', 'linkedin', 'reddit')),
  action TEXT NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  response TEXT,
  success BOOLEAN DEFAULT true,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('email', 'linkedin', 'reddit')),
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_platform_status ON outreach_contacts(platform, status);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON outreach_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_logs_contact ON outreach_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON outreach_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform, is_active);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS contacts_updated_at ON outreach_contacts;
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON outreach_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS templates_updated_at ON templates;
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth setup)
-- For service role, allow all operations
CREATE POLICY "Service role full access" ON outreach_contacts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON templates FOR ALL USING (true);
CREATE POLICY "Service role full access" ON outreach_logs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON campaigns FOR ALL USING (true);

-- Insert sample templates for ProjectHunter.ai
INSERT INTO templates (platform, type, name, subject, content, variables) VALUES
  ('email', 'email', 'Welcome Developer', 'Earn money building AI agents on ProjectHunter.ai 🚀', 
   'Hey {{name}},

I noticed you''re into {{interest}} - thought you might be interested in ProjectHunter.ai!

We''re a marketplace where developers like you can:
• Post bounties for custom AI agents
• Build agents and earn up to $5K per project
• Connect with businesses needing AI solutions

Check it out: https://projecthunter.ai

Would love to have you in the community!

Best,
The ProjectHunter.ai Team', 
   ARRAY['name', 'interest']),
   
  ('linkedin', 'message', 'Developer Outreach', NULL,
   'Hi {{name}}! 👋

Saw your work in {{field}} - impressive stuff!

Quick question: ever thought about monetizing your AI skills? 

ProjectHunter.ai connects developers with businesses looking for custom AI agents. Bounties range from $500-$5K.

Worth a look if you''re interested: projecthunter.ai

Cheers!',
   ARRAY['name', 'field']),
   
  ('reddit', 'post', 'AI Gig Announcement', 'Developers: Earn building custom AI agents on ProjectHunter.ai',
   'Hey r/{{subreddit}}! 👋

Just launched ProjectHunter.ai - a marketplace for AI agent development.

**For Developers:**
- Browse bounties for custom AI agents
- Earn $500-$5K per project
- Build your portfolio with real client work

**For Businesses:**
- Post bounties for the AI tools you need
- Get matched with skilled developers
- Pay only for delivered results

Check it out and let me know what you think!

🔗 projecthunter.ai',
   ARRAY['subreddit'])
ON CONFLICT DO NOTHING;
`;

async function runMigrations() {
  console.log('📦 Running database migrations...\n');
  console.log('Copy and run the following SQL in your Supabase SQL Editor:');
  console.log('─'.repeat(60));
  console.log(migrations);
  console.log('─'.repeat(60));
  console.log('\n✅ Migration SQL generated. Run it in Supabase Dashboard > SQL Editor');
}

runMigrations().catch(console.error);

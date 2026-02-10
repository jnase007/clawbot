-- Seed Brandastic Agency Clients
-- Run this in Supabase SQL Editor to add your clients

-- First, ensure the clients table has the new marketing fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS target_job_titles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_industries text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_locations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_topics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_names text[] DEFAULT '{}';

-- Insert Brandastic (your agency)
INSERT INTO clients (
  name, slug, description, website, industry, target_audience, goals,
  preferred_channels, tone, status, primary_color, logo_url,
  target_job_titles, target_industries, target_locations, keywords, content_topics
) VALUES (
  'Brandastic',
  'brandastic',
  'AI-powered digital marketing agency specializing in healthcare, dental, and real estate marketing',
  'https://brandastic.com',
  'Marketing & Advertising',
  'Healthcare practices, dental offices, real estate companies, and B2B SaaS looking for AI-powered marketing',
  'Generate leads for agency services, showcase AI marketing capabilities, build thought leadership',
  ARRAY['linkedin', 'email', 'twitter']::platform[],
  'professional',
  'active',
  '#8B5CF6',
  'https://ndrhfhdsmjrixxbarymj.supabase.co/storage/v1/object/public/Image/mark.png',
  ARRAY['Marketing Director', 'CMO', 'CEO', 'Business Owner', 'Practice Manager'],
  ARRAY['Hospital & Health Care', 'Medical Practice', 'Dental', 'Real Estate', 'Technology'],
  ARRAY['United States'],
  ARRAY['digital marketing', 'AI marketing', 'SEO', 'PPC', 'social media marketing', 'healthcare marketing'],
  ARRAY['AI Marketing Strategies', 'Digital Marketing ROI', 'Healthcare Marketing', 'Lead Generation']
) ON CONFLICT (slug) DO UPDATE SET
  target_job_titles = EXCLUDED.target_job_titles,
  target_industries = EXCLUDED.target_industries,
  target_locations = EXCLUDED.target_locations,
  keywords = EXCLUDED.keywords,
  content_topics = EXCLUDED.content_topics;

-- Insert EquityMD
INSERT INTO clients (
  name, slug, description, website, industry, target_audience, goals,
  preferred_channels, tone, status, primary_color,
  target_job_titles, target_industries, target_locations, keywords, content_topics
) VALUES (
  'EquityMD',
  'equitymd',
  'SaaS platform connecting real estate syndicators with accredited investors',
  'https://equitymd.com',
  'Real Estate Investment',
  'Accredited investors seeking passive real estate income, syndicators looking to raise capital',
  'Attract accredited investors, help syndicators raise capital, build platform authority',
  ARRAY['linkedin', 'email']::platform[],
  'professional',
  'active',
  '#10B981',
  ARRAY['Accredited Investor', 'Real Estate Syndicator', 'Fund Manager', 'Family Office', 'Wealth Manager', 'Financial Advisor'],
  ARRAY['Real Estate', 'Investment Banking', 'Venture Capital & Private Equity', 'Financial Services', 'Banking'],
  ARRAY['United States'],
  ARRAY['real estate syndication', 'accredited investors', 'passive income', 'multifamily investing', '1031 exchange'],
  ARRAY['Real Estate Syndication 101', 'Passive Real Estate Investing', 'Tax Benefits of Real Estate', 'Due Diligence for Investors']
) ON CONFLICT (slug) DO UPDATE SET
  target_job_titles = EXCLUDED.target_job_titles,
  target_industries = EXCLUDED.target_industries,
  target_locations = EXCLUDED.target_locations,
  keywords = EXCLUDED.keywords,
  content_topics = EXCLUDED.content_topics;

-- Insert ProjectHunter
INSERT INTO clients (
  name, slug, description, website, industry, target_audience, goals,
  preferred_channels, tone, status, primary_color,
  target_job_titles, target_industries, target_locations, keywords, content_topics
) VALUES (
  'ProjectHunter',
  'projecthunter',
  'Lead generation platform for construction and development projects',
  'https://projecthunter.com',
  'Construction & Development',
  'General contractors, developers, construction companies seeking new project leads',
  'Generate contractor signups, increase project submissions, become the go-to platform for construction leads',
  ARRAY['linkedin', 'email']::platform[],
  'professional',
  'active',
  '#F59E0B',
  ARRAY['Project Manager', 'General Contractor', 'Developer', 'Construction Manager', 'Estimator', 'VP of Operations'],
  ARRAY['Construction', 'Building Materials', 'Architecture & Planning', 'Civil Engineering', 'Real Estate Development'],
  ARRAY['United States'],
  ARRAY['construction leads', 'project bidding', 'commercial construction', 'contractor marketing'],
  ARRAY['Finding Construction Projects', 'Winning More Bids', 'Construction Marketing', 'Contractor Lead Generation']
) ON CONFLICT (slug) DO UPDATE SET
  target_job_titles = EXCLUDED.target_job_titles,
  target_industries = EXCLUDED.target_industries,
  target_locations = EXCLUDED.target_locations,
  keywords = EXCLUDED.keywords,
  content_topics = EXCLUDED.content_topics;

-- Insert Comply
INSERT INTO clients (
  name, slug, description, website, industry, target_audience, goals,
  preferred_channels, tone, status, primary_color,
  target_job_titles, target_industries, target_locations, keywords, content_topics
) VALUES (
  'Comply',
  'comply',
  'Compliance automation platform for financial services and healthcare',
  'https://comply.com',
  'Compliance & Legal Tech',
  'Compliance officers, risk managers, and legal teams at regulated companies',
  'Generate demo requests, build authority in compliance space, educate market on automation benefits',
  ARRAY['linkedin', 'email']::platform[],
  'professional',
  'active',
  '#3B82F6',
  ARRAY['Compliance Officer', 'General Counsel', 'Risk Manager', 'CISO', 'VP of Legal', 'Chief Risk Officer'],
  ARRAY['Financial Services', 'Banking', 'Insurance', 'Healthcare', 'Technology'],
  ARRAY['United States'],
  ARRAY['compliance management', 'regulatory compliance', 'risk management', 'audit automation', 'GRC'],
  ARRAY['Compliance Automation Best Practices', 'Regulatory Updates 2026', 'Risk Management Strategies', 'Audit Preparation']
) ON CONFLICT (slug) DO UPDATE SET
  target_job_titles = EXCLUDED.target_job_titles,
  target_industries = EXCLUDED.target_industries,
  target_locations = EXCLUDED.target_locations,
  keywords = EXCLUDED.keywords,
  content_topics = EXCLUDED.content_topics;

-- Verify the clients were created
SELECT id, name, industry, target_job_titles[1:3] as sample_titles, status 
FROM clients 
WHERE slug IN ('brandastic', 'equitymd', 'projecthunter', 'comply');

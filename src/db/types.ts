export type Platform = 'email' | 'linkedin' | 'reddit' | 'twitter' | 'github' | 'discord';
export type ContactStatus = 'pending' | 'sent' | 'engaged' | 'replied' | 'unsubscribed' | 'bounced';
export type TemplateType = 'post' | 'message' | 'email' | 'comment';
export type ClientStage = 'discovery' | 'strategy' | 'execution' | 'optimization' | 'completed';
export type ClientStatus = 'prospect' | 'active' | 'paused' | 'churned';

export interface OutreachContact {
  id: string;
  platform: Platform;
  handle: string;
  name: string | null;
  email: string | null;
  status: ContactStatus;
  notes: Record<string, unknown> | null;
  tags: string[];
  last_contacted: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  platform: Platform;
  type: TemplateType;
  name: string;
  subject: string | null;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutreachLog {
  id: string;
  contact_id: string | null;
  platform: Platform;
  action: string;
  template_id: string | null;
  metadata: Record<string, unknown> | null;
  response: string | null;
  success: boolean;
  error: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  template_id: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_contacts: number;
  sent_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

// ============ CLIENT WORKFLOW TYPES ============

export interface Client {
  id: string;
  name: string;
  company: string;
  industry: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  stage: ClientStage;
  status: ClientStatus;
  assigned_to: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ClientDiscovery {
  id: string;
  client_id: string;
  // Business Overview
  business_description: string | null;
  target_audience: string | null;
  unique_value_proposition: string | null;
  // Current State
  current_marketing_channels: string[];
  current_monthly_budget: number | null;
  current_pain_points: string[];
  // Competitors
  competitors: string[];
  competitor_analysis: string | null;
  // Goals
  primary_goals: string[];
  success_metrics: string[];
  timeline: string | null;
  // Technical
  existing_tools: string[];
  website_analytics: Record<string, unknown> | null;
  social_presence: Record<string, unknown> | null;
  // Notes
  discovery_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStrategy {
  id: string;
  client_id: string;
  // Goals & KPIs
  strategic_goals: string[];
  kpis: Record<string, unknown>[];
  // Audience
  target_personas: Record<string, unknown>[];
  audience_segments: string[];
  // Channels & Tactics
  recommended_channels: string[];
  tactics: Record<string, unknown>[];
  // Content Strategy
  content_themes: string[];
  content_calendar: Record<string, unknown> | null;
  // Budget & Timeline
  proposed_budget: number | null;
  budget_allocation: Record<string, unknown> | null;
  timeline_phases: Record<string, unknown>[];
  // AI Recommendations
  ai_recommendations: string | null;
  // Approval
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientCampaign {
  id: string;
  client_id: string;
  name: string;
  platform: Platform;
  type: 'awareness' | 'traffic' | 'leads' | 'conversions' | 'retention';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  goals: Record<string, unknown> | null;
  results: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      outreach_contacts: {
        Row: OutreachContact;
        Insert: Omit<OutreachContact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OutreachContact, 'id' | 'created_at'>>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Template, 'id' | 'created_at'>>;
      };
      outreach_logs: {
        Row: OutreachLog;
        Insert: Omit<OutreachLog, 'id' | 'created_at'>;
        Update: Partial<Omit<OutreachLog, 'id' | 'created_at'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Campaign, 'id' | 'created_at'>>;
      };
    };
    Views: {};
    Functions: {};
  };
}

export type Platform = 'email' | 'linkedin' | 'reddit' | 'twitter' | 'github' | 'discord';
export type ContactStatus = 'pending' | 'sent' | 'engaged' | 'replied' | 'unsubscribed' | 'bounced';
export type TemplateType = 'post' | 'message' | 'email' | 'comment';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';

// Client (Agency Multi-Tenant)
export interface Client {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  target_audience: string | null;
  goals: string | null;
  preferred_channels: Platform[];
  tone: 'professional' | 'casual' | 'bold' | 'friendly';
  compliance_notes: string | null;
  logo_url: string | null;
  primary_color: string;
  status: 'active' | 'paused' | 'churned';
  monthly_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachContact {
  id: string;
  client_id: string | null;
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
  client_id: string | null;
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
  client_id: string | null;
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
  client_id: string | null;
  name: string;
  platform: Platform;
  template_id: string | null;
  status: CampaignStatus;
  total_contacts: number;
  sent_count: number;
  success_count: number;
  error_count: number;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStrategy {
  id: string;
  client_id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  duration_days: number;
  executive_summary: string | null;
  target_persona: Record<string, unknown> | null;
  channel_strategy: Record<string, unknown> | null;
  content_calendar: Record<string, unknown> | null;
  sample_templates: Record<string, unknown> | null;
  kpi_targets: Record<string, unknown> | null;
  compliance_guardrails: string[] | null;
  skills_config: Record<string, unknown> | null;
  schedule_config: Record<string, unknown> | null;
  total_outreach: number;
  total_responses: number;
  total_meetings: number;
  total_conversions: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      outreach_contacts: {
        Row: OutreachContact;
        Insert: Partial<Omit<OutreachContact, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<OutreachContact, 'id' | 'created_at'>>;
      };
      templates: {
        Row: Template;
        Insert: Partial<Omit<Template, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Template, 'id' | 'created_at'>>;
      };
      outreach_logs: {
        Row: OutreachLog;
        Insert: Partial<Omit<OutreachLog, 'id' | 'created_at'>>;
        Update: Partial<Omit<OutreachLog, 'id' | 'created_at'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Campaign, 'id' | 'created_at'>>;
      };
      client_strategies: {
        Row: ClientStrategy;
        Insert: Partial<Omit<ClientStrategy, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ClientStrategy, 'id' | 'created_at'>>;
      };
    };
  };
}

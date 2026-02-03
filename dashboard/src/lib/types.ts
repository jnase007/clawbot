export type Platform = 'email' | 'linkedin' | 'reddit';
export type ContactStatus = 'pending' | 'sent' | 'engaged' | 'replied' | 'unsubscribed' | 'bounced';
export type TemplateType = 'post' | 'message' | 'email' | 'comment';

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
    };
  };
}

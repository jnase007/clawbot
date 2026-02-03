import { getSupabaseClient, handleSupabaseError } from './supabase.js';
import type { 
  OutreachContact, 
  Template, 
  OutreachLog, 
  Campaign,
  Platform, 
  ContactStatus,
  TemplateType 
} from './types.js';

const supabase = () => getSupabaseClient();

// ============ CONTACTS ============

export async function addContact(
  platform: Platform,
  handle: string,
  name?: string,
  email?: string,
  tags?: string[]
): Promise<OutreachContact> {
  const { data, error } = await supabase()
    .from('outreach_contacts')
    .upsert({
      platform,
      handle,
      name: name || null,
      email: email || null,
      status: 'pending' as ContactStatus,
      tags: tags || [],
      notes: {},
      last_contacted: null,
    }, { onConflict: 'platform,handle' })
    .select()
    .single();

  if (error) handleSupabaseError(error, 'addContact');
  return data!;
}

export async function getContact(id: string): Promise<OutreachContact | null> {
  const { data, error } = await supabase()
    .from('outreach_contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error, 'getContact');
  return data;
}

export async function getPendingContacts(
  platform: Platform,
  limit = 50
): Promise<OutreachContact[]> {
  const { data, error } = await supabase()
    .from('outreach_contacts')
    .select('*')
    .eq('platform', platform)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) handleSupabaseError(error, 'getPendingContacts');
  return data || [];
}

export async function getContactsByTag(
  tag: string,
  platform?: Platform
): Promise<OutreachContact[]> {
  let query = supabase()
    .from('outreach_contacts')
    .select('*')
    .contains('tags', [tag]);

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;
  if (error) handleSupabaseError(error, 'getContactsByTag');
  return data || [];
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'sent' || status === 'engaged') {
    updates.last_contacted = new Date().toISOString();
  }

  const { error } = await supabase()
    .from('outreach_contacts')
    .update(updates)
    .eq('id', id);

  if (error) handleSupabaseError(error, 'updateContactStatus');
}

export async function searchContacts(
  query: string,
  platform?: Platform
): Promise<OutreachContact[]> {
  let dbQuery = supabase()
    .from('outreach_contacts')
    .select('*')
    .or(`name.ilike.%${query}%,handle.ilike.%${query}%,email.ilike.%${query}%`);

  if (platform) {
    dbQuery = dbQuery.eq('platform', platform);
  }

  const { data, error } = await dbQuery.limit(100);
  if (error) handleSupabaseError(error, 'searchContacts');
  return data || [];
}

// ============ TEMPLATES ============

export async function createTemplate(
  platform: Platform,
  type: TemplateType,
  name: string,
  content: string,
  subject?: string
): Promise<Template> {
  // Extract variables from content (e.g., {{name}}, {{interest}})
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  const { data, error } = await supabase()
    .from('templates')
    .insert({
      platform,
      type,
      name,
      subject: subject || null,
      content,
      variables,
      is_active: true,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error, 'createTemplate');
  return data!;
}

export async function getTemplate(id: string): Promise<Template | null> {
  const { data, error } = await supabase()
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error, 'getTemplate');
  return data;
}

export async function getTemplatesByPlatform(
  platform: Platform,
  activeOnly = true
): Promise<Template[]> {
  let query = supabase()
    .from('templates')
    .select('*')
    .eq('platform', platform);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) handleSupabaseError(error, 'getTemplatesByPlatform');
  return data || [];
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<Template, 'name' | 'subject' | 'content' | 'is_active'>>
): Promise<Template> {
  // Re-extract variables if content changed
  if (updates.content) {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(updates.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    (updates as Record<string, unknown>).variables = variables;
  }

  const { data, error } = await supabase()
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error, 'updateTemplate');
  return data!;
}

// ============ LOGS ============

export async function logAction(
  platform: Platform,
  action: string,
  success: boolean,
  contactId?: string,
  templateId?: string,
  metadata?: Record<string, unknown>,
  response?: string,
  error?: string
): Promise<OutreachLog> {
  const { data, error: dbError } = await supabase()
    .from('outreach_logs')
    .insert({
      platform,
      action,
      success,
      contact_id: contactId || null,
      template_id: templateId || null,
      metadata: metadata || {},
      response: response || null,
      error: error || null,
    })
    .select()
    .single();

  if (dbError) handleSupabaseError(dbError, 'logAction');
  return data!;
}

export async function getRecentLogs(
  limit = 50,
  platform?: Platform
): Promise<OutreachLog[]> {
  let query = supabase()
    .from('outreach_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;
  if (error) handleSupabaseError(error, 'getRecentLogs');
  return data || [];
}

export async function getLogsForContact(contactId: string): Promise<OutreachLog[]> {
  const { data, error } = await supabase()
    .from('outreach_logs')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error, 'getLogsForContact');
  return data || [];
}

// ============ CAMPAIGNS ============

export async function createCampaign(
  name: string,
  platform: Platform,
  templateId: string
): Promise<Campaign> {
  const { data, error } = await supabase()
    .from('campaigns')
    .insert({
      name,
      platform,
      template_id: templateId,
      status: 'draft',
      scheduled_at: null,
      started_at: null,
      completed_at: null,
      total_contacts: 0,
      sent_count: 0,
      success_count: 0,
      error_count: 0,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error, 'createCampaign');
  return data!;
}

export async function updateCampaignStats(
  id: string,
  updates: Partial<Pick<Campaign, 'status' | 'sent_count' | 'success_count' | 'error_count' | 'total_contacts'>>
): Promise<void> {
  const { error } = await supabase()
    .from('campaigns')
    .update(updates)
    .eq('id', id);

  if (error) handleSupabaseError(error, 'updateCampaignStats');
}

// ============ STATS ============

export async function getOutreachStats(): Promise<{
  totalContacts: number;
  byPlatform: Record<Platform, number>;
  byStatus: Record<ContactStatus, number>;
  recentActivity: number;
}> {
  const { data: contacts, error } = await supabase()
    .from('outreach_contacts')
    .select('platform, status, last_contacted');

  if (error) handleSupabaseError(error, 'getOutreachStats');

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    totalContacts: contacts?.length || 0,
    byPlatform: { email: 0, linkedin: 0, reddit: 0 } as Record<Platform, number>,
    byStatus: { pending: 0, sent: 0, engaged: 0, replied: 0, unsubscribed: 0, bounced: 0 } as Record<ContactStatus, number>,
    recentActivity: 0,
  };

  contacts?.forEach((c) => {
    stats.byPlatform[c.platform as Platform]++;
    stats.byStatus[c.status as ContactStatus]++;
    if (c.last_contacted && new Date(c.last_contacted) > weekAgo) {
      stats.recentActivity++;
    }
  });

  return stats;
}

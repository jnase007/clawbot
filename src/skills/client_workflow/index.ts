/**
 * Client Workflow Management for Brandastic
 * Handles: Discovery → Strategy → Execution phases
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/index.js';
import { getSupabaseClient } from '../../db/supabase.js';
import { logAction } from '../../db/repository.js';
import type { 
  Client, 
  ClientDiscovery, 
  ClientStrategy, 
  ClientCampaign,
  ClientStage,
  ClientStatus,
  Platform 
} from '../../db/types.js';

let anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropic) {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }
    anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function supabase() {
  return getSupabaseClient();
}

// ============ CLIENT MANAGEMENT ============

export async function createClient(data: {
  name: string;
  company: string;
  industry: string;
  website?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}): Promise<Client> {
  const { data: client, error } = await supabase()
    .from('clients')
    .insert({
      name: data.name,
      company: data.company,
      industry: data.industry,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
      stage: 'discovery' as ClientStage,
      status: 'prospect' as ClientStatus,
      notes: data.notes || null,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create client: ${error.message}`);
  
  await logAction('email' as Platform, 'create_client', true, undefined, undefined, { 
    clientId: client.id, 
    company: data.company 
  });
  
  return client;
}

export async function getClient(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase()
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) return null;
  return data;
}

export async function listClients(options?: {
  stage?: ClientStage;
  status?: ClientStatus;
  industry?: string;
  limit?: number;
}): Promise<Client[]> {
  let query = supabase().from('clients').select('*');

  if (options?.stage) query = query.eq('stage', options.stage);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.industry) query = query.ilike('industry', `%${options.industry}%`);

  query = query.order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list clients: ${error.message}`);
  return data || [];
}

export async function updateClientStage(
  clientId: string, 
  stage: ClientStage
): Promise<Client> {
  const { data, error } = await supabase()
    .from('clients')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update client stage: ${error.message}`);
  
  await logAction('email' as Platform, 'update_client_stage', true, undefined, undefined, { 
    clientId, 
    stage 
  });
  
  return data;
}

// ============ DISCOVERY PHASE ============

export async function createDiscovery(
  clientId: string,
  data: Partial<Omit<ClientDiscovery, 'id' | 'client_id' | 'created_at' | 'updated_at'>>
): Promise<ClientDiscovery> {
  const { data: discovery, error } = await supabase()
    .from('client_discoveries')
    .insert({
      client_id: clientId,
      business_description: data.business_description || null,
      target_audience: data.target_audience || null,
      unique_value_proposition: data.unique_value_proposition || null,
      current_marketing_channels: data.current_marketing_channels || [],
      current_monthly_budget: data.current_monthly_budget || null,
      current_pain_points: data.current_pain_points || [],
      competitors: data.competitors || [],
      competitor_analysis: data.competitor_analysis || null,
      primary_goals: data.primary_goals || [],
      success_metrics: data.success_metrics || [],
      timeline: data.timeline || null,
      existing_tools: data.existing_tools || [],
      website_analytics: data.website_analytics || null,
      social_presence: data.social_presence || null,
      discovery_notes: data.discovery_notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create discovery: ${error.message}`);
  
  await logAction('email' as Platform, 'create_discovery', true, undefined, undefined, { 
    clientId,
    discoveryId: discovery.id 
  });
  
  return discovery;
}

export async function getDiscovery(clientId: string): Promise<ClientDiscovery | null> {
  const { data, error } = await supabase()
    .from('client_discoveries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function completeDiscovery(clientId: string): Promise<void> {
  await supabase()
    .from('client_discoveries')
    .update({ 
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('client_id', clientId);

  await updateClientStage(clientId, 'strategy');
}

// ============ STRATEGY PHASE ============

export async function generateStrategy(clientId: string): Promise<ClientStrategy> {
  // Get discovery data first
  const discovery = await getDiscovery(clientId);
  if (!discovery) {
    throw new Error('Discovery not found. Complete discovery phase first.');
  }

  const client = await getClient(clientId);
  if (!client) {
    throw new Error('Client not found');
  }

  const ai = getAnthropic();

  // Generate AI-powered strategy based on discovery
  const response = await ai.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    system: `You are a senior marketing strategist at Brandastic, a digital marketing agency specializing in AI-powered marketing for healthcare and dental companies.

Based on the discovery data provided, create a comprehensive marketing strategy that includes:
1. Strategic goals aligned with client objectives
2. KPIs to measure success
3. Target audience personas
4. Recommended marketing channels
5. Specific tactics for each channel
6. Content themes and ideas
7. Budget allocation recommendations
8. Timeline with phases

Be specific, actionable, and data-driven. Focus on ROI and measurable outcomes.`,
    messages: [
      {
        role: 'user',
        content: `Create a marketing strategy for this client:

**Company:** ${client.company}
**Industry:** ${client.industry}

**Discovery Data:**
- Business Description: ${discovery.business_description || 'Not provided'}
- Target Audience: ${discovery.target_audience || 'Not provided'}
- Unique Value Proposition: ${discovery.unique_value_proposition || 'Not provided'}
- Current Channels: ${discovery.current_marketing_channels?.join(', ') || 'None'}
- Current Budget: $${discovery.current_monthly_budget || 'Not specified'}/month
- Pain Points: ${discovery.current_pain_points?.join(', ') || 'Not specified'}
- Competitors: ${discovery.competitors?.join(', ') || 'Not specified'}
- Primary Goals: ${discovery.primary_goals?.join(', ') || 'Not specified'}
- Success Metrics: ${discovery.success_metrics?.join(', ') || 'Not specified'}
- Timeline: ${discovery.timeline || 'Not specified'}
- Existing Tools: ${discovery.existing_tools?.join(', ') || 'None'}

Return JSON:
{
  "strategic_goals": ["goal1", "goal2", "goal3"],
  "kpis": [
    {"name": "KPI Name", "target": "Target Value", "measurement": "How to measure"}
  ],
  "target_personas": [
    {"name": "Persona Name", "demographics": "...", "pain_points": ["..."], "goals": ["..."]}
  ],
  "audience_segments": ["segment1", "segment2"],
  "recommended_channels": ["channel1", "channel2"],
  "tactics": [
    {"channel": "Channel", "tactic": "Tactic description", "priority": "high/medium/low"}
  ],
  "content_themes": ["theme1", "theme2"],
  "budget_allocation": {
    "channel1": 30,
    "channel2": 25
  },
  "timeline_phases": [
    {"phase": "Phase 1", "duration": "Month 1-2", "focus": "Setup and foundation", "deliverables": ["..."]}
  ],
  "ai_recommendations": "Overall strategic recommendations and insights..."
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const strategyData = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  // Save strategy to database
  const { data: strategy, error } = await supabase()
    .from('client_strategies')
    .insert({
      client_id: clientId,
      strategic_goals: strategyData.strategic_goals || [],
      kpis: strategyData.kpis || [],
      target_personas: strategyData.target_personas || [],
      audience_segments: strategyData.audience_segments || [],
      recommended_channels: strategyData.recommended_channels || [],
      tactics: strategyData.tactics || [],
      content_themes: strategyData.content_themes || [],
      content_calendar: null,
      proposed_budget: discovery.current_monthly_budget,
      budget_allocation: strategyData.budget_allocation || null,
      timeline_phases: strategyData.timeline_phases || [],
      ai_recommendations: strategyData.ai_recommendations || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save strategy: ${error.message}`);

  await logAction('email' as Platform, 'generate_strategy', true, undefined, undefined, { 
    clientId,
    strategyId: strategy.id 
  });

  return strategy;
}

export async function getStrategy(clientId: string): Promise<ClientStrategy | null> {
  const { data, error } = await supabase()
    .from('client_strategies')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function approveStrategy(
  clientId: string, 
  approvedBy: string
): Promise<void> {
  await supabase()
    .from('client_strategies')
    .update({ 
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('client_id', clientId);

  await updateClientStage(clientId, 'execution');
}

// ============ EXECUTION PHASE ============

export async function createCampaign(
  clientId: string,
  data: {
    name: string;
    platform: Platform;
    type: 'awareness' | 'traffic' | 'leads' | 'conversions' | 'retention';
    budget?: number;
    startDate?: string;
    endDate?: string;
    goals?: Record<string, unknown>;
  }
): Promise<ClientCampaign> {
  const { data: campaign, error } = await supabase()
    .from('client_campaigns')
    .insert({
      client_id: clientId,
      name: data.name,
      platform: data.platform,
      type: data.type,
      status: 'draft',
      budget: data.budget || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      goals: data.goals || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  
  await logAction('email' as Platform, 'create_campaign', true, undefined, undefined, { 
    clientId,
    campaignId: campaign.id,
    name: data.name 
  });
  
  return campaign;
}

export async function listCampaigns(clientId: string): Promise<ClientCampaign[]> {
  const { data, error } = await supabase()
    .from('client_campaigns')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
  return data || [];
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
): Promise<void> {
  await supabase()
    .from('client_campaigns')
    .update({ 
      status,
      updated_at: new Date().toISOString() 
    })
    .eq('id', campaignId);
}

// ============ CLIENT DASHBOARD DATA ============

export async function getClientDashboard(clientId: string): Promise<{
  client: Client;
  discovery: ClientDiscovery | null;
  strategy: ClientStrategy | null;
  campaigns: ClientCampaign[];
  progress: {
    discoveryComplete: boolean;
    strategyApproved: boolean;
    activeCampaigns: number;
  };
}> {
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found');

  const discovery = await getDiscovery(clientId);
  const strategy = await getStrategy(clientId);
  const campaigns = await listCampaigns(clientId);

  return {
    client,
    discovery,
    strategy,
    campaigns,
    progress: {
      discoveryComplete: !!discovery?.completed_at,
      strategyApproved: !!strategy?.approved_at,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    },
  };
}

// ============ BULK OPERATIONS ============

export async function getClientPipeline(): Promise<{
  discovery: Client[];
  strategy: Client[];
  execution: Client[];
  optimization: Client[];
}> {
  const clients = await listClients({ status: 'active' });
  
  return {
    discovery: clients.filter(c => c.stage === 'discovery'),
    strategy: clients.filter(c => c.stage === 'strategy'),
    execution: clients.filter(c => c.stage === 'execution'),
    optimization: clients.filter(c => c.stage === 'optimization'),
  };
}

// Export metadata
export const clientWorkflowMetadata = {
  name: 'client_workflow',
  description: 'Manage client lifecycle: Discovery → Strategy → Execution',
  functions: [
    { name: 'createClient', description: 'Create a new client' },
    { name: 'createDiscovery', description: 'Create discovery document' },
    { name: 'generateStrategy', description: 'AI-generate strategy from discovery' },
    { name: 'createCampaign', description: 'Create campaign for client' },
    { name: 'getClientDashboard', description: 'Get full client overview' },
    { name: 'getClientPipeline', description: 'View all clients by stage' },
  ],
};

export default {
  createClient,
  getClient,
  listClients,
  updateClientStage,
  createDiscovery,
  getDiscovery,
  completeDiscovery,
  generateStrategy,
  getStrategy,
  approveStrategy,
  createCampaign,
  listCampaigns,
  updateCampaignStatus,
  getClientDashboard,
  getClientPipeline,
  clientWorkflowMetadata,
};

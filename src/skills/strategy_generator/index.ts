import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { getSupabaseClient } from '../../db/supabase.js';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return openai;
}

export interface ClientInfo {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  target_audience?: string;
  goals?: string;
  preferred_channels?: string[];
  tone?: string;
  compliance_notes?: string;
  website?: string;
}

export interface StrategyPlan {
  executive_summary: string;
  target_persona: {
    demographics: string;
    pain_points: string[];
    motivations: string[];
    preferred_channels: string[];
  };
  channel_strategy: {
    channel: string;
    priority: 'high' | 'medium' | 'low';
    tactics: string[];
    frequency: string;
  }[];
  content_calendar: {
    week: number;
    focus: string;
    activities: {
      channel: string;
      action: string;
      quantity: number;
    }[];
  }[];
  sample_templates: {
    channel: string;
    type: string;
    subject?: string;
    content: string;
  }[];
  kpi_targets: {
    metric: string;
    target: number;
    timeframe: string;
  }[];
  compliance_guardrails: string[];
  skills_config: {
    skills: string[];
    custom_prompts: Record<string, string>;
    schedule: string;
  };
}

/**
 * Generate a comprehensive marketing strategy for a client
 */
export async function generateClientStrategy(client: ClientInfo): Promise<StrategyPlan> {
  const ai = getOpenAI();

  const systemPrompt = `You are an expert digital marketing strategist specializing in AI-powered outreach for agencies. 
You create comprehensive, actionable marketing plans that can be executed by an AI agent.

Your plans should be:
- Specific and actionable
- Compliant with platform terms of service
- Value-first (no spammy tactics)
- Measurable with clear KPIs
- Personalized to the client's industry and audience`;

  const userPrompt = `Create a 90-day AI-powered outreach strategy for this client:

CLIENT DETAILS:
- Name: ${client.name}
- Industry: ${client.industry || 'Not specified'}
- Target Audience: ${client.target_audience || 'Not specified'}
- Goals: ${client.goals || 'Generate leads and increase brand awareness'}
- Preferred Channels: ${client.preferred_channels?.join(', ') || 'Email, LinkedIn'}
- Tone: ${client.tone || 'Professional'}
- Compliance Notes: ${client.compliance_notes || 'Standard business communication rules'}
- Website: ${client.website || 'Not specified'}

Generate a comprehensive strategy with:
1. Executive Summary (2-3 sentences)
2. Target Persona (demographics, pain points, motivations)
3. Channel Strategy (priority, tactics, frequency for each channel)
4. 12-Week Content Calendar (weekly focus and activities)
5. Sample Templates (3-5 ready-to-use templates per channel)
6. KPI Targets (specific metrics to track)
7. Compliance Guardrails (rules to follow)
8. Skills Config (which ClawBot skills to use, custom prompts, cron schedule)

Output as valid JSON matching this structure exactly:
{
  "executive_summary": "string",
  "target_persona": {
    "demographics": "string",
    "pain_points": ["string"],
    "motivations": ["string"],
    "preferred_channels": ["string"]
  },
  "channel_strategy": [{
    "channel": "email|linkedin|reddit|twitter",
    "priority": "high|medium|low",
    "tactics": ["string"],
    "frequency": "string"
  }],
  "content_calendar": [{
    "week": 1,
    "focus": "string",
    "activities": [{"channel": "string", "action": "string", "quantity": 10}]
  }],
  "sample_templates": [{
    "channel": "string",
    "type": "email|post|message",
    "subject": "optional string",
    "content": "string with {{name}} variables"
  }],
  "kpi_targets": [{
    "metric": "string",
    "target": 100,
    "timeframe": "30 days"
  }],
  "compliance_guardrails": ["string"],
  "skills_config": {
    "skills": ["email_outreach", "linkedin_outreach"],
    "custom_prompts": {"key": "prompt"},
    "schedule": "0 9 * * 1-5"
  }
}`;

  const response = await ai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result as StrategyPlan;
}

/**
 * Save a strategy to the database
 */
export async function saveStrategy(
  clientId: string,
  name: string,
  plan: StrategyPlan
): Promise<{ id: string }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('client_strategies')
    .insert({
      client_id: clientId,
      name,
      status: 'draft',
      duration_days: 90,
      executive_summary: plan.executive_summary,
      target_persona: plan.target_persona,
      channel_strategy: plan.channel_strategy,
      content_calendar: plan.content_calendar,
      sample_templates: plan.sample_templates,
      kpi_targets: plan.kpi_targets,
      compliance_guardrails: plan.compliance_guardrails,
      skills_config: plan.skills_config,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id };
}

/**
 * Generate and save a strategy in one step
 */
export async function generateAndSaveStrategy(
  client: ClientInfo,
  strategyName?: string
): Promise<{ strategyId: string; plan: StrategyPlan }> {
  console.log(`🎯 Generating strategy for ${client.name}...`);
  
  const plan = await generateClientStrategy(client);
  
  const name = strategyName || `${client.name} - 90 Day Strategy`;
  const { id } = await saveStrategy(client.id, name, plan);
  
  console.log(`✅ Strategy saved with ID: ${id}`);
  
  return { strategyId: id, plan };
}

/**
 * Activate a strategy (start executing it)
 */
export async function activateStrategy(strategyId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('client_strategies')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', strategyId);

  console.log(`🚀 Strategy ${strategyId} activated`);
}

/**
 * Get client info from database
 */
export async function getClientInfo(clientId: string): Promise<ClientInfo | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    industry: data.industry,
    target_audience: data.target_audience,
    goals: data.goals,
    preferred_channels: data.preferred_channels,
    tone: data.tone,
    compliance_notes: data.compliance_notes,
    website: data.website,
  };
}

// Skill metadata
export const strategyGeneratorMetadata = {
  name: 'strategy_generator',
  description: 'Generate comprehensive marketing strategies for agency clients using AI',
  tools: [
    {
      name: 'generate_strategy',
      description: 'Generate a 90-day marketing strategy for a client',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string', description: 'The client UUID' },
          strategy_name: { type: 'string', description: 'Optional custom name for the strategy' },
        },
        required: ['client_id'],
      },
    },
    {
      name: 'activate_strategy',
      description: 'Activate a strategy to start execution',
      parameters: {
        type: 'object',
        properties: {
          strategy_id: { type: 'string', description: 'The strategy UUID' },
        },
        required: ['strategy_id'],
      },
    },
  ],
};

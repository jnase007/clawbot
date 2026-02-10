import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent } from '@netlify/functions';

const STRATEGY_SYSTEM_PROMPT = `You are an expert marketing strategist at Brandastic, a leading AI-powered digital marketing agency.

Your job is to create comprehensive, actionable marketing strategies based on client discovery data.

When generating a strategy, you MUST:
1. Be specific to the client's industry and target audience
2. Include concrete, measurable goals
3. Provide channel-specific tactics with clear actions
4. Create sample message/email templates personalized to the client
5. Define realistic KPIs based on their budget and timeline
6. Consider their current pain points and competition

Always return strategies in the exact JSON format requested.`;

interface DiscoveryData {
  business_description?: string;
  target_audience?: string;
  unique_value_proposition?: string;
  current_marketing_channels?: string[];
  current_monthly_budget?: string;
  current_pain_points?: string[];
  competitors?: string[];
  competitor_analysis?: string;
  primary_goals?: string[];
  success_metrics?: string[];
  timeline?: string;
  existing_tools?: string[];
  social_presence?: string;
  discovery_notes?: string;
}

interface ClientData {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  target_audience?: string;
  goals?: string;
  preferred_channels?: string[];
  tone?: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!anthropicKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { clientId, discoveryData, clientData } = body;

    // If we have Supabase, try to fetch discovery data
    let discovery: DiscoveryData = discoveryData || {};
    let client: ClientData = clientData || {};

    if (supabaseUrl && supabaseKey && clientId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch client
      const { data: clientRow } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientRow) {
        client = clientRow;
      }

      // Fetch discovery
      const { data: discoveryRow } = await supabase
        .from('client_discoveries')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (discoveryRow) {
        discovery = discoveryRow;
      }
    }

    // Build the prompt with all available context
    const contextParts: string[] = [];
    
    if (client.name) contextParts.push(`Client Name: ${client.name}`);
    if (client.industry) contextParts.push(`Industry: ${client.industry}`);
    if (client.website) contextParts.push(`Website: ${client.website}`);
    if (discovery.business_description) contextParts.push(`Business Description: ${discovery.business_description}`);
    if (discovery.target_audience) contextParts.push(`Target Audience: ${discovery.target_audience}`);
    if (discovery.unique_value_proposition) contextParts.push(`Unique Value Proposition: ${discovery.unique_value_proposition}`);
    if (discovery.current_marketing_channels?.length) contextParts.push(`Current Marketing Channels: ${discovery.current_marketing_channels.join(', ')}`);
    if (discovery.current_monthly_budget) contextParts.push(`Monthly Budget: ${discovery.current_monthly_budget}`);
    if (discovery.current_pain_points?.length) contextParts.push(`Pain Points: ${discovery.current_pain_points.join(', ')}`);
    if (discovery.competitors?.length) contextParts.push(`Competitors: ${discovery.competitors.join(', ')}`);
    if (discovery.competitor_analysis) contextParts.push(`Competitor Analysis: ${discovery.competitor_analysis}`);
    if (discovery.primary_goals?.length) contextParts.push(`Primary Goals: ${discovery.primary_goals.join(', ')}`);
    if (discovery.success_metrics?.length) contextParts.push(`Success Metrics: ${discovery.success_metrics.join(', ')}`);
    if (discovery.timeline) contextParts.push(`Timeline: ${discovery.timeline}`);
    if (discovery.existing_tools?.length) contextParts.push(`Existing Tools: ${discovery.existing_tools.join(', ')}`);

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: STRATEGY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Based on this client discovery, create a comprehensive marketing strategy:

${contextParts.join('\n')}

Generate a detailed strategy in this exact JSON format:
{
  "executiveSummary": "2-3 sentence overview of the strategy",
  "goals": [
    { "goal": "Specific goal description", "metric": "How to measure", "target": "Target number/percentage", "timeline": "When to achieve" }
  ],
  "targetPersona": {
    "title": "Primary decision maker title",
    "industry": "Their industry",
    "painPoints": ["Pain point 1", "Pain point 2"],
    "motivations": ["What drives them"],
    "objections": ["Common objections they'll have"]
  },
  "channelStrategy": [
    {
      "channel": "email/linkedin/content/ads",
      "priority": "high/medium/low",
      "tactics": ["Specific tactic 1", "Specific tactic 2"],
      "frequency": "How often",
      "budget": "Suggested budget allocation"
    }
  ],
  "contentCalendar": [
    { "week": 1, "content": "Content description", "channel": "Where to post", "goal": "What it achieves" }
  ],
  "templates": [
    {
      "name": "Template name",
      "type": "email/linkedin/post",
      "subject": "Email subject if applicable",
      "content": "Full template content with {{variables}}"
    }
  ],
  "kpis": [
    { "metric": "KPI name", "current": "Current value if known", "target": "Target value", "importance": "Why this matters" }
  ],
  "timeline": {
    "phase1": { "name": "Phase name", "duration": "X weeks", "focus": "What to focus on", "milestones": ["Milestone 1"] },
    "phase2": { "name": "Phase name", "duration": "X weeks", "focus": "What to focus on", "milestones": ["Milestone 1"] },
    "phase3": { "name": "Phase name", "duration": "X weeks", "focus": "What to focus on", "milestones": ["Milestone 1"] }
  },
  "risks": [
    { "risk": "Potential risk", "mitigation": "How to mitigate" }
  ],
  "nextSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"]
}

Be specific to this client's industry, goals, and constraints. Make all templates and tactics directly actionable.`
        }
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const strategy = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    // Save strategy to database if we have Supabase
    if (supabaseUrl && supabaseKey && clientId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('client_strategies').insert({
        client_id: clientId,
        name: `${client.name || 'Client'} Marketing Strategy`,
        status: 'draft',
        duration_days: 90,
        executive_summary: strategy.executiveSummary,
        target_persona: strategy.targetPersona,
        channel_strategy: strategy.channelStrategy,
        content_calendar: strategy.contentCalendar,
        sample_templates: strategy.templates,
        kpi_targets: strategy.kpis,
      });

      // Update client stage to execution
      await supabase
        .from('clients')
        .update({ stage: 'execution' })
        .eq('id', clientId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        strategy,
        clientName: client.name,
      }),
    };

  } catch (error) {
    console.error('Strategy generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Strategy generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};

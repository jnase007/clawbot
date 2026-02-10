import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent } from '@netlify/functions';

const REFINE_SYSTEM_PROMPT = `You are a helpful marketing strategy assistant at Brandastic, a leading AI-powered digital marketing agency.

Your job is to help refine and improve marketing strategies based on user feedback.

When the user asks for changes:
1. Understand what specific aspect they want to change
2. Make targeted updates to the relevant parts of the strategy
3. Keep the rest of the strategy intact
4. Provide a brief, friendly explanation of what you changed

Always return the COMPLETE updated strategy in the same JSON format, plus a "message" field explaining what you changed.`;

interface Strategy {
  executiveSummary: string;
  goals: Array<{ goal: string; metric: string; target: string; timeline: string }>;
  targetPersona: {
    title: string;
    industry: string;
    painPoints: string[];
    motivations: string[];
    objections: string[];
  };
  channelStrategy: Array<{
    channel: string;
    priority: string;
    tactics: string[];
    frequency: string;
    budget: string;
  }>;
  contentCalendar: Array<{ week: number; content: string; channel: string; goal: string }>;
  templates: Array<{
    name: string;
    type: string;
    subject?: string;
    content: string;
  }>;
  kpis: Array<{ metric: string; current?: string; target: string; importance: string }>;
  timeline: {
    phase1: { name: string; duration: string; focus: string; milestones: string[] };
    phase2: { name: string; duration: string; focus: string; milestones: string[] };
    phase3: { name: string; duration: string; focus: string; milestones: string[] };
  };
  risks: Array<{ risk: string; mitigation: string }>;
  nextSteps: string[];
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
    const { clientId, strategyId, currentStrategy, userFeedback, clientName } = body;

    if (!currentStrategy || !userFeedback) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing currentStrategy or userFeedback' }),
      };
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: REFINE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is the current marketing strategy for ${clientName || 'the client'}:

${JSON.stringify(currentStrategy, null, 2)}

The user would like the following changes:
"${userFeedback}"

Please update the strategy based on this feedback. Return the complete updated strategy in this exact JSON format:
{
  "message": "Brief explanation of what you changed",
  "strategy": {
    "executiveSummary": "...",
    "goals": [...],
    "targetPersona": {...},
    "channelStrategy": [...],
    "contentCalendar": [...],
    "templates": [...],
    "kpis": [...],
    "timeline": {...},
    "risks": [...],
    "nextSteps": [...]
  }
}

Make sure to preserve all existing fields and only modify what's needed based on the user's feedback.`
        }
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    const updatedStrategy: Strategy = result.strategy || currentStrategy;
    const message = result.message || "I've updated the strategy based on your feedback.";

    // Update strategy in database if we have Supabase
    if (supabaseUrl && supabaseKey && strategyId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('client_strategies')
        .update({
          executive_summary: updatedStrategy.executiveSummary,
          target_persona: updatedStrategy.targetPersona,
          channel_strategy: updatedStrategy.channelStrategy,
          content_calendar: updatedStrategy.contentCalendar,
          sample_templates: updatedStrategy.templates,
          kpi_targets: updatedStrategy.kpis,
          timeline: updatedStrategy.timeline,
          risks: updatedStrategy.risks,
          next_steps: updatedStrategy.nextSteps,
          updated_at: new Date().toISOString(),
        })
        .eq('id', strategyId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        strategy: updatedStrategy,
        message,
      }),
    };

  } catch (error) {
    console.error('Strategy refinement error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Strategy refinement failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};

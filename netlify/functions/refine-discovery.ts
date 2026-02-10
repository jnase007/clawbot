import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const REFINE_SYSTEM_PROMPT = `You are an expert marketing strategist refining a client discovery document.

Your task is to update the discovery document based on the user's feedback.
- Only change the specific parts the user mentions
- Keep the overall structure intact
- Be responsive to their specific requests
- Maintain professional marketing language

Return the UPDATED discovery as a complete JSON object with these fields:
{
  "businessDescription": "...",
  "targetAudience": "...",
  "uniqueValueProposition": "...",
  "currentMarketingChannels": ["..."],
  "currentMonthlyBudget": "...",
  "currentPainPoints": ["..."],
  "competitors": ["..."],
  "competitorAnalysis": "...",
  "primaryGoals": ["..."],
  "successMetrics": ["..."],
  "timeline": "...",
  "existingTools": ["..."],
  "websiteUrl": "...",
  "socialProfiles": "...",
  "discoveryNotes": "..."
}`;

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
    if (!anthropicKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { currentDiscovery, userFeedback, clientName } = body;

    if (!currentDiscovery || !userFeedback) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing currentDiscovery or userFeedback' }),
      };
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: REFINE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Client: ${clientName || 'Unknown'}

Current Discovery Document:
${JSON.stringify(currentDiscovery, null, 2)}

User's Feedback/Request:
"${userFeedback}"

Please update the discovery document based on this feedback and return the complete updated JSON.`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const updatedDiscovery = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        discovery: updatedDiscovery,
        message: "I've updated the discovery based on your feedback.",
      }),
    };

  } catch (error) {
    console.error('Discovery refinement error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Discovery refinement failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

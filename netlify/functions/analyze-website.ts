import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const WEBSITE_ANALYSIS_PROMPT = `You are an expert marketing strategist conducting a discovery call for a digital marketing agency.

Analyze this website content and extract key business information to populate a discovery document.

Return a JSON object with these fields:
{
  "businessDescription": "2-3 sentence description of what this business does",
  "targetAudience": "Who their ideal customers are based on the website",
  "uniqueValueProposition": "What makes them unique/different from competitors",
  "industry": "Their industry (e.g., Healthcare, Real Estate, SaaS, E-commerce)",
  "currentMarketingChannels": ["list of channels they appear to use based on social links, etc"],
  "suggestedPainPoints": ["3-4 likely pain points based on their business type"],
  "competitors": ["2-3 likely competitors if identifiable"],
  "primaryGoals": ["3-4 suggested marketing goals based on their business"],
  "successMetrics": ["3-4 relevant KPIs for this type of business"],
  "contentTopics": ["5-6 content topics relevant to their industry"],
  "targetJobTitles": ["job titles of decision makers they likely target"],
  "tone": "professional|conversational|friendly|bold|educational (pick one)"
}

Be specific and insightful based on the actual website content provided.`;

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
    const { 
      websiteUrl, 
      clientName,
      clientGoals,
      clientChallenges,
      clientCompetitors,
      clientIndustry,
      clientBudget
    } = body;

    if (!websiteUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Website URL is required' }),
      };
    }

    // Fetch website content
    let websiteContent = '';
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClawBot/1.0; Marketing Analysis)',
        },
      });
      const html = await response.text();
      
      // Extract text content (basic HTML parsing)
      websiteContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000); // Limit content size
    } catch (fetchError) {
      console.error('Failed to fetch website:', fetchError);
      // Continue with just the URL if fetch fails
      websiteContent = `Website URL: ${websiteUrl}\nClient Name: ${clientName || 'Unknown'}`;
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Build enhanced prompt with client-provided data
    let clientContext = '';
    if (clientGoals || clientChallenges || clientCompetitors || clientIndustry || clientBudget) {
      clientContext = '\n\nAdditional Client Information Provided:\n';
      if (clientGoals) clientContext += `Goals: ${clientGoals}\n`;
      if (clientChallenges) clientContext += `Challenges: ${clientChallenges}\n`;
      if (clientCompetitors && Array.isArray(clientCompetitors) && clientCompetitors.length > 0) {
        clientContext += `Competitors: ${clientCompetitors.join(', ')}\n`;
      }
      if (clientIndustry) clientContext += `Industry: ${clientIndustry}\n`;
      if (clientBudget) clientContext += `Monthly Budget: $${clientBudget}\n`;
      clientContext += '\nUse this information to enhance and validate your analysis.';
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: WEBSITE_ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this website for ${clientName || 'the client'}:\n\nURL: ${websiteUrl}\n\nWebsite Content:\n${websiteContent}${clientContext}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis,
        clientName,
        websiteUrl,
      }),
    };

  } catch (error) {
    console.error('Website analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Website analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

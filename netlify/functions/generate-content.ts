import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

// SEO & GEO Best Practices System Prompt
const BLOG_SYSTEM_PROMPT = `You are an expert SEO content writer for Brandastic, a digital marketing agency specializing in AI-powered marketing solutions for healthcare and dental companies.

=== SEO BEST PRACTICES ===
1. TITLE TAG: 50-60 characters, primary keyword near the beginning
2. META DESCRIPTION: 150-160 characters, compelling with CTA
3. HEADING STRUCTURE: H1 (title), multiple H2s, H3s for subsections
4. KEYWORD OPTIMIZATION: Primary keyword in first 100 words, 1-2% density
5. CONTENT STRUCTURE: Short paragraphs, bullet points, tables

=== GEO BEST PRACTICES (for AI citation) ===
1. QUOTABLE STATEMENTS: Clear, factual statements AI can quote
2. STATISTICS & DATA: Specific numbers with sources
3. DEFINITIONS: Clear "X is defined as..." format
4. FAQ SECTION: 5-7 FAQs with complete answers
5. ENTITY MENTIONS: Reference known companies, standards
6. CURRENT: Include 2024-2026 references

=== CONTENT REQUIREMENTS ===
- MINIMUM 2000 words (aim for 2200-2500)
- Include realistic statistics and data points
- End with CTA to contact Brandastic`;

const AD_SYSTEM_PROMPTS = {
  meta: `You are a Meta ads specialist for Brandastic. Create high-converting Facebook and Instagram ad copy.
Ad specs: Primary Text 125 chars optimal, Headline 40 chars max, Description 30 chars max.`,
  google: `You are a Google Ads specialist for Brandastic. Create policy-compliant ad copy.
Responsive Search Ads: 15 headlines (30 chars each), 4 descriptions (90 chars each).`,
  linkedin: `You are a LinkedIn ads specialist for Brandastic. Create professional B2B ad copy.
Sponsored Content: Intro text 150 chars optimal, Headline 70 chars.`,
};

interface RequestBody {
  type: 'blog' | 'meta' | 'google' | 'linkedin';
  topic: string;
  audience?: string;
  tone?: string;
  keywords?: string[];
  clientName?: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: RequestBody = JSON.parse(event.body || '{}');
    const { type, topic, audience = 'dental practice owners', tone = 'professional', keywords = [], clientName = 'Brandastic' } = body;

    if (!topic) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Topic is required' }),
      };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured. Add ANTHROPIC_API_KEY to Netlify environment variables.' }),
      };
    }

    let result;

    if (type === 'blog') {
      result = await generateBlogPost(topic, audience, tone, keywords, clientName);
    } else if (type === 'meta') {
      result = await generateMetaAds(topic, audience);
    } else if (type === 'google') {
      result = await generateGoogleAds(topic, keywords);
    } else if (type === 'linkedin') {
      result = await generateLinkedInAds(topic, audience);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid content type' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide more specific error messages
    let userMessage = 'Generation failed';
    if (errorMessage.includes('API key') || errorMessage.includes('ANTHROPIC')) {
      userMessage = 'API key not configured. Please add ANTHROPIC_API_KEY to Netlify environment variables.';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      userMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = errorMessage;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Generation failed', 
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
    };
  }
};

async function generateBlogPost(topic: string, audience: string, tone: string, keywords: string[], clientName: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 8192,
    system: `${BLOG_SYSTEM_PROMPT}

Target audience: ${audience}
Tone: ${tone}
Client: ${clientName}`,
    messages: [
      {
        role: 'user',
        content: `Write a comprehensive, SEO and GEO optimized blog post about: ${topic}

${keywords.length > 0 ? `Primary keywords: ${keywords.join(', ')}` : ''}

CRITICAL: Write MINIMUM 2000 words. This is essential.

Return JSON:
{
  "title": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Meta description with CTA (150-160 chars)",
  "excerpt": "Blog excerpt (100-150 chars)",
  "content": "Full blog post in markdown. MUST be 2000+ words.",
  "headings": ["H2 heading 1", "H2 heading 2"],
  "keywords": ["primary", "secondary", "long-tail"],
  "estimatedReadTime": 10,
  "wordCount": 2200,
  "seoScore": 92,
  "geoOptimizations": ["optimization 1", "optimization 2"],
  "faqSection": [{"question": "Q?", "answer": "A."}],
  "internalLinkingSuggestions": ["topic 1", "topic 2"],
  "featuredSnippetTarget": "40-60 word answer"
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  
  // Try to extract JSON from the response
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // If no JSON found, try to parse the entire text
    jsonMatch = [text];
  }
  
  let result;
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // If JSON parsing fails, create a fallback structure
    console.error('JSON parse error:', parseError);
    result = {
      title: topic,
      metaDescription: `Learn about ${topic} - Expert insights and strategies.`,
      excerpt: `Discover everything you need to know about ${topic}.`,
      content: text, // Use the raw text as content
      headings: [],
      keywords: keywords.length > 0 ? keywords : [topic],
      estimatedReadTime: Math.ceil(text.split(/\s+/).length / 200),
      wordCount: text.split(/\s+/).length,
      seoScore: 75,
      geoOptimizations: [],
      faqSection: [],
      internalLinkingSuggestions: [],
      featuredSnippetTarget: text.substring(0, 200),
    };
  }
  
  // Calculate actual word count
  if (result.content) {
    result.wordCount = result.content.split(/\s+/).length;
  }
  
  result.type = 'blog';
  return result;
}

async function generateMetaAds(product: string, audience: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: AD_SYSTEM_PROMPTS.meta,
    messages: [
      {
        role: 'user',
        content: `Create 3 Meta ad variations for:
Product/Service: ${product}
Target Audience: ${audience}

Return JSON:
{
  "type": "meta",
  "headline": "Main headline",
  "description": "Description for the ads",
  "ads": [
    {
      "platform": "facebook",
      "headline": "Compelling headline (40 chars)",
      "primaryText": "Main ad copy with hook, value prop, urgency (125 chars)",
      "description": "Link description (30 chars)",
      "callToAction": "Learn More"
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  result.type = 'meta';
  result.content = result.ads?.map((ad: any) => 
    `[${ad.platform?.toUpperCase()}]\n${ad.headline}\n\n${ad.primaryText}\n\n${ad.description || ''}\n\nCTA: ${ad.callToAction}`
  ).join('\n\n---\n\n') || '';
  return result;
}

async function generateGoogleAds(product: string, keywords: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: AD_SYSTEM_PROMPTS.google,
    messages: [
      {
        role: 'user',
        content: `Create Google Search ads for:
Product/Service: ${product}
Target Keywords: ${keywords.join(', ') || product}

Return JSON:
{
  "type": "google",
  "headline": "Main campaign headline",
  "description": "Campaign description",
  "searchAds": [
    {
      "headlines": ["Headline 1 (30 chars)", "Headline 2", "Headline 3"],
      "descriptions": ["Description 1 (90 chars)", "Description 2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  result.type = 'google';
  result.content = result.searchAds?.map((ad: any, i: number) => 
    `[AD ${i + 1}]\nHeadlines:\n${ad.headlines?.map((h: string) => `• ${h}`).join('\n') || ''}\n\nDescriptions:\n${ad.descriptions?.map((d: string) => `• ${d}`).join('\n') || ''}`
  ).join('\n\n---\n\n') || '';
  return result;
}

async function generateLinkedInAds(product: string, audience: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: AD_SYSTEM_PROMPTS.linkedin,
    messages: [
      {
        role: 'user',
        content: `Create 3 LinkedIn ad variations for:
Product/Service: ${product}
Target Audience: ${audience}

Return JSON:
{
  "type": "linkedin",
  "headline": "Main headline",
  "description": "Description",
  "ads": [
    {
      "headline": "Professional headline (70 chars)",
      "introText": "Intro text with value proposition (150 chars)",
      "callToAction": "Learn More"
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  result.type = 'linkedin';
  result.content = result.ads?.map((ad: any) => 
    `${ad.headline}\n\n${ad.introText}\n\nCTA: ${ad.callToAction}`
  ).join('\n\n---\n\n') || '';
  return result;
}

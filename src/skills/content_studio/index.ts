import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/index.js';
import { logAction } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';

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

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  let sanitized = input.trim().substring(0, 3000);
  const injectionPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /disregard\s+(previous|all|above)\s+instructions?/gi,
  ];
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  return sanitized;
}

// ============ BLOG CONTENT ============

interface BlogPost {
  title: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  headings: string[];
  keywords: string[];
  estimatedReadTime: number;
}

/**
 * Generate a full blog post for Brandastic
 */
export async function generateBlogPost(options: {
  topic: string;
  targetAudience?: string;
  keywords?: string[];
  wordCount?: number;
  tone?: 'professional' | 'conversational' | 'educational' | 'persuasive';
  includeCallToAction?: boolean;
}): Promise<BlogPost> {
  const {
    topic,
    targetAudience = 'healthcare and dental marketing professionals',
    keywords = [],
    wordCount = 1200,
    tone = 'professional',
    includeCallToAction = true,
  } = options;

  const safeTopic = sanitizeInput(topic);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    system: `You are an expert content writer for Brandastic, a digital marketing agency specializing in AI-powered marketing solutions for healthcare and dental companies.

Write SEO-optimized, valuable blog content that:
- Provides actionable insights
- Establishes thought leadership
- Naturally incorporates keywords
- Uses proper heading structure (H2, H3)
- Includes relevant examples and data
- Has a compelling introduction and conclusion
${includeCallToAction ? '- Ends with a CTA to contact Brandastic for AI marketing solutions' : ''}

Target audience: ${safeAudience}
Tone: ${tone}
Target word count: ${wordCount}`,
    messages: [
      {
        role: 'user',
        content: `Write a comprehensive blog post about: ${safeTopic}

${keywords.length > 0 ? `Target keywords to naturally include: ${keywords.join(', ')}` : ''}

Return JSON:
{
  "title": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "excerpt": "Blog excerpt for previews (100-150 chars)",
  "content": "Full blog post in markdown format with ## and ### headings",
  "headings": ["H2 heading 1", "H2 heading 2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "estimatedReadTime": 5
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  await logAction(
    'email' as Platform,
    'generate_blog_post',
    true,
    undefined,
    undefined,
    { topic, wordCount: result.content?.length }
  );

  return result;
}

/**
 * Generate blog post ideas for content calendar
 */
export async function generateBlogIdeas(options: {
  industry: string;
  count?: number;
  focusAreas?: string[];
}): Promise<Array<{
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  searchVolume: 'low' | 'medium' | 'high';
}>> {
  const { industry, count = 10, focusAreas = [] } = options;

  const safeIndustry = sanitizeInput(industry);

  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `You are an SEO content strategist for Brandastic. Generate blog post ideas that would rank well and attract the target audience.`,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} blog post ideas for the ${safeIndustry} industry.
${focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(', ')}` : ''}

Return JSON:
{
  "ideas": [
    {
      "title": "Blog post title",
      "description": "Brief description of the post",
      "keywords": ["target", "keywords"],
      "difficulty": "easy|medium|hard",
      "searchVolume": "low|medium|high"
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

  return result.ideas || [];
}

// ============ AD CONTENT ============

interface AdCreative {
  platform: string;
  headline: string;
  primaryText: string;
  description?: string;
  callToAction: string;
  targetAudience: string;
}

interface AdCampaign {
  campaignName: string;
  objective: string;
  ads: AdCreative[];
}

/**
 * Generate Meta (Facebook/Instagram) ads
 */
export async function generateMetaAds(options: {
  product: string;
  targetAudience: string;
  objective: 'awareness' | 'traffic' | 'leads' | 'conversions';
  variants?: number;
  includeInstagram?: boolean;
}): Promise<AdCampaign> {
  const {
    product,
    targetAudience,
    objective,
    variants = 3,
    includeInstagram = true,
  } = options;

  const safeProduct = sanitizeInput(product);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `You are a Meta ads specialist for Brandastic. Create high-converting Facebook and Instagram ad copy.

Ad specs:
- Facebook Primary Text: 125 chars (optimal), 500 max
- Facebook Headline: 40 chars max
- Facebook Description: 30 chars max
- Instagram: Focus on visual storytelling, shorter copy

Objective: ${objective}`,
    messages: [
      {
        role: 'user',
        content: `Create ${variants} Meta ad variations for:
Product/Service: ${safeProduct}
Target Audience: ${safeAudience}
${includeInstagram ? 'Include both Facebook and Instagram versions.' : 'Facebook only.'}

Return JSON:
{
  "campaignName": "Campaign name",
  "objective": "${objective}",
  "ads": [
    {
      "platform": "facebook|instagram",
      "headline": "Compelling headline",
      "primaryText": "Main ad copy with hook, value prop, and urgency",
      "description": "Link description (Facebook only)",
      "callToAction": "Learn More|Sign Up|Get Quote|etc",
      "targetAudience": "Specific audience segment"
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

  await logAction(
    'email' as Platform,
    'generate_meta_ads',
    true,
    undefined,
    undefined,
    { product, objective, adCount: result.ads?.length }
  );

  return result;
}

/**
 * Generate Google Ads (Search & Display)
 */
export async function generateGoogleAds(options: {
  product: string;
  targetKeywords: string[];
  adType: 'search' | 'display' | 'both';
  variants?: number;
}): Promise<{
  searchAds: Array<{
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
    keywords: string[];
  }>;
  displayAds: Array<{
    shortHeadline: string;
    longHeadline: string;
    description: string;
    businessName: string;
  }>;
}> {
  const { product, targetKeywords, adType, variants = 3 } = options;

  const safeProduct = sanitizeInput(product);

  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `You are a Google Ads specialist for Brandastic. Create high-quality, policy-compliant ad copy.

Google Ads specs:
- Responsive Search Ads: 15 headlines (30 chars each), 4 descriptions (90 chars each)
- Display Ads: Short headline (25 chars), Long headline (90 chars), Description (90 chars)

Focus on:
- Keyword relevance
- Clear value proposition
- Strong CTAs
- No excessive punctuation or ALL CAPS`,
    messages: [
      {
        role: 'user',
        content: `Create Google Ads for:
Product/Service: ${safeProduct}
Target Keywords: ${targetKeywords.join(', ')}
Ad Types: ${adType}
Variants: ${variants}

Return JSON:
{
  "searchAds": [
    {
      "headlines": ["Headline 1 (30 chars)", "Headline 2", "Headline 3"],
      "descriptions": ["Description 1 (90 chars)", "Description 2"],
      "finalUrl": "https://brandastic.com",
      "keywords": ["target", "keywords"]
    }
  ],
  "displayAds": [
    {
      "shortHeadline": "Short (25 chars)",
      "longHeadline": "Longer headline for display (90 chars)",
      "description": "Description (90 chars)",
      "businessName": "Brandastic"
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

  await logAction(
    'email' as Platform,
    'generate_google_ads',
    true,
    undefined,
    undefined,
    { product, adType, keywords: targetKeywords }
  );

  return {
    searchAds: result.searchAds || [],
    displayAds: result.displayAds || [],
  };
}

/**
 * Generate LinkedIn ads
 */
export async function generateLinkedInAds(options: {
  product: string;
  targetAudience: string;
  objective: 'awareness' | 'consideration' | 'conversions';
  variants?: number;
}): Promise<AdCampaign> {
  const { product, targetAudience, objective, variants = 3 } = options;

  const safeProduct = sanitizeInput(product);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `You are a LinkedIn ads specialist for Brandastic. Create professional B2B ad copy.

LinkedIn Ads specs:
- Sponsored Content: Intro text (150 chars optimal), Headline (70 chars)
- Message Ads: Subject (60 chars), Body (500 chars)

Focus on:
- Professional tone
- B2B value propositions
- Industry-specific pain points
- Credibility and authority`,
    messages: [
      {
        role: 'user',
        content: `Create ${variants} LinkedIn ad variations for:
Product/Service: ${safeProduct}
Target Audience: ${safeAudience}
Objective: ${objective}

Return JSON:
{
  "campaignName": "Campaign name",
  "objective": "${objective}",
  "ads": [
    {
      "platform": "linkedin",
      "headline": "Professional headline",
      "primaryText": "Intro text with value proposition",
      "callToAction": "Learn More|Download|Request Demo",
      "targetAudience": "Job titles and industries"
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

  await logAction(
    'email' as Platform,
    'generate_linkedin_ads',
    true,
    undefined,
    undefined,
    { product, objective, adCount: result.ads?.length }
  );

  return result;
}

/**
 * Generate a complete multi-platform ad campaign
 */
export async function generateFullCampaign(options: {
  product: string;
  targetAudience: string;
  budget?: string;
  duration?: string;
  platforms: ('meta' | 'google' | 'linkedin')[];
  keywords?: string[];
}): Promise<{
  strategy: string;
  meta?: AdCampaign;
  google?: { searchAds: any[]; displayAds: any[] };
  linkedin?: AdCampaign;
}> {
  const { product, targetAudience, platforms, keywords = [] } = options;

  const results: any = {
    strategy: `Multi-platform campaign for ${product} targeting ${targetAudience}`,
  };

  if (platforms.includes('meta')) {
    results.meta = await generateMetaAds({
      product,
      targetAudience,
      objective: 'leads',
      variants: 3,
    });
  }

  if (platforms.includes('google')) {
    results.google = await generateGoogleAds({
      product,
      targetKeywords: keywords.length > 0 ? keywords : [product, 'marketing', 'AI'],
      adType: 'both',
      variants: 3,
    });
  }

  if (platforms.includes('linkedin')) {
    results.linkedin = await generateLinkedInAds({
      product,
      targetAudience,
      objective: 'consideration',
      variants: 3,
    });
  }

  return results;
}

// Skill metadata
export const contentStudioMetadata = {
  name: 'content_studio',
  description: 'Generate blog content and multi-platform ads for Brandastic',
  functions: [
    {
      name: 'generateBlogPost',
      description: 'Generate a full SEO-optimized blog post',
      parameters: { topic: 'Blog topic', wordCount: 'Target word count' },
    },
    {
      name: 'generateBlogIdeas',
      description: 'Generate blog post ideas for content calendar',
      parameters: { industry: 'Target industry', count: 'Number of ideas' },
    },
    {
      name: 'generateMetaAds',
      description: 'Generate Facebook/Instagram ads',
      parameters: { product: 'Product/service', objective: 'Campaign objective' },
    },
    {
      name: 'generateGoogleAds',
      description: 'Generate Google Search and Display ads',
      parameters: { product: 'Product/service', keywords: 'Target keywords' },
    },
    {
      name: 'generateLinkedInAds',
      description: 'Generate LinkedIn B2B ads',
      parameters: { product: 'Product/service', targetAudience: 'Job titles/industries' },
    },
    {
      name: 'generateFullCampaign',
      description: 'Generate complete multi-platform campaign',
      parameters: { product: 'Product/service', platforms: 'Which platforms' },
    },
  ],
};

export default {
  generateBlogPost,
  generateBlogIdeas,
  generateMetaAds,
  generateGoogleAds,
  generateLinkedInAds,
  generateFullCampaign,
  contentStudioMetadata,
};

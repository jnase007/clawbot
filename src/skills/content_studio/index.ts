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
  wordCount: number;
  seoScore: number;
  geoOptimizations: string[];
  faqSection: Array<{ question: string; answer: string }>;
  internalLinkingSuggestions: string[];
  featuredSnippetTarget: string;
}

/**
 * SEO & GEO Best Practices System Prompt
 */
const SEO_GEO_SYSTEM_PROMPT = `You are an expert SEO content writer for Brandastic, a digital marketing agency specializing in AI-powered marketing solutions for healthcare and dental companies.

=== SEO BEST PRACTICES (Search Engine Optimization) ===
1. TITLE TAG: 50-60 characters, primary keyword near the beginning
2. META DESCRIPTION: 150-160 characters, compelling with CTA, includes primary keyword
3. HEADING STRUCTURE: 
   - One H1 (title)
   - Multiple H2s for main sections
   - H3s for subsections
   - Include keywords naturally in headings
4. KEYWORD OPTIMIZATION:
   - Primary keyword in first 100 words
   - 1-2% keyword density (natural, not stuffed)
   - Long-tail keyword variations throughout
   - LSI (Latent Semantic Indexing) keywords
5. CONTENT STRUCTURE:
   - Short paragraphs (2-4 sentences)
   - Bullet points and numbered lists
   - Bold/italic for emphasis
   - Table of contents for long posts
6. INTERNAL LINKING: Suggest 3-5 related topic links
7. FEATURED SNIPPET OPTIMIZATION: Include a concise definition/answer for "what is" queries

=== GEO BEST PRACTICES (Generative Engine Optimization) ===
GEO optimizes content so AI systems (ChatGPT, Perplexity, Claude, Google SGE) can cite it:

1. QUOTABLE STATEMENTS: Include clear, factual statements that AI can quote
2. STATISTICS & DATA: Include specific numbers, percentages, and cite sources
3. DEFINITIONS: Provide clear definitions for key terms (e.g., "X is defined as...")
4. FAQ SECTION: Include 5+ FAQs with concise, complete answers
5. ENTITY MENTIONS: Reference known entities (companies, people, standards)
6. STRUCTURED DATA: Use clear formatting AI can parse
7. AUTHORITATIVE TONE: Write as an expert with first-hand experience
8. CITE SOURCES: Reference studies, reports, and industry standards
9. RECENCY: Include current year references and trends
10. COMPLETE ANSWERS: Provide full context, don't assume prior knowledge

=== CONTENT REQUIREMENTS ===
- MINIMUM 2000 words (aim for 2200-2500 for comprehensive coverage)
- Include real statistics and data points (even if illustrative, make them realistic)
- Write in a way that positions Brandastic as a thought leader
- Include actionable takeaways readers can implement
- End with a compelling CTA to contact Brandastic`;

/**
 * Generate a full blog post for Brandastic (2000+ words, SEO & GEO optimized)
 */
export async function generateBlogPost(options: {
  topic: string;
  targetAudience?: string;
  keywords?: string[];
  wordCount?: number;
  tone?: 'professional' | 'conversational' | 'educational' | 'persuasive';
  includeCallToAction?: boolean;
  includeFAQ?: boolean;
}): Promise<BlogPost> {
  const {
    topic,
    targetAudience = 'healthcare and dental marketing professionals',
    keywords = [],
    wordCount = 2200, // Default to 2200 words (minimum 2000)
    tone = 'professional',
    includeCallToAction = true,
    includeFAQ = true,
  } = options;

  // Enforce minimum 2000 words
  const targetWordCount = Math.max(wordCount, 2000);

  const safeTopic = sanitizeInput(topic);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getAnthropic();

  // Use Claude 3.5 Sonnet for longer, higher-quality content
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192, // Increased for longer content
    system: `${SEO_GEO_SYSTEM_PROMPT}

Target audience: ${safeAudience}
Tone: ${tone}
Minimum word count: ${targetWordCount} words
${includeCallToAction ? 'Include a CTA to contact Brandastic for AI marketing solutions at the end.' : ''}`,
    messages: [
      {
        role: 'user',
        content: `Write a comprehensive, SEO and GEO optimized blog post about: ${safeTopic}

${keywords.length > 0 ? `Primary keywords to naturally include: ${keywords.join(', ')}` : ''}

REQUIREMENTS:
1. MINIMUM ${targetWordCount} words (this is critical - count carefully)
2. Follow all SEO best practices outlined
3. Follow all GEO best practices for AI citability
4. Include ${includeFAQ ? '5-7 FAQs with complete answers' : 'no FAQ section'}
5. Include realistic statistics and data points
6. Reference current trends (2024-2026)
7. Make it genuinely valuable and actionable

Return JSON:
{
  "title": "SEO-optimized title with primary keyword (50-60 chars)",
  "metaDescription": "Compelling meta description with keyword and CTA (150-160 chars)",
  "excerpt": "Blog excerpt for previews (100-150 chars)",
  "content": "Full blog post in markdown format. MUST be ${targetWordCount}+ words. Use ## for H2, ### for H3. Include statistics, examples, and actionable advice.",
  "headings": ["H2 heading 1", "H2 heading 2", ...],
  "keywords": ["primary keyword", "secondary keyword", "long-tail keyword", ...],
  "estimatedReadTime": 10,
  "wordCount": <actual word count>,
  "seoScore": <estimated SEO score 1-100>,
  "geoOptimizations": ["Quotable statistic about X", "Clear definition of Y", "FAQ answers for AI citation", ...],
  "faqSection": [
    {"question": "What is X?", "answer": "Complete answer that AI can cite..."},
    ...
  ],
  "internalLinkingSuggestions": ["Related topic 1", "Related topic 2", ...],
  "featuredSnippetTarget": "Concise 40-60 word answer to the main query for featured snippet"
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  // Calculate actual word count
  const actualWordCount = result.content ? result.content.split(/\s+/).length : 0;
  result.wordCount = actualWordCount;

  await logAction(
    'email' as Platform,
    'generate_blog_post',
    true,
    undefined,
    undefined,
    { 
      topic, 
      targetWordCount,
      actualWordCount,
      seoScore: result.seoScore,
      geoOptimizations: result.geoOptimizations?.length || 0
    }
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

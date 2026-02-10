import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/index.js';
import { logAction } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';

let gemini: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!gemini) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env file.');
    }
    gemini = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return gemini;
}

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input.trim().substring(0, 2000);
  
  const injectionPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /disregard\s+(previous|all|above)\s+instructions?/gi,
    /forget\s+(previous|all|above)\s+instructions?/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  
  return sanitized;
}

interface GeneratedContent {
  content: string;
  subject?: string;
  hashtags?: string[];
  tone: string;
  platform: string;
}

/**
 * Generate marketing content using Google Gemini
 */
export async function generateContent(options: {
  platform: 'email' | 'linkedin' | 'reddit' | 'twitter';
  type: 'post' | 'message' | 'email' | 'thread';
  topic: string;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
  targetAudience?: string;
  includeEmoji?: boolean;
  maxLength?: number;
}): Promise<GeneratedContent> {
  const {
    platform,
    type,
    topic,
    tone = 'professional',
    targetAudience = 'healthcare marketing professionals',
    includeEmoji = true,
    maxLength = platform === 'twitter' ? 270 : 1000,
  } = options;

  const safeTopic = sanitizeInput(topic);
  const safeTargetAudience = sanitizeInput(targetAudience);

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert marketing copywriter for Brandastic, a digital marketing agency specializing in AI-powered marketing solutions for healthcare and dental companies.

Write compelling, authentic content that provides value first and promotes naturally.
Never be spammy or salesy. Focus on helping the reader.

Rules:
- Platform: ${platform}
- Content type: ${type}
- Tone: ${tone}
- Target audience: ${safeTargetAudience}
- Max length: ${maxLength} characters
- Include emojis: ${includeEmoji}
- Always include a soft CTA to learn more about AI marketing
- For Twitter, keep it punchy
- For LinkedIn, be professional but personable
- For email, be direct and valuable

Create a ${type} about: ${safeTopic}

Return your response as valid JSON with this exact structure:
{
  "content": "the main content",
  "subject": "subject line (for email only)",
  "hashtags": ["relevant", "hashtags"],
  "tone": "${tone}"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    await logAction(
      platform as Platform,
      'gemini_generate_content',
      true,
      undefined,
      undefined,
      { topic, type, tone, contentLength: parsed.content?.length }
    );

    return {
      content: parsed.content || '',
      subject: parsed.subject,
      hashtags: parsed.hashtags || [],
      tone,
      platform,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(platform as Platform, 'gemini_generate_content', false, undefined, undefined, { topic }, undefined, errorMsg);
    throw error;
  }
}

/**
 * Generate ad copy variations for A/B testing
 */
export async function generateAdCopy(options: {
  product: string;
  targetAudience: string;
  adType: 'facebook' | 'google' | 'linkedin' | 'display';
  variants?: number;
}): Promise<Array<{ headline: string; description: string; cta: string }>> {
  const { product, targetAudience, adType, variants = 3 } = options;

  const safeProduct = sanitizeInput(product);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Create ${variants} ad copy variations for:
- Product/Service: ${safeProduct}
- Target Audience: ${safeAudience}
- Ad Platform: ${adType}

For each variant, provide a different angle/hook. Make them genuinely different.

Ad specs by platform:
- Facebook: Headline 40 chars, Description 125 chars
- Google: Headline 30 chars, Description 90 chars
- LinkedIn: Headline 70 chars, Description 150 chars
- Display: Headline 25 chars, Description 90 chars

Return JSON:
{
  "variants": [
    { "headline": "...", "description": "...", "cta": "Learn More" },
    ...
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  await logAction(
    'email' as Platform,
    'gemini_generate_ad_copy',
    true,
    undefined,
    undefined,
    { product, adType, variants: parsed.variants?.length }
  );

  return parsed.variants || [];
}

/**
 * Generate image prompts for ad creatives
 */
export async function generateImagePrompts(options: {
  product: string;
  style: 'professional' | 'modern' | 'friendly' | 'luxury';
  industry: string;
  count?: number;
}): Promise<string[]> {
  const { product, style, industry, count = 3 } = options;

  const safeProduct = sanitizeInput(product);
  const safeIndustry = sanitizeInput(industry);

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Generate ${count} detailed image prompts for ad creatives:
- Product/Service: ${safeProduct}
- Industry: ${safeIndustry}
- Visual Style: ${style}

Create prompts that would work well for:
- Social media ads
- Display banners
- Marketing materials

Each prompt should be detailed enough for AI image generation (DALL-E, Midjourney, etc.)

Return JSON:
{
  "prompts": ["prompt1", "prompt2", ...]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  return parsed.prompts || [];
}

/**
 * Analyze competitor ad copy
 */
export async function analyzeCompetitorAd(adCopy: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  targetAudience: string;
  emotionalTriggers: string[];
}> {
  const safeAdCopy = sanitizeInput(adCopy);

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze this ad copy as a marketing expert:

"${safeAdCopy}"

Provide insights on:
1. Strengths - what works well
2. Weaknesses - what could improve
3. Suggestions - how to beat this ad
4. Target audience - who is this aimed at
5. Emotional triggers - what emotions does it target

Return JSON:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "targetAudience": "...",
  "emotionalTriggers": ["..."]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

// Skill metadata
export const geminiSkillMetadata = {
  name: 'gemini',
  description: 'Google Gemini AI for content generation and ad copy',
  model: 'gemini-1.5-flash',
  functions: [
    {
      name: 'generateContent',
      description: 'Generate marketing content for any platform',
      parameters: { platform: 'Target platform', topic: 'What to write about' },
    },
    {
      name: 'generateAdCopy',
      description: 'Generate ad copy variations for A/B testing',
      parameters: { product: 'Product/service', adType: 'Ad platform' },
    },
    {
      name: 'generateImagePrompts',
      description: 'Generate image prompts for ad creatives',
      parameters: { product: 'Product/service', style: 'Visual style' },
    },
    {
      name: 'analyzeCompetitorAd',
      description: 'Analyze competitor ad copy',
      parameters: { adCopy: 'The ad to analyze' },
    },
  ],
};

export default {
  generateContent,
  generateAdCopy,
  generateImagePrompts,
  analyzeCompetitorAd,
  geminiSkillMetadata,
};

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

interface GeneratedContent {
  content: string;
  subject?: string;
  hashtags?: string[];
  tone: string;
  platform: string;
}

/**
 * Generate marketing content using Claude AI
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
    targetAudience = 'developers interested in AI',
    includeEmoji = true,
    maxLength = platform === 'twitter' ? 270 : 1000,
  } = options;

  const client = getAnthropic();

  const systemPrompt = `You are an expert marketing copywriter for ProjectHunter.ai, a marketplace where:
- Businesses post bounties for custom AI agents
- Developers build AI agents and earn money ($500-$5K per project)

Write compelling, authentic content that provides value first and promotes naturally.
Never be spammy or salesy. Focus on helping the reader.

Rules:
- Platform: ${platform}
- Content type: ${type}
- Tone: ${tone}
- Target audience: ${targetAudience}
- Max length: ${maxLength} characters
- Include emojis: ${includeEmoji}
- Always include a soft CTA to projecthunter.ai
- For Twitter, keep it punchy and thread-worthy
- For Reddit, be helpful and community-focused (avoid obvious promotion)
- For LinkedIn, be professional but personable
- For email, be direct and valuable`;

  const userPrompt = `Create a ${type} about: ${topic}

Return your response as valid JSON with this exact structure:
{
  "content": "the main content",
  "subject": "subject line (for email only, omit for other platforms)",
  "hashtags": ["relevant", "hashtags"],
  "tone": "detected tone"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '{}';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    await logAction(
      platform as Platform,
      'ai_generate_content',
      true,
      undefined,
      undefined,
      { topic, type, tone, contentLength: result.content?.length }
    );

    return {
      content: result.content || '',
      subject: result.subject,
      hashtags: result.hashtags || [],
      tone,
      platform,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(platform as Platform, 'ai_generate_content', false, undefined, undefined, { topic }, undefined, errorMsg);
    throw error;
  }
}

/**
 * Generate a Twitter thread from a topic
 */
export async function generateThread(
  topic: string,
  tweetCount = 5
): Promise<string[]> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `You are an expert at creating viral Twitter threads for ProjectHunter.ai.
Each tweet should be under 270 characters.
Thread should tell a story or provide valuable insights.
Last tweet should have a soft CTA to projecthunter.ai.
Be engaging, use emojis strategically.`,
    messages: [
      {
        role: 'user',
        content: `Create a ${tweetCount}-tweet thread about: ${topic}

Return your response as valid JSON: { "tweets": ["tweet1", "tweet2", ...] }`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  
  return result.tweets || [];
}

/**
 * Personalize content for a specific contact
 */
export async function personalizeContent(
  template: string,
  contactInfo: {
    name?: string;
    company?: string;
    interests?: string[];
    platform: string;
    previousInteraction?: string;
  }
): Promise<string> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: `You personalize marketing messages for ProjectHunter.ai.
Make the message feel personal and relevant without being creepy.
Keep the same structure but add personal touches.`,
    messages: [
      {
        role: 'user',
        content: `Personalize this message:

Template: ${template}

Contact info:
- Name: ${contactInfo.name || 'Unknown'}
- Company: ${contactInfo.company || 'Unknown'}
- Interests: ${contactInfo.interests?.join(', ') || 'AI, development'}
- Platform: ${contactInfo.platform}
${contactInfo.previousInteraction ? `- Previous: ${contactInfo.previousInteraction}` : ''}

Return just the personalized message, no JSON or extra formatting.`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : template;
}

/**
 * Analyze sentiment of a response
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  shouldFollowUp: boolean;
  suggestedAction: string;
}> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 512,
    system: `Analyze the sentiment of responses to ProjectHunter.ai outreach.
Determine if we should follow up and suggest next action.`,
    messages: [
      {
        role: 'user',
        content: `Analyze: "${text}"

Return your response as valid JSON:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0-1,
  "shouldFollowUp": true/false,
  "suggestedAction": "what to do next"
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

/**
 * Generate A/B test variants
 */
export async function generateABVariants(
  topic: string,
  platform: string,
  variantCount = 3
): Promise<Array<{ variant: string; content: string; angle: string }>> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system: `Create A/B test variants for ProjectHunter.ai marketing.
Each variant should have a different angle/hook while promoting the same thing.
Make them genuinely different, not just word swaps.`,
    messages: [
      {
        role: 'user',
        content: `Create ${variantCount} variants for ${platform} about: ${topic}

Return your response as valid JSON:
{
  "variants": [
    { "variant": "A", "content": "...", "angle": "benefit-focused" },
    { "variant": "B", "content": "...", "angle": "story-focused" },
    ...
  ]
}`,
      },
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '{}';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  
  return result.variants || [];
}

// Skill metadata
export const aiGeneratorSkillMetadata = {
  name: 'ai_generator',
  description: 'Generate marketing content using Claude AI for ProjectHunter.ai',
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
  functions: [
    {
      name: 'generateContent',
      description: 'Generate marketing content for any platform',
      parameters: {
        platform: 'Target platform',
        type: 'Content type',
        topic: 'What to write about',
        tone: 'Tone of voice',
      },
    },
    {
      name: 'generateThread',
      description: 'Generate a Twitter thread',
      parameters: {
        topic: 'Thread topic',
        tweetCount: 'Number of tweets',
      },
    },
    {
      name: 'personalizeContent',
      description: 'Personalize content for a contact',
      parameters: {
        template: 'Base template',
        contactInfo: 'Contact information',
      },
    },
    {
      name: 'analyzeSentiment',
      description: 'Analyze sentiment of a response',
      parameters: {
        text: 'Text to analyze',
      },
    },
  ],
};

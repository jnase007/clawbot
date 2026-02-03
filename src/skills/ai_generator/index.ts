import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { logAction } from '../../db/repository.js';

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

interface GeneratedContent {
  content: string;
  subject?: string;
  hashtags?: string[];
  tone: string;
  platform: string;
}

/**
 * Generate marketing content using AI
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

  const client = getOpenAI();

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

Return JSON with:
{
  "content": "the main content",
  "subject": "subject line (for email only)",
  "hashtags": ["relevant", "hashtags"],
  "tone": "detected tone"
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    await logAction(
      platform,
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
    await logAction(platform, 'ai_generate_content', false, undefined, undefined, { topic }, undefined, errorMsg);
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
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating viral Twitter threads for ProjectHunter.ai.
Each tweet should be under 270 characters.
Thread should tell a story or provide valuable insights.
Last tweet should have a soft CTA to projecthunter.ai.
Be engaging, use emojis strategically.`,
      },
      {
        role: 'user',
        content: `Create a ${tweetCount}-tweet thread about: ${topic}

Return JSON: { "tweets": ["tweet1", "tweet2", ...] }`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.9,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
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
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You personalize marketing messages for ProjectHunter.ai.
Make the message feel personal and relevant without being creepy.
Keep the same structure but add personal touches.`,
      },
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

Return just the personalized message, no JSON.`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || template;
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
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze the sentiment of responses to ProjectHunter.ai outreach.
Determine if we should follow up and suggest next action.`,
      },
      {
        role: 'user',
        content: `Analyze: "${text}"

Return JSON:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0-1,
  "shouldFollowUp": true/false,
  "suggestedAction": "what to do next"
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

/**
 * Generate A/B test variants
 */
export async function generateABVariants(
  topic: string,
  platform: string,
  variantCount = 3
): Promise<Array<{ variant: string; content: string; angle: string }>> {
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Create A/B test variants for ProjectHunter.ai marketing.
Each variant should have a different angle/hook while promoting the same thing.
Make them genuinely different, not just word swaps.`,
      },
      {
        role: 'user',
        content: `Create ${variantCount} variants for ${platform} about: ${topic}

Return JSON:
{
  "variants": [
    { "variant": "A", "content": "...", "angle": "benefit-focused" },
    { "variant": "B", "content": "...", "angle": "story-focused" },
    ...
  ]
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.9,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.variants || [];
}

// Skill metadata
export const aiGeneratorSkillMetadata = {
  name: 'ai_generator',
  description: 'Generate marketing content using AI for ProjectHunter.ai',
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

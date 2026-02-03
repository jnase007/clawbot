import Handlebars from 'handlebars';
import { getSupabaseClient } from '../../db/supabase.js';
import { logAction, getTemplate } from '../../db/repository.js';
import { postUpdate as linkedinPost } from '../linkedin/index.js';
import { submitPost as redditPost } from '../reddit/index.js';
import { postTweet, postThread } from '../twitter/index.js';
import type { Platform, Template } from '../../db/types.js';

const supabase = () => getSupabaseClient();

// Extended platform type for multi-poster
type MultiPlatform = Platform | 'twitter';

interface ABVariant {
  id: string;
  templateId: string;
  name: string;
}

interface PostResult {
  platform: MultiPlatform;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  variant?: string;
}

interface CampaignResult {
  total: number;
  success: number;
  failed: number;
  results: PostResult[];
}

/**
 * Get new bounties from ProjectHunter for content generation
 */
export async function getNewBounties(limit = 5): Promise<Array<{
  id: string;
  title: string;
  description: string;
  reward: number;
  category: string;
}>> {
  // This would connect to your ProjectHunter Supabase
  // For now, returning sample data structure
  try {
    const { data, error } = await supabase()
      .from('bounties')
      .select('id, title, description, reward, category')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('Bounties table not configured, using sample data');
      return [
        {
          id: 'sample-1',
          title: 'Build AI Customer Support Agent',
          description: 'Custom AI agent for e-commerce customer support',
          reward: 2500,
          category: 'AI/ML',
        },
      ];
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Generate personalized post content using template
 */
export function generatePostContent(
  template: Template,
  variables: Record<string, string>
): string {
  const compiled = Handlebars.compile(template.content);
  return compiled({
    projecthunter_url: 'https://projecthunter.ai',
    ...variables,
  });
}

/**
 * Select A/B variant randomly
 */
export function selectABVariant(variants: ABVariant[]): ABVariant {
  const index = Math.floor(Math.random() * variants.length);
  return variants[index];
}

/**
 * Post to multiple channels simultaneously
 */
export async function multiChannelPost(
  content: string,
  channels: MultiPlatform[],
  metadata?: {
    subreddit?: string;
    variant?: string;
    campaignId?: string;
  }
): Promise<CampaignResult> {
  const results: PostResult[] = [];

  for (const channel of channels) {
    console.log(`📢 Posting to ${channel}...`);
    
    try {
      let result: PostResult;

      switch (channel) {
        case 'linkedin': {
          const res = await linkedinPost(content);
          result = {
            platform: 'linkedin',
            success: res.success,
            error: res.error,
            variant: metadata?.variant,
          };
          break;
        }

        case 'reddit': {
          if (!metadata?.subreddit) {
            result = { platform: 'reddit', success: false, error: 'Subreddit required' };
          } else {
            // Extract title from first line or generate one
            const lines = content.split('\n');
            const title = lines[0].replace(/[#*]/g, '').trim() || 'Check out ProjectHunter.ai';
            const body = lines.slice(1).join('\n').trim();
            
            const res = await redditPost(metadata.subreddit, title, body);
            result = {
              platform: 'reddit',
              success: res.success,
              url: res.url,
              error: res.error,
              variant: metadata?.variant,
            };
          }
          break;
        }

        case 'twitter': {
          // Check if content is too long for single tweet
          if (content.length > 280) {
            // Split into thread
            const tweets = splitIntoThread(content);
            const res = await postThread(tweets);
            result = {
              platform: 'twitter',
              success: res.success,
              postId: res.tweetId,
              error: res.error,
              variant: metadata?.variant,
            };
          } else {
            const res = await postTweet(content);
            result = {
              platform: 'twitter',
              success: res.success,
              postId: res.tweetId,
              error: res.error,
              variant: metadata?.variant,
            };
          }
          break;
        }

        default:
          result = { platform: channel, success: false, error: 'Unknown platform' };
      }

      results.push(result);

      // Log to database
      await logAction(
        channel as Platform,
        'multi_channel_post',
        result.success,
        undefined,
        undefined,
        {
          campaignId: metadata?.campaignId,
          variant: metadata?.variant,
          postId: result.postId,
          url: result.url,
        },
        undefined,
        result.error
      );

      // Small delay between platforms
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      results.push({
        platform: channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        variant: metadata?.variant,
      });
    }
  }

  return {
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

/**
 * Split long content into tweet-sized chunks for thread
 */
function splitIntoThread(content: string, maxLength = 270): string[] {
  const tweets: string[] = [];
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  let currentTweet = '';
  for (const para of paragraphs) {
    if ((currentTweet + '\n\n' + para).length <= maxLength) {
      currentTweet = currentTweet ? currentTweet + '\n\n' + para : para;
    } else {
      if (currentTweet) tweets.push(currentTweet);
      
      // If paragraph itself is too long, split by sentences
      if (para.length > maxLength) {
        const sentences = para.split('. ');
        currentTweet = '';
        for (const sentence of sentences) {
          if ((currentTweet + '. ' + sentence).length <= maxLength) {
            currentTweet = currentTweet ? currentTweet + '. ' + sentence : sentence;
          } else {
            if (currentTweet) tweets.push(currentTweet + '.');
            currentTweet = sentence;
          }
        }
      } else {
        currentTweet = para;
      }
    }
  }
  if (currentTweet) tweets.push(currentTweet);

  // Add thread numbering
  return tweets.map((t, i) => `${i + 1}/${tweets.length} ${t}`);
}

/**
 * Generate and post with A/B testing
 */
export async function generateAndPostAB(
  channels: MultiPlatform[],
  variants: ABVariant[],
  variables: Record<string, string>,
  metadata?: { subreddit?: string; campaignId?: string }
): Promise<{ result: CampaignResult; selectedVariant: ABVariant }> {
  // Select variant
  const selectedVariant = selectABVariant(variants);
  
  // Get template
  const template = await getTemplate(selectedVariant.templateId);
  if (!template) {
    throw new Error(`Template ${selectedVariant.templateId} not found`);
  }

  // Generate content
  const content = generatePostContent(template, variables);

  // Post to channels
  const result = await multiChannelPost(content, channels, {
    ...metadata,
    variant: selectedVariant.id,
  });

  // Log A/B result
  await logAction(
    'email' as Platform, // Use any platform for logging
    'ab_test',
    true,
    undefined,
    selectedVariant.templateId,
    {
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      channels,
      successRate: result.success / result.total,
    }
  );

  return { result, selectedVariant };
}

/**
 * Run automated Bounty of the Week campaign
 */
export async function runBountyOfWeekCampaign(
  templateId: string,
  channels: MultiPlatform[] = ['linkedin', 'twitter', 'reddit']
): Promise<CampaignResult> {
  console.log('🎯 Running Bounty of the Week campaign...');

  // Get latest bounties
  const bounties = await getNewBounties(1);
  if (bounties.length === 0) {
    console.log('No bounties to promote');
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  const bounty = bounties[0];
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const content = generatePostContent(template, {
    bounty_title: bounty.title,
    bounty_reward: `$${bounty.reward}`,
    bounty_category: bounty.category,
    bounty_description: bounty.description.substring(0, 200),
  });

  return multiChannelPost(content, channels, {
    subreddit: 'artificial', // Default subreddit
    campaignId: `bounty-of-week-${new Date().toISOString().split('T')[0]}`,
  });
}

// Skill metadata
export const multiPosterSkillMetadata = {
  name: 'multi_poster',
  description: 'Automate ProjectHunter marketing posts across Reddit, LinkedIn, and Twitter/X with A/B testing',
  functions: [
    {
      name: 'multiChannelPost',
      description: 'Post content to multiple channels simultaneously',
      parameters: {
        content: 'Post content',
        channels: 'Array of platforms: linkedin, reddit, twitter',
        subreddit: 'Subreddit name for Reddit posts',
      },
    },
    {
      name: 'generateAndPostAB',
      description: 'Generate content from template variants and post with A/B tracking',
      parameters: {
        channels: 'Target platforms',
        variants: 'Array of template variants for testing',
        variables: 'Template variables',
      },
    },
    {
      name: 'runBountyOfWeekCampaign',
      description: 'Run the automated Bounty of the Week promotion',
      parameters: {
        templateId: 'Template UUID for campaign',
        channels: 'Target platforms (default: all)',
      },
    },
  ],
};

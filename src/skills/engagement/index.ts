import Handlebars from 'handlebars';
import PQueue from 'p-queue';
import { getSupabaseClient } from '../../db/supabase.js';
import { logAction, addContact } from '../../db/repository.js';
import { searchTweets, replyToTweet, likeTweet } from '../twitter/index.js';
import { findRelevantPosts, commentOnPost as redditComment } from '../reddit/index.js';
import type { Platform } from '../../db/types.js';

const supabase = () => getSupabaseClient();

interface Lead {
  platform: Platform | 'twitter';
  handle: string;
  name?: string;
  source: string;
  context: string;
  status: 'new' | 'engaged' | 'nurtured' | 'converted';
}

interface EngagementResult {
  success: boolean;
  platform: string;
  action: string;
  target: string;
  error?: string;
}

// Keywords to search for relevant discussions
const AI_KEYWORDS = [
  'AI agent',
  'custom AI',
  'AI automation',
  'AI developer',
  'build AI',
  'AI gig',
  'AI bounty',
  'LLM developer',
  'GPT developer',
  'AI freelance',
];

const SUBREDDITS_TO_MONITOR = [
  'artificial',
  'MachineLearning',
  'ChatGPT',
  'LocalLLaMA',
  'forhire',
  'freelance',
  'SideProject',
];

/**
 * Generate contextual reply using template
 */
function generateReply(
  template: string,
  context: { postTitle?: string; userName?: string; topic?: string }
): string {
  const compiled = Handlebars.compile(template);
  return compiled({
    name: context.userName || 'there',
    topic: context.topic || 'AI development',
    post_title: context.postTitle || 'your post',
    projecthunter_url: 'projecthunter.ai',
  });
}

/**
 * Search Twitter for relevant discussions
 */
export async function findTwitterOpportunities(
  keywords: string[] = AI_KEYWORDS,
  limit = 20
): Promise<Array<{ id: string; text: string; author: string; relevance: string }>> {
  const results: Array<{ id: string; text: string; author: string; relevance: string }> = [];

  for (const keyword of keywords.slice(0, 3)) { // Limit to avoid rate limits
    try {
      const tweets = await searchTweets(keyword, Math.floor(limit / 3));
      
      for (const tweet of tweets) {
        // Filter out retweets and promotional content
        if (!tweet.text.startsWith('RT') && !tweet.text.includes('#ad')) {
          results.push({
            ...tweet,
            relevance: keyword,
          });
        }
      }
    } catch (error) {
      console.error(`Error searching for "${keyword}":`, error);
    }
  }

  return results;
}

/**
 * Search Reddit for relevant discussions
 */
export async function findRedditOpportunities(
  subreddits: string[] = SUBREDDITS_TO_MONITOR,
  keywords: string[] = AI_KEYWORDS
): Promise<Array<{ id: string; title: string; subreddit: string; url: string }>> {
  return findRelevantPosts(subreddits, keywords, 30);
}

/**
 * Engage with a Twitter post
 */
export async function engageTwitter(
  tweetId: string,
  replyContent: string,
  shouldLike = true
): Promise<EngagementResult> {
  try {
    // Like first
    if (shouldLike) {
      await likeTweet(tweetId);
    }

    // Then reply
    const result = await replyToTweet(tweetId, replyContent);

    await logAction('twitter' as any, 'engage_tweet', result.success, undefined, undefined, {
      tweetId,
      replyId: result.tweetId,
      liked: shouldLike,
    });

    return {
      success: result.success,
      platform: 'twitter',
      action: 'reply',
      target: tweetId,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      platform: 'twitter',
      action: 'reply',
      target: tweetId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Engage with a Reddit post
 */
export async function engageReddit(
  postId: string,
  commentContent: string
): Promise<EngagementResult> {
  try {
    const result = await redditComment(postId, commentContent);

    await logAction('reddit', 'engage_post', result.success, undefined, undefined, {
      postId,
      commentId: result.id,
    });

    return {
      success: result.success,
      platform: 'reddit',
      action: 'comment',
      target: postId,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      platform: 'reddit',
      action: 'comment',
      target: postId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Capture a lead from an engagement
 */
export async function captureLead(lead: Lead): Promise<string> {
  const contact = await addContact(
    lead.platform as Platform,
    lead.handle,
    lead.name,
    undefined,
    ['lead', lead.source, lead.status]
  );

  // Store additional context in notes
  const { error } = await supabase()
    .from('outreach_contacts')
    .update({
      notes: {
        source: lead.source,
        context: lead.context,
        captured_at: new Date().toISOString(),
      },
    })
    .eq('id', contact.id);

  if (error) {
    console.error('Error updating lead notes:', error);
  }

  await logAction(
    lead.platform as Platform,
    'capture_lead',
    true,
    contact.id,
    undefined,
    { source: lead.source }
  );

  return contact.id;
}

/**
 * Add to approval queue for human review
 */
export async function addToApprovalQueue(
  platform: string,
  action: string,
  target: string,
  proposedContent: string,
  context: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase()
    .from('approval_queue')
    .insert({
      platform,
      action,
      target,
      proposed_content: proposedContent,
      context,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    // Table might not exist, log instead
    console.log('Approval queue item:', { platform, action, target, proposedContent });
    return 'logged';
  }

  return data.id;
}

interface EngagementCampaignResult {
  found: number;
  engaged: number;
  queued: number;
  leads: number;
  errors: string[];
}

/**
 * Run engagement discovery and optional auto-engagement
 */
export async function runEngagementCampaign(options: {
  platforms?: ('twitter' | 'reddit')[];
  autoEngage?: boolean;
  replyTemplate?: string;
  maxEngagements?: number;
}): Promise<EngagementCampaignResult> {
  const {
    platforms = ['twitter', 'reddit'],
    autoEngage = false,
    replyTemplate = `Hey {{name}}! Great point about {{topic}}.

If you're into AI development, check out ProjectHunter.ai - you can earn building custom AI agents for businesses. Bounties go up to $5K!`,
    maxEngagements = 10,
  } = options;

  console.log('🔍 Running engagement discovery campaign...');

  const result: EngagementCampaignResult = {
    found: 0,
    engaged: 0,
    queued: 0,
    leads: 0,
    errors: [],
  };

  const queue = new PQueue({
    concurrency: 1,
    interval: 30000, // Very conservative: 1 action per 30 seconds
    intervalCap: 1,
  });

  // Twitter engagement
  if (platforms.includes('twitter')) {
    console.log('📱 Searching Twitter...');
    const twitterOpps = await findTwitterOpportunities();
    result.found += twitterOpps.length;

    for (const opp of twitterOpps.slice(0, Math.floor(maxEngagements / 2))) {
      const reply = generateReply(replyTemplate, {
        userName: opp.author,
        topic: opp.relevance,
      });

      if (autoEngage) {
        await queue.add(async () => {
          const res = await engageTwitter(opp.id, reply);
          if (res.success) {
            result.engaged++;
            // Capture as lead
            await captureLead({
              platform: 'twitter' as any,
              handle: opp.author,
              source: 'twitter_engagement',
              context: opp.text.substring(0, 200),
              status: 'engaged',
            });
            result.leads++;
          } else {
            result.errors.push(`Twitter: ${res.error}`);
          }
        });
      } else {
        await addToApprovalQueue('twitter', 'reply', opp.id, reply, {
          originalText: opp.text,
          author: opp.author,
        });
        result.queued++;
      }
    }
  }

  // Reddit engagement
  if (platforms.includes('reddit')) {
    console.log('🔴 Searching Reddit...');
    const redditOpps = await findRedditOpportunities();
    result.found += redditOpps.length;

    for (const opp of redditOpps.slice(0, Math.floor(maxEngagements / 2))) {
      const reply = generateReply(replyTemplate, {
        postTitle: opp.title,
        topic: 'AI development',
      });

      if (autoEngage) {
        await queue.add(async () => {
          const res = await engageReddit(opp.id, reply);
          if (res.success) {
            result.engaged++;
          } else {
            result.errors.push(`Reddit: ${res.error}`);
          }
        });
      } else {
        await addToApprovalQueue('reddit', 'comment', opp.id, reply, {
          title: opp.title,
          subreddit: opp.subreddit,
          url: opp.url,
        });
        result.queued++;
      }
    }
  }

  await queue.onIdle();

  console.log(`\n📊 Campaign Results:`);
  console.log(`   Found: ${result.found}`);
  console.log(`   Engaged: ${result.engaged}`);
  console.log(`   Queued for approval: ${result.queued}`);
  console.log(`   Leads captured: ${result.leads}`);

  return result;
}

// Skill metadata
export const engagementSkillMetadata = {
  name: 'engagement_nurture',
  description: 'Engage in discussions and nurture leads for ProjectHunter.ai',
  functions: [
    {
      name: 'findTwitterOpportunities',
      description: 'Search Twitter for relevant AI discussions',
      parameters: { keywords: 'Search keywords', limit: 'Max results' },
    },
    {
      name: 'findRedditOpportunities',
      description: 'Search Reddit for relevant posts',
      parameters: { subreddits: 'Subreddits to search', keywords: 'Keywords' },
    },
    {
      name: 'runEngagementCampaign',
      description: 'Run full engagement discovery campaign',
      parameters: {
        platforms: 'Platforms to search',
        autoEngage: 'Auto-engage or queue for approval',
        maxEngagements: 'Max engagements per run',
      },
    },
    {
      name: 'captureLead',
      description: 'Capture a lead from engagement',
      parameters: { lead: 'Lead data object' },
    },
  ],
};

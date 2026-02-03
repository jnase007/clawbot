import { TwitterApi } from 'twitter-api-v2';
import Handlebars from 'handlebars';
import PQueue from 'p-queue';
import { config } from '../../config/index.js';
import { logAction, getTemplatesByPlatform } from '../../db/repository.js';

let twitterClient: TwitterApi | null = null;

// Add Twitter config to config/index.ts
const twitterConfig = {
  apiKey: process.env.TWITTER_API_KEY || '',
  apiSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
  bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
};

/**
 * Initialize Twitter client
 */
function getTwitterClient(): TwitterApi {
  if (!twitterClient) {
    if (!twitterConfig.apiKey || !twitterConfig.apiSecret) {
      throw new Error('Twitter API credentials not configured');
    }

    twitterClient = new TwitterApi({
      appKey: twitterConfig.apiKey,
      appSecret: twitterConfig.apiSecret,
      accessToken: twitterConfig.accessToken,
      accessSecret: twitterConfig.accessSecret,
    });
  }
  return twitterClient;
}

function compileTemplate(template: string, variables: Record<string, string>): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

interface TwitterResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

/**
 * Post a tweet
 */
export async function postTweet(content: string): Promise<TwitterResult> {
  try {
    const client = getTwitterClient();
    const tweet = await client.v2.tweet(content);

    await logAction('twitter' as any, 'post_tweet', true, undefined, undefined, {
      tweetId: tweet.data.id,
      contentLength: content.length,
    });

    return { success: true, tweetId: tweet.data.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logAction('twitter' as any, 'post_tweet', false, undefined, undefined, undefined, undefined, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Post a thread (multiple tweets)
 */
export async function postThread(tweets: string[]): Promise<TwitterResult> {
  try {
    const client = getTwitterClient();
    let lastTweetId: string | undefined;
    const tweetIds: string[] = [];

    for (const content of tweets) {
      const tweet = await client.v2.tweet(content, {
        reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
      });
      lastTweetId = tweet.data.id;
      tweetIds.push(tweet.data.id);
      
      // Small delay between tweets
      await new Promise(r => setTimeout(r, 2000));
    }

    await logAction('twitter' as any, 'post_thread', true, undefined, undefined, {
      tweetIds,
      threadLength: tweets.length,
    });

    return { success: true, tweetId: tweetIds[0] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logAction('twitter' as any, 'post_thread', false, undefined, undefined, undefined, undefined, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(tweetId: string, content: string): Promise<TwitterResult> {
  try {
    const client = getTwitterClient();
    const tweet = await client.v2.reply(content, tweetId);

    await logAction('twitter' as any, 'reply_tweet', true, undefined, undefined, {
      inReplyTo: tweetId,
      replyId: tweet.data.id,
    });

    return { success: true, tweetId: tweet.data.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Search for relevant tweets
 */
export async function searchTweets(
  query: string,
  limit = 20
): Promise<Array<{ id: string; text: string; author: string }>> {
  try {
    const client = getTwitterClient();
    const results = await client.v2.search(query, {
      max_results: limit,
      'tweet.fields': ['author_id', 'created_at'],
      expansions: ['author_id'],
    });

    return results.tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author_id || 'unknown',
    }));
  } catch (error) {
    console.error('Error searching tweets:', error);
    return [];
  }
}

/**
 * Like a tweet
 */
export async function likeTweet(tweetId: string): Promise<boolean> {
  try {
    const client = getTwitterClient();
    const me = await client.v2.me();
    await client.v2.like(me.data.id, tweetId);
    return true;
  } catch (error) {
    console.error('Error liking tweet:', error);
    return false;
  }
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<boolean> {
  try {
    const client = getTwitterClient();
    const me = await client.v2.me();
    await client.v2.follow(me.data.id, userId);
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

/**
 * Verify Twitter configuration
 */
export async function verifyTwitterConfig(): Promise<boolean> {
  try {
    const client = getTwitterClient();
    const me = await client.v2.me();
    console.log(`✅ Twitter authenticated as @${me.data.username}`);
    return true;
  } catch (error) {
    console.error('❌ Twitter configuration error:', error);
    return false;
  }
}

// Skill metadata
export const twitterSkillMetadata = {
  name: 'twitter_outreach',
  description: 'Post tweets, threads, and engage on X/Twitter for ProjectHunter.ai',
  functions: [
    {
      name: 'postTweet',
      description: 'Post a single tweet',
      parameters: { content: 'Tweet content (max 280 chars)' },
    },
    {
      name: 'postThread',
      description: 'Post a thread of tweets',
      parameters: { tweets: 'Array of tweet contents' },
    },
    {
      name: 'replyToTweet',
      description: 'Reply to a tweet',
      parameters: { tweetId: 'ID of tweet to reply to', content: 'Reply content' },
    },
    {
      name: 'searchTweets',
      description: 'Search for relevant tweets',
      parameters: { query: 'Search query', limit: 'Max results' },
    },
  ],
};

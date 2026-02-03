import Snoowrap from 'snoowrap';
import Handlebars from 'handlebars';
import PQueue from 'p-queue';
import { config } from '../../config/index.js';
import { getTemplate, logAction, updateContactStatus, getPendingContacts } from '../../db/repository.js';
import type { OutreachContact, Template } from '../../db/types.js';

let reddit: Snoowrap | null = null;

// Helper to break snoowrap's circular type reference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePromise<T>(promise: any): Promise<T> {
  return promise as Promise<T>;
}

/**
 * Initialize Reddit client
 */
function getRedditClient(): Snoowrap {
  if (!reddit) {
    if (!config.REDDIT_CLIENT_ID || !config.REDDIT_CLIENT_SECRET || 
        !config.REDDIT_USER || !config.REDDIT_PASS) {
      throw new Error('Reddit credentials not configured');
    }

    reddit = new Snoowrap({
      userAgent: config.REDDIT_USER_AGENT,
      clientId: config.REDDIT_CLIENT_ID,
      clientSecret: config.REDDIT_CLIENT_SECRET,
      username: config.REDDIT_USER,
      password: config.REDDIT_PASS,
    });

    // Configure rate limiting
    reddit.config({
      requestDelay: 1000, // 1 second between requests
      continueAfterRatelimitError: true,
      retryErrorCodes: [502, 503, 504, 522],
      maxRetryAttempts: 3,
    });
  }

  return reddit;
}

/**
 * Compile a template with variables
 */
function compileTemplate(template: string, variables: Record<string, string>): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

interface RedditResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

/**
 * Submit a post to a subreddit
 */
export async function submitPost(
  subreddit: string,
  title: string,
  content: string,
  isLink = false
): Promise<RedditResult> {
  try {
    const client = getRedditClient();
    const sub = client.getSubreddit(subreddit);

    let submission: { name: string; permalink: string };
    if (isLink) {
      submission = await resolvePromise<{ name: string; permalink: string }>(
        sub.submitLink({ subredditName: subreddit, title, url: content })
      );
    } else {
      submission = await resolvePromise<{ name: string; permalink: string }>(
        sub.submitSelfpost({ subredditName: subreddit, title, text: content })
      );
    }

    const id = submission.name;
    const url = `https://reddit.com${submission.permalink}`;

    await logAction('reddit', 'submit_post', true, undefined, undefined, {
      subreddit,
      title,
      postId: id,
    });

    return { success: true, id, url };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    await logAction('reddit', 'submit_post', false, undefined, undefined, {
      subreddit,
      title,
    }, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Comment on a post
 */
export async function commentOnPost(
  postId: string,
  comment: string
): Promise<RedditResult> {
  try {
    const client = getRedditClient();
    
    // Get the submission and comment
    const submission = client.getSubmission(postId);
    const reply = await resolvePromise<{ name: string }>(submission.reply(comment));

    const id = reply.name;

    await logAction('reddit', 'comment', true, undefined, undefined, {
      postId,
      commentId: id,
    });

    return { success: true, id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    await logAction('reddit', 'comment', false, undefined, undefined, {
      postId,
    }, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Send a private message to a user
 */
export async function sendMessage(
  username: string,
  subject: string,
  body: string
): Promise<RedditResult> {
  try {
    const client = getRedditClient();
    
    await client.composeMessage({
      to: username,
      subject,
      text: body,
    });

    await logAction('reddit', 'send_message', true, undefined, undefined, {
      to: username,
      subject,
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common errors
    if (errorMsg.includes('USER_DOESNT_EXIST')) {
      return { success: false, error: 'User does not exist' };
    }
    if (errorMsg.includes('NOT_WHITELISTED_BY_USER')) {
      return { success: false, error: 'User has blocked messages' };
    }

    await logAction('reddit', 'send_message', false, undefined, undefined, {
      to: username,
    }, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Get trending posts from a subreddit
 */
export async function getTrendingPosts(
  subreddit: string,
  limit = 10
): Promise<Array<{ id: string; title: string; author: string; url: string }>> {
  try {
    const client = getRedditClient();
    const posts = await client.getSubreddit(subreddit).getHot({ limit });

    return posts.map((post) => ({
      id: post.name,
      title: post.title,
      author: post.author.name,
      url: `https://reddit.com${post.permalink}`,
    }));
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
}

/**
 * Find relevant posts to comment on
 */
export async function findRelevantPosts(
  subreddits: string[],
  keywords: string[],
  limit = 20
): Promise<Array<{ id: string; title: string; subreddit: string; url: string }>> {
  const client = getRedditClient();
  const results: Array<{ id: string; title: string; subreddit: string; url: string }> = [];

  for (const subreddit of subreddits) {
    try {
      const posts = await client.getSubreddit(subreddit).getNew({ limit });
      
      for (const post of posts) {
        const titleLower = post.title.toLowerCase();
        const textLower = (post.selftext || '').toLowerCase();
        
        const isRelevant = keywords.some(keyword => 
          titleLower.includes(keyword.toLowerCase()) || 
          textLower.includes(keyword.toLowerCase())
        );

        if (isRelevant) {
          results.push({
            id: post.name,
            title: post.title,
            subreddit,
            url: `https://reddit.com${post.permalink}`,
          });
        }
      }
    } catch (error) {
      console.error(`Error searching ${subreddit}:`, error);
    }
  }

  return results;
}

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ target: string; error: string }>;
}

/**
 * Run Reddit outreach campaign - posts to subreddits
 */
export async function runRedditPostCampaign(
  templateId: string,
  subreddits: string[]
): Promise<CampaignResult> {
  console.log('🔴 Starting Reddit post campaign...');
  
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const queue = new PQueue({
    concurrency: 1,
    interval: 60000, // 1 post per minute
    intervalCap: 1,
  });

  const result: CampaignResult = {
    total: subreddits.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const subreddit of subreddits) {
    await queue.add(async () => {
      const variables = { subreddit };
      const title = template.subject 
        ? compileTemplate(template.subject, variables)
        : 'Check out ProjectHunter.ai';
      const content = compileTemplate(template.content, variables);

      console.log(`📝 Posting to r/${subreddit}...`);
      const postResult = await submitPost(subreddit, title, content);

      if (postResult.success) {
        result.sent++;
        console.log(`  ✅ Posted: ${postResult.url}`);
      } else {
        result.failed++;
        result.errors.push({ target: subreddit, error: postResult.error || 'Unknown error' });
        console.log(`  ❌ Failed: ${postResult.error}`);
      }
    });
  }

  await queue.onIdle();
  return result;
}

/**
 * Run Reddit DM outreach to pending contacts
 */
export async function runRedditMessageOutreach(
  templateId: string,
  limit = 20
): Promise<CampaignResult> {
  console.log('🔴 Starting Reddit message outreach...');
  
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const contacts = await getPendingContacts('reddit', limit);
  console.log(`Found ${contacts.length} pending Reddit contacts`);

  const queue = new PQueue({
    concurrency: 1,
    interval: 60000 / config.REDDIT_RATE_LIMIT,
    intervalCap: 1,
  });

  const result: CampaignResult = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const contact of contacts) {
    await queue.add(async () => {
      const username = contact.handle.replace(/^u\//, '').replace(/^\/u\//, '');
      
      const variables: Record<string, string> = {
        name: contact.name || username,
      };

      const subject = template.subject 
        ? compileTemplate(template.subject, variables)
        : 'Quick question about AI development';
      const body = compileTemplate(template.content, variables);

      console.log(`💬 Messaging u/${username}...`);
      const msgResult = await sendMessage(username, subject, body);

      if (msgResult.success) {
        result.sent++;
        await updateContactStatus(contact.id, 'sent');
        console.log(`  ✅ Sent (${result.sent}/${result.total})`);
      } else {
        result.failed++;
        result.errors.push({ target: username, error: msgResult.error || 'Unknown error' });
        console.log(`  ❌ Failed: ${msgResult.error}`);
      }
    });
  }

  await queue.onIdle();
  return result;
}

/**
 * Verify Reddit credentials
 */
export async function verifyRedditConfig(): Promise<boolean> {
  try {
    const client = getRedditClient();
    const me = await resolvePromise<{ name: string }>(client.getMe());
    console.log(`✅ Reddit authenticated as u/${me.name}`);
    return true;
  } catch (error) {
    console.error('❌ Reddit configuration error:', error);
    return false;
  }
}

// Skill metadata
export const redditSkillMetadata = {
  name: 'reddit_outreach',
  description: 'Reddit outreach: post, comment, and message for ProjectHunter.ai marketing',
  functions: [
    {
      name: 'submitPost',
      description: 'Submit a post to a subreddit',
      parameters: {
        subreddit: 'Name of subreddit (without r/)',
        title: 'Post title',
        content: 'Post body content',
      },
    },
    {
      name: 'commentOnPost',
      description: 'Comment on a Reddit post',
      parameters: {
        postId: 'Reddit post ID (e.g., t3_abc123)',
        comment: 'Comment text',
      },
    },
    {
      name: 'sendMessage',
      description: 'Send a private message to a Reddit user',
      parameters: {
        username: 'Reddit username (without u/)',
        subject: 'Message subject',
        body: 'Message body',
      },
    },
    {
      name: 'runRedditPostCampaign',
      description: 'Post to multiple subreddits using a template',
      parameters: {
        templateId: 'UUID of the template to use',
        subreddits: 'Array of subreddit names',
      },
    },
    {
      name: 'runRedditMessageOutreach',
      description: 'Send messages to pending Reddit contacts',
      parameters: {
        templateId: 'UUID of the template to use',
        limit: 'Maximum messages to send (default: 20)',
      },
    },
  ],
};

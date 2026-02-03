import { Octokit } from '@octokit/rest';
import { Client, GatewayIntentBits } from 'discord.js';
import PQueue from 'p-queue';
import { logAction, addContact } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';

// Config
const githubConfig = {
  token: process.env.GITHUB_TOKEN || '',
};

const discordConfig = {
  token: process.env.DISCORD_TOKEN || '',
  serverId: process.env.DISCORD_SERVER_ID || '',
  channelId: process.env.DISCORD_CHANNEL_ID || '',
};

let octokit: Octokit | null = null;
let discordClient: Client | null = null;

/**
 * Initialize GitHub client
 */
function getGitHubClient(): Octokit {
  if (!octokit) {
    if (!githubConfig.token) {
      throw new Error('GitHub token not configured');
    }
    octokit = new Octokit({ auth: githubConfig.token });
  }
  return octokit;
}

/**
 * Initialize Discord client
 */
async function getDiscordClient(): Promise<Client> {
  if (!discordClient) {
    if (!discordConfig.token) {
      throw new Error('Discord token not configured');
    }

    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    await discordClient.login(discordConfig.token);
  }
  return discordClient;
}

interface GitHubResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============ GITHUB FUNCTIONS ============

/**
 * Search for AI-related repositories
 */
export async function searchRepos(
  query = 'AI agent',
  limit = 20
): Promise<Array<{
  name: string;
  fullName: string;
  description: string;
  stars: number;
  url: string;
  owner: string;
}>> {
  try {
    const client = getGitHubClient();
    const results = await client.search.repos({
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: limit,
    });

    return results.data.items.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      stars: repo.stargazers_count || 0,
      url: repo.html_url,
      owner: repo.owner?.login || 'unknown',
    }));
  } catch (error) {
    console.error('Error searching repos:', error);
    return [];
  }
}

/**
 * Search for relevant issues to engage with
 */
export async function searchIssues(
  query = 'AI agent help wanted',
  limit = 20
): Promise<Array<{
  title: string;
  repo: string;
  url: string;
  author: string;
  labels: string[];
}>> {
  try {
    const client = getGitHubClient();
    const results = await client.search.issuesAndPullRequests({
      q: `${query} is:open is:issue`,
      sort: 'created',
      order: 'desc',
      per_page: limit,
    });

    return results.data.items.map((issue) => ({
      title: issue.title,
      repo: issue.repository_url.split('/').slice(-2).join('/'),
      url: issue.html_url,
      author: issue.user?.login || 'unknown',
      labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
    }));
  } catch (error) {
    console.error('Error searching issues:', error);
    return [];
  }
}

/**
 * Star a repository
 */
export async function starRepo(owner: string, repo: string): Promise<GitHubResult> {
  try {
    const client = getGitHubClient();
    await client.activity.starRepoForAuthenticatedUser({ owner, repo });

    await logAction('github' as any, 'star_repo', true, undefined, undefined, {
      repo: `${owner}/${repo}`,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Comment on an issue
 */
export async function commentOnIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  comment: string
): Promise<GitHubResult> {
  try {
    const client = getGitHubClient();
    const result = await client.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: comment,
    });

    await logAction('github' as any, 'comment_issue', true, undefined, undefined, {
      repo: `${owner}/${repo}`,
      issue: issueNumber,
      commentId: result.data.id,
    });

    return { success: true, data: { commentId: result.data.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get contributors from a repo (potential leads)
 */
export async function getRepoContributors(
  owner: string,
  repo: string,
  limit = 20
): Promise<Array<{ login: string; contributions: number; url: string }>> {
  try {
    const client = getGitHubClient();
    const results = await client.repos.listContributors({
      owner,
      repo,
      per_page: limit,
    });

    return results.data.map((c) => ({
      login: c.login || 'unknown',
      contributions: c.contributions || 0,
      url: c.html_url || '',
    }));
  } catch (error) {
    console.error('Error getting contributors:', error);
    return [];
  }
}

// ============ DISCORD FUNCTIONS ============

/**
 * Post a message to Discord channel
 */
export async function postToDiscord(
  message: string,
  channelId?: string
): Promise<GitHubResult> {
  try {
    const client = await getDiscordClient();
    const targetChannel = channelId || discordConfig.channelId;
    
    const channel = await client.channels.fetch(targetChannel);
    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      return { success: false, error: 'Invalid channel' };
    }

    const sent = await (channel as { send: (msg: string) => Promise<{ id: string }> }).send(message);

    await logAction('discord' as any, 'post_message', true, undefined, undefined, {
      channelId: targetChannel,
      messageId: sent.id,
    });

    return { success: true, data: { messageId: sent.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get recent messages from a channel for monitoring
 */
export async function getDiscordMessages(
  channelId?: string,
  limit = 50
): Promise<Array<{ content: string; author: string; timestamp: string }>> {
  try {
    const client = await getDiscordClient();
    const targetChannel = channelId || discordConfig.channelId;
    
    const channel = await client.channels.fetch(targetChannel);
    if (!channel || !channel.isTextBased()) {
      return [];
    }

    const messages = await channel.messages.fetch({ limit });
    return messages.map((m) => ({
      content: m.content,
      author: m.author.username,
      timestamp: m.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Discord messages:', error);
    return [];
  }
}

// ============ CAMPAIGNS ============

interface CommunityResult {
  reposFound: number;
  issuesFound: number;
  starred: number;
  commented: number;
  discordPosts: number;
  leadsCapured: number;
  errors: string[];
}

/**
 * Run GitHub community outreach campaign
 */
export async function runGitHubCampaign(options: {
  searchQuery?: string;
  starRepos?: boolean;
  commentOnIssues?: boolean;
  captureContributors?: boolean;
  dailyLimit?: number;
}): Promise<CommunityResult> {
  const {
    searchQuery = 'AI agent LLM',
    starRepos = true,
    commentOnIssues = false, // Disabled by default - requires careful messaging
    captureContributors = true,
    dailyLimit = 5,
  } = options;

  console.log('🐙 Running GitHub community campaign...');

  const result: CommunityResult = {
    reposFound: 0,
    issuesFound: 0,
    starred: 0,
    commented: 0,
    discordPosts: 0,
    leadsCapured: 0,
    errors: [],
  };

  const queue = new PQueue({
    concurrency: 1,
    interval: 5000, // 1 action per 5 seconds
    intervalCap: 1,
  });

  // Search and star repos
  const repos = await searchRepos(searchQuery, dailyLimit * 2);
  result.reposFound = repos.length;

  if (starRepos) {
    for (const repo of repos.slice(0, dailyLimit)) {
      await queue.add(async () => {
        const [owner, repoName] = repo.fullName.split('/');
        const res = await starRepo(owner, repoName);
        if (res.success) {
          result.starred++;
          console.log(`  ⭐ Starred ${repo.fullName}`);
        }
      });
    }
  }

  // Capture contributors as leads
  if (captureContributors) {
    for (const repo of repos.slice(0, 3)) {
      const [owner, repoName] = repo.fullName.split('/');
      const contributors = await getRepoContributors(owner, repoName, 10);

      for (const contributor of contributors.slice(0, 5)) {
        await addContact(
          'github' as any,
          contributor.login,
          undefined,
          undefined,
          ['github', 'ai-developer', repo.name]
        );
        result.leadsCapured++;
      }
    }
  }

  // Search issues (for monitoring, not auto-commenting)
  const issues = await searchIssues(searchQuery, 20);
  result.issuesFound = issues.length;

  await queue.onIdle();

  console.log(`\n📊 GitHub Campaign Results:`);
  console.log(`   Repos found: ${result.reposFound}`);
  console.log(`   Starred: ${result.starred}`);
  console.log(`   Issues found: ${result.issuesFound}`);
  console.log(`   Leads captured: ${result.leadsCapured}`);

  return result;
}

/**
 * Post ProjectHunter announcement to Discord communities
 */
export async function runDiscordCampaign(
  message: string,
  channelIds?: string[]
): Promise<number> {
  const channels = channelIds || [discordConfig.channelId];
  let posted = 0;

  for (const channelId of channels) {
    const result = await postToDiscord(message, channelId);
    if (result.success) {
      posted++;
      console.log(`  ✅ Posted to Discord channel ${channelId}`);
    }
  }

  return posted;
}

/**
 * Close Discord client
 */
export async function closeDiscord(): Promise<void> {
  if (discordClient) {
    await discordClient.destroy();
    discordClient = null;
  }
}

// Skill metadata
export const githubCommunitySkillMetadata = {
  name: 'github_community',
  description: 'Target devs via GitHub and Discord for ProjectHunter hunter recruitment',
  functions: [
    {
      name: 'searchRepos',
      description: 'Search GitHub for AI-related repositories',
      parameters: { query: 'Search query', limit: 'Max results' },
    },
    {
      name: 'searchIssues',
      description: 'Search GitHub issues for engagement opportunities',
      parameters: { query: 'Search query', limit: 'Max results' },
    },
    {
      name: 'starRepo',
      description: 'Star a GitHub repository',
      parameters: { owner: 'Repo owner', repo: 'Repo name' },
    },
    {
      name: 'runGitHubCampaign',
      description: 'Run full GitHub outreach campaign',
      parameters: {
        searchQuery: 'What to search for',
        starRepos: 'Whether to star repos',
        captureContributors: 'Capture contributors as leads',
        dailyLimit: 'Max actions per day',
      },
    },
    {
      name: 'postToDiscord',
      description: 'Post message to Discord channel',
      parameters: { message: 'Message content', channelId: 'Target channel' },
    },
    {
      name: 'runDiscordCampaign',
      description: 'Post to multiple Discord channels',
      parameters: { message: 'Message content', channelIds: 'Target channels' },
    },
  ],
};

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { 
  emailSkillMetadata,
  sendEmail,
  runEmailOutreach,
  verifyEmailConfig 
} from '../skills/email/index.js';
import { 
  linkedinSkillMetadata,
  postUpdate as linkedinPost,
  sendDirectMessage as linkedinMessage,
  runLinkedInOutreach 
} from '../skills/linkedin/index.js';
import { 
  redditSkillMetadata,
  submitPost as redditPost,
  sendMessage as redditMessage,
  commentOnPost as redditComment,
  runRedditPostCampaign,
  runRedditMessageOutreach,
  verifyRedditConfig 
} from '../skills/reddit/index.js';
import {
  addContact,
  getTemplatesByPlatform,
  getOutreachStats,
  getRecentLogs,
  searchContacts,
} from '../db/repository.js';
import type { Platform } from '../db/types.js';

// Anthropic client for AI-powered decisions
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

// Tool definitions for the AI agent
const tools: Anthropic.Tool[] = [
  {
    name: 'run_email_outreach',
    description: 'Send marketing emails to pending email contacts using a template',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_id: { type: 'string', description: 'UUID of the email template' },
        limit: { type: 'number', description: 'Max contacts to email (default: 50)' },
      },
      required: ['template_id'],
    },
  },
  {
    name: 'run_linkedin_outreach',
    description: 'Send LinkedIn messages to pending contacts using a template',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_id: { type: 'string', description: 'UUID of the LinkedIn template' },
        limit: { type: 'number', description: 'Max contacts to message (default: 20)' },
      },
      required: ['template_id'],
    },
  },
  {
    name: 'post_linkedin_update',
    description: 'Post a status update on LinkedIn',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The post content' },
      },
      required: ['content'],
    },
  },
  {
    name: 'run_reddit_post_campaign',
    description: 'Post to multiple subreddits using a template',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_id: { type: 'string', description: 'UUID of the Reddit template' },
        subreddits: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Subreddit names (without r/)' 
        },
      },
      required: ['template_id', 'subreddits'],
    },
  },
  {
    name: 'run_reddit_message_outreach',
    description: 'Send Reddit DMs to pending contacts using a template',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_id: { type: 'string', description: 'UUID of the Reddit template' },
        limit: { type: 'number', description: 'Max messages to send (default: 20)' },
      },
      required: ['template_id'],
    },
  },
  {
    name: 'add_contact',
    description: 'Add a new contact for outreach',
    input_schema: {
      type: 'object' as const,
      properties: {
        platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
        handle: { type: 'string', description: 'Email, profile URL, or username' },
        name: { type: 'string', description: 'Contact name (optional)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for segmentation' },
      },
      required: ['platform', 'handle'],
    },
  },
  {
    name: 'get_templates',
    description: 'Get available templates for a platform',
    input_schema: {
      type: 'object' as const,
      properties: {
        platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
      },
      required: ['platform'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get outreach statistics',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_recent_logs',
    description: 'Get recent outreach activity logs',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of logs to retrieve (default: 20)' },
        platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
      },
    },
  },
  {
    name: 'verify_config',
    description: 'Verify configuration for a platform (email, reddit)',
    input_schema: {
      type: 'object' as const,
      properties: {
        platform: { type: 'string', enum: ['email', 'reddit'] },
      },
      required: ['platform'],
    },
  },
];

/**
 * Execute a tool call
 */
async function executeTool(
  name: string, 
  args: Record<string, unknown>
): Promise<string> {
  console.log(`\n🔧 Executing: ${name}`);
  console.log(`   Args: ${JSON.stringify(args)}`);

  try {
    switch (name) {
      case 'run_email_outreach': {
        const result = await runEmailOutreach(
          args.template_id as string,
          args.limit as number | undefined
        );
        return JSON.stringify(result);
      }

      case 'run_linkedin_outreach': {
        const result = await runLinkedInOutreach(
          args.template_id as string,
          args.limit as number | undefined
        );
        return JSON.stringify(result);
      }

      case 'post_linkedin_update': {
        const result = await linkedinPost(args.content as string);
        return JSON.stringify(result);
      }

      case 'run_reddit_post_campaign': {
        const result = await runRedditPostCampaign(
          args.template_id as string,
          args.subreddits as string[]
        );
        return JSON.stringify(result);
      }

      case 'run_reddit_message_outreach': {
        const result = await runRedditMessageOutreach(
          args.template_id as string,
          args.limit as number | undefined
        );
        return JSON.stringify(result);
      }

      case 'add_contact': {
        const contact = await addContact(
          args.platform as Platform,
          args.handle as string,
          args.name as string | undefined,
          undefined,
          args.tags as string[] | undefined
        );
        return JSON.stringify({ success: true, contact });
      }

      case 'get_templates': {
        const templates = await getTemplatesByPlatform(args.platform as Platform);
        return JSON.stringify(templates.map(t => ({ 
          id: t.id, 
          name: t.name, 
          type: t.type,
          variables: t.variables 
        })));
      }

      case 'get_stats': {
        const stats = await getOutreachStats();
        return JSON.stringify(stats);
      }

      case 'get_recent_logs': {
        const logs = await getRecentLogs(
          args.limit as number | undefined,
          args.platform as Platform | undefined
        );
        return JSON.stringify(logs.map(l => ({
          action: l.action,
          platform: l.platform,
          success: l.success,
          created_at: l.created_at,
          error: l.error,
        })));
      }

      case 'verify_config': {
        if (args.platform === 'email') {
          const ok = await verifyEmailConfig();
          return JSON.stringify({ platform: 'email', configured: ok });
        } else if (args.platform === 'reddit') {
          const ok = await verifyRedditConfig();
          return JSON.stringify({ platform: 'reddit', configured: ok });
        }
        return JSON.stringify({ error: 'Unknown platform' });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error: ${errorMsg}`);
    return JSON.stringify({ error: errorMsg });
  }
}

/**
 * Run the AI agent with a message
 */
export async function runAgent(message: string): Promise<string> {
  console.log('\n🤖 ClawBot Agent Starting (Claude)...');
  console.log(`📝 Task: ${message}\n`);

  const client = getAnthropic();
  
  const systemPrompt = `You are ClawBot, an AI marketing assistant for ProjectHunter.ai.

ProjectHunter.ai is a marketplace where:
- Businesses post bounties for custom AI agents
- Developers build AI agents and earn money ($500-$5K per project)

Your job is to help run marketing outreach campaigns across email, LinkedIn, and Reddit.

You have access to tools for:
- Running outreach campaigns (email, LinkedIn, Reddit)
- Posting updates on LinkedIn
- Adding contacts to the database
- Getting templates and statistics

When asked to run outreach:
1. First check available templates with get_templates
2. Use the appropriate template ID for the campaign
3. Report results back

Be concise and action-oriented. Execute tasks efficiently.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: message },
  ];

  // Run agent loop
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    // Check if we need to execute tools
    if (response.stop_reason === 'tool_use') {
      // Add assistant message with tool use
      messages.push({ role: 'assistant', content: response.content });

      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add tool results
      messages.push({ role: 'user', content: toolResults });
    } else {
      // No more tool calls, extract final response
      console.log('\n✅ Agent completed');
      
      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : 'Task completed.';
    }
  }

  return 'Max iterations reached.';
}

/**
 * Simple command execution without AI
 */
export async function executeCommand(
  command: string,
  args: Record<string, unknown>
): Promise<unknown> {
  return executeTool(command, args);
}

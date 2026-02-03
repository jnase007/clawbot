import OpenAI from 'openai';
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

// OpenAI client for AI-powered decisions
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

// Tool definitions for the AI agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'run_email_outreach',
      description: 'Send marketing emails to pending email contacts using a template',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'UUID of the email template' },
          limit: { type: 'number', description: 'Max contacts to email (default: 50)' },
        },
        required: ['template_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_linkedin_outreach',
      description: 'Send LinkedIn messages to pending contacts using a template',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'UUID of the LinkedIn template' },
          limit: { type: 'number', description: 'Max contacts to message (default: 20)' },
        },
        required: ['template_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'post_linkedin_update',
      description: 'Post a status update on LinkedIn',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The post content' },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_reddit_post_campaign',
      description: 'Post to multiple subreddits using a template',
      parameters: {
        type: 'object',
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
  },
  {
    type: 'function',
    function: {
      name: 'run_reddit_message_outreach',
      description: 'Send Reddit DMs to pending contacts using a template',
      parameters: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'UUID of the Reddit template' },
          limit: { type: 'number', description: 'Max messages to send (default: 20)' },
        },
        required: ['template_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_contact',
      description: 'Add a new contact for outreach',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
          handle: { type: 'string', description: 'Email, profile URL, or username' },
          name: { type: 'string', description: 'Contact name (optional)' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for segmentation' },
        },
        required: ['platform', 'handle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_templates',
      description: 'Get available templates for a platform',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
        },
        required: ['platform'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Get outreach statistics',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_logs',
      description: 'Get recent outreach activity logs',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of logs to retrieve (default: 20)' },
          platform: { type: 'string', enum: ['email', 'linkedin', 'reddit'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verify_config',
      description: 'Verify configuration for a platform (email, reddit)',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['email', 'reddit'] },
        },
        required: ['platform'],
      },
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
  console.log('\n🤖 ClawBot Agent Starting...');
  console.log(`📝 Task: ${message}\n`);

  const client = getOpenAI();
  
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

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ];

  // Run agent loop
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    // If no tool calls, we're done
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      console.log('\n✅ Agent completed');
      return assistantMessage.content || 'Task completed.';
    }

    // Execute tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
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

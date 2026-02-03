import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../../config/index.js';
import { logAction } from '../../db/repository.js';
import { getSupabaseClient } from '../../db/supabase.js';

const supabase = () => getSupabaseClient();

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

// Agent templates for common use cases
const AGENT_TEMPLATES = {
  'customer-support': {
    name: 'Customer Support Agent',
    description: 'AI agent for handling customer inquiries and support tickets',
    tools: ['search_knowledge_base', 'create_ticket', 'escalate_to_human', 'send_email'],
    systemPrompt: `You are a helpful customer support agent. Be friendly, professional, and solve problems efficiently.`,
  },
  'sales-assistant': {
    name: 'Sales Assistant Agent',
    description: 'AI agent for lead qualification and sales outreach',
    tools: ['search_crm', 'schedule_meeting', 'send_email', 'update_lead_status'],
    systemPrompt: `You are a sales assistant. Qualify leads, answer product questions, and help close deals.`,
  },
  'data-analyst': {
    name: 'Data Analyst Agent',
    description: 'AI agent for analyzing data and generating reports',
    tools: ['query_database', 'generate_chart', 'export_report', 'send_notification'],
    systemPrompt: `You are a data analyst. Analyze data, find insights, and present findings clearly.`,
  },
  'content-creator': {
    name: 'Content Creator Agent',
    description: 'AI agent for generating marketing content',
    tools: ['generate_text', 'create_image', 'schedule_post', 'analyze_engagement'],
    systemPrompt: `You are a content creator. Create engaging, on-brand content for various platforms.`,
  },
  'automation-bot': {
    name: 'Automation Bot',
    description: 'AI agent for automating repetitive tasks',
    tools: ['execute_workflow', 'send_webhook', 'update_database', 'send_notification'],
    systemPrompt: `You are an automation assistant. Execute tasks efficiently and report on completion.`,
  },
};

interface AgentSpec {
  name: string;
  description: string;
  purpose: string;
  capabilities: string[];
  integrations?: string[];
  tone?: string;
  constraints?: string[];
}

interface GeneratedAgent {
  id: string;
  name: string;
  description: string;
  code: string;
  systemPrompt: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    implementation: string;
  }>;
  config: Record<string, unknown>;
  readme: string;
}

/**
 * Generate a complete AI agent from a specification
 */
export async function generateAgent(spec: AgentSpec): Promise<GeneratedAgent> {
  console.log(`🤖 Generating agent: ${spec.name}`);
  
  const client = getOpenAI();

  // Generate system prompt
  const systemPromptResponse = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at designing AI agents. Create a system prompt for an AI agent based on the specification.
The prompt should be clear, specific, and include:
- Role and personality
- Key responsibilities
- Constraints and guidelines
- Output format expectations`,
      },
      {
        role: 'user',
        content: `Create a system prompt for this agent:
Name: ${spec.name}
Description: ${spec.description}
Purpose: ${spec.purpose}
Capabilities: ${spec.capabilities.join(', ')}
Tone: ${spec.tone || 'professional'}
Constraints: ${spec.constraints?.join(', ') || 'none specified'}`,
      },
    ],
    temperature: 0.7,
  });

  const systemPrompt = systemPromptResponse.choices[0].message.content || '';

  // Generate tools
  const toolsResponse = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at designing AI agent tools. Generate tool definitions for an AI agent.
Each tool should have a clear name, description, parameters, and TypeScript implementation.
Return JSON format.`,
      },
      {
        role: 'user',
        content: `Generate tools for this agent:
Name: ${spec.name}
Capabilities needed: ${spec.capabilities.join(', ')}
Integrations: ${spec.integrations?.join(', ') || 'none'}

Return JSON:
{
  "tools": [
    {
      "name": "tool_name",
      "description": "what it does",
      "parameters": { "param1": { "type": "string", "description": "..." } },
      "implementation": "async function toolName(params) { ... }"
    }
  ]
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const toolsData = JSON.parse(toolsResponse.choices[0].message.content || '{"tools":[]}');

  // Generate main agent code
  const codeResponse = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert TypeScript developer. Generate a complete, production-ready AI agent implementation.
Use OpenAI's API for the LLM, include proper error handling, and make it modular.`,
      },
      {
        role: 'user',
        content: `Generate TypeScript code for this agent:
Name: ${spec.name}
Description: ${spec.description}
System Prompt: ${systemPrompt}
Tools: ${JSON.stringify(toolsData.tools.map((t: {name: string; description: string}) => ({ name: t.name, description: t.description })))}

Include:
- Main agent class
- Tool implementations
- Run loop
- Error handling
- Logging`,
      },
    ],
    temperature: 0.5,
  });

  const code = codeResponse.choices[0].message.content || '';

  // Generate README
  const readme = `# ${spec.name}

${spec.description}

## Purpose
${spec.purpose}

## Capabilities
${spec.capabilities.map(c => `- ${c}`).join('\n')}

## Installation

\`\`\`bash
npm install
cp .env.example .env
# Add your API keys
\`\`\`

## Usage

\`\`\`typescript
import { ${spec.name.replace(/\s+/g, '')}Agent } from './agent';

const agent = new ${spec.name.replace(/\s+/g, '')}Agent();
await agent.run("Your task here");
\`\`\`

## Tools

${toolsData.tools.map((t: {name: string; description: string}) => `### ${t.name}\n${t.description}`).join('\n\n')}

## Configuration

Set these environment variables:
- \`OPENAI_API_KEY\` - Your OpenAI API key
${spec.integrations?.map(i => `- \`${i.toUpperCase()}_API_KEY\` - ${i} integration`).join('\n') || ''}

---
Generated by ClawBot for ProjectHunter.ai
`;

  const agentId = `agent_${Date.now()}`;

  // Log the creation
  await logAction(
    'email', // Using email as placeholder platform
    'generate_agent',
    true,
    undefined,
    undefined,
    {
      agentId,
      agentName: spec.name,
      capabilities: spec.capabilities,
    }
  );

  return {
    id: agentId,
    name: spec.name,
    description: spec.description,
    code,
    systemPrompt,
    tools: toolsData.tools,
    config: {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4096,
    },
    readme,
  };
}

/**
 * Generate agent from a bounty description
 */
export async function generateAgentFromBounty(bountyDescription: string): Promise<GeneratedAgent> {
  console.log('🎯 Analyzing bounty requirements...');
  
  const client = getOpenAI();

  // Parse bounty into agent spec
  const specResponse = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at understanding client requirements and translating them into AI agent specifications.
Analyze the bounty description and extract:
- What the agent should do
- What capabilities it needs
- What integrations are required
- Any constraints mentioned`,
      },
      {
        role: 'user',
        content: `Analyze this bounty and create an agent specification:

${bountyDescription}

Return JSON:
{
  "name": "Agent Name",
  "description": "One-line description",
  "purpose": "Detailed purpose",
  "capabilities": ["capability1", "capability2"],
  "integrations": ["integration1"],
  "tone": "professional/casual/technical",
  "constraints": ["constraint1"]
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const spec = JSON.parse(specResponse.choices[0].message.content || '{}') as AgentSpec;
  
  return generateAgent(spec);
}

/**
 * Use a pre-built template
 */
export async function generateFromTemplate(
  templateName: keyof typeof AGENT_TEMPLATES,
  customizations?: Partial<AgentSpec>
): Promise<GeneratedAgent> {
  const template = AGENT_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  const spec: AgentSpec = {
    name: customizations?.name || template.name,
    description: customizations?.description || template.description,
    purpose: customizations?.purpose || template.description,
    capabilities: customizations?.capabilities || template.tools,
    integrations: customizations?.integrations,
    tone: customizations?.tone || 'professional',
    constraints: customizations?.constraints,
  };

  return generateAgent(spec);
}

/**
 * Save generated agent to files
 */
export async function saveAgent(
  agent: GeneratedAgent,
  outputDir: string = './generated_agents'
): Promise<string> {
  const agentDir = join(outputDir, agent.id);
  
  // Create directory
  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
  }

  // Write files
  writeFileSync(join(agentDir, 'agent.ts'), agent.code);
  writeFileSync(join(agentDir, 'README.md'), agent.readme);
  writeFileSync(join(agentDir, 'config.json'), JSON.stringify({
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })),
    config: agent.config,
  }, null, 2));
  writeFileSync(join(agentDir, 'tools.ts'), agent.tools.map(t => t.implementation).join('\n\n'));

  console.log(`✅ Agent saved to ${agentDir}`);
  
  return agentDir;
}

/**
 * List available templates
 */
export function listTemplates(): Array<{ name: string; description: string }> {
  return Object.entries(AGENT_TEMPLATES).map(([key, value]) => ({
    name: key,
    description: value.description,
  }));
}

/**
 * Store agent in Supabase for marketplace
 */
export async function publishToMarketplace(agent: GeneratedAgent, price?: number): Promise<string> {
  const { data, error } = await supabase()
    .from('marketplace_agents')
    .insert({
      name: agent.name,
      description: agent.description,
      code: agent.code,
      system_prompt: agent.systemPrompt,
      tools: agent.tools,
      config: agent.config,
      readme: agent.readme,
      price: price || 0,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    console.log('Marketplace table not found, returning mock ID');
    return agent.id;
  }

  console.log(`🚀 Agent published to marketplace: ${data.id}`);
  return data.id;
}

/**
 * Generate multiple agent variations for A/B testing
 */
export async function generateAgentVariations(
  spec: AgentSpec,
  variationCount = 3
): Promise<GeneratedAgent[]> {
  const variations: GeneratedAgent[] = [];
  
  const tones = ['professional', 'friendly', 'technical'];
  
  for (let i = 0; i < variationCount; i++) {
    const variantSpec = {
      ...spec,
      name: `${spec.name} (Variant ${String.fromCharCode(65 + i)})`,
      tone: tones[i % tones.length],
    };
    
    const agent = await generateAgent(variantSpec);
    variations.push(agent);
  }
  
  return variations;
}

// Skill metadata
export const agentBuilderSkillMetadata = {
  name: 'agent_builder',
  description: 'Generate AI agents from specifications or bounty descriptions',
  functions: [
    {
      name: 'generateAgent',
      description: 'Generate a complete AI agent from a specification',
      parameters: {
        spec: 'Agent specification with name, description, capabilities, etc.',
      },
    },
    {
      name: 'generateAgentFromBounty',
      description: 'Generate an agent from a bounty description',
      parameters: {
        bountyDescription: 'The bounty/requirement description',
      },
    },
    {
      name: 'generateFromTemplate',
      description: 'Generate agent from a pre-built template',
      parameters: {
        templateName: 'Template name (customer-support, sales-assistant, etc.)',
        customizations: 'Optional customizations',
      },
    },
    {
      name: 'listTemplates',
      description: 'List available agent templates',
      parameters: {},
    },
    {
      name: 'publishToMarketplace',
      description: 'Publish generated agent to ProjectHunter.ai marketplace',
      parameters: {
        agent: 'Generated agent object',
        price: 'Optional price',
      },
    },
  ],
};

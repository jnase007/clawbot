# Agent Builder Skill

**ClawBot can build other AI agents!** 🤖

This meta-skill allows ClawBot to generate complete, production-ready AI agents based on:
- Bounty descriptions from ProjectHunter.ai
- Custom specifications
- Pre-built templates

## Features

- **Spec-to-Agent**: Define what you need, get working code
- **Bounty Parsing**: Automatically understand client requirements
- **Template Library**: Quick-start with common agent types
- **Tool Generation**: AI writes the tool implementations
- **Marketplace Publishing**: Deploy directly to ProjectHunter.ai

## Usage

### Generate from Bounty

```typescript
import { generateAgentFromBounty, saveAgent } from './skills/agent_builder';

const bounty = `
  Need an AI agent that can:
  - Monitor our Slack channels for customer questions
  - Search our knowledge base for answers
  - Respond automatically to common questions
  - Escalate complex issues to human support
  - Track response times and satisfaction
`;

const agent = await generateAgentFromBounty(bounty);
await saveAgent(agent, './generated_agents');
```

### Generate from Specification

```typescript
import { generateAgent } from './skills/agent_builder';

const agent = await generateAgent({
  name: 'E-commerce Assistant',
  description: 'AI agent for handling e-commerce customer inquiries',
  purpose: 'Help customers with orders, returns, and product questions',
  capabilities: [
    'Search order history',
    'Process returns',
    'Answer product questions',
    'Check inventory',
    'Apply discount codes',
  ],
  integrations: ['Shopify', 'Zendesk'],
  tone: 'friendly',
  constraints: [
    'Never share customer data',
    'Always verify identity before order changes',
  ],
});
```

### Use Templates

```typescript
import { generateFromTemplate, listTemplates } from './skills/agent_builder';

// See available templates
const templates = listTemplates();
// ['customer-support', 'sales-assistant', 'data-analyst', 'content-creator', 'automation-bot']

// Generate from template
const agent = await generateFromTemplate('customer-support', {
  name: 'Acme Support Bot',
  integrations: ['Zendesk', 'Slack'],
});
```

### Publish to Marketplace

```typescript
import { publishToMarketplace } from './skills/agent_builder';

const marketplaceId = await publishToMarketplace(agent, 500); // $500 price
```

## Available Templates

| Template | Description | Default Tools |
|----------|-------------|---------------|
| `customer-support` | Handle support tickets | search_kb, create_ticket, escalate |
| `sales-assistant` | Qualify leads, outreach | search_crm, schedule_meeting |
| `data-analyst` | Analyze data, reports | query_database, generate_chart |
| `content-creator` | Marketing content | generate_text, schedule_post |
| `automation-bot` | Task automation | execute_workflow, send_webhook |

## Generated Output

Each agent includes:

```
generated_agents/
└── agent_1234567890/
    ├── agent.ts        # Main agent code
    ├── tools.ts        # Tool implementations
    ├── config.json     # Configuration
    └── README.md       # Documentation
```

## Integration with ProjectHunter.ai

The Agent Builder connects directly to your marketplace:

1. **Bounty → Agent**: When a bounty is posted, generate an agent proposal
2. **Review & Customize**: Human reviews and refines
3. **Publish**: Deploy to marketplace for client
4. **Earn**: Get paid when client accepts

## CLI Usage

```bash
# List templates
npm run cli agent templates

# Generate from template
npm run cli agent create --template customer-support --name "My Bot"

# Generate from bounty
npm run cli agent from-bounty "Need an AI that..."

# Publish to marketplace
npm run cli agent publish <agent-id> --price 500
```

## AI Agent Flow

```
┌─────────────────┐
│ Bounty Posted   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ClawBot Parses  │
│ Requirements    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Generate Agent  │
│ Spec + Code     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Human Review    │
│ & Customize     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Publish to      │
│ Marketplace     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Client Accepts  │
│ Developer Earns │
└─────────────────┘
```

## Best Practices

1. **Review Generated Code**: AI-generated code should always be reviewed
2. **Test Thoroughly**: Run the agent in a sandbox before deploying
3. **Customize Prompts**: Tweak the system prompt for your specific use case
4. **Add Error Handling**: Enhance generated code with production error handling
5. **Security**: Never include API keys in generated code

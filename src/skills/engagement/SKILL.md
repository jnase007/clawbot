# Engagement & Lead Nurture Skill

Find relevant discussions across platforms, engage authentically, and capture leads.

## Features

- **Discovery**: Search Twitter/Reddit for AI discussions
- **Engagement**: Reply/comment with value-first messages
- **Lead Capture**: Store interested developers as contacts
- **Approval Queue**: Human review before posting
- **Email Nurture**: Follow-up sequences (coming soon)

## Usage

### Find Opportunities

```typescript
import { findTwitterOpportunities, findRedditOpportunities } from './skills/engagement';

// Find Twitter discussions
const tweets = await findTwitterOpportunities(
  ['AI agent', 'custom AI', 'AI freelance'],
  20
);

// Find Reddit posts
const posts = await findRedditOpportunities(
  ['artificial', 'MachineLearning', 'forhire'],
  ['AI agent', 'AI developer']
);
```

### Run Engagement Campaign

```typescript
import { runEngagementCampaign } from './skills/engagement';

const result = await runEngagementCampaign({
  platforms: ['twitter', 'reddit'],
  autoEngage: false, // Queue for approval
  replyTemplate: `Great point about {{topic}}! 
    
    If you're into AI dev, check out ProjectHunter.ai - 
    you can earn building custom AI agents.`,
  maxEngagements: 10,
});

console.log(`Found: ${result.found}, Queued: ${result.queued}`);
```

### Capture Leads

```typescript
import { captureLead } from './skills/engagement';

await captureLead({
  platform: 'twitter',
  handle: '@developer123',
  name: 'John Doe',
  source: 'twitter_engagement',
  context: 'Replied to AI agent thread',
  status: 'engaged',
});
```

## Approval Queue

When `autoEngage: false`, engagements are added to an approval queue:

1. View in Dashboard → Campaigns → Pending
2. Review proposed content
3. Approve, edit, or reject
4. Approved items are posted automatically

## Keywords Monitored

Default AI-related keywords:
- AI agent, custom AI, AI automation
- AI developer, build AI, AI gig
- AI bounty, LLM developer, GPT developer

Default subreddits:
- r/artificial, r/MachineLearning
- r/ChatGPT, r/LocalLLaMA
- r/forhire, r/freelance

## Rate Limits

Very conservative to avoid spam detection:
- 1 engagement per 30 seconds
- Max 10-20 engagements per campaign
- Use approval queue for quality control

## Best Practices

1. **Add Value**: Never pure promotion - contribute to discussion
2. **Be Authentic**: Personalize based on context
3. **Review First**: Use approval queue initially
4. **Track Results**: Monitor which approaches work
5. **Respect Rules**: Each platform has ToS - follow them

# Multi-Channel Poster Skill

Automates posting to multiple platforms simultaneously with A/B testing support.

## Features

- **Multi-Platform**: Post to LinkedIn, Reddit, Twitter/X in one call
- **A/B Testing**: Track variant performance
- **Bounty Integration**: Auto-generate content from ProjectHunter bounties
- **Smart Threads**: Automatically split long content for Twitter

## Usage

### Post to Multiple Channels

```typescript
import { multiChannelPost } from './skills/multi_poster';

const result = await multiChannelPost(
  `🚀 New opportunity on ProjectHunter.ai!

  Build a custom AI chatbot for $2,500.
  
  Apply now: projecthunter.ai`,
  ['linkedin', 'twitter', 'reddit'],
  { subreddit: 'artificial' }
);

console.log(`Posted: ${result.success}/${result.total}`);
```

### A/B Testing

```typescript
import { generateAndPostAB } from './skills/multi_poster';

const variants = [
  { id: 'v1', templateId: 'template-uuid-1', name: 'Emoji Version' },
  { id: 'v2', templateId: 'template-uuid-2', name: 'Professional Version' },
];

const { result, selectedVariant } = await generateAndPostAB(
  ['linkedin', 'twitter'],
  variants,
  { bounty_title: 'AI Chatbot', bounty_reward: '$2,500' }
);

console.log(`Used variant: ${selectedVariant.name}`);
```

### Bounty of the Week Campaign

```typescript
import { runBountyOfWeekCampaign } from './skills/multi_poster';

// Automatically fetches latest bounty and posts everywhere
const result = await runBountyOfWeekCampaign('template-uuid');
```

## A/B Test Analytics

Results are logged to Supabase `outreach_logs` with:
- `variantId`: Which variant was used
- `variantName`: Human-readable name
- `successRate`: Calculated engagement rate

View in Dashboard → Analytics → A/B Tests

## Template Variables

- `{{bounty_title}}` - Bounty title
- `{{bounty_reward}}` - Bounty reward amount
- `{{bounty_category}}` - Category (AI/ML, etc.)
- `{{bounty_description}}` - Brief description
- `{{projecthunter_url}}` - Auto-filled with projecthunter.ai

## Best Practices

1. **Test Variants**: Always run at least 2 variants
2. **Platform Adapt**: Content may need platform-specific tweaks
3. **Monitor Results**: Check Analytics for winning variants
4. **Iterate**: Use winning variants as baseline for next tests

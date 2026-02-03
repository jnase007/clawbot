# Twitter/X Outreach Skill

Automates Twitter/X posts, threads, and engagement for ProjectHunter.ai marketing.

## Features

- **Tweet Posting**: Single tweets and threads
- **Engagement**: Reply to tweets, like, follow
- **Search**: Find relevant AI discussions
- **Rate Limiting**: Respects API limits

## Configuration

1. Create a Twitter Developer account at [developer.twitter.com](https://developer.twitter.com)
2. Create a project and app
3. Generate API keys and tokens
4. Set environment variables:

```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

## Usage

### Post a Tweet

```typescript
import { postTweet } from './skills/twitter';

await postTweet(`🚀 Exciting news from ProjectHunter.ai!

Developers can now earn up to $5K building custom AI agents.

Check it out: projecthunter.ai`);
```

### Post a Thread

```typescript
import { postThread } from './skills/twitter';

await postThread([
  '🧵 How we built a custom AI agent in 48 hours via ProjectHunter.ai',
  'A client needed an e-commerce chatbot. They posted a $2K bounty.',
  'Within 24 hours, 3 developers submitted proposals.',
  'The winning dev delivered in just 48 hours. Client thrilled! 🎉',
  'Want to earn building AI? Check out projecthunter.ai'
]);
```

### Search and Engage

```typescript
import { searchTweets, replyToTweet, likeTweet } from './skills/twitter';

// Find relevant discussions
const tweets = await searchTweets('AI agent developer', 20);

// Engage with relevant ones
for (const tweet of tweets) {
  await likeTweet(tweet.id);
  await replyToTweet(tweet.id, 'Great point! If you're into AI dev...');
}
```

## Rate Limits

Twitter API v2 limits:
- 50 tweets per 24 hours (free tier)
- 300 reads per 15 minutes
- Limited search on free tier

## Best Practices

1. **Value First**: Share useful content, not just promotion
2. **Thread Format**: Use threads for longer content
3. **Timing**: Post during peak engagement hours
4. **Hashtags**: Use relevant but not excessive hashtags
5. **Engagement**: Respond to replies promptly

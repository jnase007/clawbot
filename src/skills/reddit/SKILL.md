# Reddit Outreach Skill

Automates Reddit posts, comments, and messages for ProjectHunter.ai marketing.

## Features

- **Subreddit Posting**: Submit self-posts or link posts
- **Smart Commenting**: Find relevant posts and add value
- **Direct Messages**: Private message outreach
- **Rate Limiting**: Respects Reddit's API limits
- **Template Support**: Personalized content with variables

## Configuration

1. Create a Reddit app at [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Choose "script" type
3. Set these environment variables:

```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER=your_reddit_username
REDDIT_PASS=your_reddit_password
REDDIT_USER_AGENT=ClawBot/1.0.0 (by /u/your_username)
REDDIT_RATE_LIMIT=10  # messages per minute
```

## Usage

### Submit a Post

```typescript
import { submitPost } from './skills/reddit';

const result = await submitPost(
  'artificial',  // subreddit
  'Developers: Earn building custom AI agents',
  `Looking for developers interested in AI gig work.
   
   ProjectHunter.ai connects you with businesses needing custom AI agents.
   Bounties range from $500-$5K.
   
   Check it out: projecthunter.ai`
);

console.log(result.url); // https://reddit.com/r/...
```

### Send Private Message

```typescript
import { sendMessage } from './skills/reddit';

await sendMessage(
  'username',  // without u/
  'Quick question about AI dev',
  'Hey! Saw your posts about AI development...'
);
```

### Run Campaign

```typescript
import { runRedditPostCampaign } from './skills/reddit';

await runRedditPostCampaign('template-uuid', [
  'artificial',
  'MachineLearning',
  'forhire',
  'freelance'
]);
```

### Find Relevant Posts

```typescript
import { findRelevantPosts } from './skills/reddit';

const posts = await findRelevantPosts(
  ['artificial', 'ChatGPT'],  // subreddits
  ['AI agent', 'automation', 'developer'],  // keywords
  20  // limit
);
```

## Best Practices

1. **Add Value**: Don't just promote - contribute to discussions
2. **Know the Rules**: Each subreddit has different self-promotion rules
3. **Build Karma**: Participate genuinely before promoting
4. **Rate Limit**: Don't spam - 1 post per subreddit per day max
5. **Flair Posts**: Use appropriate flair where required

## Recommended Subreddits

For ProjectHunter.ai:
- r/artificial - AI discussions
- r/MachineLearning - ML community
- r/forhire - Job postings (follow rules!)
- r/freelance - Freelancer community
- r/SideProject - Sharing projects
- r/startups - Startup community

## Rate Limits

Reddit's API limits:
- 60 requests per minute
- 1 post per 10 minutes per subreddit
- DMs limited based on karma

## Troubleshooting

### "RATELIMIT" Error
You're posting too frequently. Wait and retry.

### "SUBREDDIT_NOEXIST"
Check subreddit name spelling.

### "USER_DOESNT_EXIST"
Verify username before messaging.

### "NOT_WHITELISTED_BY_USER"
User has blocked messages from strangers.

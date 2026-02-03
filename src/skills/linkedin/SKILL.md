# LinkedIn Outreach Skill

Automates LinkedIn posts and messages for ProjectHunter.ai marketing campaigns.

## Features

- **Dual Mode**: Uses LinkedIn API when available, falls back to browser automation
- **Rate Limiting**: Respects daily limits (default: 50 messages/day)
- **Session Persistence**: Maintains login state to reduce captchas
- **Template Support**: Personalized messaging with variables

## Configuration

### Option 1: LinkedIn API (Recommended for posts)

```bash
LINKEDIN_ACCESS_TOKEN=your_access_token
```

Get token from [LinkedIn Developer Portal](https://developers.linkedin.com).

### Option 2: Browser Automation

```bash
LINKEDIN_EMAIL=your_linkedin_email
LINKEDIN_PASSWORD=your_linkedin_password
LINKEDIN_DAILY_LIMIT=50
```

**⚠️ Note**: Browser automation may trigger security challenges. Use sparingly.

## Usage

### Post an Update

```typescript
import { postUpdate } from './skills/linkedin';

await postUpdate(`
🚀 Exciting news from ProjectHunter.ai!

Looking for developers to build custom AI agents.
Bounties range from $500-$5K.

Check it out: projecthunter.ai
`);
```

### Send Direct Messages

```typescript
import { sendDirectMessage } from './skills/linkedin';

await sendDirectMessage(
  'https://www.linkedin.com/in/username',
  'Hi! Thought you might be interested in ProjectHunter.ai...'
);
```

### Run Campaign

```typescript
import { runLinkedInOutreach } from './skills/linkedin';

// Messages pending contacts from Supabase
const result = await runLinkedInOutreach('template-uuid', 20);
```

## Best Practices

1. **Warm Account**: Use an established LinkedIn account
2. **Go Slow**: Start with 5-10 messages/day, increase gradually
3. **Personalize**: Use template variables for better responses
4. **Avoid Spam**: Quality over quantity
5. **Monitor**: Watch for security challenges

## Rate Limits

- **Daily Messages**: 50 (configurable)
- **Message Interval**: 30 seconds between messages
- **Connection Requests**: Count toward daily limit

## Troubleshooting

### Security Checkpoint
If LinkedIn shows a verification challenge:
1. Log in manually on the same machine
2. Complete the verification
3. Session will be cached for future runs

### Connect Button Not Found
- User may already be a connection
- Try `sendDirectMessage` instead

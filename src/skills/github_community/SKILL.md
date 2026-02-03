# GitHub & Community Skill

Target developers where they live: GitHub and Discord communities.

## Features

- **GitHub Search**: Find AI-related repos and issues
- **Star & Engage**: Star repos, comment on issues
- **Lead Capture**: Capture repo contributors as leads
- **Discord Bot**: Post to AI community channels

## Configuration

### GitHub

1. Create Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens)
2. Enable: `public_repo`, `read:user`

```bash
GITHUB_TOKEN=your_github_pat
```

### Discord

1. Create bot at [discord.com/developers](https://discord.com/developers/applications)
2. Enable: Message Content Intent
3. Invite to servers with proper permissions

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_SERVER_ID=target_server_id
DISCORD_CHANNEL_ID=target_channel_id
```

## Usage

### Search GitHub

```typescript
import { searchRepos, searchIssues } from './skills/github_community';

// Find AI agent repos
const repos = await searchRepos('AI agent LLM', 20);

// Find issues to engage with
const issues = await searchIssues('AI agent help wanted', 20);
```

### Run GitHub Campaign

```typescript
import { runGitHubCampaign } from './skills/github_community';

const result = await runGitHubCampaign({
  searchQuery: 'AI agent LLM',
  starRepos: true,
  captureContributors: true,
  dailyLimit: 5,
});

console.log(`Starred: ${result.starred}, Leads: ${result.leadsCapured}`);
```

### Post to Discord

```typescript
import { postToDiscord, runDiscordCampaign } from './skills/github_community';

// Single channel
await postToDiscord(`🚀 New on ProjectHunter.ai!

Looking for developers to build custom AI agents.
Bounties up to $5K. Check it out: projecthunter.ai`);

// Multiple channels
await runDiscordCampaign(message, [
  'channel-id-1',
  'channel-id-2',
]);
```

### Capture Contributors

```typescript
import { getRepoContributors } from './skills/github_community';

const contributors = await getRepoContributors('owner', 'repo', 20);

// Contributors are auto-saved as leads with tags:
// ['github', 'ai-developer', 'repo-name']
```

## Target Communities

### GitHub Topics
- `artificial-intelligence`
- `machine-learning`
- `llm`
- `ai-agents`
- `langchain`
- `autogpt`

### Discord Servers
- LAION
- Hugging Face
- LangChain
- AutoGPT
- Local AI communities

## Rate Limits

GitHub:
- 5,000 requests/hour with token
- Conservative: 5 actions/day for starring

Discord:
- 5 messages/5 seconds per channel
- Be respectful of community rules

## Best Practices

1. **Star Genuinely**: Only star repos you find interesting
2. **No Spam**: Don't mass-comment on issues
3. **Contribute First**: Build reputation before promoting
4. **Respect Mods**: Discord servers have rules - follow them
5. **Lead Quality**: Contributors to active AI repos are high-quality leads

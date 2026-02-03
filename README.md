# 🦀 ClawBot

**AI-Powered Marketing Outreach for ProjectHunter.ai**

ClawBot is a comprehensive multi-platform marketing automation bot that handles outreach across Email, LinkedIn, Reddit, Twitter/X, GitHub, and Discord. Built with TypeScript, powered by Supabase for real-time data, and featuring an AI agent for intelligent campaign orchestration.

![ClawBot Dashboard](https://projecthunter.ai/clawbot-preview.png)

## ✨ Features

### Core Outreach Skills
- 📧 **Email Outreach** - SMTP-based campaigns with Nodemailer, rate limiting, and tracking
- 💼 **LinkedIn Automation** - Posts and messages via API or browser automation (Puppeteer)
- 🔴 **Reddit Marketing** - Posts, comments, and DMs via snoowrap
- 𝕏 **Twitter/X Integration** - Tweets, threads, search, and engagement via Twitter API v2

### Advanced Skills
- 🚀 **Multi-Channel Poster** - Post to all platforms simultaneously with one command
- 🧪 **A/B Testing** - Track variant performance to optimize messaging
- 🎯 **Engagement & Lead Nurture** - Find relevant discussions and engage authentically
- 🐙 **GitHub Outreach** - Star repos, find contributors as leads
- 💬 **Discord Bot** - Post to AI community channels

### Dashboard & Analytics
- 📊 **React Dashboard** - Beautiful UI for managing contacts, templates, and campaigns
- 📈 **Real-time Analytics** - Track success rates, A/B test results, channel performance
- 🔄 **Live Activity Feed** - Supabase real-time updates
- 👥 **Contact Management** - CRM-like features with status tracking

### AI Agent
- 🤖 **Natural Language Control** - Run campaigns with plain English commands
- 🧠 **OpenAI Integration** - AI-powered content personalization and decisions
- ⚡ **Tool Calling** - Agent executes multi-step campaigns automatically

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd Clawbot_feb3

# Install backend dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your credentials
```

**Required:**
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` for AI agent

**Platform-specific:** See [Platform Setup](#platform-setup) below.

### 3. Set Up Database

```bash
npm run db:migrate
```

Copy the output SQL into Supabase Dashboard → SQL Editor → Run.

### 4. Start the Dashboard

```bash
cd dashboard
npm run dev
```

Open http://localhost:3000

## 📋 CLI Usage

### AI Agent (Natural Language)

```bash
# Run agent with a task
npm run agent "Run email outreach to pending contacts"
npm run agent "Post a LinkedIn update about our new AI marketplace"
npm run agent "Run the Bounty of the Week campaign"
npm run agent "Find Twitter discussions about AI agents and engage"
```

### Direct Commands

```bash
# Email
npm run cli email verify
npm run cli email campaign -t <template-id> -l 50

# LinkedIn
npm run cli linkedin post "Check out ProjectHunter.ai!"
npm run cli linkedin campaign -t <template-id>

# Reddit
npm run cli reddit verify
npm run cli reddit post-campaign -t <template-id> -s "artificial,MachineLearning"

# Twitter (via code)
# postTweet(), postThread(), searchTweets()

# Contacts
npm run cli contacts add -p email -h user@example.com -n "John Doe"
npm run cli contacts search "developer"

# Templates
npm run cli templates list -p email
npm run cli templates create -p email -T email -n "Welcome" -c "Hey {{name}}!"

# Stats & Logs
npm run cli stats
npm run cli logs -l 50
```

## 🔧 Platform Setup

### Email (SMTP)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password  # Gmail App Password
```

### LinkedIn

**Option 1: API**
```bash
LINKEDIN_ACCESS_TOKEN=your_access_token
```

**Option 2: Browser Automation**
```bash
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password
```

### Reddit

1. Create app at [reddit.com/prefs/apps](https://reddit.com/prefs/apps) (script type)

```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER=your_username
REDDIT_PASS=your_password
```

### Twitter/X

1. Create app at [developer.twitter.com](https://developer.twitter.com)

```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

### GitHub

1. Create PAT at [github.com/settings/tokens](https://github.com/settings/tokens)

```bash
GITHUB_TOKEN=your_github_pat
```

### Discord

1. Create bot at [discord.com/developers](https://discord.com/developers/applications)

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=target_channel_id
```

## 📁 Project Structure

```
clawbot/
├── src/
│   ├── agent/               # AI agent orchestrator
│   ├── config/              # Environment configuration
│   ├── db/                  # Supabase client & repository
│   │   ├── migrate.ts       # Database migrations
│   │   ├── repository.ts    # CRUD operations
│   │   └── types.ts         # TypeScript types
│   ├── skills/              # Platform-specific modules
│   │   ├── email/           # Nodemailer integration
│   │   ├── linkedin/        # LinkedIn API + Puppeteer
│   │   ├── reddit/          # snoowrap integration
│   │   ├── twitter/         # Twitter API v2
│   │   ├── multi_poster/    # Cross-platform posting
│   │   ├── engagement/      # Discussion engagement
│   │   └── github_community/# GitHub + Discord
│   ├── cli.ts               # Command-line interface
│   └── index.ts             # Main exports
├── dashboard/               # React dashboard
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Dashboard pages
│   │   │   ├── Dashboard    # Overview stats
│   │   │   ├── Contacts     # Contact management
│   │   │   ├── Templates    # Template CRUD
│   │   │   ├── Campaigns    # Campaign management
│   │   │   ├── Analytics    # Charts & A/B results
│   │   │   └── Logs         # Activity feed
│   │   └── lib/             # Utilities & Supabase
│   └── ...
└── ...
```

## 📝 Templates

Templates use Handlebars syntax:

```handlebars
Hey {{name}},

I noticed you're into {{interest}} - thought you'd love ProjectHunter.ai!

We're a marketplace where developers can earn building custom AI agents.
Bounties range from $500-$5K.

Check it out: {{projecthunter_url}}

Best,
The ProjectHunter.ai Team
```

### Available Variables

| Variable | Description |
|----------|-------------|
| `{{name}}` | Contact's name |
| `{{email}}` | Contact's email |
| `{{interest}}` | Custom field from notes |
| `{{projecthunter_url}}` | Auto-filled URL |
| `{{bounty_title}}` | Bounty title (multi-poster) |
| `{{bounty_reward}}` | Reward amount |

## 🧪 A/B Testing

Create multiple template variants and track performance:

```typescript
const variants = [
  { id: 'v1', templateId: 'uuid-1', name: 'Emoji Version' },
  { id: 'v2', templateId: 'uuid-2', name: 'Professional Version' },
];

const { result, selectedVariant } = await generateAndPostAB(
  ['linkedin', 'twitter'],
  variants,
  { bounty_title: 'AI Chatbot' }
);
```

View results in Dashboard → Analytics → A/B Tests.

## ⏱️ Rate Limits

| Platform | Default Limit | Config Variable |
|----------|---------------|-----------------|
| Email    | 1/second      | `EMAIL_RATE_LIMIT` |
| LinkedIn | 50/day        | `LINKEDIN_DAILY_LIMIT` |
| Reddit   | 10/minute     | `REDDIT_RATE_LIMIT` |
| Twitter  | 50/day        | `TWITTER_DAILY_LIMIT` |
| GitHub   | 5/day         | `GITHUB_DAILY_LIMIT` |

## 🗄️ Database Schema

**Tables:**
- `outreach_contacts` - Contact database with status tracking
- `templates` - Message templates with variables
- `outreach_logs` - Activity logs with metadata
- `campaigns` - Campaign management
- `approval_queue` - Human review queue (optional)

## 🚀 Deployment

### Backend (VM/Server)

```bash
npm install
npm run build
node dist/index.js

# Or with PM2
pm2 start dist/index.js --name clawbot
```

### Dashboard (Netlify)

```bash
cd dashboard
npm run build
# Deploy dist/ to Netlify
```

Environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## ⏰ Cron Jobs

Schedule campaigns:

```bash
# Daily email outreach at 9 AM
0 9 * * * cd /path/to/clawbot && npm run agent "Run email outreach"

# Bounty of the Week on Mondays
0 10 * * 1 cd /path/to/clawbot && npm run agent "Run Bounty of the Week campaign"

# Find and engage Twitter discussions
0 14 * * * cd /path/to/clawbot && npm run agent "Find AI discussions on Twitter"
```

## 📊 KPI Tracking

Align with your roadmap goals:

| Goal | How ClawBot Helps |
|------|-------------------|
| 500 bounties/month | Automated outreach to developers |
| 100 hunters by Q2 | GitHub + Reddit developer targeting |
| $50K GMV by Q3 | A/B tested campaigns for conversions |
| Viral referral program | Lead nurture sequences |

## 🔐 Compliance

- **Opt-outs**: Track unsubscribes in contact status
- **Rate Limiting**: Conservative limits avoid platform bans
- **Approval Queue**: Human review before auto-engagement
- **ToS Compliance**: Follow each platform's guidelines

## 🐙 GitHub Repository

```bash
git init
git add .
git commit -m "Initial ClawBot setup"
git remote add origin https://github.com/jnase007/clawbot.git
git push -u origin main
```

## 📄 License

MIT

---

Built for [ProjectHunter.ai](https://projecthunter.ai) 🚀

*"Automate 80% of your marketing, keep 100% of the human touch."*

# 🦀 ClawBot v2.0

<div align="center">

```
 ██████╗██╗      █████╗ ██╗    ██╗██████╗  ██████╗ ████████╗
██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔═══██╗╚══██╔══╝
██║     ██║     ███████║██║ █╗ ██║██████╔╝██║   ██║   ██║   
██║     ██║     ██╔══██║██║███╗██║██╔══██╗██║   ██║   ██║   
╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝╚██████╔╝   ██║   
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝  ╚═════╝    ╚═╝   
```

**AI-Powered Marketing Outreach for ProjectHunter.ai**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)

</div>

---

## ⚡ Features

### 🎯 Multi-Platform Outreach
- **📧 Email** - SMTP campaigns with Nodemailer
- **💼 LinkedIn** - Posts & DMs via API/Puppeteer
- **🔴 Reddit** - Posts, comments, DMs via snoowrap
- **𝕏 Twitter** - Tweets, threads, engagement
- **🐙 GitHub** - Star repos, find developers
- **💬 Discord** - Community announcements

### 🤖 AI-Powered
- **Natural Language Control** - "Run email outreach to pending contacts"
- **Content Generation** - AI writes your posts and emails
- **Personalization** - Context-aware message customization
- **Sentiment Analysis** - Detect positive replies for follow-up
- **A/B Testing** - Generate and test multiple variants

### 📊 Smart Automation
- **Optimal Scheduling** - Post at peak engagement times
- **Drip Sequences** - Automated email nurture flows
- **Lead Capture** - Find and store developer contacts
- **Engagement Monitoring** - Find relevant discussions
- **Rate Limiting** - Stay under platform limits

### 🖥️ Cyberpunk Dashboard
- **Real-time Analytics** - Live activity feed
- **Conversion Funnel** - Visualize your pipeline
- **Campaign Control** - Launch and monitor missions
- **Contact Management** - CRM-like features

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/jnase007/clawbot.git
cd clawbot

# Install
npm install
cd dashboard && npm install && cd ..

# Configure
cp env.example .env
# Edit .env with your credentials

# Setup database
npm run db:migrate
# Copy SQL to Supabase Dashboard → SQL Editor

# Run
npm run cli status
```

---

## 🎮 Usage

### AI Agent (Natural Language)

```bash
npm run agent "Run email outreach to pending contacts"
npm run agent "Post a LinkedIn update about AI bounties"
npm run agent "Find Twitter discussions about AI agents"
npm run agent "Generate a thread about custom AI development"
```

### CLI Commands

```bash
# Status
npm run cli status

# Email
npm run cli email verify
npm run cli email campaign -t <template-id>

# LinkedIn
npm run cli linkedin post "Check out ProjectHunter.ai!"
npm run cli linkedin campaign -t <template-id>

# Reddit
npm run cli reddit post -t <template-id> -s "artificial,MachineLearning"

# Contacts
npm run cli contacts add -p email -h user@example.com -n "John"
npm run cli contacts search "developer"

# Templates
npm run cli templates list -p email

# Logs
npm run cli logs -l 50
```

### Dashboard

```bash
cd dashboard
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

```
clawbot/
├── src/
│   ├── agent/                 # AI orchestrator
│   ├── config/                # Environment config
│   ├── db/                    # Supabase integration
│   └── skills/
│       ├── email/             # SMTP/Nodemailer
│       ├── linkedin/          # API + Puppeteer
│       ├── reddit/            # snoowrap
│       ├── twitter/           # Twitter API v2
│       ├── github_community/  # Octokit + Discord.js
│       ├── multi_poster/      # Cross-platform + A/B
│       ├── engagement/        # Discussion monitoring
│       ├── ai_generator/      # Content generation
│       ├── scheduler/         # Smart scheduling
│       └── drip_sequences/    # Email nurturing
├── dashboard/                 # React + Tailwind
│   └── src/
│       ├── components/        # UI components
│       └── pages/             # Dashboard pages
└── ...
```

---

## 🔧 Configuration

### Required

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
```

### Platforms

<details>
<summary><strong>📧 Email (Gmail)</strong></summary>

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password  # Generate at Google Account → Security → App Passwords
```
</details>

<details>
<summary><strong>💼 LinkedIn</strong></summary>

```bash
# Option 1: API
LINKEDIN_ACCESS_TOKEN=your_token

# Option 2: Browser
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password
```
</details>

<details>
<summary><strong>🔴 Reddit</strong></summary>

Create app at [reddit.com/prefs/apps](https://reddit.com/prefs/apps) (script type)

```bash
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER=your_username
REDDIT_PASS=your_password
```
</details>

<details>
<summary><strong>𝕏 Twitter</strong></summary>

Create app at [developer.twitter.com](https://developer.twitter.com)

```bash
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
```
</details>

<details>
<summary><strong>🐙 GitHub</strong></summary>

Create PAT at [github.com/settings/tokens](https://github.com/settings/tokens)

```bash
GITHUB_TOKEN=your_token
```
</details>

<details>
<summary><strong>💬 Discord</strong></summary>

Create bot at [discord.com/developers](https://discord.com/developers/applications)

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=target_channel
```
</details>

---

## 🧪 Advanced Features

### AI Content Generation

```typescript
import { generateContent, generateThread } from './skills/ai_generator';

// Generate a post
const post = await generateContent({
  platform: 'linkedin',
  type: 'post',
  topic: 'Why AI agents are the future of automation',
  tone: 'professional',
});

// Generate a Twitter thread
const thread = await generateThread(
  'How we built a $5K AI agent in 48 hours',
  5  // number of tweets
);
```

### Smart Scheduling

```typescript
import { scheduleCampaign, getNextOptimalTime } from './skills/scheduler';

// Get optimal posting time
const nextTime = getNextOptimalTime('linkedin');
// Returns: Next Tuesday at 9 AM (optimal for LinkedIn)

// Schedule campaign across optimal times
await scheduleCampaign({
  platform: 'email',
  templateId: 'template-uuid',
  contactCount: 500,
  spreadOverDays: 7,
});
```

### Drip Sequences

```typescript
import { addToSequence, processDripSteps } from './skills/drip_sequences';

// Add contact to nurture sequence
await addToSequence(contactId, 'developer-onboarding');

// Process pending drip steps (run via cron)
await processDripSteps();
```

### A/B Testing

```typescript
import { generateAndPostAB } from './skills/multi_poster';

const variants = [
  { id: 'emoji', templateId: 'uuid-1', name: 'With Emojis' },
  { id: 'formal', templateId: 'uuid-2', name: 'Formal Tone' },
];

const result = await generateAndPostAB(
  ['linkedin', 'twitter'],
  variants,
  { topic: 'AI bounties' }
);
// Tracks which variant performs better
```

---

## ⏰ Automation

### Cron Jobs

```bash
# Daily email outreach at 9 AM
0 9 * * * cd /path/to/clawbot && npm run agent "Run email outreach"

# Process drip sequences every hour
0 * * * * cd /path/to/clawbot && npm run cli drip process

# Weekly "Bounty of the Week" on Monday
0 10 * * 1 cd /path/to/clawbot && npm run agent "Run Bounty of Week campaign"

# Find Twitter discussions daily
0 14 * * * cd /path/to/clawbot && npm run agent "Find AI discussions"
```

---

## 📈 KPIs & Goals

| Goal | How ClawBot Helps |
|------|-------------------|
| 500 bounties/month | Automated outreach to developers |
| 100 hunters by Q2 | GitHub + Reddit developer targeting |
| $50K GMV by Q3 | A/B tested campaigns for conversions |
| Viral program | Drip sequences + engagement |

---

## 🚢 Deployment

### Backend (Fly.io)

```bash
fly launch
fly secrets set SUPABASE_URL=... OPENAI_API_KEY=...
fly deploy
```

### Dashboard (Netlify)

```bash
cd dashboard
npm run build
# Deploy dist/ to Netlify

# Set env vars:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

---

## 📊 Rate Limits

| Platform | Limit | Config |
|----------|-------|--------|
| Email | 1/sec | `EMAIL_RATE_LIMIT` |
| LinkedIn | 50/day | `LINKEDIN_DAILY_LIMIT` |
| Reddit | 10/min | `REDDIT_RATE_LIMIT` |
| Twitter | 50/day | `TWITTER_DAILY_LIMIT` |
| GitHub | 5/day | `GITHUB_DAILY_LIMIT` |

---

## 🔒 Compliance

- ✅ Opt-out tracking in contact status
- ✅ Rate limiting to avoid bans
- ✅ Approval queue for auto-engagement
- ✅ Platform ToS compliance

---

## 📜 License

MIT

---

<div align="center">

Built with 🦀 for [ProjectHunter.ai](https://projecthunter.ai)

*"Automate 80% of your marketing, keep 100% of the human touch."*

</div>

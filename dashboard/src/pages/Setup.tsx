import { useState } from 'react';
import { 
  CheckCircle2, Circle, AlertCircle, ExternalLink, Copy, Check,
  Key, Database, Mail, Target, Brain,
  Settings, ChevronDown, ChevronRight
} from 'lucide-react';

interface SetupItem {
  id: string;
  name: string;
  description: string;
  status: 'complete' | 'pending' | 'error';
  priority: 'required' | 'recommended' | 'optional';
  category: string;
  instructions: string[];
  envVar?: string;
  link?: string;
}

const setupItems: SetupItem[] = [
  // Required - Core
  {
    id: 'supabase',
    name: 'Supabase Database',
    description: 'PostgreSQL database for storing clients, contacts, templates, and logs',
    status: 'complete',
    priority: 'required',
    category: 'Core Infrastructure',
    envVar: 'SUPABASE_URL, SUPABASE_ANON_KEY',
    link: 'https://supabase.com/dashboard',
    instructions: [
      'Create a Supabase project at supabase.com',
      'Copy the Project URL and anon/public key',
      'Add to .env file as SUPABASE_URL and SUPABASE_ANON_KEY',
      'Run the SQL migrations in Supabase SQL Editor'
    ]
  },
  {
    id: 'anthropic',
    name: 'Claude AI (Anthropic)',
    description: 'Powers AI content generation, strategy, and the intelligent agent',
    status: 'complete',
    priority: 'required',
    category: 'AI Services',
    envVar: 'ANTHROPIC_API_KEY',
    link: 'https://console.anthropic.com/settings/keys',
    instructions: [
      'Create an Anthropic account at anthropic.com',
      'Generate an API key in the Console',
      'Add to .env as ANTHROPIC_API_KEY',
      'Recommended: Claude 3 Haiku for cost-effective usage'
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini / Imagen',
    description: 'Powers image generation for ad creatives',
    status: 'complete',
    priority: 'required',
    category: 'AI Services',
    envVar: 'GEMINI_API_KEY',
    link: 'https://makersuite.google.com/app/apikey',
    instructions: [
      'Go to Google AI Studio',
      'Create an API key',
      'Add to .env as GEMINI_API_KEY',
      'Used for Imagen 4.0 image generation'
    ]
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: 'Lead generation and contact enrichment for healthcare/dental prospects',
    status: 'complete',
    priority: 'required',
    category: 'Lead Generation',
    envVar: 'APOLLO_API_KEY',
    link: 'https://app.apollo.io/#/settings/integrations/api',
    instructions: [
      'Log in to Apollo.io',
      'Go to Settings → Integrations → API',
      'Generate an API key',
      'Add to .env as APOLLO_API_KEY'
    ]
  },
  // Required - Email
  {
    id: 'email',
    name: 'Email SMTP (Gmail/SendGrid)',
    description: 'Send outreach emails and drip sequences',
    status: 'pending',
    priority: 'required',
    category: 'Outreach Channels',
    envVar: 'EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS',
    link: 'https://myaccount.google.com/apppasswords',
    instructions: [
      'For Gmail: Enable 2FA on your Google account',
      'Generate an App Password at myaccount.google.com/apppasswords',
      'Set EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=587',
      'Set EMAIL_USER=your@gmail.com, EMAIL_PASS=your_app_password'
    ]
  },
  // Recommended
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Post updates and send InMails',
    status: 'pending',
    priority: 'recommended',
    category: 'Outreach Channels',
    envVar: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_EMAIL/PASSWORD',
    link: 'https://www.linkedin.com/developers/apps',
    instructions: [
      'Option 1 (API): Create a LinkedIn app and get access token',
      'Option 2 (Browser): Use email/password for Puppeteer automation',
      'Add credentials to .env file',
      'Note: LinkedIn has strict rate limits (50 actions/day)'
    ]
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Post tweets and engage with prospects',
    status: 'pending',
    priority: 'recommended',
    category: 'Outreach Channels',
    envVar: 'TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET',
    link: 'https://developer.twitter.com/en/portal/dashboard',
    instructions: [
      'Apply for Twitter Developer access',
      'Create an app in the Developer Portal',
      'Generate API keys and access tokens',
      'Add all 4 keys to .env file'
    ]
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Post in relevant subreddits and engage in discussions',
    status: 'pending',
    priority: 'recommended',
    category: 'Outreach Channels',
    envVar: 'REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER, REDDIT_PASS',
    link: 'https://www.reddit.com/prefs/apps',
    instructions: [
      'Go to reddit.com/prefs/apps',
      'Create a "script" type application',
      'Copy the client ID (under app name) and secret',
      'Add with your Reddit username/password to .env'
    ]
  },
  // Optional
  {
    id: 'github',
    name: 'GitHub',
    description: 'Find developers and engage with open source projects',
    status: 'pending',
    priority: 'optional',
    category: 'Outreach Channels',
    envVar: 'GITHUB_TOKEN',
    link: 'https://github.com/settings/tokens',
    instructions: [
      'Go to GitHub Settings → Developer settings → Personal access tokens',
      'Generate a new token with repo and user scopes',
      'Add to .env as GITHUB_TOKEN'
    ]
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Post announcements in community channels',
    status: 'pending',
    priority: 'optional',
    category: 'Outreach Channels',
    envVar: 'DISCORD_TOKEN, DISCORD_CHANNEL_ID',
    link: 'https://discord.com/developers/applications',
    instructions: [
      'Create a Discord application at discord.com/developers',
      'Create a bot and copy the token',
      'Invite bot to your server with message permissions',
      'Get the channel ID and add both to .env'
    ]
  },
  // Database Migrations
  {
    id: 'migrations',
    name: 'Database Migrations',
    description: 'Create required tables in Supabase',
    status: 'pending',
    priority: 'required',
    category: 'Setup Tasks',
    instructions: [
      'Open Supabase Dashboard → SQL Editor',
      'Run: supabase/migrations/003_client_workflow.sql',
      'This creates: clients, client_discoveries, client_strategies, client_campaigns tables',
      'Verify tables exist in Table Editor'
    ]
  },
];

export default function Setup() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyEnvVar = (envVar: string) => {
    navigator.clipboard.writeText(envVar);
    setCopiedEnv(envVar);
    setTimeout(() => setCopiedEnv(null), 2000);
  };

  const categories = [...new Set(setupItems.map(item => item.category))];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending': return <Circle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'required': return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Required</span>;
      case 'recommended': return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Recommended</span>;
      case 'optional': return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">Optional</span>;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core Infrastructure': return <Database className="w-5 h-5" />;
      case 'AI Services': return <Brain className="w-5 h-5" />;
      case 'Lead Generation': return <Target className="w-5 h-5" />;
      case 'Outreach Channels': return <Mail className="w-5 h-5" />;
      case 'Setup Tasks': return <Settings className="w-5 h-5" />;
      default: return <Key className="w-5 h-5" />;
    }
  };

  const stats = {
    total: setupItems.length,
    complete: setupItems.filter(i => i.status === 'complete').length,
    required: setupItems.filter(i => i.priority === 'required').length,
    requiredComplete: setupItems.filter(i => i.priority === 'required' && i.status === 'complete').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-500" />
            Setup Checklist
          </h1>
          <p className="text-gray-400 mt-1">Configure these services for ClawBot to work properly</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-white">{stats.complete}/{stats.total}</div>
            <div className="text-sm text-gray-400">Total Complete</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-emerald-400">{stats.requiredComplete}/{stats.required}</div>
            <div className="text-sm text-gray-400">Required Complete</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-yellow-400">{stats.total - stats.complete}</div>
            <div className="text-sm text-gray-400">Pending Setup</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className={`text-3xl font-bold ${stats.requiredComplete === stats.required ? 'text-green-400' : 'text-orange-400'}`}>
              {stats.requiredComplete === stats.required ? '✓' : '!'}
            </div>
            <div className="text-sm text-gray-400">
              {stats.requiredComplete === stats.required ? 'Ready to Go' : 'Action Needed'}
            </div>
          </div>
        </div>

        {/* Setup Items by Category */}
        {categories.map(category => (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-300">
              {getCategoryIcon(category)}
              <h2 className="text-lg font-semibold">{category}</h2>
            </div>
            
            <div className="space-y-3">
              {setupItems.filter(item => item.category === category).map(item => (
                <div 
                  key={item.id}
                  className={`bg-slate-800/50 rounded-xl border transition-colors ${
                    item.status === 'complete' ? 'border-green-500/30' : 
                    item.status === 'error' ? 'border-red-500/30' : 'border-slate-700'
                  }`}
                >
                  {/* Header */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-700/30 transition-colors rounded-t-xl"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.name}</span>
                        {getPriorityBadge(item.priority)}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Expanded Content */}
                  {expandedItems.has(item.id) && (
                    <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                      {/* Env Variable */}
                      {item.envVar && (
                        <div className="mb-4">
                          <label className="block text-xs text-gray-400 mb-1">Environment Variable(s)</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-slate-900/50 px-3 py-2 rounded-lg text-emerald-400 font-mono text-sm">
                              {item.envVar}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyEnvVar(item.envVar!);
                              }}
                              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                              {copiedEnv === item.envVar ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">Setup Instructions</label>
                        <ol className="space-y-2">
                          {item.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                                {idx + 1}
                              </span>
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Link */}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open {item.name} Dashboard
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ENV Template */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            .env File Template
          </h3>
          <pre className="bg-slate-900/50 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
{`# Core (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# AI Services (Required)
ANTHROPIC_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key

# Lead Generation (Required)
APOLLO_API_KEY=your_apollo_key

# Email (Required for outreach)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# LinkedIn (Recommended)
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password

# Twitter (Recommended)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Reddit (Recommended)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER=
REDDIT_PASS=

# GitHub (Optional)
GITHUB_TOKEN=

# Discord (Optional)
DISCORD_TOKEN=
DISCORD_CHANNEL_ID=`}
          </pre>
        </div>
      </div>
    </div>
  );
}

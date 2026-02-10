import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  Linkedin, 
  Twitter, 
  Mail,
  MessageSquare,
  Loader2,
  ArrowRight,
  Wand2
} from 'lucide-react';

interface GeneratedContent {
  content: string;
  hashtags?: string[];
}

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { id: 'email', name: 'Email', icon: Mail, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const tones = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'enthusiastic', label: 'Enthusiastic' },
  { id: 'technical', label: 'Technical' },
];

const exampleTopics = [
  'AI is transforming how businesses operate',
  'Why automation saves 10+ hours per week',
  'The future of personalized marketing',
  'How small teams can compete with enterprises',
];

// Demo content for when API isn't available (static fallbacks)
const demoResponses: Record<string, Record<string, GeneratedContent>> = {
  linkedin: {
    professional: {
      content: "The businesses winning today aren't working harder—they're working smarter.\n\nWe're seeing clients automate 80% of their repetitive marketing tasks while maintaining the personal touch that converts.\n\nThe result? More time for strategy, better customer relationships, and 3x faster growth.\n\nAI isn't replacing marketers. It's amplifying the great ones.\n\nWhat's one task you wish you could automate today?",
      hashtags: ['AI', 'MarketingAutomation', 'GrowthStrategy', 'FutureOfWork'],
    },
    casual: {
      content: "Real talk: I used to spend 4 hours every Monday scheduling social posts.\n\nNow? 15 minutes.\n\nAI handles the heavy lifting while I focus on what actually matters—connecting with people and building relationships.\n\nThe future isn't about doing more. It's about doing what matters.\n\nAnyone else making this shift? 👇",
      hashtags: ['WorkSmarter', 'AITools', 'Productivity'],
    },
    enthusiastic: {
      content: "🚀 Just watched a client go from 50 leads/month to 300+ using AI-powered outreach!\n\nThe secret? Personalization at scale.\n\nEvery message feels hand-crafted. Every follow-up is perfectly timed. Every prospect gets exactly what they need.\n\nThis is the game-changer nobody's talking about.\n\nWho's ready to 10x their outreach? 🔥",
      hashtags: ['AIMarketing', 'LeadGeneration', 'ScaleUp', 'GrowthHacking'],
    },
    technical: {
      content: "Implemented a multi-agent architecture for marketing automation last month. Here's what I learned:\n\n→ Specialized agents outperform generalists\n→ Human-in-the-loop is non-negotiable for brand voice\n→ Fine-tuning on historical data = 40% better engagement\n→ API rate limiting requires smart queue management\n\nThe tech is mature. The opportunity is now.",
      hashtags: ['AIEngineering', 'MarTech', 'Automation', 'LLMs'],
    },
  },
  twitter: {
    professional: {
      content: "AI marketing agents aren't replacing marketers.\n\nThey're replacing the tedious tasks that burn out marketers.\n\nContent scheduling. Follow-up emails. Data analysis. Report generation.\n\nThe best marketers in 2026? They're the ones who learned to delegate to AI.",
      hashtags: ['AI', 'Marketing', 'Automation'],
    },
    casual: {
      content: "hot take: if you're still manually scheduling every social post in 2026, you're leaving money on the table\n\nAI handles the repetitive stuff. You handle the creative stuff.\n\nWork smarter, not harder 🧠",
      hashtags: ['AITwitter', 'Productivity'],
    },
    enthusiastic: {
      content: "🔥 Just deployed an AI agent that:\n\n• Creates personalized content\n• Posts at optimal times\n• Engages with comments\n• Analyzes what's working\n\nAll while I sleep.\n\nThe future is HERE and it's absolutely wild 🚀",
      hashtags: ['AI', 'MarketingAutomation', 'TechTwitter'],
    },
    technical: {
      content: "Built a marketing automation pipeline using:\n\n→ GPT-4 for content generation\n→ Custom fine-tuning on brand voice\n→ Sentiment analysis for response handling\n→ A/B testing with statistical significance\n\nResult: 3x engagement, 60% less manual work.\n\nThread on architecture coming soon.",
      hashtags: ['AI', 'MarTech', 'Engineering'],
    },
  },
  email: {
    professional: {
      content: "Subject: A smarter approach to marketing automation\n\nHi there,\n\nI noticed your team is doing incredible work in the AI space. We've been helping similar companies automate their marketing outreach while maintaining authentic, personalized communication.\n\nThe results speak for themselves: 40% higher response rates, 60% less time on repetitive tasks.\n\nWould you be open to a 15-minute call to explore if this could work for you?\n\nBest regards",
      hashtags: [],
    },
    casual: {
      content: "Subject: Quick question about your marketing\n\nHey!\n\nSaw your recent work and had to reach out—really impressive stuff.\n\nI'm helping companies like yours automate the boring parts of marketing (scheduling, follow-ups, reporting) so teams can focus on the creative work that actually moves the needle.\n\nAny chance you'd be up for a quick chat?\n\nCheers",
      hashtags: [],
    },
    enthusiastic: {
      content: "Subject: This could be a game-changer for your team 🚀\n\nHey!\n\nI've been following your company's journey and I'm genuinely excited about what you're building.\n\nWe just helped a similar team 3x their lead generation using AI-powered outreach—and I immediately thought of you.\n\nThe best part? It took less than a week to set up.\n\nWould love to show you how it works. 15 minutes—that's all I need!\n\nLet's chat?",
      hashtags: [],
    },
    technical: {
      content: "Subject: AI-powered marketing infrastructure\n\nHi,\n\nI noticed your engineering blog post on scaling customer acquisition. Impressive architecture.\n\nWe've built a multi-agent system for marketing automation that integrates with existing CRM/marketing stacks via REST APIs. Key metrics from recent deployments:\n\n• 40% reduction in CAC\n• 3x improvement in personalization accuracy\n• Sub-100ms response times for real-time engagement\n\nWould be great to discuss the technical implementation. Open to a call?",
      hashtags: [],
    },
  },
  reddit: {
    professional: {
      content: "I've been experimenting with AI marketing agents for the past 6 months and wanted to share some findings.\n\nThe biggest misconception? That AI-generated content feels robotic. With proper fine-tuning on your brand voice and historical content, the output is often indistinguishable from human-written copy.\n\nThe key is treating AI as an amplifier, not a replacement. Use it for first drafts, A/B variants, and scale—but keep humans in the loop for strategy and final approval.\n\nHappy to answer questions if anyone's exploring this space.",
      hashtags: [],
    },
    casual: {
      content: "Been using AI to automate my marketing for a few months now. AMA.\n\nTL;DR: It's not perfect, but it saves me ~10 hours/week on content creation and scheduling. The trick is setting up good prompts and reviewing output before it goes live.\n\nNot affiliated with any tool—just sharing what's worked for me.",
      hashtags: [],
    },
    enthusiastic: {
      content: "Just hit a milestone I never thought possible: 500 personalized outreach messages in one day, each one actually relevant to the recipient.\n\nBefore AI agents: Maybe 20 good emails per day if I was really focused.\n\nAfter: 500+, and the response rates are actually HIGHER than my manual efforts.\n\nThe game has completely changed. Happy to share my setup if anyone's interested!",
      hashtags: [],
    },
    technical: {
      content: "Built an open-source marketing automation agent. Here's the architecture:\n\n- LLM backbone: GPT-4 Turbo (considering Claude for better instruction following)\n- Vector DB: Pinecone for brand voice/historical content retrieval\n- Orchestration: Custom agent loop with tool calling\n- Integrations: REST APIs for major platforms\n\nBiggest challenge: Rate limiting across platforms. Solution: Priority queue with exponential backoff.\n\nCode's on GitHub if anyone wants to contribute or fork.",
      hashtags: [],
    },
  },
};

export function AiDemoWidget() {
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState('professional');
  const [topic, setTopic] = useState(exampleTopics[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    // Simulate API delay for demo effect
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Use demo responses (in production, this would call the real API)
    const platformResponses = demoResponses[platform];
    const response = platformResponses?.[tone] || platformResponses?.professional;
    
    setResult(response || null);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRandomTopic = () => {
    const currentIndex = exampleTopics.indexOf(topic);
    const nextIndex = (currentIndex + 1) % exampleTopics.length;
    setTopic(exampleTopics[nextIndex]);
  };

  const selectedPlatform = platforms.find(p => p.id === platform);

  return (
    <Card className="gradient-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Try AI Content Generation</h3>
              <p className="text-sm text-muted-foreground">See how AI Agent creates content for your brand</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    platform === p.id 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", p.bg)}>
                    <p.icon className={cn("w-4 h-4", p.color)} />
                  </div>
                  <span className="text-xs font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    tone === t.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Topic</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should we write about?"
                className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleRandomTopic}
                className="shrink-0"
                title="Try another topic"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full btn-gradient gap-2 py-6 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Content
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedPlatform && (
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", selectedPlatform.bg)}>
                      <selectedPlatform.icon className={cn("w-3.5 h-3.5", selectedPlatform.color)} />
                    </div>
                  )}
                  <span className="text-sm font-medium">Generated {selectedPlatform?.name} Content</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.content}</p>
                
                {result.hashtags && result.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    {result.hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-primary">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div>
                  <p className="font-medium">Want this for your brand?</p>
                  <p className="text-sm text-muted-foreground">Custom AI agents trained on YOUR voice</p>
                </div>
                <Button className="btn-gradient gap-2">
                  Let's Talk
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AiDemoWidget;

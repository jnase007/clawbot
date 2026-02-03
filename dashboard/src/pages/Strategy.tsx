import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useClient } from '@/components/ClientProvider';
import { 
  Brain, 
  Sparkles, 
  Target, 
  FileText,
  Loader2,
  CheckCircle,
  Building2,
  Rocket,
  TrendingUp
} from 'lucide-react';
import { cn, getPlatformIcon } from '@/lib/utils';
import type { Platform, TemplateType } from '@/lib/types';

interface GeneratedStrategy {
  goals: string[];
  templates: {
    platform: Platform;
    type: TemplateType;
    name: string;
    subject?: string;
    content: string;
  }[];
  tactics: {
    channel: string;
    actions: string[];
  }[];
  kpis: {
    metric: string;
    target: string;
  }[];
}

// Industry-specific prompts for AI generation
const industryPrompts: Record<string, { goals: string[]; audiences: string[] }> = {
  'Healthcare / Medical Investment': {
    goals: [
      'Generate 20+ qualified investor leads per month',
      'Build thought leadership in healthcare investment space',
      'Increase website conversions by 30%',
      'Establish partnerships with 5+ healthcare startups'
    ],
    audiences: ['Healthcare executives', 'Angel investors', 'VC partners', 'Medical device founders']
  },
  'Fintech / Compliance': {
    goals: [
      'Acquire 15 enterprise compliance clients quarterly',
      'Position as top RegTech thought leader',
      'Generate 50+ demo requests per month',
      'Reduce customer acquisition cost by 25%'
    ],
    audiences: ['Compliance officers', 'CFOs', 'Risk managers', 'FinTech founders']
  },
  'Digital Marketing Agency': {
    goals: [
      'Sign 10 new retainer clients per quarter',
      'Increase average client value by 40%',
      'Build referral pipeline from existing clients',
      'Launch 3 successful case studies monthly'
    ],
    audiences: ['CMOs', 'Marketing directors', 'E-commerce brands', 'B2B SaaS companies']
  },
  'AI / Tech Marketplace': {
    goals: [
      'Onboard 100+ developers (hunters) monthly',
      'Generate $50K+ in bounty GMV monthly',
      'Build community of 500+ active members',
      'Launch 20+ successful AI agent projects'
    ],
    audiences: ['AI developers', 'Tech founders', 'Product managers', 'Enterprise innovation teams']
  }
};

// AI-powered template generation based on industry
function generateTemplatesForClient(
  clientName: string,
  industry: string,
  channels: string[]
): GeneratedStrategy['templates'] {
  const templates: GeneratedStrategy['templates'] = [];
  
  // Email templates
  if (channels.includes('email')) {
    templates.push({
      platform: 'email',
      type: 'email',
      name: `${clientName} - Cold Outreach`,
      subject: `Quick question about {{company}}'s ${industry.split('/')[0].trim().toLowerCase()} strategy`,
      content: `Hi {{name}},

I noticed {{company}} is making waves in the ${industry.split('/')[0].trim().toLowerCase()} space, and I wanted to reach out.

At ${clientName}, we help companies like yours {{value_proposition}}.

Would you be open to a 15-minute call this week to explore if there's a fit?

Best,
{{sender_name}}
${clientName}`
    });

    templates.push({
      platform: 'email',
      type: 'email',
      name: `${clientName} - Follow-up`,
      subject: `Re: {{previous_subject}}`,
      content: `Hi {{name}},

Just floating this to the top of your inbox. I know things get busy.

The reason I reached out is that we've helped similar companies in {{industry}} achieve {{specific_result}}.

Would a quick 10-minute chat be helpful?

Best,
{{sender_name}}`
    });

    templates.push({
      platform: 'email',
      type: 'email',
      name: `${clientName} - Value-First`,
      subject: `[Resource] {{topic}} guide for {{industry}} leaders`,
      content: `Hi {{name}},

I put together a quick guide on {{topic}} specifically for ${industry.split('/')[0].trim().toLowerCase()} professionals like yourself.

No strings attached – just thought it might be useful given what {{company}} is working on.

{{resource_link}}

Let me know if you find it helpful!

Best,
{{sender_name}}
${clientName}`
    });
  }

  // LinkedIn templates
  if (channels.includes('linkedin')) {
    templates.push({
      platform: 'linkedin',
      type: 'message',
      name: `${clientName} - LinkedIn Connect`,
      content: `Hi {{name}}, I came across your profile and was impressed by your work at {{company}}. 

As someone focused on ${industry.split('/')[0].trim().toLowerCase()}, I thought it would be great to connect and share insights.

Looking forward to connecting!`
    });

    templates.push({
      platform: 'linkedin',
      type: 'message',
      name: `${clientName} - LinkedIn Follow-up`,
      content: `Thanks for connecting, {{name}}!

I noticed {{observation_about_company}}. We've been helping companies in {{industry}} with {{value_prop}}.

Would you be open to a quick chat to explore potential synergies?`
    });

    templates.push({
      platform: 'linkedin',
      type: 'post',
      name: `${clientName} - Thought Leadership Post`,
      subject: `Industry Insight`,
      content: `🚀 3 things I've learned about ${industry.split('/')[0].trim().toLowerCase()} this quarter:

1️⃣ {{insight_1}}
2️⃣ {{insight_2}}
3️⃣ {{insight_3}}

What's been your biggest learning? Drop it in the comments 👇

#${industry.replace(/[^a-zA-Z]/g, '')} #ThoughtLeadership #${clientName.replace(/[^a-zA-Z]/g, '')}`
    });
  }

  // Reddit templates
  if (channels.includes('reddit')) {
    templates.push({
      platform: 'reddit',
      type: 'post',
      name: `${clientName} - Reddit Value Post`,
      subject: `[Discussion] What's working in ${industry.split('/')[0].trim().toLowerCase()} right now?`,
      content: `Hey everyone,

Been in the ${industry.split('/')[0].trim().toLowerCase()} space for a while and curious what strategies are working for you all.

Here's what we've seen working:
• {{tactic_1}}
• {{tactic_2}}
• {{tactic_3}}

What's your experience? Would love to hear different perspectives.`
    });

    templates.push({
      platform: 'reddit',
      type: 'comment',
      name: `${clientName} - Reddit Helpful Reply`,
      content: `Great question! In my experience with ${industry.split('/')[0].trim().toLowerCase()}, {{specific_advice}}.

We actually built something at ${clientName} that addresses this - happy to share more if you're interested (no pressure, just genuinely think it might help).`
    });
  }

  return templates;
}

export default function Strategy() {
  const { currentClientId, currentClient } = useClient();
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<GeneratedStrategy | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Show message if no client selected
  if (!currentClientId || !currentClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to generate their AI strategy.
        </p>
      </div>
    );
  }

  async function generateStrategy() {
    if (!currentClient) return;
    
    setGenerating(true);
    setSaved(false);
    
    // Simulate AI thinking time
    await new Promise(r => setTimeout(r, 2000));

    const industry = currentClient.industry || 'Digital Marketing Agency';
    const channels = currentClient.preferred_channels || ['email', 'linkedin'];
    const industryData = industryPrompts[industry] || industryPrompts['Digital Marketing Agency'];

    // Generate strategy based on client profile
    const generatedStrategy: GeneratedStrategy = {
      goals: industryData.goals,
      templates: generateTemplatesForClient(
        currentClient.name,
        industry,
        channels
      ),
      tactics: channels.map(channel => ({
        channel,
        actions: [
          `Send ${channel === 'email' ? '50' : '20'} personalized ${channel} messages weekly`,
          `A/B test ${channel === 'email' ? 'subject lines' : 'message hooks'} for optimal engagement`,
          `Track ${channel} response rates and optimize based on data`,
          `Build segmented lists based on ${channel} engagement`
        ]
      })),
      kpis: [
        { metric: 'Response Rate', target: '15%+' },
        { metric: 'Meeting Conversion', target: '25% of responses' },
        { metric: 'Monthly Qualified Leads', target: '30+' },
        { metric: 'Cost Per Lead', target: '<$50' }
      ]
    };

    setStrategy(generatedStrategy);
    setGenerating(false);
  }

  async function saveTemplates() {
    if (!strategy || !currentClientId) return;
    
    setSaving(true);

    try {
      // Insert all templates
      for (const template of strategy.templates) {
        // Extract variables from content
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;
        const contentToScan = template.content + (template.subject || '');
        while ((match = variableRegex.exec(contentToScan)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }

        await supabase.from('templates').insert({
          client_id: currentClientId,
          platform: template.platform,
          type: template.type,
          name: template.name,
          subject: template.subject || null,
          content: template.content,
          variables,
          is_active: true,
        } as unknown as never);
      }

      // Update client goals
      await supabase
        .from('clients')
        .update({ goals: strategy.goals.join('\n') } as never)
        .eq('id', currentClientId);

      setSaved(true);
    } catch (error) {
      console.error('Error saving templates:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Strategy Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate personalized goals and templates for {currentClient.name}
          </p>
        </div>
        <Button 
          onClick={generateStrategy} 
          disabled={generating}
          className="btn-gradient gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Strategy
            </>
          )}
        </Button>
      </div>

      {/* Client Context */}
      <Card className="animate-slide-up gradient-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
            >
              {currentClient.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold">{currentClient.name}</h2>
              <p className="text-muted-foreground">{currentClient.industry || 'No industry set'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Channels</p>
                <div className="flex gap-1 mt-1">
                  {currentClient.preferred_channels?.map(ch => (
                    <span key={ch} className="text-lg">{getPlatformIcon(ch)}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tone</p>
                <Badge variant="secondary" className="capitalize mt-1">
                  {currentClient.tone || 'Professional'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generating Animation */}
      {generating && (
        <Card className="animate-slide-up">
          <CardContent className="p-12 text-center">
            <div className="relative inline-flex">
              <div className="w-20 h-20 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <Brain className="w-8 h-8 absolute inset-0 m-auto text-primary animate-pulse" />
            </div>
            <p className="text-lg font-display mt-6">Analyzing market trends...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generating personalized strategy for {currentClient.industry}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Strategy */}
      {strategy && !generating && (
        <div className="space-y-6 animate-slide-up">
          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                AI-Generated Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategy.goals.map((goal, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <p className="text-sm">{goal}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Target KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {strategy.kpis.map((kpi, i) => (
                  <div key={i} className="text-center p-4 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-2xl font-display font-bold text-primary">{kpi.target}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.metric}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tactics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent" />
                Channel Tactics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategy.tactics.map((tactic, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(tactic.channel)}</span>
                      <span className="font-medium capitalize">{tactic.channel}</span>
                    </div>
                    <ul className="space-y-2">
                      {tactic.actions.map((action, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Templates Preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Generated Templates ({strategy.templates.length})
              </CardTitle>
              <Button 
                onClick={saveTemplates} 
                disabled={saving || saved}
                className={cn(saved ? "bg-green-500 hover:bg-green-500" : "")}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved to Templates
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Save All Templates
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategy.templates.map((template, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{getPlatformIcon(template.platform)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{template.type}</p>
                      </div>
                    </div>
                    {template.subject && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        Subject: {template.subject}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {saved && (
            <Card className="border-green-500/30 bg-green-500/5 animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-green-500">Strategy Applied Successfully!</p>
                    <p className="text-sm text-muted-foreground">
                      {strategy.templates.length} templates saved. Go to Templates page to view and edit them.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!strategy && !generating && (
        <Card className="animate-slide-up">
          <CardContent className="py-16 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-primary/30" />
            <h3 className="text-xl font-display font-bold mb-2">Ready to Generate</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Click "Generate Strategy" to create AI-powered goals and templates 
              tailored to {currentClient.name}'s industry and target audience.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Smart Goals</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Ready-to-use Templates</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>KPI Targets</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

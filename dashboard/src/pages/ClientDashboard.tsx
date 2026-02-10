import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useClient } from '@/components/ClientProvider';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Calendar,
  Clock,
  Play,
  Pause,
  Building2,
  ExternalLink,
  TrendingUp,
  Users,
  FileText,
  Rocket,
  Brain,
  Sparkles,
  Mail,
  Radio,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PlatformIcon } from '@/components/PlatformIcon';
import type { Template, Campaign } from '@/lib/types';

interface ClientStats {
  totalContacts: number;
  totalTemplates: number;
  activeCampaigns: number;
  totalSent: number;
  successRate: number;
}

interface ExecutionPlan {
  id: string;
  channel: string;
  action: string;
  frequency: string;
  status: 'active' | 'paused' | 'scheduled';
  nextRun?: string;
  lastRun?: string;
}

// Parse goals from string to array
function parseGoals(goalsString: string | null | undefined): string[] {
  if (!goalsString) return [];
  return goalsString.split('\n').filter(g => g.trim().length > 0);
}

// Generate execution plan based on client channels
function generateExecutionPlan(channels: string[]): ExecutionPlan[] {
  const plans: ExecutionPlan[] = [];
  
  if (channels.includes('email')) {
    plans.push({
      id: 'email-outreach',
      channel: 'email',
      action: 'Send personalized cold emails',
      frequency: 'Daily at 9:00 AM',
      status: 'scheduled',
      nextRun: getNextRunTime(9),
    });
    plans.push({
      id: 'email-followup',
      channel: 'email',
      action: 'Follow-up on unopened emails',
      frequency: 'Every 3 days',
      status: 'scheduled',
      nextRun: getNextRunTime(10),
    });
  }
  
  if (channels.includes('linkedin')) {
    plans.push({
      id: 'linkedin-connect',
      channel: 'linkedin',
      action: 'Send connection requests',
      frequency: 'Daily at 10:00 AM',
      status: 'scheduled',
      nextRun: getNextRunTime(10),
    });
    plans.push({
      id: 'linkedin-engage',
      channel: 'linkedin',
      action: 'Engage with prospect posts',
      frequency: 'Twice daily',
      status: 'scheduled',
      nextRun: getNextRunTime(14),
    });
  }
  
  if (channels.includes('reddit')) {
    plans.push({
      id: 'reddit-post',
      channel: 'reddit',
      action: 'Post value-first content',
      frequency: 'Weekly on Tuesdays',
      status: 'scheduled',
      nextRun: getNextTuesday(),
    });
    plans.push({
      id: 'reddit-engage',
      channel: 'reddit',
      action: 'Reply to relevant threads',
      frequency: 'Daily at 2:00 PM',
      status: 'scheduled',
      nextRun: getNextRunTime(14),
    });
  }
  
  return plans;
}

function getNextRunTime(hour: number): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

function getNextTuesday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilTuesday);
  next.setHours(10, 0, 0, 0);
  return next.toISOString();
}

export default function ClientDashboard() {
  const { currentClientId, currentClient } = useClient();
  const [stats, setStats] = useState<ClientStats>({
    totalContacts: 0,
    totalTemplates: 0,
    activeCampaigns: 0,
    totalSent: 0,
    successRate: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan[]>([]);

  useEffect(() => {
    if (currentClientId && currentClient) {
      fetchClientData();
      setExecutionPlan(generateExecutionPlan(currentClient.preferred_channels || ['email', 'linkedin']));
    }
  }, [currentClientId, currentClient]);

  async function fetchClientData() {
    if (!currentClientId) return;

    try {
      const [contactsRes, templatesRes, campaignsRes, logsRes] = await Promise.all([
        supabase.from('outreach_contacts').select('id', { count: 'exact', head: true }).eq('client_id', currentClientId),
        supabase.from('templates').select('*').eq('client_id', currentClientId).eq('is_active', true),
        supabase.from('campaigns').select('*').eq('client_id', currentClientId).order('created_at', { ascending: false }),
        supabase.from('outreach_logs').select('success').eq('client_id', currentClientId),
      ]);

      const logs = logsRes.data as { success: boolean }[] || [];
      const successLogs = logs.filter(l => l.success).length;
      const totalLogs = logs.length;

      const allCampaigns = campaignsRes.data as Campaign[] || [];
      const activeCampaignsCount = allCampaigns.filter(c => c.status === 'running').length;

      setStats({
        totalContacts: contactsRes.count || 0,
        totalTemplates: templatesRes.data?.length || 0,
        activeCampaigns: activeCampaignsCount,
        totalSent: totalLogs,
        successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0,
      });

      setCampaigns(allCampaigns);
      setTemplates(templatesRes.data as Template[] || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  }

  // Show message if no client selected
  if (!currentClientId || !currentClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to view their dashboard and execution plan.
        </p>
      </div>
    );
  }

  const goals = parseGoals(currentClient.goals);

  return (
    <div className="space-y-8">
      {/* Client Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div className="flex items-center gap-6">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
          >
            {currentClient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">{currentClient.name}</h1>
            <p className="text-muted-foreground mt-1">{currentClient.industry || 'No industry set'}</p>
            {currentClient.website && (
              <a 
                href={currentClient.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                {currentClient.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/strategy">
            <Button variant="outline" className="gap-2">
              <Brain className="w-4 h-4" />
              Generate Strategy
            </Button>
          </Link>
          <Link to="/dashboard/campaigns">
            <Button className="btn-gradient gap-2">
              <Rocket className="w-4 h-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-up stagger-1">
        {[
          { label: 'Contacts', value: stats.totalContacts, icon: Users, color: 'text-blue-500' },
          { label: 'Templates', value: stats.totalTemplates, icon: FileText, color: 'text-green-500' },
          { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Rocket, color: 'text-primary' },
          { label: 'Messages Sent', value: stats.totalSent, icon: Mail, color: 'text-purple-500' },
          { label: 'Success Rate', value: `${stats.successRate.toFixed(0)}%`, icon: TrendingUp, color: 'text-accent' },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-display font-bold", stat.color)}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Goals Section */}
        <Card className="animate-slide-up stagger-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Client Goals
            </CardTitle>
            {goals.length === 0 && (
              <Link to="/dashboard/strategy">
                <Button size="sm" variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Generate
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <ul className="space-y-3">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm">{goal}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No goals set yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use AI Strategy to generate goals
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Strategy */}
        <Card className="animate-slide-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Active Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(currentClient.preferred_channels || ['email', 'linkedin']).map((channel) => (
                <div 
                  key={channel}
                  className="text-center p-4 rounded-lg bg-secondary/30 border border-border"
                >
                  <PlatformIcon platform={channel} size="xl" />
                  <p className="text-sm font-medium mt-2 capitalize">{channel}</p>
                  <Badge variant="success" className="mt-2 text-[10px]">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium">Tone:</span>
                <span className="capitalize text-muted-foreground">{currentClient.tone || 'Professional'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Plan */}
      <Card className="animate-slide-up stagger-3">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Bot Execution Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {executionPlan.length} scheduled tasks
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionPlan.map((plan) => (
              <div 
                key={plan.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
              >
                <PlatformIcon platform={plan.channel} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{plan.action}</p>
                    <Badge 
                      variant={plan.status === 'active' ? 'success' : plan.status === 'paused' ? 'warning' : 'secondary'}
                      className="text-[10px]"
                    >
                      {plan.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.frequency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next run</p>
                  <p className="text-sm font-mono">
                    {plan.nextRun ? formatDate(plan.nextRun) : 'Not scheduled'}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="gap-1">
                  {plan.status === 'active' ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
          
          {executionPlan.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No execution plan set</p>
              <p className="text-xs text-muted-foreground mt-1">
                Generate a strategy to create an execution plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card className="animate-slide-up stagger-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Active Campaigns
          </CardTitle>
          <Link to="/dashboard/campaigns">
            <Button size="sm" variant="outline" className="gap-1">
              View All
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.slice(0, 3).map((campaign) => (
                <div 
                  key={campaign.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
                >
                  <PlatformIcon platform={campaign.platform} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{campaign.name}</p>
                      <Badge 
                        variant={
                          campaign.status === 'running' ? 'success' : 
                          campaign.status === 'completed' ? 'info' : 'secondary'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{campaign.sent_count} / {campaign.total_contacts} sent</span>
                      <span>{campaign.success_count} successful</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {campaign.total_contacts > 0 
                        ? Math.round((campaign.sent_count / campaign.total_contacts) * 100)
                        : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Progress</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Rocket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No campaigns yet</p>
              <Link to="/dashboard/campaigns">
                <Button size="sm" className="mt-3">
                  Create Campaign
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready Templates */}
      <Card className="animate-slide-up stagger-5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Ready Templates ({templates.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/strategy">
              <Button size="sm" variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Generate More
              </Button>
            </Link>
            <Link to="/dashboard/templates">
              <Button size="sm" variant="outline" className="gap-1">
                View All
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.slice(0, 6).map((template) => (
                <div 
                  key={template.id}
                  className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon platform={template.platform} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{template.type}</p>
                    </div>
                    <Badge variant={template.is_active ? 'success' : 'secondary'} className="text-[10px]">
                      {template.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No templates yet</p>
              <Link to="/dashboard/strategy">
                <Button size="sm" className="mt-3 gap-1">
                  <Sparkles className="w-3 h-3" />
                  Generate with AI
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <Card className="animate-slide-up stagger-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-bold text-lg">Ready to launch?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start the automated outreach for {currentClient.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/dashboard/strategy">
                <Button variant="outline" className="gap-2">
                  <Brain className="w-4 h-4" />
                  AI Strategy
                </Button>
              </Link>
              <Link to="/dashboard/campaigns">
                <Button className="btn-gradient gap-2">
                  <Rocket className="w-4 h-4" />
                  Launch Campaign
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

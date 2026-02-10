import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useClient } from '@/components/ClientProvider';
import { 
  Send,
  Activity,
  Target,
  Users,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  Mail,
  MessageSquare,
  TrendingUp,
  Building2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutreachLog } from '@/lib/types';

interface Stats {
  totalContacts: number;
  byPlatform: Record<string, number>;
  recentActivity: number;
  successRate: number;
  totalSent: number;
}

// Animated counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

// No client selected overlay
function NoClientOverlay() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Building2 className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Choose a client from the dropdown above to view their outreach data, 
        campaigns, and analytics.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>Your agency's AI-powered outreach engine</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentClient, currentClientId } = useClient();
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    byPlatform: { email: 0, linkedin: 0, reddit: 0, twitter: 0, github: 0, discord: 0 },
    recentActivity: 0,
    successRate: 0,
    totalSent: 0,
  });
  const [recentLogs, setRecentLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentClientId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentClientId]);

  async function fetchData() {
    if (!currentClientId) return;
    
    setLoading(true);
    try {
      // Build queries with client filter
      let contactsQuery = supabase.from('outreach_contacts').select('platform, status, last_contacted');
      let logsQuery = supabase.from('outreach_logs').select('*').order('created_at', { ascending: false }).limit(10);
      
      // Apply client filter
      contactsQuery = contactsQuery.eq('client_id', currentClientId);
      logsQuery = logsQuery.eq('client_id', currentClientId);

      const [contactsRes, logsRes] = await Promise.all([
        contactsQuery,
        logsQuery,
      ]);

      const contacts = contactsRes.data || [];
      const logs = logsRes.data || [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const byPlatform: Record<string, number> = { email: 0, linkedin: 0, reddit: 0, twitter: 0, github: 0, discord: 0 };
      let recentActivity = 0;

      interface ContactRow {
        platform: string;
        status: string;
        last_contacted: string | null;
      }

      (contacts as ContactRow[]).forEach((c) => {
        if (byPlatform[c.platform] !== undefined) {
          byPlatform[c.platform]++;
        }
        if (c.last_contacted && new Date(c.last_contacted) > weekAgo) {
          recentActivity++;
        }
      });

      const { count: totalSent } = await supabase
        .from('outreach_logs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', currentClientId);

      const { count: successCount } = await supabase
        .from('outreach_logs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', currentClientId)
        .eq('success', true);

      setStats({
        totalContacts: contacts.length,
        byPlatform,
        recentActivity,
        successRate: totalSent ? ((successCount || 0) / totalSent) * 100 : 0,
        totalSent: totalSent || 0,
      });
      setRecentLogs(logs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Show overlay if no client selected
  if (!currentClientId) {
    return <NoClientOverlay />;
  }

  const kpiCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Messages Sent',
      value: stats.totalSent,
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Success Rate',
      value: stats.successRate,
      suffix: '%',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Active This Week',
      value: stats.recentActivity,
      icon: Activity,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      trend: '7 days',
      trendUp: true,
    },
  ];

  const platformCards = [
    { platform: 'email', icon: Mail, label: 'Email', count: stats.byPlatform.email, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { platform: 'linkedin', icon: MessageSquare, label: 'LinkedIn', count: stats.byPlatform.linkedin, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    { platform: 'reddit', icon: Radio, label: 'Reddit', count: stats.byPlatform.reddit, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  ];

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      email: '📧',
      linkedin: '💼',
      reddit: '🔴',
      twitter: '𝕏',
      github: '🐙',
      discord: '💬',
    };
    return icons[platform] || '📌';
  };

  return (
    <div className="space-y-6">
      {/* Client Branded Header */}
      {currentClient && (
        <div className="animate-slide-up">
          {/* Banner (if available) */}
          {currentClient.banner_url && (
            <div 
              className="h-32 md:h-40 rounded-xl bg-cover bg-center mb-4 relative overflow-hidden"
              style={{ backgroundImage: `url(${currentClient.banner_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>
          )}
          
          {/* Client Info Card */}
          <Card className={cn(
            "gradient-border overflow-hidden",
            currentClient.banner_url && "-mt-16 relative z-10 mx-4"
          )}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Logo */}
                {currentClient.logo_url ? (
                  <img 
                    src={currentClient.logo_url} 
                    alt={currentClient.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-border"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
                  >
                    {currentClient.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Name & Details */}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">
                    {currentClient.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {currentClient.industry || 'Marketing Client'}
                  </p>
                  {currentClient.website && (
                    <a 
                      href={currentClient.website.startsWith('http') ? currentClient.website : `https://${currentClient.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      {currentClient.website.replace(/^https?:\/\//, '')}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button className="btn-gradient gap-2">
                    <Rocket className="w-4 h-4" />
                    New Campaign
                  </Button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Industry:</span>
                  <Badge variant="secondary">{currentClient.industry || 'Not set'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tone:</span>
                  <Badge variant="secondary" className="capitalize">{currentClient.tone}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Channels:</span>
                  {currentClient.preferred_channels?.slice(0, 3).map(ch => (
                    <Badge key={ch} variant="outline" className="capitalize">{ch}</Badge>
                  ))}
                </div>
                {currentClient.goals && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Goal:</span>
                    <span className="text-sm truncate max-w-[200px]">{currentClient.goals}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <Card 
            key={card.title} 
            className={cn(
              "card-hover animate-slide-up",
              `stagger-${i + 1}`
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {card.title}
                  </p>
                  <p className={cn("text-3xl font-display font-bold mt-2", card.color)}>
                    <AnimatedNumber value={card.value} suffix={card.suffix} />
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs",
                      card.trendUp ? "text-green-500" : "text-red-500"
                    )}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-xl", card.bgColor)}>
                  <card.icon className={cn("w-5 h-5", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platformCards.map((platform, i) => (
          <Card 
            key={platform.platform} 
            className={cn(
              "card-hover animate-slide-up",
              `stagger-${i + 3}`
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", platform.bgColor)}>
                  <platform.icon className={cn("w-5 h-5", platform.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {platform.label}
                  </p>
                  <p className="text-2xl font-display font-bold">
                    <AnimatedNumber value={platform.count} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-muted-foreground">
                    {stats.totalContacts > 0 
                      ? Math.round((platform.count / stats.totalContacts) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="animate-slide-up stagger-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
            <span className="text-muted-foreground">Live</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg shimmer" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No activity yet for this client</p>
              <p className="text-xs text-muted-foreground mt-1">Launch a campaign to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log, i) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/20 transition-all",
                    i === 0 && "animate-slide-in-left"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                    log.success ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {getPlatformIcon(log.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={log.success ? 'success' : 'destructive'}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

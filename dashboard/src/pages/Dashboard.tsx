import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Send,
  Activity,
  Zap,
  Target,
  Crosshair,
  Radio,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutreachLog, Platform } from '@/lib/types';

interface Stats {
  totalContacts: number;
  byPlatform: Record<Platform, number>;
  recentActivity: number;
  successRate: number;
  totalSent: number;
}

// Animated counter component
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
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

// Live activity indicator
function LivePulse() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
      </div>
      <span className="text-xs font-mono text-green-500">LIVE</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    byPlatform: { email: 0, linkedin: 0, reddit: 0 },
    recentActivity: 0,
    successRate: 0,
    totalSent: 0,
  });
  const [recentLogs, setRecentLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel('dashboard-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outreach_logs' }, 
        (payload) => {
          setRecentLogs((prev) => [payload.new as OutreachLog, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [contactsRes, logsRes] = await Promise.all([
        supabase.from('outreach_contacts').select('platform, status, last_contacted'),
        supabase.from('outreach_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const contacts = contactsRes.data || [];
      const logs = logsRes.data || [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const byPlatform: Record<Platform, number> = { email: 0, linkedin: 0, reddit: 0 };
      let recentActivity = 0;

      contacts.forEach((c) => {
        byPlatform[c.platform as Platform]++;
        if (c.last_contacted && new Date(c.last_contacted) > weekAgo) {
          recentActivity++;
        }
      });

      const { count: totalSent } = await supabase
        .from('outreach_logs')
        .select('*', { count: 'exact', head: true });

      const { count: successCount } = await supabase
        .from('outreach_logs')
        .select('*', { count: 'exact', head: true })
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

  const kpiCards = [
    {
      title: 'TOTAL TARGETS',
      value: stats.totalContacts,
      icon: Crosshair,
      color: 'text-primary',
      glowClass: 'glow-green',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'MISSIONS SENT',
      value: stats.totalSent,
      icon: Send,
      color: 'text-blue-400',
      glowClass: 'glow-blue',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'SUCCESS RATE',
      value: stats.successRate,
      suffix: '%',
      icon: Target,
      color: 'text-accent',
      glowClass: 'glow-pink',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'ACTIVE OPS',
      value: stats.recentActivity,
      icon: Radio,
      color: 'text-orange-400',
      trend: '7 days',
      trendUp: true,
    },
  ];

  const platformCards = [
    { platform: 'email' as Platform, icon: '📧', label: 'EMAIL', count: stats.byPlatform.email, color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30' },
    { platform: 'linkedin' as Platform, icon: '💼', label: 'LINKEDIN', count: stats.byPlatform.linkedin, color: 'from-sky-500/20 to-blue-500/20', borderColor: 'border-sky-500/30' },
    { platform: 'reddit' as Platform, icon: '🔴', label: 'REDDIT', count: stats.byPlatform.reddit, color: 'from-orange-500/20 to-red-500/20', borderColor: 'border-orange-500/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-display font-bold tracking-wider">
            <span className="text-primary text-glow-green">COMMAND</span>{' '}
            <span className="text-foreground">CENTER</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            // PROJECTHUNTER.AI OUTREACH OPERATIONS
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LivePulse />
          <Button className="gap-2 glow-green font-mono">
            <Rocket className="w-4 h-4" />
            LAUNCH MISSION
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <Card 
            key={card.title} 
            className={cn(
              "card-hover border-primary/20 animate-slide-up overflow-hidden relative",
              `stagger-${i + 1}`
            )}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground tracking-wider">
                    {card.title}
                  </p>
                  <p className={cn("text-4xl font-display font-bold mt-2", card.color)}>
                    <AnimatedNumber value={card.value} suffix={card.suffix} />
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs font-mono",
                      card.trendUp ? "text-green-500" : "text-red-500"
                    )}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-xl bg-primary/10 border border-primary/20",
                  card.glowClass
                )}>
                  <card.icon className={cn("w-6 h-6", card.color)} />
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
              "card-hover border overflow-hidden animate-slide-up",
              platform.borderColor,
              `stagger-${i + 3}`
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-50",
              platform.color
            )} />
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="text-4xl animate-float">{platform.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-mono text-muted-foreground tracking-wider">
                    {platform.label}
                  </p>
                  <p className="text-3xl font-display font-bold text-foreground">
                    <AnimatedNumber value={platform.count} />
                  </p>
                  <p className="text-xs text-muted-foreground">targets acquired</p>
                </div>
                <div className="text-right">
                  <div className="w-16 h-16 relative">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-secondary"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={`${(platform.count / Math.max(stats.totalContacts, 1)) * 176} 176`}
                        className="text-primary transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">
                        {stats.totalContacts > 0 
                          ? Math.round((platform.count / stats.totalContacts) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="gradient-border animate-slide-up stagger-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display tracking-wider">
            <Activity className="w-5 h-5 text-primary" />
            LIVE ACTIVITY FEED
          </CardTitle>
          <LivePulse />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <Cpu className="w-6 h-6 absolute inset-0 m-auto text-primary animate-pulse" />
              </div>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
              <p className="text-muted-foreground font-mono">NO ACTIVE TRANSMISSIONS</p>
              <p className="text-xs text-muted-foreground mt-1">Launch a mission to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log, i) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-primary/10 hover:border-primary/30 transition-all",
                    i === 0 && "animate-slide-in-left border-primary/30 glow-green"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                    log.success ? "bg-green-500/20" : "bg-red-500/20"
                  )}>
                    {log.platform === 'email' && '📧'}
                    {log.platform === 'linkedin' && '💼'}
                    {log.platform === 'reddit' && '🔴'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={log.success ? 'success' : 'destructive'}
                    className="font-mono text-xs"
                  >
                    {log.success ? '✓ SUCCESS' : '✗ FAILED'}
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

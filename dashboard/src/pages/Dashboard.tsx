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
  ArrowUpRight,
  Zap
} from 'lucide-react';
import type { OutreachLog, Platform } from '@/lib/types';

interface Stats {
  totalContacts: number;
  byPlatform: Record<Platform, number>;
  recentActivity: number;
  successRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    byPlatform: { email: 0, linkedin: 0, reddit: 0 },
    recentActivity: 0,
    successRate: 0,
  });
  const [recentLogs, setRecentLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const subscription = supabase
      .channel('logs')
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
      // Fetch contacts
      const { data: contacts } = await supabase
        .from('outreach_contacts')
        .select('platform, last_contacted');

      // Fetch recent logs
      const { data: logs } = await supabase
        .from('outreach_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const byPlatform: Record<Platform, number> = { email: 0, linkedin: 0, reddit: 0 };
      let recentActivity = 0;

      contacts?.forEach((c) => {
        byPlatform[c.platform as Platform]++;
        if (c.last_contacted && new Date(c.last_contacted) > weekAgo) {
          recentActivity++;
        }
      });

      const successCount = logs?.filter((l) => l.success).length || 0;
      const successRate = logs?.length ? (successCount / logs.length) * 100 : 0;

      setStats({
        totalContacts: contacts?.length || 0,
        byPlatform,
        recentActivity,
        successRate,
      });
      setRecentLogs(logs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      subtitle: 'Last 7 days',
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
  ];

  const platformCards = [
    { platform: 'email' as Platform, icon: '📧', label: 'Email', count: stats.byPlatform.email },
    { platform: 'linkedin' as Platform, icon: '💼', label: 'LinkedIn', count: stats.byPlatform.linkedin },
    { platform: 'reddit' as Platform, icon: '🔴', label: 'Reddit', count: stats.byPlatform.reddit },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your outreach campaigns for ProjectHunter.ai
          </p>
        </div>
        <Button className="gap-2">
          <Zap className="w-4 h-4" />
          Run Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <Card key={stat.title} className={`animate-fade-in stagger-${i + 1}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platformCards.map((platform, i) => (
          <Card 
            key={platform.platform} 
            className={`group hover:border-amber-500/50 transition-colors cursor-pointer animate-fade-in stagger-${i + 2}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{platform.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{platform.label}</p>
                  <p className="text-2xl font-bold">{platform.count} contacts</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="animate-fade-in stagger-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm">Run your first campaign to see logs here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="text-lg">
                    {log.platform === 'email' && '📧'}
                    {log.platform === 'linkedin' && '💼'}
                    {log.platform === 'reddit' && '🔴'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{log.action}</p>
                    <p className="text-sm text-muted-foreground">
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

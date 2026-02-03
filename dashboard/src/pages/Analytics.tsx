import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { OutreachLog, Platform } from '@/lib/types';

interface ChannelStats {
  platform: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

interface ABTestResult {
  variantId: string;
  variantName: string;
  impressions: number;
  engagements: number;
  successRate: number;
}

interface DailyMetric {
  date: string;
  sent: number;
  success: number;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [abResults, setAbResults] = useState<ABTestResult[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalSuccess: 0,
    avgSuccessRate: 0,
    leadsCapured: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Fetch all logs
      const { data: logs } = await supabase
        .from('outreach_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!logs) return;

      // Calculate channel stats
      const channelMap = new Map<string, { total: number; success: number; failed: number }>();
      
      for (const log of logs) {
        const current = channelMap.get(log.platform) || { total: 0, success: 0, failed: 0 };
        current.total++;
        if (log.success) current.success++;
        else current.failed++;
        channelMap.set(log.platform, current);
      }

      const channels: ChannelStats[] = Array.from(channelMap.entries()).map(([platform, stats]) => ({
        platform,
        ...stats,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      }));
      setChannelStats(channels);

      // Calculate A/B test results
      const abLogs = logs.filter(l => l.action === 'ab_test' && l.metadata);
      const variantMap = new Map<string, { name: string; impressions: number; successSum: number }>();
      
      for (const log of abLogs) {
        const meta = log.metadata as Record<string, unknown>;
        const variantId = meta.variantId as string;
        const variantName = meta.variantName as string;
        const successRate = (meta.successRate as number) || 0;
        
        const current = variantMap.get(variantId) || { name: variantName, impressions: 0, successSum: 0 };
        current.impressions++;
        current.successSum += successRate;
        variantMap.set(variantId, current);
      }

      const abTests: ABTestResult[] = Array.from(variantMap.entries()).map(([id, stats]) => ({
        variantId: id,
        variantName: stats.name,
        impressions: stats.impressions,
        engagements: Math.round(stats.impressions * (stats.successSum / stats.impressions)),
        successRate: stats.impressions > 0 ? (stats.successSum / stats.impressions) * 100 : 0,
      }));
      setAbResults(abTests);

      // Calculate daily metrics (last 14 days)
      const dailyMap = new Map<string, { sent: number; success: number }>();
      const now = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { sent: 0, success: 0 });
      }

      for (const log of logs) {
        const dateStr = log.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          const current = dailyMap.get(dateStr)!;
          current.sent++;
          if (log.success) current.success++;
        }
      }

      const daily: DailyMetric[] = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      }));
      setDailyMetrics(daily);

      // Total stats
      const totalSent = logs.length;
      const totalSuccess = logs.filter(l => l.success).length;
      const leadsLogs = logs.filter(l => l.action === 'capture_lead');
      
      setTotalStats({
        totalSent,
        totalSuccess,
        avgSuccessRate: totalSent > 0 ? (totalSuccess / totalSent) * 100 : 0,
        leadsCapured: leadsLogs.length,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  // Simple bar chart component
  function SimpleBarChart({ data, maxValue }: { data: DailyMetric[]; maxValue: number }) {
    return (
      <div className="flex items-end gap-1 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-0.5">
              <div 
                className="w-full bg-green-500/60 rounded-t transition-all"
                style={{ height: `${maxValue > 0 ? (d.success / maxValue) * 120 : 0}px` }}
              />
              <div 
                className="w-full bg-red-500/40 rounded-b transition-all"
                style={{ height: `${maxValue > 0 ? ((d.sent - d.success) / maxValue) * 120 : 0}px` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground transform -rotate-45 origin-left">
              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Pie chart segments
  function PieChart({ data }: { data: ChannelStats[] }) {
    const total = data.reduce((acc, d) => acc + d.total, 0);
    const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];
    let currentAngle = 0;

    return (
      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.map((d, i) => {
              const angle = (d.total / total) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              
              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={d.platform}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[i % colors.length]}
                  opacity={0.8}
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={d.platform} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="capitalize">{d.platform}</span>
              <span className="text-muted-foreground">({d.total})</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxDaily = Math.max(...dailyMetrics.map(d => d.sent), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track campaign performance and A/B test results
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="animate-fade-in stagger-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-3xl font-bold">{totalStats.totalSent}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">{totalStats.avgSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Captured</p>
                <p className="text-3xl font-bold">{totalStats.leadsCapured}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Target className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Channels Active</p>
                <p className="text-3xl font-bold">{channelStats.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge variant="success" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Success
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Failed
                </Badge>
              </div>
              <SimpleBarChart data={dailyMetrics} maxValue={maxDaily} />
            </CardContent>
          </Card>

          {/* Channel Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {channelStats.length > 0 ? (
                  <PieChart data={channelStats} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No data yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {channelStats
                  .sort((a, b) => b.successRate - a.successRate)
                  .slice(0, 3)
                  .map((channel, i) => (
                    <div key={channel.platform} className="flex items-center gap-4">
                      <div className="text-2xl">
                        {channel.platform === 'email' && '📧'}
                        {channel.platform === 'linkedin' && '💼'}
                        {channel.platform === 'reddit' && '🔴'}
                        {channel.platform === 'twitter' && '𝕏'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{channel.platform}</span>
                          <span className={channel.successRate >= 50 ? 'text-green-400' : 'text-amber-400'}>
                            {channel.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                            style={{ width: `${channel.successRate}%` }}
                          />
                        </div>
                      </div>
                      {channel.successRate >= 50 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Channel</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Success</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Failed</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {channelStats.map((channel) => (
                    <tr key={channel.platform} className="border-t border-border">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {channel.platform === 'email' && '📧'}
                            {channel.platform === 'linkedin' && '💼'}
                            {channel.platform === 'reddit' && '🔴'}
                            {channel.platform === 'twitter' && '𝕏'}
                          </span>
                          <span className="font-medium capitalize">{channel.platform}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">{channel.total}</td>
                      <td className="p-4 text-right text-green-400">{channel.success}</td>
                      <td className="p-4 text-right text-red-400">{channel.failed}</td>
                      <td className="p-4 text-right">
                        <Badge variant={channel.successRate >= 50 ? 'success' : 'warning'}>
                          {channel.successRate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="abtests">
          {abResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No A/B tests yet</p>
                <p className="text-sm text-muted-foreground">
                  Run campaigns with multiple template variants to see results here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {abResults.map((test) => (
                <Card key={test.variantId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{test.variantName}</CardTitle>
                      <Badge variant={test.successRate >= 50 ? 'success' : 'warning'}>
                        {test.successRate.toFixed(1)}% success
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-2xl font-bold">{test.impressions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Engagements</p>
                        <p className="text-2xl font-bold text-green-400">{test.engagements}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                          style={{ width: `${test.successRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

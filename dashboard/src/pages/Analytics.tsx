import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Zap,
  ArrowDownRight,
  RefreshCw,
  Activity,
  Radio,
  Crosshair,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutreachLog } from '@/lib/types';

interface ChannelStats {
  platform: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

interface DailyMetric {
  date: string;
  sent: number;
  success: number;
}

// Animated progress ring
function ProgressRing({ value, size = 120, strokeWidth = 8, color = 'primary' }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-out",
            color === 'primary' && "text-primary",
            color === 'accent' && "text-accent",
            color === 'blue' && "text-blue-400"
          )}
          style={{
            filter: `drop-shadow(0 0 6px currentColor)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-display font-bold">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// Bar chart component
function BarChart({ data, height = 200 }: { data: DailyMetric[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.sent), 1);

  return (
    <div className="flex items-end justify-between gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full relative" style={{ height: height - 30 }}>
            <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-0.5">
              <div
                className="w-full bg-green-500/60 rounded-t transition-all duration-500 ease-out"
                style={{
                  height: `${(d.success / maxValue) * (height - 30)}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
              <div
                className="w-full bg-red-500/40 transition-all duration-500 ease-out"
                style={{
                  height: `${((d.sent - d.success) / maxValue) * (height - 30)}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            </div>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
}

// Funnel visualization
function FunnelChart({ stages }: { stages: { label: string; value: number; color: string }[] }) {
  const maxValue = stages[0]?.value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={stage.label} className="relative">
          <div className="flex items-center gap-4">
            <div className="w-24 text-right">
              <span className="text-xs font-mono text-muted-foreground">{stage.label}</span>
            </div>
            <div className="flex-1 h-10 bg-secondary rounded-lg overflow-hidden relative">
              <div
                className={cn("h-full transition-all duration-1000 ease-out rounded-lg", stage.color)}
                style={{
                  width: `${(stage.value / maxValue) * 100}%`,
                  animationDelay: `${i * 200}ms`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-white drop-shadow-lg">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-16 text-right">
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round((stage.value / maxValue) * 100)}%
              </span>
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="flex items-center gap-4 py-1">
              <div className="w-24" />
              <ArrowDownRight className="w-4 h-4 text-muted-foreground ml-4" />
              <span className="text-[10px] font-mono text-muted-foreground">
                {Math.round(((stages[i + 1]?.value || 0) / stage.value) * 100)}% conversion
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
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
      const { data: logs } = await supabase
        .from('outreach_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!logs) return;

      const typedLogs = logs as OutreachLog[];

      // Channel stats
      const channelMap = new Map<string, { total: number; success: number; failed: number }>();
      
      for (const log of typedLogs) {
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

      // Daily metrics
      const dailyMap = new Map<string, { sent: number; success: number }>();
      const now = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { sent: 0, success: 0 });
      }

      for (const log of typedLogs) {
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

      // Totals
      const totalSent = typedLogs.length;
      const totalSuccess = typedLogs.filter(l => l.success).length;
      const leadsLogs = typedLogs.filter(l => l.action === 'capture_lead');
      
      setTotalStats({
        totalSent,
        totalSuccess,
        avgSuccessRate: totalSent > 0 ? (totalSuccess / totalSent) * 100 : 0,
        leadsCapured: leadsLogs.length,
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Mock funnel data
  const funnelData = [
    { label: 'TARGETS', value: totalStats.totalSent, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { label: 'SENT', value: totalStats.totalSuccess, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { label: 'ENGAGED', value: Math.floor(totalStats.totalSuccess * 0.4), color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { label: 'CONVERTED', value: Math.floor(totalStats.totalSuccess * 0.1), color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <Brain className="w-8 h-8 absolute inset-0 m-auto text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-wider">
            <span className="text-primary text-glow-green">INTEL</span>{' '}
            <span className="text-foreground">CENTER</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            // CAMPAIGN ANALYTICS & PERFORMANCE METRICS
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          REFRESH
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL OPS', value: totalStats.totalSent, icon: Zap, color: 'text-blue-400' },
          { label: 'SUCCESS', value: totalStats.totalSuccess, icon: Target, color: 'text-green-400' },
          { label: 'RATE', value: `${totalStats.avgSuccessRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-primary' },
          { label: 'LEADS', value: totalStats.leadsCapured, icon: Crosshair, color: 'text-accent' },
        ].map((stat, i) => (
          <Card key={stat.label} className={cn("animate-slide-up", `stagger-${i + 1}`)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-3xl font-display font-bold mt-1", stat.color)}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <stat.icon className={cn("w-8 h-8 opacity-50", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Activity */}
        <Card className="animate-slide-up stagger-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              DAILY OPERATIONS (14 DAYS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Badge variant="success">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                SUCCESS
              </Badge>
              <Badge variant="destructive">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                FAILED
              </Badge>
            </div>
            <BarChart data={dailyMetrics} height={220} />
          </CardContent>
        </Card>

        {/* Success Rate by Channel */}
        <Card className="animate-slide-up stagger-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              CHANNEL PERFORMANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around">
              {channelStats.slice(0, 3).map((channel) => (
                <div key={channel.platform} className="text-center">
                  <ProgressRing
                    value={channel.successRate}
                    size={100}
                    color={
                      channel.platform === 'email' ? 'blue' :
                      channel.platform === 'linkedin' ? 'primary' : 'accent'
                    }
                  />
                  <p className="text-xs font-mono text-muted-foreground mt-2 uppercase">
                    {channel.platform}
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {channel.success}/{channel.total}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="animate-slide-up stagger-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            CONVERSION FUNNEL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart stages={funnelData} />
        </CardContent>
      </Card>

      {/* Channel Table */}
      <Card className="animate-slide-up stagger-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            DETAILED BREAKDOWN
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground">CHANNEL</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground">TOTAL</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground">SUCCESS</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground">FAILED</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground">RATE</th>
              </tr>
            </thead>
            <tbody>
              {channelStats.map((channel) => (
                <tr key={channel.platform} className="border-t border-primary/10">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {channel.platform === 'email' && '📧'}
                        {channel.platform === 'linkedin' && '💼'}
                        {channel.platform === 'reddit' && '🔴'}
                        {channel.platform === 'twitter' && '𝕏'}
                      </span>
                      <span className="font-mono uppercase">{channel.platform}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono">{channel.total}</td>
                  <td className="p-4 text-right font-mono text-green-400">{channel.success}</td>
                  <td className="p-4 text-right font-mono text-red-400">{channel.failed}</td>
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
    </div>
  );
}

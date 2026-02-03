import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { 
  ScrollText, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { getPlatformIcon, formatDate } from '@/lib/utils';
import type { OutreachLog, Platform } from '@/lib/types';

export default function Logs() {
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform | 'all'>('all');

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('realtime-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outreach_logs' },
        (payload) => {
          const newLog = payload.new as OutreachLog;
          if (platform === 'all' || newLog.platform === platform) {
            setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [platform]);

  async function fetchLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from('outreach_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.success).length,
    failed: logs.filter((l) => !l.success).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            Real-time feed of all outreach activities
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="secondary" className="px-4 py-2">
          Total: {stats.total}
        </Badge>
        <Badge variant="success" className="px-4 py-2">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success: {stats.success}
        </Badge>
        <Badge variant="destructive" className="px-4 py-2">
          <XCircle className="w-3 h-3 mr-1" />
          Failed: {stats.failed}
        </Badge>
      </div>

      {/* Platform Filter */}
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform | 'all')}>
        <TabsList>
          <TabsTrigger value="all">All Platforms</TabsTrigger>
          <TabsTrigger value="email">📧 Email</TabsTrigger>
          <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
          <TabsTrigger value="reddit">🔴 Reddit</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Logs List */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            Activity Feed
            <Badge variant="outline" className="ml-auto">
              Live
              <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No activity yet</p>
              <p className="text-sm">Logs will appear here as campaigns run</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log, i) => (
                <div 
                  key={log.id} 
                  className={`flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors ${
                    i === 0 ? 'animate-fade-in' : ''
                  }`}
                >
                  {/* Status Icon */}
                  <div className={`mt-1 ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                    {log.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Platform */}
                  <div className="text-2xl">
                    {getPlatformIcon(log.platform)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.action}</p>
                      <Badge variant={log.success ? 'success' : 'destructive'} className="text-xs">
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    
                    {log.error && (
                      <p className="text-sm text-red-400 mt-1">
                        Error: {log.error}
                      </p>
                    )}

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value).substring(0, 30)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

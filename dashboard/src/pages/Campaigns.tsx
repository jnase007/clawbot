import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Rocket, 
  Play, 
  Pause, 
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Plus,
  Target,
  Radio,
  Crosshair,
  ArrowRight,
  Calendar,
  Timer
} from 'lucide-react';
import { cn, getPlatformIcon, formatDate } from '@/lib/utils';
import type { Template, Platform } from '@/lib/types';

interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  template_id: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_contacts: number;
  sent_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

// Animated progress bar
function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className={cn("h-2 bg-secondary rounded-full overflow-hidden", className)}>
      <div
        className="h-full progress-bar transition-all duration-1000 ease-out rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: 'email' as Platform,
    template_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('templates').select('*').eq('is_active', true),
      ]);
      setCampaigns(c.data || []);
      setTemplates(t.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { count } = await supabase
        .from('outreach_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('platform', newCampaign.platform)
        .eq('status', 'pending');

      await supabase.from('campaigns').insert({
        name: newCampaign.name,
        platform: newCampaign.platform,
        template_id: newCampaign.template_id,
        status: 'draft',
        total_contacts: count || 0,
        sent_count: 0,
        success_count: 0,
        error_count: 0,
      });

      setNewCampaign({ name: '', platform: 'email', template_id: '' });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  }

  const stats = {
    running: campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((acc, c) => acc + c.sent_count, 0),
    successRate: campaigns.reduce((acc, c) => acc + c.success_count, 0) / 
                 Math.max(campaigns.reduce((acc, c) => acc + c.sent_count, 0), 1) * 100,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-wider">
            <span className="text-primary text-glow-green">MISSION</span>{' '}
            <span className="text-foreground">CONTROL</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            // OUTREACH CAMPAIGN OPERATIONS
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 glow-green">
          <Rocket className="w-4 h-4" />
          NEW MISSION
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'ACTIVE', value: stats.running, icon: Radio, color: 'text-green-400', pulse: true },
          { label: 'COMPLETED', value: stats.completed, icon: CheckCircle, color: 'text-blue-400' },
          { label: 'SENT', value: stats.totalSent, icon: Target, color: 'text-primary' },
          { label: 'SUCCESS', value: `${stats.successRate.toFixed(1)}%`, icon: Crosshair, color: 'text-accent' },
        ].map((stat, i) => (
          <Card key={stat.label} className={cn("animate-slide-up", `stagger-${i + 1}`)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-3xl font-display font-bold mt-1", stat.color)}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={cn(
                  "w-8 h-8 opacity-50",
                  stat.color,
                  stat.pulse && "animate-pulse"
                )} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <Rocket className="w-6 h-6 absolute inset-0 m-auto text-primary" />
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="animate-slide-up stagger-5">
          <CardContent className="text-center py-16">
            <Rocket className="w-16 h-16 mx-auto mb-4 text-primary opacity-50 animate-float" />
            <p className="text-xl font-display text-foreground">NO ACTIVE MISSIONS</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">
              Launch your first campaign to begin outreach
            </p>
            <Button onClick={() => setShowModal(true)} className="mt-6">
              <Zap className="w-4 h-4 mr-2" />
              CREATE MISSION
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign, i) => (
            <Card 
              key={campaign.id} 
              className={cn(
                "card-hover animate-slide-up overflow-hidden",
                `stagger-${Math.min(i + 1, 5)}`,
                campaign.status === 'running' && "border-primary/50 glow-green"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Platform */}
                  <div className="relative">
                    <div className={cn(
                      "text-4xl",
                      campaign.status === 'running' && "animate-pulse"
                    )}>
                      {getPlatformIcon(campaign.platform)}
                    </div>
                    {campaign.status === 'running' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg tracking-wide">{campaign.name}</h3>
                      <Badge variant={
                        campaign.status === 'running' ? 'neon' :
                        campaign.status === 'completed' ? 'info' :
                        campaign.status === 'scheduled' ? 'warning' :
                        'secondary'
                      }>
                        {campaign.status === 'running' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
                        {campaign.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Created {formatDate(campaign.created_at)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold">{campaign.total_contacts}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">TARGETS</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-green-400">{campaign.sent_count}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">SENT</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-primary">{campaign.success_count}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">SUCCESS</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        LAUNCH
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Pause className="w-3 h-3" />
                        PAUSE
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {campaign.total_contacts > 0 && (
                  <div className="mt-6">
                    <ProgressBar 
                      value={campaign.sent_count} 
                      max={campaign.total_contacts} 
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {campaign.sent_count} / {campaign.total_contacts} processed
                      </span>
                      <span className="text-[10px] font-mono text-primary">
                        {((campaign.sent_count / campaign.total_contacts) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg gradient-border animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Rocket className="w-5 h-5" />
                NEW MISSION
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createCampaign} className="space-y-6">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block">
                    MISSION NAME
                  </label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g., Developer Outreach Q1"
                    className="font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block">
                    TARGET PLATFORM
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['email', 'linkedin', 'reddit'] as Platform[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewCampaign({ ...newCampaign, platform: p, template_id: '' })}
                        className={cn(
                          "p-4 rounded-lg border transition-all text-center",
                          newCampaign.platform === p 
                            ? "border-primary bg-primary/10 glow-green" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl">{getPlatformIcon(p)}</span>
                        <p className="text-xs font-mono mt-1 uppercase">{p}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block">
                    PAYLOAD TEMPLATE
                  </label>
                  <select
                    value={newCampaign.template_id}
                    onChange={(e) => setNewCampaign({ ...newCampaign, template_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm"
                    required
                  >
                    <option value="">Select template...</option>
                    {templates
                      .filter((t) => t.platform === newCampaign.platform)
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    ABORT
                  </Button>
                  <Button type="submit" className="flex-1 glow-green">
                    <Rocket className="w-4 h-4 mr-2" />
                    LAUNCH
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

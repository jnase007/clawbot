import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Rocket, 
  Play, 
  Pause, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { getPlatformIcon, formatDate } from '@/lib/utils';
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

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      const [campaignsRes, templatesRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('templates').select('*').eq('is_active', true),
      ]);

      setCampaigns(campaignsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Count pending contacts for this platform
      const { count } = await supabase
        .from('outreach_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('platform', newCampaign.platform)
        .eq('status', 'pending');

      const { error } = await supabase.from('campaigns').insert({
        name: newCampaign.name,
        platform: newCampaign.platform,
        template_id: newCampaign.template_id,
        status: 'draft',
        total_contacts: count || 0,
        sent_count: 0,
        success_count: 0,
        error_count: 0,
      });

      if (error) throw error;

      setNewCampaign({ name: '', platform: 'email', template_id: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 text-green-400" />;
      case 'paused': return <Pause className="w-4 h-4 text-amber-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-purple-400" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage outreach campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Rocket className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {campaigns.filter((c) => c.status === 'running').length}
              </p>
              <p className="text-sm text-muted-foreground">Running</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {campaigns.filter((c) => c.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {campaigns.reduce((acc, c) => acc + c.sent_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {campaigns.reduce((acc, c) => acc + c.error_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first campaign to start outreach
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:border-amber-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Platform Icon */}
                  <div className="text-3xl">
                    {getPlatformIcon(campaign.platform)}
                  </div>

                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <Badge variant={getStatusBadge(campaign.status) as 'success' | 'warning' | 'info' | 'secondary'}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1 capitalize">{campaign.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(campaign.created_at)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8 text-center">
                    <div>
                      <p className="text-2xl font-bold">{campaign.total_contacts}</p>
                      <p className="text-xs text-muted-foreground">Contacts</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">{campaign.sent_count}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{campaign.success_count}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-400">{campaign.error_count}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Pause className="w-3 h-3" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {campaign.total_contacts > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                        style={{ width: `${(campaign.sent_count / campaign.total_contacts) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.sent_count} of {campaign.total_contacts} contacts processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createCampaign} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Campaign Name</label>
                  <input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g., Developer Outreach Q1"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {(['email', 'linkedin', 'reddit'] as Platform[]).map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={newCampaign.platform === p ? 'default' : 'outline'}
                        onClick={() => setNewCampaign({ ...newCampaign, platform: p, template_id: '' })}
                        className="flex-1"
                      >
                        {getPlatformIcon(p)} {p}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Template</label>
                  <select
                    value={newCampaign.template_id}
                    onChange={(e) => setNewCampaign({ ...newCampaign, template_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    required
                  >
                    <option value="">Select a template...</option>
                    {templates
                      .filter((t) => t.platform === newCampaign.platform)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Campaign
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

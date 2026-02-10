import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '@/components/ClientProvider';
import { supabase } from '@/lib/supabase';
import { useToast, ToastContainer } from '@/components/Toast';
import { 
  Users, Plus, Search, Edit, Save, X, 
  Mail, Phone, Globe, Target, AlertCircle, TrendingDown,
  DollarSign, Sparkles, ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
  goals: string;
  challenges: string;
  competitors: string;
  budget: string;
  industry: string;
}

export default function Clients() {
  const { clients, refreshClients, setCurrentClientId } = useClient();
  const { toasts, removeToast, success, error: toastError } = useToast();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    goals: '',
    challenges: '',
    competitors: '',
    budget: '',
    industry: '',
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      goals: '',
      challenges: '',
      competitors: '',
      budget: '',
      industry: '',
    });
    setEditingClient(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (client: any) => {
    // Clean website URL for display (remove protocol if present)
    let website = client.website || '';
    if (website) {
      website = website.replace(/^https?:\/\//i, '');
    }

    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      website: website,
      goals: client.goals || '',
      challenges: client.challenges || '',
      competitors: Array.isArray(client.competitor_names) 
        ? client.competitor_names.join(', ') 
        : '',
      budget: client.monthly_budget 
        ? client.monthly_budget.toString() 
        : '',
      industry: client.industry || '',
    });
    setEditingClient(client.id);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toastError('Client name is required');
      return;
    }

    setSaving(true);
    try {
      // Clean website URL - remove protocol if present, we'll add it when needed
      let websiteUrl = formData.website.trim();
      if (websiteUrl) {
        websiteUrl = websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      }

      const clientData: any = {
        name: formData.name.trim(),
        company: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: websiteUrl || null,
        industry: formData.industry.trim() || 'General',
        goals: formData.goals.trim() || null,
        challenges: formData.challenges.trim() || null,
        competitor_names: formData.competitors 
          ? formData.competitors.split(',').map(c => c.trim()).filter(c => c)
          : [],
        monthly_budget: formData.budget && formData.budget.trim() 
          ? parseFloat(formData.budget) 
          : null,
        status: 'active',
        stage: editingClient ? undefined : 'discovery', // Don't reset stage on update
      };

      // Remove undefined values
      Object.keys(clientData).forEach(key => {
        if (clientData[key] === undefined) {
          delete clientData[key];
        }
      });

      if (editingClient) {
        const { data, error } = await (supabase.from('clients' as any) as any)
          .update(clientData)
          .eq('id', editingClient)
          .select()
          .single();
        
        if (error) {
          console.error('Update error:', error);
          throw new Error(error.message || `Failed to update client: ${JSON.stringify(error)}`);
        }
        success('Client updated successfully');
      } else {
        const { data, error } = await (supabase.from('clients' as any) as any)
          .insert(clientData)
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw new Error(error.message || `Failed to create client: ${JSON.stringify(error)}`);
        }
        success('Client created successfully');
        // Auto-select the new client
        if (data && data.id) {
          setCurrentClientId(data.id);
        }
      }

      await refreshClients();
      setShowAddModal(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : 'Failed to save client';
      
      // Provide helpful hints for common errors
      let userMessage = errorMessage;
      if (errorMessage.includes('column') || errorMessage.includes('does not exist')) {
        userMessage = `${errorMessage}. Please run migration 008_add_client_info_fields.sql in Supabase.`;
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        userMessage = `${errorMessage}. Check Supabase Row Level Security policies.`;
      }
      
      toastError(userMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToDiscovery = (clientId: string) => {
    setCurrentClientId(clientId);
    navigate('/dashboard/discovery');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Clients
            </h1>
            <p className="text-muted-foreground mt-1">
              Central hub for all client information. AI uses this data to generate Discovery, Strategy, Content, and Ads.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>

        {/* Workflow Info */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">AI-Powered Workflow</p>
              <p className="text-xs text-muted-foreground">
                <strong>1. Client Info</strong> (this page) → <strong>2. Discovery</strong> (auto-generated from client data) → 
                <strong> 3. Strategy</strong> (AI creates from discovery) → <strong>4. Content & Ads</strong> (generated from strategy)
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-3 bg-card text-foreground rounded-xl border border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
              </p>
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: client.primary_color || '#3B82F6' }}
                        >
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.industry || 'General'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{client.phone}</span>
                          </div>
                        )}
                        {client.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <a 
                              href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {client.website}
                            </a>
                          </div>
                        )}
                        {client.monthly_budget && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">${client.monthly_budget.toLocaleString()}/mo</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {client.goals && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-foreground">Goals:</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">{client.goals}</p>
                          </div>
                        )}
                        {client.challenges && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium text-foreground">Challenges:</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">{client.challenges}</p>
                          </div>
                        )}
                        {client.competitor_names && client.competitor_names.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <span className="text-sm font-medium text-foreground">Competitors:</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {client.competitor_names.map((comp, i) => (
                                <Badge key={i} variant="outline">{comp}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(client)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      {client.website && (
                        <Button
                          size="sm"
                          onClick={() => handleContinueToDiscovery(client.id)}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Discovery
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Acme Dental"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@example.com"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Website *
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="example.com"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        AI will analyze this website for Discovery
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Healthcare, Dental"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Goals
                    </label>
                    <textarea
                      value={formData.goals}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      placeholder="What are their main marketing goals? (e.g., Increase leads, brand awareness, etc.)"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Challenges
                    </label>
                    <textarea
                      value={formData.challenges}
                      onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                      placeholder="What challenges are they facing? (e.g., Low website traffic, poor lead quality, etc.)"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <TrendingDown className="w-4 h-4 inline mr-1" />
                      Competitors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.competitors}
                      onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                      placeholder="Competitor 1, Competitor 2, Competitor 3"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Monthly Budget
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="5000"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !formData.name.trim() || !formData.website.trim()}
                    className="flex-1 gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingClient ? 'Update Client' : 'Create Client'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

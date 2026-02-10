import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useClient } from '@/components/ClientProvider';
import { 
  FileText, 
  Plus, 
  Copy,
  Trash2,
  Eye,
  Building2
} from 'lucide-react';
import { PlatformIcon } from '@/components/PlatformIcon';
import type { Template, Platform, TemplateType } from '@/lib/types';

export default function Templates() {
  const { currentClientId, currentClient } = useClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create template form
  const [newTemplate, setNewTemplate] = useState({
    platform: 'email' as Platform,
    type: 'email' as TemplateType,
    name: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    if (currentClientId) {
      fetchTemplates();
    } else {
      setTemplates([]);
      setLoading(false);
    }
  }, [platform, currentClientId]);

  async function fetchTemplates() {
    if (!currentClientId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('templates')
        .select('*')
        .eq('client_id', currentClientId)
        .order('created_at', { ascending: false });

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentClientId) return;
    try {
      // Extract variables from content
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(newTemplate.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      const { error } = await supabase.from('templates').insert({
        client_id: currentClientId,
        platform: newTemplate.platform,
        type: newTemplate.type,
        name: newTemplate.name,
        subject: newTemplate.subject || null,
        content: newTemplate.content,
        variables,
        is_active: true,
      } as unknown as never);

      if (error) throw error;

      setNewTemplate({ platform: 'email', type: 'email', name: '', subject: '', content: '' });
      setShowCreateModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  }

  // Show message if no client selected
  if (!currentClientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to manage their templates.
        </p>
      </div>
    );
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage message templates with dynamic variables
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Platform Filter */}
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform | 'all')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="email" className="gap-2"><PlatformIcon platform="email" size="sm" /> Email</TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2"><PlatformIcon platform="linkedin" size="sm" /> LinkedIn</TabsTrigger>
          <TabsTrigger value="reddit" className="gap-2"><PlatformIcon platform="reddit" size="sm" /> Reddit</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No templates found</p>
            <p className="text-sm text-muted-foreground">Create your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="group hover:border-amber-500/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={template.platform} size="md" />
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{template.type}</p>
                    </div>
                  </div>
                  <Badge variant={template.is_active ? 'success' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.subject && (
                  <p className="text-sm font-medium mb-2 truncate">
                    Subject: {template.subject}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {template.content}
                </p>
                
                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-4">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyId(template.id)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Create Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform</label>
                    <div className="flex gap-2">
                      {(['email', 'linkedin', 'reddit'] as Platform[]).map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={newTemplate.platform === p ? 'default' : 'outline'}
                          onClick={() => setNewTemplate({ ...newTemplate, platform: p })}
                          size="sm"
                          className="gap-2"
                        >
                          <PlatformIcon platform={p} size="sm" />
                          <span className="capitalize">{p}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <div className="flex gap-2">
                      {(['email', 'message', 'post', 'comment'] as TemplateType[]).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant={newTemplate.type === t ? 'default' : 'outline'}
                          onClick={() => setNewTemplate({ ...newTemplate, type: t })}
                          size="sm"
                          className="capitalize"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Developer Outreach v1"
                    required
                  />
                </div>

                {(newTemplate.type === 'email' || newTemplate.type === 'post') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject/Title</label>
                    <Input
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      placeholder={`e.g., Check out ${currentClient?.name || 'our services'} 🚀`}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Content
                    <span className="text-muted-foreground ml-2 font-normal">
                      Use {"{{variable}}"} for dynamic content
                    </span>
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder={`Hey {{name}},\n\nI noticed you're into {{interest}} - thought you might be interested in ${currentClient?.name || 'our company'}!\n\n${currentClient?.goals || 'We help businesses grow with our services'}...`}
                    className="w-full h-48 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
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
                    Create Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={selectedTemplate.platform} size="lg" />
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{selectedTemplate.type}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Template ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono">
                    {selectedTemplate.id}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyId(selectedTemplate.id)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="mt-1">{selectedTemplate.subject}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Content</label>
                <pre className="mt-1 p-4 bg-secondary rounded-lg text-sm whitespace-pre-wrap font-sans">
                  {selectedTemplate.content}
                </pre>
              </div>

              {selectedTemplate.variables.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Variables</label>
                  <div className="flex gap-2 mt-1">
                    {selectedTemplate.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

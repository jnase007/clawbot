import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useClient } from '@/components/ClientProvider';
import { useToast, ToastContainer } from '@/components/Toast';
import { pdf } from '@react-pdf/renderer';
import { StrategyPDF } from '@/components/pdf/StrategyPDF';
import { 
  Brain, 
  Sparkles, 
  Target, 
  FileText,
  Loader2,
  CheckCircle,
  Building2,
  Rocket,
  AlertCircle,
  Copy,
  Check,
  Users,
  BarChart3,
  Zap,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  MessageSquare,
  Send,
  X,
  RefreshCw,
  FileDown
} from 'lucide-react';

interface Goal {
  goal: string;
  metric: string;
  target: string;
  timeline: string;
}

interface ChannelStrategy {
  channel: string;
  priority: string;
  tactics: string[];
  frequency: string;
  budget: string;
}

interface Template {
    name: string;
  type: string;
    subject?: string;
    content: string;
}

interface KPI {
    metric: string;
  current?: string;
    target: string;
  importance: string;
}

interface Phase {
  name: string;
  duration: string;
  focus: string;
  milestones: string[];
}

interface GeneratedStrategy {
  executiveSummary: string;
  goals: Goal[];
  targetPersona: {
    title: string;
    industry: string;
    painPoints: string[];
    motivations: string[];
    objections: string[];
  };
  channelStrategy: ChannelStrategy[];
  contentCalendar: Array<{ week: number; content: string; channel: string; goal: string }>;
  templates: Template[];
  kpis: KPI[];
  timeline: {
    phase1: Phase;
    phase2: Phase;
    phase3: Phase;
  };
  risks: Array<{ risk: string; mitigation: string }>;
  nextSteps: string[];
}

const API_URL = '/api/generate-strategy';
const REFINE_API_URL = '/api/refine-strategy';

interface StrategyRow {
  id: string;
  client_id: string;
  name?: string;
  status?: string;
  duration_days?: number;
  executive_summary?: string;
  target_persona?: any;
  channel_strategy?: any[];
  content_calendar?: any[];
  sample_templates?: any[];
  kpi_targets?: any[];
  timeline?: any;
  risks?: any[];
  next_steps?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Strategy() {
  const { currentClient, currentClientId } = useClient();
  const { toasts, removeToast, success } = useToast();
  const [strategy, setStrategy] = useState<GeneratedStrategy | null>(null);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'goals', 'channels']));
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [refining, setRefining] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing strategy on mount
  useEffect(() => {
    async function loadStrategy() {
      if (!currentClientId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_strategies')
          .select('*')
          .eq('client_id', currentClientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as { data: StrategyRow | null; error: any };

        if (data && !error) {
          // Reconstruct strategy from saved data
          const loadedStrategy: GeneratedStrategy = {
            executiveSummary: data.executive_summary || '',
            goals: data.kpi_targets?.map((kpi: any) => ({
              goal: kpi.metric,
              metric: kpi.metric,
              target: kpi.target,
              timeline: '90 days'
            })) || [],
            targetPersona: data.target_persona || { title: '', industry: '', painPoints: [], motivations: [], objections: [] },
            channelStrategy: data.channel_strategy || [],
            contentCalendar: data.content_calendar || [],
            templates: data.sample_templates || [],
            kpis: data.kpi_targets || [],
            timeline: data.timeline || { phase1: { name: '', duration: '', focus: '', milestones: [] }, phase2: { name: '', duration: '', focus: '', milestones: [] }, phase3: { name: '', duration: '', focus: '', milestones: [] } },
            risks: data.risks || [],
            nextSteps: data.next_steps || []
          };
          setStrategy(loadedStrategy);
          setStrategyId(data.id);
          setSaved(true);
        }
      } catch (err) {
        console.log('No existing strategy found');
      } finally {
        setIsLoading(false);
      }
    }

    loadStrategy();
  }, [currentClientId]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!strategy || !currentClientId || saving) return;

    try {
      const strategyData = {
        client_id: currentClientId,
        name: `${currentClient?.name || 'Client'} Marketing Strategy`,
        status: 'draft',
        duration_days: 90,
        executive_summary: strategy.executiveSummary,
        target_persona: strategy.targetPersona,
        channel_strategy: strategy.channelStrategy,
        content_calendar: strategy.contentCalendar,
        sample_templates: strategy.templates,
        kpi_targets: strategy.kpis,
        timeline: strategy.timeline,
        risks: strategy.risks,
        next_steps: strategy.nextSteps,
        updated_at: new Date().toISOString(),
      };

      if (strategyId) {
        await (supabase.from('client_strategies' as any) as any)
          .update(strategyData)
          .eq('id', strategyId);
      } else {
        const { data } = await (supabase.from('client_strategies' as any) as any)
          .insert(strategyData)
          .select()
          .single();
        if (data) setStrategyId(data.id);
      }

      setSaved(true);
      success('Strategy auto-saved');
    } catch (err) {
      console.log('Auto-save failed:', err);
    }
  }, [strategy, currentClientId, strategyId, currentClient?.name, saving, success]);

  // Trigger auto-save when strategy changes
  useEffect(() => {
    if (!strategy || saved) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [strategy, saved, performAutoSave]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyTemplate = (template: Template) => {
    const text = template.subject 
      ? `Subject: ${template.subject}\n\n${template.content}`
      : template.content;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(template.name);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const [exporting, setExporting] = useState(false);

  async function exportToPDF() {
    if (!strategy || !currentClient) return;
    
    setExporting(true);
    try {
      const blob = await pdf(
        <StrategyPDF 
          strategy={strategy} 
          clientName={currentClient.name} 
          clientLogo={currentClient.logo_url || undefined}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentClient.name.replace(/\s+/g, '_')}_Marketing_Strategy.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  }

  async function refineStrategy() {
    if (!chatInput.trim() || !strategy || refining) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setRefining(true);

    try {
      const response = await fetch(REFINE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentClientId,
          strategyId,
          currentStrategy: strategy,
          userFeedback: userMessage.content,
          clientName: currentClient?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine strategy');
      }

      const result = await response.json();
      
      if (result.strategy) {
        setStrategy(result.strategy);
        setSaved(true);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.message || "I've updated the strategy based on your feedback. The changes are now reflected above.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I couldn't update the strategy. Please try again or regenerate it.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setRefining(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading strategy...</p>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to generate their AI-powered marketing strategy.
        </p>
      </div>
    );
  }

  async function generateStrategy() {
    if (!currentClient || !currentClientId) return;
    
    setGenerating(true);
    setSaved(false);
    setError(null);
    setStrategy(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentClientId,
          clientData: {
            id: currentClientId,
            name: currentClient.name,
            industry: currentClient.industry,
            website: currentClient.website,
            target_audience: currentClient.target_audience,
            goals: currentClient.goals,
            preferred_channels: currentClient.preferred_channels,
            tone: currentClient.tone,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Generation failed');
      }

      const result = await response.json();
      setStrategy(result.strategy);
      if (result.strategyId) {
        setStrategyId(result.strategyId);
      }
      setSaved(true); // Strategy is auto-saved by the API
      // Clear chat when regenerating
      setChatMessages([]);

    } catch (err) {
      console.error('Strategy generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy');
    } finally {
    setGenerating(false);
    }
  }

  async function saveTemplates() {
    if (!strategy || !currentClientId) return;
    
    setSaving(true);

    try {
      for (const template of strategy.templates) {
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;
        const contentToScan = template.content + (template.subject || '');
        while ((match = variableRegex.exec(contentToScan)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }

        await supabase.from('templates').insert({
          client_id: currentClientId,
          platform: template.type === 'email' ? 'email' : template.type === 'linkedin' ? 'linkedin' : 'twitter',
          type: template.type === 'email' ? 'email' : 'post',
          name: template.name,
          subject: template.subject || null,
          content: template.content,
          variables,
          is_active: true,
        } as any);
      }

      setSaved(true);
    } catch (err) {
      console.error('Error saving templates:', err);
      setError('Failed to save templates');
    } finally {
      setSaving(false);
    }
  }

  const SectionHeader = ({ id, title, icon: Icon, count }: { id: string; title: string; icon: any; count?: number }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-semibold">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary">{count}</Badge>
        )}
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Strategy Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentClient.name} • {currentClient.industry || 'General Marketing'}
          </p>
        </div>

        <div className="flex gap-3">
          {strategy && (
            <Button 
              onClick={exportToPDF} 
              disabled={exporting}
              variant="outline"
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={generateStrategy} 
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {strategy ? 'Regenerate Strategy' : 'Generate AI Strategy'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-destructive font-medium">Generation Failed</p>
            <p className="text-destructive/80 text-sm">{error}</p>
            </div>
            </div>
      )}

      {/* No Strategy Yet */}
      {!strategy && !generating && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Generate Strategy</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Click the button above to generate a comprehensive AI-powered marketing strategy 
              based on {currentClient.name}'s discovery data and goals.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">Goals & KPIs</span>
              <span className="px-3 py-1 bg-muted rounded-full">Channel Strategy</span>
              <span className="px-3 py-1 bg-muted rounded-full">Content Calendar</span>
              <span className="px-3 py-1 bg-muted rounded-full">Email Templates</span>
              <span className="px-3 py-1 bg-muted rounded-full">Timeline & Phases</span>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Generating State */}
      {generating && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Generating Your Strategy</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Claude is analyzing {currentClient.name}'s discovery data and creating a 
              customized marketing strategy. This takes about 30-60 seconds...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Strategy Results */}
      {strategy && !generating && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <Card>
            <SectionHeader id="summary" title="Executive Summary" icon={FileText} />
            {expandedSections.has('summary') && (
              <CardContent className="pt-0 pb-4 px-4">
                <p className="text-muted-foreground leading-relaxed">
                  {strategy.executiveSummary}
                </p>
                {saved && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Strategy saved to database
                  </div>
                )}
            </CardContent>
            )}
          </Card>

          {/* Goals */}
          <Card>
            <SectionHeader id="goals" title="Strategic Goals" icon={Target} count={strategy.goals?.length} />
            {expandedSections.has('goals') && strategy.goals && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-3">
                  {strategy.goals.map((goal, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-medium mb-2">{goal.goal}</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Metric:</span>
                          <div>{goal.metric}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <div className="text-primary font-medium">{goal.target}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline:</span>
                          <div>{goal.timeline}</div>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Target Persona */}
          <Card>
            <SectionHeader id="persona" title="Target Persona" icon={Users} />
            {expandedSections.has('persona') && strategy.targetPersona && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Title</div>
                    <div className="font-medium">{strategy.targetPersona.title}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Industry</div>
                    <div className="font-medium">{strategy.targetPersona.industry}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Pain Points</div>
                    <ul className="space-y-1">
                      {strategy.targetPersona.painPoints?.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-destructive">•</span> {p}
                        </li>
                      ))}
                    </ul>
                    </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Motivations</div>
                    <ul className="space-y-1">
                      {strategy.targetPersona.motivations?.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500">•</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Channel Strategy */}
          <Card>
            <SectionHeader id="channels" title="Channel Strategy" icon={Zap} count={strategy.channelStrategy?.length} />
            {expandedSections.has('channels') && strategy.channelStrategy && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-4">
                  {strategy.channelStrategy.map((channel, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium capitalize">{channel.channel}</div>
                        <Badge variant={channel.priority === 'high' ? 'default' : 'secondary'}>
                          {channel.priority} priority
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Tactics</div>
                          <ul className="space-y-1">
                            {channel.tactics?.map((t, j) => (
                              <li key={j}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Frequency</div>
                          <div>{channel.frequency}</div>
                          <div className="text-muted-foreground mt-2 mb-1">Budget</div>
                          <div>{channel.budget}</div>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Templates */}
          <Card>
            <SectionHeader id="templates" title="Message Templates" icon={FileText} count={strategy.templates?.length} />
            {expandedSections.has('templates') && strategy.templates && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-4">
                  {strategy.templates.map((template, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{template.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <button
                            onClick={() => copyTemplate(template)}
                            className="p-2 hover:bg-muted rounded transition-colors"
                          >
                            {copiedTemplate === template.name ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {template.subject && (
                        <div className="text-sm mb-2">
                          <span className="text-muted-foreground">Subject:</span> {template.subject}
                        </div>
                      )}
                      <pre className="text-sm whitespace-pre-wrap bg-background/50 p-3 rounded border max-h-48 overflow-y-auto">
                        {template.content}
                      </pre>
                    </div>
                  ))}
                </div>
                <Button onClick={saveTemplates} disabled={saving || saved} className="mt-4 gap-2">
                {saving ? (
                  <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Templates...
                  </>
                ) : saved ? (
                  <>
                      <CheckCircle className="w-4 h-4" />
                      Templates Saved
                  </>
                ) : (
                  <>
                      <Download className="w-4 h-4" />
                      Save Templates to Library
                  </>
                )}
              </Button>
              </CardContent>
            )}
          </Card>

          {/* KPIs */}
          <Card>
            <SectionHeader id="kpis" title="Key Performance Indicators" icon={BarChart3} count={strategy.kpis?.length} />
            {expandedSections.has('kpis') && strategy.kpis && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {strategy.kpis.map((kpi, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-medium mb-1">{kpi.metric}</div>
                      <div className="text-2xl font-bold text-primary mb-1">{kpi.target}</div>
                      <div className="text-sm text-muted-foreground">{kpi.importance}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <SectionHeader id="timeline" title="Implementation Timeline" icon={Clock} />
            {expandedSections.has('timeline') && strategy.timeline && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-4">
                  {['phase1', 'phase2', 'phase3'].map((phaseKey, i) => {
                    const phase = strategy.timeline[phaseKey as keyof typeof strategy.timeline];
                    if (!phase) return null;
                    return (
                      <div key={phaseKey} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {i + 1}
                  </div>
                  <div>
                            <div className="font-medium">{phase.name}</div>
                            <div className="text-sm text-muted-foreground">{phase.duration}</div>
                          </div>
                        </div>
                        <div className="ml-11">
                          <div className="text-sm mb-2">{phase.focus}</div>
                          <div className="flex flex-wrap gap-2">
                            {phase.milestones?.map((m, j) => (
                              <span key={j} className="px-2 py-1 bg-background rounded text-xs">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                  </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Next Steps */}
          <Card>
            <SectionHeader id="next" title="Immediate Next Steps" icon={Rocket} count={strategy.nextSteps?.length} />
            {expandedSections.has('next') && strategy.nextSteps && (
              <CardContent className="pt-0 pb-4 px-4">
                <ol className="space-y-2">
                  {strategy.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            )}
            </Card>

          {/* AI Chat Refinement Button */}
          {!chatOpen && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                onClick={() => setChatOpen(true)}
                className="rounded-full w-14 h-14 shadow-lg gap-0"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI Chat Panel */}
      {chatOpen && strategy && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col max-h-[500px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Strategy Assistant</h3>
                <p className="text-xs text-muted-foreground">Refine your strategy with AI</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Ask me to update your strategy!</p>
                <p className="mt-2 text-xs">Examples:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>"Add more focus on LinkedIn outreach"</li>
                  <li>"Make the email templates more casual"</li>
                  <li>"Increase the budget allocation for ads"</li>
                </ul>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {refining && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating strategy...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                refineStrategy();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What would you like to change?"
                className="flex-1 px-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={refining}
              />
              <Button
                type="submit"
                disabled={!chatInput.trim() || refining}
                className="px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
              </div>
            </div>
      )}
    </div>
  );
}

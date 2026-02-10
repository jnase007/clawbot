import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { DiscoveryPDF } from '@/components/pdf/DiscoveryPDF';
import { useClient } from '@/components/ClientProvider';
import { useToast, ToastContainer } from '@/components/Toast';
import { 
  ClipboardList, Building2, Globe, Sparkles, Send,
  Save, AlertCircle, Loader2, FileDown, MessageSquare,
  Check, ChevronDown, ChevronRight, RefreshCw,
  Target, Users, Wrench, BarChart3, Lightbulb, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DiscoveryData {
  businessDescription: string;
  targetAudience: string;
  uniqueValueProposition: string;
  industry: string;
  currentMarketingChannels: string[];
  currentMonthlyBudget: string;
  currentPainPoints: string[];
  competitors: string[];
  competitorAnalysis: string;
  primaryGoals: string[];
  successMetrics: string[];
  timeline: string;
  existingTools: string[];
  websiteUrl: string;
  socialProfiles: string;
  discoveryNotes: string;
  websiteAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  tone: string;
  keywords: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialData: DiscoveryData = {
  businessDescription: '',
  targetAudience: '',
  uniqueValueProposition: '',
  industry: '',
  currentMarketingChannels: [],
  currentMonthlyBudget: '',
  currentPainPoints: [],
  competitors: [],
  competitorAnalysis: '',
  primaryGoals: [],
  successMetrics: [],
  timeline: '',
  existingTools: [],
  websiteUrl: '',
  socialProfiles: '',
  discoveryNotes: '',
  tone: '',
  keywords: [],
};

export default function Discovery() {
  const navigate = useNavigate();
  const { currentClient, refreshClients } = useClient();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toasts, removeToast, success, error: toastError, loading } = useToast();
  
  // Basic inputs
  const [clientName, setClientName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // States
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat refinement
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [refining, setRefining] = useState(false);
  
  // Sections expansion
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'audience', 'analysis'])
  );
  
  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill from current client
  useEffect(() => {
    if (currentClient) {
      setClientName(currentClient.name);
      setWebsiteUrl(currentClient.website || '');
    }
  }, [currentClient]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!discovery || !clientName.trim() || saving) return;

    try {
      const response = await fetch('/api/save-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          industry: discovery.industry || 'General',
          websiteUrl: discovery.websiteUrl,
          discoveryData: discovery,
        }),
      });

      if (response.ok) {
        setSaved(true);
        success('Discovery auto-saved');
        refreshClients();
      }
    } catch (err) {
      console.log('Auto-save failed:', err);
    }
  }, [discovery, clientName, saving, success, refreshClients]);

  // Trigger auto-save when discovery changes
  useEffect(() => {
    if (!discovery || saved) return;

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [discovery, saved, performAutoSave]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  async function analyzeWebsite() {
    if (!clientName.trim() || !websiteUrl.trim()) {
      setError('Please enter both client name and website URL');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setDiscovery(null);

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          websiteUrl: websiteUrl.trim().startsWith('http') 
            ? websiteUrl.trim() 
            : `https://${websiteUrl.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const result = await response.json();
      
      if (result.analysis) {
        setDiscovery({
          ...initialData,
          ...result.analysis,
          websiteUrl: websiteUrl.trim(),
        });
        setChatMessages([{
          role: 'assistant',
          content: `I've analyzed ${clientName}'s website and created a discovery document. Review the sections below and let me know if you'd like me to adjust anything - just type in the chat!`,
          timestamp: new Date(),
        }]);
        setChatOpen(true);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze website');
    } finally {
      setAnalyzing(false);
    }
  }

  async function refineDiscovery() {
    if (!chatInput.trim() || !discovery) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setRefining(true);

    try {
      const response = await fetch('/api/refine-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDiscovery: discovery,
          userMessage: userMessage.content,
          clientName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine discovery');
      }

      const result = await response.json();

      if (result.discovery) {
        setDiscovery(result.discovery);
        setSaved(false);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.message || "I've updated the discovery based on your feedback.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I couldn't update the discovery. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setRefining(false);
    }
  }

  async function saveDiscovery() {
    if (!discovery || !clientName.trim()) return;

    setSaving(true);
    setError(null);
    const loadingId = loading('Saving discovery...');

    try {
      const response = await fetch('/api/save-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          industry: discovery.industry || 'General',
          websiteUrl: discovery.websiteUrl,
          discoveryData: discovery,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save discovery');
      }

      await response.json();
      setSaved(true);
      refreshClients();
      removeToast(loadingId);
      success('Discovery saved successfully!');

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Discovery saved! You can now export as PDF or generate an AI strategy.',
        timestamp: new Date(),
      }]);

    } catch (err) {
      removeToast(loadingId);
      toastError(err instanceof Error ? err.message : 'Failed to save');
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function exportToPDF() {
    if (!discovery) return;
    
    setExporting(true);
    try {
      const blob = await pdf(
        <DiscoveryPDF 
          discovery={discovery} 
          clientName={clientName} 
          clientIndustry={discovery.industry}
          clientLogo={currentClient?.logo_url || undefined}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clientName.replace(/\s+/g, '_')}_Discovery.pdf`;
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

  function goToStrategy() {
    navigate('/dashboard/strategy');
  }

  const SectionHeader = ({ id, title, icon: Icon, badge }: { id: string; title: string; icon: any; badge?: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-semibold">{title}</span>
        {badge && <Badge variant="secondary">{badge}</Badge>}
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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          Smart Discovery
        </h1>
        <p className="text-muted-foreground mt-1">
          Enter client name + website URL → AI analyzes and creates discovery → Chat to refine → Export PDF
        </p>
      </div>

      {/* Quick Start - Before Analysis */}
      {!discovery && !analyzing && (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">AI-Powered Discovery</h2>
                <p className="text-muted-foreground">
                  Just enter the client's name and website. Our AI will analyze their site 
                  and create a comprehensive discovery document for you.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Acme Dental"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website URL *</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="e.g., acmedental.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button 
                  onClick={analyzeWebsite}
                  disabled={!clientName.trim() || !websiteUrl.trim()}
                  className="w-full gap-2 py-6 text-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze Website & Generate Discovery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <Card className="mb-8">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Analyzing {clientName}'s Website</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Claude is reviewing their website content, services, and online presence 
              to create a comprehensive discovery document...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discovery Results */}
      {discovery && !analyzing && (
        <>
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold">{clientName}</h2>
                <p className="text-sm text-muted-foreground">{discovery.industry}</p>
              </div>
              {saved && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDiscovery(null);
                  setSaved(false);
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Start Over
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={exporting}
                className="gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={saveDiscovery}
                disabled={saving || saved}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Button onClick={goToStrategy} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Strategy
              </Button>
            </div>
          </div>

          {/* Discovery Sections */}
          <div className="grid gap-4 mb-6">
            {/* Business Overview */}
            <Card>
              <SectionHeader id="overview" title="Business Overview" icon={Building2} />
              {expandedSections.has('overview') && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{discovery.businessDescription || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unique Value Proposition</label>
                    <p className="mt-1">{discovery.uniqueValueProposition || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tone</label>
                    <Badge variant="outline" className="ml-2">{discovery.tone || 'Professional'}</Badge>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Target Audience */}
            <Card>
              <SectionHeader id="audience" title="Target Audience" icon={Users} />
              {expandedSections.has('audience') && (
                <CardContent className="pt-0 pb-4 px-4">
                  <p>{discovery.targetAudience || 'Not available'}</p>
                </CardContent>
              )}
            </Card>

            {/* Website Analysis */}
            {discovery.websiteAnalysis && (
              <Card>
                <SectionHeader id="analysis" title="Website Analysis" icon={Lightbulb} />
                {expandedSections.has('analysis') && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                        <ul className="space-y-1 text-sm">
                          {discovery.websiteAnalysis.strengths?.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <h4 className="font-medium text-orange-600 mb-2">Weaknesses</h4>
                        <ul className="space-y-1 text-sm">
                          {discovery.websiteAnalysis.weaknesses?.map((w, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <h4 className="font-medium text-blue-600 mb-2">Opportunities</h4>
                        <ul className="space-y-1 text-sm">
                          {discovery.websiteAnalysis.opportunities?.map((o, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Marketing Channels */}
            <Card>
              <SectionHeader 
                id="channels" 
                title="Current Marketing" 
                icon={Target} 
                badge={discovery.currentMarketingChannels?.length?.toString()}
              />
              {expandedSections.has('channels') && (
                <CardContent className="pt-0 pb-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    {discovery.currentMarketingChannels?.map((channel, i) => (
                      <Badge key={i} variant="secondary">{channel}</Badge>
                    ))}
                  </div>
                  {discovery.currentPainPoints?.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Pain Points</label>
                      <div className="flex flex-wrap gap-2">
                        {discovery.currentPainPoints.map((point, i) => (
                          <Badge key={i} variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Competition */}
            <Card>
              <SectionHeader 
                id="competition" 
                title="Competition" 
                icon={Users}
                badge={discovery.competitors?.length?.toString()}
              />
              {expandedSections.has('competition') && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {discovery.competitors?.map((comp, i) => (
                      <Badge key={i} variant="outline">{comp}</Badge>
                    ))}
                  </div>
                  {discovery.competitorAnalysis && (
                    <p className="text-sm text-muted-foreground">{discovery.competitorAnalysis}</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Goals */}
            <Card>
              <SectionHeader 
                id="goals" 
                title="Goals & Metrics" 
                icon={BarChart3}
                badge={discovery.primaryGoals?.length?.toString()}
              />
              {expandedSections.has('goals') && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Primary Goals</label>
                    <ul className="space-y-2">
                      {discovery.primaryGoals?.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Success Metrics</label>
                    <div className="flex flex-wrap gap-2">
                      {discovery.successMetrics?.map((metric, i) => (
                        <Badge key={i} variant="secondary">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                  {discovery.timeline && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Recommended Timeline</label>
                      <Badge className="ml-2">{discovery.timeline}</Badge>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Tools & Keywords */}
            <Card>
              <SectionHeader id="tools" title="Tools & Keywords" icon={Wrench} />
              {expandedSections.has('tools') && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  {discovery.existingTools?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Current Tools</label>
                      <div className="flex flex-wrap gap-2">
                        {discovery.existingTools.map((tool, i) => (
                          <Badge key={i} variant="outline">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {discovery.keywords?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Target Keywords</label>
                      <div className="flex flex-wrap gap-2">
                        {discovery.keywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="bg-primary/10">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Chat Refinement Panel */}
          <div className={`fixed bottom-6 right-6 z-50 transition-all ${chatOpen ? 'w-96' : 'w-auto'}`}>
            {chatOpen ? (
              <Card className="shadow-2xl border-2 border-primary/20">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Refine Discovery</span>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-muted rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div 
                  ref={chatContainerRef}
                  className="h-80 overflow-y-auto p-4 space-y-3"
                >
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
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
                      <div className="bg-muted px-3 py-2 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && refineDiscovery()}
                      placeholder="Ask to change anything..."
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:outline-none"
                    />
                    <Button 
                      size="sm" 
                      onClick={refineDiscovery}
                      disabled={!chatInput.trim() || refining}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Examples: "Add more pain points" • "Change the tone to friendly" • "Add competitor XYZ"
                  </p>
                </div>
              </Card>
            ) : (
              <Button 
                onClick={() => setChatOpen(true)}
                className="rounded-full w-14 h-14 shadow-lg"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

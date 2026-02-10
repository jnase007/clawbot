import { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, Copy, Check, Download,
  Linkedin, Facebook, Search, PenTool, Loader2,
  Lightbulb, TrendingUp, HelpCircle, BarChart3,
  AlertCircle, RefreshCw, Clock, ChevronDown, Info,
  CheckCircle
} from 'lucide-react';
import { useClient } from '@/components/ClientProvider';
import { CLIENT_PRESETS } from '@/lib/types';
import { supabase } from '@/lib/supabase';

type ContentType = 'blog' | 'meta' | 'google' | 'linkedin';

interface GeneratedContent {
  type: ContentType;
  content: string;
  headline?: string;
  description?: string;
  metaDescription?: string;
  title?: string;
  wordCount?: number;
  seoScore?: number;
  geoOptimizations?: string[];
  faqSection?: Array<{ question: string; answer: string }>;
  ads?: any[];
  searchAds?: any[];
  generatedAt?: string;
}

interface ContentHistory {
  id: string;
  type: ContentType;
  topic: string;
  content: GeneratedContent;
  createdAt: string;
}

const API_URL = '/api/generate-content';

// Get preset key from client name
function getPresetKey(clientName?: string | null): string | null {
  if (!clientName) return null;
  const name = clientName.toLowerCase();
  if (name.includes('equitymd') || name.includes('equity')) return 'equitymd';
  if (name.includes('projecthunter') || name.includes('hunter')) return 'projecthunter';
  if (name.includes('comply')) return 'comply';
  if (name.includes('brandastic')) return 'brandastic';
  return null;
}

export default function ContentStudio() {
  const { currentClient, currentClientId } = useClient();
  const [activeTab, setActiveTab] = useState<ContentType>('blog');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ContentHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Get client-specific defaults
  const presetKey = getPresetKey(currentClient?.name);
  const preset = presetKey ? CLIENT_PRESETS[presetKey] : null;

  // Load content history from database
  useEffect(() => {
    async function loadHistory() {
      if (!currentClientId) {
        setLoadingHistory(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('generated_content')
          .select('*')
          .eq('client_id', currentClientId)
          .order('created_at', { ascending: false })
          .limit(20) as { data: any[] | null };

        if (data) {
          const historyItems: ContentHistory[] = data.map((row: any) => ({
            id: row.id,
            type: row.content_type as ContentType,
            topic: row.topic,
            content: row.content_data,
            createdAt: row.created_at,
          }));
          setHistory(historyItems);
        }
      } catch (err) {
        console.log('Error loading history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [currentClientId]);

  // Suggested topics based on client
  const getSuggestedTopics = () => {
    if (preset?.content_topics) return preset.content_topics;
    return ['AI Marketing Strategies', 'Lead Generation Tips', 'Digital Marketing Trends'];
  };

  // Update defaults when client changes
  useEffect(() => {
    if (currentClient) {
      setAudience(currentClient.target_audience || preset?.target_audience as string || 'business professionals');
      setKeywords(preset?.keywords?.join(', ') || currentClient.keywords?.join(', ') || '');
    }
  }, [currentClient?.id]);

  const tabs = [
    { id: 'blog', label: 'Blog Post (2000+ words)', icon: FileText, color: 'text-blue-400', description: 'SEO & GEO optimized' },
    { id: 'meta', label: 'Meta Ads', icon: Facebook, color: 'text-indigo-400', description: 'Facebook & Instagram' },
    { id: 'google', label: 'Google Ads', icon: Search, color: 'text-green-400', description: 'Search & Display' },
    { id: 'linkedin', label: 'LinkedIn Ads', icon: Linkedin, color: 'text-sky-400', description: 'B2B Professional' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or product/service');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);
    setSaved(false);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          topic: topic.trim(),
          audience,
          tone,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          clientName: currentClient?.name || 'Brandastic',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Generation failed');
      }

      const result = await response.json();
      result.generatedAt = new Date().toISOString();
      setGeneratedContent(result);

// Save to database
        if (currentClientId) {
          try {
            const insertData = {
              client_id: currentClientId,
              content_type: activeTab,
              topic: topic.trim(),
              audience,
              tone,
              keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
              content_data: result,
            };
            const { data: savedRow } = await (supabase
              .from('generated_content')
              .insert(insertData as any)
              .select('id, created_at')
              .single()) as { data: any };

          if (savedRow) {
            // Add to history
            const historyItem: ContentHistory = {
              id: savedRow.id,
              type: activeTab,
              topic,
              content: result,
              createdAt: savedRow.created_at,
            };
            setHistory(prev => [historyItem, ...prev.slice(0, 19)]);
            setSaved(true);
          }
        } catch (saveErr) {
          console.log('Auto-save failed, content still available:', saveErr);
        }
      } else {
        // No client selected, just add to local history
        const historyItem: ContentHistory = {
          id: Date.now().toString(),
          type: activeTab,
          topic,
          content: result,
          createdAt: new Date().toISOString(),
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text?: string) => {
    const contentToCopy = text || generatedContent?.content || '';
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    
    const filename = `${activeTab}-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
    const blob = new Blob([generatedContent.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item: ContentHistory) => {
    setActiveTab(item.type);
    setTopic(item.topic);
    setGeneratedContent(item.content);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <PenTool className="w-7 h-7 text-purple-500" />
              Content Studio
            </h1>
            <p className="text-gray-400 mt-1">
              {currentClient 
                ? `Creating content for ${currentClient.name} • ${preset?.industry || currentClient.industry || 'General'}`
                : 'Select a client to customize content generation'}
            </p>
          </div>
          
          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-4 md:mt-0 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            History ({history.length})
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* History Dropdown */}
        {showHistory && (
          <div className="mb-6 bg-slate-800/80 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-3">Recent Generations</h3>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No content generated yet</p>
                <p className="text-sm">Generated content will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">{item.topic}</span>
                      <span className="text-xs text-gray-400 uppercase">{item.type}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Type Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ContentType);
                setGeneratedContent(null);
                setError(null);
              }}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                activeTab === tab.id
                  ? 'bg-slate-700 border-purple-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? tab.color : ''}`} />
              <span className="font-medium text-sm text-center">{tab.label}</span>
              <span className="text-xs opacity-60">{tab.description}</span>
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/70 backdrop-blur rounded-xl p-5 md:p-6 mb-6 border border-slate-700">
          {/* Client Context Alert */}
          {currentClient && (
            <div className="mb-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                <Info className="w-4 h-4" />
                Creating content for {currentClient.name}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-400">Quick topics:</span>
                {getSuggestedTopics().slice(0, 4).map((suggestedTopic, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(suggestedTopic)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-gray-300 rounded transition-colors"
                  >
                    {suggestedTopic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {activeTab === 'blog' ? '📝 Blog Topic *' : '🎯 Product/Service *'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={activeTab === 'blog' 
                ? `e.g., ${getSuggestedTopics()[0] || 'Marketing Strategies'} for ${currentClient?.name || 'Your Business'}` 
                : `e.g., ${currentClient?.name || 'Your'} ${preset?.industry || 'Marketing'} Services`}
              className="w-full px-4 py-3 bg-slate-900/50 text-white text-lg rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Secondary Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., dental practice owners"
                className="w-full px-4 py-2.5 bg-slate-900/50 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/50 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="educational">Educational</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., AI marketing, dental SEO"
                className="w-full px-4 py-2.5 bg-slate-900/50 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Generation Failed</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {activeTab === 'blog' ? 'Generating 2000+ words...' : 'Generating ads...'}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate {activeTab === 'blog' ? 'Blog Post' : `${tabs.find(t => t.id === activeTab)?.label}`}
              </>
            )}
          </button>
          
          {activeTab === 'blog' && !isGenerating && (
            <p className="mt-2 text-sm text-gray-500">
              ⏱️ Blog generation takes 30-60 seconds for 2000+ words with SEO & GEO optimization
            </p>
          )}
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="bg-slate-800/70 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
            {/* Content Header */}
            <div className="p-4 md:p-5 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Content Generated Successfully
                    {saved && currentClientId && (
                      <span className="flex items-center gap-1 text-sm font-normal text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Auto-saved
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {generatedContent.generatedAt && new Date(generatedContent.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy()}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Metrics (Blog only) */}
            {generatedContent.type === 'blog' && (
              <div className="p-4 md:p-5 border-b border-slate-700 bg-slate-900/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <FileText className="w-4 h-4" />
                      Word Count
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {generatedContent.wordCount?.toLocaleString() || '—'}
                    </div>
                    {generatedContent.wordCount && generatedContent.wordCount >= 2000 ? (
                      <div className="text-xs text-green-400">✓ Meets 2000+ requirement</div>
                    ) : (
                      <div className="text-xs text-yellow-400">⚠ Below target</div>
                    )}
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      SEO Score
                    </div>
                    <div className={`text-2xl font-bold ${(generatedContent.seoScore || 0) >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {generatedContent.seoScore || '—'}/100
                    </div>
                    <div className="text-xs text-gray-400">Search optimized</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <BarChart3 className="w-4 h-4" />
                      GEO Optimizations
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {generatedContent.geoOptimizations?.length || 0}
                    </div>
                    <div className="text-xs text-gray-400">AI-citable elements</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <HelpCircle className="w-4 h-4" />
                      FAQs Included
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {generatedContent.faqSection?.length || 0}
                    </div>
                    <div className="text-xs text-gray-400">For featured snippets</div>
                  </div>
                </div>
              </div>
            )}

            {/* Title & Meta (Blog only) */}
            {generatedContent.type === 'blog' && generatedContent.title && (
              <div className="p-4 md:p-5 border-b border-slate-700 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">SEO Title</label>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold text-white flex-1">{generatedContent.title}</p>
                    <button onClick={() => handleCopy(generatedContent.title)} className="p-2 hover:bg-slate-700 rounded">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                {generatedContent.metaDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Meta Description</label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-300 flex-1">{generatedContent.metaDescription}</p>
                      <button onClick={() => handleCopy(generatedContent.metaDescription)} className="p-2 hover:bg-slate-700 rounded">
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Headline for Ads */}
            {generatedContent.headline && generatedContent.type !== 'blog' && (
              <div className="p-4 md:p-5 border-b border-slate-700">
                <label className="block text-sm font-medium text-gray-400 mb-1">Headline</label>
                <p className="text-xl font-semibold text-white">{generatedContent.headline}</p>
              </div>
            )}

            {/* Main Content */}
            <div className="p-4 md:p-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {activeTab === 'blog' ? 'Full Blog Post' : 'Ad Copy'}
              </label>
              <div className="bg-slate-900/50 rounded-lg p-4 md:p-5 overflow-auto max-h-[600px] prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed">
                  {generatedContent.content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Empty State / Tips */}
        {!generatedContent && !isGenerating && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Ready to Generate</h3>
                <p className="text-sm text-gray-400">Enter your topic above and click Generate</p>
              </div>
            </div>
            
            {activeTab === 'blog' && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">2000+</div>
                  <div className="text-xs text-gray-400">Words minimum</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">SEO</div>
                  <div className="text-xs text-gray-400">Optimized</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">GEO</div>
                  <div className="text-xs text-gray-400">AI-citable</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">5-7</div>
                  <div className="text-xs text-gray-400">FAQs included</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, 
  Linkedin, Facebook, Search, PenTool, Loader2,
  Target, Lightbulb
} from 'lucide-react';

type ContentType = 'blog' | 'meta' | 'google' | 'linkedin';

interface GeneratedContent {
  type: ContentType;
  content: string;
  headline?: string;
  description?: string;
}

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState<ContentType>('blog');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('dental practice owners');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'blog', label: 'Blog Post', icon: FileText, color: 'text-blue-400' },
    { id: 'meta', label: 'Meta Ads', icon: Facebook, color: 'text-indigo-400' },
    { id: 'google', label: 'Google Ads', icon: Search, color: 'text-green-400' },
    { id: 'linkedin', label: 'LinkedIn Ads', icon: Linkedin, color: 'text-sky-400' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation (in production, call the API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const samples: Record<ContentType, GeneratedContent> = {
      blog: {
        type: 'blog',
        headline: `5 Ways ${topic} is Transforming Dental Marketing`,
        content: `In today's competitive dental market, staying ahead means embracing innovation. Here's how ${topic} is changing the game for dental practices...\n\n## 1. Increased Patient Engagement\nDental practices using ${topic} are seeing 40% higher engagement rates...\n\n## 2. Cost-Effective Marketing\nReduce your marketing spend by up to 30% while improving results...\n\n## 3. Personalized Patient Outreach\nDeliver the right message at the right time...`,
      },
      meta: {
        type: 'meta',
        headline: `Transform Your Dental Practice with ${topic}`,
        description: `Join 500+ dental practices using AI to grow. Get more patients, reduce costs, and scale your marketing effortlessly.`,
        content: `🦷 Struggling to attract new patients?\n\nDiscover how ${topic} is helping dental practices like yours:\n✅ 3x more patient inquiries\n✅ 50% lower cost per lead\n✅ Automated follow-ups\n\nBook your free strategy call today →`,
      },
      google: {
        type: 'google',
        headline: `${topic} for Dentists | Get More Patients`,
        description: `Proven dental marketing solutions. 500+ practices trust us. Free consultation.`,
        content: `Headline 1: ${topic} for Dental Practices\nHeadline 2: Get 3X More Patients\nHeadline 3: AI-Powered Marketing\n\nDescription 1: Join 500+ dental practices growing with AI marketing. Reduce costs, increase patients.\nDescription 2: Free strategy call. See results in 30 days or less.`,
      },
      linkedin: {
        type: 'linkedin',
        headline: `How ${topic} is Revolutionizing Dental Marketing`,
        description: `A message for forward-thinking dental practice owners and CMOs`,
        content: `Attention Dental Marketing Leaders 👋\n\nThe practices that will thrive in 2026 are those embracing ${topic}.\n\nHere's what we're seeing:\n→ 40% reduction in marketing costs\n→ 3x improvement in patient acquisition\n→ Fully automated follow-up sequences\n\nWant to learn how? Let's connect.`,
      },
    };
    
    setGeneratedContent(samples[activeTab]);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <PenTool className="w-8 h-8 text-purple-500" />
            Content Studio
          </h1>
          <p className="text-gray-400 mt-1">Generate blog posts and ads with AI</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ContentType);
                setGeneratedContent(null);
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">
                {activeTab === 'blog' ? 'Blog Topic' : 'Product/Service'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={activeTab === 'blog' ? 'e.g., AI Marketing for Dental Practices' : 'e.g., Brandastic AI Marketing Services'}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., dental practice owners"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {activeTab === 'blog' ? 'Blog Post' : 'Ads'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Generated Content
              </h2>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {generatedContent.headline && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Headline</label>
                <p className="text-xl font-semibold text-white">{generatedContent.headline}</p>
              </div>
            )}

            {generatedContent.description && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <p className="text-gray-300">{generatedContent.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Content</label>
              <div className="bg-slate-900/50 rounded-lg p-4 whitespace-pre-wrap text-gray-300 font-mono text-sm">
                {generatedContent.content}
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {!generatedContent && (
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-400" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-gray-400">
              <li>• Be specific with your topic for better results</li>
              <li>• Include your target audience for personalized content</li>
              <li>• Try different tones to find what resonates</li>
              <li>• Edit the generated content to match your brand voice</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm">
                💡 <span className="text-white">CLI command:</span>
              </p>
              <code className="block mt-2 text-purple-400 font-mono text-sm bg-slate-900/50 p-3 rounded-lg">
                clawbot content {activeTab === 'blog' ? 'blog --topic "Your Topic"' : `${activeTab}-ads --product "Your Product"`}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

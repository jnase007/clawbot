import { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, 
  Linkedin, Facebook, Search, PenTool, Loader2,
  Target, Lightbulb, TrendingUp, HelpCircle, BarChart3
} from 'lucide-react';

type ContentType = 'blog' | 'meta' | 'google' | 'linkedin';

interface GeneratedContent {
  type: ContentType;
  content: string;
  headline?: string;
  description?: string;
  wordCount?: number;
  seoScore?: number;
  geoOptimizations?: string[];
  faqSection?: Array<{ question: string; answer: string }>;
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
        headline: `The Complete Guide to ${topic} for Dental Practices in 2026`,
        wordCount: 2247,
        seoScore: 92,
        geoOptimizations: [
          'Clear definition in first paragraph for AI citation',
          '7 statistics with sources for credibility',
          '6 FAQs with complete, quotable answers',
          'Featured snippet target in intro',
          'Entity mentions (Google, Meta, industry standards)'
        ],
        faqSection: [
          { question: `What is ${topic}?`, answer: `${topic} is a strategic approach that leverages artificial intelligence to automate and optimize marketing efforts specifically for dental practices, including patient acquisition, retention, and engagement campaigns.` },
          { question: `How much does ${topic} cost?`, answer: `Most dental practices invest between $2,000-$10,000 per month in ${topic} solutions, with an average ROI of 3-5x within the first 6 months.` },
          { question: `Is ${topic} right for my practice?`, answer: `${topic} is ideal for dental practices seeing 50+ new patients per month or those looking to scale. Smaller practices can start with basic automation before expanding.` },
        ],
        content: `# The Complete Guide to ${topic} for Dental Practices in 2026

**Meta Description:** Discover how ${topic} is helping dental practices increase patient acquisition by 40% while reducing marketing costs. Complete guide with strategies, statistics, and actionable steps.

## Table of Contents
1. What is ${topic}?
2. Why Dental Practices Need ${topic} in 2026
3. Key Benefits and Statistics
4. Implementation Strategies
5. Common Challenges and Solutions
6. Case Studies and Results
7. Getting Started with Brandastic
8. FAQs

---

## What is ${topic}?

${topic} is defined as the strategic application of artificial intelligence and machine learning technologies to automate, optimize, and personalize marketing efforts for dental practices. According to a 2025 Dental Marketing Association study, 67% of high-growth dental practices now use some form of AI in their marketing stack.

In practical terms, ${topic} encompasses:
- **Automated patient outreach** via email and SMS
- **AI-powered ad optimization** across Google, Meta, and LinkedIn
- **Predictive analytics** for patient behavior
- **Content generation** for blogs and social media
- **Chatbots** for 24/7 patient engagement

> "Practices using ${topic} are seeing 40% higher patient acquisition rates compared to traditional marketing methods." — Dental Economics Report, 2025

## Why Dental Practices Need ${topic} in 2026

The dental marketing landscape has fundamentally shifted. Here's why ${topic} is no longer optional:

### 1. Rising Competition
The average metropolitan area now has 4.2 dental practices per 10,000 residents (up from 3.1 in 2020). Standing out requires smarter, not just louder, marketing.

### 2. Patient Expectations Have Changed
**78% of patients** expect personalized communication from healthcare providers. Generic marketing no longer converts.

### 3. Cost Efficiency Demands
With average patient acquisition costs rising to $250-400, practices need ${topic} to reduce waste and improve targeting.

## Key Benefits: The Numbers Don't Lie

| Metric | Traditional Marketing | With ${topic} | Improvement |
|--------|----------------------|---------------|-------------|
| Cost Per Lead | $85 | $34 | -60% |
| Lead to Patient Conversion | 12% | 28% | +133% |
| Time to Response | 24 hours | 2 minutes | -99% |
| Patient Retention | 65% | 82% | +26% |

*Source: Brandastic Client Data, 2024-2025 (n=127 dental practices)*

## Implementation Strategies

### Step 1: Audit Your Current Marketing
Before implementing ${topic}, understand your baseline metrics...

### Step 2: Choose the Right AI Tools
Not all AI marketing tools are created equal. Look for:
- HIPAA compliance (critical for dental)
- Integration with your practice management software
- Proven results in healthcare/dental niche

### Step 3: Start with High-Impact Automations
Begin with:
1. Appointment reminder sequences
2. Review request automation
3. Reactivation campaigns for dormant patients

## Case Study: Pacific Dental Group

Pacific Dental Group implemented ${topic} through Brandastic in Q2 2025:

**Results after 6 months:**
- New patient inquiries: +127%
- Cost per acquisition: -45%
- Google review rating: 4.2 → 4.8 stars
- Monthly revenue: +$47,000

## Getting Started with Brandastic

Brandastic specializes in ${topic} for dental and healthcare practices. Our AI-powered marketing platform includes:

✅ Custom AI agent trained on your practice
✅ Multi-platform ad optimization
✅ Automated patient engagement sequences
✅ Real-time analytics dashboard
✅ HIPAA-compliant infrastructure

**Ready to transform your practice?** [Contact Brandastic](/contact) for a free marketing audit.

---

## Frequently Asked Questions

**Q: What is ${topic}?**
A: ${topic} is a strategic approach that leverages artificial intelligence to automate and optimize marketing efforts specifically for dental practices.

**Q: How much does ${topic} cost?**
A: Most dental practices invest between $2,000-$10,000 per month, with ROI typically achieved within 90 days.

**Q: Will this work for my small practice?**
A: Yes! We have solutions for practices of all sizes, starting at $1,500/month.

**Q: Is it HIPAA compliant?**
A: Absolutely. All Brandastic solutions are built with HIPAA compliance as a foundation.

**Q: How long until I see results?**
A: Most practices see measurable improvements within 30-60 days.

**Q: Do I need technical expertise?**
A: No. Brandastic handles all technical implementation and ongoing optimization.

---

*This article was last updated in February 2026. For the latest insights on ${topic}, subscribe to the Brandastic newsletter.*`,
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

            {/* SEO/GEO Metrics for Blog Posts */}
            {generatedContent.type === 'blog' && generatedContent.wordCount && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Word Count
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {generatedContent.wordCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400">✓ 2000+ minimum</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    SEO Score
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {generatedContent.seoScore}/100
                  </div>
                  <div className="text-xs text-gray-400">Optimized for search</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <BarChart3 className="w-4 h-4" />
                    GEO Ready
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {generatedContent.geoOptimizations?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">AI citation optimizations</div>
                </div>
              </div>
            )}

            {/* GEO Optimizations */}
            {generatedContent.geoOptimizations && generatedContent.geoOptimizations.length > 0 && (
              <div className="mb-4 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-2">
                  <Sparkles className="w-4 h-4" />
                  GEO Optimizations (for AI Citability)
                </div>
                <ul className="space-y-1">
                  {generatedContent.geoOptimizations.map((opt, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400">✓</span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAQ Preview */}
            {generatedContent.faqSection && generatedContent.faqSection.length > 0 && (
              <div className="mb-4 bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-2">
                  <HelpCircle className="w-4 h-4" />
                  FAQ Section ({generatedContent.faqSection.length} questions)
                </div>
                <div className="space-y-2">
                  {generatedContent.faqSection.slice(0, 3).map((faq, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-white font-medium">Q: {faq.question}</p>
                      <p className="text-gray-400 text-xs mt-0.5">A: {faq.answer.substring(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <div className="bg-slate-900/50 rounded-lg p-4 whitespace-pre-wrap text-gray-300 text-sm max-h-96 overflow-y-auto">
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
              {activeTab === 'blog' ? 'Blog Post Features' : 'Quick Tips'}
            </h3>
            
            {activeTab === 'blog' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white mb-1">2000+</div>
                    <div className="text-sm text-gray-400">Minimum word count</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400 mb-1">SEO</div>
                    <div className="text-sm text-gray-400">Optimized for search</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400 mb-1">GEO</div>
                    <div className="text-sm text-gray-400">AI-citable content</div>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    SEO-optimized with keyword targeting, meta tags, and heading structure
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    GEO-ready with quotable stats, FAQs, and clear definitions for AI citation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">✓</span>
                    5-7 FAQs included for featured snippets and AI assistants
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">✓</span>
                    Internal linking suggestions for better site structure
                  </li>
                </ul>
              </div>
            ) : (
              <ul className="space-y-2 text-gray-400">
                <li>• Be specific with your product/service for better results</li>
                <li>• Include your target audience for personalized content</li>
                <li>• Try different tones to find what resonates</li>
                <li>• Edit the generated content to match your brand voice</li>
              </ul>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm">
                💡 <span className="text-white">CLI command:</span>
              </p>
              <code className="block mt-2 text-purple-400 font-mono text-sm bg-slate-900/50 p-3 rounded-lg">
                clawbot content {activeTab === 'blog' ? 'blog --topic "Your Topic" --words 2500' : `${activeTab}-ads --product "Your Product"`}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

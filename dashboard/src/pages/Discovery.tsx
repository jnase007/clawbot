import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { DiscoveryPDF } from '@/components/pdf/DiscoveryPDF';
import { 
  ClipboardList, Building2, Target, Users, 
  Wrench, ChevronRight, ChevronLeft, Check, Sparkles,
  Save, AlertCircle, Loader2, FileDown
} from 'lucide-react';

const API_URL = '/api/save-discovery';

interface DiscoveryData {
  // Business Overview
  businessDescription: string;
  targetAudience: string;
  uniqueValueProposition: string;
  
  // Current State
  currentMarketingChannels: string[];
  currentMonthlyBudget: string;
  currentPainPoints: string[];
  
  // Competitors
  competitors: string[];
  competitorAnalysis: string;
  
  // Goals
  primaryGoals: string[];
  successMetrics: string[];
  timeline: string;
  
  // Technical
  existingTools: string[];
  websiteUrl: string;
  socialProfiles: string;
  
  // Notes
  discoveryNotes: string;
}

const initialData: DiscoveryData = {
  businessDescription: '',
  targetAudience: '',
  uniqueValueProposition: '',
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
};

const marketingChannels = [
  'Google Ads', 'Facebook Ads', 'Instagram', 'LinkedIn', 'Twitter/X',
  'Email Marketing', 'SEO', 'Content Marketing', 'Referrals', 'Events',
  'Direct Mail', 'Radio/TV', 'Print Ads', 'Influencer Marketing'
];

const commonPainPoints = [
  'Low lead volume', 'High cost per lead', 'Poor lead quality',
  'Inconsistent branding', 'No marketing strategy', 'Limited budget',
  'No time for marketing', 'Outdated website', 'Low online visibility',
  'Poor social media presence', 'No email list', 'Competition'
];

const commonGoals = [
  'Increase new patients/customers', 'Reduce cost per acquisition',
  'Improve brand awareness', 'Generate more leads', 'Increase revenue',
  'Expand to new markets', 'Launch new services', 'Improve retention',
  'Build online presence', 'Automate marketing'
];

const commonTools = [
  'Google Analytics', 'HubSpot', 'Mailchimp', 'Salesforce', 'WordPress',
  'Squarespace', 'Wix', 'Hootsuite', 'Buffer', 'Canva', 'Monday.com',
  'Asana', 'Slack', 'QuickBooks', 'Practice Management Software'
];

const steps = [
  { id: 1, title: 'Business Overview', icon: Building2, description: 'Tell us about your business' },
  { id: 2, title: 'Current State', icon: ClipboardList, description: 'Where are you now?' },
  { id: 3, title: 'Competition', icon: Users, description: 'Who are your competitors?' },
  { id: 4, title: 'Goals & Metrics', icon: Target, description: 'What do you want to achieve?' },
  { id: 5, title: 'Technical Setup', icon: Wrench, description: 'Tools and platforms' },
  { id: 6, title: 'Review & Submit', icon: Check, description: 'Review your discovery' },
];

export default function Discovery() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<DiscoveryData>(initialData);
  const [clientName, setClientName] = useState('');
  const [industry] = useState('Healthcare');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function exportToPDF() {
    if (!clientName.trim()) return;
    
    setExporting(true);
    try {
      const blob = await pdf(
        <DiscoveryPDF 
          discovery={data} 
          clientName={clientName} 
          clientIndustry={industry}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clientName.replace(/\s+/g, '_')}_Discovery_Document.pdf`;
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

  const updateField = (field: keyof DiscoveryData, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof DiscoveryData, item: string) => {
    const current = data[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      setError('Please enter a client name');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_and_save',
          data: {
            clientName: clientName.trim(),
            industry,
            businessDescription: data.businessDescription,
            targetAudience: data.targetAudience,
            uniqueValueProposition: data.uniqueValueProposition,
            currentMarketingChannels: data.currentMarketingChannels,
            currentMonthlyBudget: data.currentMonthlyBudget,
            currentPainPoints: data.currentPainPoints,
            competitors: data.competitors,
            competitorAnalysis: data.competitorAnalysis,
            primaryGoals: data.primaryGoals,
            successMetrics: data.successMetrics,
            timeline: data.timeline,
            existingTools: data.existingTools,
            websiteUrl: data.websiteUrl,
            socialProfiles: data.socialProfiles,
            discoveryNotes: data.discoveryNotes,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Save failed');
      }

      const result = await response.json();
      setSavedClientId(result.client?.id);
      setSaved(true);
      
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save discovery');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!savedClientId) {
      // Save first, then generate
      await handleSave();
    }
    setIsGenerating(true);
    // Navigate to strategy page or trigger generation
    setTimeout(() => {
      navigate('/dashboard/strategy');
    }, 1000);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Client/Company Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Smile Dental Group"
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Business Description *</label>
              <textarea
                value={data.businessDescription}
                onChange={(e) => updateField('businessDescription', e.target.value)}
                placeholder="Describe the business, what they do, their history..."
                rows={4}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Target Audience *</label>
              <textarea
                value={data.targetAudience}
                onChange={(e) => updateField('targetAudience', e.target.value)}
                placeholder="Who are their ideal customers? Demographics, behaviors, needs..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Unique Value Proposition</label>
              <textarea
                value={data.uniqueValueProposition}
                onChange={(e) => updateField('uniqueValueProposition', e.target.value)}
                placeholder="What makes them different from competitors?"
                rows={2}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Current Marketing Channels</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {marketingChannels.map(channel => (
                  <button
                    key={channel}
                    onClick={() => toggleArrayItem('currentMarketingChannels', channel)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      data.currentMarketingChannels.includes(channel)
                        ? 'bg-cyan-600 text-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Current Monthly Marketing Budget</label>
              <select
                value={data.currentMonthlyBudget}
                onChange={(e) => updateField('currentMonthlyBudget', e.target.value)}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select budget range...</option>
                <option value="0-1000">$0 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="10000-25000">$10,000 - $25,000</option>
                <option value="25000-50000">$25,000 - $50,000</option>
                <option value="50000+">$50,000+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Current Pain Points</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonPainPoints.map(point => (
                  <button
                    key={point}
                    onClick={() => toggleArrayItem('currentPainPoints', point)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      data.currentPainPoints.includes(point)
                        ? 'bg-orange-600 text-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Main Competitors (one per line)</label>
              <textarea
                value={data.competitors.join('\n')}
                onChange={(e) => updateField('competitors', e.target.value.split('\n').filter(c => c.trim()))}
                placeholder="Competitor 1&#10;Competitor 2&#10;Competitor 3"
                rows={4}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Competitor Analysis</label>
              <textarea
                value={data.competitorAnalysis}
                onChange={(e) => updateField('competitorAnalysis', e.target.value)}
                placeholder="What are competitors doing well? What are they missing? How can we differentiate?"
                rows={4}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Primary Goals</label>
              <div className="grid grid-cols-2 gap-2">
                {commonGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleArrayItem('primaryGoals', goal)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      data.primaryGoals.includes(goal)
                        ? 'bg-green-600 text-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Success Metrics (how will we measure success?)</label>
              <textarea
                value={data.successMetrics.join('\n')}
                onChange={(e) => updateField('successMetrics', e.target.value.split('\n').filter(m => m.trim()))}
                placeholder="e.g., 50 new patients per month&#10;Cost per lead under $50&#10;30% increase in website traffic"
                rows={3}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Timeline / Urgency</label>
              <select
                value={data.timeline}
                onChange={(e) => updateField('timeline', e.target.value)}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select timeline...</option>
                <option value="asap">ASAP - Need results immediately</option>
                <option value="1-3months">1-3 months</option>
                <option value="3-6months">3-6 months</option>
                <option value="6-12months">6-12 months</option>
                <option value="ongoing">Ongoing / No rush</option>
              </select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Existing Tools & Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonTools.map(tool => (
                  <button
                    key={tool}
                    onClick={() => toggleArrayItem('existingTools', tool)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      data.existingTools.includes(tool)
                        ? 'bg-purple-600 text-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Website URL</label>
              <input
                type="url"
                value={data.websiteUrl}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Social Media Profiles</label>
              <textarea
                value={data.socialProfiles}
                onChange={(e) => updateField('socialProfiles', e.target.value)}
                placeholder="Facebook: https://facebook.com/...&#10;Instagram: @handle&#10;LinkedIn: https://linkedin.com/..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Additional Notes</label>
              <textarea
                value={data.discoveryNotes}
                onChange={(e) => updateField('discoveryNotes', e.target.value)}
                placeholder="Any other important information..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-secondary/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                {clientName || 'Client Name Not Set'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Business Description</h4>
                  <p className="text-muted-foreground">{data.businessDescription || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Audience</h4>
                  <p className="text-muted-foreground">{data.targetAudience || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Monthly Budget</h4>
                  <p className="text-muted-foreground">{data.currentMonthlyBudget || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h4>
                  <p className="text-muted-foreground">{data.timeline || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Marketing Channels</h4>
                  <p className="text-muted-foreground">{data.currentMarketingChannels.join(', ') || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Pain Points</h4>
                  <p className="text-muted-foreground">{data.currentPainPoints.join(', ') || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Goals</h4>
                  <p className="text-muted-foreground">{data.primaryGoals.join(', ') || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Competitors</h4>
                  <p className="text-muted-foreground">{data.competitors.join(', ') || '-'}</p>
                </div>
              </div>
            </div>

            {!clientName && (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>Please go back and enter a client name</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-3 rounded-lg">
                <Check className="w-5 h-5" />
                <span>Discovery saved successfully! Client has been added to your pipeline.</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving || !clientName || saved}
                className="flex-1 px-6 py-3 bg-cyan-600 text-foreground rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving to Database...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Discovery
                  </>
                )}
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting || !clientName}
                className="px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={handleGenerateStrategy}
                disabled={!clientName || isGenerating}
                className="flex-1 px-6 py-3 bg-purple-600 text-foreground rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {saved ? 'Generate AI Strategy' : 'Save & Generate Strategy'}
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-cyan-500" />
            Client Discovery
          </h1>
          <p className="text-muted-foreground mt-1">Gather client information to build their marketing strategy</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center ${
                    currentStep === step.id ? 'text-cyan-400' : 
                    currentStep > step.id ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep === step.id ? 'bg-cyan-600' : 
                    currentStep > step.id ? 'bg-green-600' : 'bg-secondary'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5 text-foreground" />
                    ) : (
                      <step.icon className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.title}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`w-12 md:w-24 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-secondary'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card backdrop-blur rounded-xl p-6 border border-border mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">{steps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground text-sm">{steps[currentStep - 1].description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          {currentStep < 6 && (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-cyan-600 text-foreground rounded-lg hover:bg-cyan-500 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

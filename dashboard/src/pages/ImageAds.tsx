import { useState, useEffect } from 'react';
import { 
  Image, Sparkles, Download, Copy, Check, Loader2,
  Wand2, Palette, Maximize2, RefreshCw, Info, Lightbulb,
  CheckCircle, Globe, Zap
} from 'lucide-react';
import { useClient } from '@/components/ClientProvider';
import { useToast, ToastContainer } from '@/components/Toast';
import { CLIENT_PRESETS } from '@/lib/types';
import { supabase } from '@/lib/supabase';

type AdSize = 'square' | 'landscape' | 'portrait' | 'story';
type Platform = 'meta' | 'google' | 'linkedin';

interface GeneratedImage {
  url: string;
  prompt: string;
  size: AdSize;
  platform: Platform;
}

interface BrandAnalysis {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  colorPalette: string[];
  style: string;
  mood: string;
  typography: string;
  visualElements: string[];
  imageStyle: string;
  brandPersonality: string;
  designRecommendations: string[];
  adStylePrompt: string;
}

const sizeConfigs: Record<AdSize, { label: string; dimensions: string; aspect: string }> = {
  square: { label: 'Square', dimensions: '1080x1080', aspect: 'aspect-square' },
  landscape: { label: 'Landscape', dimensions: '1200x628', aspect: 'aspect-video' },
  portrait: { label: 'Portrait', dimensions: '1080x1350', aspect: 'aspect-[4/5]' },
  story: { label: 'Story/Reel', dimensions: '1080x1920', aspect: 'aspect-[9/16]' },
};

const platformStyles: Record<Platform, { label: string; color: string; bgColor: string }> = {
  meta: { label: 'Meta (FB/IG)', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  google: { label: 'Google Display', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-400', bgColor: 'bg-sky-500/20' },
};

// Client-specific ad concepts
const clientAdConcepts: Record<string, string[]> = {
  equitymd: [
    'Confident investor reviewing real estate portfolio on tablet, modern office, wealth visualization',
    'Beautiful multifamily property exterior, sunset lighting, premium investment opportunity',
    'Professional syndicator presenting to investors, boardroom setting, trust and expertise',
    'Passive income visualization, growing graph overlay, lifestyle freedom imagery',
  ],
  brandastic: [
    'AI-powered marketing dashboard with growth metrics, futuristic interface',
    'Happy business owner seeing ROI results, celebration moment',
    'Marketing team collaborating with AI assistant visualization',
    'Before/after marketing transformation, dramatic improvement',
  ],
  projecthunter: [
    'Construction project aerial view, professional contractors at work',
    'General contractor reviewing blueprints on tablet, modern job site',
    'New development project breaking ground, opportunity imagery',
    'Construction bidding success, handshake moment, partnership',
  ],
  comply: [
    'Compliance dashboard showing green checkmarks, peace of mind',
    'Professional compliance officer confident at work, modern office',
    'Automated audit process visualization, efficiency imagery',
    'Risk mitigation success, secure and protected business',
  ],
};

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

// Get suggested style based on industry
function getSuggestedStyle(industry?: string | null): string {
  if (!industry) return 'modern-minimal';
  const ind = industry.toLowerCase();
  if (ind.includes('health') || ind.includes('medical') || ind.includes('dental')) return 'healthcare-trust';
  if (ind.includes('tech') || ind.includes('software') || ind.includes('ai')) return 'tech-futuristic';
  if (ind.includes('real estate') || ind.includes('investment')) return 'professional-clean';
  if (ind.includes('construction')) return 'bold-vibrant';
  return 'modern-minimal';
}

export default function ImageAds() {
  const { currentClient, currentClientId } = useClient();
  const { toasts, removeToast, success } = useToast();
  const [prompt, setPrompt] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedSize, setSelectedSize] = useState<AdSize>('square');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('meta');
  const [style, setStyle] = useState('modern-minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saved, setSaved] = useState(false);
  
  // Brand analysis state
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandAnalysisError, setBrandAnalysisError] = useState<string | null>(null);

  // Get client context
  const presetKey = getPresetKey(currentClient?.name);
  const preset = presetKey ? CLIENT_PRESETS[presetKey] : null;
  const suggestedConcepts = presetKey ? clientAdConcepts[presetKey] : [];

  // Analyze client's website for brand colors/style
  const handleAnalyzeBrand = async () => {
    const websiteUrl = currentClient?.website;
    if (!websiteUrl) {
      setBrandAnalysisError('No website URL found for this client');
      return;
    }

    setIsAnalyzingBrand(true);
    setBrandAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          clientName: currentClient?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Brand analysis failed');
      }

      if (data.brand) {
        setBrandAnalysis(data.brand);
        // Auto-update style based on analysis
        if (data.brand.style) {
          const styleMap: Record<string, string> = {
            'modern': 'modern-minimal',
            'minimalist': 'modern-minimal',
            'bold': 'bold-vibrant',
            'playful': 'bold-vibrant',
            'corporate': 'professional-clean',
            'classic': 'professional-clean',
            'luxury': 'luxury-premium',
            'sophisticated': 'luxury-premium',
            'tech': 'tech-futuristic',
            'innovative': 'tech-futuristic',
            'organic': 'healthcare-trust',
            'trustworthy': 'healthcare-trust',
          };
          const mappedStyle = styleMap[data.brand.style.toLowerCase()] || style;
          setStyle(mappedStyle);
        }
      }
    } catch (err) {
      console.error('Brand analysis error:', err);
      setBrandAnalysisError(err instanceof Error ? err.message : 'Failed to analyze brand');
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  // Load saved images from database
  useEffect(() => {
    async function loadImages() {
      if (!currentClientId) {
        setLoadingHistory(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('generated_images')
          .select('*')
          .eq('client_id', currentClientId)
          .order('created_at', { ascending: false })
          .limit(20) as { data: any[] | null };

        if (data && data.length > 0) {
          const images: GeneratedImage[] = data.map((row: any) => ({
            url: row.image_url,
            prompt: row.prompt,
            size: row.size as AdSize,
            platform: row.platform as Platform,
          }));
          setGeneratedImages(images);
        }
      } catch (err) {
        console.log('Error loading image history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadImages();
  }, [currentClientId]);

  // Auto-fill from client when it changes
  useEffect(() => {
    if (currentClient) {
      setBrandName(currentClient.name);
      setStyle(getSuggestedStyle(currentClient.industry || preset?.industry));
    }
  }, [currentClient?.id]);

  const styles = [
    { id: 'modern-minimal', label: 'Modern Minimal' },
    { id: 'bold-vibrant', label: 'Bold & Vibrant' },
    { id: 'professional-clean', label: 'Professional Clean' },
    { id: 'healthcare-trust', label: 'Healthcare Trust' },
    { id: 'tech-futuristic', label: 'Tech Futuristic' },
    { id: 'luxury-premium', label: 'Luxury Premium' },
  ];

  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedPrompt(null);
    setSaved(false);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          brandName: brandName || currentClient?.name,
          style,
          size: sizeConfigs[selectedSize].dimensions,
          platform: selectedPlatform,
          // Include brand analysis for on-brand imagery
          brandAnalysis: brandAnalysis ? {
            primaryColor: brandAnalysis.primaryColor,
            secondaryColor: brandAnalysis.secondaryColor,
            accentColor: brandAnalysis.accentColor,
            colorPalette: brandAnalysis.colorPalette,
            style: brandAnalysis.style,
            mood: brandAnalysis.mood,
            visualElements: brandAnalysis.visualElements,
            adStylePrompt: brandAnalysis.adStylePrompt,
          } : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If API fails, show the enhanced prompt for manual use
        if (data.prompt) {
          setGeneratedPrompt(data.prompt);
        }
        throw new Error(data.message || data.error || 'Generation failed');
      }

      if (data.images && data.images.length > 0) {
        const newImages: GeneratedImage[] = data.images.map((img: { url: string; prompt: string }) => ({
          url: img.url,
          prompt: img.prompt,
          size: selectedSize,
          platform: selectedPlatform,
        }));
        setGeneratedImages(prev => [...newImages, ...prev]);

        // Save to database
        if (currentClientId) {
          try {
            for (const img of data.images) {
              await (supabase.from('generated_images' as any) as any).insert({
                client_id: currentClientId,
                image_url: img.url,
                prompt: img.prompt,
                size: selectedSize,
                platform: selectedPlatform,
                style,
                brand_name: brandName || currentClient?.name,
              });
            }
            setSaved(true);
            success('Image saved');
          } catch (saveErr) {
            console.log('Auto-save failed:', saveErr);
          }
        }
      } else {
        throw new Error('No images returned');
      }

    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      
      // Show fallback placeholder so user can still see format
      const displayName = brandName || currentClient?.name || 'Ad';
      const fallbackImage: GeneratedImage = {
        url: `https://placehold.co/${sizeConfigs[selectedSize].dimensions}/1a1a2e/06b6d4?text=${encodeURIComponent('Preview: ' + displayName)}`,
        prompt: `${style}: ${prompt}`,
        size: selectedSize,
        platform: selectedPlatform,
      };
      setGeneratedImages(prev => [fallbackImage, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useSuggestedConcept = (concept: string) => {
    setPrompt(concept);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Image className="w-8 h-8 text-pink-500" />
            Image Ad Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentClient 
              ? `Creating ad images for ${currentClient.name}` 
              : 'Generate AI-powered ad images with Google Imagen 4.0'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Client Context Alert */}
            {currentClient && (
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pink-400 text-sm font-medium mb-1">
                  <Info className="w-4 h-4" />
                  Creating for {currentClient.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {preset?.industry || currentClient.industry || 'General'} • Style auto-selected
                </p>
              </div>
            )}

            {/* Brand Analysis */}
            {currentClient?.website && (
              <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Brand Analysis
                  </label>
                  <button
                    onClick={handleAnalyzeBrand}
                    disabled={isAnalyzingBrand}
                    className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isAnalyzingBrand ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3" />
                        Analyze Website
                      </>
                    )}
                  </button>
                </div>

                {brandAnalysisError && (
                  <p className="text-xs text-red-400 mb-2">{brandAnalysisError}</p>
                )}

                {brandAnalysis ? (
                  <div className="space-y-3">
                    {/* Color Palette */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Brand Colors</p>
                      <div className="flex gap-1.5">
                        {brandAnalysis.colorPalette?.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-lg border border-border shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Style & Mood */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-secondary/50 rounded-lg p-2">
                        <span className="text-muted-foreground">Style:</span>
                        <span className="text-foreground ml-1 capitalize">{brandAnalysis.style}</span>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-2">
                        <span className="text-muted-foreground">Mood:</span>
                        <span className="text-foreground ml-1 capitalize">{brandAnalysis.mood}</span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {brandAnalysis.designRecommendations?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Design Tips</p>
                        <ul className="text-xs text-foreground space-y-0.5">
                          {brandAnalysis.designRecommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-400">•</span>
                              {rec.length > 50 ? rec.substring(0, 50) + '...' : rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Brand analysis applied to generation
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Click "Analyze Website" to extract brand colors, style, and visual guidelines from {currentClient.name}'s website.
                  </p>
                )}
              </div>
            )}

            {/* Brand Name - Auto-filled */}
            <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Brand/Company Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={currentClient?.name || 'e.g., Your Brand'}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-pink-500 focus:outline-none"
              />
              {currentClient && brandName === currentClient.name && (
                <p className="text-xs text-green-400 mt-1">✓ Auto-filled from selected client</p>
              )}
            </div>

            {/* Suggested Concepts */}
            {suggestedConcepts.length > 0 && (
              <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Quick Concepts for {currentClient?.name}
                </label>
                <div className="space-y-2">
                  {suggestedConcepts.slice(0, 3).map((concept, i) => (
                    <button
                      key={i}
                      onClick={() => useSuggestedConcept(concept)}
                      className="w-full text-left px-3 py-2 bg-secondary/50 hover:bg-secondary/80/50 rounded-lg text-sm text-muted-foreground transition-colors"
                    >
                      {concept.length > 60 ? concept.substring(0, 60) + '...' : concept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt */}
            <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ad Concept / Description *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={suggestedConcepts[0] || "Describe your ad concept..."}
                rows={4}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Platform */}
            <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(platformStyles).map(([id, config]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedPlatform(id as Platform)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedPlatform === id
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ring-offset-slate-800`
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                <Maximize2 className="w-4 h-4 inline mr-1" />
                Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sizeConfigs).map(([id, config]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedSize(id as AdSize)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSize === id
                        ? 'bg-pink-600 text-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-70">{config.dimensions}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-card backdrop-blur rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                <Palette className="w-4 h-4 inline mr-1" />
                Visual Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-pink-500 focus:outline-none"
              >
                {styles.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              {currentClient && style === getSuggestedStyle(currentClient.industry) && (
                <p className="text-xs text-green-400 mt-1">✓ Recommended for {currentClient.industry || 'this industry'}</p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-foreground rounded-xl hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Ad Images
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium mb-2">⚠️ {error}</p>
                {generatedPrompt && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Use this prompt in Midjourney, DALL-E, or Canva:</p>
                    <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground font-mono">
                      {generatedPrompt}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPrompt);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="mt-2 text-pink-400 hover:text-pink-300 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy prompt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Generated Images */}
          <div className="lg:col-span-2">
            <div className="bg-card backdrop-blur rounded-xl p-6 border border-border min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Generated Images
                  {saved && currentClientId && (
                    <span className="flex items-center gap-1 text-sm font-normal text-green-400 ml-2">
                      <CheckCircle className="w-4 h-4" />
                      Auto-saved
                    </span>
                  )}
                  {loadingHistory && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />
                  )}
                </h2>
                {generatedImages.length > 0 && (
                  <button 
                    onClick={() => setGeneratedImages([])}
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {generatedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <Image className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">No images generated yet</p>
                  <p className="text-sm mt-1">
                    {suggestedConcepts.length > 0 
                      ? 'Click a quick concept or enter your own prompt'
                      : 'Enter a prompt and click Generate'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="bg-secondary/50 rounded-xl overflow-hidden border border-border group">
                      <div className={`relative ${sizeConfigs[img.size].aspect} max-h-64 overflow-hidden`}>
                        <img 
                          src={img.url} 
                          alt={`Generated ad ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="px-3 py-2 bg-white text-black rounded-lg text-sm font-medium flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${platformStyles[img.platform].bgColor} ${platformStyles[img.platform].color}`}>
                            {platformStyles[img.platform].label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-secondary/80 text-muted-foreground">
                            {sizeConfigs[img.size].label}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs truncate">{img.prompt}</p>
                        <button
                          onClick={() => handleCopyPrompt(img)}
                          className="mt-2 text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy prompt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

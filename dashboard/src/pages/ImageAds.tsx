import { useState } from 'react';
import { 
  Image, Sparkles, Download, Copy, Check, Loader2,
  Wand2, Palette, Maximize2, RefreshCw
} from 'lucide-react';

type AdSize = 'square' | 'landscape' | 'portrait' | 'story';
type Platform = 'meta' | 'google' | 'linkedin';

interface GeneratedImage {
  url: string;
  prompt: string;
  size: AdSize;
  platform: Platform;
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

export default function ImageAds() {
  const [prompt, setPrompt] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedSize, setSelectedSize] = useState<AdSize>('square');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('meta');
  const [style, setStyle] = useState('modern-minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [copied, setCopied] = useState(false);

  const styles = [
    { id: 'modern-minimal', label: 'Modern Minimal' },
    { id: 'bold-vibrant', label: 'Bold & Vibrant' },
    { id: 'professional-clean', label: 'Professional Clean' },
    { id: 'healthcare-trust', label: 'Healthcare Trust' },
    { id: 'tech-futuristic', label: 'Tech Futuristic' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate image generation (in production, calls Imagen 4.0 API)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Sample generated images (placeholders)
    const newImages: GeneratedImage[] = [
      {
        url: `https://placehold.co/${sizeConfigs[selectedSize].dimensions.replace('x', 'x')}/1e293b/06b6d4?text=${encodeURIComponent(brandName || 'Ad')}`,
        prompt: `${style}: ${prompt}`,
        size: selectedSize,
        platform: selectedPlatform,
      },
      {
        url: `https://placehold.co/${sizeConfigs[selectedSize].dimensions.replace('x', 'x')}/1e293b/8b5cf6?text=${encodeURIComponent(brandName || 'Ad')}+V2`,
        prompt: `${style}: ${prompt} (variation)`,
        size: selectedSize,
        platform: selectedPlatform,
      },
    ];
    
    setGeneratedImages(prev => [...newImages, ...prev]);
    setIsGenerating(false);
  };

  const handleCopyPrompt = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Image className="w-8 h-8 text-pink-500" />
            Image Ad Generator
          </h1>
          <p className="text-gray-400 mt-1">
            Generate AI-powered ad images with Google Imagen 4.0
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Brand Name */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand/Company Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Smile Dental Group"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Prompt */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ad Concept / Description *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your ad: e.g., 'Happy family at a modern dental office, bright and welcoming atmosphere, professional dentist in background'"
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Platform */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
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
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
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
                        ? 'bg-pink-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-70">{config.dimensions}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Palette className="w-4 h-4 inline mr-1" />
                Visual Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none"
              >
                {styles.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating with Imagen 4.0...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Ad Images
                </>
              )}
            </button>

            {/* Info */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">
                💡 <span className="text-white">Pro tip:</span> Be specific about mood, colors, and composition for better results.
              </p>
            </div>
          </div>

          {/* Right Column - Generated Images */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Generated Images
                </h2>
                {generatedImages.length > 0 && (
                  <button 
                    onClick={() => setGeneratedImages([])}
                    className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
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
                  <p className="text-sm mt-1">Enter a prompt and click Generate</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600 group">
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
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-600 text-gray-300">
                            {sizeConfigs[img.size].label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{img.prompt}</p>
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

            {/* CLI Hint */}
            <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">
                💻 <span className="text-white">CLI commands:</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="text-pink-400 font-mono text-sm bg-slate-900/50 px-3 py-2 rounded-lg">
                  clawbot image-ads generate --prompt "..."
                </code>
                <code className="text-pink-400 font-mono text-sm bg-slate-900/50 px-3 py-2 rounded-lg">
                  clawbot image-ads sizes
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useClient } from '@/components/ClientProvider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  Upload, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  CheckCircle,
  Palette,
  Globe,
  Users,
  Target,
  X,
  Camera
} from 'lucide-react';

export default function ClientSettings() {
  const { currentClient, currentClientId, refreshClients } = useClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    industry: string;
    website: string;
    target_audience: string;
    goals: string;
    tone: string;
    primary_color: string;
    logo_url: string;
    banner_url: string;
  }>({
    name: currentClient?.name || '',
    industry: currentClient?.industry || '',
    website: currentClient?.website || '',
    target_audience: currentClient?.target_audience || '',
    goals: currentClient?.goals || '',
    tone: currentClient?.tone || 'professional',
    primary_color: currentClient?.primary_color || '#06b6d4',
    logo_url: currentClient?.logo_url || '',
    banner_url: currentClient?.banner_url || '',
  });

  if (!currentClient) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to edit their settings.
        </p>
      </div>
    );
  }

  async function handleImageUpload(file: File, type: 'logo' | 'banner') {
    setUploading(true);
    setError(null);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentClientId}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `clients/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('Image')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Image')
        .getPublicUrl(filePath);

      // Update form data
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, banner_url: publicUrl }));
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!currentClientId) return;
    
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updateData = {
        name: formData.name,
        industry: formData.industry,
        website: formData.website,
        target_audience: formData.target_audience,
        goals: formData.goals,
        tone: formData.tone,
        primary_color: formData.primary_color,
        logo_url: formData.logo_url || null,
        banner_url: formData.banner_url || null,
      };
      
      const { error: updateError } = await (supabase
        .from('clients') as any)
        .update(updateData)
        .eq('id', currentClientId);

      if (updateError) throw updateError;

      setSaved(true);
      refreshClients(); // Refresh the client list
      
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const tones = ['professional', 'friendly', 'bold', 'casual', 'formal', 'playful'];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Client Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage {currentClient.name}'s profile, branding, and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {/* Branding Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Client Logo</label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/50 relative group cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {formData.logo_url ? (
                    <>
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo');
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a square logo (recommended: 200x200px)
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="ml-2">Upload Logo</span>
                    </Button>
                    {formData.logo_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Banner Image</label>
              <div 
                className="h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/50 relative group cursor-pointer"
                onClick={() => bannerInputRef.current?.click()}
              >
                {formData.banner_url ? (
                  <>
                    <img 
                      src={formData.banner_url} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload banner (1200x400px recommended)</span>
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'banner');
                }}
              />
              {formData.banner_url && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2"
                  onClick={() => setFormData(prev => ({ ...prev, banner_url: '' }))}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Banner
                </Button>
              )}
            </div>

            {/* Brand Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-32 font-mono"
                  placeholder="#06b6d4"
                />
                <p className="text-sm text-muted-foreground">Used for avatar backgrounds and accents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Brandastic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Digital Marketing Agency"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website
              </label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://brandastic.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Targeting Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Targeting & Messaging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Target Audience
              </label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder="e.g., Marketing directors at mid-size healthcare companies"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Goals</label>
              <Input
                value={formData.goals}
                onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="e.g., Generate 50 qualified leads per month"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Communication Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <Badge
                    key={t}
                    variant={formData.tone === t ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => setFormData(prev => ({ ...prev, tone: t }))}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

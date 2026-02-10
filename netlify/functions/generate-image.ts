import type { Handler, HandlerEvent } from '@netlify/functions';

interface BrandAnalysis {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  colorPalette?: string[];
  style?: string;
  mood?: string;
  visualElements?: string[];
  adStylePrompt?: string;
}

interface RequestBody {
  prompt: string;
  brandName?: string;
  style?: string;
  size?: string;
  platform?: string;
  brandAnalysis?: BrandAnalysis | null;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'GEMINI_API_KEY not configured',
          message: 'Add GEMINI_API_KEY to Netlify environment variables to enable image generation'
        }),
      };
    }

    const body: RequestBody = JSON.parse(event.body || '{}');
    const { prompt, brandName, style = 'modern-minimal', size = '1024x1024', platform = 'meta', brandAnalysis } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    // Build enhanced prompt for ad imagery, incorporating brand analysis
    const enhancedPrompt = buildAdPrompt(prompt, brandName, style, platform, brandAnalysis);

    // Try Imagen 3 (the currently available model)
    const imageUrl = await generateWithImagen(geminiKey, enhancedPrompt);

    if (imageUrl) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          images: [
            { url: imageUrl, prompt: enhancedPrompt },
          ],
        }),
      };
    }

    // If Imagen fails, return error with guidance
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Image generation failed',
        message: 'Imagen API may not be available. Check your Google Cloud project settings.',
        suggestion: 'You can also use the prompts with external tools like Midjourney, DALL-E, or Canva AI.',
        prompt: enhancedPrompt,
      }),
    };

  } catch (error) {
    console.error('Image generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Image generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};

function buildAdPrompt(
  prompt: string, 
  brandName?: string, 
  style?: string, 
  platform?: string,
  brandAnalysis?: BrandAnalysis | null
): string {
  const styleGuides: Record<string, string> = {
    'modern-minimal': 'clean, minimalist design, white space, modern typography, subtle gradients',
    'bold-vibrant': 'bold colors, high contrast, dynamic composition, energetic feel',
    'professional-clean': 'corporate professional, trustworthy, clean lines, blue tones',
    'healthcare-trust': 'warm, caring, medical professional, clean white, soft blue accents, trustworthy',
    'tech-futuristic': 'futuristic, digital, neon accents, dark background, tech aesthetic',
    'luxury-premium': 'elegant, premium feel, gold accents, sophisticated, high-end',
  };

  const platformGuides: Record<string, string> = {
    'meta': 'social media advertisement, eye-catching, scroll-stopping',
    'google': 'display advertisement, clear messaging, professional',
    'linkedin': 'professional B2B advertisement, business context',
  };

  const parts = [
    'Create a professional advertisement image:',
    prompt,
  ];

  // If we have brand analysis, use the AI-generated style prompt
  if (brandAnalysis?.adStylePrompt) {
    parts.push(brandAnalysis.adStylePrompt);
  } else {
    parts.push(styleGuides[style || 'modern-minimal']);
  }

  // Add brand colors if available
  if (brandAnalysis?.colorPalette?.length) {
    const colors = brandAnalysis.colorPalette.slice(0, 3).join(', ');
    parts.push(`Use brand colors: ${colors}`);
  } else if (brandAnalysis?.primaryColor) {
    parts.push(`Primary brand color: ${brandAnalysis.primaryColor}`);
    if (brandAnalysis.accentColor) {
      parts.push(`Accent color: ${brandAnalysis.accentColor}`);
    }
  }

  // Add visual elements from brand analysis
  if (brandAnalysis?.visualElements?.length) {
    parts.push(`Visual style elements: ${brandAnalysis.visualElements.slice(0, 3).join(', ')}`);
  }

  // Add mood from brand analysis
  if (brandAnalysis?.mood) {
    parts.push(`Overall mood: ${brandAnalysis.mood}`);
  }

  parts.push(platformGuides[platform || 'meta']);
  parts.push('photorealistic, high quality, 4K resolution');
  parts.push('DO NOT include any text or words in the image');

  if (brandName) {
    parts.push(`Brand context: ${brandName}`);
  }

  return parts.join('. ');
}

async function generateWithImagen(apiKey: string, prompt: string): Promise<string | null> {
  try {
    // Try Imagen 3 through Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_few',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      
      // Try alternative endpoint
      return await tryAlternativeImagen(apiKey, prompt);
    }

    const data = await response.json();
    
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      // Return as data URL
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }

    return null;
  } catch (error) {
    console.error('Imagen generation error:', error);
    return await tryAlternativeImagen(apiKey, prompt);
  }
}

async function tryAlternativeImagen(apiKey: string, prompt: string): Promise<string | null> {
  try {
    // Try with generateContent and image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate an image: ${prompt}` }]
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Alternative Imagen failed:', await response.text());
      return null;
    }

    const data = await response.json();
    
    // Look for image in response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Alternative Imagen error:', error);
    return null;
  }
}

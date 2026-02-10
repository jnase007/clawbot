import type { Handler, HandlerEvent } from '@netlify/functions';

interface RequestBody {
  prompt: string;
  brandName?: string;
  style?: string;
  size?: string;
  platform?: string;
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
    const { prompt, brandName, style = 'modern-minimal', size = '1024x1024', platform = 'meta' } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    // Build enhanced prompt for ad imagery
    const enhancedPrompt = buildAdPrompt(prompt, brandName, style, platform);

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

function buildAdPrompt(prompt: string, brandName?: string, style?: string, platform?: string): string {
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
    styleGuides[style || 'modern-minimal'],
    platformGuides[platform || 'meta'],
    'photorealistic, high quality, 4K resolution',
    'DO NOT include any text or words in the image',
  ];

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

import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent } from '@netlify/functions';

const BRAND_ANALYSIS_PROMPT = `You are an expert brand analyst and designer. Analyze this website content and extract the visual brand identity.

Return a JSON object with these fields:
{
  "primaryColor": "#hexcode (main brand color from the site)",
  "secondaryColor": "#hexcode (secondary/accent color)",
  "accentColor": "#hexcode (highlight/CTA color)",
  "backgroundColor": "#hexcode (typical background color)",
  "textColor": "#hexcode (main text color)",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "style": "modern|classic|minimalist|bold|playful|corporate|luxury|tech|organic",
  "mood": "professional|friendly|innovative|trustworthy|energetic|calm|sophisticated|approachable",
  "typography": "serif|sans-serif|mixed (best guess from content tone)",
  "visualElements": ["list of visual elements they use like gradients, shadows, rounded corners, etc"],
  "imageStyle": "photography|illustrations|icons|mixed|minimal",
  "brandPersonality": "3-5 words describing the brand personality",
  "designRecommendations": ["3-4 specific recommendations for ad design based on their brand"],
  "adStylePrompt": "A detailed prompt describing how ads should look to match this brand - include colors, style, mood, and visual elements"
}

Be specific about colors - try to identify the actual hex codes from the website.
The adStylePrompt should be detailed enough to generate on-brand imagery.`;

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
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { websiteUrl, clientName } = body;

    if (!websiteUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Website URL is required' }),
      };
    }

    // Fetch website content including styles
    let websiteContent = '';
    let cssContent = '';
    
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClawBot/1.0; Brand Analysis)',
        },
      });
      const html = await response.text();
      
      // Extract inline styles and style tags
      const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
      cssContent = styleMatches.join('\n');
      
      // Extract color mentions from HTML/CSS
      const colorMatches = html.match(/#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
      const uniqueColors = [...new Set(colorMatches)].slice(0, 20);
      
      // Extract text content for tone analysis
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000);
      
      // Look for meta tags with brand info
      const metaDescription = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [];
      const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/) || [];
      
      websiteContent = `
Website URL: ${websiteUrl}
Client Name: ${clientName || 'Unknown'}

Colors found on site: ${uniqueColors.join(', ')}

CSS Excerpts:
${cssContent.slice(0, 3000)}

Site Meta Description: ${metaDescription[1] || 'Not found'}
OG Image: ${ogImage[1] || 'Not found'}

Text Content:
${textContent}
      `;
    } catch (fetchError) {
      console.error('Failed to fetch website:', fetchError);
      websiteContent = `Website URL: ${websiteUrl}\nClient Name: ${clientName || 'Unknown'}\n(Could not fetch full content)`;
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: BRAND_ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this website's brand identity:\n\n${websiteContent}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const brandAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        brand: brandAnalysis,
        clientName,
        websiteUrl,
      }),
    };

  } catch (error) {
    console.error('Brand analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Brand analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

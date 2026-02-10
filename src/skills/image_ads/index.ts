/**
 * Image Ad Generator using Google Nano Banana (Gemini API)
 * Based on: https://ai.google.dev/gemini-api/docs
 * 
 * Generates professional ad images for Meta, Google Display, LinkedIn, etc.
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/index.js';
import { logAction } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';
import * as fs from 'fs';
import * as path from 'path';

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env file.');
    }
    genAI = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return genAI;
}

/**
 * Sanitize input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  let sanitized = input.trim().substring(0, 1000);
  const injectionPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /disregard\s+(previous|all|above)\s+instructions?/gi,
  ];
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  return sanitized;
}

// Ad size presets for different platforms
export const AD_SIZES = {
  // Meta (Facebook/Instagram)
  'meta-feed': { width: 1200, height: 628, name: 'Meta Feed Ad' },
  'meta-story': { width: 1080, height: 1920, name: 'Meta Story/Reels' },
  'meta-square': { width: 1080, height: 1080, name: 'Meta Square' },
  'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
  
  // Google Display Network
  'google-leaderboard': { width: 728, height: 90, name: 'Google Leaderboard' },
  'google-medium-rectangle': { width: 300, height: 250, name: 'Google Medium Rectangle' },
  'google-large-rectangle': { width: 336, height: 280, name: 'Google Large Rectangle' },
  'google-skyscraper': { width: 160, height: 600, name: 'Google Skyscraper' },
  
  // LinkedIn
  'linkedin-sponsored': { width: 1200, height: 627, name: 'LinkedIn Sponsored Content' },
  'linkedin-square': { width: 1200, height: 1200, name: 'LinkedIn Square' },
  
  // General
  'banner': { width: 1200, height: 300, name: 'Website Banner' },
  'hero': { width: 1920, height: 1080, name: 'Hero Image' },
} as const;

export type AdSizeKey = keyof typeof AD_SIZES;

interface GeneratedAdImage {
  prompt: string;
  size: { width: number; height: number; name: string };
  platform: string;
  base64Data?: string;
  savedPath?: string;
  mimeType: string;
}

/**
 * Generate an ad image using Nano Banana
 */
export async function generateAdImage(options: {
  product: string;
  headline: string;
  style?: 'modern' | 'minimal' | 'bold' | 'professional' | 'playful';
  colorScheme?: string;
  platform: AdSizeKey;
  includeText?: boolean;
  savePath?: string;
}): Promise<GeneratedAdImage> {
  const {
    product,
    headline,
    style = 'professional',
    colorScheme = 'blue and white',
    platform,
    includeText = true,
    savePath,
  } = options;

  const safeProduct = sanitizeInput(product);
  const safeHeadline = sanitizeInput(headline);
  const size = AD_SIZES[platform];

  const client = getGenAI();

  // Build the image generation prompt
  const imagePrompt = `Create a ${style} advertisement image for ${safeProduct}.
${includeText ? `The ad should prominently display the headline: "${safeHeadline}"` : 'No text in the image, just compelling visuals.'}
Color scheme: ${colorScheme}
Style: Clean, high-quality, professional marketing image
Dimensions: ${size.width}x${size.height} pixels (${size.name})
The image should be suitable for ${size.name} advertising.
Make it eye-catching and conversion-focused.
No watermarks, no stock photo artifacts.`;

  try {
    // Use Nano Banana for image generation
    const response = await client.models.generateContent({
      model: 'nano-banana-pro',
      contents: imagePrompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    let base64Data: string | undefined;
    let mimeType = 'image/png';

    // Extract image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    let savedPath: string | undefined;

    // Save to file if path provided
    if (base64Data && savePath) {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(savePath, buffer);
      savedPath = savePath;
    }

    await logAction(
      'email' as Platform,
      'generate_ad_image',
      true,
      undefined,
      undefined,
      { product, platform, style, hasImage: !!base64Data }
    );

    return {
      prompt: imagePrompt,
      size,
      platform,
      base64Data,
      savedPath,
      mimeType,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(
      'email' as Platform,
      'generate_ad_image',
      false,
      undefined,
      undefined,
      { product, platform },
      undefined,
      errorMsg
    );
    throw error;
  }
}

/**
 * Generate a complete ad set with multiple sizes
 */
export async function generateAdSet(options: {
  product: string;
  headline: string;
  style?: 'modern' | 'minimal' | 'bold' | 'professional' | 'playful';
  colorScheme?: string;
  platforms: AdSizeKey[];
  outputDir?: string;
}): Promise<GeneratedAdImage[]> {
  const { product, headline, style, colorScheme, platforms, outputDir } = options;

  const results: GeneratedAdImage[] = [];

  for (const platform of platforms) {
    const savePath = outputDir
      ? path.join(outputDir, `${platform}-${Date.now()}.png`)
      : undefined;

    try {
      const image = await generateAdImage({
        product,
        headline,
        style,
        colorScheme,
        platform,
        savePath,
      });
      results.push(image);
    } catch (error) {
      console.error(`Failed to generate ${platform} ad:`, error);
      // Continue with other platforms
    }
  }

  return results;
}

/**
 * Generate ad image with AI-generated copy
 * Combines Gemini text + Nano Banana image
 */
export async function generateCompleteAd(options: {
  product: string;
  targetAudience: string;
  platform: AdSizeKey;
  style?: 'modern' | 'minimal' | 'bold' | 'professional' | 'playful';
}): Promise<{
  headline: string;
  description: string;
  cta: string;
  image: GeneratedAdImage;
}> {
  const { product, targetAudience, platform, style = 'professional' } = options;

  const safeProduct = sanitizeInput(product);
  const safeAudience = sanitizeInput(targetAudience);

  const client = getGenAI();

  // First, generate the ad copy with Gemini
  const copyResponse = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Create compelling ad copy for:
Product/Service: ${safeProduct}
Target Audience: ${safeAudience}
Platform: ${AD_SIZES[platform].name}

Return JSON only:
{
  "headline": "Short, punchy headline (max 40 chars)",
  "description": "Supporting text (max 90 chars)",
  "cta": "Call to action button text"
}`,
  });

  const copyText = copyResponse.text || '{}';
  const jsonMatch = copyText.match(/\{[\s\S]*\}/);
  const copy = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  // Then generate the image with Nano Banana
  const image = await generateAdImage({
    product: safeProduct,
    headline: copy.headline || safeProduct,
    style,
    platform,
    includeText: true,
  });

  return {
    headline: copy.headline || '',
    description: copy.description || '',
    cta: copy.cta || 'Learn More',
    image,
  };
}

/**
 * Edit an existing image for ads (image editing with Nano Banana)
 */
export async function editAdImage(options: {
  imagePath: string;
  editInstructions: string;
  outputPath?: string;
}): Promise<GeneratedAdImage> {
  const { imagePath, editInstructions, outputPath } = options;

  const safeInstructions = sanitizeInput(editInstructions);

  const client = getGenAI();

  // Read the input image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await client.models.generateContent({
    model: 'nano-banana-pro',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: `Edit this image: ${safeInstructions}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ['image', 'text'],
    },
  });

  let resultBase64: string | undefined;
  let resultMimeType = 'image/png';

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        resultBase64 = part.inlineData.data;
        resultMimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }
  }

  let savedPath: string | undefined;
  if (resultBase64 && outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buffer = Buffer.from(resultBase64, 'base64');
    fs.writeFileSync(outputPath, buffer);
    savedPath = outputPath;
  }

  return {
    prompt: safeInstructions,
    size: { width: 0, height: 0, name: 'Edited' },
    platform: 'edited',
    base64Data: resultBase64,
    savedPath,
    mimeType: resultMimeType,
  };
}

// Export metadata
export const imageAdsMetadata = {
  name: 'image_ads',
  description: 'Generate ad images using Google Nano Banana',
  functions: [
    {
      name: 'generateAdImage',
      description: 'Generate a single ad image for a specific platform',
      parameters: { product: 'Product name', headline: 'Ad headline', platform: 'Ad size/platform' },
    },
    {
      name: 'generateAdSet',
      description: 'Generate multiple ad sizes at once',
      parameters: { product: 'Product name', platforms: 'Array of platform sizes' },
    },
    {
      name: 'generateCompleteAd',
      description: 'Generate both copy and image together',
      parameters: { product: 'Product name', targetAudience: 'Target audience' },
    },
    {
      name: 'editAdImage',
      description: 'Edit an existing image for ads',
      parameters: { imagePath: 'Path to image', editInstructions: 'What to change' },
    },
  ],
  availableSizes: Object.keys(AD_SIZES),
};

export default {
  generateAdImage,
  generateAdSet,
  generateCompleteAd,
  editAdImage,
  AD_SIZES,
  imageAdsMetadata,
};

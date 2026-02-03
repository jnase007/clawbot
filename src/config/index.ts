import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // Email
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('ProjectHunter.ai <noreply@projecthunter.ai>'),
  
  // LinkedIn
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  LINKEDIN_EMAIL: z.string().optional(),
  LINKEDIN_PASSWORD: z.string().optional(),
  
  // Reddit
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USER: z.string().optional(),
  REDDIT_PASS: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('ClawBot/1.0.0'),
  
  // Rate Limits
  EMAIL_RATE_LIMIT: z.coerce.number().default(1), // emails per second
  LINKEDIN_DAILY_LIMIT: z.coerce.number().default(50),
  REDDIT_RATE_LIMIT: z.coerce.number().default(10), // per minute
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';

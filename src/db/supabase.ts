import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import type { Database } from './types.js';

let supabase: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    supabase = createClient<Database>(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_KEY || config.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
        },
      }
    );
  }
  return supabase;
}

// Helper for error handling
export function handleSupabaseError(error: unknown, context: string): never {
  console.error(`Supabase error in ${context}:`, error);
  throw new Error(`Database error: ${context}`);
}

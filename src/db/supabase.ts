import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Use any type for flexibility with dynamic tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any;

let supabase: SupabaseClient<AnyDatabase> | null = null;

export function getSupabaseClient(): SupabaseClient<AnyDatabase> {
  if (!supabase) {
    supabase = createClient(
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

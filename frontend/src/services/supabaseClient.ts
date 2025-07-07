import { createClient } from '@supabase/supabase-js';

// Environment variables provided at build/deploy time (placeholders ok for local build)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If env vars missing, create a dummy stub to avoid runtime errors during static build
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ error: null }),
      },
      from: () => ({ update: () => ({ data: null, error: null }), select: () => ({ data: null, error: null }) }),
    } as any; 
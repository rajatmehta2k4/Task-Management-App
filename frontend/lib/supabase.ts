// supabase.ts — Creates the Supabase client for the frontend
// The frontend uses the ANON KEY (safe to expose, unlike the service key)
// Row Level Security policies protect data even with the anon key

import { createBrowserClient } from '@supabase/ssr'

// This function creates a Supabase client for use in browser (client) components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // The ! tells TypeScript "trust me, this won't be undefined"
    // (it's defined in .env.local)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
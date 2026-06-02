import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';

// ──────────────────────────────────────────────────────────────────────────
// SERVER-ONLY Supabase client (service-role key).
//
// All database access in this app happens inside trusted API routes, so the
// server uses the service-role key, which BYPASSES Row Level Security. This is
// the correct production pattern: the browser uses the anon key (see
// ./supabase.ts) with restricted RLS, while the server has full access.
//
// Do NOT import this module from client components. SUPABASE_SERVICE_ROLE_KEY
// has no NEXT_PUBLIC_ prefix, so Next.js replaces it with `undefined` in client
// bundles (this would be null there) and the key never ships to the browser.
// ──────────────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (typeof window === 'undefined' && supabaseUrl && !serviceRoleKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing on the server. Falling back to local file database.');
}

export const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  : null;

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) throw new Error('Supabase server persistence is not configured.');
  client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}

export function setSupabaseAdminForTests(value: SupabaseClient | null): void {
  if (process.env.NODE_ENV === 'production') throw new Error('Test database injection is disabled in production.');
  client = value;
}

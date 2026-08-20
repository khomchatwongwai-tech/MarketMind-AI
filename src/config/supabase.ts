import { createClient, SupabaseClient } from '../server/supabaseAdmin.js';
import { auth } from './firebase.js';

const env = (import.meta as any).env || {};
const url = String(env.VITE_SUPABASE_URL || '');
const publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      accessToken: async () => (await auth.currentUser?.getIdToken(false)) ?? null,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase persistence is not configured.');
  if (!auth.currentUser) throw new Error('Firebase authentication is required.');
  return supabase;
}

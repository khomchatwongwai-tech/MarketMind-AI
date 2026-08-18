import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260816215321_marketmind_persistence_rls.sql'), 'utf8');
const instrumentsMigration = readFileSync(join(process.cwd(), 'supabase/migrations/20260817010000_instruments_catalog_and_rls.sql'), 'utf8');
const tenantTables = ['user_profiles','watchlists','alerts','prediction_history','saved_ai_analyses','support_tickets','subscription_records','billing_invoices','broker_connections','ai_usage_records','community_posts'];

const deepResearchMigration = readFileSync(join(process.cwd(), 'supabase/migrations/20260817000000_deep_research_system.sql'), 'utf8');
const subscriptionMigration = readFileSync(join(process.cwd(), 'supabase/migrations/20260817_subscription_and_legal_consent.sql'), 'utf8');

test('every exposed MarketMind application table enables RLS', () => {
  for (const table of tenantTables) assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
});

test('owned records authorize with Firebase JWT subject rather than browser-provided identity', () => {
  for (const table of ['user_profiles','watchlists','alerts','prediction_history','support_tickets','broker_connections']) {
    assert.match(migration, new RegExp(`${table}[\\s\\S]*auth\\.jwt\\(\\)->>''?sub`, 'i'), `${table} is missing Firebase subject ownership enforcement`);
  }
  assert.doesNotMatch(migration, /user_metadata/i);
  assert.match(migration, /revoke all on all tables in schema public from anon/i);
});

test('deep research tables enable RLS and strictly enforce user ownership with zero default bypass', () => {
  const researchTables = ['research_jobs', 'research_reports', 'research_sources', 'research_claims', 'research_notes', 'research_watchlists'];
  for (const table of researchTables) {
    assert.match(deepResearchMigration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'));
  }
  assert.doesNotMatch(deepResearchMigration, /user_default/i, 'Deep research migration must not contain user_default bypass in production');
  assert.match(deepResearchMigration, /coalesce\(\(select auth\.jwt\(\)->>'sub'\), auth\.uid\(\)::text\) = user_id/i);
});

test('subscription and legal consent tables enable RLS and restrict user access', () => {
  const subTables = ['subscriptions', 'legal_consents', 'subscription_audit_logs', 'user_usage_records', 'billing_invoices'];
  for (const table of subTables) {
    assert.match(subscriptionMigration, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i'));
  }
  assert.match(subscriptionMigration, /coalesce\(\(select auth\.jwt\(\)->>'sub'\), auth\.uid\(\)::text\) = user_id/i);
});

test('billing and webhook authority are inaccessible to browser roles', () => {
  assert.doesNotMatch(migration, /grant[^;]*(subscription_records|billing_invoices|processed_webhook_events)[^;]*to authenticated/i);
  assert.match(migration, /grant execute on function public\.persist_stripe_event\(text,text,jsonb\) to service_role/i);
  assert.match(migration, /revoke all on function public\.persist_stripe_event\(text,text,jsonb\) from public, anon, authenticated/i);
});

test('private user storage requires UID-prefixed object paths', () => {
  assert.match(migration, /values \('user-content', 'user-content', false/i);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.jwt\(\)->>'sub'\)/i);
});

test('instruments table enables RLS and restricts modifications to service_role', () => {
  assert.match(instrumentsMigration, /alter table public\.instruments enable row level security/i);
  assert.match(instrumentsMigration, /create policy "Public active instruments are viewable by all"/i);
  assert.match(instrumentsMigration, /create policy "Service role has full management over instruments"/i);
  assert.match(instrumentsMigration, /to service_role/i);
});

test('client-side config never exposes SUPABASE_SECRET_KEY to browser', () => {
  const clientConfig = readFileSync(join(process.cwd(), 'src/config/supabase.ts'), 'utf8');
  assert.doesNotMatch(clientConfig, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(clientConfig, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(clientConfig, /VITE_SUPABASE_PUBLISHABLE_KEY/);
});

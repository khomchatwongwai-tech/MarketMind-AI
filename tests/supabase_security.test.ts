import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260816215321_marketmind_persistence_rls.sql'), 'utf8');
const tenantTables = ['user_profiles','watchlists','alerts','prediction_history','saved_ai_analyses','support_tickets','subscription_records','billing_invoices','broker_connections','ai_usage_records','community_posts'];

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

test('billing and webhook authority are inaccessible to browser roles', () => {
  assert.doesNotMatch(migration, /grant[^;]*(subscription_records|billing_invoices|processed_webhook_events)[^;]*to authenticated/i);
  assert.match(migration, /grant execute on function public\.persist_stripe_event\(text,text,jsonb\) to service_role/i);
  assert.match(migration, /revoke all on function public\.persist_stripe_event\(text,text,jsonb\) from public, anon, authenticated/i);
});

test('private user storage requires UID-prefixed object paths', () => {
  assert.match(migration, /values \('user-content', 'user-content', false/i);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.jwt\(\)->>'sub'\)/i);
});

-- MarketMind AI persistent application schema.
-- Firebase remains the identity provider; auth.jwt()->>'sub' is the Firebase UID.

create extension if not exists pgcrypto;

create table public.user_profiles (
  firebase_uid text primary key,
  email text not null default '',
  profile jsonb not null default '{}'::jsonb,
  role text not null default 'user' check (role in ('user','premium_user','support','moderator','admin','super_admin')),
  plan text not null default 'free' check (plan in ('free','basic','pro','premium','institutional','enterprise')),
  subscription_status text not null default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.watchlists (
  id text primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.alerts (
  id text primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.prediction_history (
  id text primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.saved_ai_analyses (
  id uuid primary key default gen_random_uuid(), firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  symbol text not null, analysis_type text not null, data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.support_tickets (
  id text primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  status text not null default 'Open', data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscription_records (
  id uuid primary key default gen_random_uuid(), firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  provider text not null default 'stripe', provider_subscription_id text unique, status text not null, plan text not null,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.billing_invoices (
  id text primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  data jsonb not null, created_at timestamptz not null default now()
);
create table public.broker_connections (
  id uuid primary key default gen_random_uuid(), firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  provider text not null, external_account_id text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(firebase_uid, provider, external_account_id)
);
create table public.ai_usage_records (
  id bigint generated always as identity primary key, firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  operation text not null, model text, units integer not null default 1 check (units >= 0), metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.community_posts (
  id uuid primary key default gen_random_uuid(), firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000), metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.processed_webhook_events (
  event_id text primary key, provider text not null, processed_at timestamptz not null default now()
);

create or replace function public.persist_stripe_event(p_event_id text, p_firebase_uid text, p_updates jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.processed_webhook_events(event_id, provider) values (p_event_id, 'stripe')
  on conflict do nothing;
  if not found then return false; end if;
  if p_firebase_uid is not null and p_updates is not null then
    update public.user_profiles set
      profile = profile || p_updates,
      plan = coalesce(p_updates->>'plan', plan),
      subscription_status = coalesce(p_updates->>'subscriptionStatus', subscription_status),
      stripe_customer_id = coalesce(p_updates->>'paymentCustomerId', stripe_customer_id),
      stripe_subscription_id = coalesce(p_updates->>'paymentSubscriptionId', stripe_subscription_id),
      updated_at = now()
    where firebase_uid = p_firebase_uid;
    if not found then raise exception 'Webhook user account was not found'; end if;
  end if;
  return true;
end $$;
revoke all on function public.persist_stripe_event(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.persist_stripe_event(text,text,jsonb) to service_role;

create index watchlists_owner_created_idx on public.watchlists(firebase_uid, created_at desc);
create index alerts_owner_created_idx on public.alerts(firebase_uid, created_at desc);
create index predictions_owner_created_idx on public.prediction_history(firebase_uid, created_at desc);
create index analyses_owner_created_idx on public.saved_ai_analyses(firebase_uid, created_at desc);
create index support_owner_created_idx on public.support_tickets(firebase_uid, created_at desc);
create index invoices_owner_created_idx on public.billing_invoices(firebase_uid, created_at desc);
create index broker_owner_idx on public.broker_connections(firebase_uid);
create index usage_owner_created_idx on public.ai_usage_records(firebase_uid, created_at desc);
create index community_created_idx on public.community_posts(created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare table_name text; begin
  foreach table_name in array array['user_profiles','watchlists','alerts','prediction_history','saved_ai_analyses','support_tickets','subscription_records','broker_connections','community_posts'] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

alter table public.user_profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.alerts enable row level security;
alter table public.prediction_history enable row level security;
alter table public.saved_ai_analyses enable row level security;
alter table public.support_tickets enable row level security;
alter table public.subscription_records enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.broker_connections enable row level security;
alter table public.ai_usage_records enable row level security;
alter table public.community_posts enable row level security;
alter table public.processed_webhook_events enable row level security;

-- No anonymous Data API access. Service-only tables intentionally have no authenticated policies.
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert on public.user_profiles to authenticated;
grant update (email, profile, updated_at) on public.user_profiles to authenticated;
grant select, insert, update, delete on public.watchlists, public.alerts, public.prediction_history,
  public.saved_ai_analyses, public.broker_connections, public.ai_usage_records, public.community_posts to authenticated;
grant select, insert on public.support_tickets to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy profiles_select_own on public.user_profiles for select to authenticated using ((select auth.jwt()->>'sub') = firebase_uid);
create policy profiles_insert_own on public.user_profiles for insert to authenticated with check ((select auth.jwt()->>'sub') = firebase_uid and role = 'user' and plan = 'free' and subscription_status = 'free');
create policy profiles_update_own on public.user_profiles for update to authenticated
  using ((select auth.jwt()->>'sub') = firebase_uid)
  with check ((select auth.jwt()->>'sub') = firebase_uid);

do $$ declare table_name text; begin
  foreach table_name in array array['watchlists','alerts','prediction_history','saved_ai_analyses','broker_connections','ai_usage_records'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.jwt()->>''sub'') = firebase_uid)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.jwt()->>''sub'') = firebase_uid)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.jwt()->>''sub'') = firebase_uid) with check ((select auth.jwt()->>''sub'') = firebase_uid)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.jwt()->>''sub'') = firebase_uid)', table_name || '_delete_own', table_name);
  end loop;
end $$;
create policy support_select_own on public.support_tickets for select to authenticated using ((select auth.jwt()->>'sub') = firebase_uid);
create policy support_insert_own on public.support_tickets for insert to authenticated with check ((select auth.jwt()->>'sub') = firebase_uid and status = 'Open');
create policy community_read_authenticated on public.community_posts for select to authenticated using (true);
create policy community_insert_own on public.community_posts for insert to authenticated with check ((select auth.jwt()->>'sub') = firebase_uid);
create policy community_update_own on public.community_posts for update to authenticated using ((select auth.jwt()->>'sub') = firebase_uid) with check ((select auth.jwt()->>'sub') = firebase_uid);
create policy community_delete_own on public.community_posts for delete to authenticated using ((select auth.jwt()->>'sub') = firebase_uid);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-content', 'user-content', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy user_content_select_own on storage.objects for select to authenticated using (bucket_id = 'user-content' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
create policy user_content_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'user-content' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
create policy user_content_update_own on storage.objects for update to authenticated using (bucket_id = 'user-content' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')) with check (bucket_id = 'user-content' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
create policy user_content_delete_own on storage.objects for delete to authenticated using (bucket_id = 'user-content' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));

do $$ begin
  alter publication supabase_realtime add table public.watchlists, public.alerts, public.prediction_history, public.support_tickets, public.community_posts;
exception when duplicate_object then null;
end $$;

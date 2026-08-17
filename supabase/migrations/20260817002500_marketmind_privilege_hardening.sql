alter default privileges for role postgres in schema public
revoke all on tables from anon, authenticated;

revoke truncate, references, trigger
on all tables in schema public
from anon, authenticated;

revoke all privileges on
  public.billing_invoices,
  public.processed_webhook_events,
  public.subscription_records
from anon, authenticated;

revoke all privileges on
  public.user_profiles,
  public.watchlists,
  public.alerts,
  public.prediction_history,
  public.saved_ai_analyses,
  public.broker_connections,
  public.ai_usage_records,
  public.community_posts,
  public.support_tickets
from anon, authenticated;

grant select, insert, update
on public.user_profiles
to authenticated;

grant select, insert, update, delete on
  public.watchlists,
  public.alerts,
  public.prediction_history,
  public.saved_ai_analyses,
  public.broker_connections,
  public.ai_usage_records,
  public.community_posts
to authenticated;

grant select, insert
on public.support_tickets
to authenticated;

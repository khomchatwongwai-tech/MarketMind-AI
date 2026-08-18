# MarketMind AI Supabase setup

MarketMind keeps Firebase Authentication for identity. Supabase stores application, billing, Realtime, and private file data.

## Separate project

Create a dedicated Supabase project for MarketMind AI. Do not reuse a ShiftForce project.

In Supabase Dashboard, open **Authentication → Third-Party Auth → Firebase** and register Firebase project ID:

`gen-lang-client-0282286222`

Firebase users must receive the trusted custom claim `role: "authenticated"`, then refresh their Firebase ID token. The browser Supabase client forwards that Firebase token through its `accessToken` callback.

## Apply and verify the migration

Link this repository to the MarketMind Supabase project, review the target carefully, then apply the generated migration:

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref YOUR_MARKETMIND_PROJECT_REF
pnpm dlx supabase db push --linked --dry-run
pnpm dlx supabase db push --linked
pnpm dlx supabase db lint --linked --level error --fail-on error
pnpm dlx supabase db advisors --linked
```

The migration enables RLS on every exposed application table, denies anonymous table access, protects records using the Firebase JWT `sub`, reserves billing/webhook tables for the server role, creates a private UID-prefixed Storage bucket, and publishes selected user-data tables to Realtime.

## Render variables

Set these without exposing their values in logs or source:

- `VITE_SUPABASE_URL` — MarketMind Supabase project URL (browser build)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — browser-safe publishable key
- `SUPABASE_URL` — same project URL for the server
- `SUPABASE_SECRET_KEY` — server-only secret key; never use a `VITE_` prefix

Keep all existing Firebase variables because Firebase Authentication remains active.

## Required live security checks

Before production deployment, test with two real Firebase users and verify that User A cannot select, update, or delete User B's profile, watchlists, alerts, predictions, support tickets, or broker metadata. Also verify unauthenticated Data API, Storage, and Realtime access is denied. Do not deploy until the linked database lint and advisors have no unresolved critical findings.

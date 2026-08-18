-- ==============================================================================
-- MarketMind AI - Subscription, Billing, Entitlements & Legal Consent Migration
-- ==============================================================================

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'basic', 'pro', 'premium', 'ultra')),
    status TEXT NOT NULL CHECK (status IN ('free', 'trialing', 'active', 'past_due', 'canceled', 'expired')),
    provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'apple', 'google', 'none', 'manual')),
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual', 'none')),
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    has_used_trial BOOLEAN NOT NULL DEFAULT FALSE,
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    provider_product_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider);

-- 2. Legal Consent Records Table
CREATE TABLE IF NOT EXISTS legal_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('terms_of_service', 'privacy_policy', 'subscription_terms', 'financial_ai_disclaimer')),
    document_version TEXT NOT NULL DEFAULT 'v1.0',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    billing_interval TEXT NOT NULL DEFAULT 'none',
    consent_context TEXT NOT NULL CHECK (consent_context IN ('trial_signup', 'checkout', 'settings_reconsent', 'modal_agreement')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_consents_user_doc ON legal_consents(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_legal_consents_accepted_at ON legal_consents(accepted_at);

-- 3. Subscription & Entitlement Audit Logs
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    previous_plan_id TEXT,
    status TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    amount_usd NUMERIC(10, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON subscription_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON subscription_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON subscription_audit_logs(created_at);

-- 4. User Usage Records (Daily/Monthly Entitlement Counters)
CREATE TABLE IF NOT EXISTS user_usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ai_requests_count INT NOT NULL DEFAULT 0,
    ai_requests_limit INT NOT NULL DEFAULT 25,
    deep_research_count INT NOT NULL DEFAULT 0,
    deep_research_limit INT NOT NULL DEFAULT 10,
    saved_reports_count INT NOT NULL DEFAULT 0,
    saved_reports_limit INT NOT NULL DEFAULT 25,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_usage_date UNIQUE (user_id, period_date)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_lookup ON user_usage_records(user_id, period_date);

-- 5. Billing Invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    amount_usd NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    plan_name TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- Users can read their own records
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);
CREATE POLICY "Users can view own legal consents" ON legal_consents FOR SELECT USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);
CREATE POLICY "Users can insert own legal consents" ON legal_consents FOR INSERT WITH CHECK (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);
CREATE POLICY "Users can view own usage" ON user_usage_records FOR SELECT USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);
CREATE POLICY "Users can view own invoices" ON billing_invoices FOR SELECT USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);

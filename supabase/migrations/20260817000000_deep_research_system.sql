-- ==========================================================
-- MARKETMIND AI — DEEP RESEARCH & MARKET INTELLIGENCE SCHEMA
-- ==========================================================

-- 1. Research Jobs Table
CREATE TABLE IF NOT EXISTS public.research_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'deep_research',
    target_symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    current_stage TEXT NOT NULL DEFAULT 'queued',
    steps_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    report_id TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_research_jobs_user_id_created ON public.research_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_jobs_status ON public.research_jobs (status);

-- 2. Research Reports Table
CREATE TABLE IF NOT EXISTS public.research_reports (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES public.research_jobs(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    research_question TEXT NOT NULL,
    ticker TEXT NOT NULL,
    company_name TEXT NOT NULL,
    asset_class TEXT NOT NULL DEFAULT 'Equities',
    mode TEXT NOT NULL DEFAULT 'deep_research',
    executive_summary TEXT NOT NULL,
    company_overview TEXT NOT NULL,
    market_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    bull_thesis JSONB NOT NULL DEFAULT '[]'::jsonb,
    bear_thesis JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_catalysts JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    financial_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    valuation JSONB NOT NULL DEFAULT '{}'::jsonb,
    sec_filing_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    earnings_intelligence JSONB,
    options_intelligence JSONB,
    technical_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
    macro_sensitivity JSONB NOT NULL DEFAULT '{}'::jsonb,
    industry_and_competitors JSONB NOT NULL DEFAULT '{}'::jsonb,
    scenario_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    thesis_invalidation JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_to_monitor_next JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_changed JSONB,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    claims JSONB NOT NULL DEFAULT '[]'::jsonb,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_score INTEGER NOT NULL DEFAULT 90,
    data_freshness JSONB NOT NULL DEFAULT '{}'::jsonb,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_research_reports_user_ticker ON public.research_reports (user_id, ticker, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_reports_ticker ON public.research_reports (ticker);

-- 3. Research Sources Table
CREATE TABLE IF NOT EXISTS public.research_sources (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES public.research_reports(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    source_type TEXT NOT NULL,
    tier SMALLINT NOT NULL DEFAULT 2,
    author TEXT,
    published_at TIMESTAMPTZ,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    entity TEXT,
    symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
    content_hash TEXT NOT NULL,
    freshness_seconds INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT true,
    excerpt TEXT
);

CREATE INDEX IF NOT EXISTS idx_research_sources_report_id ON public.research_sources (report_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_tier ON public.research_sources (tier);

-- 4. Research Claims Table
CREATE TABLE IF NOT EXISTS public.research_claims (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES public.research_reports(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    category TEXT NOT NULL,
    data_type TEXT NOT NULL DEFAULT 'VERIFIED',
    confidence TEXT NOT NULL DEFAULT 'HIGH',
    source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    verified BOOLEAN NOT NULL DEFAULT true,
    conflicting_source_ids JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_research_claims_report_id ON public.research_claims (report_id);

-- 5. Research Notes Table
CREATE TABLE IF NOT EXISTS public.research_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    report_id TEXT REFERENCES public.research_reports(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_research_notes_user_id ON public.research_notes (user_id, created_at DESC);

-- 6. Research Watchlists Table
CREATE TABLE IF NOT EXISTS public.research_watchlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    target_price_alert NUMERIC,
    last_report_id TEXT,
    last_report_date TIMESTAMPTZ,
    thesis_direction TEXT NOT NULL DEFAULT 'BULLISH',
    active_catalysts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_research_watchlists_user_id ON public.research_watchlists (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_watchlists ENABLE ROW LEVEL SECURITY;

-- Production Security Policies
CREATE POLICY "Users can manage their own research jobs"
    ON public.research_jobs FOR ALL
    USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id)
    WITH CHECK (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);

CREATE POLICY "Users can manage their own research reports"
    ON public.research_reports FOR ALL
    USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id)
    WITH CHECK (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);

CREATE POLICY "Users can manage their own research notes"
    ON public.research_notes FOR ALL
    USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id)
    WITH CHECK (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);

CREATE POLICY "Users can manage their own research watchlists"
    ON public.research_watchlists FOR ALL
    USING (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id)
    WITH CHECK (coalesce((select auth.jwt()->>'sub'), auth.uid()::text) = user_id);

-- Migration: 20260817010000_instruments_catalog_and_rls.sql
-- Description: Scalable 5,000+ US Stock and ETF Instrument Master with RLS & Autocomplete Indexing

CREATE TABLE IF NOT EXISTS public.instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL DEFAULT 'NYSE/NASDAQ',
    asset_class TEXT NOT NULL DEFAULT 'us_equity',
    asset_type TEXT NOT NULL DEFAULT 'STOCK',
    tradable BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active',
    sector TEXT,
    industry TEXT,
    provider TEXT NOT NULL DEFAULT 'alpaca',
    provider_asset_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON public.instruments (symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_name ON public.instruments (name);
CREATE INDEX IF NOT EXISTS idx_instruments_exchange ON public.instruments (exchange);
CREATE INDEX IF NOT EXISTS idx_instruments_active ON public.instruments (active);
CREATE INDEX IF NOT EXISTS idx_instruments_asset_type ON public.instruments (asset_type);

-- Full-text / trigram search index for fast autocomplete
CREATE INDEX IF NOT EXISTS idx_instruments_search ON public.instruments USING gin (to_tsvector('english', symbol || ' ' || name));

-- Row Level Security (RLS)
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Any authenticated or anonymous user can query active instruments
DROP POLICY IF EXISTS "Public active instruments are viewable by all" ON public.instruments;
CREATE POLICY "Public active instruments are viewable by all"
    ON public.instruments
    FOR SELECT
    USING (active = true);

-- 2. Service Role & Admin Write Policy: Only backend service role or admin can insert/update/delete
DROP POLICY IF EXISTS "Service role has full management over instruments" ON public.instruments;
CREATE POLICY "Service role has full management over instruments"
    ON public.instruments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_instruments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_instruments_updated_at ON public.instruments;
CREATE TRIGGER trigger_instruments_updated_at
    BEFORE UPDATE ON public.instruments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_instruments_updated_at();

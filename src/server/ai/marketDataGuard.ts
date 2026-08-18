export interface AuthoritativeMarketData {
  quote?: { price?: number; metadata?: { validationStatus?: string; stale?: boolean }; dataSource?: string };
  entitlementStatus?: { isAvailable?: boolean };
}

/** Rejects live-market workflows before an LLM can see or invent a quote. */
export function requireAuthoritativeMarketData(data: AuthoritativeMarketData | undefined): void {
  const quote = data?.quote;
  if (!data?.entitlementStatus?.isAvailable || !quote || !Number.isFinite(quote.price) || quote.price! <= 0 || quote.metadata?.stale || quote.metadata?.validationStatus === 'UNAVAILABLE') {
    throw new Error('AUTHORITATIVE_MARKET_DATA_UNAVAILABLE');
  }
}

export function guardMarketData(_text: string, requiresLiveMarketData: boolean, authoritativeContext?: Record<string, unknown>): string[] {
  if (!requiresLiveMarketData) return [];
  requireAuthoritativeMarketData(authoritativeContext?.marketData as AuthoritativeMarketData | undefined);
  return [];
}

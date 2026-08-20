export interface VerifiedMarketCatalyst {
  id: string;
  symbol: string;
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string; // ISO date string or numeric string
  publishedAtMs: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';
}

export function validateVerifiedCatalyst(item: any, lastVisitMs?: number): VerifiedMarketCatalyst | null {
  if (!item || typeof item !== 'object') return null;

  // 1. Must have title/headline
  const title = (item.title || item.headline || '').trim();
  if (!title) return null;

  // 2. Must have source name
  const source = (item.source || item.provider || '').trim();
  if (!source) return null;

  // 3. Must have valid source URL
  const url = (item.url || item.link || '').trim();
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return null;

  // 4. Must have valid publication timestamp
  const rawTime = item.timestamp || item.publishedTime || item.publishedAt;
  if (!rawTime) return null;

  const parsedMs = Date.parse(rawTime);
  if (isNaN(parsedMs) || parsedMs <= 0) return null;

  // 5. Must have explicit VERIFIED status
  const verificationStatus = item.verificationStatus || item.verification;
  if (verificationStatus !== 'VERIFIED') return null;

  // 6. Freshness check: Reject stale items if published before lastVisitMs (when lastVisitMs is provided)
  if (lastVisitMs && lastVisitMs > 0) {
    // If the published item is older than the last visit, reject it for "since last visit"
    if (parsedMs < lastVisitMs) return null;
  }

  // 7. Symbol
  const symbol = (item.symbol || item.ticker || 'SPY').toUpperCase();

  // 8. Description
  const description = (item.description || item.aiExplanation || item.summary || '').trim();

  // 9. Sentiment
  const sentiment =
    item.sentiment === 'BULLISH'
      ? 'BULLISH'
      : item.sentiment === 'BEARISH'
      ? 'BEARISH'
      : 'NEUTRAL';

  return {
    id: item.id || `cat_${symbol}_${parsedMs}`,
    symbol,
    title,
    description,
    source,
    url,
    timestamp: new Date(parsedMs).toISOString(),
    publishedAtMs: parsedMs,
    sentiment,
    verificationStatus: 'VERIFIED',
  };
}

export function formatRelativeTime(publishedAtMs: number, nowMs: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - publishedAtMs) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

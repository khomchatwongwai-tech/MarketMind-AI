/**
 * MarketMind AI - Safe Market Data Formatters
 *
 * Centralized, fail-closed numerical formatters for market prices, percentages,
 * volumes, and indicators. Prevents React render crashes when upstream market data
 * is null, undefined, NaN, Infinity, or stale/unavailable.
 */

export function isFiniteMarketNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatPrice(
  value: unknown,
  decimals: number = 2,
  fallback: string = 'N/A'
): string {
  if (!isFiniteMarketNumber(value) || value <= 0) {
    return fallback;
  }
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPercent(
  value: unknown,
  decimals: number = 2,
  includeSign: boolean = true,
  fallback: string = 'N/A'
): string {
  if (!isFiniteMarketNumber(value)) {
    return fallback;
  }
  const sign = includeSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(
  value: unknown,
  decimals: number = 2,
  fallback: string = 'N/A'
): string {
  if (!isFiniteMarketNumber(value)) {
    return fallback;
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVolume(
  value: unknown,
  fallback: string = 'N/A'
): string {
  if (!isFiniteMarketNumber(value) || value <= 0) {
    return fallback;
  }
  if (value >= 1e9) {
    return `${Number((value / 1e9).toFixed(2))}B`;
  }
  if (value >= 1e6) {
    return `${Number((value / 1e6).toFixed(2))}M`;
  }
  if (value >= 1e3) {
    return `${Number((value / 1e3).toFixed(1))}K`;
  }
  return value.toLocaleString('en-US');
}

export function safeFixed(
  value: unknown,
  decimals: number = 2,
  fallback: string = 'N/A'
): string {
  if (!isFiniteMarketNumber(value)) {
    return fallback;
  }
  return value.toFixed(decimals);
}

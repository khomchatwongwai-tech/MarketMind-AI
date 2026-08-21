import { FundamentalsProvider, NormalizedFundamentals, NormalizedMetric } from './FundamentalsProvider.js';
import { FmpFundamentalsProvider } from './FmpFundamentalsProvider.js';
import { SecFactsFundamentalsProvider } from './SecFactsFundamentalsProvider.js';

interface CacheEntry {
  data: NormalizedFundamentals;
  expiresAt: number;
}

function createUnavailableMetric<T>(source: string, timestamp: string): NormalizedMetric<T> {
  return {
    value: null,
    source,
    timestamp,
    validationStatus: 'UNAVAILABLE',
  };
}

export class FundamentalsService {
  private static cache = new Map<string, CacheEntry>();
  private static readonly TTL_MS = 6 * 60 * 60 * 1000; // 6 hours cache TTL for fundamentals

  private static providers: FundamentalsProvider[] = [
    new FmpFundamentalsProvider(),
    new SecFactsFundamentalsProvider(),
  ];

  public static async getFundamentals(symbol: string): Promise<NormalizedFundamentals> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const now = Date.now();
    const isoNow = new Date(now).toISOString();

    // Check cache
    const cached = this.cache.get(cleanSymbol);
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    // Try providers in order
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          const res = await provider.getFundamentals(cleanSymbol);
          if (res) {
            this.cache.set(cleanSymbol, {
              data: res,
              expiresAt: now + this.TTL_MS,
            });
            return res;
          }
        } catch (err) {
          console.warn(`[FundamentalsService] Provider ${provider.name} failed for ${cleanSymbol}:`, err);
        }
      }
    }

    // Fallback: UNAVAILABLE
    const unavailable: NormalizedFundamentals = {
      symbol: cleanSymbol,
      companyName: null,
      marketCap: createUnavailableMetric('UNAVAILABLE', isoNow),
      enterpriseValue: createUnavailableMetric('UNAVAILABLE', isoNow),
      revenue: createUnavailableMetric('UNAVAILABLE', isoNow),
      revenueGrowth: createUnavailableMetric('UNAVAILABLE', isoNow),
      eps: createUnavailableMetric('UNAVAILABLE', isoNow),
      epsGrowth: createUnavailableMetric('UNAVAILABLE', isoNow),
      grossMargin: createUnavailableMetric('UNAVAILABLE', isoNow),
      operatingMargin: createUnavailableMetric('UNAVAILABLE', isoNow),
      netMargin: createUnavailableMetric('UNAVAILABLE', isoNow),
      freeCashFlow: createUnavailableMetric('UNAVAILABLE', isoNow),
      cash: createUnavailableMetric('UNAVAILABLE', isoNow),
      debt: createUnavailableMetric('UNAVAILABLE', isoNow),
      peRatio: createUnavailableMetric('UNAVAILABLE', isoNow),
      forwardPeRatio: createUnavailableMetric('UNAVAILABLE', isoNow),
      priceToSales: createUnavailableMetric('UNAVAILABLE', isoNow),
      evToEbitda: createUnavailableMetric('UNAVAILABLE', isoNow),
      roe: createUnavailableMetric('UNAVAILABLE', isoNow),
      nextEarningsDate: createUnavailableMetric('UNAVAILABLE', isoNow),
      earningsEstimates: createUnavailableMetric('UNAVAILABLE', isoNow),
      analystConsensus: createUnavailableMetric('UNAVAILABLE', isoNow),
      provider: 'UNAVAILABLE',
      status: 'UNAVAILABLE',
      fetchedAt: isoNow,
    };

    this.cache.set(cleanSymbol, {
      data: unavailable,
      expiresAt: now + 300000, // Short 5-min cache for unavailable to allow retry
    });

    return unavailable;
  }
}

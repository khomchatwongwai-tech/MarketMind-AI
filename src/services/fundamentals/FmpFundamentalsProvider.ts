import { FundamentalsProvider, NormalizedFundamentals, NormalizedMetric } from './FundamentalsProvider.js';

function createMetric<T>(val: T | null | undefined, source: string, timestamp: string): NormalizedMetric<T> {
  const isValValid = val !== null && val !== undefined && !Number.isNaN(val as any);
  return {
    value: isValValid ? (val as T) : null,
    source,
    timestamp,
    validationStatus: isValValid ? 'VERIFIED' : 'UNAVAILABLE',
  };
}

export class FmpFundamentalsProvider implements FundamentalsProvider {
  public readonly name = 'Financial Modeling Prep (FMP)';

  public isAvailable(): boolean {
    return Boolean(process.env.FMP_API_KEY && process.env.FMP_API_KEY.trim().length > 0);
  }

  public async getFundamentals(symbol: string): Promise<NormalizedFundamentals | null> {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return null;

    const cleanSymbol = symbol.trim().toUpperCase();
    const now = new Date().toISOString();
    const sourceTag = 'Financial Modeling Prep API';

    try {
      // 1. Fetch Profile and Key Metrics
      const [profileRes, metricsRes, growthRes, consensusRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/profile/${cleanSymbol}?apikey=${apiKey}`).then((r) =>
          r.ok ? r.json() : null
        ).catch(() => null),
        fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${cleanSymbol}?limit=1&apikey=${apiKey}`).then((r) =>
          r.ok ? r.json() : null
        ).catch(() => null),
        fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${cleanSymbol}?limit=1&apikey=${apiKey}`).then((r) =>
          r.ok ? r.json() : null
        ).catch(() => null),
        fetch(`https://financialmodelingprep.com/api/v3/analyst-stock-price-target/${cleanSymbol}?apikey=${apiKey}`).then((r) =>
          r.ok ? r.json() : null
        ).catch(() => null),
      ]);

      const profile = Array.isArray(profileRes) && profileRes.length > 0 ? profileRes[0] : null;
      const metrics = Array.isArray(metricsRes) && metricsRes.length > 0 ? metricsRes[0] : null;
      const growth = Array.isArray(growthRes) && growthRes.length > 0 ? growthRes[0] : null;
      const consensus = Array.isArray(consensusRes) && consensusRes.length > 0 ? consensusRes[0] : null;

      if (!profile && !metrics) {
        return null;
      }

      const companyName = profile?.companyName || profile?.name || null;
      const sector = profile?.sector || null;
      const industry = profile?.industry || null;

      return {
        symbol: cleanSymbol,
        companyName,
        sector,
        industry,
        marketCap: createMetric(profile?.mktCap || profile?.marketCap, sourceTag, now),
        enterpriseValue: createMetric(metrics?.enterpriseValueTTM || metrics?.enterpriseValue, sourceTag, now),
        revenue: createMetric(metrics?.revenueTTM, sourceTag, now),
        revenueGrowth: createMetric(growth?.revenueGrowth ? growth.revenueGrowth * 100 : null, sourceTag, now),
        eps: createMetric(profile?.eps || metrics?.netIncomePerShareTTM, sourceTag, now),
        epsGrowth: createMetric(growth?.epsgrowth ? growth.epsgrowth * 100 : null, sourceTag, now),
        grossMargin: createMetric(metrics?.grossProfitMarginTTM ? metrics.grossProfitMarginTTM * 100 : null, sourceTag, now),
        operatingMargin: createMetric(metrics?.operatingProfitMarginTTM ? metrics.operatingProfitMarginTTM * 100 : null, sourceTag, now),
        netMargin: createMetric(metrics?.netProfitMarginTTM ? metrics.netProfitMarginTTM * 100 : null, sourceTag, now),
        freeCashFlow: createMetric(metrics?.freeCashFlowTTM, sourceTag, now),
        cash: createMetric(metrics?.cashAndCashEquivalentsTTM, sourceTag, now),
        debt: createMetric(metrics?.totalDebtTTM, sourceTag, now),
        peRatio: createMetric(profile?.pe || metrics?.peRatioTTM, sourceTag, now),
        forwardPeRatio: createMetric(metrics?.forwardPE, sourceTag, now),
        priceToSales: createMetric(metrics?.priceToSalesRatioTTM, sourceTag, now),
        evToEbitda: createMetric(metrics?.enterpriseValueMultipleTTM, sourceTag, now),
        roe: createMetric(metrics?.roeTTM ? metrics.roeTTM * 100 : null, sourceTag, now),
        nextEarningsDate: createMetric(profile?.earningsAnnouncement || null, sourceTag, now),
        earningsEstimates: createMetric(null, sourceTag, now),
        analystConsensus: createMetric(
          consensus
            ? {
                rating: consensus.targetConsensus ? String(consensus.targetConsensus) : null,
                targetPrice: consensus.targetConsensus ? Number(consensus.targetConsensus) : null,
                targetHigh: consensus.targetHigh ? Number(consensus.targetHigh) : null,
                targetLow: consensus.targetLow ? Number(consensus.targetLow) : null,
                totalAnalysts: consensus.publishedAnalysts ? Number(consensus.publishedAnalysts) : null,
              }
            : null,
          sourceTag,
          now
        ),
        provider: this.name,
        status: 'VERIFIED',
        fetchedAt: now,
      };
    } catch {
      return null;
    }
  }
}

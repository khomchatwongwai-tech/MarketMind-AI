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

export class SecFactsFundamentalsProvider implements FundamentalsProvider {
  public readonly name = 'U.S. SEC EDGAR Company Facts';

  public isAvailable(): boolean {
    return true; // Server-side SEC EDGAR public facts interface
  }

  public async getFundamentals(symbol: string): Promise<NormalizedFundamentals | null> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const now = new Date().toISOString();
    const sourceTag = 'SEC EDGAR Official Disclosures';

    try {
      // Import SecEdgarService dynamically or statically
      const { SecEdgarService } = await import('../deepResearch/secEdgarService.js');
      const profile = await SecEdgarService.getCompanyFilings(cleanSymbol);

      if (!profile || profile.cik === '0000000000' || !profile.filings || profile.filings.length === 0) {
        return null; // Return null if SEC CIK is unavailable or unverified
      }

      return {
        symbol: cleanSymbol,
        companyName: profile.name || `${cleanSymbol} Corp`,
        sector: profile.sicDescription || null,
        industry: profile.sicDescription || null,
        marketCap: createMetric(null, sourceTag, now),
        enterpriseValue: createMetric(null, sourceTag, now),
        revenue: createMetric(null, sourceTag, now),
        revenueGrowth: createMetric(null, sourceTag, now),
        eps: createMetric(null, sourceTag, now),
        epsGrowth: createMetric(null, sourceTag, now),
        grossMargin: createMetric(null, sourceTag, now),
        operatingMargin: createMetric(null, sourceTag, now),
        netMargin: createMetric(null, sourceTag, now),
        freeCashFlow: createMetric(null, sourceTag, now),
        cash: createMetric(null, sourceTag, now),
        debt: createMetric(null, sourceTag, now),
        peRatio: createMetric(null, sourceTag, now),
        forwardPeRatio: createMetric(null, sourceTag, now),
        priceToSales: createMetric(null, sourceTag, now),
        evToEbitda: createMetric(null, sourceTag, now),
        roe: createMetric(null, sourceTag, now),
        nextEarningsDate: createMetric(null, sourceTag, now),
        earningsEstimates: createMetric(null, sourceTag, now),
        analystConsensus: createMetric(null, sourceTag, now),
        provider: this.name,
        status: 'PARTIAL',
        fetchedAt: now,
      };
    } catch {
      return null;
    }
  }
}

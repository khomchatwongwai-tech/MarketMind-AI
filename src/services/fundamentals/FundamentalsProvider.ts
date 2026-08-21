export interface NormalizedMetric<T> {
  value: T | null;
  source: string;
  timestamp: string;
  validationStatus: 'VERIFIED' | 'DERIVED' | 'UNAVAILABLE';
}

export interface NormalizedFundamentals {
  symbol: string;
  companyName: string | null;
  sector?: string | null;
  industry?: string | null;
  marketCap: NormalizedMetric<number>;
  enterpriseValue: NormalizedMetric<number>;
  revenue: NormalizedMetric<number>;
  revenueGrowth: NormalizedMetric<number>;
  eps: NormalizedMetric<number>;
  epsGrowth: NormalizedMetric<number>;
  grossMargin: NormalizedMetric<number>;
  operatingMargin: NormalizedMetric<number>;
  netMargin: NormalizedMetric<number>;
  freeCashFlow: NormalizedMetric<number>;
  cash: NormalizedMetric<number>;
  debt: NormalizedMetric<number>;
  peRatio: NormalizedMetric<number>;
  forwardPeRatio: NormalizedMetric<number>;
  priceToSales: NormalizedMetric<number>;
  evToEbitda: NormalizedMetric<number>;
  roe: NormalizedMetric<number>;
  nextEarningsDate: NormalizedMetric<string>;
  earningsEstimates: NormalizedMetric<{
    epsEstimate: number | null;
    revenueEstimate: number | null;
    fiscalQuarter: string | null;
  }>;
  analystConsensus: NormalizedMetric<{
    rating: string | null; // e.g. "Buy", "Strong Buy", "Hold"
    targetPrice: number | null;
    targetHigh: number | null;
    targetLow: number | null;
    totalAnalysts: number | null;
  }>;
  provider: string;
  status: 'VERIFIED' | 'PARTIAL' | 'UNAVAILABLE';
  fetchedAt: string;
}

export interface FundamentalsProvider {
  name: string;
  isAvailable(): boolean;
  getFundamentals(symbol: string): Promise<NormalizedFundamentals | null>;
}

import { TickerSymbol } from './market.js';

export type BrokerId =
  | 'alpaca'
  | 'ibkr'
  | 'tradier'
  | 'robinhood'
  | 'schwab'
  | 'fidelity'
  | 'plaid'
  | 'demo';

export type BrokerAccountType =
  | 'individual_taxable'
  | 'roth_ira'
  | 'traditional_ira'
  | 'margin'
  | 'cash'
  | 'crypto';

export type BrokerConnectionStatus =
  | 'CONNECTED'
  | 'SYNCING'
  | 'ACTION REQUIRED'
  | 'EXPIRED'
  | 'DISCONNECTED'
  | 'ERROR';

export type AssetClass = 'EQUITY' | 'ETF' | 'OPTION' | 'CRYPTO' | 'CASH';

export type RiskRating = 'LOW' | 'MEDIUM' | 'ELEVATED' | 'HIGH';

export interface HoldingPosition {
  id: string;
  accountId: string;
  symbol: string;
  companyName: string;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  dailyChangeDollar: number;
  dailyChangePercent: number;
  unrealizedGainDollar: number;
  unrealizedGainPercent: number;
  realizedGainDollar?: number;
  portfolioWeight: number; // e.g. 0.22 for 22%
  marketMindScore: number; // 0-100
  riskRating: RiskRating;
  sector: string;
  industry?: string;
  beta: number;
  dividendYield?: number;
  nextEarningsDate?: string;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
}

export interface OptionsPosition {
  id: string;
  accountId: string;
  symbol: string; // e.g. "NVDA 260320C00140000"
  underlyingSymbol: string; // "NVDA"
  contractType: 'CALL' | 'PUT';
  strikePrice: number;
  expirationDate: string; // YYYY-MM-DD
  daysToExpiration: number;
  quantity: number; // Positive for long, negative for short
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  unrealizedGainDollar: number;
  unrealizedGainPercent: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility: number; // e.g. 0.48 for 48%
  inTheMoney: boolean;
  riskFlags: string[]; // e.g. ["SHORT_EXPIRATION", "HIGH_THETA", "HIGH_IV", "EARNINGS_BEFORE_EXP"]
}

export type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'OPTION_BUY'
  | 'OPTION_SELL'
  | 'DIVIDEND'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'FEE'
  | 'SPLIT';

export interface PortfolioTransaction {
  id: string;
  accountId: string;
  date: string; // ISO or YYYY-MM-DD
  type: TransactionType;
  symbol?: string;
  description: string;
  quantity?: number;
  price?: number;
  amount: number; // Net cash impact (+/-)
  fees?: number;
}

export interface ConnectedBrokerAccount {
  id: string;
  userId: string;
  brokerId: BrokerId;
  brokerName: string;
  accountNickname: string;
  accountNumberMasked: string; // e.g. "****-8842"
  accountType: BrokerAccountType;
  status: BrokerConnectionStatus;
  lastSyncedAt: string;
  cashBalance: number;
  buyingPower: number;
  portfolioValue: number;
  totalCostBasis: number;
  dayChangeDollar: number;
  dayChangePercent: number;
  totalGainDollar: number;
  totalGainPercent: number;
  holdingsCount: number;
  optionsCount: number;
  isReadOnly: boolean;
  authExpiresAt?: string;
  errorMessage?: string;
  connectionMetadata?: {
    institutionLogo?: string;
    environment?: 'live' | 'sandbox';
    permissions: string[];
  };
}

export interface UnifiedPortfolioSummary {
  totalValue: number;
  dayChangeDollar: number;
  dayChangePercent: number;
  totalCostBasis: number;
  totalUnrealizedGainDollar: number;
  totalUnrealizedGainPercent: number;
  cashBalance: number;
  investedAssets: number;
  holdingsCount: number;
  connectedAccountsCount: number;
  assetAllocation: {
    equities: number; // percentage
    options: number;
    cash: number;
    crypto: number;
  };
  sectorAllocation: { sector: string; weight: number; value: number }[];
  topHoldings: { symbol: string; weight: number; value: number; dayChangePercent: number }[];
  riskScore: number; // 0-100
  riskLevel: RiskRating;
}

export interface CorrelationPair {
  pair: string; // e.g. "NVDA / AMD"
  assetA: string;
  assetB: string;
  correlation: number; // 0.00 to 1.00
  clusterNote: string;
}

export interface PortfolioRiskAssessment {
  overallRiskScore: number; // 0-100
  riskTier: RiskRating;
  techExposurePercent: number;
  largestHolding: {
    symbol: string;
    company: string;
    weightPercent: number;
    value: number;
  };
  top3WeightPercent: number;
  highCorrelationPairs: CorrelationPair[];
  upcomingEarningsExposure: 'LOW' | 'MODERATE' | 'HIGH';
  optionsRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  marketSensitivityBeta: number;
  portfolioVolatilityAnnualized: number;
  maxEstimatedDrawdown: number;
  factorExplanations: {
    title: string;
    level: 'SAFE' | 'MODERATE' | 'ELEVATED' | 'HIGH';
    description: string;
  }[];
  warnings: string[];
}

export interface TopAttributionContributor {
  symbol: string;
  companyName: string;
  attributionBps: number; // Basis points contribution to portfolio return (e.g. -72 for -0.72%)
  dayChangePercent: number;
  weight: number;
  reason: string;
}

export interface WhyIsMyPortfolioMovingAnalysis {
  portfolioDayChangePercent: number;
  portfolioDayChangeDollar: number;
  topContributors: TopAttributionContributor[];
  topDrags: TopAttributionContributor[];
  primaryCatalyst: {
    headline: string;
    description: string;
    source: string;
    confidence: number;
  };
  secondaryCatalysts: {
    headline: string;
    impact: string;
    source: string;
  }[];
  aiInterpretation: string;
  verifiedSources: {
    title: string;
    url?: string;
    source: string;
    time: string;
  }[];
  timestamp: string;
}

export interface StressTestScenario {
  id: string;
  title: string;
  description: string;
  category: 'MARKET_INDEX' | 'SECTOR_CRASH' | 'VOLATILITY_SPIKE' | 'SINGLE_STOCK' | 'MACRO_RATES';
  shockParameter: string; // e.g. "SPY -5%", "QQQ -10%"
  estimatedImpactPercent: number;
  estimatedImpactDollar: number;
  affectedHoldingsBreakdown: {
    symbol: string;
    impactDollar: number;
    impactPercent: number;
    weight: number;
  }[];
  methodologyNote: string;
}

export interface PortfolioNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string;
  relatedTickers: string[];
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  portfolioExposurePercent: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyTakeaway: string;
}

export interface EarningsRiskEvent {
  symbol: string;
  companyName: string;
  earningsDate: string;
  timeOfDay: 'BEFORE_MARKET' | 'AFTER_CLOSE' | 'DURING_HOURS';
  portfolioWeight: number;
  portfolioValue: number;
  impliedMovePercent: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  timeframeCategory: 'TODAY' | 'THIS_WEEK' | 'NEXT_WEEK';
  estimatedEPS?: number;
}

export interface DividendIntelligenceItem {
  symbol: string;
  companyName: string;
  shares: number;
  dividendYield: number; // e.g. 0.024 for 2.4%
  dividendAmountPerShare: number;
  exDividendDate: string;
  paymentDate: string;
  annualProjectedIncome: number;
  frequency: 'Quarterly' | 'Monthly' | 'Annual' | 'Semi-Annual';
}

export interface DividendSummary {
  monthlyEstimatedIncome: number;
  annualEstimatedIncome: number;
  averagePortfolioYield: number;
  dividendItems: DividendIntelligenceItem[];
  upcomingCalendar: {
    month: string;
    projectedPayout: number;
    payers: string[];
  }[];
}

export interface SmartPortfolioAlertRule {
  id: string;
  userId: string;
  type:
    | 'POSITION_DROP_5'
    | 'PORTFOLIO_DROP_3'
    | 'CONCENTRATION_25'
    | 'BREAKING_NEWS'
    | 'EARNINGS_APPROACH'
    | 'RISK_SCORE_HIGH'
    | 'UNUSUAL_OPTIONS';
  title: string;
  description: string;
  thresholdValue?: number;
  ticker?: string;
  isEnabled: boolean;
  triggeredCount: number;
  lastTriggeredAt?: string;
}

export interface DailyPortfolioBrief {
  date: string;
  greeting: string;
  portfolioValue: number;
  yesterdayChangePercent: number;
  riskTier: RiskRating;
  overnightNews: { headline: string; impact: string }[];
  todaysBiggestMacroEvent: { title: string; time: string; expectedImpact: string };
  portfolioEarningsToday: { symbol: string; time: string; weight: number }[];
  highImpactHoldings: string[];
  aiExecutiveSummary: string;
}

export interface EndOfDayPortfolioBrief {
  date: string;
  portfolioDayChangePercent: number;
  spyDayChangePercent: number;
  relativePerformancePercent: number;
  topContributor: { symbol: string; changePercent: number };
  largestDrag: { symbol: string; changePercent: number };
  mainCatalyst: string;
  tomorrowsRisk: string;
}

export interface BrokerProviderMetadata {
  id: BrokerId;
  name: string;
  logo: string;
  description: string;
  authType: 'oauth' | 'api_token' | 'aggregator';
  supportedAccountTypes: BrokerAccountType[];
  supportsOptions: boolean;
  supportsRealtimeQuotes: boolean;
  supportsHistoricalTransactions: boolean;
  connectionInstructions: string;
  isAvailable: boolean;
}

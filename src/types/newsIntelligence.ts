export type SourceTier = 'TIER_1_PRIMARY' | 'TIER_2_FINANCIAL' | 'TIER_3_SPECIALIZED' | 'TIER_4_SOCIAL';

export type SourceType = 'LICENSED_API' | 'OFFICIAL_FEED' | 'PRIMARY_REGULATORY' | 'WIRE' | 'INDUSTRY_MONITOR';

export type FeedDelay = 'REAL_TIME' | 'NEAR_REAL_TIME' | 'DELAYED_15M' | 'LAST_UPDATED' | 'OFFLINE';

export type VerificationStatus = 'CONFIRMED' | 'DEVELOPING' | 'UNVERIFIED';

export type NewsSentiment = 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH';

export type NewsImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';

export type ProviderConnectionStatus = 'LIVE' | 'ONLINE' | 'RECONNECTING' | 'DELAYED' | 'OFFLINE' | 'NOT_CONFIGURED' | 'DEGRADED';

export type GlobalRegion =
  | 'GLOBAL'
  | 'US'
  | 'CANADA'
  | 'EUROPE'
  | 'UK'
  | 'CHINA'
  | 'JAPAN'
  | 'SOUTH_KOREA'
  | 'INDIA'
  | 'SOUTHEAST_ASIA'
  | 'MIDDLE_EAST'
  | 'AUSTRALIA'
  | 'LATIN_AMERICA';

export type NewsCategory =
  | 'ALL'
  | 'BREAKING'
  | 'MARKETS'
  | 'STOCKS'
  | 'COMPANIES'
  | 'TECHNOLOGY'
  | 'ECONOMY'
  | 'FEDERAL_RESERVE'
  | 'CENTRAL_BANKS'
  | 'EARNINGS'
  | 'OPTIONS'
  | 'ENERGY'
  | 'COMMODITIES'
  | 'CRYPTO'
  | 'GEOPOLITICS'
  | 'PORTFOLIO'
  | 'WATCHLIST';

export interface VerifiedSourceCitation {
  sourceName: string;
  providerId: string;
  tier: SourceTier;
  headline: string;
  url: string;
  publishedAt: string;
  retrievedAt: string;
  isPrimaryOfficial: boolean;
}

/**
 * Normalized News Article Model for MarketMind AI
 * Unifies diverse market feeds (Alpaca, Finnhub, SEC EDGAR, Federal Reserve, Government Stats, etc.)
 */
export interface NewsArticle {
  id: string;
  headline: string;
  title?: string; // Canonical alias for headline
  summary: string;
  permittedSummary?: string;
  fullContent?: string;
  content?: string; // Canonical alias for fullContent
  url: string;
  originalUrl?: string;
  imageUrl?: string;
  author?: string;
  source: string; // e.g., 'SEC EDGAR (Form 8-K)', 'Alpaca Equities Wire', 'BLS', 'FOMC'
  provider?: string; // e.g., 'Alpaca', 'Finnhub', 'SEC EDGAR', 'Federal Reserve'
  providerId: string;
  sourceType?: SourceType;
  sourceTier: SourceTier;
  sourcePriority?: number; // 1 (Tier 1 Primary) to 4 (Tier 4 Social)
  tickers: string[];
  companies?: string[];
  sectors?: string[];
  category: NewsCategory;
  country?: string;
  region: GlobalRegion;
  publishedAt: string;
  updatedAt?: string;
  retrievedAt: string;
  receivedAt?: string;
  sentiment: NewsSentiment;
  sentimentScore?: number; // -1.0 (Extreme Bearish) to +1.0 (Extreme Bullish)
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: NewsImpact;
  marketImpact?: NewsImpact;
  impactScore: number; // 0 to 100
  accessLevel?: 'PUBLIC' | 'LICENSED' | 'DELAYED';
  feedDelay?: FeedDelay;
  contentRights?: string;
  language?: string;
  verificationStatus: VerificationStatus;
  isBreaking?: boolean;
  affectedAssets: string[];
  sectorsAffected?: string[];
  primaryOfficialSource?: string;
  marketReaction?: {
    observedPriceChange?: number;
    volumeSurgeRatio?: number;
    optionsFlowConfirmation?: 'Bullish Flow' | 'Bearish Flow' | 'Neutral' | 'None';
    vixChange?: number;
    yieldChangeBps?: number;
  };
  rawMetadata?: Record<string, any>;
}

// NewsItem is unified with NewsArticle for backward-compatibility and type ergonomics
export type NewsItem = NewsArticle;

export interface MarketMindEventCluster {
  id: string;
  eventTitle: string;
  category: NewsCategory;
  region: GlobalRegion;
  primarySource: {
    provider: string;
    name: string;
    tier: SourceTier;
    url: string;
    publishedAt: string;
  };
  additionalCoverage: Array<{
    provider: string;
    sourceName: string;
    tier: SourceTier;
    headline: string;
    url: string;
    publishedAt: string;
  }>;
  aiSummary: string;
  verificationStatus: VerificationStatus;
  sentiment: NewsSentiment;
  impact: NewsImpact;
  impactScore: number; // 0 - 100
  affectedAssets: string[];
  sectorsAffected: string[];
  firstReportedAt: string;
  lastUpdatedAt: string;
  marketReactionSummary?: string;
  verifiedFacts: string[];
  primaryCatalyst?: string;
  secondaryCatalysts?: string[];
  aiInterpretation: string;
  marketConfirmation: string;
  alternativeExplanations: string[];
  citations: VerifiedSourceCitation[];
}

export interface ProviderHealth {
  id: string;
  name: string;
  providerKey?: string;
  tier: SourceTier;
  status: ProviderConnectionStatus;
  latencyMs: number;
  lastSyncedAt: string;
  lastArticleTime?: string;
  articleCount: number;
  requestsCount?: number;
  errorsCount?: number;
  successRatePercent: number;
  webSocketStatus?: 'CONNECTED' | 'DISCONNECTED' | 'NOT_SUPPORTED' | 'CONNECTING';
  isConfigured?: boolean;
  isEnabled?: boolean;
  requiresApiKey?: boolean;
  missingCredentialHelp?: string;
  description: string;
}

export interface EconomicReleaseItem {
  id: string;
  name: string;
  agency: string; // e.g. "Bureau of Labor Statistics (BLS)", "Federal Reserve", "BEA", "Treasury", "EIA"
  country: string;
  releaseTime: string;
  frequency: string;
  previous: string;
  forecast: string;
  actual?: string;
  unit: string;
  impact: NewsImpact;
  impactScore?: number;
  status: 'UPCOMING' | 'RELEASED' | 'DELAYED';
  marketImplication: string;
  sourceUrl: string;
  historicalBeatMissRatio?: string;
}

export interface EarningsIntelligenceItem {
  ticker: string;
  companyName: string;
  reportDate: string;
  timing: 'BMO' | 'AMC' | 'DURING_MARKET'; // Before Market Open / After Market Close
  consensusEps: number;
  actualEps?: number;
  epsSurprisePercent?: number;
  consensusRevenue: string;
  actualRevenue?: string;
  revenueSurprisePercent?: number;
  guidanceStatus: 'RAISED' | 'LOWERED' | 'REITERATED' | 'WITHDRAWN' | 'PENDING';
  resultStatus: 'BEAT' | 'IN_LINE' | 'MISS' | 'PENDING';
  managementCommentarySummary?: string;
  stockReactionPercent?: number;
  aiInterpretation?: string;
  source: string;
  sourceUrl: string;
}

export interface StockIntelligenceBrief {
  ticker: string;
  companyName: string;
  latestPrice: number;
  priceChange: number;
  priceChangePercent: number;
  marketMindScore: number; // 0-100
  latestCatalyst: string;
  breakingNews: NewsItem[];
  primaryCatalyst: {
    headline: string;
    source: string;
    provider: string;
    impact: NewsImpact;
    impactScore: number;
    sentiment: NewsSentiment;
    verificationStatus: VerificationStatus;
  };
  newsSentimentSummary: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    overallSentiment: NewsSentiment;
    dominantTheme: string;
  };
  technicalCondition: {
    trend: string;
    vwapStatus: string;
    keySupport: number;
    keyResistance: number;
    relativeVolume: number;
  };
  optionsActivity: {
    putCallRatio: number;
    unusualFlowDetected: boolean;
    flowSentiment: 'Bullish' | 'Bearish' | 'Neutral';
    dominantStrike: string;
  };
  upcomingEvents: Array<{
    date: string;
    title: string;
    type: 'EARNINGS' | 'FED_SPEECH' | 'PRODUCT_LAUNCH' | 'CONFERENCE' | 'SEC_FILING';
  }>;
  marketMindOutlook: {
    verifiedFacts: string[];
    aiInterpretation: string;
    marketDataConfirmation: string;
    risksAndAlternativeExplanations: string[];
    shortTermBias: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  sources: VerifiedSourceCitation[];
  timestamp: string;
}

export interface PortfolioNewsExposure {
  headline: string;
  newsId: string;
  impact: NewsImpact;
  impactScore: number;
  sentiment: NewsSentiment;
  verificationStatus: VerificationStatus;
  publishedAt: string;
  affectedHoldings: Array<{
    ticker: string;
    allocationPercent: number;
    shares: number;
    exposureDollar: number;
  }>;
  totalPortfolioExposurePercent: number;
  riskExplanation: string;
}

export interface SearchIntelligenceResponse {
  query: string;
  generatedAt: string;
  totalSourcesEvaluated: number;
  verifiedFacts: string[];
  primaryCatalyst?: string;
  secondaryCatalysts?: string[];
  aiAnalysis: string;
  marketConfirmation: string;
  risksAndAlternatives: string[];
  keyTakeaways: string[];
  relevantEvents: MarketMindEventCluster[];
  affectedTickers: string[];
  citations: VerifiedSourceCitation[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  noDataFound?: boolean;
}

export interface NewsAlertRule {
  id: string;
  title: string;
  ticker?: string;
  minImpactScore: number;
  requireConfirmedOnly: boolean;
  category?: NewsCategory;
  notifyBrowser: boolean;
  notifySound: boolean;
  enabled: boolean;
  createdAt: string;
  triggerCount: number;
  lastTriggeredAt?: string;
}

export interface NewsNotificationEvent {
  id: string;
  alertRuleId?: string;
  title: string;
  headline: string;
  time: string;
  affectedTickers: string[];
  impactScore: number;
  impact: NewsImpact;
  verificationStatus: VerificationStatus;
  primarySource: string;
  read: boolean;
  url?: string;
}

export interface MarketBriefSection {
  title: string;
  session: 'PAST_HOUR' | 'PREMARKET' | 'ACTIVE_SESSION' | 'AFTER_HOURS';
  summary: string;
  verifiedFacts: string[];
  aiInference: string;
  marketImpact: NewsImpact;
  affectedSectors: string[];
  affectedTickers: string[];
  citations: VerifiedSourceCitation[];
}

export interface AIMarketBrief {
  id: string;
  generatedAt: string;
  marketSession: 'PREMARKET' | 'REGULAR' | 'AFTER_HOURS' | 'WEEKEND';
  marketHeadline: string;
  overallSentiment: NewsSentiment;
  overallImpact: NewsImpact;
  affectedIndices: string[];
  affectedSectors: string[];
  topMovers: Array<{ ticker: string; changePercent: number; catalyst: string }>;
  sections: {
    pastHour: MarketBriefSection;
    premarket: MarketBriefSection;
    activeSession: MarketBriefSection;
    afterHours: MarketBriefSection;
  };
  conflictingReports?: Array<{
    topic: string;
    sourceA: { name: string; claim: string; url: string };
    sourceB: { name: string; claim: string; url: string };
  }>;
  disclosure: string;
}

export interface AdminNewsSourceConfig {
  id: string;
  name: string;
  publisherName: string;
  tier: SourceTier;
  sourceType: SourceType;
  feedDelay: FeedDelay;
  status: ProviderConnectionStatus;
  licenseStatus: 'ACTIVE_LICENSED' | 'OFFICIAL_PUBLIC' | 'NOT_CONNECTED' | 'AWAITING_CREDENTIALS';
  endpointOrFeedUrl: string;
  maskedCredential?: string;
  isConfigured: boolean;
  isEnabled: boolean;
  lastSuccessfulSync?: string;
  requestVolume24h: number;
  errorCount24h: number;
  avgLatencyMs: number;
  retentionDays: number;
  pollingIntervalSeconds: number;
  contentRightsNotice: string;
  description: string;
}

export interface SavedArticle {
  id: string;
  articleId: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  url: string;
  tickers: string[];
  savedAt: string;
  notes?: string;
}


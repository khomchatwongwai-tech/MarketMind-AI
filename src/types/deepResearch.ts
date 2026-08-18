export type ResearchMode =
  | 'deep_research'
  | 'company_dossier'
  | 'bull_vs_bear'
  | 'company_comparison'
  | 'earnings_research'
  | 'macro_research'
  | 'event_research'
  | 'portfolio_research'
  | 'investment_memo'
  | 'research_update'
  | 'sec_filing_research'
  | 'catalyst_research'
  | 'risk_research'
  | 'valuation_research'
  | 'options_research'
  | 'sector_research';

export type ResearchJobStatus =
  | 'queued'
  | 'planning'
  | 'collecting_sources'
  | 'extracting_claims'
  | 'verifying'
  | 'analyzing'
  | 'synthesizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SourceTier = 1 | 2 | 3 | 4;

export type SourceType =
  | 'SEC_EDGAR'
  | 'OFFICIAL_FED'
  | 'GOV_ECONOMIC'
  | 'VERIFIED_MARKET_DATA'
  | 'COMPANY_IR'
  | 'FINANCIAL_NEWS'
  | 'GENERAL_WEB';

export type ClaimDataType =
  | 'VERIFIED'
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'CONSENSUS'
  | 'AI_INFERENCE'
  | 'UNAVAILABLE';

export type ClaimConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  publisher: string;
  source_type: SourceType;
  tier: SourceTier;
  author?: string;
  published_at: string;
  retrieved_at: string;
  entity?: string;
  symbols: string[];
  content_hash: string;
  freshness_seconds: number;
  verified: boolean;
  excerpt?: string;
}

export interface ResearchClaim {
  id: string;
  text: string;
  category:
    | 'FINANCIAL_PERFORMANCE'
    | 'VALUATION'
    | 'CATALYST'
    | 'RISK'
    | 'MANAGEMENT_GUIDANCE'
    | 'MACRO'
    | 'TECHNICAL'
    | 'OPTIONS'
    | 'SEC_FILING'
    | 'GENERAL';
  data_type: ClaimDataType;
  confidence: ClaimConfidence;
  source_ids: string[];
  verified: boolean;
  conflicting_source_ids?: string[];
  created_at: string;
}

export interface ResearchCitation {
  id: string;
  claim_id: string;
  source_id: string;
  source_title: string;
  publisher: string;
  tier: SourceTier;
  exact_quote?: string;
  section_reference?: string;
  verified: boolean;
}

export interface ResearchConflict {
  id: string;
  topic: string;
  claim_a: {
    text: string;
    source_id: string;
    source_title: string;
    tier: SourceTier;
  };
  claim_b: {
    text: string;
    source_id: string;
    source_title: string;
    tier: SourceTier;
  };
  resolution: string;
  preferred_source_id: string;
  reason: string;
}

export interface ScenarioCase {
  title: string;
  probability: string;
  potentialReturn: string;
  targetPriceRange?: string;
  assumptions: {
    revenueGrowth: string;
    margins: string;
    terminalValuation: string;
    macroContext: string;
  };
  catalysts: string[];
  risks: string[];
  confidence: ClaimConfidence;
}

export interface ScenarioAnalysis {
  baseCase: ScenarioCase;
  bullCase: ScenarioCase;
  bearCase: ScenarioCase;
  stressCase?: ScenarioCase;
  timeHorizon: '30_DAYS' | '90_DAYS' | '12_MONTHS';
  disclaimer: string;
}

export interface FinancialMetricRow {
  label: string;
  value: string | number | null;
  unit?: string;
  period?: string;
  dataType: ClaimDataType;
  source: string;
  tier: SourceTier;
}

export interface SECFilingExcerpt {
  filingType: string;
  filingDate: string;
  periodEnding: string;
  accessionNumber: string;
  description: string;
  link: string;
  keyChanges: string[];
  materialRiskFactors?: string[];
}

export interface CompanyComparisonRow {
  ticker: string;
  name: string;
  marketCap: string;
  price: string;
  change1D: string;
  revenueYoY: string;
  grossMargin: string;
  peRatio: string;
  fcfYield: string;
  rsi14: string;
  technicalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  analystConsensus: string;
  impliedMove: string;
  primaryAdvantage: string;
  keyRisk: string;
}

export interface PortfolioExposureResearch {
  totalValue: number;
  holdingsCount: number;
  topHoldings: Array<{ symbol: string; weight: number; value: number }>;
  sectorAllocation: Array<{ sector: string; weight: number }>;
  assetClassAllocation: Array<{ assetClass: string; weight: number }>;
  portfolioBeta: number;
  concentrationScore: number;
  macroVulnerabilities: string[];
  upcomingEarningsInHoldings: Array<{ symbol: string; date: string }>;
  diversificationRecommendations: string[];
}

export interface ResearchReport {
  id: string;
  jobId: string;
  userId: string;
  title: string;
  researchQuestion: string;
  ticker: string;
  companyName: string;
  assetClass: string;
  mode: ResearchMode;
  executiveSummary: string;
  companyOverview: string;
  marketSnapshot: {
    price: number | null;
    changePercent: number | null;
    high52w: number | null;
    low52w: number | null;
    volume: number | null;
    vwap: number | null;
    marketStatus: string;
    dataSource: string;
    timestamp: string;
    isRealTime: boolean;
  };
  bullThesis: string[];
  bearThesis: string[];
  keyCatalysts: string[];
  keyRisks: string[];
  financialAnalysis: {
    metrics: FinancialMetricRow[];
    revenueAnalysis: string;
    marginProfile: string;
    freeCashFlow: string;
    balanceSheetStrength: string;
  };
  valuation: {
    peRatio?: number | null;
    psRatio?: number | null;
    evToEbitda?: number | null;
    fcfYield?: string | null;
    historicalContext: string;
    peerComparisonSummary: string;
  };
  secFilingAnalysis: {
    filings: SECFilingExcerpt[];
    managementGuidance: string;
    insiderActivity: string;
    materialDisclosures: string;
  };
  earningsIntelligence?: {
    lastReportedDate?: string;
    reportedEps?: string;
    consensusEps?: string;
    epsSurprise?: string;
    revenueSurprise?: string;
    historicalReactions?: string[];
    upcomingEarningsDate?: string;
    expectedMove?: string;
    commentary?: string;
  };
  optionsIntelligence?: {
    putCallRatio?: number;
    impliedVolatility?: string;
    ivPercentile?: string;
    optionsImpliedMove?: string;
    unusualOrderFlowSummary?: string;
    greeksAttribution: 'PROVIDER' | 'CALCULATED';
  };
  technicalStructure: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    supportLevels: string[];
    resistanceLevels: string[];
    momentumRsi: string;
    movingAveragesSummary: string;
  };
  macroSensitivity: {
    fedRateSensitivity: 'HIGH' | 'MODERATE' | 'LOW';
    inflationSensitivity: string;
    usdSensitivity: string;
    economicDrivers: string[];
  };
  industryAndCompetitors: {
    sector: string;
    industry: string;
    competitorComparison?: CompanyComparisonRow[];
    competitiveMoat: string;
    marketShareNotes: string;
  };
  scenarioAnalysis: ScenarioAnalysis;
  thesisInvalidation: string[];
  whatToMonitorNext: string[];
  whatChanged?: {
    priorReportDate: string;
    priorReportId: string;
    priceDelta: string;
    thesisShifts: string[];
    newFilingsCount: number;
    newCatalysts: string[];
  };
  sources: ResearchSource[];
  claims: ResearchClaim[];
  citations: ResearchCitation[];
  conflicts: ResearchConflict[];
  confidenceScore: number; // 0 to 100
  dataFreshness: Record<string, { label: string; ageSeconds: number; badge: string }>;
  disclaimer: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchJob {
  id: string;
  userId: string;
  prompt: string;
  mode: ResearchMode;
  targetSymbols: string[];
  status: ResearchJobStatus;
  progressPercent: number;
  currentStage: string;
  stepsCompleted: string[];
  reportId?: string;
  error?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchNote {
  id: string;
  userId: string;
  reportId: string;
  ticker: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchWatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  name: string;
  targetPriceAlert?: number;
  lastReportId?: string;
  lastReportDate?: string;
  thesisDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  activeCatalystsCount: number;
  createdAt: string;
}

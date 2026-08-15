import { TickerSymbol } from './market';
import { BrokerId } from './portfolio';

export type OptionType = 'CALL' | 'PUT';

export interface OptionContract {
  symbol: string; // e.g. "SPY260815C00550000"
  underlyingSymbol: string; // e.g. "SPY"
  type: OptionType;
  strike: number;
  expiration: string; // YYYY-MM-DD
  dte: number; // Days to expiration (0 = today)
  bid: number;
  ask: number;
  mid: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number; // e.g. 0.185 (18.5%)
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  extrinsicValue: number;
  breakeven: number;
  inTheMoney: boolean;
  atTheMoney: boolean;
  outOfTheMoney: boolean;
  is0DTE: boolean;
  isDelayed: boolean;
  percentChange?: number;
  high?: number;
  low?: number;
}

export interface ExpirationMeta {
  date: string; // YYYY-MM-DD
  dte: number;
  formattedDate: string; // e.g. "Aug 15 '26"
  is0DTE: boolean;
  isWeekly: boolean;
  isMonthly: boolean;
  isQuarterly: boolean;
  expectedMoveDollar: number;
  expectedMovePercent: number;
  averageIV: number;
  totalVolume: number;
  totalOI: number;
  hasEarnings: boolean;
  hasFOMC: boolean;
  hasCPI: boolean;
  events: string[];
}

export interface OptionChainData {
  underlyingSymbol: string;
  underlyingPrice: number;
  underlyingChange: number;
  underlyingChangePercent: number;
  timestamp: string;
  isLive: boolean;
  dataSource: string;
  expirations: ExpirationMeta[];
  strikes: number[];
  calls: Record<string, OptionContract>; // key: `${strike}_CALL`
  puts: Record<string, OptionContract>; // key: `${strike}_PUT`
  atmStrike: number;
  maxPainStrike: number;
  expectedMoves: {
    oneDay: number;
    oneWeek: number;
    atExpiry: Record<string, number>;
  };
  totalCallVolume: number;
  totalPutVolume: number;
  putCallRatio: number;
  totalCallOI: number;
  totalPutOI: number;
  ivRank: number;
  ivPercentile: number;
  historicalIV: number;
  currentIV: number;
}

export type OptionStrategyType =
  | 'LONG_CALL'
  | 'LONG_PUT'
  | 'COVERED_CALL'
  | 'CASH_SECURED_PUT'
  | 'BULL_CALL_SPREAD'
  | 'BEAR_PUT_SPREAD'
  | 'BULL_PUT_SPREAD'
  | 'BEAR_CALL_SPREAD'
  | 'LONG_STRADDLE'
  | 'LONG_STRANGLE'
  | 'IRON_CONDOR'
  | 'IRON_BUTTERFLY'
  | 'CALENDAR_SPREAD'
  | 'DEBIT_SPREAD'
  | 'CREDIT_SPREAD'
  | 'CUSTOM';

export type StrategyAction = 'BUY_TO_OPEN' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_CLOSE';

export interface StrategyLeg {
  id: string;
  contract: OptionContract;
  action: StrategyAction;
  quantity: number;
  isUnderlyingStock?: boolean;
  stockPrice?: number;
}

export interface StrategyAnalysis {
  id: string;
  name: string;
  type: OptionStrategyType;
  outlook: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  legs: StrategyLeg[];
  netCost: number; // Negative = Credit received, Positive = Debit paid
  isDebit: boolean;
  maxProfit: number | 'UNLIMITED';
  maxLoss: number | 'UNLIMITED';
  breakevenPoints: number[];
  riskRewardRatio: string;
  expiration: string;
  dte: number;
  netDelta: number;
  netTheta: number;
  netGamma: number;
  netVega: number;
  estimatedWinProbability?: number;
  description: string;
  keyRisks: string[];
}

export interface OptionPLScenario {
  underlyingPrice: number;
  percentChange: number;
  timePoint: string; // e.g. "Today", "Tomorrow", "+7 Days", "Expiration"
  daysRemaining: number;
  estimatedContractValue: number;
  estimatedPL: number;
  percentReturn: number;
  thetaDecayEffect: number;
  ivSensitivityEffect: number;
}

export interface UnusualOptionFlow {
  id: string;
  symbol: string;
  type: OptionType;
  strike: number;
  expiration: string;
  dte: number;
  volume: number;
  openInterest: number;
  volOIRatio: number;
  iv: number;
  ivChange: number;
  premiumTotal: number;
  tradeSize: 'BLOCK' | 'SWEEP' | 'SPLIT' | 'NORMAL';
  spotPrice: number;
  classification: 'NORMAL' | 'ELEVATED' | 'UNUSUAL' | 'EXTREME';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  potentialThesis: string;
  timestamp: string;
}

export type RiskGuardianTier = 'LOW' | 'MODERATE' | 'ELEVATED' | 'VERY_HIGH';

export interface OptionsRiskGuardianScore {
  score: number; // 0 - 100
  tier: RiskGuardianTier;
  factors: {
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    scoreContribution: number;
  }[];
  warningMessage?: string;
  positionSizeWarning?: {
    estimatedCost: number;
    portfolioValue: number;
    portfolioConcentrationPercent: number;
    isHighConcentration: boolean;
    recommendation: string;
  };
}

export type OrderType = 'LIMIT' | 'MARKET' | 'STOP' | 'STOP_LIMIT';
export type TimeInForce = 'DAY' | 'GTC';
export type OptionsOrderStatus =
  | 'PENDING'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED';

export interface OptionsOrderLeg {
  contractSymbol: string;
  underlyingSymbol: string;
  type: OptionType;
  strike: number;
  expiration: string;
  action: StrategyAction;
  quantity: number;
  currentMid: number;
}

export interface OptionsOrderRequest {
  orderId: string;
  idempotencyKey: string;
  brokerId: BrokerId | 'paper' | string;
  accountId?: string;
  underlying?: string;
  underlyingSymbol?: string;
  legs: OptionsOrderLeg[];
  orderType: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
  estimatedCost: number;
  estimatedFee?: number;
  userConfirmed: boolean;
  confirmedAt?: string;
  confirmedTimestamp?: string;
  isPaper: boolean;
  strategyName?: string;
  strategyType?: OptionStrategyType;
}

export interface OptionsOrderResult {
  success: boolean;
  orderId: string;
  idempotencyKey: string;
  brokerOrderId?: string;
  status: OptionsOrderStatus;
  filledQuantity?: number;
  averageFillPrice?: number;
  timestamp: string;
  brokerName: string;
  legs: OptionsOrderLeg[];
  limitPrice?: number;
  totalCost: number;
  rejectionReason?: string;
  isPaper: boolean;
}

export interface OptionsPaperAccount {
  balance: number;
  initialBalance: number;
  equity: number;
  buyingPower: number;
  positions: OptionsPositionSummary[];
  orderHistory: OptionsOrderResult[];
  journalEntries: OptionsJournalEntry[];
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  winCount: number;
  lossCount: number;
}

export interface OptionsPositionSummary {
  id: string;
  symbol: string; // e.g. SPY 260815C00550000
  underlying: string;
  type: OptionType;
  strike: number;
  expiration: string;
  dte: number;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPLDollar: number;
  unrealizedPLPercent: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  iv: number;
  riskScore: number;
  is0DTE: boolean;
  strategyName?: string;
  entryDate: string;
}

export interface OptionsJournalEntry {
  id: string;
  timestamp: string;
  contract: string;
  underlying: string;
  strategy: string;
  action: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnlDollar?: number;
  pnlPercent?: number;
  thesis: string;
  marketMindScore: number;
  ivAtEntry: number;
  greeksAtEntry: {
    delta: number;
    theta: number;
    gamma: number;
    vega: number;
  };
  eventsDuringTrade: string[];
  status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS' | 'SCRATCH';
  notes: string;
}

export type OptionAlertCondition =
  | 'IV_ABOVE'
  | 'IV_BELOW'
  | 'PRICE_DROP_PCT'
  | 'PRICE_GAIN_PCT'
  | 'THETA_BURN_EXCEEDS'
  | 'UNUSUAL_VOLUME_SPIKE'
  | 'DTE_EQUALS'
  | 'EARNINGS_BEFORE_EXP';

export interface OptionsAlertRule {
  id: string;
  symbol: string;
  contractSymbol?: string;
  condition: OptionAlertCondition;
  targetValue: number | string;
  description: string;
  createdAt: string;
  isActive: boolean;
  triggered: boolean;
  triggeredAt?: string;
}

export interface OptionsAIContractAnalysis {
  contract: {
    symbol: string;
    underlying: string;
    type: OptionType;
    strike: number;
    expiration: string;
    dte: number;
    currentPremium: number;
    bid: number;
    ask: number;
    mid: number;
  };
  underlying: {
    currentPrice: number;
    distanceToStrike: number;
    distancePercent: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    marketMindScore: number;
  };
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  volatility: {
    currentIV: number;
    ivLevel: 'VERY LOW' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';
    ivRank: number;
    ivPercentile: number;
    expectedMoveDollar: number;
    expectedMoveRange: { low: number; high: number };
    isExpensive: boolean;
  };
  liquidity: {
    bidAskSpread: number;
    spreadPercent: number;
    volume: number;
    openInterest: number;
    volOIRatio: number;
    liquidityRating: 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';
  };
  breakeven: {
    breakevenPrice: number;
    requiredMovePercent: number;
    intrinsicValue: number;
    extrinsicValue: number;
  };
  timeDecay: {
    estimatedDailyLoss: number;
    decaySpeed: 'SLOW' | 'ACCELERATING' | 'RAPID_EXPONENTIAL';
    explanation: string;
  };
  risk: {
    score: number;
    tier: RiskGuardianTier;
    maxLoss: number | 'UNLIMITED';
    maxGain: number | 'UNLIMITED';
    expirationRisk: string;
    volatilityRisk: string;
    liquidityRisk: string;
    eventRisk: string;
  };
  marketMindView: {
    bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    bullScenario: string;
    baseScenario: string;
    bearScenario: string;
    interpretation: string;
  };
  events: {
    eventsBeforeExpiry: string[];
    hasEarnings: boolean;
    hasFOMC: boolean;
    hasCPI: boolean;
    eventRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  sources: {
    dataSource: string;
    retrievedAt: string;
  };
}

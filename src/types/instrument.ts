// ==========================================
// MarketMind AI - Universal Multi-Asset Instrument Model
// ==========================================

import { MarketDataMetadata } from './market';

export type UniversalAssetClass =
  | 'STOCK'
  | 'ETF'
  | 'INDEX'
  | 'OPTION'
  | 'INDEX_OPTION'
  | 'CRYPTO'
  | 'CRYPTO_PAIR'
  | 'FOREX'
  | 'FUTURE'
  | 'FUTURES'
  | 'FUTURES_OPTION'
  | 'MUTUAL_FUND'
  | 'FUND'
  | 'COMMODITY'
  | 'BOND'
  | 'TREASURY'
  | 'ECONOMIC_INDICATOR'
  | 'ADR'
  | 'WARRANT'
  | 'OTHER';

export type InstrumentActiveStatus = 'ACTIVE' | 'EXPIRED' | 'DELISTED' | 'HALTED' | 'PRE_MARKET' | 'SUSPENDED';

export type RealTimeDataTier = 'REAL_TIME' | 'DELAYED_15M' | 'END_OF_DAY' | 'UNENTITLED';

export type TradingSessionType =
  | 'US_EQUITIES_REGULAR'
  | 'US_EQUITIES_EXTENDED'
  | 'CONTINUOUS_24_7'
  | 'REGULAR_24_5'
  | 'US_FUTURES_CME'
  | 'GLOBAL_EQUITIES'
  | 'BOND_SIFMA'
  | 'MACRO_SCHEDULED';

export type SettlementType = 'PHYSICAL' | 'CASH';

export type OptionType = 'CALL' | 'PUT';

export interface ProviderSymbolMap {
  massive?: string; // Polygon / Massive (e.g., C:EURUSD, X:BTCUSD, O:SPY260821C00515000, I:SPX)
  finnhub?: string; // Finnhub (e.g., BINANCE:BTCUSDT, OANDA:EUR_USD)
  alpaca?: string;  // Alpaca (e.g., BTCUSD, SPY)
  benzinga?: string;
  yahoo?: string;   // Yahoo Finance fallback (e.g., EURUSD=X, BTC-USD, ES=F, ^GSPC, ^TNX)
  cme?: string;     // CME Group (e.g., /ESH25, /ESM26, /CLH25)
  bloomberg?: string;
  fred?: string;    // Federal Reserve Economic Data
}

export interface InstrumentGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho?: number;
  iv: number;
  ivPercentile?: number;
  openInterest?: number;
  underlyingPrice?: number;
}

export interface InstrumentForexMetrics {
  baseCurrency: string;
  quoteCurrency: string;
  pipSize: number; // e.g. 0.0001 or 0.01 for JPY
  spreadPips: number;
  activeSession: 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK' | 'CLOSED';
  sessionOverlap?: string;
  high24h: number;
  low24h: number;
}

export interface InstrumentCryptoMetrics {
  baseAsset: string;
  quoteAsset: string;
  exchangeName: string; // Coinbase, Binance, Kraken, OKX, Aggregated
  isAggregated: boolean;
  volume24hUsd: number;
  marketCapUsd?: number;
  circulatingSupply?: number;
  high24h: number;
  low24h: number;
}

export interface InstrumentFuturesMetrics {
  contractRoot: string; // e.g., 'ES', 'NQ', 'CL', 'GC', 'ZB'
  contractMonth: string; // e.g., 'H26', 'M26', 'U26', 'Z26'
  expirationDate: string; // YYYY-MM-DD
  lastTradeDate: string;
  multiplier: number; // e.g. 50 for ES, 20 for NQ, 1000 for CL
  tickSize: number; // e.g. 0.25 for ES ($12.50/point)
  tickValue: number;
  settlementType: SettlementType;
  openInterest: number;
  isContinuous: boolean;
  frontMonthSymbol: string;
  daysToExpiration: number;
  rollNotice?: string;
}

export interface InstrumentBondMetrics {
  couponRate: number; // e.g. 4.25%
  maturityDate: string;
  yieldToMaturity: number; // YTM %
  durationYears?: number;
  convexity?: number;
  benchmarkSpreadBps: number; // Spread vs 10Y Treasury in bps
  rating?: string; // AAA, AA+, BBB, etc.
  issuer: string;
}

export interface InstrumentEconomicMetrics {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  lastReading: string | number;
  consensusForecast?: string | number;
  priorReading?: string | number;
  unit: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  nextReleaseDate?: string;
  sourceAgency: string; // BLS, BEA, Federal Reserve, ISM, etc.
}

export interface NormalizedInstrument {
  instrumentId: string; // Unique permanent global ID (e.g., 'inst_stock_aapl_nasdaq', 'inst_forex_eurusd', 'inst_crypto_btcusd')
  symbol: string; // Primary clean display ticker (e.g. 'AAPL', 'EUR/USD', 'BTC/USD', 'ES', 'SPY 260821 515C')
  displaySymbol: string;
  name: string;
  assetClass: UniversalAssetClass;
  instrumentType: string; // e.g. 'Common Stock', 'Major FX Pair', 'Perpetual / Spot Crypto', 'E-Mini Index Future', 'Vanilla Equity Option'
  exchange: string; // e.g. 'NASDAQ', 'NYSE', 'CME', 'ICE', 'COINBASE', 'FOREX_OTC', 'CBOE'
  exchangeMIC?: string; // ISO 10383 Market Identifier Code (e.g. 'XNAS', 'XNYS', 'XCME', 'XCBO')
  country: string;
  currency: string;
  
  // Cross-Provider Symbol Mapping
  providerSymbol: string;
  providerSymbols: ProviderSymbolMap;

  // Currencies (Forex/Crypto)
  baseCurrency?: string;
  quoteCurrency?: string;

  // Trading Hours & Timezones
  marketTimezone: string; // e.g. 'America/New_York', 'UTC', 'Europe/London'
  tradingSession: TradingSessionType;

  // Derivative & Contract Specifications
  contractRoot?: string;
  contractMonth?: string;
  expirationDate?: string;
  strikePrice?: number;
  optionType?: OptionType;
  contractMultiplier?: number;
  settlementType?: SettlementType;

  // Official Legal Identifiers
  isin?: string;
  figi?: string;
  cusip?: string;

  // Active status & Feed Entitlements
  activeStatus: InstrumentActiveStatus;
  primaryProvider: 'massive' | 'finnhub' | 'alpaca' | 'benzinga' | 'yahoo' | 'cme' | 'fred' | 'institutional_engine';
  realTimeStatus: RealTimeDataTier;
  feedDelayMinutes: number; // 0 = real-time, 15 = delayed
  isEntitled: boolean;
  entitlementMessage?: string;

  // Asset-Specific Metrics
  greeks?: InstrumentGreeks;
  forexMetrics?: InstrumentForexMetrics;
  cryptoMetrics?: InstrumentCryptoMetrics;
  futuresMetrics?: InstrumentFuturesMetrics;
  bondMetrics?: InstrumentBondMetrics;
  economicMetrics?: InstrumentEconomicMetrics;

  // Quote Snapshot
  price?: number;
  change?: number;
  changePercent?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  timestamp?: string;
  lastUpdated: string;
}

export interface InstrumentSearchResultGroup {
  assetClass: UniversalAssetClass;
  title: string;
  instruments: NormalizedInstrument[];
}

export interface ProviderCapability {
  providerId: 'massive' | 'finnhub' | 'alpaca' | 'benzinga' | 'yahoo' | 'cme' | 'fred';
  name: string;
  isConfigured: boolean;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'RATE_LIMITED' | 'OFFLINE';
  supportedAssetClasses: UniversalAssetClass[];
  dataTypes: Array<'REAL_TIME_QUOTES' | 'HISTORICAL_CANDLES' | 'OPTIONS_CHAIN' | 'GREEKS' | 'FOREX_STREAM' | 'CRYPTO_TRADES' | 'FUTURES_DEPTH' | 'NEWS_INTELLIGENCE' | 'SEC_FILINGS' | 'ECONOMIC_SERIES'>;
  rateLimitPerMinute: number;
  averageLatencyMs: number;
  entitlementTier: 'FREE' | 'BASIC' | 'PRO' | 'INSTITUTIONAL' | 'UNLICENSED';
}

export interface MultiAssetQuoteResponse {
  instrument: NormalizedInstrument;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    bid: number;
    ask: number;
    spread: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
    openPrice: number;
    previousClose: number;
    vwap?: number;
    marketState: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED' | 'ACTIVE_24_7' | 'ACTIVE_24_5';
    timestamp: string;
    dataSource: string;
    isRealTime: boolean;
    feedDelayMinutes: number;
    latencyMs: number;
    currency: string;
    metadata?: MarketDataMetadata;
  };
  assetSpecificData?: {
    greeks?: InstrumentGreeks;
    forex?: InstrumentForexMetrics;
    crypto?: InstrumentCryptoMetrics;
    futures?: InstrumentFuturesMetrics;
    bond?: InstrumentBondMetrics;
    economic?: InstrumentEconomicMetrics;
  };
  entitlementStatus: {
    isAvailable: boolean;
    unavailabilityReason?: string; // "Not available through your current data plan"
    upgradeUrl?: string;
  };
}

export interface MultiAssetChartCandle {
  timestamp: number; // Unix ms
  timeString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  session?: 'REGULAR' | 'PRE' | 'POST' | 'OVERNIGHT';
  rollMarker?: boolean;
}

export type RealTimeDataMode = 'REAL_TIME' | 'DELAYED' | 'CACHED' | 'CLOSED' | 'UNAVAILABLE';

export type MarketSessionType = 'PRE' | 'OPEN' | 'AFTER' | 'CLOSED' | 'WEEKEND' | '24/7';

export type ProviderConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'RECONNECTING'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'DOWN';

export interface NormalizedQuote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  last?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  vwap?: number;
  timestamp: number;
  provider: string;
  mode: RealTimeDataMode;
  marketStatus: MarketSessionType;
  stale: boolean;
  rawPayload?: any;
}

export interface NormalizedTrade {
  symbol: string;
  price: number;
  size?: number;
  timestamp: number;
  provider: string;
  mode: RealTimeDataMode;
  exchange?: string;
  conditions?: string[];
}

export interface ProviderCapabilities {
  stocks: boolean;
  options: boolean;
  crypto: boolean;
  forex: boolean;
  futures: boolean;
  realtimeStocks?: boolean;
  realtimeOptions?: boolean;
  extendedHours?: boolean;
  entitlementTier?: 'FREE' | 'DELAYED' | 'PRO' | 'INSTITUTIONAL' | 'UNKNOWN';
}

export interface ProviderDiagnosticMetrics {
  providerId: string;
  name: string;
  isConfigured: boolean;
  connectionStatus: ProviderConnectionStatus;
  authStatus: 'AUTHENTICATED' | 'AUTH_ERROR' | 'UNAUTHENTICATED' | 'NOT_REQUIRED';
  webSocketStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'FAILED';
  restStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  realtimeEntitlement: 'CONFIRMED' | 'DELAYED' | 'UNKNOWN' | 'NOT_AVAILABLE';
  extendedHoursEntitlement: boolean;
  lastSuccessfulConnection?: number;
  lastSuccessfulTick?: number;
  lastTickTimestamp?: number;
  latencyMs: number;
  errorCount: number;
  rateLimitStatus: 'HEALTHY' | 'APPROACHING_LIMIT' | 'RATE_LIMITED';
  lastError?: string;
  subscribedSymbolsCount: number;
}

export interface RealTimeDiagnosticsInfo {
  globalStatus: 'CONNECTED' | 'DEGRADED' | 'DOWN';
  activeProvider: string;
  environment: 'development' | 'staging' | 'production';
  simulationPermitted: boolean;
  systemScore: string; // e.g. "5/5"
  providers: Record<string, ProviderDiagnosticMetrics>;
  activeSubscriptions: Array<{
    symbol: string;
    refCount: number;
    subscribedAt: number;
    lastTickTime?: number;
    tickAgeMs?: number;
    tickCount: number;
    providerSymbol: string;
    mode: RealTimeDataMode;
  }>;
  logs: Array<{
    timestamp: number;
    event: string;
    provider: string;
    details?: any;
  }>;
}

export interface RealTimeProvider {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbols: string[]): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;

  onTrade(callback: (trade: NormalizedTrade) => void): () => void;
  onQuote(callback: (quote: NormalizedQuote) => void): () => void;
  onStatus(callback: (status: ProviderConnectionStatus, metrics?: Partial<ProviderDiagnosticMetrics>) => void): () => void;

  getStatus(): ProviderConnectionStatus;
  getMetrics(): ProviderDiagnosticMetrics;
  testConnection(symbol?: string): Promise<{
    success: boolean;
    resultCode: 'PASS' | 'FAIL' | 'MARKET_CLOSED' | 'NO_ENTITLEMENT' | 'AUTH_ERROR' | 'NO_DATA_RECEIVED';
    message: string;
    latencyMs: number;
    sampleData?: any;
  }>;
}

import { RobinhoodMarketDataError, RobinhoodMarketDataService } from './robinhoodMarketDataService.js';

export type MarketDataProviderId = 'massive' | 'alpaca' | 'robinhood' | 'yahoo';

export type MarketDataErrorCategory =
  | 'missing_configuration'
  | 'authorization'
  | 'rate_limit'
  | 'timeout'
  | 'upstream'
  | 'network'
  | 'malformed_payload'
  | 'unsupported_symbol';

export interface MarketDataDiagnostic {
  provider: MarketDataProviderId;
  category: MarketDataErrorCategory;
  configured: boolean;
  httpStatus?: number;
  timeout: boolean;
  latencyMs: number;
  timestamp: string;
}

export interface NormalizedLiveQuote {
  symbol: string;
  name?: string;
  currency: string;
  exchange?: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  openPrice: number;
  volume: number;
  bid?: number;
  ask?: number;
  vwap?: number;
  timestamp: number;
  marketSession: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED';
  providerId: MarketDataProviderId;
  providerName: string;
  /** False unless the provider explicitly confirms a live entitlement. */
  isRealTime: boolean;
  /** Only set when the provider supplies a verified delay. */
  feedDelayMinutes?: number;
  liveStatus?: 'live' | 'delayed' | 'unknown';
  entitlementStatus?: string;
  latencyMs: number;
}

export interface NormalizedLiveCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  providerId: MarketDataProviderId;
  providerName: string;
}

export class MarketDataProviderError extends Error {
  constructor(
    public readonly diagnostic: MarketDataDiagnostic,
    message = 'Live market data provider request failed.'
  ) {
    super(message);
    this.name = 'MarketDataProviderError';
  }
}

export class MarketDataUnavailableError extends Error {
  constructor(
    public readonly symbol: string,
    public readonly diagnostics: MarketDataDiagnostic[]
  ) {
    super('LIVE_MARKET_DATA_UNAVAILABLE');
    this.name = 'MarketDataUnavailableError';
  }
}

type FetchLike = typeof fetch;
type Environment = Record<string, string | undefined>;

interface LiveMarketDataServiceOptions {
  env?: Environment;
  fetchFn?: FetchLike;
  timeoutMs?: number;
  now?: () => number;
  logger?: (diagnostic: MarketDataDiagnostic & { event: string; symbol: string }) => void;
}

const MASSIVE_NAME = 'Massive / Polygon.io';
const ALPACA_NAME = 'Alpaca IEX';
const YAHOO_NAME = 'Yahoo Finance';
const ROBINHOOD_NAME = 'Robinhood Read-Only Market Data';

function finitePositive(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function finiteNonNegative(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function cleanSymbol(symbol: string): string {
  const clean = symbol.toUpperCase().trim();
  if (!/^[A-Z0-9.^=\/-]{1,20}$/.test(clean)) {
    throw new Error('INVALID_MARKET_SYMBOL');
  }
  return clean;
}

function normalizeTimestamp(value: unknown): number | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    if (numeric > 1e17) return Math.floor(numeric / 1e6);
    if (numeric > 1e14) return Math.floor(numeric / 1e3);
    if (numeric < 1e11) return Math.floor(numeric * 1000);
    return Math.floor(numeric);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

type RobinhoodTiming = Pick<NormalizedLiveQuote, 'isRealTime' | 'feedDelayMinutes' | 'liveStatus' | 'entitlementStatus'> & { timestamp?: number };

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function field(metadata: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) if (metadata[name] !== undefined) return metadata[name];
  return undefined;
}

function boolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (typeof value === 'string' && /^(true|false)$/i.test(value.trim())) return value.trim().toLowerCase() === 'true';
  return null;
}

function robinhoodTiming(...sources: unknown[]): RobinhoodTiming {
  const metadata = Object.assign({}, ...sources.map(object));
  const rawLiveStatus = field(metadata, 'liveStatus', 'live_status', 'marketDataStatus', 'market_data_status');
  const rawRealTime = field(metadata, 'isRealTime', 'is_real_time', 'realtime', 'real_time');
  const rawDelay = field(metadata, 'feedDelayMinutes', 'feed_delay_minutes', 'delayMinutes', 'delay_minutes');
  const rawEntitlement = field(metadata, 'entitlementStatus', 'entitlement_status', 'entitlement');
  const rawStale = field(metadata, 'stale', 'isStale', 'is_stale');
  const rawTimestamp = field(metadata, 'timestamp', 'providerTimestamp', 'provider_timestamp', 'asOf', 'as_of');
  const status = typeof rawLiveStatus === 'string' ? rawLiveStatus.trim().toLowerCase() : '';
  const entitlementStatus = typeof rawEntitlement === 'string' && rawEntitlement.trim() ? rawEntitlement.trim() : undefined;
  const entitlement = entitlementStatus?.toLowerCase() ?? '';
  const declaredRealTime = boolean(rawRealTime);
  const declaredStale = boolean(rawStale);
  const delay = rawDelay === undefined ? null : finiteNonNegative(rawDelay);
  if ((rawRealTime !== undefined && declaredRealTime === null) || (rawStale !== undefined && declaredStale === null) || (rawDelay !== undefined && delay === null) || (rawTimestamp !== undefined && normalizeTimestamp(rawTimestamp) === null)) throw new Error('MALFORMED_ROBINHOOD_TIMING');
  if (declaredStale === true) throw new Error('STALE_ROBINHOOD_QUOTE');

  const saysLive = ['live', 'real_time', 'real-time', 'realtime'].includes(status) || ['live', 'real_time', 'real-time', 'realtime', 'entitled'].includes(entitlement);
  const saysDelayed = ['delayed', 'delay'].includes(status) || ['delayed', 'delay'].includes(entitlement) || declaredRealTime === false;
  if ((saysLive && (saysDelayed || delay !== null && delay > 0)) || (saysDelayed && declaredRealTime === true)) throw new Error('CONTRADICTORY_ROBINHOOD_TIMING');

  const liveStatus: RobinhoodTiming['liveStatus'] = saysLive || declaredRealTime === true ? 'live' : saysDelayed ? 'delayed' : 'unknown';
  if (liveStatus === 'live' && delay !== null && delay > 0) throw new Error('CONTRADICTORY_ROBINHOOD_TIMING');
  return { isRealTime: liveStatus === 'live', ...(delay === null ? {} : { feedDelayMinutes: delay }), liveStatus, ...(entitlementStatus ? { entitlementStatus } : {}), ...(rawTimestamp === undefined ? {} : { timestamp: normalizeTimestamp(rawTimestamp)! }) };
}

function sessionFromProvider(value: unknown, now: number): NormalizedLiveQuote['marketSession'] {
  const state = String(value || '').toUpperCase();
  if (state.includes('PRE')) return 'PRE_MARKET';
  if (state.includes('POST') || state.includes('AFTER')) return 'AFTER_HOURS';
  if (state.includes('CLOSED')) return 'CLOSED';
  if (state.includes('REGULAR') || state.includes('OPEN')) return 'REGULAR';

  const date = new Date(now);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(date);
  if (weekday === 'Sat' || weekday === 'Sun') return 'CLOSED';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0) % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  const minutes = hour * 60 + minute;
  if (minutes >= 570 && minutes < 960) return 'REGULAR';
  if (minutes >= 240 && minutes < 570) return 'PRE_MARKET';
  if (minutes >= 960 && minutes < 1200) return 'AFTER_HOURS';
  return 'CLOSED';
}

function validateQuote(quote: NormalizedLiveQuote): NormalizedLiveQuote {
  const requiredPositive = [
    quote.price,
    quote.previousClose,
    quote.dayHigh,
    quote.dayLow,
    quote.openPrice,
  ];
  if (
    !requiredPositive.every((value) => Number.isFinite(value) && value > 0) ||
    !Number.isFinite(quote.volume) ||
    quote.volume < 0 ||
    !Number.isFinite(quote.timestamp) ||
    quote.timestamp <= 0 ||
    quote.dayHigh < quote.dayLow
  ) {
    throw new Error('MALFORMED_QUOTE');
  }
  if (
    quote.bid !== undefined &&
    quote.ask !== undefined &&
    (!Number.isFinite(quote.bid) || !Number.isFinite(quote.ask) || quote.bid <= 0 || quote.ask <= 0 || quote.bid > quote.ask * 1.05)
  ) {
    throw new Error('MALFORMED_QUOTE');
  }
  return quote;
}

export class LiveMarketDataService {
  private readonly env: Environment;
  private readonly fetchFn: FetchLike;
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private readonly logger: NonNullable<LiveMarketDataServiceOptions['logger']>;
  private readonly robinhood: RobinhoodMarketDataService;
  private readonly latestDiagnostics = new Map<MarketDataProviderId, MarketDataDiagnostic>();
  private readonly cooldownUntil = new Map<MarketDataProviderId, number>();

  constructor(options: LiveMarketDataServiceOptions = {}) {
    this.env = options.env || process.env;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.timeoutMs = options.timeoutMs || Number(this.env.MARKET_DATA_TIMEOUT_MS) || 8_000;
    this.now = options.now || Date.now;
    this.robinhood = new RobinhoodMarketDataService({ env: this.env, fetchFn: this.fetchFn, now: this.now });
    this.logger =
      options.logger ||
      ((diagnostic) => {
        console.warn(JSON.stringify(diagnostic));
      });
  }

  getConfigurationStatus() {
    return {
      massive: Boolean(this.getMassiveApiKey()),
      alpaca: Boolean(this.env.ALPACA_API_KEY?.trim() && this.env.ALPACA_API_SECRET?.trim()),
      robinhood: this.robinhood.isConfigured(),
      yahoo: this.env.YAHOO_MARKET_DATA_ENABLED !== 'false',
    };
  }

  getDiagnostics(): MarketDataDiagnostic[] {
    return Array.from(this.latestDiagnostics.values());
  }

  getRobinhoodHealth() {
    return this.robinhood.getHealth();
  }

  /** Provider order: Alpaca, Massive, Robinhood (opt-in), Yahoo, then unavailable. */
  async getCandles(symbol: string, timeframe = '5m'): Promise<NormalizedLiveCandle[]> {
    const clean = cleanSymbol(symbol);
    const diagnostics: MarketDataDiagnostic[] = [];
    const attempts: Array<() => Promise<NormalizedLiveCandle[]>> = [];
    if (this.env.ALPACA_API_KEY?.trim() && this.env.ALPACA_API_SECRET?.trim()) attempts.push(() => this.fetchAlpacaCandles(clean, timeframe));
    if (this.getMassiveApiKey()) attempts.push(() => this.fetchMassiveCandles(clean, timeframe));
    if (this.robinhood.isConfigured()) attempts.push(() => this.fetchRobinhoodCandles(clean, timeframe));
    if (this.env.YAHOO_MARKET_DATA_ENABLED !== 'false') attempts.push(() => this.fetchYahooCandles(clean, timeframe));
    for (const attempt of attempts) {
      try { return await attempt(); } catch (error) {
        if (error instanceof MarketDataProviderError) { diagnostics.push(error.diagnostic); this.recordFailure(clean, error.diagnostic); continue; }
        throw error;
      }
    }
    throw new MarketDataUnavailableError(clean, diagnostics);
  }

  async getTape(symbols: string[]): Promise<NormalizedLiveQuote[]> {
    const clean = symbols.map(cleanSymbol);
    if (this.env.ALPACA_API_KEY?.trim() && this.env.ALPACA_API_SECRET?.trim()) {
      try { return await this.fetchAlpacaTape(clean); } catch (error) { if (error instanceof MarketDataProviderError) this.recordFailure('TAPE', error.diagnostic); else throw error; }
    }
    const results = await Promise.allSettled(clean.map((symbol) => this.getQuote(symbol)));
    const quotes = results.filter((result): result is PromiseFulfilledResult<NormalizedLiveQuote> => result.status === 'fulfilled').map((result) => result.value);
    if (quotes.length) return quotes;
    const diagnostics = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').flatMap((result) => result.reason instanceof MarketDataUnavailableError ? result.reason.diagnostics : []);
    throw new MarketDataUnavailableError('TAPE', diagnostics);
  }

  private alpacaConfig() {
    const apiKey = this.env.ALPACA_API_KEY?.trim(); const apiSecret = this.env.ALPACA_API_SECRET?.trim();
    if (!apiKey || !apiSecret) throw new MarketDataProviderError(this.makeDiagnostic('alpaca', 'missing_configuration', false, 0), 'Alpaca market data is not configured.');
    return { baseUrl: (this.env.ALPACA_DATA_BASE_URL || 'https://data.alpaca.markets').replace(/\/$/, ''), headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': apiSecret, Accept: 'application/json' }, feed: this.env.ALPACA_DATA_FEED?.trim() || 'iex' };
  }

  private candleTimeframe(timeframe: string) { const value = timeframe.toLowerCase(); return value === '1d' ? '1Day' : value === '1w' ? '1Week' : `${Math.max(1, Number.parseInt(value, 10) || 5)}Min`; }

  private normalizeCandles(providerId: MarketDataProviderId, providerName: string, bars: any[]): NormalizedLiveCandle[] {
    const candles = bars.map((bar) => ({ timestamp: normalizeTimestamp(bar.t ?? bar.timestamp ?? bar.begins_at), open: finitePositive(bar.o ?? bar.open ?? bar.open_price), high: finitePositive(bar.h ?? bar.high ?? bar.high_price), low: finitePositive(bar.l ?? bar.low ?? bar.low_price), close: finitePositive(bar.c ?? bar.close ?? bar.close_price), volume: finiteNonNegative(bar.v ?? bar.volume), providerId, providerName })).filter((bar): bar is NormalizedLiveCandle => bar.timestamp !== null && bar.open !== null && bar.high !== null && bar.low !== null && bar.close !== null && bar.volume !== null && bar.high >= Math.max(bar.open, bar.close, bar.low) && bar.low <= Math.min(bar.open, bar.close, bar.high)).sort((a, b) => a.timestamp - b.timestamp);
    if (!candles.length) throw new MarketDataProviderError(this.makeDiagnostic(providerId, 'malformed_payload', true, 0), `${providerName} returned no valid candles.`);
    return candles.slice(-500);
  }

  private async fetchAlpacaCandles(symbol: string, timeframe: string) {
    const started = this.now(); const config = this.alpacaConfig();
    const response = await this.request('alpaca', `${config.baseUrl}/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=${encodeURIComponent(this.candleTimeframe(timeframe))}&feed=${encodeURIComponent(config.feed)}&limit=500`, config.headers, started);
    const payload = await this.readJson('alpaca', response, started);
    return this.normalizeCandles('alpaca', ALPACA_NAME, Array.isArray(payload?.bars) ? payload.bars : []);
  }

  private async fetchMassiveCandles(symbol: string, timeframe: string) {
    const started = this.now(); const key = this.getMassiveApiKey(); if (!key) throw new MarketDataProviderError(this.makeDiagnostic('massive', 'missing_configuration', false, 0), 'Massive is not configured.');
    const value = timeframe.toLowerCase(); const unit = value === '1d' ? 'day' : value === '1w' ? 'week' : value === '1h' || value === '4h' ? 'hour' : 'minute'; const multiplier = value === '1h' ? 1 : value === '4h' ? 4 : value === '1d' || value === '1w' ? 1 : Math.max(1, Number.parseInt(value, 10) || 5);
    const end = new Date(this.now()); const start = new Date(this.now() - 30 * 24 * 60 * 60 * 1000);
    const response = await this.request('massive', `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${unit}/${start.toISOString().slice(0, 10)}/${end.toISOString().slice(0, 10)}?adjusted=true&sort=asc&limit=5000`, { Authorization: `Bearer ${key}`, Accept: 'application/json' }, started);
    const payload = await this.readJson('massive', response, started); return this.normalizeCandles('massive', MASSIVE_NAME, Array.isArray(payload?.results) ? payload.results : []);
  }

  private async fetchRobinhoodCandles(symbol: string, timeframe: string) {
    const payload = await this.robinhood.getEquityHistoricals({ symbols: [symbol], interval: timeframe });
    const result = payload?.data?.results?.[0] ?? payload?.results?.[0]; return this.normalizeCandles('robinhood', ROBINHOOD_NAME, Array.isArray(result?.bars) ? result.bars : []);
  }

  private async fetchYahooCandles(symbol: string, timeframe: string) {
    const started = this.now(); const interval = timeframe === '1h' ? '60m' : timeframe === '1d' ? '1d' : timeframe === '1w' ? '1wk' : timeframe;
    const response = await this.request('yahoo', `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=${encodeURIComponent(interval)}`, { Accept: 'application/json', 'User-Agent': 'MarketMindAI/1.0 market-data-gateway' }, started);
    const payload = await this.readJson('yahoo', response, started); const result = payload?.chart?.result?.[0]; const quote = result?.indicators?.quote?.[0] ?? {};
    return this.normalizeCandles('yahoo', YAHOO_NAME, (result?.timestamp ?? []).map((t: unknown, i: number) => ({ t, o: quote.open?.[i], h: quote.high?.[i], l: quote.low?.[i], c: quote.close?.[i], v: quote.volume?.[i] })));
  }

  private async fetchAlpacaTape(symbols: string[]) {
    const started = this.now(); const config = this.alpacaConfig();
    const response = await this.request('alpaca', `${config.baseUrl}/v2/stocks/snapshots?symbols=${encodeURIComponent(symbols.join(','))}&feed=${encodeURIComponent(config.feed)}`, config.headers, started);
    const payload = await this.readJson('alpaca', response, started); const snapshots = object(payload?.snapshots);
    const quotes = symbols.map((symbol) => this.normalizeAlpacaSnapshot(symbol, snapshots[symbol], started)).filter((quote): quote is NormalizedLiveQuote => quote !== null);
    if (!quotes.length) throw new MarketDataProviderError(this.makeDiagnostic('alpaca', 'malformed_payload', true, this.now() - started), 'Alpaca returned no valid tape snapshots.'); return quotes;
  }

  private normalizeAlpacaSnapshot(symbol: string, payload: any, started: number): NormalizedLiveQuote | null {
    try { const price = finitePositive(payload?.latestTrade?.p ?? payload?.dailyBar?.c); const previousClose = finitePositive(payload?.prevDailyBar?.c); const dayHigh = finitePositive(payload?.dailyBar?.h); const dayLow = finitePositive(payload?.dailyBar?.l); const openPrice = finitePositive(payload?.dailyBar?.o); const volume = finiteNonNegative(payload?.dailyBar?.v); const timestamp = normalizeTimestamp(payload?.latestTrade?.t ?? payload?.latestQuote?.t); if ([price, previousClose, dayHigh, dayLow, openPrice, volume, timestamp].some((value) => value === null)) return null; return this.finishQuote({ symbol, currency: 'USD', exchange: 'US Equities', price: price!, previousClose: previousClose!, dayHigh: dayHigh!, dayLow: dayLow!, openPrice: openPrice!, volume: volume!, timestamp: timestamp!, marketSession: sessionFromProvider(undefined, this.now()), providerId: 'alpaca', providerName: ALPACA_NAME, isRealTime: this.alpacaConfig().feed === 'iex', feedDelayMinutes: 0, latencyMs: this.now() - started, change: 0, changePercent: 0 }, started); } catch { return null; }
  }

  async getQuote(symbol: string): Promise<NormalizedLiveQuote> {
    let clean: string;
    try {
      clean = cleanSymbol(symbol);
    } catch {
      const diagnostic = this.makeDiagnostic('yahoo', 'unsupported_symbol', false, 0);
      throw new MarketDataUnavailableError(symbol, [diagnostic]);
    }

    const diagnostics: MarketDataDiagnostic[] = [];
    const configured = this.getConfigurationStatus();
    const attempts: Array<() => Promise<NormalizedLiveQuote>> = [];

    if (configured.alpaca) attempts.push(() => this.fetchAlpacaQuote(clean));
    // Schwab is intentionally skipped when no configured adapter is present.
    if (configured.massive) attempts.push(() => this.fetchMassiveQuote(clean));
    if (configured.robinhood) attempts.push(() => this.fetchRobinhoodQuote(clean));
    if (configured.yahoo) attempts.push(() => this.fetchYahooQuote(clean));

    if (!configured.massive) {
      diagnostics.push(this.makeDiagnostic('massive', 'missing_configuration', false, 0));
    }
    if (!configured.alpaca) {
      diagnostics.push(this.makeDiagnostic('alpaca', 'missing_configuration', false, 0));
    }
    if (!configured.robinhood) {
      diagnostics.push(this.makeDiagnostic('robinhood', 'missing_configuration', false, 0));
    }

    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (error) {
        if (error instanceof MarketDataProviderError) {
          diagnostics.push(error.diagnostic);
          this.recordFailure(clean, error.diagnostic);
          continue;
        }
        throw error;
      }
    }

    if (!configured.yahoo) {
      diagnostics.push(this.makeDiagnostic('yahoo', 'missing_configuration', false, 0));
    }
    throw new MarketDataUnavailableError(clean, diagnostics);
  }

  async fetchMassiveQuote(symbol: string): Promise<NormalizedLiveQuote> {
    const provider: MarketDataProviderId = 'massive';
    const started = this.now();
    const apiKey = this.getMassiveApiKey();
    if (!apiKey) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'missing_configuration', false, 0),
        'Massive / Polygon market data is not configured.'
      );
    }

    try {
      const response = await this.request(
        provider,
        `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}`,
        { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        started
      );
      const payload = await this.readJson(provider, response, started);
      const ticker = payload?.ticker;
      const price = finitePositive(ticker?.lastTrade?.p ?? ticker?.min?.c ?? ticker?.day?.c);
      const previousClose = finitePositive(ticker?.prevDay?.c);
      const dayHigh = finitePositive(ticker?.day?.h);
      const dayLow = finitePositive(ticker?.day?.l);
      const openPrice = finitePositive(ticker?.day?.o);
      const volume = finiteNonNegative(ticker?.day?.v);
      const timestamp = normalizeTimestamp(ticker?.updated ?? ticker?.lastTrade?.t);

      if (
        price === null ||
        previousClose === null ||
        dayHigh === null ||
        dayLow === null ||
        openPrice === null ||
        volume === null ||
        timestamp === null
      ) {
        throw new MarketDataProviderError(
          this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started, response.status),
          'Massive / Polygon returned an incomplete quote payload.'
        );
      }

      return this.finishQuote(
        {
          symbol,
          currency: 'USD',
          exchange: 'US Equities',
          price,
          previousClose,
          dayHigh,
          dayLow,
          openPrice,
          volume,
          bid: finitePositive(ticker?.lastQuote?.p) ?? undefined,
          ask: finitePositive(ticker?.lastQuote?.P) ?? undefined,
          vwap: finitePositive(ticker?.day?.vw) ?? undefined,
          timestamp,
          marketSession: sessionFromProvider(ticker?.market_status, this.now()),
          providerId: provider,
          providerName: MASSIVE_NAME,
          isRealTime: this.getMassiveFeedDelayMinutes() === 0,
          feedDelayMinutes: this.getMassiveFeedDelayMinutes(),
          latencyMs: this.now() - started,
          change: 0,
          changePercent: 0,
        },
        started
      );
    } catch (error) {
      return this.fetchMassiveAggregateQuote(symbol, apiKey, started);
    }
  }

  private async fetchMassiveAggregateQuote(
    symbol: string,
    apiKey: string,
    started: number
  ): Promise<NormalizedLiveQuote> {
    const provider: MarketDataProviderId = 'massive';
    const to = new Date(this.now());
    const from = new Date(this.now() - 8 * 24 * 60 * 60 * 1000);
    const url =
      `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}` +
      `/range/5/minute/${from.toISOString().slice(0, 10)}/${to.toISOString().slice(0, 10)}` +
      '?adjusted=true&sort=desc&limit=5000';
    const response = await this.request(
      provider,
      url,
      { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      started
    );
    const payload = await this.readJson(provider, response, started);
    const rawBars = Array.isArray(payload?.results) ? payload.results : [];
    const bars = rawBars
      .map((bar: any) => ({
        timestamp: normalizeTimestamp(bar?.t),
        open: finitePositive(bar?.o),
        high: finitePositive(bar?.h),
        low: finitePositive(bar?.l),
        close: finitePositive(bar?.c),
        volume: finiteNonNegative(bar?.v),
      }))
      .filter(
        (bar: any) =>
          bar.timestamp !== null &&
          bar.open !== null &&
          bar.high !== null &&
          bar.low !== null &&
          bar.close !== null &&
          bar.volume !== null &&
          bar.high >= Math.max(bar.open, bar.close, bar.low) &&
          bar.low <= Math.min(bar.open, bar.close, bar.high)
      )
      .sort((a: any, b: any) => a.timestamp - b.timestamp) as Array<{
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;

    const etDateKey = (timestamp: number) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date(timestamp));
      const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
      return `${value('year')}-${value('month')}-${value('day')}`;
    };
    const isRegularBar = (timestamp: number) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }).formatToParts(new Date(timestamp));
      const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0) % 24;
      const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
      const minutes = hour * 60 + minute;
      return minutes >= 570 && minutes < 960;
    };

    const regularByDate = new Map<string, typeof bars>();
    for (const bar of bars) {
      if (!isRegularBar(bar.timestamp)) continue;
      const date = etDateKey(bar.timestamp);
      const dayBars = regularByDate.get(date) || [];
      dayBars.push(bar);
      regularByDate.set(date, dayBars);
    }

    const regularDates = Array.from(regularByDate.keys()).sort();
    const lastBar = bars.at(-1);
    const latestRegularDate = regularDates.at(-1);
    const latestRegularBars = latestRegularDate ? regularByDate.get(latestRegularDate) : undefined;
    const currentEtDate = etDateKey(this.now());
    const currentSession = sessionFromProvider(undefined, this.now());
    const previousCloseDateIndex =
      currentSession === 'PRE_MARKET' && latestRegularDate !== currentEtDate
        ? regularDates.length - 1
        : regularDates.length - 2;
    const previousCloseBars = regularByDate.get(regularDates[previousCloseDateIndex]);
    const previousClose = previousCloseBars?.at(-1)?.close ?? null;

    if (!lastBar || !latestRegularBars?.length || previousClose === null) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started, response.status),
        'Massive / Polygon aggregates did not contain two complete regular sessions.'
      );
    }

    const dayHigh = Math.max(...latestRegularBars.map((bar) => bar.high));
    const dayLow = Math.min(...latestRegularBars.map((bar) => bar.low));
    const volume = latestRegularBars.reduce((sum, bar) => sum + bar.volume, 0);
    const priceVolume = latestRegularBars.reduce(
      (sum, bar) => sum + ((bar.high + bar.low + bar.close) / 3) * bar.volume,
      0
    );
    const vwap = volume > 0 ? Number((priceVolume / volume).toFixed(6)) : undefined;

    return this.finishQuote(
      {
        symbol,
        currency: 'USD',
        exchange: 'US Equities',
        price: lastBar.close,
        previousClose,
        dayHigh,
        dayLow,
        openPrice: latestRegularBars[0].open,
        volume,
        vwap,
        timestamp: lastBar.timestamp,
        marketSession: currentSession,
        providerId: provider,
        providerName: `${MASSIVE_NAME} Aggregates`,
        isRealTime: this.getMassiveFeedDelayMinutes() === 0,
        feedDelayMinutes: this.getMassiveFeedDelayMinutes(),
        latencyMs: this.now() - started,
        change: 0,
        changePercent: 0,
      },
      started
    );
  }

  async fetchAlpacaQuote(symbol: string): Promise<NormalizedLiveQuote> {
    const provider: MarketDataProviderId = 'alpaca';
    const started = this.now();
    const apiKey = this.env.ALPACA_API_KEY?.trim();
    const apiSecret = this.env.ALPACA_API_SECRET?.trim();
    if (!apiKey || !apiSecret) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'missing_configuration', false, 0),
        'Alpaca market data is not configured.'
      );
    }

    const feed = this.env.ALPACA_DATA_FEED?.trim() || 'iex';
    const baseUrl = (this.env.ALPACA_DATA_BASE_URL || 'https://data.alpaca.markets').replace(/\/$/, '');
    const response = await this.request(
      provider,
      `${baseUrl}/v2/stocks/${encodeURIComponent(symbol)}/snapshot?feed=${encodeURIComponent(feed)}`,
      {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        Accept: 'application/json',
      },
      started
    );
    const payload = await this.readJson(provider, response, started);
    const price = finitePositive(payload?.latestTrade?.p ?? payload?.dailyBar?.c);
    const previousClose = finitePositive(payload?.prevDailyBar?.c);
    const dayHigh = finitePositive(payload?.dailyBar?.h);
    const dayLow = finitePositive(payload?.dailyBar?.l);
    const openPrice = finitePositive(payload?.dailyBar?.o);
    const volume = finiteNonNegative(payload?.dailyBar?.v);
    const timestamp = normalizeTimestamp(payload?.latestTrade?.t ?? payload?.latestQuote?.t);

    if (
      price === null ||
      previousClose === null ||
      dayHigh === null ||
      dayLow === null ||
      openPrice === null ||
      volume === null ||
      timestamp === null
    ) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started, response.status),
        'Alpaca returned an incomplete quote payload.'
      );
    }

    return this.finishQuote(
      {
        symbol,
        currency: 'USD',
        exchange: 'US Equities',
        price,
        previousClose,
        dayHigh,
        dayLow,
        openPrice,
        volume,
        bid: finitePositive(payload?.latestQuote?.bp) ?? undefined,
        ask: finitePositive(payload?.latestQuote?.ap) ?? undefined,
        vwap: finitePositive(payload?.dailyBar?.vw) ?? undefined,
        timestamp,
        marketSession: sessionFromProvider(undefined, this.now()),
        providerId: provider,
        providerName: ALPACA_NAME,
        isRealTime: feed === 'iex',
        feedDelayMinutes: 0,
        latencyMs: this.now() - started,
        change: 0,
        changePercent: 0,
      },
      started
    );
  }

  async fetchRobinhoodQuote(symbol: string): Promise<NormalizedLiveQuote> {
    const provider: MarketDataProviderId = 'robinhood';
    const started = this.now();
    try {
      const [quotePayload, fundamentalsPayload] = await Promise.all([
        this.robinhood.getEquityQuotes([symbol]),
        this.robinhood.getEquityFundamentals([symbol]),
      ]);
      const quoteRow = quotePayload?.data?.results?.[0] ?? quotePayload?.results?.[0];
      const quote = quoteRow?.quote ?? quoteRow;
      const fundamentalRow = fundamentalsPayload?.data?.results?.[0] ?? fundamentalsPayload?.results?.[0] ?? {};
      const price = finitePositive(quote?.last_non_reg_trade_price ?? quote?.last_trade_price);
      const previousClose = finitePositive(quote?.adjusted_previous_close ?? quote?.previous_close);
      const dayHigh = finitePositive(fundamentalRow?.high ?? fundamentalRow?.day_high);
      const dayLow = finitePositive(fundamentalRow?.low ?? fundamentalRow?.day_low);
      const openPrice = finitePositive(fundamentalRow?.open ?? fundamentalRow?.open_price);
      const volume = finiteNonNegative(fundamentalRow?.volume);
      const timing = robinhoodTiming(quotePayload?.metadata, quoteRow?.metadata, quote?.metadata);
      const quoteTimestamp = normalizeTimestamp(quote?.venue_last_non_reg_trade_time ?? quote?.venue_last_trade_time);
      const timestamp = quoteTimestamp ?? timing.timestamp ?? null;
      if (quoteTimestamp !== null && timing.timestamp !== undefined && Math.abs(quoteTimestamp - timing.timestamp) > 5 * 60 * 1000) {
        throw new MarketDataProviderError(this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started), 'Robinhood returned contradictory quote timestamps.');
      }
      if (price === null || previousClose === null || dayHigh === null || dayLow === null || openPrice === null || volume === null || timestamp === null) {
        throw new MarketDataProviderError(this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started), 'Robinhood returned an incomplete quote payload.');
      }
      return this.finishQuote({
        symbol, currency: 'USD', exchange: 'US Equities', price, previousClose, dayHigh, dayLow, openPrice, volume,
        bid: finitePositive(quote?.bid_price) ?? undefined, ask: finitePositive(quote?.ask_price) ?? undefined,
        timestamp, marketSession: sessionFromProvider(undefined, this.now()), providerId: provider, providerName: ROBINHOOD_NAME,
        ...timing, latencyMs: this.now() - started, change: 0, changePercent: 0,
      }, started);
    } catch (error) {
      if (error instanceof MarketDataProviderError) throw error;
      if (error instanceof Error && /(?:ROBINHOOD_TIMING|STALE_ROBINHOOD_QUOTE)/.test(error.message)) {
        throw new MarketDataProviderError(this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started), 'Robinhood returned invalid timing metadata.');
      }
      if (error instanceof RobinhoodMarketDataError) {
        const category: MarketDataErrorCategory = error.status === 'unauthorized' ? 'authorization'
          : error.status === 'rate_limited' ? 'rate_limit'
          : error.status === 'timeout' ? 'timeout'
          : error.status === 'malformed_payload' ? 'malformed_payload' : 'upstream';
        throw new MarketDataProviderError(this.makeDiagnostic(provider, category, error.status !== 'disabled', this.now() - started, error.httpStatus), 'Robinhood market data is unavailable.');
      }
      throw error;
    }
  }

  async fetchYahooQuote(symbol: string): Promise<NormalizedLiveQuote> {
    const provider: MarketDataProviderId = 'yahoo';
    const started = this.now();
    if (this.env.YAHOO_MARKET_DATA_ENABLED === 'false') {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'missing_configuration', false, 0),
        'Yahoo Finance market data is disabled.'
      );
    }

    let response: Response | null = null;
    let lastError: MarketDataProviderError | null = null;
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
      try {
        response = await this.request(
          provider,
          `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=true&events=div%2Csplits`,
          { Accept: 'application/json', 'User-Agent': 'MarketMindAI/1.0 market-data-gateway' },
          started
        );
        break;
      } catch (error) {
        if (error instanceof MarketDataProviderError) lastError = error;
      }
    }
    if (!response) throw lastError || new MarketDataProviderError(this.makeDiagnostic(provider, 'network', true, this.now() - started));

    const payload = await this.readJson(provider, response, started);
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    const timestamps: unknown[] = Array.isArray(result?.timestamp) ? result.timestamp : [];
    const highs: unknown[] = Array.isArray(quote?.high) ? quote.high : [];
    const lows: unknown[] = Array.isArray(quote?.low) ? quote.low : [];
    const opens: unknown[] = Array.isArray(quote?.open) ? quote.open : [];
    const closes: unknown[] = Array.isArray(quote?.close) ? quote.close : [];
    const volumes: unknown[] = Array.isArray(quote?.volume) ? quote.volume : [];
    const lastValidIndex = closes.reduce<number>(
      (last: number, value: unknown, index: number) => (finitePositive(value) !== null ? index : last),
      -1
    );

    const price = finitePositive(meta?.regularMarketPrice ?? (lastValidIndex >= 0 ? closes[lastValidIndex] : undefined));
    const previousClose = finitePositive(meta?.chartPreviousClose ?? meta?.previousClose);
    const dayHigh = finitePositive(meta?.regularMarketDayHigh ?? (lastValidIndex >= 0 ? highs[lastValidIndex] : undefined));
    const dayLow = finitePositive(meta?.regularMarketDayLow ?? (lastValidIndex >= 0 ? lows[lastValidIndex] : undefined));
    const openPrice = finitePositive(meta?.regularMarketOpen ?? (lastValidIndex >= 0 ? opens[lastValidIndex] : undefined));
    const volume = finiteNonNegative(meta?.regularMarketVolume ?? (lastValidIndex >= 0 ? volumes[lastValidIndex] : undefined));
    const timestamp = normalizeTimestamp(meta?.regularMarketTime ?? (lastValidIndex >= 0 ? timestamps[lastValidIndex] : undefined));

    if (
      price === null ||
      previousClose === null ||
      dayHigh === null ||
      dayLow === null ||
      openPrice === null ||
      volume === null ||
      timestamp === null
    ) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started, response.status),
        'Yahoo Finance returned an incomplete quote payload.'
      );
    }

    return this.finishQuote(
      {
        symbol,
        name: meta?.longName || meta?.shortName,
        currency: meta?.currency || 'USD',
        exchange: meta?.exchangeName,
        price,
        previousClose,
        dayHigh,
        dayLow,
        openPrice,
        volume,
        timestamp,
        marketSession: sessionFromProvider(meta?.marketState, this.now()),
        providerId: provider,
        providerName: YAHOO_NAME,
        isRealTime: false,
        feedDelayMinutes: 15,
        latencyMs: this.now() - started,
        change: 0,
        changePercent: 0,
      },
      started
    );
  }

  private finishQuote(quote: NormalizedLiveQuote, started: number): NormalizedLiveQuote {
    const change = Number((quote.price - quote.previousClose).toFixed(6));
    const changePercent = Number(((change / quote.previousClose) * 100).toFixed(6));
    const normalized = validateQuote({ ...quote, change, changePercent, latencyMs: this.now() - started });
    const ageMs = this.now() - normalized.timestamp;
    const maximumAgeMs =
      normalized.marketSession === 'CLOSED'
        ? 5 * 24 * 60 * 60 * 1000
        : normalized.feedDelayMinutes > 0
          ? (normalized.feedDelayMinutes + 30) * 60 * 1000
          : 10 * 60 * 1000;
    if (ageMs < -5 * 60 * 1000 || ageMs > maximumAgeMs) {
      throw new MarketDataProviderError(
        this.makeDiagnostic(quote.providerId, 'malformed_payload', true, this.now() - started),
        'Market data provider returned a stale or future-dated quote.'
      );
    }
    this.latestDiagnostics.delete(quote.providerId);
    return normalized;
  }

  private async request(
    provider: MarketDataProviderId,
    url: string,
    headers: Record<string, string>,
    started: number
  ): Promise<Response> {
    const cooldownUntil = this.cooldownUntil.get(provider) || 0;
    if (cooldownUntil > this.now()) {
      throw new MarketDataProviderError(this.makeDiagnostic(provider, 'rate_limit', true, 0), 'Market data provider is in cooldown.');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(url, { headers, signal: controller.signal });
    } catch (error) {
      const timedOut = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, timedOut ? 'timeout' : 'network', true, this.now() - started),
        timedOut ? 'Market data provider timed out.' : 'Market data provider network request failed.'
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const category: MarketDataErrorCategory =
        response.status === 401 || response.status === 403
          ? 'authorization'
          : response.status === 429
            ? 'rate_limit'
            : 'upstream';
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, category, true, this.now() - started, response.status),
        'Market data provider returned an unsuccessful status.'
      );
    }
    return response;
  }

  private async readJson(provider: MarketDataProviderId, response: Response, started: number): Promise<any> {
    try {
      return await response.json();
    } catch {
      throw new MarketDataProviderError(
        this.makeDiagnostic(provider, 'malformed_payload', true, this.now() - started, response.status),
        'Market data provider returned invalid JSON.'
      );
    }
  }

  private getMassiveApiKey(): string | null {
    const value = (this.env.MASSIVE_API_KEY || this.env.POLYGON_API_KEY || '').trim();
    if (value.length < 8) return null;
    const lower = value.toLowerCase();
    if (lower.includes('placeholder') || lower.includes('example') || lower.includes('api_key') || lower.startsWith('your_')) {
      return null;
    }
    return value;
  }

  private getMassiveFeedDelayMinutes(): number {
    const configured = Number(this.env.MASSIVE_FEED_DELAY_MINUTES);
    return Number.isFinite(configured) && configured >= 0 ? configured : 15;
  }

  private makeDiagnostic(
    provider: MarketDataProviderId,
    category: MarketDataErrorCategory,
    configured: boolean,
    latencyMs: number,
    httpStatus?: number
  ): MarketDataDiagnostic {
    return {
      provider,
      category,
      configured,
      ...(httpStatus === undefined ? {} : { httpStatus }),
      timeout: category === 'timeout',
      latencyMs: Math.max(0, Math.round(latencyMs)),
      timestamp: new Date(this.now()).toISOString(),
    };
  }

  private recordFailure(symbol: string, diagnostic: MarketDataDiagnostic) {
    this.latestDiagnostics.set(diagnostic.provider, diagnostic);
    if (diagnostic.category === 'rate_limit' || diagnostic.category === 'timeout' || diagnostic.category === 'authorization') {
      this.cooldownUntil.set(diagnostic.provider, this.now() + 60_000);
    }
    this.logger({ event: 'market_data_provider_failure', symbol, ...diagnostic });
  }
}

let singleton: LiveMarketDataService | null = null;

export function getLiveMarketDataService(): LiveMarketDataService {
  if (!singleton) singleton = new LiveMarketDataService();
  return singleton;
}

export function resetLiveMarketDataServiceForTests(): void {
  singleton = null;
}

export function setLiveMarketDataServiceForTests(service: LiveMarketDataService): void {
  singleton = service;
}

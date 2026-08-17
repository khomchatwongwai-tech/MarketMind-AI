export type AlpacaFailureCode = 'NOT_CONFIGURED' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'MALFORMED_RESPONSE';

export class AlpacaProviderError extends Error {
  constructor(public readonly code: AlpacaFailureCode, message: string) { super(message); }
}

export interface AlpacaStockQuote {
  symbol: string; price: number; bid: number; ask: number; bidSize: number; askSize: number;
  timestamp: number; provider: 'Alpaca IEX'; feed: 'iex'; isConsolidated: false;
}

export interface AlpacaBar {
  timestamp: number; open: number; high: number; low: number; close: number; volume: number; vwap?: number; tradeCount?: number;
}

type FetchLike = typeof fetch;

export class AlpacaMarketDataService {
  private readonly baseUrl: string;
  constructor(
    private readonly apiKey = process.env.ALPACA_API_KEY || '',
    private readonly apiSecret = process.env.ALPACA_API_SECRET || '',
    private readonly fetchFn: FetchLike = fetch,
    baseUrl = process.env.ALPACA_DATA_BASE_URL || 'https://data.alpaca.markets'
  ) { this.baseUrl = baseUrl.replace(/\/$/, ''); }

  isConfigured(): boolean { return this.apiKey.trim().length >= 8 && this.apiSecret.trim().length >= 8; }

  private async request(path: string): Promise<any> {
    if (!this.isConfigured()) throw new AlpacaProviderError('NOT_CONFIGURED', 'Alpaca market data is not configured.');
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, { headers: {
        'APCA-API-KEY-ID': this.apiKey, 'APCA-API-SECRET-KEY': this.apiSecret, Accept: 'application/json',
      } });
    } catch { throw new AlpacaProviderError('UNAVAILABLE', 'Alpaca market data is unavailable.'); }
    if (response.status === 401 || response.status === 403) throw new AlpacaProviderError('UNAUTHORIZED', 'Alpaca rejected the configured credentials or feed entitlement.');
    if (response.status === 429) throw new AlpacaProviderError('RATE_LIMITED', 'Alpaca rate limit reached.');
    if (!response.ok) throw new AlpacaProviderError('UNAVAILABLE', 'Alpaca market data is unavailable.');
    try { return await response.json(); }
    catch { throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Alpaca returned an invalid response.'); }
  }

  static parseSnapshot(symbol: string, snapshot: any): AlpacaStockQuote & { previousClose: number; open: number; high: number; low: number; volume: number } {
    const trade = snapshot?.latestTrade;
    const quote = snapshot?.latestQuote;
    const daily = snapshot?.dailyBar;
    const previous = snapshot?.prevDailyBar;
    const price = Number(trade?.p ?? daily?.c);
    const bid = Number(quote?.bp);
    const ask = Number(quote?.ap);
    if (![price, bid, ask].every((value) => Number.isFinite(value) && value > 0) || bid > ask * 1.05) {
      throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Alpaca quote response was incomplete.');
    }
    return { symbol, price, bid, ask, bidSize: Number(quote?.bs || 0), askSize: Number(quote?.as || 0),
      timestamp: Date.parse(trade?.t || quote?.t || new Date().toISOString()), provider: 'Alpaca IEX', feed: 'iex', isConsolidated: false,
      previousClose: Number(previous?.c || price), open: Number(daily?.o || price), high: Number(daily?.h || price),
      low: Number(daily?.l || price), volume: Number(daily?.v || 0) };
  }

  async getSnapshot(symbol: string) {
    const clean = symbol.toUpperCase().trim();
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(clean)) throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Invalid stock symbol.');
    return AlpacaMarketDataService.parseSnapshot(clean, await this.request(`/v2/stocks/${encodeURIComponent(clean)}/snapshot?feed=iex`));
  }

  async getLatestTrade(symbol: string): Promise<{ symbol: string; price: number; size: number; timestamp: number; provider: 'Alpaca IEX' }> {
    const clean = symbol.toUpperCase().trim();
    const data = await this.request(`/v2/stocks/${encodeURIComponent(clean)}/trades/latest?feed=iex`);
    const trade = data?.trade;
    if (!Number.isFinite(Number(trade?.p)) || Number(trade.p) <= 0) throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Alpaca trade response was incomplete.');
    return { symbol: clean, price: Number(trade.p), size: Number(trade.s || 0), timestamp: Date.parse(trade.t), provider: 'Alpaca IEX' };
  }

  async getLatestQuote(symbol: string): Promise<AlpacaStockQuote> {
    const clean = symbol.toUpperCase().trim();
    const data = await this.request(`/v2/stocks/${encodeURIComponent(clean)}/quotes/latest?feed=iex`);
    const quote = data?.quote;
    return AlpacaMarketDataService.parseSnapshot(clean, { latestTrade: { p: (Number(quote?.bp) + Number(quote?.ap)) / 2, t: quote?.t }, latestQuote: quote });
  }

  async getBars(symbol: string, timeframe = '5Min', limit = 500): Promise<AlpacaBar[]> {
    const clean = symbol.toUpperCase().trim();
    const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 500));
    const allowed = new Set(['1Min', '5Min', '15Min', '30Min', '1Hour', '1Day', '1Week']);
    if (!allowed.has(timeframe)) throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Unsupported Alpaca timeframe.');
    const start = new Date(Date.now() - (timeframe.includes('Day') || timeframe.includes('Week') ? 730 : 30) * 86400000).toISOString();
    const data = await this.request(`/v2/stocks/${encodeURIComponent(clean)}/bars?feed=iex&adjustment=raw&sort=asc&timeframe=${timeframe}&limit=${safeLimit}&start=${encodeURIComponent(start)}`);
    if (!Array.isArray(data?.bars)) throw new AlpacaProviderError('MALFORMED_RESPONSE', 'Alpaca bars response was incomplete.');
    return data.bars.map((bar: any) => ({ timestamp: Date.parse(bar.t), open: Number(bar.o), high: Number(bar.h), low: Number(bar.l),
      close: Number(bar.c), volume: Number(bar.v || 0), vwap: Number.isFinite(Number(bar.vw)) ? Number(bar.vw) : undefined,
      tradeCount: Number.isFinite(Number(bar.n)) ? Number(bar.n) : undefined })).filter((bar: AlpacaBar) =>
        Number.isFinite(bar.timestamp) && [bar.open, bar.high, bar.low, bar.close].every((value) => Number.isFinite(value) && value > 0));
  }
}

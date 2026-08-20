import { ChartCandle, ChartTimeframe } from '../../types/chart.js';

export class RealtimeCandleAggregator {
  private static instance: RealtimeCandleAggregator;

  // Key: symbol:resolution (e.g. "SPY:5m") -> ChartCandle
  private activeCandles: Map<string, ChartCandle> = new Map();

  public static getInstance(): RealtimeCandleAggregator {
    if (!RealtimeCandleAggregator.instance) {
      RealtimeCandleAggregator.instance = new RealtimeCandleAggregator();
    }
    return RealtimeCandleAggregator.instance;
  }

  /**
   * Convert resolution string (TradingView standard or MarketMind timeframe) into seconds.
   */
  public resolutionToSeconds(resolution: string | ChartTimeframe): number {
    const res = (resolution || '5m').toLowerCase().trim();
    switch (res) {
      case '1':
      case '1m':
        return 60;
      case '2':
      case '2m':
        return 120;
      case '3':
      case '3m':
        return 180;
      case '5':
      case '5m':
        return 300;
      case '15':
      case '15m':
        return 900;
      case '30':
      case '30m':
        return 1800;
      case '60':
      case '1h':
      case '60m':
        return 3600;
      case '120':
      case '2h':
        return 7200;
      case '240':
      case '4h':
        return 14400;
      case '1d':
      case 'd':
      case 'day':
        return 86400;
      case '1w':
      case 'w':
      case 'week':
        return 604800;
      case '1m_month':
      case 'm':
      case 'month':
        return 2592000;
      default: {
        const num = parseInt(res, 10);
        if (!isNaN(num) && num > 0) {
          return num * 60;
        }
        return 300; // default 5m
      }
    }
  }

  private getKey(symbol: string, resolution: string): string {
    return `${symbol.toUpperCase().trim()}:${resolution.toLowerCase().trim()}`;
  }

  /**
   * Seed the aggregator with the latest historical candle.
   */
  public seedLastCandle(symbol: string, resolution: string, candle: ChartCandle): void {
    if (!symbol || !candle) return;
    const key = this.getKey(symbol, resolution);
    this.activeCandles.set(key, { ...candle });
  }

  /**
   * Process an incoming verified trade or quote and return the updated/new candle.
   */
  public processTick(
    symbol: string,
    resolution: string,
    tick: { price: number; size?: number; timestamp: number; session?: 'PRE' | 'REGULAR' | 'POST' }
  ): { candle: ChartCandle; isNew: boolean } | null {
    if (!symbol || !tick || isNaN(tick.price) || tick.price <= 0) return null;

    const key = this.getKey(symbol, resolution);
    const intervalSec = this.resolutionToSeconds(resolution);

    // Normalize timestamp to seconds
    const tickTimeSec = tick.timestamp > 1000000000000 ? Math.floor(tick.timestamp / 1000) : tick.timestamp;
    const barIntervalTimestamp = Math.floor(tickTimeSec / intervalSec) * intervalSec;

    const existing = this.activeCandles.get(key);
    const tradeVolume = tick.size && tick.size > 0 ? tick.size : 0;

    if (!existing) {
      // First candle for this key
      const newCandle: ChartCandle = {
        time: barIntervalTimestamp,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tradeVolume,
        session: tick.session || 'REGULAR',
      };
      this.activeCandles.set(key, newCandle);
      return { candle: { ...newCandle }, isNew: true };
    }

    if (barIntervalTimestamp === existing.time) {
      // Same interval: update current candle in-place
      existing.high = Math.max(existing.high, tick.price);
      existing.low = Math.min(existing.low, tick.price);
      existing.close = tick.price;
      existing.volume += tradeVolume;
      if (tick.session) {
        existing.session = tick.session;
      }
      return { candle: { ...existing }, isNew: false };
    }

    if (barIntervalTimestamp > existing.time) {
      // New interval started: start new candle
      const newCandle: ChartCandle = {
        time: barIntervalTimestamp,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tradeVolume,
        session: tick.session || 'REGULAR',
      };
      this.activeCandles.set(key, newCandle);
      return { candle: { ...newCandle }, isNew: true };
    }

    // Tick timestamp is older than current active candle (late tick)
    existing.high = Math.max(existing.high, tick.price);
    existing.low = Math.min(existing.low, tick.price);
    existing.volume += tradeVolume;
    return { candle: { ...existing }, isNew: false };
  }

  public getActiveCandle(symbol: string, resolution: string): ChartCandle | null {
    const key = this.getKey(symbol, resolution);
    const c = this.activeCandles.get(key);
    return c ? { ...c } : null;
  }

  public clear(symbol?: string, resolution?: string): void {
    if (symbol && resolution) {
      this.activeCandles.delete(this.getKey(symbol, resolution));
    } else if (symbol) {
      const prefix = `${symbol.toUpperCase().trim()}:`;
      for (const k of this.activeCandles.keys()) {
        if (k.startsWith(prefix)) {
          this.activeCandles.delete(k);
        }
      }
    } else {
      this.activeCandles.clear();
    }
  }
}

import {
  ChartCandle,
  ChartLevels,
  ChartTimeframe,
  AIChartAnalysisResult,
} from '../types/chart';

export interface CandleResponse {
  source: string;
  status: 'SUCCESS' | 'FALLBACK_CANDLES' | 'ERROR';
  ticker: string;
  name: string;
  timeframe: string;
  currency: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  pmHigh?: number;
  pmLow?: number;
  orHigh?: number;
  orLow?: number;
  levels: ChartLevels;
  candles: ChartCandle[];
  lastSyncTime: string;
}

/**
 * Fetch multi-timeframe candlestick data from the server API
 */
export async function fetchCandles(
  ticker: string,
  timeframe: ChartTimeframe = '5m',
  extended: boolean = true
): Promise<CandleResponse> {
  const url = `/api/market/candles/${encodeURIComponent(ticker)}?timeframe=${timeframe}&extended=${extended}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Candle API returned status ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn(`[fetchCandles] error for ${ticker}:`, err.message);
    throw err;
  }
}

/**
 * Send structured chart information to AI Chart Analyst
 */
export async function requestAIChartAnalysis(payload: {
  ticker: string;
  timeframe: string;
  currentPrice: number;
  vwap: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macd: number;
  volume: number;
  relativeVolume: number;
  supportLevels: string[];
  resistanceLevels: string[];
  trend: string;
  marketStructure: string;
  candles: ChartCandle[];
}): Promise<AIChartAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI analysis error');
    return await res.json();
  } catch (err) {
    console.error('requestAIChartAnalysis error:', err);
    throw new Error('AI chart analysis unavailable; no synthetic analysis was generated.');
  }
}

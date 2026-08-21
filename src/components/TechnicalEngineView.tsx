import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LineChart, Sliders, Layers, Activity, ChevronDown, ChevronUp, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService.js';
import { isFiniteMarketNumber, formatPrice } from '../utils/formatters.js';
import { fetchCandles } from '../services/candleDataService.js';
import { ChartCandle } from '../types/chart.js';
import {
  calculateFullTechnicalEngine,
  FullTechnicalEngineResults,
  IndicatorResult,
} from '../utils/technicalEngineCalculator.js';

interface TechnicalEngineViewProps {
  data: ComprehensiveMarketData;
}

export const TechnicalEngineView: React.FC<TechnicalEngineViewProps> = ({ data }) => {
  const { t } = useI18n();
  const { quote, supportResistance } = data;
  const ticker = quote.ticker || 'SPY';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D'>('15M');
  const [overlayVwap, setOverlayVwap] = useState(true);
  const [overlaySR, setOverlaySR] = useState(true);

  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [dailyCandles, setDailyCandles] = useState<ChartCandle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [providerSource, setProviderSource] = useState<string>('Alpaca IEX');
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  // Fetch candle data whenever symbol or selectedTimeframe changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const tfMap: Record<string, '1m' | '5m' | '15m' | '1h' | '1d'> = {
      '1M': '1m',
      '5M': '5m',
      '15M': '15m',
      '1H': '1h',
      '1D': '1d',
    };

    const tf = tfMap[selectedTimeframe] || '15m';

    // Fetch intraday candles + daily candles for long period indicators
    Promise.all([
      fetchCandles(ticker, tf, true).catch(() => null),
      fetchCandles(ticker, '1d', true).catch(() => null),
    ])
      .then(([tfRes, dailyRes]) => {
        if (!isMounted) return;
        if (tfRes && tfRes.candles) {
          setCandles(tfRes.candles);
          if (tfRes.source) setProviderSource(tfRes.source);
        }
        if (dailyRes && dailyRes.candles) {
          setDailyCandles(dailyRes.candles);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticker, selectedTimeframe]);

  // Calculate Technical Indicators dynamically from fetched candles
  const calc: FullTechnicalEngineResults = calculateFullTechnicalEngine(
    ticker,
    candles,
    dailyCandles,
    selectedTimeframe,
    providerSource
  );

  // Render High-Density Financial Candlestick Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#22262d';
    ctx.lineWidth = 1;
    for (let x = 40; x < width - 60; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    for (let y = 20; y < height - 30; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
    }

    const renderCandles = candles.length > 0 ? candles.slice(-32) : [];
    if (renderCandles.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px monospace';
      ctx.fillText('Awaiting Validated Candle History...', width / 2 - 110, height / 2);
      return;
    }

    const candleCount = renderCandles.length;
    const minPrice = Math.min(...renderCandles.map((c) => c.low)) * 0.998;
    const maxPrice = Math.max(...renderCandles.map((c) => c.high)) * 1.002;
    const priceRange = maxPrice - minPrice || 1;
    const candleWidth = Math.floor((width - 70) / candleCount);

    const getY = (val: number) => height - 40 - ((val - minPrice) / priceRange) * (height - 80);

    // Draw Candles & Volume
    renderCandles.forEach((c, idx) => {
      const x = idx * candleWidth + 10;
      const isUp = c.close >= c.open;

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      // Volume bar at bottom
      const vol = Number(c.volume) || 50;
      const volHeight = Math.min(35, (vol / 500) * 35);
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.fillRect(x, height - 30 - volHeight, candleWidth - 3, volHeight);

      // Wick
      ctx.strokeStyle = isUp ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + (candleWidth - 3) / 2, yHigh);
      ctx.lineTo(x + (candleWidth - 3) / 2, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? '#10b981' : '#f43f5e';
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillRect(x, bodyTop, candleWidth - 3, bodyHeight);
    });

    // Overlay VWAP Line
    if (overlayVwap && calc.vwap.value !== null) {
      const vwapY = getY(calc.vwap.value);
      ctx.strokeStyle = '#818cf8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, vwapY);
      ctx.lineTo(width - 60, vwapY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#818cf8';
      ctx.font = '9px monospace';
      ctx.fillText(`VWAP $${calc.vwap.value.toFixed(2)}`, width - 58, vwapY + 3);
    }

    // Overlay Support / Resistance Lines
    if (overlaySR && isFiniteMarketNumber(supportResistance.r1)) {
      const r1Y = getY(supportResistance.r1);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, r1Y);
      ctx.lineTo(width - 60, r1Y);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`R1 $${supportResistance.r1.toFixed(2)}`, width - 58, r1Y + 3);
    }

    if (overlaySR && isFiniteMarketNumber(supportResistance.s1)) {
      const s1Y = getY(supportResistance.s1);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, s1Y);
      ctx.lineTo(width - 60, s1Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`S1 $${supportResistance.s1.toFixed(2)}`, width - 58, s1Y + 3);
    }

    // Current Price Banner
    const lastPrice = renderCandles[renderCandles.length - 1].close;
    const currentY = getY(lastPrice);
    ctx.fillStyle = (quote.change ?? 0) >= 0 ? '#10b981' : '#f43f5e';
    ctx.fillRect(width - 60, currentY - 8, 58, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`$${lastPrice.toFixed(2)}`, width - 56, currentY + 3);
  }, [candles, calc, overlayVwap, overlaySR, quote]);

  const renderVal = <T,>(
    res: IndicatorResult<T>,
    formatter: (val: T) => string,
    fallbackText = 'Unavailable'
  ) => {
    const meta = res.metadata;
    if (res.value === null || res.value === undefined) {
      return (
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-mono font-bold uppercase">
              {meta.validationStatus}
            </span>
            <span className="font-mono font-bold text-amber-400 text-xs">{fallbackText}</span>
          </div>
          {(meta.unavailableReason || meta.diagnosticReason) && (
            <span className="text-[9px] text-[#9CA3AF] font-mono mt-0.5">
              Reason: {meta.unavailableReason || meta.diagnosticReason}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end text-right">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono font-bold uppercase">
            {meta.validationStatus === 'LIVE' ? 'LIVE' : 'VALID'}
          </span>
          <span className="font-mono font-bold text-white text-xs">{formatter(res.value)}</span>
        </div>
        <span className="text-[9px] text-[#6B7280] font-mono mt-0.5">
          {meta.source} &bull; Bars: {meta.barsUsed}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Chart Box with Overlays & Timeframe Selector */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 shadow-sm">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {ticker} {t('technicalEngine.quantChart')}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              VWAP: {calc.vwap.value !== null ? `$${calc.vwap.value.toFixed(2)}` : 'N/A'} &bull; RSI:{' '}
              {calc.rsi14.value !== null ? calc.rsi14.value : 'N/A'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {isLoading && (
              <span className="text-[11px] text-[#D4AF37] flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> {t('technicalEngine.fetchingBars')}
              </span>
            )}

            {/* Timeframe Selector Buttons */}
            <div className="flex bg-[#1c1f24] rounded p-0.5 border border-[#2d3139]">
              {(['1M', '5M', '15M', '1H', '1D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] uppercase transition cursor-pointer ${
                    selectedTimeframe === tf
                      ? 'bg-[#6366f1] text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Chart Area */}
        <div className="mt-3 relative h-[320px] w-full bg-[#0d0e11] rounded border border-[#22262d] overflow-hidden">
          <canvas ref={canvasRef} width={800} height={320} className="w-full h-full block" />
        </div>
      </div>

      {/* Diagnostics & Provenance Header Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-2.5 font-mono text-xs flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Info className="w-3.5 h-3.5 text-[#818cf8]" />
          <span>{t('technicalEngine.provider')} <strong className="text-white">{providerSource}</strong></span>
          <span>&bull; {t('technicalEngine.timeframe')} <strong className="text-white">{selectedTimeframe}</strong></span>
          <span>&bull; {t('technicalEngine.barsEvaluated')} <strong className="text-white">{calc.barsUsed}</strong></span>
        </div>

        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="text-[11px] text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showMetadata ? t('technicalEngine.hideDiagnostics') : t('technicalEngine.viewDiagnostics')}</span>
          {showMetadata ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showMetadata && (
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 font-mono text-xs space-y-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {t('technicalEngine.diagnosticsTitle')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">VWAP Status</span>
              <span className="text-white">{calc.vwap.metadata.validationStatus} ({calc.vwap.metadata.barsUsed} bars)</span>
            </div>
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">9 EMA Status</span>
              <span className="text-white">{calc.ema9.metadata.validationStatus} ({calc.ema9.metadata.barsUsed} bars)</span>
            </div>
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">RSI(14) Status</span>
              <span className="text-white">{calc.rsi14.metadata.validationStatus} ({calc.rsi14.metadata.barsUsed} bars)</span>
            </div>
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">MACD Status</span>
              <span className="text-white">{calc.macd.metadata.validationStatus} ({calc.macd.metadata.barsUsed} bars)</span>
            </div>
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">ADX(14) Status</span>
              <span className="text-white">{calc.adx14.metadata.validationStatus} ({calc.adx14.metadata.barsUsed} bars)</span>
            </div>
            <div className="p-2 bg-[#0d0e11] rounded border border-[#22262d]">
              <span className="text-slate-400 block font-bold">52-Wk Range Status</span>
              <span className="text-white">{calc.fiftyTwoWeekRange.metadata.validationStatus} ({calc.fiftyTwoWeekRange.metadata.barsUsed} bars)</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Indicators Breakdown Grid (3 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* 1. Moving Averages Stack */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#6366f1]" />
            {t('technicalEngine.movingAveragesArray')}
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">9 EMA (Short-Term Momentum)</span>
              {renderVal(calc.ema9, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">20 EMA (Intraday Mean)</span>
              {renderVal(calc.ema20, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">50 EMA (Intermediate Trend)</span>
              {renderVal(calc.ema50, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">100 EMA (Multi-Week Baseline)</span>
              {renderVal(calc.ema100, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">200 EMA (Major Institutional)</span>
              {renderVal(calc.ema200, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">SMA 20 / SMA 50</span>
              <div className="font-mono font-bold text-slate-300">
                {calc.sma20.value !== null ? `$${calc.sma20.value.toFixed(2)}` : 'N/A'} /{' '}
                {calc.sma50.value !== null ? `$${calc.sma50.value.toFixed(2)}` : 'N/A'}
              </div>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">SMA 200 (Golden Cross Anchor)</span>
              {renderVal(calc.sma200, (v) => `$${v.toFixed(2)}`)}
            </div>
          </div>
        </div>

        {/* 2. Momentum, MACD & Oscillators */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-[#6366f1]" />
            {t('technicalEngine.oscillatorsMomentum')}
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">VWAP (Session Volume Weighted)</span>
              {renderVal(calc.vwap, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">RSI (14)</span>
              {renderVal(calc.rsi14, (v) => `${v}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">MACD Line / Signal</span>
              {renderVal(
                calc.macd,
                (v) => `${v.line.toFixed(2)} / ${v.signal.toFixed(2)}`
              )}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">MACD Histogram</span>
              {renderVal(
                calc.macd,
                (v) => `${v.histogram >= 0 ? '+' : ''}${v.histogram.toFixed(2)}`
              )}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">ADX 14 (Trend Strength)</span>
              {renderVal(calc.adx14, (v) => `${v}`)}
            </div>
          </div>
        </div>

        {/* 3. Volatility & Ranges */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#6366f1]" />
            {t('technicalEngine.volatilitySessionRanges')}
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Average True Range (ATR 14)</span>
              {renderVal(calc.atr14, (v) => `$${v.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Upper Band (20, 2)</span>
              {renderVal(calc.bollingerBands, (v) => `$${v.upper.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Middle (20 SMA)</span>
              {renderVal(calc.bollingerBands, (v) => `$${v.middle.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Lower Band</span>
              {renderVal(calc.bollingerBands, (v) => `$${v.lower.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Opening Range (High / Low)</span>
              {renderVal(calc.openingRange, (v) => `$${v.high.toFixed(2)} / $${v.low.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">52-Week Range (Low / High)</span>
              {renderVal(calc.fiftyTwoWeekRange, (v) => `$${v.low.toFixed(2)} - $${v.high.toFixed(2)}`)}
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Pre-Market (High / Low)</span>
              {renderVal(calc.preMarketRange, (v) => `$${v.high.toFixed(2)} / $${v.low.toFixed(2)}`)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

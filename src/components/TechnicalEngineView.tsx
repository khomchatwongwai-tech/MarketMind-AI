import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Zap, Sliders, CheckCircle2, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { TradingViewChart } from './TradingViewChart';

interface TechnicalEngineViewProps {
  data: ComprehensiveMarketData;
}

export const TechnicalEngineView: React.FC<TechnicalEngineViewProps> = ({ data }) => {
  const { quote, technicals, supportResistance } = data;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartMode, setChartMode] = useState<'canvas' | 'tradingview'>('tradingview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D'>('15M');
  const [overlayVwap, setOverlayVwap] = useState(true);
  const [overlayEma, setOverlayEma] = useState(true);
  const [overlayBollinger, setOverlayBollinger] = useState(true);
  const [overlaySR, setOverlaySR] = useState(true);

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

    // The local canvas never fabricates candles. Verified candles are rendered by
    // the provider-backed TradingView chart until a server candle series is supplied.
    const candleCount = 32;
    const high = quote.dayHigh;
    const low = quote.dayLow;

    const minPrice = low * 0.998;
    const maxPrice = high * 1.002;
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = Math.floor((width - 70) / candleCount);

    const candles: { open: number; high: number; low: number; close: number; vol: number }[] = [];

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Verified candle series unavailable — use Provider Chart', width / 2, height / 2);
    ctx.textAlign = 'start';

    // Draw Candles & Volume
    candles.forEach((c, idx) => {
      const x = idx * candleWidth + 10;
      const isUp = c.close >= c.open;

      // Price to Y coordinate
      const getY = (val: number) => height - 40 - ((val - minPrice) / priceRange) * (height - 80);

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      // Volume bar at bottom
      const volHeight = (c.vol / 150) * 35;
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

    const getY = (val: number) => height - 40 - ((val - minPrice) / priceRange) * (height - 80);

    // Overlay VWAP (Dashed Purple)
    if (overlayVwap) {
      const vwapY = getY(technicals.vwap);
      ctx.strokeStyle = '#818cf8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, vwapY);
      ctx.lineTo(width - 60, vwapY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#818cf8';
      ctx.font = '9px monospace';
      ctx.fillText(`VWAP $${technicals.vwap.toFixed(2)}`, width - 58, vwapY + 3);
    }

    // Overlay S/R Lines (R1 / S1)
    if (overlaySR) {
      const r1Y = getY(supportResistance.r1);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, r1Y);
      ctx.lineTo(width - 60, r1Y);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`R1 $${supportResistance.r1.toFixed(2)}`, width - 58, r1Y + 3);

      const s1Y = getY(supportResistance.s1);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, s1Y);
      ctx.lineTo(width - 60, s1Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`S1 $${supportResistance.s1.toFixed(2)}`, width - 58, s1Y + 3);
    }

    // Current Price Banner on Price Axis
    const currentY = getY(quote.price);
    ctx.fillStyle = quote.change >= 0 ? '#10b981' : '#f43f5e';
    ctx.fillRect(width - 60, currentY - 8, 58, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`$${quote.price.toFixed(2)}`, width - 56, currentY + 3);
  }, [quote.price, quote.dayHigh, quote.dayLow, technicals, supportResistance, overlayVwap, overlayEma, overlayBollinger, overlaySR, selectedTimeframe]);

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Chart Box with Overlays & Timeframe Selector */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 shadow-sm">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {quote.ticker} High-Resolution Quant Chart
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              VWAP: ${technicals.vwap.toFixed(2)} &bull; RSI: {technicals.rsi14}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Engine Switcher */}
            <div className="flex bg-[#1c1f24] rounded p-0.5 border border-[#2d3139]">
              <button
                onClick={() => setChartMode('canvas')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                  chartMode === 'canvas'
                    ? 'bg-[#6366f1] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Quant Canvas
              </button>
              <button
                onClick={() => setChartMode('tradingview')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                  chartMode === 'tradingview'
                    ? 'bg-[#10b981] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TradingView
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="flex bg-[#1c1f24] rounded p-0.5 border border-[#2d3139]">
              {(['1M', '5M', '15M', '1H', '1D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                    selectedTimeframe === tf
                      ? 'bg-[#6366f1] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Overlays (for canvas mode) */}
            {chartMode === 'canvas' && (
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  onClick={() => setOverlayVwap(!overlayVwap)}
                  className={`px-2 py-0.5 rounded border transition font-mono ${
                    overlayVwap
                      ? 'bg-[#818cf8]/20 border-[#818cf8] text-[#a5b4fc]'
                      : 'bg-[#1c1f24] border-[#2d3139] text-slate-500'
                  }`}
                >
                  VWAP
                </button>
                <button
                  onClick={() => setOverlaySR(!overlaySR)}
                  className={`px-2 py-0.5 rounded border transition font-mono ${
                    overlaySR
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#1c1f24] border-[#2d3139] text-slate-500'
                  }`}
                >
                  S/R Levels
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart Canvas or TradingView Advanced Chart */}
        <div className="mt-2 w-full overflow-hidden rounded-xl border border-[#22262d] bg-[#0A0A0A]">
          {chartMode === 'tradingview' ? (
            <TradingViewChart
              symbol={quote.ticker}
              interval={selectedTimeframe}
              theme="dark"
              allowSymbolChange={true}
              hideSideToolbar={false}
              hideTopToolbar={false}
              saveImage={true}
              className="border-0 rounded-none"
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <canvas
                ref={canvasRef}
                width={960}
                height={260}
                className="w-full h-[260px] bg-[#0f1013]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Grid of Indicator Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* 1. Moving Averages Engine */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#6366f1]" />
            Moving Averages Array
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">9 EMA (Short-Term Momentum)</span>
              <span className="font-mono font-bold text-white">${technicals.ema9.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">20 EMA (Intraday Mean)</span>
              <span className="font-mono font-bold text-white">${technicals.ema20.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">50 EMA (Intermediate Trend)</span>
              <span className="font-mono font-bold text-white">${technicals.ema50.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">100 EMA (Multi-Week Baseline)</span>
              <span className="font-mono font-bold text-white">${technicals.ema100.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">200 EMA (Major Institutional)</span>
              <span className="font-mono font-bold text-emerald-400">${technicals.ema200.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">SMA 20 / SMA 50</span>
              <span className="font-mono font-bold text-slate-300">
                ${technicals.sma20.toFixed(2)} / ${technicals.sma50.toFixed(2)}
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">SMA 200 (Golden Cross Anchor)</span>
              <span className="font-mono font-bold text-emerald-400">${technicals.sma200.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 2. Momentum, MACD & Oscillators */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-[#6366f1]" />
            Oscillators & Momentum
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">RSI (14-Period)</span>
              <span className="font-mono font-bold text-emerald-400">
                {technicals.rsi14} ({technicals.rsiStatus})
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">MACD (12, 26, 9)</span>
              <span className="font-mono font-bold text-emerald-400">
                +{technicals.macd} (Signal: {technicals.macdSignal})
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">MACD Trend</span>
              <span className="font-bold text-emerald-400">{technicals.macdTrend}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Stochastic RSI (%K / %D)</span>
              <span className="font-mono font-bold text-slate-300">
                {technicals.stochRsiK} / {technicals.stochRsiD}
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">ADX Trend Strength</span>
              <span className="font-mono font-bold text-amber-400">
                {technicals.adx} ({technicals.adxStrength})
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Rate of Change (ROC)</span>
              <span className="font-mono font-bold text-emerald-400">+{technicals.rateOfChange}%</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Momentum Value</span>
              <span className="font-mono font-bold text-white">+{technicals.momentum}</span>
            </div>
          </div>
        </div>

        {/* 3. Volatility, Bollinger Bands & Ranges */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#6366f1]" />
            Volatility & Session Ranges
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Average True Range (ATR 14)</span>
              <span className="font-mono font-bold text-white">${technicals.atr14.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Upper Band (20, 2)</span>
              <span className="font-mono font-bold text-rose-400">${technicals.bollingerUpper.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Middle (20 SMA)</span>
              <span className="font-mono font-bold text-slate-300">${technicals.bollingerMiddle.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bollinger Lower Band</span>
              <span className="font-mono font-bold text-emerald-400">${technicals.bollingerLower.toFixed(2)}</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Opening Range (High / Low)</span>
              <span className="font-mono font-bold text-slate-200">
                ${technicals.openingRangeHigh.toFixed(2)} / ${technicals.openingRangeLow.toFixed(2)}
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">52-Week Range (Low / High)</span>
              <span className="font-mono font-bold text-slate-200">
                ${quote.fiftyTwoWeekLow.toFixed(2)} - ${quote.fiftyTwoWeekHigh.toFixed(2)}
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Pre-Market (High / Low)</span>
              <span className="font-mono font-bold text-slate-200">
                ${technicals.preMarketHigh.toFixed(2)} / ${technicals.preMarketLow.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

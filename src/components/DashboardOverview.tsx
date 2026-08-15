import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Radio,
  Clock,
  ArrowRight,
  Flame,
  BarChart2,
  Sparkles,
  BotMessageSquare,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { Probabilities, TickerSymbol } from '../types/market';
import { RealTimeStockChart } from './RealTimeStockChart';
import { MassiveLiveFeedBar } from './MassiveLiveFeedBar';
import { MarketMindSummaryCard } from './MarketMindSummaryCard';
import { useMassiveWebSocket } from '../hooks/useMassiveWebSocket';

interface DashboardOverviewProps {
  data: ComprehensiveMarketData;
  probabilities: Probabilities;
  onNavigateTab: (tab: any) => void;
  onAskQuestion: (q: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  probabilities,
  onNavigateTab,
  onAskQuestion,
}) => {
  const { quote, technicals, supportResistance, trends, sectors, economicEvents, news, options, scenarios } = data;
  const isPositive = quote.change >= 0;

  // Massive WebSocket Pipeline Hook
  const {
    status: wsStatus,
    signals: wsSignals,
    aiInsight: wsAiInsight,
    liveTrade: wsLiveTrade,
    requestAiInsight,
  } = useMassiveWebSocket(quote.ticker);

  // Risk meter position percentage
  let riskPercent = 45;
  if (probabilities.riskLevel === 'LOW RISK') riskPercent = 25;
  else if (probabilities.riskLevel === 'HIGH RISK') riskPercent = 75;
  else if (probabilities.riskLevel === 'EXTREME RISK') riskPercent = 92;

  const [viewMode, setViewMode] = useState<'both' | 'executive' | 'grid'>('both');

  return (
    <div className="flex flex-col gap-2.5 flex-1 select-none text-[#e2e8f0]">
      {/* 0. MASSIVE WEBSOCKET LIVE PIPELINE BAR */}
      <MassiveLiveFeedBar
        status={wsStatus}
        ticker={quote.ticker}
        signals={wsSignals}
        aiInsight={wsAiInsight}
        liveTrade={wsLiveTrade}
        onRequestAiInsight={requestAiInsight}
      />

      {/* 1. PROFESSIONAL REAL-TIME INTERACTIVE CANDLESTICK CHART */}
      <RealTimeStockChart ticker={quote.ticker} isLiveSimulation={true} />

      {/* View Switcher Controls */}
      <div className="flex justify-between items-center bg-[#15171a] px-3 py-1.5 rounded-lg border border-[#2d3139] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
            Terminal View Mode:
          </span>
          <div className="flex items-center bg-[#1c1f24] p-0.5 rounded border border-[#2d3139] text-[10px] font-semibold">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                viewMode === 'both' ? 'bg-[#6366f1] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Unified Overview
            </button>
            <button
              onClick={() => setViewMode('executive')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                viewMode === 'executive' ? 'bg-[#6366f1] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              MarketMind AI Card
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-[#6366f1] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              Multi-Factor Grid
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
          Market Status: <span className="text-emerald-400 font-bold">REGULAR LIVE</span> &bull; Gemini 3.7 Flash Active
        </div>
      </div>

      {/* EXECUTIVE SUMMARY CARD (When viewMode is 'both' or 'executive') */}
      {(viewMode === 'both' || viewMode === 'executive') && (
        <MarketMindSummaryCard
          data={data}
          probabilities={probabilities}
          onAskQuestion={onAskQuestion}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 2. THREE-COLUMN MARKET ENGINE & QUANT DASHBOARD GRID (When viewMode is 'both' or 'grid') */}
      {(viewMode === 'both' || viewMode === 'grid') && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        {/* LEFT COLUMN: Technical Engine, S/R, Multi-Timeframe Trends (Col span 3) */}
        <section className="md:col-span-3 flex flex-col gap-2.5">
        {/* Technical Engine Card */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg flex-1 flex flex-col overflow-hidden shadow-sm">
          <div className="p-2 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#6366f1]" />
              Technical Engine
            </span>
            <button
              onClick={() => onNavigateTab('technicals')}
              className="text-[#818cf8] hover:underline normal-case text-[9px] font-medium"
            >
              Details &rarr;
            </button>
          </div>

          <div className="p-3 grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">RSI (14)</span>
              <span
                className={`text-xs font-mono font-bold ${
                  technicals.rsi14 > 70
                    ? 'text-rose-400'
                    : technicals.rsi14 < 30
                    ? 'text-emerald-400'
                    : 'text-emerald-400'
                }`}
              >
                {technicals.rsi14} <span className="text-[9px] font-normal text-slate-400">({technicals.rsiStatus})</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">VWAP</span>
              <span className="text-xs font-mono font-bold text-white">${technicals.vwap.toFixed(2)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">9 EMA</span>
              <span className="text-xs font-mono font-bold text-white">${technicals.ema9.toFixed(2)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">20 EMA</span>
              <span className="text-xs font-mono font-bold text-white">${technicals.ema20.toFixed(2)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">MACD (12,26,9)</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{technicals.macd} <span className="text-[9px] font-normal text-slate-400">Bull</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">ADX (14)</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {technicals.adx} <span className="text-[9px] font-normal text-slate-400">{technicals.adxStrength}</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">ATR (14)</span>
              <span className="text-xs font-mono font-bold text-white">${technicals.atr14.toFixed(2)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Rel Volume</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{quote.relativeVolume}x</span>
            </div>
          </div>

          {/* Support & Resistance Mini Ladder */}
          <div className="p-3 border-t border-[#2d3139] space-y-2 bg-[#121316]">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Support & Resistance</span>
              <span className="text-[8px] text-emerald-400 font-mono">Pivot: ${((technicals.prevDayHigh + technicals.prevDayLow + technicals.prevDayClose)/3).toFixed(2)}</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-400 opacity-60">
                <span className="text-rose-400">R3 Target</span>
                <span>${supportResistance.r3.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 opacity-80">
                <span className="text-rose-400">R2 Area</span>
                <span>${supportResistance.r2.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-bold px-2 py-0.5 bg-rose-900/20 border border-rose-900/40 rounded text-rose-300">
                <span className="text-rose-400 flex items-center gap-1">
                  R1 Key Level
                </span>
                <span>${supportResistance.r1.toFixed(2)}</span>
              </div>

              {/* Current Price Line Indicator */}
              <div className="py-0.5 flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent" />
                <span className="text-[10px] font-bold text-white bg-[#6366f1]/30 px-2 py-0.2 rounded border border-[#6366f1]/60">
                  Current ${quote.price.toFixed(2)}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent" />
              </div>

              <div className="flex justify-between items-center font-bold px-2 py-0.5 bg-emerald-900/20 border border-emerald-900/40 rounded text-emerald-300">
                <span className="text-emerald-400">S1 Key Level</span>
                <span>${supportResistance.s1.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 opacity-80">
                <span className="text-emerald-400">S2 Area</span>
                <span>${supportResistance.s2.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 opacity-60">
                <span className="text-emerald-400">S3 Major</span>
                <span>${supportResistance.s3.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Timeframe Trend Alignment Engine */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-2.5">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            <span>Trend Alignment</span>
            <span className="text-emerald-400 font-mono font-bold">
              {data.trendAlignmentScore}% Bullish
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
            {trends.map((t) => (
              <div key={t.timeframe} className="flex flex-col items-center bg-[#1c1f24] p-1 rounded border border-[#2d3139]/80">
                <span className="text-[9px] text-slate-500 font-semibold">{t.timeframe}</span>
                <span
                  className={`text-[10px] font-bold ${
                    t.trend === 'BULLISH'
                      ? 'text-emerald-400'
                      : t.trend === 'BEARISH'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {t.trend === 'BULLISH' ? 'Bull' : t.trend === 'BEARISH' ? 'Bear' : 'Neut'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MIDDLE COLUMN: AI Market Summary, Setup Quality, Drivers, Options & Risk (Col span 6) */}
      <section className="md:col-span-6 flex flex-col gap-2.5">
        {/* Main "Why is SPY Moving?" AI Section */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#818cf8] animate-pulse" />
                  Why is {quote.ticker} moving?
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onAskQuestion(`Analyze ${quote.ticker} right now`);
                    onNavigateTab('chat');
                  }}
                  className="px-2 py-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-sm transition"
                  title="Ask Gemini for a complete institutional analysis"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>Ask Gemini to Analyze</span>
                </button>
                <button
                  onClick={() => {
                    onAskQuestion(`Why is ${quote.ticker} moving today?`);
                    onNavigateTab('chat');
                  }}
                  className="px-2 py-1 bg-[#1c1f24] hover:bg-[#252830] border border-[#6366f1]/40 text-[#a5b4fc] hover:text-white text-[10px] font-bold rounded flex items-center gap-1 transition"
                  title="Ask Gemini why this asset is moving"
                >
                  <BotMessageSquare className="w-2.5 h-2.5 text-[#818cf8]" />
                  <span>Ask Assistant</span>
                </button>
              </div>
            </div>

            {/* AI Explanation Narrative Box */}
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed italic border-l-2 border-[#6366f1] pl-3.5 py-1 mb-3 bg-[#1c1f24]/50 rounded-r">
              &ldquo;{quote.ticker} is currently showing {isPositive ? 'solid bullish momentum' : 'distribution pressure'}. Price is trading {quote.price >= technicals.vwap ? 'above VWAP' : 'below VWAP'} and short-term exponential averages while technology (XLK) and large-cap growth lead. Treasury yields have stabilized, expanding equity multiples. However, overhead resistance near ${supportResistance.r1.toFixed(2)} requires volume expansion (&gt;1.25x) for full continuation.&rdquo;
            </p>

            {/* Drivers & Setup Quality Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="space-y-1.5">
                <div className="p-2 rounded bg-[#1c1f24] border border-[#2d3139]">
                  <div className="text-[9px] uppercase font-bold text-[#6366f1] mb-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Primary Driver
                  </div>
                  <div className="text-xs font-semibold text-white">{probabilities.primaryDriver}</div>
                </div>
                <div className="p-2 rounded bg-[#1c1f24] border border-[#2d3139]">
                  <div className="text-[9px] uppercase font-bold text-rose-400 mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Main Risk
                  </div>
                  <div className="text-xs font-semibold text-slate-300">{probabilities.mainRisk}</div>
                </div>
              </div>

              {/* Setup Quality Metric */}
              <div className="bg-[#1c1f24] border border-[#2d3139] rounded p-2.5 flex flex-col justify-center items-center text-center">
                <div className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                  Market Setup Quality
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">{probabilities.setupScore}</span>
                  <span className="text-xs text-slate-500 font-mono">/100</span>
                </div>
                <div
                  className={`mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    probabilities.setupScore >= 75
                      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                      : probabilities.setupScore >= 60
                      ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      : 'text-rose-400 bg-rose-400/10 border-rose-400/30'
                  }`}
                >
                  {probabilities.setupQuality}
                </div>
              </div>
            </div>
          </div>

          {/* Bullish Confirmation & Bearish Invalidation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div className="p-2 border border-[#10b981]/30 bg-[#10b981]/5 rounded">
              <div className="text-[10px] font-bold text-[#10b981] uppercase mb-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Bullish Confirmation
              </div>
              <div className="text-[11px] text-slate-300">
                Break and 15m candle close above <span className="font-bold text-white font-mono">${scenarios.bullish.confirmationPrice.toFixed(2)}</span> with relative volume &gt; 1.25x. Targets: ${scenarios.bullish.target1.toFixed(2)}, ${scenarios.bullish.target2.toFixed(2)}.
              </div>
            </div>

            <div className="p-2 border border-rose-500/30 bg-rose-500/5 rounded">
              <div className="text-[10px] font-bold text-rose-400 uppercase mb-0.5 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Bearish Invalidation
              </div>
              <div className="text-[11px] text-slate-300">
                Loss of VWAP / support at <span className="font-bold text-white font-mono">${scenarios.bearish.confirmationPrice.toFixed(2)}</span> invalidates current setup. Targets: ${scenarios.bearish.target1.toFixed(2)}, ${scenarios.bearish.target2.toFixed(2)}.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Split: Options Summary & Risk Meter Gauge */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Options Sentiment */}
          <div>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              <span>Options Sentiment</span>
              <button
                onClick={() => onNavigateTab('options')}
                className="text-[#818cf8] hover:underline normal-case text-[9px]"
              >
                Flow Details &rarr;
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold font-mono text-white">
                {options.putCallRatio.toFixed(2)}{' '}
                <span className="text-[10px] font-normal text-slate-400">P/C Ratio</span>
              </div>
              <div
                className={`text-[10px] px-2 py-0.5 border rounded uppercase font-bold ${
                  options.sentiment.includes('Bullish')
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                    : 'bg-rose-400/10 text-rose-400 border-rose-400/30'
                }`}
              >
                {options.sentiment}
              </div>
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
              Largest OI Wall: <span className="text-white font-bold">${options.largestCallOIStrike.toFixed(2)} Call</span> | Gamma Support: <span className="text-white font-bold">${options.gammaSupport.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Meter Gauge */}
          <div className="border-t sm:border-t-0 sm:border-l border-[#2d3139] pt-2 sm:pt-0 sm:pl-3">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Risk Meter</span>
              <span
                className={`font-bold font-mono ${
                  probabilities.riskLevel === 'LOW RISK'
                    ? 'text-emerald-400'
                    : probabilities.riskLevel === 'MODERATE RISK'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {probabilities.riskLevel}
              </span>
            </div>
            <div className="w-full h-2 bg-[#2d3139] rounded-full overflow-hidden mt-1.5 relative">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${riskPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] mt-1 text-slate-500 font-mono uppercase">
              <span>Low (VIX &lt; 14)</span>
              <span>Moderate</span>
              <span>High (VIX &gt; 18)</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: Economic Calendar, Sector Strength, Live News AI (Col span 3) */}
      <section className="md:col-span-3 flex flex-col gap-2.5">
        {/* Economic Calendar Mini Timeline */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg flex-1 flex flex-col overflow-hidden shadow-sm">
          <div className="p-2 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>Economic Calendar</span>
            <button
              onClick={() => onNavigateTab('economic_fed')}
              className="text-[#818cf8] hover:underline normal-case text-[9px]"
            >
              Full Calendar &rarr;
            </button>
          </div>

          <div className="p-2.5 space-y-2 overflow-y-auto flex-1 text-xs">
            {economicEvents.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className={`relative pl-3 border-l-2 ${
                  evt.isApproachingHighVol ? 'border-rose-500 bg-rose-950/10 p-1 rounded-r' : 'border-[#6366f1]'
                }`}
              >
                <div className="text-[9px] text-slate-500 font-mono font-semibold">{evt.time}</div>
                <div className="text-xs font-bold text-white leading-tight">{evt.event}</div>
                <div className="flex items-center gap-2 text-[9px] mt-0.5 font-mono">
                  <span className="text-slate-400">Est: {evt.consensus}</span>
                  {evt.actual && <span className="text-emerald-400 font-bold">Act: {evt.actual}</span>}
                </div>
                {evt.isApproachingHighVol && (
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter block mt-0.5">
                    HIGH VOLATILITY RISK
                  </span>
                )}
                <span
                  className={`absolute -left-1 top-1 w-2 h-2 rounded-full ${
                    evt.isApproachingHighVol ? 'bg-rose-500 animate-ping' : 'bg-[#6366f1]'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Sector Strength Matrix Mini */}
          <div className="p-2.5 bg-[#1c1f24] border-t border-[#2d3139]">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
              <span>Sector Strength</span>
              <span className="text-[8px] text-emerald-400">Top: {sectors[0]?.symbol}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {sectors.slice(0, 8).map((sec) => {
                const isSecPos = sec.changePercent >= 0;
                return (
                  <div
                    key={sec.symbol}
                    onClick={() => onNavigateTab('sectors')}
                    className={`aspect-video rounded flex flex-col items-center justify-center text-[8px] font-bold cursor-pointer transition border ${
                      sec.changePercent > 1.0
                        ? 'bg-emerald-600/40 text-emerald-300 border-emerald-500/40'
                        : isSecPos
                        ? 'bg-emerald-800/30 text-emerald-400 border-emerald-700/30'
                        : sec.changePercent < -0.5
                        ? 'bg-rose-600/40 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                    }`}
                    title={`${sec.name}: ${isSecPos ? '+' : ''}${sec.changePercent}%`}
                  >
                    <span>{sec.symbol}</span>
                    <span className="font-mono text-[7.5px] opacity-80">
                      {isSecPos ? '+' : ''}{sec.changePercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live News AI Snippet */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-2.5 shadow-sm">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            <span>Live News AI</span>
            <button
              onClick={() => onNavigateTab('news')}
              className="text-[#818cf8] hover:underline normal-case text-[9px]"
            >
              All News &rarr;
            </button>
          </div>
          {news[0] && (
            <div className="flex gap-2 items-start bg-[#1c1f24] p-2 rounded border border-[#2d3139]">
              <div
                className={`w-1 h-7 rounded-full mt-0.5 shrink-0 ${
                  news[0].sentiment === 'BULLISH'
                    ? 'bg-emerald-500'
                    : news[0].sentiment === 'BEARISH'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white truncate leading-tight">
                  {news[0].headline}
                </span>
                <span className="text-[9px] text-slate-400 italic mt-0.5">
                  Impact: {news[0].impactScore}/10 ({news[0].sentiment}) &bull; {news[0].publishedTime}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
        </div>
      )}
    </div>
  );
};

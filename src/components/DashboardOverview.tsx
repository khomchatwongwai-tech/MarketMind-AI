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
  Crown,
  Activity,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { Probabilities, TickerSymbol } from '../types/market';
import { RealTimeStockChart } from './RealTimeStockChart';
import { MassiveLiveFeedBar } from './MassiveLiveFeedBar';
import { MarketMindSummaryCard } from './MarketMindSummaryCard';
import { useMassiveWebSocket } from '../hooks/useMassiveWebSocket';
import { WhatChangedRetentionCard } from './WhatChangedRetentionCard';
import { ExplainSimplyModal } from './ExplainSimplyModal';
import { MASTER_INSTRUMENTS } from '../services/marketProviders/InstrumentDirectoryService';
import { useRealTimeWatchlist } from '../hooks/useRealTimeMarket';
import { MarketMoversCard } from './MarketMoversCard';
import { isFiniteMarketNumber } from '../utils/formatters';

interface DashboardOverviewProps {
  data: ComprehensiveMarketData;
  probabilities: Probabilities;
  onNavigateTab: (tab: any) => void;
  onAskQuestion: (q: string) => void;
  onSelectTicker?: (ticker: TickerSymbol) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  probabilities,
  onNavigateTab,
  onAskQuestion,
  onSelectTicker,
}) => {
  const { quote, technicals, supportResistance, trends, sectors, economicEvents, news, options, scenarios } = data;
  const isPositive = quote.change >= 0;
  const [isExplainSimplyOpen, setIsExplainSimplyOpen] = useState(false);

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

  const macroSymbols = ['SPX', 'NDX', 'DJI', 'SPY', 'QQQ', 'VIX', 'US10Y', 'CL', 'XAU', 'BTC'];
  const { quotes: rtMacroQuotes } = useRealTimeWatchlist(macroSymbols, 'overview_macro');

  // Key Market Indices & Core Assets for Intelligence Bar
  const keyMarketIndices = [
    {
      name: 'S&P 500',
      symbol: 'SPX',
      price: isFiniteMarketNumber(rtMacroQuotes['SPX']?.price) ? `$${rtMacroQuotes['SPX']!.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : quote.ticker === 'SPY' && isFiniteMarketNumber(quote.price) ? `$${quote.price.toFixed(2)}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['SPX']?.changePercent) ? `${rtMacroQuotes['SPX']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['SPX']!.changePercent.toFixed(2)}%` : isFiniteMarketNumber(quote.changePercent) ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['SPX']?.change) ? rtMacroQuotes['SPX']!.change >= 0 : isPositive,
    },
    {
      name: 'NASDAQ 100',
      symbol: 'NDX',
      price: isFiniteMarketNumber(rtMacroQuotes['NDX']?.price) ? `$${rtMacroQuotes['NDX']!.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['NDX']?.changePercent) ? `${rtMacroQuotes['NDX']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['NDX']!.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['NDX']?.change) ? rtMacroQuotes['NDX']!.change >= 0 : true,
    },
    {
      name: 'DOW JONES',
      symbol: 'DJI',
      price: isFiniteMarketNumber(rtMacroQuotes['DJI']?.price) ? `$${rtMacroQuotes['DJI']!.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['DJI']?.changePercent) ? `${rtMacroQuotes['DJI']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['DJI']!.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['DJI']?.change) ? rtMacroQuotes['DJI']!.change >= 0 : true,
    },
    {
      name: 'SPY ETF',
      symbol: 'SPY',
      price: quote.ticker === 'SPY' && isFiniteMarketNumber(quote.price) ? `$${quote.price.toFixed(2)}` : isFiniteMarketNumber(rtMacroQuotes['SPY']?.price) ? `$${rtMacroQuotes['SPY']!.price.toFixed(2)}` : '--',
      change: quote.ticker === 'SPY' && isFiniteMarketNumber(quote.changePercent) ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : isFiniteMarketNumber(rtMacroQuotes['SPY']?.changePercent) ? `${rtMacroQuotes['SPY']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['SPY']!.changePercent.toFixed(2)}%` : '--',
      isUp: quote.ticker === 'SPY' ? isPositive : isFiniteMarketNumber(rtMacroQuotes['SPY']?.change) ? rtMacroQuotes['SPY']!.change >= 0 : true,
    },
    {
      name: 'QQQ ETF',
      symbol: 'QQQ',
      price: quote.ticker === 'QQQ' && isFiniteMarketNumber(quote.price) ? `$${quote.price.toFixed(2)}` : isFiniteMarketNumber(rtMacroQuotes['QQQ']?.price) ? `$${rtMacroQuotes['QQQ']!.price.toFixed(2)}` : '--',
      change: quote.ticker === 'QQQ' && isFiniteMarketNumber(quote.changePercent) ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : isFiniteMarketNumber(rtMacroQuotes['QQQ']?.changePercent) ? `${rtMacroQuotes['QQQ']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['QQQ']!.changePercent.toFixed(2)}%` : '--',
      isUp: quote.ticker === 'QQQ' ? isPositive : isFiniteMarketNumber(rtMacroQuotes['QQQ']?.change) ? rtMacroQuotes['QQQ']!.change >= 0 : true,
    },
    {
      name: 'VIX VOLATILITY',
      symbol: 'VIX',
      price: isFiniteMarketNumber(rtMacroQuotes['VIX']?.price) ? `${rtMacroQuotes['VIX']!.price.toFixed(2)}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['VIX']?.changePercent) ? `${rtMacroQuotes['VIX']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['VIX']!.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['VIX']?.change) ? rtMacroQuotes['VIX']!.change >= 0 : false,
    },
    {
      name: '10Y TREASURY',
      symbol: 'US10Y',
      price: isFiniteMarketNumber(rtMacroQuotes['US10Y']?.price) ? `${rtMacroQuotes['US10Y']!.price.toFixed(2)}%` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['US10Y']?.change) ? `${rtMacroQuotes['US10Y']!.change >= 0 ? '+' : ''}${rtMacroQuotes['US10Y']!.change.toFixed(2)}` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['US10Y']?.change) ? rtMacroQuotes['US10Y']!.change >= 0 : false,
    },
    {
      name: 'WTI CRUDE OIL',
      symbol: 'CL',
      price: isFiniteMarketNumber(rtMacroQuotes['CL']?.price) ? `$${rtMacroQuotes['CL']!.price.toFixed(2)}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['CL']?.changePercent) ? `${rtMacroQuotes['CL']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['CL']!.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['CL']?.change) ? rtMacroQuotes['CL']!.change >= 0 : false,
    },
    {
      name: 'GOLD SPOT',
      symbol: 'XAU',
      price: isFiniteMarketNumber(rtMacroQuotes['XAU']?.price) ? `$${rtMacroQuotes['XAU']!.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--',
      change: isFiniteMarketNumber(rtMacroQuotes['XAU']?.changePercent) ? `${rtMacroQuotes['XAU']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['XAU']!.changePercent.toFixed(2)}%` : '--',
      isUp: isFiniteMarketNumber(rtMacroQuotes['XAU']?.change) ? rtMacroQuotes['XAU']!.change >= 0 : true,
    },
    {
      name: 'BITCOIN',
      symbol: 'BTC',
      price: rtMacroQuotes['BTC']?.price ? `$${rtMacroQuotes['BTC']!.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '--',
      change: rtMacroQuotes['BTC']?.changePercent !== undefined ? `${rtMacroQuotes['BTC']!.changePercent >= 0 ? '+' : ''}${rtMacroQuotes['BTC']!.changePercent.toFixed(2)}%` : '--',
      isUp: rtMacroQuotes['BTC']?.change !== undefined ? rtMacroQuotes['BTC']!.change >= 0 : true,
    },
  ];

  return (
    <div className="flex flex-col gap-3 flex-1 select-none text-[#E5E5E5]">
      {/* TOP SECTION: INTELLIGENCE CENTER & GLOBAL MARKETS SNAPSHOT */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#151515] border border-[rgba(212,175,55,0.4)] rounded-lg">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-mono tracking-tight">
                  MARKET INTELLIGENCE CENTER
                </span>
                <span className="px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 text-[10px] font-bold rounded-md font-mono">
                  GLOBAL MACRO
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] font-mono">
                Institutional Overview &bull; Cross-Asset Flows &bull; Real-Time Correlation Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] text-[#9CA3AF] font-mono hidden sm:block">
              Market Status: <span className="text-[#22C55E] font-bold">REGULAR LIVE</span> &bull; Session ET
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Index Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {keyMarketIndices.map((idx) => (
            <div
              key={idx.symbol}
              className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg px-3 py-2 shrink-0 min-w-[130px] flex flex-col justify-between transition"
            >
              <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] font-mono uppercase">
                <span className="truncate">{idx.name}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-xs font-black font-mono text-white">{idx.price}</span>
                <span
                  className={`text-[10px] font-mono font-bold flex items-center ${
                    idx.isUp ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {idx.isUp ? '+' : ''}{idx.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RETENTION INTELLIGENCE: WHAT CHANGED SINCE YOUR LAST VISIT? */}
      <WhatChangedRetentionCard
        onSelectSymbol={(sym) => {
          if (onSelectTicker) onSelectTicker(sym as any);
        }}
        onAskAI={onAskQuestion}
      />

      {/* 0. MASSIVE WEBSOCKET LIVE PIPELINE BAR */}
      <MassiveLiveFeedBar
        status={wsStatus}
        ticker={quote.ticker}
        signals={wsSignals}
        aiInsight={wsAiInsight}
        liveTrade={wsLiveTrade}
        quote={quote}
        technicals={technicals}
        onRequestAiInsight={requestAiInsight}
      />

      {/* 1. PROFESSIONAL REAL-TIME INTERACTIVE CANDLESTICK CHART */}
      <RealTimeStockChart ticker={quote.ticker} isLiveSimulation={true} />

      {/* View Switcher & Quick Actions */}
      <div className="flex flex-wrap justify-between items-center bg-[#0A0A0A] px-3.5 py-2 rounded-xl border border-[#242424] text-xs shadow-md gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Terminal View:
          </span>
          <div className="flex items-center bg-[#101010] p-0.5 rounded-lg border border-[#242424] text-[10px] font-semibold">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'both'
                  ? 'bg-[#151515] text-[#F2D675] border border-[#D4AF37]/50 font-bold shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3 text-[#D4AF37]" />
              Unified Terminal
            </button>
            <button
              onClick={() => setViewMode('executive')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'executive'
                  ? 'bg-[#151515] text-[#F2D675] border border-[#D4AF37]/50 font-bold shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3 text-[#D4AF37]" />
              MarketMind AI Card
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[#151515] text-[#F2D675] border border-[#D4AF37]/50 font-bold shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3 text-[#D4AF37]" />
              Multi-Factor Grid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExplainSimplyOpen(true)}
            className="px-3 py-1 bg-[#15151D] hover:bg-[#1D1D28] text-[#F2D675] border border-[#D4AF37]/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Explain Like I'm a Beginner"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Explain Simply</span>
          </button>

          <div className="text-[10px] text-[#9CA3AF] font-mono hidden sm:block">
            Asset: <span className="text-white font-bold">{quote.ticker}</span> &bull; Verified Feed Active
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* LEFT COLUMN: Technical Engine, S/R, Multi-Timeframe Trends (Col span 3) */}
          <section className="md:col-span-3 flex flex-col gap-3">
            {/* Technical Engine Card */}
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl flex-1 flex flex-col overflow-hidden shadow-lg transition">
              <div className="p-2.5 bg-[#101010] border-b border-[#1C1C1C] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                <span className="flex items-center gap-1.5 text-white">
                  <Zap className="w-3 h-3 text-[#D4AF37]" />
                  Technical Engine
                </span>
                <button
                  onClick={() => onNavigateTab('technicals')}
                  className="text-[#F2D675] hover:underline normal-case text-[9px] font-medium"
                >
                  Details &rarr;
                </button>
              </div>

              <div className="p-3 grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">RSI (14)</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      technicals.rsi14 > 70
                        ? 'text-[#EF4444]'
                        : technicals.rsi14 < 30
                        ? 'text-[#22C55E]'
                        : 'text-white'
                    }`}
                  >
                    {technicals.rsi14} <span className="text-[9px] font-normal text-[#9CA3AF]">({technicals.rsiStatus})</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">VWAP</span>
                  <span className="text-xs font-mono font-bold text-[#F2D675]">{isFiniteMarketNumber(technicals.vwap) ? `$${technicals.vwap.toFixed(2)}` : 'N/A'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">9 EMA</span>
                  <span className="text-xs font-mono font-bold text-white">{isFiniteMarketNumber(technicals.ema9) ? `$${technicals.ema9.toFixed(2)}` : 'N/A'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">20 EMA</span>
                  <span className="text-xs font-mono font-bold text-white">{isFiniteMarketNumber(technicals.ema20) ? `$${technicals.ema20.toFixed(2)}` : 'N/A'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">MACD (12,26,9)</span>
                  <span className="text-xs font-mono font-bold text-[#22C55E]">
                    +{isFiniteMarketNumber(technicals.macd) ? technicals.macd : 'N/A'} <span className="text-[9px] font-normal text-[#9CA3AF]">Bull</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">ADX (14)</span>
                  <span className="text-xs font-mono font-bold text-[#F2D675]">
                    {isFiniteMarketNumber(technicals.adx) ? technicals.adx : 'N/A'} <span className="text-[9px] font-normal text-[#9CA3AF]">{technicals.adxStrength}</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">ATR (14)</span>
                  <span className="text-xs font-mono font-bold text-white">{isFiniteMarketNumber(technicals.atr14) ? `$${technicals.atr14.toFixed(2)}` : 'N/A'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Rel Volume</span>
                  <span className="text-xs font-mono font-bold text-[#22C55E]">{quote.relativeVolume ?? 1}x</span>
                </div>
              </div>

              {/* Support & Resistance Mini Ladder */}
              <div className="p-3 border-t border-[#1C1C1C] space-y-2 bg-[#050505]">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                  <span>Support & Resistance</span>
                  <span className="text-[8px] text-[#F2D675] font-mono">Pivot: {isFiniteMarketNumber(technicals.prevDayHigh) && isFiniteMarketNumber(technicals.prevDayLow) && isFiniteMarketNumber(technicals.prevDayClose) ? `$${((technicals.prevDayHigh + technicals.prevDayLow + technicals.prevDayClose)/3).toFixed(2)}` : 'N/A'}</span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-[#9CA3AF] opacity-60">
                    <span className="text-[#EF4444]">R3 Target</span>
                    <span>{isFiniteMarketNumber(supportResistance.r3) ? `$${supportResistance.r3.toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#E5E5E5] opacity-80">
                    <span className="text-[#EF4444]">R2 Area</span>
                    <span>{isFiniteMarketNumber(supportResistance.r2) ? `$${supportResistance.r2.toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold px-2 py-0.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444]">
                    <span>R1 Key Level</span>
                    <span>{isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A'}</span>
                  </div>

                  {/* Current Price Line Indicator */}
                  <div className="py-0.5 flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <span className="text-[10px] font-bold text-white bg-[#151515] px-2 py-0.2 rounded border border-[#D4AF37]/50 font-mono">
                      Current {isFiniteMarketNumber(quote.price) ? `$${quote.price.toFixed(2)}` : 'N/A'}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                  </div>

                  <div className="flex justify-between items-center font-bold px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded text-[#22C55E]">
                    <span>S1 Key Level</span>
                    <span>{isFiniteMarketNumber(supportResistance.s1) ? `$${supportResistance.s1.toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#E5E5E5] opacity-80">
                    <span className="text-[#22C55E]">S2 Area</span>
                    <span>{isFiniteMarketNumber(supportResistance.s2) ? `$${supportResistance.s2.toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#9CA3AF] opacity-60">
                    <span className="text-[#22C55E]">S3 Major</span>
                    <span>{isFiniteMarketNumber(supportResistance.s3) ? `$${supportResistance.s3.toFixed(2)}` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Timeframe Trend Alignment Engine */}
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl p-3 transition">
              <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">
                <span>Trend Alignment</span>
                <span className="text-[#22C55E] font-mono font-bold">
                  {data.trendAlignmentScore}% Bullish
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center">
                {trends.map((t) => (
                  <div key={t.timeframe} className="flex flex-col items-center bg-[#101010] p-1 rounded border border-[#1C1C1C]">
                    <span className="text-[9px] text-[#9CA3AF] font-semibold">{t.timeframe}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        t.trend === 'BULLISH'
                          ? 'text-[#22C55E]'
                          : t.trend === 'BEARISH'
                          ? 'text-[#EF4444]'
                          : 'text-[#F2D675]'
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
          <section className="md:col-span-6 flex flex-col gap-3">
            {/* Main "Why is [Ticker] Moving?" AI Section */}
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl p-4 flex-1 flex flex-col justify-between shadow-lg transition">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2 font-mono">
                      <Radio className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                      Why is {quote.ticker} moving?
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onAskQuestion(`Analyze ${quote.ticker} right now`);
                        onNavigateTab('chat');
                      }}
                      className="px-2.5 py-1 bg-[#151515] hover:bg-[#202020] border border-[#D4AF37]/50 text-[#F2D675] hover:text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition"
                      title="Ask Gemini for a complete institutional analysis"
                    >
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>Ask AI Analyst</span>
                    </button>
                    <button
                      onClick={() => {
                        onAskQuestion(`Why is ${quote.ticker} moving today?`);
                        onNavigateTab('chat');
                      }}
                      className="px-2.5 py-1 bg-[#101010] hover:bg-[#181818] border border-[#242424] text-[#E5E5E5] text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                      title="Ask Assistant why this asset is moving"
                    >
                      <BotMessageSquare className="w-3 h-3 text-[#D4AF37]" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>

                {/* AI Explanation Narrative Box */}
                <p className="text-xs md:text-sm text-[#E5E5E5] leading-relaxed italic border-l-2 border-[#D4AF37] pl-3.5 py-1.5 mb-3 bg-[#101010] rounded-r-lg border-y border-r border-[#1C1C1C]">
                  &ldquo;{quote.ticker} is currently showing {isPositive ? 'solid bullish momentum' : 'distribution pressure'}. Price is trading {isFiniteMarketNumber(quote.price) && isFiniteMarketNumber(technicals.vwap) && quote.price >= technicals.vwap ? 'above VWAP' : 'below VWAP'} and short-term exponential averages while technology and large-cap leaders show strength. Treasury yields have stabilized, expanding multiples. However, overhead resistance near {isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A'} requires volume expansion (&gt;1.25x) for continuation.&rdquo;
                </p>

                {/* Drivers & Setup Quality Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-lg bg-[#101010] border border-[#242424]">
                      <div className="text-[9px] uppercase font-bold text-[#D4AF37] mb-0.5 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Primary Driver
                      </div>
                      <div className="text-xs font-semibold text-white">{probabilities.primaryDriver}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#101010] border border-[#242424]">
                      <div className="text-[9px] uppercase font-bold text-[#EF4444] mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Main Risk Factor
                      </div>
                      <div className="text-xs font-semibold text-[#E5E5E5]">{probabilities.mainRisk}</div>
                    </div>
                  </div>

                  {/* Setup Quality Metric */}
                  <div className="bg-[#101010] border border-[#242424] rounded-lg p-2.5 flex flex-col justify-center items-center text-center">
                    <div className="text-[9px] uppercase font-bold text-[#9CA3AF] mb-1 tracking-wider">
                      Setup Quality Index
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">{probabilities.setupScore}</span>
                      <span className="text-xs text-[#9CA3AF] font-mono">/100</span>
                    </div>
                    <div
                      className={`mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        probabilities.setupScore >= 75
                          ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30'
                          : probabilities.setupScore >= 60
                          ? 'text-[#F2D675] bg-[#D4AF37]/10 border-[#D4AF37]/30'
                          : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
                      }`}
                    >
                      {probabilities.setupQuality}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bullish Confirmation & Bearish Invalidation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="p-2.5 border border-[#22C55E]/30 bg-[#22C55E]/5 rounded-lg">
                  <div className="text-[10px] font-bold text-[#22C55E] uppercase mb-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Bullish Confirmation
                  </div>
                  <div className="text-[11px] text-[#E5E5E5]">
                    Break and 15m candle close above <span className="font-bold text-white font-mono">{isFiniteMarketNumber(scenarios.bullish.confirmationPrice) ? `$${scenarios.bullish.confirmationPrice.toFixed(2)}` : 'N/A'}</span> with relative volume &gt; 1.25x. Targets: {isFiniteMarketNumber(scenarios.bullish.target1) ? `$${scenarios.bullish.target1.toFixed(2)}` : 'N/A'}, {isFiniteMarketNumber(scenarios.bullish.target2) ? `$${scenarios.bullish.target2.toFixed(2)}` : 'N/A'}.
                  </div>
                </div>

                <div className="p-2.5 border border-[#EF4444]/30 bg-[#EF4444]/5 rounded-lg">
                  <div className="text-[10px] font-bold text-[#EF4444] uppercase mb-0.5 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Bearish Invalidation
                  </div>
                  <div className="text-[11px] text-[#E5E5E5]">
                    Loss of VWAP / support at <span className="font-bold text-white font-mono">{isFiniteMarketNumber(scenarios.bearish.confirmationPrice) ? `$${scenarios.bearish.confirmationPrice.toFixed(2)}` : 'N/A'}</span> invalidates current setup. Targets: {isFiniteMarketNumber(scenarios.bearish.target1) ? `$${scenarios.bearish.target1.toFixed(2)}` : 'N/A'}, {isFiniteMarketNumber(scenarios.bearish.target2) ? `$${scenarios.bearish.target2.toFixed(2)}` : 'N/A'}.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Split: Options Summary & Risk Meter Gauge */}
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 transition">
              {/* Options Sentiment */}
              <div>
                <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                  <span>Options Flow Sentiment</span>
                  <button
                    onClick={() => onNavigateTab('options')}
                    className="text-[#F2D675] hover:underline normal-case text-[9px]"
                  >
                    Flow Details &rarr;
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold font-mono text-white">
                    {isFiniteMarketNumber(options.putCallRatio) ? options.putCallRatio.toFixed(2) : 'N/A'}{' '}
                    <span className="text-[10px] font-normal text-[#9CA3AF]">P/C Ratio</span>
                  </div>
                  <div
                    className={`text-[10px] px-2 py-0.5 border rounded uppercase font-bold ${
                      options.sentiment?.includes('Bullish')
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                        : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                    }`}
                  >
                    {options.sentiment || 'NEUTRAL'}
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] text-[#9CA3AF] font-mono">
                  Largest OI Wall: <span className="text-white font-bold">{isFiniteMarketNumber(options.largestCallOIStrike) ? `$${options.largestCallOIStrike.toFixed(2)} Call` : 'N/A'}</span> | Gamma Support: <span className="text-white font-bold">{isFiniteMarketNumber(options.gammaSupport) ? `$${options.gammaSupport.toFixed(2)}` : 'N/A'}</span>
                </div>
              </div>

              {/* Risk Meter Gauge */}
              <div className="border-t sm:border-t-0 sm:border-l border-[#1C1C1C] pt-2 sm:pt-0 sm:pl-3">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">
                  <span>System Risk Meter</span>
                  <span
                    className={`font-bold font-mono ${
                      probabilities.riskLevel === 'LOW RISK'
                        ? 'text-[#22C55E]'
                        : probabilities.riskLevel === 'MODERATE RISK'
                        ? 'text-[#F2D675]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {probabilities.riskLevel}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden mt-1.5 relative">
                  <div
                    className="bg-gradient-to-r from-[#22C55E] via-[#D4AF37] to-[#EF4444] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${riskPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] mt-1 text-[#9CA3AF] font-mono uppercase">
                  <span>Low (VIX &lt; 14)</span>
                  <span>Moderate</span>
                  <span>High (VIX &gt; 18)</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Market Movers, Economic Calendar, Sector Strength, Live News AI (Col span 3) */}
          <section className="md:col-span-3 flex flex-col gap-3">
            {/* Real-time Market Movers */}
            <MarketMoversCard
              onSelectTicker={onSelectTicker}
              onViewAll={() => onNavigateTab('multi_asset_markets')}
            />

            {/* Economic Calendar Mini Timeline */}
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl flex-1 flex flex-col overflow-hidden shadow-lg transition">
              <div className="p-2.5 bg-[#101010] border-b border-[#1C1C1C] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                <span>Economic Calendar</span>
                <button
                  onClick={() => onNavigateTab('economic_fed')}
                  className="text-[#F2D675] hover:underline normal-case text-[9px]"
                >
                  Full Calendar &rarr;
                </button>
              </div>

              <div className="p-2.5 space-y-2 overflow-y-auto flex-1 text-xs">
                {economicEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    className={`relative pl-3 border-l-2 ${
                      evt.isApproachingHighVol ? 'border-[#EF4444] bg-[#EF4444]/10 p-1 rounded-r' : 'border-[#D4AF37]'
                    }`}
                  >
                    <div className="text-[9px] text-[#9CA3AF] font-mono font-semibold">{evt.time}</div>
                    <div className="text-xs font-bold text-white leading-tight">{evt.event}</div>
                    <div className="flex items-center gap-2 text-[9px] mt-0.5 font-mono">
                      <span className="text-[#9CA3AF]">Est: {evt.consensus}</span>
                      {evt.actual && <span className="text-[#22C55E] font-bold">Act: {evt.actual}</span>}
                    </div>
                    {evt.isApproachingHighVol && (
                      <span className="text-[8px] font-black text-[#EF4444] uppercase tracking-tighter block mt-0.5">
                        HIGH VOLATILITY RISK
                      </span>
                    )}
                    <span
                      className={`absolute -left-1 top-1 w-2 h-2 rounded-full ${
                        evt.isApproachingHighVol ? 'bg-[#EF4444] animate-ping' : 'bg-[#D4AF37]'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Sector Strength Matrix Mini */}
              <div className="p-2.5 bg-[#101010] border-t border-[#1C1C1C]">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase mb-1.5 tracking-widest">
                  <span>Sector Strength</span>
                  <span className="text-[8px] text-[#22C55E]">Top: {sectors[0]?.symbol}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {sectors.slice(0, 8).map((sec) => {
                    const isSecPos = sec.changePercent >= 0;
                    return (
                      <div
                        key={sec.symbol}
                        onClick={() => onNavigateTab('sectors')}
                        className={`aspect-video rounded-md flex flex-col items-center justify-center text-[8px] font-bold cursor-pointer transition border ${
                          sec.changePercent > 1.0
                            ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40'
                            : isSecPos
                            ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
                            : sec.changePercent < -0.5
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                            : 'bg-[#151515] text-[#9CA3AF] border-[#242424]'
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
            <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl p-3 shadow-lg transition">
              <div className="flex justify-between items-center text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                <span>Live News AI</span>
                <button
                  onClick={() => onNavigateTab('news')}
                  className="text-[#F2D675] hover:underline normal-case text-[9px]"
                >
                  All News &rarr;
                </button>
              </div>
              {news[0] && (
                <div className="flex gap-2 items-start bg-[#101010] p-2.5 rounded-lg border border-[#1C1C1C]">
                  <div
                    className={`w-1 h-7 rounded-full mt-0.5 shrink-0 ${
                      news[0].sentiment === 'BULLISH'
                        ? 'bg-[#22C55E]'
                        : news[0].sentiment === 'BEARISH'
                        ? 'bg-[#EF4444]'
                        : 'bg-[#D4AF37]'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-white truncate leading-tight">
                      {news[0].headline}
                    </span>
                    <span className="text-[9px] text-[#9CA3AF] italic mt-0.5">
                      Impact: {news[0].impactScore}/10 ({news[0].sentiment}) &bull; {news[0].publishedTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Explain Simply / Beginner Guide Modal */}
      {isExplainSimplyOpen && (
        <ExplainSimplyModal
          isOpen={isExplainSimplyOpen}
          onClose={() => setIsExplainSimplyOpen(false)}
          instrument={
            MASTER_INSTRUMENTS.find((i) => i.symbol.toUpperCase() === quote.ticker.toUpperCase()) || {
              id: quote.ticker.toLowerCase(),
              symbol: quote.ticker,
              name: quote.name,
              assetClass: 'STOCK',
              exchange: quote.exchange || 'US Market',
              currency: 'USD',
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              marketCap: 1000000000,
              provider: quote.dataSource || 'Market Provider',
              lastUpdated: quote.timestamp,
              isTradable: true,
              isSupported: true,
            }
          }
          marketData={data}
        />
      )}
    </div>
  );
};

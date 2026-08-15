import React from 'react';
import {
  Activity,
  Zap,
  Radio,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Layers,
  BarChart2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
} from 'lucide-react';
import { CalculatedMarketSignals, MassiveWsStatus, MassiveAiInsight } from '../types/massiveWs';

interface MassiveLiveFeedBarProps {
  status: MassiveWsStatus;
  isDelayed?: boolean;
  ticker: string;
  signals: CalculatedMarketSignals | null;
  aiInsight: MassiveAiInsight | null;
  liveTrade: {
    price: number;
    size: number;
    time: number;
    formattedTime: string;
  } | null;
  onRequestAiInsight: () => void;
}

export const MassiveLiveFeedBar: React.FC<MassiveLiveFeedBarProps> = ({
  status,
  isDelayed = false,
  ticker,
  signals,
  aiInsight,
  liveTrade,
  onRequestAiInsight,
}) => {
  const isAboveVwap = signals?.priceVsVwap === 'ABOVE_VWAP';
  const isEmaBull = signals?.emaStack === 'BULLISH_STACK';

  // Determine user status label based on connection
  const displayStatus: 'LIVE' | 'RECONNECTING' | 'DISCONNECTED' | 'DELAYED DATA' =
    isDelayed || status === 'DELAYED DATA'
      ? 'DELAYED DATA'
      : status === 'LIVE'
      ? 'LIVE'
      : status === 'RECONNECTING' || status === 'CONNECTING' || status === 'AUTHENTICATING'
      ? 'RECONNECTING'
      : 'DISCONNECTED';

  return (
    <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-3 md:p-4 mb-3.5 shadow-2xl">
      {/* 1. Header Pipeline Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#151515] border border-[rgba(212,175,55,0.4)] rounded-lg">
            <Radio className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono tracking-tight">
                MASSIVE REAL-TIME FEED & QUANT SIGNALS
              </span>
              <span className="px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 text-[10px] font-bold rounded-md font-mono">
                {ticker} ACTIVE STREAM
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] font-mono">
              Direct WebSocket &bull; Real-Time Indicators &bull; MarketMind Quantitative Engine
            </p>
          </div>
        </div>

        {/* Status Pill & Re-trigger AI button */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono flex items-center gap-1.5 border ${
              displayStatus === 'LIVE'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40'
                : displayStatus === 'DELAYED DATA'
                ? 'bg-[#D4AF37]/10 text-[#F2D675] border-[#D4AF37]/40'
                : displayStatus === 'RECONNECTING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                displayStatus === 'LIVE'
                  ? 'bg-[#22C55E] animate-ping'
                  : displayStatus === 'DELAYED DATA'
                  ? 'bg-[#D4AF37]'
                  : displayStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#EF4444]'
              }`}
            />
            {displayStatus}
          </div>

          <button
            onClick={onRequestAiInsight}
            className="px-3 py-1 bg-[#151515] hover:bg-[#202020] border border-[#D4AF37]/50 text-xs font-bold text-[#F2D675] hover:text-white rounded-lg transition flex items-center gap-1.5 shadow-sm"
            title="Feed calculated signals to Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Interpret Market with AI</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Signal Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
        {/* Live Ticker & Price */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Live Trade ({ticker})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black font-mono text-white">
              ${signals ? signals.price.toFixed(2) : '512.48'}
            </span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono">
            Size: {liveTrade?.size || 250} shares
          </span>
        </div>

        {/* Calculated Session VWAP */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Calculated VWAP</span>
            <span
              className={`text-[9px] font-bold px-1 rounded ${
                isAboveVwap ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'
              }`}
            >
              {isAboveVwap ? '+ Above' : '- Below'}
            </span>
          </div>
          <span className="text-lg font-black font-mono text-[#F2D675] mt-1">
            ${signals ? signals.vwap.toFixed(2) : '512.10'}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            CumVol: {signals ? (signals.cumulativeVolume / 1000000).toFixed(2) + 'M' : '4.5M'}
          </span>
        </div>

        {/* 9 & 20 EMA Stack */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">EMA (9 / 20)</span>
            <span
              className={`text-[9px] font-bold px-1 rounded ${
                isEmaBull ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'
              }`}
            >
              {isEmaBull ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono text-xs">
            <span className="text-white font-bold">${signals?.ema9.toFixed(2) || '512.30'}</span>
            <span className="text-[#6B7280]">/</span>
            <span className="text-[#D4AF37] font-bold">${signals?.ema20.toFixed(2) || '511.95'}</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono">
            50 EMA: ${signals?.ema50.toFixed(2) || '510.80'}
          </span>
        </div>

        {/* Momentum & RSI */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">RSI(14)</span>
          <span className="text-lg font-black font-mono text-white mt-1">
            {signals?.rsi.toFixed(1) || '54.2'}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono">
            {signals && signals.rsi > 70 ? 'Overbought' : signals && signals.rsi < 30 ? 'Oversold' : 'Neutral Range'}
          </span>
        </div>

        {/* Relative Volume */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Relative Volume</span>
          <span className="text-lg font-black font-mono text-[#22C55E] mt-1">
            {signals?.relativeVolume.toFixed(2) || '1.15'}x
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono">
            Institutional Flow
          </span>
        </div>

        {/* Quant Momentum State */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Regime Signal</span>
          <span
            className={`text-xs font-black font-mono uppercase mt-1 px-1.5 py-0.5 rounded text-center truncate ${
              signals?.momentum.includes('BULLISH')
                ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                : signals?.momentum.includes('BEARISH')
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : 'bg-[#151515] text-[#A3A3A3] border border-[#242424]'
            }`}
          >
            {signals?.momentum.replace('_', ' ') || 'NEUTRAL'}
          </span>
          <span className="text-[9px] text-[#9CA3AF] font-mono truncate text-center">
            {signals?.lastUpdated || 'Live Sync'}
          </span>
        </div>
      </div>

      {/* 3. Gemini AI Real-Time Insight Banner */}
      {aiInsight && (
        <div className="mt-3 p-3.5 bg-[#101010] border-l-4 border-[#D4AF37] border-y border-r border-[#242424] rounded-r-lg flex flex-col gap-2.5 text-xs shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#151515] border border-[#D4AF37]/40 text-[#F2D675] font-bold rounded text-[10px] font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" /> MARKETMIND AI QUANTITATIVE INTERPRETATION
              </span>
              <span
                className={`font-black font-mono uppercase ${
                  aiInsight.bias === 'BULLISH'
                    ? 'text-[#22C55E]'
                    : aiInsight.bias === 'BEARISH'
                    ? 'text-[#EF4444]'
                    : 'text-[#F2D675]'
                }`}
              >
                {aiInsight.bias} BIAS ({aiInsight.confidence}% CONFIDENCE)
              </span>
            </div>
            <span className="text-[10px] text-[#9CA3AF] font-mono">
              {aiInsight.timestamp}
            </span>
          </div>

          {/* Why SPY is Moving */}
          <div className="text-[#E5E5E5] leading-relaxed text-xs">
            <strong className="text-[#F2D675]">Primary Driver ({ticker}):</strong> {aiInsight.whyMoving}
          </div>

          {/* Factors & Triggers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {/* Bullish Factors */}
            <div className="p-2.5 bg-[#050505] border border-[#22C55E]/30 rounded-lg">
              <span className="text-[10px] font-bold text-[#22C55E] uppercase font-mono block mb-1">
                Bullish Drivers
              </span>
              <ul className="space-y-1 text-[11px] text-[#E5E5E5]">
                {aiInsight.bullishFactors.map((bf, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-[#22C55E] font-bold">&bull;</span>
                    <span>{bf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bearish Factors */}
            <div className="p-2.5 bg-[#050505] border border-[#EF4444]/30 rounded-lg">
              <span className="text-[10px] font-bold text-[#EF4444] uppercase font-mono block mb-1">
                Bearish Drivers
              </span>
              <ul className="space-y-1 text-[11px] text-[#E5E5E5]">
                {aiInsight.bearishFactors.map((bf, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-[#EF4444] font-bold">&bull;</span>
                    <span>{bf}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Breakout Confirmation & Invalidation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#050505] p-2.5 rounded-lg border border-[#242424]">
            <div>
              <span className="text-[#22C55E] font-bold">Breakout Confirmation:</span> {aiInsight.breakoutConfirmation}
            </div>
            <div>
              <span className="text-[#EF4444] font-bold">Invalidation Level:</span> {aiInsight.invalidationLevel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

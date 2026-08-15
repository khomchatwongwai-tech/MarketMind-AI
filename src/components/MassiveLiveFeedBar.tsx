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

  // Determine user status label based on Massive connection and plan delay
  const displayStatus: 'LIVE' | 'RECONNECTING' | 'DISCONNECTED' | 'DELAYED DATA' =
    isDelayed || status === 'DELAYED DATA'
      ? 'DELAYED DATA'
      : status === 'LIVE'
      ? 'LIVE'
      : status === 'RECONNECTING' || status === 'CONNECTING' || status === 'AUTHENTICATING'
      ? 'RECONNECTING'
      : 'DISCONNECTED';

  return (
    <div className="bg-[#121418] border border-[#2d3139] rounded-xl p-3 md:p-4 mb-4 shadow-xl">
      {/* 1. Header Pipeline Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#23272f]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#6366f1]/20 border border-[#6366f1]/40 rounded-lg">
            <Radio className="w-4 h-4 text-[#818cf8] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono tracking-tight">
                MASSIVE MARKET DATA PIPELINE
              </span>
              <span className="px-2 py-0.5 bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 text-[10px] font-bold rounded">
                {ticker} LIVE STREAM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Massive REST API &bull; Massive Stocks WebSocket &bull; Real-Time Indicators &bull; Gemini AI
            </p>
          </div>
        </div>

        {/* Status Pill & Re-trigger AI button */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono flex items-center gap-1.5 border ${
              displayStatus === 'LIVE'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                : displayStatus === 'DELAYED DATA'
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                : displayStatus === 'RECONNECTING'
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                displayStatus === 'LIVE'
                  ? 'bg-emerald-400 animate-ping'
                  : displayStatus === 'DELAYED DATA'
                  ? 'bg-purple-400'
                  : displayStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            {displayStatus}
          </div>

          <button
            onClick={onRequestAiInsight}
            className="px-3 py-1 bg-[#6366f1]/20 hover:bg-[#6366f1]/30 border border-[#6366f1]/40 text-xs font-bold text-[#a5b4fc] rounded-lg transition flex items-center gap-1.5"
            title="Feed calculated signals to Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Interpret Market with Gemini</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Signal Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
        {/* Live Ticker & Price */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Live Trade ({ticker})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black font-mono text-white">
              ${signals ? signals.price.toFixed(2) : '512.48'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Size: {liveTrade?.size || 250} shares
          </span>
        </div>

        {/* Calculated Session VWAP */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Calculated VWAP</span>
            <span
              className={`text-[9px] font-bold px-1 rounded ${
                isAboveVwap ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isAboveVwap ? '+ Above' : '- Below'}
            </span>
          </div>
          <span className="text-lg font-black font-mono text-amber-300 mt-1">
            ${signals ? signals.vwap.toFixed(2) : '512.10'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            CumVol: {signals ? (signals.cumulativeVolume / 1000000).toFixed(2) + 'M' : '4.5M'}
          </span>
        </div>

        {/* 9 & 20 EMA Stack */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase">EMA (9 / 20)</span>
            <span
              className={`text-[9px] font-bold px-1 rounded ${
                isEmaBull ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isEmaBull ? 'Bullish Stack' : 'Bearish Stack'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono text-xs">
            <span className="text-cyan-400 font-bold">${signals?.ema9.toFixed(2) || '512.30'}</span>
            <span className="text-slate-500">/</span>
            <span className="text-indigo-400 font-bold">${signals?.ema20.toFixed(2) || '511.95'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            50 EMA: ${signals?.ema50.toFixed(2) || '510.80'}
          </span>
        </div>

        {/* Momentum & RSI */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Calculated RSI(14)</span>
          <span className="text-lg font-black font-mono text-white mt-1">
            {signals?.rsi.toFixed(1) || '54.2'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {signals && signals.rsi > 70 ? 'Overbought' : signals && signals.rsi < 30 ? 'Oversold' : 'Neutral Range'}
          </span>
        </div>

        {/* Relative Volume */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Relative Volume</span>
          <span className="text-lg font-black font-mono text-emerald-400 mt-1">
            {signals?.relativeVolume.toFixed(2) || '1.15'}x
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Institutional Participation
          </span>
        </div>

        {/* Quant Momentum State */}
        <div className="bg-[#181a1f] border border-[#282c35] rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Regime Signal</span>
          <span
            className={`text-xs font-black font-mono uppercase mt-1 px-1.5 py-0.5 rounded text-center truncate ${
              signals?.momentum.includes('BULLISH')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : signals?.momentum.includes('BEARISH')
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {signals?.momentum.replace('_', ' ') || 'NEUTRAL'}
          </span>
          <span className="text-[9px] text-slate-400 font-mono truncate text-center">
            {signals?.lastUpdated || 'Live Sync'}
          </span>
        </div>
      </div>

      {/* 3. Gemini AI Real-Time Insight Banner */}
      {aiInsight && (
        <div className="mt-3 p-3.5 bg-[#171a21] border-l-4 border-[#6366f1] rounded-r-lg flex flex-col gap-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] font-bold rounded text-[10px] font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GEMINI AI QUANTITATIVE INTERPRETATION
              </span>
              <span
                className={`font-black font-mono uppercase ${
                  aiInsight.bias === 'BULLISH'
                    ? 'text-emerald-400'
                    : aiInsight.bias === 'BEARISH'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {aiInsight.bias} BIAS ({aiInsight.confidence}% CONFIDENCE)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {aiInsight.timestamp}
            </span>
          </div>

          {/* Why SPY is Moving */}
          <div className="text-slate-200 leading-relaxed text-xs">
            <strong className="text-[#a5b4fc]">Why {ticker} Is Moving:</strong> {aiInsight.whyMoving}
          </div>

          {/* Factors & Triggers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {/* Bullish Factors */}
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded">
              <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block mb-1">
                Bullish Factors
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {aiInsight.bullishFactors.map((bf, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-emerald-400 font-bold">&bull;</span>
                    <span>{bf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bearish Factors */}
            <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded">
              <span className="text-[10px] font-bold text-rose-400 uppercase font-mono block mb-1">
                Bearish Factors
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {aiInsight.bearishFactors.map((bf, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-rose-400 font-bold">&bull;</span>
                    <span>{bf}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Breakout Confirmation & Invalidation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#111317] p-2.5 rounded border border-[#282c35]">
            <div>
              <span className="text-emerald-400 font-bold">Breakout Confirmation:</span> {aiInsight.breakoutConfirmation}
            </div>
            <div>
              <span className="text-rose-400 font-bold">Invalidation Level:</span> {aiInsight.invalidationLevel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


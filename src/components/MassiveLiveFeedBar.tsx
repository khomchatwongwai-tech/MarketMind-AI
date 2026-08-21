import { useI18n } from '../i18n/I18nContext.js';
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
  AlertTriangle,
} from 'lucide-react';
import { CalculatedMarketSignals, MassiveWsStatus, MassiveAiInsight } from '../types/massiveWs.js';
import { MarketQuote, TechnicalIndicators } from '../types/market.js';
import { isFiniteMarketNumber, formatVolume } from '../utils/formatters.js';

interface MassiveLiveFeedBarProps {
  status?: MassiveWsStatus;
  isDelayed?: boolean;
  ticker: string;
  signals?: CalculatedMarketSignals | null;
  aiInsight?: MassiveAiInsight | null;
  liveTrade?: {
    price: number;
    size: number;
    time: number;
    formattedTime: string;
  } | null;
  quote?: MarketQuote | null;
  technicals?: TechnicalIndicators | null;
  onRequestAiInsight?: () => void;
}

export const MassiveLiveFeedBar: React.FC<MassiveLiveFeedBarProps> = ({
  status = 'DISCONNECTED',
  isDelayed = false,
  ticker,
  signals,
  aiInsight,
  liveTrade,
  quote,
  technicals,
  onRequestAiInsight,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  // 1. Resolve Active Provider Metadata & Live Trade Price
  const activeProvider = quote?.metadata?.provider || quote?.dataSource || (status === 'LIVE' ? 'Massive WebSocket' : 'Alpaca IEX');
  const isRealTimeMode = quote?.metadata?.mode === 'REAL_TIME' || quote?.dataStatus === 'REAL_TIME' || status === 'LIVE';

  const livePrice =
    liveTrade && isFiniteMarketNumber(liveTrade.price) && liveTrade.price > 0
      ? liveTrade.price
      : quote && isFiniteMarketNumber(quote.price) && quote.price > 0
      ? quote.price
      : null;

  const hasLivePrice = livePrice !== null;

  // 2. Resolve Indicator Values (WS signals take priority if present, fallback to Centralized Technicals)
  const vwap =
    signals && isFiniteMarketNumber(signals.vwap)
      ? signals.vwap
      : technicals && isFiniteMarketNumber(technicals.vwap)
      ? technicals.vwap
      : null;

  const ema9 =
    signals && isFiniteMarketNumber(signals.ema9)
      ? signals.ema9
      : technicals && isFiniteMarketNumber(technicals.ema9)
      ? technicals.ema9
      : null;

  const ema20 =
    signals && isFiniteMarketNumber(signals.ema20)
      ? signals.ema20
      : technicals && isFiniteMarketNumber(technicals.ema20)
      ? technicals.ema20
      : null;

  const ema50 =
    signals && isFiniteMarketNumber(signals.ema50)
      ? signals.ema50
      : technicals && isFiniteMarketNumber(technicals.ema50)
      ? technicals.ema50
      : null;

  const rsi =
    signals && isFiniteMarketNumber(signals.rsi)
      ? signals.rsi
      : technicals && isFiniteMarketNumber(technicals.rsi14)
      ? technicals.rsi14
      : null;

  const rvol =
    signals && isFiniteMarketNumber(signals.relativeVolume)
      ? signals.relativeVolume
      : quote && isFiniteMarketNumber(quote.relativeVolume)
      ? quote.relativeVolume
      : null;

  const cumVol =
    signals && isFiniteMarketNumber(signals.cumulativeVolume)
      ? signals.cumulativeVolume
      : quote && isFiniteMarketNumber(quote.volume)
      ? quote.volume
      : null;

  // 3. Evaluate Derived States
  const isAboveVwap = hasLivePrice && vwap !== null ? livePrice >= vwap : null;
  const isEmaBull = ema9 !== null && ema20 !== null ? ema9 >= ema20 : null;

  const hasAllIndicators = vwap !== null && ema9 !== null && ema20 !== null && rsi !== null;

  // Connection status pill state (LIVE | DEGRADED | RECONNECTING | DISCONNECTED)
  let displayStatus: 'LIVE' | 'DEGRADED' | 'RECONNECTING' | 'DISCONNECTED' | 'DELAYED DATA' = 'DISCONNECTED';
  if (isDelayed || status === 'DELAYED DATA') {
    displayStatus = 'DELAYED DATA';
  } else if (status === 'LIVE') {
    displayStatus = 'LIVE';
  } else if (hasLivePrice) {
    displayStatus = hasAllIndicators ? 'LIVE' : 'DEGRADED';
  } else if (status === 'RECONNECTING' || status === 'CONNECTING' || status === 'AUTHENTICATING') {
    displayStatus = 'RECONNECTING';
  } else {
    displayStatus = 'DISCONNECTED';
  }

  // 4. Regime Signal Logic (Fail-closed: UNAVAILABLE if calculation requirements are not met)
  let regimeSignal: 'BULLISH STACK' | 'BEARISH STACK' | 'NEUTRAL' | 'UNAVAILABLE' = 'UNAVAILABLE';
  if (signals?.momentum) {
    regimeSignal = signals.momentum as any;
  } else if (isAboveVwap !== null && isEmaBull !== null) {
    if (isAboveVwap && isEmaBull) {
      regimeSignal = 'BULLISH STACK';
    } else if (!isAboveVwap && !isEmaBull) {
      regimeSignal = 'BEARISH STACK';
    } else {
      regimeSignal = 'NEUTRAL';
    }
  } else {
    regimeSignal = 'UNAVAILABLE';
  }

  // Formatting strings
  const priceStr = hasLivePrice ? `$${livePrice!.toFixed(2)}` : 'Awaiting ticks';
  const tradeDetailsStr =
    liveTrade?.size
      ? `Size: ${liveTrade.size} shares`
      : quote && isFiniteMarketNumber(quote.volume)
      ? `Day Vol: ${formatVolume(quote.volume)}`
      : 'Awaiting ticks';

  const vwapStr = vwap !== null ? `$${vwap.toFixed(2)}` : 'Unavailable';
  const cumVolStr = cumVol !== null ? `Cum Vol: ${(cumVol / 1e6).toFixed(1)}M` : 'Cum Vol: Unavailable';
  const ema9Str = ema9 !== null ? `$${ema9.toFixed(2)}` : 'Unavailable';
  const ema20Str = ema20 !== null ? `$${ema20.toFixed(2)}` : 'Unavailable';
  const ema50Str = ema50 !== null ? `50 EMA: $${ema50.toFixed(2)}` : '50 EMA: Unavailable';
  const rsiStr = rsi !== null ? `${rsi.toFixed(1)}` : 'Unavailable';
  const rsiStatusStr = rsi !== null ? (rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral Range') : 'Awaiting intraday bars';
  const rvolStr = rvol !== null ? `${rvol.toFixed(2)}x` : 'Unavailable';
  const rvolSubtext = rvol !== null ? 'Institutional Flow' : 'No historical baseline';

  return (
    <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-3 md:p-4 mb-3.5 shadow-2xl select-none font-sans">
      {/* 1. Header Pipeline Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#151515] border border-[rgba(212,175,55,0.4)] rounded-lg">
            <Radio className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono tracking-tight">
                LIVE QUANT FEED & SIGNALS
              </span>
              <span className="px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 text-[10px] font-bold rounded-md font-mono">
                {activeProvider} &bull; {isRealTimeMode ? 'Real-Time' : 'Live'}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] font-mono">
              Direct Provider Pipeline &bull; Intraday Indicators &bull; MarketMind Quantitative Engine
            </p>
          </div>
        </div>

        {/* Status Pill & Re-trigger AI button */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono flex items-center gap-1.5 border ${
              displayStatus === 'LIVE'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40'
                : displayStatus === 'DEGRADED'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
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
                  : displayStatus === 'DEGRADED'
                  ? 'bg-amber-400'
                  : displayStatus === 'DELAYED DATA'
                  ? 'bg-[#D4AF37]'
                  : displayStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#EF4444]'
              }`}
            />
            {displayStatus}
          </div>

          {onRequestAiInsight && (
            <button
              onClick={onRequestAiInsight}
              className="px-3 py-1 bg-[#151515] hover:bg-[#202020] border border-[#D4AF37]/50 text-xs font-bold text-[#F2D675] hover:text-white rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Feed calculated signals to Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Interpret Market with AI</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-Time Signal Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
        {/* Live Ticker & Price */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Live Trade ({ticker})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black font-mono text-white">
              {priceStr}
            </span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            {tradeDetailsStr}
          </span>
        </div>

        {/* Calculated Session VWAP */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Calculated VWAP</span>
            {isAboveVwap !== null && (
              <span
                className={`text-[9px] font-bold px-1 rounded font-mono ${
                  isAboveVwap ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                }`}
              >
                {isAboveVwap ? '+ Above' : '- Below'}
              </span>
            )}
          </div>
          <span className="text-lg font-black font-mono text-[#F2D675] mt-1">
            {vwapStr}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            {cumVolStr}
          </span>
        </div>

        {/* 9 & 20 EMA Stack */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">EMA (9 / 20)</span>
            {isEmaBull !== null && (
              <span
                className={`text-[9px] font-bold px-1 rounded font-mono ${
                  isEmaBull ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                }`}
              >
                {isEmaBull ? 'Bullish' : 'Bearish'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono text-xs">
            <span className="text-white font-bold">{ema9Str}</span>
            <span className="text-[#6B7280]">/</span>
            <span className="text-[#D4AF37] font-bold">{ema20Str}</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            {ema50Str}
          </span>
        </div>

        {/* Momentum & RSI */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">RSI(14)</span>
          <span className="text-lg font-black font-mono text-white mt-1">
            {rsiStr}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            {rsiStatusStr}
          </span>
        </div>

        {/* Relative Volume */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Relative Volume</span>
          <span className="text-lg font-black font-mono text-[#22C55E] mt-1">
            {rvolStr}
          </span>
          <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
            {rvolSubtext}
          </span>
        </div>

        {/* Quant Momentum State */}
        <div className="bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg p-2.5 flex flex-col justify-between transition">
          <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Regime Signal</span>
          <span
            className={`text-xs font-black font-mono uppercase mt-1 px-1.5 py-0.5 rounded text-center truncate ${
              regimeSignal.includes('BULLISH')
                ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                : regimeSignal.includes('BEARISH')
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : regimeSignal === 'NEUTRAL'
                ? 'bg-[#151515] text-[#A3A3A3] border border-[#242424]'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {regimeSignal.replace('_', ' ')}
          </span>
          <span className="text-[9px] text-[#9CA3AF] font-mono truncate text-center">
            {signals?.lastUpdated || 'Live Pipeline'}
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
                    : aiInsight.bias === 'NEUTRAL'
                    ? 'text-[#A3A3A3]'
                    : 'text-amber-400'
                }`}
              >
                {aiInsight.bias === 'UNAVAILABLE'
                  ? 'BIAS UNAVAILABLE'
                  : `${aiInsight.bias} BIAS (${aiInsight.confidence}% CONFIDENCE)`}
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

          {/* Provenance & Validated Data Guardrails Metadata */}
          {aiInsight.provenance && (
            <div className="mt-1 pt-2 border-t border-[#1F1F24] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#9CA3AF]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[#22C55E] font-bold">Verified Inputs ({aiInsight.provenance.fieldsUsed.length}):</span>
                {aiInsight.provenance.fieldsUsed.slice(0, 5).map((f) => (
                  <span key={f} className="px-1.5 py-0.5 bg-[#151515] border border-[#22C55E]/30 text-[#E5E5E5] rounded">
                    {f}
                  </span>
                ))}
              </div>

              {aiInsight.provenance.omittedFields.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-amber-400 font-bold">Omitted (Missing):</span>
                  {aiInsight.provenance.omittedFields.slice(0, 4).map((f) => (
                    <span key={f} className="px-1.5 py-0.5 bg-[#151515] border border-amber-500/30 text-amber-300 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#151515] border border-[#D4AF37]/30 text-[#F2D675] rounded font-bold">
                  Conviction: {aiInsight.provenance.confidence}%
                </span>
                {aiInsight.provenance.sourcesUsed.map((s) => (
                  <span key={s} className="px-1.5 py-0.5 bg-[#18181B] text-[#A1A1AA] border border-[#27272A] rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

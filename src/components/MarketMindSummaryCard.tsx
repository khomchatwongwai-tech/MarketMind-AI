import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.js';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BotMessageSquare,
  Crown,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService.js';
import { Probabilities } from '../types/market.js';
import { isFiniteMarketNumber, formatPrice, formatPercent } from '../utils/formatters.js';
import { calculateRealtimeIntelligence } from '../utils/realtimeIntelligenceEngine.js';

interface MarketMindSummaryCardProps {
  data: ComprehensiveMarketData;
  probabilities?: Probabilities;
  onAskQuestion?: (q: string) => void;
  onNavigateTab?: (tab: any) => void;
  className?: string;
}

export const MarketMindSummaryCard: React.FC<MarketMindSummaryCardProps> = ({
  data,
  probabilities,
  onAskQuestion,
  onNavigateTab,
  className = '',
}) => {
  const { t } = useI18n();
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const { quote } = data;
  const isPositive = isFiniteMarketNumber(quote.change) ? quote.change >= 0 : true;

  // Run Real-Time Intelligence Engine
  const engine = calculateRealtimeIntelligence(data);

  const isScoreValid = engine.status !== 'UNAVAILABLE' && engine.intelligenceScore !== null;
  const isBullish = engine.overallBias === 'BULLISH';
  const isBearish = engine.overallBias === 'BEARISH';

  const primaryOutlook =
    engine.overallBias === 'BULLISH'
      ? t('dashboard.bullish')
      : engine.overallBias === 'BEARISH'
      ? t('dashboard.bearish')
      : engine.overallBias === 'NEUTRAL'
      ? 'NEUTRAL'
      : 'UNAVAILABLE';

  const priceStr = formatPrice(quote.price, 2, 'Unavailable');
  const changeNum = quote.change;
  const changeAbsStr = isFiniteMarketNumber(changeNum)
    ? `${isPositive ? '+' : ''}${changeNum.toFixed(2)}`
    : 'N/A';

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const scoreVal = isScoreValid ? engine.intelligenceScore! : 0;
  const strokeDashoffset = circumference - (scoreVal / 100) * circumference;

  return (
    <div
      id="ai-market-outlook-card"
      className={`bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl overflow-hidden shadow-2xl select-none text-[#E5E5E5] font-sans transition duration-200 ${className}`}
    >
      {/* 1. TOP TICKER & LIVE BAR */}
      <div className="p-4 bg-[#101010] border-b border-[#1C1C1C] flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
              {quote.ticker || 'SPY'}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 rounded font-mono font-bold uppercase">
              {quote.name || 'Benchmark Asset'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {priceStr}
            </span>
            <span
              className={`text-sm sm:text-base font-bold font-mono ${
                isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {changeAbsStr} ({changeStr})
            </span>
          </div>
        </div>

        {/* Live Feed Status Badge & Timestamp */}
        <div className="flex flex-col sm:items-end gap-1.5 font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/40 rounded-md text-[#22C55E] text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <span className="tracking-widest">{t('common.live')} FEED</span>
          </div>
          <span className="text-[11px] text-[#9CA3AF]">
            {t('dashboard.updatedAt')}: <strong className="text-white">{engine.updatedAt}</strong>
          </span>
        </div>
      </div>

      {/* 2. MAIN SPECIFICATION BODY */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* PROPRIETARY MARKETMIND INTELLIGENCE SCORE GAUGE & HERO SECTION */}
        <div className="bg-[#101010] border border-[#242424] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4 pb-3.5 border-b border-[#1C1C1C]">
            <div className="flex items-center gap-3">
              {/* Circular Metallic Gold Gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-[#1C1C1C]"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {isScoreValid && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="url(#goldGradient)"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8C6B18" />
                      <stop offset="35%" stopColor="#D4AF37" />
                      <stop offset="70%" stopColor="#FFE08A" />
                      <stop offset="100%" stopColor="#C9A227" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black font-mono text-white leading-none">
                    {isScoreValid ? engine.intelligenceScore : 'N/A'}
                  </span>
                  <span className="text-[9px] text-[#9CA3AF] font-mono leading-none mt-0.5">
                    {isScoreValid ? '/ 100' : 'UNAVAIL'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-widest text-[#9CA3AF] uppercase">
                    MARKETMIND INTELLIGENCE SCORE
                  </span>
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-wide font-mono flex items-center gap-1.5 ${
                      isBullish
                        ? 'text-[#22C55E]'
                        : isBearish
                        ? 'text-[#EF4444]'
                        : 'text-amber-400'
                    }`}
                  >
                    {isBullish ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : isBearish ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {primaryOutlook}
                  </span>
                  {isScoreValid && (
                    <span className="text-xs text-[#9CA3AF] font-mono">
                      Confidence: <strong className="text-white font-bold">{engine.overallConfidence}%</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge Grid */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">Structure: </span>
                <span
                  className={`font-bold ${
                    engine.structure === 'BULLISH'
                      ? 'text-[#22C55E]'
                      : engine.structure === 'BEARISH'
                      ? 'text-[#EF4444]'
                      : 'text-amber-400'
                  }`}
                >
                  {engine.structure}
                </span>
              </div>
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">Momentum: </span>
                <span className="font-bold text-[#F2D675]">{engine.momentum.replace('_', ' ')}</span>
              </div>
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">News Sentiment: </span>
                <span
                  className={`font-bold ${
                    engine.newsSentiment === 'POSITIVE'
                      ? 'text-[#22C55E]'
                      : engine.newsSentiment === 'NEGATIVE'
                      ? 'text-[#EF4444]'
                      : 'text-amber-400'
                  }`}
                >
                  {engine.newsSentiment}
                </span>
              </div>
            </div>
          </div>

          {/* TIMEFRAME CONFIDENCE BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tf15m')}</span>
              <span
                className={`font-bold ${
                  engine.timeframeBias.tf15m.bias === 'BULLISH'
                    ? 'text-[#22C55E]'
                    : engine.timeframeBias.tf15m.bias === 'BEARISH'
                    ? 'text-[#EF4444]'
                    : 'text-amber-400'
                }`}
              >
                {engine.timeframeBias.tf15m.score ? `${engine.timeframeBias.tf15m.score}% ` : ''}
                {engine.timeframeBias.tf15m.bias}
              </span>
            </div>

            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tf1h')}</span>
              <span
                className={`font-bold ${
                  engine.timeframeBias.tf1h.bias === 'BULLISH'
                    ? 'text-[#22C55E]'
                    : engine.timeframeBias.tf1h.bias === 'BEARISH'
                    ? 'text-[#EF4444]'
                    : 'text-amber-400'
                }`}
              >
                {engine.timeframeBias.tf1h.score ? `${engine.timeframeBias.tf1h.score}% ` : ''}
                {engine.timeframeBias.tf1h.bias}
              </span>
            </div>

            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tfToday')}</span>
              <span
                className={`font-bold ${
                  engine.timeframeBias.tfToday.bias === 'BULLISH'
                    ? 'text-[#22C55E]'
                    : engine.timeframeBias.tfToday.bias === 'BEARISH'
                    ? 'text-[#EF4444]'
                    : 'text-amber-400'
                }`}
              >
                {engine.timeframeBias.tfToday.score ? `${engine.timeframeBias.tfToday.score}% ` : ''}
                {engine.timeframeBias.tfToday.bias}
              </span>
            </div>
          </div>
        </div>

        {/* SETUP QUALITY */}
        <div className="bg-[#101010] border border-[#242424] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t('dashboard.setupQuality')}</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {isScoreValid ? (
                <>
                  {engine.setupScore} / 100 &mdash;{' '}
                  <span
                    className={
                      engine.setupScore! >= 75
                        ? 'text-[#22C55E]'
                        : engine.setupScore! >= 55
                        ? 'text-[#F2D675]'
                        : 'text-[#EF4444]'
                    }
                  >
                    {engine.setupQuality}
                  </span>
                </>
              ) : (
                <span className="text-amber-400">UNAVAILABLE &mdash; Awaiting Validated Inputs</span>
              )}
            </div>
          </div>

          {isScoreValid && (
            <div className="w-full sm:w-48 bg-[#050505] h-2.5 rounded-full overflow-hidden border border-[#242424]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  engine.setupScore! >= 75
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#10B981]'
                    : engine.setupScore! >= 55
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F2D675]'
                    : 'bg-gradient-to-r from-[#EF4444] to-[#DC2626]'
                }`}
                style={{ width: `${engine.setupScore}%` }}
              />
            </div>
          )}
        </div>

        {/* WHY BULLISH / WHY BEARISH RATIONALE CHECKLIST */}
        <div className="bg-[#101010] border border-[#242424] rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-[#E5E5E5] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              {isBullish ? t('dashboard.whyBullish') : t('dashboard.whyBearish')}
            </span>
            {onAskQuestion && (
              <button
                onClick={() =>
                  onAskQuestion(
                    `Explain why the market outlook for ${quote.ticker || 'SPY'} is ${primaryOutlook}`
                  )
                }
                className="text-[11px] font-bold text-[#F2D675] hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <BotMessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t('dashboard.askInChat')} &rarr;</span>
              </button>
            )}
          </div>

          {engine.reasons.length === 0 ? (
            <div className="p-3 bg-[#050505] rounded-lg border border-[#1C1C1C] text-xs font-mono text-[#9CA3AF] text-center">
              No validated factor reasons available for this direction.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              {engine.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
                  <span className="text-[#22C55E] font-bold text-base">✓</span>
                  <span className="text-[#E5E5E5] font-mono text-xs">{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONFIRMATION & INVALIDATION ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {/* CONFIRMATION */}
          <div className="p-3.5 bg-[#101010] border border-[#22C55E]/30 rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#22C55E] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{t('dashboard.confirmation')}</span>
            </div>
            <div className="text-[#E5E5E5] font-bold text-xs sm:text-sm">
              {engine.confirmationLevel !== 'UNAVAILABLE' ? (
                <>Above <strong className="text-white">{engine.confirmationLevel}</strong> with strong volume</>
              ) : (
                <span className="text-[#9CA3AF]">Unavailable</span>
              )}
            </div>
          </div>

          {/* INVALIDATION */}
          <div className="p-3.5 bg-[#101010] border border-[#EF4444]/30 rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#EF4444] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>{t('dashboard.invalidation')}</span>
            </div>
            <div className="text-[#E5E5E5] font-bold text-xs sm:text-sm">
              {engine.invalidationLevel !== 'UNAVAILABLE' ? (
                <>Below <strong className="text-white">{engine.invalidationLevel}</strong></>
              ) : (
                <span className="text-[#9CA3AF]">Unavailable</span>
              )}
            </div>
          </div>
        </div>

        {/* PROVENANCE & DATA COVERAGE BAR */}
        <div className="bg-[#101010] border border-[#242424] rounded-xl p-3.5 font-mono text-xs">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37] font-bold">Data Coverage: {engine.coveragePercent}%</span>
              <span className="text-[#9CA3AF] text-[11px]">
                ({engine.validatedFactorCount} Validated Inputs / {engine.missingFactorCount} Missing)
              </span>
            </div>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showDiagnostics ? 'Hide Input Diagnostics' : 'View Input Diagnostics'}</span>
              {showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showDiagnostics && (
            <div className="mt-3 pt-3 border-t border-[#1C1C1C] space-y-2">
              <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">
                REAL-TIME INTELLIGENCE FACTOR BREAKDOWN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {engine.factors.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2 rounded border flex justify-between items-center ${
                      f.available
                        ? 'bg-[#050505] border-[#22C55E]/30 text-[#E5E5E5]'
                        : 'bg-[#050505] border-amber-500/30 text-[#9CA3AF]'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{f.name}</span>
                      <span className="text-[10px] text-[#6B7280]">Provider: {f.provider}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold block ${f.available ? 'text-[#22C55E]' : 'text-amber-400'}`}>
                        {f.available ? f.value : 'Unavailable'}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">Weight: {f.weight} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DISCLAIMER FOOTER */}
        <div className="pt-2 border-t border-[#1C1C1C] flex items-start gap-2 text-[10px] text-[#6B7280] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#9CA3AF]">MarketMind Intelligence Disclaimer:</strong> The MarketMind Intelligence Score (0–100) is a quantitative multi-factor analytical metric synthesizing 10 verified technical, volume, sentiment, breadth, macro, and options inputs. It is calculated strictly when minimum validated coverage exists.
          </p>
        </div>
      </div>
    </div>
  );
};

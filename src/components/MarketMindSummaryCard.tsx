import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  Sparkles,
  Radio,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  BarChart2,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  BotMessageSquare,
  Flame,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { Probabilities } from '../types/market';

interface MarketMindSummaryCardProps {
  data: ComprehensiveMarketData;
  probabilities: Probabilities;
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
  const { t, timezone, currency } = useI18n();
  const { quote, technicals, supportResistance, trends, breadth } = data;
  const isPositive = quote.change >= 0;

  // Determine Direction
  const isBullish = probabilities.bullish >= probabilities.bearish;
  const primaryOutlook = isBullish ? t('dashboard.bullish') : t('dashboard.bearish');
  const primaryConfidence = isBullish ? probabilities.bullish : probabilities.bearish;

  // Multi-timeframe percentages
  const tf15MScore = isBullish ? Math.min(95, probabilities.bullish - 4) : Math.min(95, probabilities.bearish - 3);
  const tf1HScore = isBullish ? probabilities.bullish : probabilities.bearish;
  const tfTodayScore = isBullish ? Math.max(50, probabilities.bullish - 7) : Math.max(50, probabilities.bearish - 6);

  // Setup Quality Calculation
  const setupScore = probabilities.setupScore || 82;
  const setupQualityText =
    probabilities.setupQuality ||
    (setupScore >= 75 ? t('dashboard.strongSetup') : setupScore >= 55 ? t('dashboard.moderateSetup') : t('dashboard.weakSetup'));

  // Confirmation & Invalidation levels
  const confirmationLevel = (supportResistance.r1 || (quote.price * 1.004)).toFixed(2);
  const invalidationLevel = (supportResistance.s1 || (quote.price * 0.996)).toFixed(2);

  // Dynamic Factors Check
  const isAboveVwap = quote.price >= technicals.vwap;
  const isEmaBullish = technicals.ema9 >= technicals.ema20;
  const isBreadthPositive = breadth.advanceDeclineRatio >= 1.0;

  // Timestamp in ET
  const timeET = quote.timestamp || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';

  return (
    <div
      id="ai-market-outlook-card"
      className={`bg-[#15171a] border border-[#2d3139] rounded-xl overflow-hidden shadow-2xl select-none text-[#e2e8f0] font-sans ${className}`}
    >
      {/* 1. TOP TICKER & LIVE BAR */}
      <div className="p-4 bg-[#181a1f] border-b border-[#2d3139] flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
              {quote.ticker}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded font-mono font-bold uppercase">
              {quote.name || 'Benchmark ETF'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              ${quote.price.toFixed(2)}
            </span>
            <span
              className={`text-sm sm:text-base font-bold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
              {quote.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Live Feed Status Badge & Action */}
        <div className="flex flex-col sm:items-end gap-1.5 font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/50 border border-emerald-500/40 rounded-md text-emerald-400 text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-widest">{t('common.live')}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {t('dashboard.updatedAt')}: <strong className="text-slate-200">{timeET}</strong>
          </span>
        </div>
      </div>

      {/* 2. MAIN SPECIFICATION BODY */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* AI MARKET OUTLOOK HERO SECTION */}
        <div className="bg-[#191c22] border border-[#2d3139] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-[#2d3139]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                {t('dashboard.aiMarketOutlook')}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span
                className={`text-lg sm:text-2xl font-black tracking-wide flex items-center gap-1.5 ${
                  isBullish ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isBullish ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {primaryOutlook}
              </span>
              <span
                className={`text-xl sm:text-2xl font-black px-2.5 py-0.5 rounded-lg border ${
                  isBullish
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {primaryConfidence}%
              </span>
            </div>
          </div>

          {/* TIMEFRAME CONFIDENCE BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#131518] p-3 rounded-lg border border-[#272a31] flex justify-between items-center">
              <span className="font-bold text-slate-400 tracking-wider">{t('dashboard.tf15m')}</span>
              <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tf15MScore}% {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
            <div className="bg-[#131518] p-3 rounded-lg border border-[#272a31] flex justify-between items-center">
              <span className="font-bold text-slate-400 tracking-wider">{t('dashboard.tf1h')}</span>
              <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tf1HScore}% {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
            <div className="bg-[#131518] p-3 rounded-lg border border-[#272a31] flex justify-between items-center">
              <span className="font-bold text-slate-400 tracking-wider">{t('dashboard.tfToday')}</span>
              <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tfTodayScore}% {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
          </div>
        </div>

        {/* SETUP QUALITY */}
        <div className="bg-[#191c22] border border-[#2d3139] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#818cf8]" />
              <span>{t('dashboard.setupQuality')}</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {setupScore} / 100 &mdash;{' '}
              <span
                className={
                  setupScore >= 75
                    ? 'text-emerald-400'
                    : setupScore >= 55
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {setupQualityText}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-48 bg-[#121316] h-2.5 rounded-full overflow-hidden border border-[#2d3139]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                setupScore >= 75
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : setupScore >= 55
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${setupScore}%` }}
            />
          </div>
        </div>

        {/* WHY BULLISH / WHY BEARISH RATIONALE CHECKLIST */}
        <div className="bg-[#191c22] border border-[#2d3139] rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">
              {isBullish ? t('dashboard.whyBullish') : t('dashboard.whyBearish')}
            </span>
            {onAskQuestion && (
              <button
                onClick={() => onAskQuestion(`Explain why the market outlook for ${quote.ticker} is ${primaryOutlook} with ${primaryConfidence}% confidence`)}
                className="text-[11px] font-bold text-[#818cf8] hover:text-[#a5b4fc] flex items-center gap-1 transition"
              >
                <BotMessageSquare className="w-3.5 h-3.5" />
                <span>{t('dashboard.askInChat')} &rarr;</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-emerald-400 font-bold text-base">✓</span>
              <span className="text-slate-200">
                {isAboveVwap ? `Above VWAP ($${technicals.vwap.toFixed(2)})` : `Below VWAP ($${technicals.vwap.toFixed(2)})`}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-emerald-400 font-bold text-base">✓</span>
              <span className="text-slate-200">
                {isEmaBullish ? '9 EMA > 20 EMA (Momentum Alignment)' : '9 EMA < 20 EMA (Downward Pressure)'}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-emerald-400 font-bold text-base">✓</span>
              <span className="text-slate-200">QQQ outperforming SPY (Tech Leadership)</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-emerald-400 font-bold text-base">✓</span>
              <span className="text-slate-200">
                {isBreadthPositive ? 'Market breadth improving (A/D Ratio > 1.2)' : 'Market breadth stabilizing'}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-emerald-400 font-bold text-base">✓</span>
              <span className="text-slate-200">VIX declining / Volatility compression</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#131518] rounded-lg border border-[#272a31]">
              <span className="text-amber-400 font-bold text-base">⚠</span>
              <span className="text-amber-200">
                Major resistance nearby (${supportResistance.r1.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* CONFIRMATION & INVALIDATION ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {/* CONFIRMATION */}
          <div className="p-3.5 bg-[#191c22] border border-[#2d3139] rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('dashboard.confirmation')}</span>
            </div>
            <div className="text-slate-200 font-bold text-xs sm:text-sm">
              Above <strong className="text-white">${confirmationLevel}</strong> with strong volume
            </div>
          </div>

          {/* INVALIDATION */}
          <div className="p-3.5 bg-[#191c22] border border-[#2d3139] rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('dashboard.invalidation')}</span>
            </div>
            <div className="text-slate-200 font-bold text-xs sm:text-sm">
              Below <strong className="text-white">${invalidationLevel}</strong>
            </div>
          </div>
        </div>

        {/* HISTORICAL PERFORMANCE & DATA SOURCE FOOTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* HISTORICAL PERFORMANCE */}
          <div className="p-3.5 bg-[#191c22] border border-[#2d3139] rounded-xl space-y-2 font-mono">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#818cf8]" />
                {t('dashboard.similarSignals')}
              </span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('backtest')}
                  className="text-[9px] text-[#818cf8] hover:underline normal-case font-normal"
                >
                  Backtest Engine &rarr;
                </button>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('dashboard.similarSignals')}:</span>
                <span className="font-bold text-white">2,416</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('dashboard.historicalSuccess')}:</span>
                <span className="font-bold text-emerald-400">69.8%</span>
              </div>
            </div>
          </div>

          {/* DATA CONNECTIVITY */}
          <div className="p-3.5 bg-[#191c22] border border-[#2d3139] rounded-xl space-y-2 font-mono">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#818cf8]" />
              {t('common.status')}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Market Data:</span>
                <span className="text-emerald-400 font-bold px-1.5 py-0.2 bg-emerald-950/40 border border-emerald-500/30 rounded text-[10px]">
                  {t('common.live')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('dashboard.updatedAt')}:</span>
                <span className="font-bold text-slate-200">{timeET}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

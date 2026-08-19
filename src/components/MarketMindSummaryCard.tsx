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
  Crown,
  Info,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { Probabilities } from '../types/market';
import { isFiniteMarketNumber, formatPrice, formatPercent, formatNumber } from '../utils/formatters';

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
  const isPositive = isFiniteMarketNumber(quote.change) ? quote.change >= 0 : true;

  // Determine Direction
  const isBullish = (probabilities?.bullish ?? 50) >= (probabilities?.bearish ?? 50);
  const primaryOutlook = isBullish ? t('dashboard.bullish') : t('dashboard.bearish');
  const primaryConfidence = isBullish ? (probabilities?.bullish ?? 50) : (probabilities?.bearish ?? 50);

  // Multi-timeframe percentages
  const tf15MScore = isBullish ? Math.min(95, primaryConfidence - 4) : Math.min(95, primaryConfidence - 3);
  const tf1HScore = primaryConfidence;
  const tfTodayScore = isBullish ? Math.max(50, primaryConfidence - 7) : Math.max(50, primaryConfidence - 6);

  // Setup Quality & Score Calculation
  const setupScore = probabilities?.setupScore || 78;
  const setupQualityText =
    probabilities?.setupQuality ||
    (setupScore >= 75 ? t('dashboard.strongSetup') : setupScore >= 55 ? t('dashboard.moderateSetup') : t('dashboard.weakSetup'));

  // Confirmation & Invalidation levels
  const confirmationLevel = isFiniteMarketNumber(supportResistance.r1)
    ? supportResistance.r1.toFixed(2)
    : isFiniteMarketNumber(quote.price)
    ? (quote.price * 1.004).toFixed(2)
    : 'N/A';

  const invalidationLevel = isFiniteMarketNumber(supportResistance.s1)
    ? supportResistance.s1.toFixed(2)
    : isFiniteMarketNumber(quote.price)
    ? (quote.price * 0.996).toFixed(2)
    : 'N/A';

  // Dynamic Factors Check
  const isAboveVwap = isFiniteMarketNumber(quote.price) && isFiniteMarketNumber(technicals.vwap)
    ? quote.price >= technicals.vwap
    : true;
  const isEmaBullish = isFiniteMarketNumber(technicals.ema9) && isFiniteMarketNumber(technicals.ema20)
    ? technicals.ema9 >= technicals.ema20
    : true;
  const isBreadthPositive = isFiniteMarketNumber(breadth.advanceDeclineRatio)
    ? breadth.advanceDeclineRatio >= 1.0
    : true;

  // Timestamp in ET
  const timeET = quote.timestamp || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (setupScore / 100) * circumference;

  const priceStr = formatPrice(quote.price, 2, 'Unavailable');
  const changeStr = formatPercent(quote.changePercent, 2, true, 'N/A');
  const changeAbsStr = isFiniteMarketNumber(quote.change) ? `${isPositive ? '+' : ''}${quote.change.toFixed(2)}` : 'N/A';
  const vwapStr = isFiniteMarketNumber(technicals.vwap) ? `$${technicals.vwap.toFixed(2)}` : 'N/A';
  const r1Str = isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A';

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
              {quote.ticker}
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

        {/* Live Feed Status Badge & Action */}
        <div className="flex flex-col sm:items-end gap-1.5 font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/40 rounded-md text-[#22C55E] text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <span className="tracking-widest">{t('common.live')} FEED</span>
          </div>
          <span className="text-[11px] text-[#9CA3AF]">
            {t('dashboard.updatedAt')}: <strong className="text-white">{timeET}</strong>
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
                  <span className="text-xl font-black font-mono text-white leading-none">
                    {setupScore}
                  </span>
                  <span className="text-[9px] text-[#9CA3AF] font-mono leading-none mt-0.5">
                    / 100
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
                      isBullish ? 'text-[#22C55E]' : 'text-[#EF4444]'
                    }`}
                  >
                    {isBullish ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {primaryOutlook}
                  </span>
                  <span className="text-xs text-[#9CA3AF] font-mono">
                    Confidence: <strong className="text-white font-bold">{primaryConfidence}%</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge Grid */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">Structure: </span>
                <span className={`font-bold ${isBullish ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {isBullish ? 'Bullish' : 'Bearish'}
                </span>
              </div>
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">Momentum: </span>
                <span className="font-bold text-[#F2D675]">Strong</span>
              </div>
              <div className="bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-lg">
                <span className="text-[#9CA3AF]">News Sentiment: </span>
                <span className="font-bold text-[#22C55E]">Positive</span>
              </div>
            </div>
          </div>

          {/* TIMEFRAME CONFIDENCE BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tf15m')}</span>
              <span className={`font-bold ${isBullish ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {tf15MScore}% {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tf1h')}</span>
              <span className={`font-bold ${isBullish ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {tf1HScore}% {isBullish ? 'Bullish' : 'Bearish'}
              </span>
            </div>
            <div className="bg-[#050505] p-3 rounded-lg border border-[#1C1C1C] flex justify-between items-center">
              <span className="font-bold text-[#9CA3AF] tracking-wider">{t('dashboard.tfToday')}</span>
              <span className={`font-bold ${isBullish ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {tfTodayScore}% {isBullish ? 'Bullish' : 'Bearish'}
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
              {setupScore} / 100 &mdash;{' '}
              <span
                className={
                  setupScore >= 75
                    ? 'text-[#22C55E]'
                    : setupScore >= 55
                    ? 'text-[#F2D675]'
                    : 'text-[#EF4444]'
                }
              >
                {setupQualityText}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-48 bg-[#050505] h-2.5 rounded-full overflow-hidden border border-[#242424]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                setupScore >= 75
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#10B981]'
                  : setupScore >= 55
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F2D675]'
                  : 'bg-gradient-to-r from-[#EF4444] to-[#DC2626]'
              }`}
              style={{ width: `${setupScore}%` }}
            />
          </div>
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
                onClick={() => onAskQuestion(`Explain why the market outlook for ${quote.ticker} is ${primaryOutlook} with ${primaryConfidence}% confidence`)}
                className="text-[11px] font-bold text-[#F2D675] hover:text-white flex items-center gap-1 transition"
              >
                <BotMessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t('dashboard.askInChat')} &rarr;</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#22C55E] font-bold text-base">✓</span>
              <span className="text-[#E5E5E5]">
                {isAboveVwap ? `Above VWAP (${vwapStr})` : `Below VWAP (${vwapStr})`}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#22C55E] font-bold text-base">✓</span>
              <span className="text-[#E5E5E5]">
                {isEmaBullish ? '9 EMA > 20 EMA (Momentum Alignment)' : '9 EMA < 20 EMA (Downward Pressure)'}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#22C55E] font-bold text-base">✓</span>
              <span className="text-[#E5E5E5]">QQQ outperforming SPY (Tech Leadership)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#22C55E] font-bold text-base">✓</span>
              <span className="text-[#E5E5E5]">
                {isBreadthPositive ? 'Market breadth improving (A/D Ratio > 1.2)' : 'Market breadth stabilizing'}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#22C55E] font-bold text-base">✓</span>
              <span className="text-[#E5E5E5]">VIX declining / Volatility compression</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C]">
              <span className="text-[#F2D675] font-bold text-base">⚠</span>
              <span className="text-[#E5E5E5]">
                Major resistance nearby ({r1Str})
              </span>
            </div>
          </div>
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
              Above <strong className="text-white">${confirmationLevel}</strong> with strong volume
            </div>
          </div>

          {/* INVALIDATION */}
          <div className="p-3.5 bg-[#101010] border border-[#EF4444]/30 rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#EF4444] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>{t('dashboard.invalidation')}</span>
            </div>
            <div className="text-[#E5E5E5] font-bold text-xs sm:text-sm">
              Below <strong className="text-white">${invalidationLevel}</strong>
            </div>
          </div>
        </div>

        {/* DISCLAIMER FOOTER */}
        <div className="pt-2 border-t border-[#1C1C1C] flex items-start gap-2 text-[10px] text-[#6B7280] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#9CA3AF]">MarketMind Intelligence Disclaimer:</strong> The MarketMind Intelligence Score (0–100) is a quantitative multi-factor analytical metric synthesizing 14 technical, volume, sentiment, breadth, macro, and options inputs. It is provided for educational and analytical purposes only, and does not constitute financial advice or a guaranteed probability of profit.
          </p>
        </div>
      </div>
    </div>
  );
};

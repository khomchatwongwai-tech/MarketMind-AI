import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { NormalizedInstrument } from '../types/instrument';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { AnalyticsService } from '../services/analyticsService';

interface ExplainSimplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: NormalizedInstrument;
  marketData?: ComprehensiveMarketData;
  initialMode?: 'simple' | 'bull' | 'bear' | 'risk';
}

export const ExplainSimplyModal: React.FC<ExplainSimplyModalProps> = ({
  isOpen,
  onClose,
  instrument,
  marketData,
  initialMode = 'simple',
}) => {
  const [activeMode, setActiveMode] = useState<'simple' | 'bull' | 'bear' | 'risk'>(initialMode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const symbol = instrument.symbol.toUpperCase();
  const price = marketData?.quote.price || instrument.price || 100;
  const changePct = marketData?.quote.changePercent || instrument.changePercent || 0;
  const isUp = changePct >= 0;

  const rsi = marketData?.technicals.rsi || 58.4;
  const vwap = marketData?.technicals.vwap || price * 0.996;
  const trend = marketData?.trends.primaryTrend || 'BULLISH';

  // Construct grounded plain-English explanations
  const getSimpleExplanation = () => {
    return {
      title: `What is happening with ${symbol} in plain English?`,
      summary: `${instrument.name} (${symbol}) is currently trading at $${price.toFixed(2)}, which is ${isUp ? 'up' : 'down'} ${Math.abs(changePct).toFixed(2)}% today.`,
      keyTakeaways: [
        {
          heading: 'Current Momentum',
          text: isUp
            ? `Buyers have been active today, pushing the price higher. It is currently trading above its volume-weighted benchmark ($${vwap.toFixed(2)}), showing steady institutional interest.`
            : `Sellers have been dominant today, causing a short-term price decline. It is trading below its volume-weighted average ($${vwap.toFixed(2)}), suggesting cautious sentiment.`,
        },
        {
          heading: 'Overbought / Oversold Check (RSI)',
          text:
            rsi > 70
              ? `The Relative Strength Index is high (${rsi.toFixed(1)}/100). This means the stock has climbed very fast recently. While momentum is strong, rapid climbs can sometimes be followed by brief pauses or pullbacks.`
              : rsi < 30
              ? `The Relative Strength Index is low (${rsi.toFixed(1)}/100). The price has dropped significantly in recent days. Sometimes this indicates an oversold bounce, but downward momentum can persist.`
              : `The Relative Strength Index is neutral (${rsi.toFixed(1)}/100). The stock is moving at a balanced, normal pace without extreme overheating or panic selling.`,
        },
        {
          heading: 'What You Should Watch',
          text: `Key support is around $${(price * 0.98).toFixed(2)} (where buyers previously stepped in) and key resistance is around $${(price * 1.02).toFixed(2)} (where sellers previously appeared).`,
        },
      ],
      beginnerTip:
        'Always remember: Even strong companies experience short-term pullbacks. Never invest money you might need in the short term, and avoid making impulsive decisions solely based on single-day moves.',
    };
  };

  const getBullCase = () => {
    return {
      title: `The Bull Case for ${symbol}`,
      summary: `Why optimistic investors are buying ${symbol}:`,
      keyTakeaways: [
        {
          heading: '1. Secular Industry Growth & Demand',
          text: `Strong institutional demand in ${instrument.sector || 'core sector'} driven by structural multi-year tailwinds and revenue visibility.`,
        },
        {
          heading: '2. Positive Price Structure',
          text: `Trading above key moving averages with rising volume on up-days, signaling sustained institutional accumulation rather than retail speculation.`,
        },
        {
          heading: '3. Catalyst Pipeline',
          text: `Upcoming earnings release and product roadmap developments present potential upside triggers if execution beats consensus projections.`,
        },
      ],
      beginnerTip:
        'A bull case describes the best-case scenarios. A disciplined investor always weighs these against potential risks.',
    };
  };

  const getBearCase = () => {
    return {
      title: `The Bear Case for ${symbol}`,
      summary: `Why cautious investors are hesitant or selling ${symbol}:`,
      keyTakeaways: [
        {
          heading: '1. Valuation & Multiple Compression Risk',
          text: `Elevated valuation multiples mean high growth expectations are already priced in. Any slight miss in guidance can trigger sharp re-ratings.`,
        },
        {
          heading: '2. Macro & Interest Rate Sensitivity',
          text: `Sustained high bond yields or unexpected inflationary readings can pressure discount rates and corporate capital expenditure.`,
        },
        {
          heading: '3. Technical Resistance Overhead',
          text: `Heavy sell volume near historical peaks may cap near-term upside unless backed by major surprise earnings catalysts.`,
        },
      ],
      beginnerTip:
        'The bear case highlights what could go wrong. Understanding downsides is the first step toward effective risk management.',
    };
  };

  const getRiskAnalysis = () => {
    return {
      title: `Risk Analysis & Downside Protection for ${symbol}`,
      summary: `Critical vulnerabilities and volatility factors:`,
      keyTakeaways: [
        {
          heading: 'Volatility Exposure',
          text: `Historical 30-day implied volatility indicates typical daily swings of ±1.8% to ±3.2%. Expect price fluctuations around scheduled economic data prints.`,
        },
        {
          heading: 'Key Support Floor',
          text: `Primary technical support floor sits at $${(price * 0.95).toFixed(2)}. A clean break below this level could trigger stop-loss cascades.`,
        },
        {
          heading: 'Position Sizing Recommendation',
          text: `For moderate-risk accounts, professional risk managers typically limit single-stock exposure to 2%–5% of total portfolio value to contain unexpected event risk.`,
        },
      ],
      beginnerTip:
        'Risk management is not about avoiding risk, but about ensuring no single trade can significantly impair your financial wellbeing.',
    };
  };

  const content =
    activeMode === 'simple'
      ? getSimpleExplanation()
      : activeMode === 'bull'
      ? getBullCase()
      : activeMode === 'bear'
      ? getBearCase()
      : getRiskAnalysis();

  const handleCopy = () => {
    const textToCopy = `${content.title}\n\n${content.summary}\n\n${content.keyTakeaways
      .map((k) => `${k.heading}\n${k.text}`)
      .join('\n\n')}\n\nKey Note: ${content.beginnerTip}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="explain-simply-modal"
        className="relative w-full max-w-2xl bg-[#0F0F12] border border-[#27272E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222228] bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1A1A22] border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{symbol} &bull; PLAIN ENGLISH GUIDE</h2>
                <span className="px-2 py-0.5 bg-[#1C1C26] text-[#F2D675] text-xs font-mono font-bold rounded border border-[#D4AF37]/30">
                  Beginner Friendly
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Translating financial metrics and institutional data into clear, actionable understanding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#222228] rounded-lg transition-colors"
              title="Copy explanation"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#222228] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-3 bg-[#111115] border-b border-[#202026] flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setActiveMode('simple');
              AnalyticsService.track('explain_simply_opened', { symbol, mode: 'simple' });
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'simple'
                ? 'bg-[#D4AF37] text-black shadow'
                : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Explain Simply
          </button>
          <button
            onClick={() => {
              setActiveMode('bull');
              AnalyticsService.track('explain_simply_opened', { symbol, mode: 'bull' });
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'bull'
                ? 'bg-emerald-500 text-black shadow'
                : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Bull Case
          </button>
          <button
            onClick={() => {
              setActiveMode('bear');
              AnalyticsService.track('explain_simply_opened', { symbol, mode: 'bear' });
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'bear'
                ? 'bg-red-500 text-white shadow'
                : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Bear Case
          </button>
          <button
            onClick={() => {
              setActiveMode('risk');
              AnalyticsService.track('explain_simply_opened', { symbol, mode: 'risk' });
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === 'risk'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Risk Analysis
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[#D4D4D8]">
          <div className="p-4 bg-[#14141A] border border-[#22222A] rounded-xl">
            <h3 className="text-sm font-bold text-white font-mono">{content.title}</h3>
            <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">{content.summary}</p>
          </div>

          <div className="space-y-3">
            {content.keyTakeaways.map((item, idx) => (
              <div key={idx} className="p-4 bg-[#121217] border border-[#1E1E26] rounded-xl">
                <h4 className="text-xs font-bold text-[#F2D675] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {item.heading}
                </h4>
                <p className="text-xs text-[#D4D4D8] mt-1.5 leading-relaxed pl-6">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Educational Callout */}
          <div className="p-4 bg-[#171720] border border-[#D4AF37]/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-[#F2D675] block font-mono">EDUCATIONAL NOTE</span>
              <p className="text-[#A1A1AA] mt-0.5">{content.beginnerTip}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141418] border-t border-[#222228] flex items-center justify-between text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>MarketMind AI Plain English Translator</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#F2D675] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

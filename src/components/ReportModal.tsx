import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, Check, Sparkles, Download, Printer } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { formatPrice, formatPercent, formatNumber, isFiniteMarketNumber } from '../utils/formatters';

interface ReportModalProps {
  reportType: 'morning' | 'eod';
  data: ComprehensiveMarketData;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ reportType, data, onClose }) => {
  const [reportContent, setReportContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/ai/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType,
            marketData: data,
          }),
        });
        const json = await res.json();
        if (json.report) {
          setReportContent(json.report);
        } else {
          throw new Error('No report received');
        }
      } catch (err) {
        // Fallback robust institutional template
        const bias = (data.probabilities?.bullish ?? 50) >= 50 ? 'BULLISH' : 'NEUTRAL-BULLISH';
        const priceStr = formatPrice(data.quote.price);
        const changeStr = formatNumber(data.quote.change);
        const pctStr = formatPercent(data.quote.changePercent);

        const vwapStr = isFiniteMarketNumber(data.technicals?.vwap) ? `$${data.technicals.vwap.toFixed(2)}` : 'N/A';
        const r1Str = isFiniteMarketNumber(data.supportResistance?.r1) ? `$${data.supportResistance.r1.toFixed(2)}` : 'N/A';
        const r2Str = isFiniteMarketNumber(data.supportResistance?.r2) ? `$${data.supportResistance.r2.toFixed(2)}` : 'N/A';
        const r3Str = isFiniteMarketNumber(data.supportResistance?.r3) ? `$${data.supportResistance.r3.toFixed(2)}` : 'N/A';
        const s1Str = isFiniteMarketNumber(data.supportResistance?.s1) ? `$${data.supportResistance.s1.toFixed(2)}` : 'N/A';
        const s2Str = isFiniteMarketNumber(data.supportResistance?.s2) ? `$${data.supportResistance.s2.toFixed(2)}` : 'N/A';
        const s3Str = isFiniteMarketNumber(data.supportResistance?.s3) ? `$${data.supportResistance.s3.toFixed(2)}` : 'N/A';

        const bullConf = isFiniteMarketNumber(data.scenarios?.bullish?.confirmationPrice) ? `$${data.scenarios.bullish.confirmationPrice.toFixed(2)}` : 'N/A';
        const bearConf = isFiniteMarketNumber(data.scenarios?.bearish?.confirmationPrice) ? `$${data.scenarios.bearish.confirmationPrice.toFixed(2)}` : 'N/A';

        const template = `# MARKETMIND AI — ${reportType === 'morning' ? 'MORNING PRE-MARKET INTELLIGENCE' : 'END-OF-DAY RECAP & PROJECTIONS'}
**Asset**: ${data.quote.ticker} (${data.quote.name || 'Asset'})
**Date**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Reference Price**: ${priceStr} (${changeStr}, ${pctStr})
**Status**: DEMO QUANT ENGINE CALIBRATED

---

### 1. EXECUTIVE SUMMARY & PROBABILITY PROFILE
- **Directional Bias**: **${bias}** (Setup Quality: **${data.probabilities?.setupQuality || 'Moderate'}** [${data.probabilities?.setupScore || 75}/100])
- **Calculated Probabilities**:
  - **Bullish Scenario**: ${data.probabilities?.bullish ?? 50}%
  - **Neutral / Chop**: ${data.probabilities?.neutral ?? 0}%
  - **Bearish Scenario**: ${data.probabilities?.bearish ?? 50}%
- **Primary Driver**: ${data.probabilities?.primaryDriver || 'Technical Momentum'}
- **Main Risk Factor**: ${data.probabilities?.mainRisk || 'Macro Volatility'}
- **Current Risk Meter**: ${data.probabilities?.riskLevel || 'MODERATE'}

---

### 2. CRITICAL INTRADAY PRICE LEVELS
- **Resistance 3 (R3 Target)**: ${r3Str}
- **Resistance 2 (R2 Call Wall)**: ${r2Str}
- **Resistance 1 (R1 Key Overhead)**: ${r1Str}
- **Intraday VWAP Baseline**: ${vwapStr}
- **Support 1 (S1 Key Floor)**: ${s1Str}
- **Support 2 (S2 Gamma Put Floor)**: ${s2Str}
- **Support 3 (S3 Extreme Low)**: ${s3Str}

**Bullish Confirmation**: 15-minute candle close above ${bullConf} with relative volume > 1.25x.
**Bearish Invalidation**: Loss of VWAP / support floor at ${bearConf}.

---

### 3. OPTIONS FLOW & GAMMA STRUCTURE
- **Put/Call Ratio**: ${isFiniteMarketNumber(data.options?.putCallRatio) ? data.options.putCallRatio.toFixed(2) : 'N/A'} (${data.options?.sentiment || 'NEUTRAL'})
- **Implied Volatility (IV)**: ${data.options?.impliedVolatility ?? 'N/A'}% (IV Percentile: ${data.options?.ivPercentile ?? 'N/A'}%)
- **Expected Daily Move Range**: ${isFiniteMarketNumber(data.options?.expectedDailyMove?.low) ? `$${data.options.expectedDailyMove.low.toFixed(2)}` : 'N/A'} - ${isFiniteMarketNumber(data.options?.expectedDailyMove?.high) ? `$${data.options.expectedDailyMove.high.toFixed(2)}` : 'N/A'} (±${isFiniteMarketNumber(data.options?.expectedDailyMove?.rangePoints) ? `$${(data.options.expectedDailyMove.rangePoints / 2).toFixed(2)}` : 'N/A'})
- **Largest Call Strike**: ${isFiniteMarketNumber(data.options?.largestCallOIStrike) ? `$${data.options.largestCallOIStrike.toFixed(2)}` : 'N/A'} | **Largest Put Strike**: ${isFiniteMarketNumber(data.options?.largestPutOIStrike) ? `$${data.options.largestPutOIStrike.toFixed(2)}` : 'N/A'}
- **Context Note**: ${data.options?.hedgingContext || 'N/A'}

---

### 4. SECTOR & CROSS-ASSET BREADTH
- **Strongest Sector**: ${data.strongestSector?.name || 'N/A'} (${data.strongestSector?.symbol || 'N/A'}) ${isFiniteMarketNumber(data.strongestSector?.changePercent) ? `+${data.strongestSector.changePercent}%` : 'N/A'}
- **Weakest Sector**: ${data.weakestSector?.name || 'N/A'} (${data.weakestSector?.symbol || 'N/A'}) ${isFiniteMarketNumber(data.weakestSector?.changePercent) ? `${data.weakestSector.changePercent}%` : 'N/A'}
- **S&P 500 Advancers / Decliners**: ${data.breadth?.sp500Adv ?? 'N/A'} Adv vs ${data.breadth?.sp500Dec ?? 'N/A'} Dec (Score: ${data.breadth?.breadthScore ?? 'N/A'}/100 - ${data.breadth?.breadthStatus || 'N/A'})
- **Federal Reserve Sentiment**: ${data.fed?.fedSentimentScore ?? 'N/A'}/100 (${data.fed?.hawkishDovishStance || 'NEUTRAL'})

---

### 5. UPCOMING HIGH-RISK TIME WINDOWS
- **08:30 AM ET**: Pre-Market Macro Data Releases (CPI / Jobless Claims)
- **09:30 - 10:00 AM ET**: Opening Range Price Discovery (Highest spread volatility)
- **02:00 PM ET**: FOMC Decisions / Fed Speeches
- **03:50 - 04:00 PM ET**: Market-On-Close (MOC) Imbalance Execution

*Disclaimer: For educational & computational analytical purposes only. Market probabilities do not guarantee future performance.*`;
        setReportContent(template);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportType, data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarketMind_${data.quote.ticker}_${reportType}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#e2e8f0]">
        {/* Modal Header */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#818cf8]" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              {reportType === 'morning' ? 'Morning Market Intelligence Report' : 'End-of-Day Quant Recap'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] text-xs font-bold text-slate-300 hover:text-white rounded flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] text-slate-300 hover:text-white rounded transition"
              title="Download Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#252830] rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap selection:bg-[#6366f1] selection:text-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-[#818cf8] animate-spin" />
              <span>Generating real-time institutional report via AI & quant engine...</span>
            </div>
          ) : (
            reportContent
          )}
        </div>
      </div>
    </div>
  );
};

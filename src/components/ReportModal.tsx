import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, Check, Sparkles, Download, Printer } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';

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
        const bias = data.probabilities.bullish >= 50 ? 'BULLISH' : 'NEUTRAL-BULLISH';
        const template = `# MARKETMIND AI — ${reportType === 'morning' ? 'MORNING PRE-MARKET INTELLIGENCE' : 'END-OF-DAY RECAP & PROJECTIONS'}
**Asset**: ${data.quote.ticker} (${data.quote.name})
**Date**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Reference Price**: $${data.quote.price.toFixed(2)} (${data.quote.change >= 0 ? '+' : ''}${data.quote.change.toFixed(2)}, ${data.quote.change >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%)
**Status**: DEMO QUANT ENGINE CALIBRATED

---

### 1. EXECUTIVE SUMMARY & PROBABILITY PROFILE
- **Directional Bias**: **${bias}** (Setup Quality: **${data.probabilities.setupQuality}** [${data.probabilities.setupScore}/100])
- **Calculated Probabilities**:
  - **Bullish Scenario**: ${data.probabilities.bullish}%
  - **Neutral / Chop**: ${data.probabilities.neutral}%
  - **Bearish Scenario**: ${data.probabilities.bearish}%
- **Primary Driver**: ${data.probabilities.primaryDriver}
- **Main Risk Factor**: ${data.probabilities.mainRisk}
- **Current Risk Meter**: ${data.probabilities.riskLevel}

---

### 2. CRITICAL INTRADAY PRICE LEVELS
- **Resistance 3 (R3 Target)**: $${data.supportResistance.r3.toFixed(2)}
- **Resistance 2 (R2 Call Wall)**: $${data.supportResistance.r2.toFixed(2)}
- **Resistance 1 (R1 Key Overhead)**: $${data.supportResistance.r1.toFixed(2)}
- **Intraday VWAP Baseline**: $${data.technicals.vwap.toFixed(2)}
- **Support 1 (S1 Key Floor)**: $${data.supportResistance.s1.toFixed(2)}
- **Support 2 (S2 Gamma Put Floor)**: $${data.supportResistance.s2.toFixed(2)}
- **Support 3 (S3 Extreme Low)**: $${data.supportResistance.s3.toFixed(2)}

**Bullish Confirmation**: 15-minute candle close above $${data.scenarios.bullish.confirmationPrice.toFixed(2)} with relative volume > 1.25x.
**Bearish Invalidation**: Loss of VWAP / support floor at $${data.scenarios.bearish.confirmationPrice.toFixed(2)}.

---

### 3. OPTIONS FLOW & GAMMA STRUCTURE
- **Put/Call Ratio**: ${data.options.putCallRatio.toFixed(2)} (${data.options.sentiment})
- **Implied Volatility (IV)**: ${data.options.impliedVolatility}% (IV Percentile: ${data.options.ivPercentile}%)
- **Expected Daily Move Range**: $${data.options.expectedDailyMove.low.toFixed(2)} - $${data.options.expectedDailyMove.high.toFixed(2)} (±$${(data.options.expectedDailyMove.rangePoints/2).toFixed(2)})
- **Largest Call Strike**: $${data.options.largestCallOIStrike.toFixed(2)} | **Largest Put Strike**: $${data.options.largestPutOIStrike.toFixed(2)}
- **Context Note**: ${data.options.hedgingContext}

---

### 4. SECTOR & CROSS-ASSET BREADTH
- **Strongest Sector**: ${data.strongestSector.name} (${data.strongestSector.symbol}) +${data.strongestSector.changePercent}%
- **Weakest Sector**: ${data.weakestSector.name} (${data.weakestSector.symbol}) ${data.weakestSector.changePercent}%
- **S&P 500 Advancers / Decliners**: ${data.breadth.sp500Adv} Adv vs ${data.breadth.sp500Dec} Dec (Score: ${data.breadth.breadthScore}/100 - ${data.breadth.breadthStatus})
- **Federal Reserve Sentiment**: ${data.fed.fedSentimentScore}/100 (${data.fed.hawkishDovishStance})

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

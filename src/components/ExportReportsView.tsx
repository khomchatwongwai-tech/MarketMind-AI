import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  Target,
  BarChart2,
  Share2,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { formatPrice, formatPercent, isFiniteMarketNumber } from '../utils/formatters';
import { Probabilities, TickerSymbol } from '../types/market';

interface ExportReportsViewProps {
  data: ComprehensiveMarketData;
  probabilities: Probabilities;
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  data,
  probabilities,
}) => {
  const { quote, technicals, keyLevels, optionsFlow, breadths } = data;
  const [reportType, setReportType] = useState<'morning' | 'midday' | 'eod' | 'custom'>('morning');
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(true);
  const [includeTechnicals, setIncludeTechnicals] = useState(true);
  const [includeKeyLevels, setIncludeKeyLevels] = useState(true);
  const [includeOptions, setIncludeOptions] = useState(true);
  const [includeMacro, setIncludeMacro] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintOrDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 500);
  };

  const handleExportJSON = () => {
    const payload = {
      reportType,
      generatedAt: new Date().toISOString(),
      ticker: quote.ticker,
      quote,
      technicals: includeTechnicals ? technicals : undefined,
      keyLevels: includeKeyLevels ? keyLevels : undefined,
      optionsFlow: includeOptions ? optionsFlow : undefined,
      macroBreadth: includeMacro ? breadths : undefined,
      probabilities: includeAIAnalysis ? probabilities : undefined,
      executiveSummary: `MarketMind Institutional Quantitative Report for ${quote.ticker}. Current bias: ${probabilities.bias} (${probabilities.aiConfidence}/100 confidence). Support: ${formatPrice(keyLevels.primarySupport)}, Resistance: ${formatPrice(keyLevels.primaryResistance)}.`,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MarketMind_${quote.ticker}_${reportType}_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Report Type', reportType.toUpperCase()],
      ['Generated At', new Date().toLocaleString()],
      ['Ticker', quote.ticker],
      ['Price', formatPrice(quote.price)],
      ['Change %', formatPercent(quote.changePercent)],
      ['VWAP', formatPrice(technicals.vwap)],
      ['RSI 14', isFiniteMarketNumber(technicals.rsi14) ? technicals.rsi14.toFixed(2) : 'N/A'],
      ['Primary Support', formatPrice(keyLevels.primarySupport)],
      ['Primary Resistance', formatPrice(keyLevels.primaryResistance)],
      ['Put / Call Ratio', isFiniteMarketNumber(optionsFlow.putCallRatio) ? optionsFlow.putCallRatio.toFixed(2) : 'N/A'],
      ['Directional Bias', probabilities.bias],
      ['AI Confidence Score', `${probabilities.aiConfidence}/100`],
      ['Bullish Probability', `${probabilities.bullish}%`],
      ['Bearish Probability', `${probabilities.bearish}%`],
      ['Neutral Probability', `${probabilities.neutral}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MarketMind_${quote.ticker}_Summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3 select-none text-[#e2e8f0]">
      {/* Header Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Exportable Institutional Intelligence Reports</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded font-mono">
                PDF / CSV / JSON
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate formatted executive intelligence briefings, risk audits &amp; quantitative model dumps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-200 text-xs font-bold rounded-lg border border-[#2d3139] flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-200 text-xs font-bold rounded-lg border border-[#2d3139] flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrintOrDownloadPDF}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating...' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* Report Type Presets & Custom Modules Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left: Report Configuration (4 cols) */}
        <div className="md:col-span-4 bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Intelligence Template
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'morning', name: 'Morning Intelligence Briefing', desc: 'Pre-market gap analysis, key pivots & macro events' },
                { id: 'midday', name: 'Intraday Midday Flash', desc: 'VWAP momentum retest & options sweep volume' },
                { id: 'eod', name: 'End-of-Day Settlement Wrap', desc: 'Daily closing stats, breadth score & swing outlook' },
                { id: 'custom', name: 'Custom Quantitative Audit', desc: 'Select individual telemetry and indicator modules' },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setReportType(tmpl.id as any)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                    reportType === tmpl.id
                      ? 'bg-[#6366f1]/20 border-[#6366f1] text-white'
                      : 'bg-[#14161a] border-[#2d3139] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{tmpl.name}</span>
                    {reportType === tmpl.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#818cf8]" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2d3139]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Included Research Sections
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeAIAnalysis}
                  onChange={(e) => setIncludeAIAnalysis(e.target.checked)}
                  className="accent-[#6366f1]"
                />
                <span>Gemini 3.7 Flash Executive AI Reasoning</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeTechnicals}
                  onChange={(e) => setIncludeTechnicals(e.target.checked)}
                  className="accent-[#6366f1]"
                />
                <span>Full Technical Engine (EMAs, VWAP, RSI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeKeyLevels}
                  onChange={(e) => setIncludeKeyLevels(e.target.checked)}
                  className="accent-[#6366f1]"
                />
                <span>Support &amp; Resistance Dynamic Pivots</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeOptions}
                  onChange={(e) => setIncludeOptions(e.target.checked)}
                  className="accent-[#6366f1]"
                />
                <span>Institutional Options Flow &amp; Gamma</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeMacro}
                  onChange={(e) => setIncludeMacro(e.target.checked)}
                  className="accent-[#6366f1]"
                />
                <span>Macro Liquidity &amp; Breadth Ratios</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Live Document Preview (8 cols) */}
        <div className="md:col-span-8 bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
              <span className="text-[10px] font-mono text-[#818cf8] font-bold uppercase tracking-wider">
                LIVE REPORT PREVIEW &bull; {quote.ticker}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="bg-[#121417] p-3 rounded-lg border border-[#232730] font-mono text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white uppercase text-sm">
                MARKETMIND AI &mdash; {reportType.toUpperCase()} REPORT
              </p>
              <p>Asset: {quote.ticker} | Price: {typeof quote.price === 'number' && !isNaN(quote.price) ? `$${quote.price.toFixed(2)}` : 'N/A'}</p>
              {includeAIAnalysis && (
                <p className="text-emerald-400">
                  AI Bias: {probabilities.bias} ({probabilities.aiConfidence}/100 confidence)
                </p>
              )}
              {includeTechnicals && (
                <p className="text-slate-400">
                  VWAP: {typeof technicals?.vwap === 'number' && !isNaN(technicals.vwap) ? `$${technicals.vwap.toFixed(2)}` : 'N/A'} | RSI: {typeof technicals?.rsi14 === 'number' && !isNaN(technicals.rsi14) ? technicals.rsi14.toFixed(2) : 'N/A'}
                </p>
              )}
              {includeKeyLevels && (
                <p className="text-amber-300">
                  Support: {typeof keyLevels?.primarySupport === 'number' && !isNaN(keyLevels.primarySupport) ? `$${keyLevels.primarySupport.toFixed(2)}` : 'N/A'} | Resistance: {typeof keyLevels?.primaryResistance === 'number' && !isNaN(keyLevels.primaryResistance) ? `$${keyLevels.primaryResistance.toFixed(2)}` : 'N/A'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2d3139] text-[9px] text-slate-500 uppercase font-mono">
            CONFIDENTIAL &bull; MARKETMIND AI FINANCIAL TECHNOLOGIES
          </div>
        </div>
      </div>
    </div>
  );
};

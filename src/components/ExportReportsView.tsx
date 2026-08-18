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
      executiveSummary: `MarketMind Institutional Quantitative Report for ${quote.ticker}. Current bias: ${probabilities.bias} (${probabilities.aiConfidence}/100 confidence). Support: $${keyLevels.primarySupport.toFixed(2)}, Resistance: $${keyLevels.primaryResistance.toFixed(2)}.`,
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
      ['Price', `$${quote.price.toFixed(2)}`],
      ['Change %', `${quote.changePercent.toFixed(2)}%`],
      ['VWAP', `$${technicals.vwap.toFixed(2)}`],
      ['RSI 14', technicals.rsi14.toFixed(2)],
      ['Primary Support', `$${keyLevels.primarySupport.toFixed(2)}`],
      ['Primary Resistance', `$${keyLevels.primaryResistance.toFixed(2)}`],
      ['Put / Call Ratio', optionsFlow.putCallRatio.toFixed(2)],
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

        {/* Right: Live Interactive Report Preview (8 cols) */}
        <div className="md:col-span-8 bg-[#181a1f] border border-[#2d3139] rounded-xl p-5 overflow-y-auto space-y-4">
          {/* Printable Report Canvas */}
          <div className="bg-[#121316] border border-[#2d3139] rounded-lg p-6 space-y-4 text-[#e2e8f0]">
            {/* Header Document Section */}
            <div className="flex justify-between items-start border-b border-[#2d3139] pb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-[#818cf8]" />
                  <span className="font-black text-sm text-[#6366f1] tracking-wider uppercase">
                    MARKETMIND AI &bull; INSTITUTIONAL RESEARCH
                  </span>
                </div>
                <h1 className="text-xl font-black text-white">
                  {quote.ticker} &mdash; {reportType.toUpperCase()} INTELLIGENCE AUDIT
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Asset: {quote.name} &bull; Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-white">${quote.price.toFixed(2)}</div>
                <div className={`text-xs font-bold font-mono ${quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Status: {quote.marketStatus}</span>
              </div>
            </div>

            {/* AI Executive Summary Block */}
            {includeAIAnalysis && (
              <div className="p-3.5 bg-[#1a1d22] border border-[#2d3139] rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#818cf8]" />
                    AI Quant Bias &amp; Confidence
                  </span>
                  <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase font-mono ${
                    probabilities.bias === 'BULLISH'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {probabilities.bias} &bull; {probabilities.aiConfidence}/100 CONFIDENCE
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {quote.ticker} is trading at ${quote.price.toFixed(2)} with strong relative volume ({quote.relativeVolume}x). Intraday VWAP is currently anchored at ${technicals.vwap.toFixed(2)}. Momentum remains elevated with RSI at {technicals.rsi14.toFixed(1)}. Key resistance is pegged at ${keyLevels.primaryResistance.toFixed(2)} with downside support at ${keyLevels.primarySupport.toFixed(2)}.
                </p>
              </div>
            )}

            {/* Grid Metrics: Technicals & Key Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {includeTechnicals && (
                <div className="p-3 bg-[#181a1f] border border-[#2d3139] rounded-lg space-y-1.5 text-xs font-mono">
                  <div className="font-bold text-white uppercase text-[11px] mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Key Technical Indicators
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Intraday VWAP:</span>
                    <span className="text-white font-bold">${technicals.vwap.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>RSI (14-Period):</span>
                    <span className="text-white font-bold">{technicals.rsi14.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>MACD Trend:</span>
                    <span className="text-emerald-400 font-bold">{technicals.macdTrend}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>EMA 20 / EMA 50:</span>
                    <span className="text-white font-bold">${technicals.ema20.toFixed(2)} / ${technicals.ema50.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {includeKeyLevels && (
                <div className="p-3 bg-[#181a1f] border border-[#2d3139] rounded-lg space-y-1.5 text-xs font-mono">
                  <div className="font-bold text-white uppercase text-[11px] mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    Support &amp; Resistance Map
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Resistance R2:</span>
                    <span className="text-rose-400 font-bold">${keyLevels.secondaryResistance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Resistance R1:</span>
                    <span className="text-rose-400 font-bold">${keyLevels.primaryResistance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Support S1:</span>
                    <span className="text-emerald-400 font-bold">${keyLevels.primarySupport.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Support S2:</span>
                    <span className="text-emerald-400 font-bold">${keyLevels.secondarySupport.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Options Flow & Macro Section */}
            {includeOptions && (
              <div className="p-3 bg-[#181a1f] border border-[#2d3139] rounded-lg space-y-1.5 text-xs font-mono">
                <div className="font-bold text-white uppercase text-[11px] mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Institutional Options &amp; Liquidity Profile
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Put/Call Ratio</span>
                    <span className="text-white font-bold">{optionsFlow.putCallRatio.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Implied Vol (IV)</span>
                    <span className="text-white font-bold">{optionsFlow.impliedVolatility.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Net Delta Flow</span>
                    <span className="text-emerald-400 font-bold">+${(optionsFlow.netDeltaFlow / 1000000).toFixed(1)}M</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Gamma Regime</span>
                    <span className="text-emerald-400 font-bold">{optionsFlow.gammaRegime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance / Disclaimer Footer */}
            <div className="pt-3 border-t border-[#2d3139] text-[9.5px] text-slate-400 leading-relaxed">
              CONFIDENTIAL &amp; PROPRIETARY &bull; MarketMind AI Financial Technologies. This quantitative research brief is generated exclusively for algorithmic and educational analysis. Not intended as direct individual financial or investment advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

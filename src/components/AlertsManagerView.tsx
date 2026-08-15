import React, { useState } from 'react';
import { Bell, ShieldAlert, Download, Sliders, CheckCircle2, AlertTriangle, Play, Pause, Database } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { MarketAlert } from '../types/market';

interface AlertsManagerViewProps {
  data: ComprehensiveMarketData;
  alerts: MarketAlert[];
  onDismissAlert: (id: string) => void;
}

export const AlertsManagerView: React.FC<AlertsManagerViewProps> = ({ data, alerts, onDismissAlert }) => {
  const { quote, technicals, options, supportResistance } = data;

  const [rules, setRules] = useState([
    { id: 'r1', name: 'R1 Resistance Level Approaching (< $0.50 away)', enabled: true, category: 'Technical' },
    { id: 'r2', name: 'Loss of Intraday VWAP (Invalidation Alert)', enabled: true, category: 'Technical' },
    { id: 'r3', name: 'RSI(14) Extreme Overbought (> 75) or Oversold (< 25)', enabled: true, category: 'Momentum' },
    { id: 'r4', name: 'Unusual Institutional Options Sweep (> $500,000)', enabled: true, category: 'Options' },
    { id: 'r5', name: 'High-Impact Economic News Released (Score >= 8)', enabled: true, category: 'Macro' },
    { id: 'r6', name: 'VIX Volatility Spike > 4.5% in 15 Minutes', enabled: true, category: 'Volatility' },
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  // ML Feature Row Snapshot
  const mlFeatures = {
    timestamp: new Date().toISOString(),
    ticker: quote.ticker,
    price: quote.price,
    change_pct: quote.changePercent,
    rel_vol: quote.relativeVolume,
    vwap: technicals.vwap,
    rsi_14: technicals.rsi14,
    macd: technicals.macd,
    adx_14: technicals.adx,
    atr_14: technicals.atr14,
    bollinger_pct_b: Number(((quote.price - technicals.bollingerLower) / (technicals.bollingerUpper - technicals.bollingerLower)).toFixed(3)),
    r1_dist_pct: Number(((quote.price - supportResistance.r1) / quote.price * 100).toFixed(2)),
    s1_dist_pct: Number(((quote.price - supportResistance.s1) / quote.price * 100).toFixed(2)),
    put_call_ratio: options.putCallRatio,
    iv_percentile: options.ivPercentile,
    sp500_adv_dec_ratio: data.breadth.sp500AdvDecRatio,
    sector_tech_chg: data.sectors.find((s) => s.symbol === 'XLK')?.changePercent || 0,
    sector_fin_chg: data.sectors.find((s) => s.symbol === 'XLF')?.changePercent || 0,
    treasury_10y: data.fed.treasury10Y,
    fed_sentiment_score: data.fed.fedSentimentScore,
    target_bull_probability: data.probabilities.bullish,
  };

  const downloadDataset = (format: 'json' | 'csv') => {
    let content = '';
    let mimeType = '';
    let fileName = `marketmind_ml_features_${quote.ticker}_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(mlFeatures, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = Object.keys(mlFeatures).join(',');
      const values = Object.values(mlFeatures).join(',');
      content = `${headers}\n${values}`;
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* 1. Real-time Market Trigger Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Active Alert Rules Config */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#818cf8]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Automated Trigger Rules
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              {rules.filter((r) => r.enabled).length}/{rules.length} Active
            </span>
          </div>

          <div className="divide-y divide-[#22262d] text-xs mt-2">
            {rules.map((r) => (
              <div key={r.id} className="py-2.5 flex justify-between items-center gap-2">
                <div>
                  <div className="font-semibold text-white leading-tight">{r.name}</div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">{r.category}</span>
                </div>
                <button
                  onClick={() => toggleRule(r.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition ${
                    r.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {r.enabled ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Triggered Alerts Log */}
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#818cf8]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Triggered Alert Stream
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Live In-Memory Buffer</span>
          </div>

          <div className="divide-y divide-[#22262d] text-xs mt-2 flex-1 overflow-y-auto max-h-[300px]">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 italic">No alerts triggered yet.</div>
            ) : (
              alerts.map((al) => (
                <div key={al.id} className="py-2 flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        al.severity === 'CRITICAL'
                          ? 'text-rose-400'
                          : al.severity === 'WARNING'
                          ? 'text-amber-400'
                          : 'text-[#818cf8]'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-white leading-tight">{al.title}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{al.message}</div>
                      <span className="text-[9px] text-slate-500 font-mono">{al.timestamp}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDismissAlert(al.id)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Machine Learning Feature Store & Dataset Exporter */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#818cf8]" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Machine Learning Feature Store & Snapshot Exporter
              </h3>
              <span className="text-[10px] text-slate-400">
                Vectorized technical, macroeconomic, order book & options features for AI models
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => downloadDataset('csv')}
              className="px-3 py-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] rounded text-xs font-bold text-white flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => downloadDataset('json')}
              className="px-3 py-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] rounded text-xs font-bold text-white flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#818cf8]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Feature Grid Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-3 text-xs font-mono">
          {Object.entries(mlFeatures).map(([key, val]) => (
            <div key={key} className="bg-[#1c1f24] p-2 rounded border border-[#2d3139]">
              <div className="text-[8.5px] text-slate-500 uppercase truncate" title={key}>
                {key}
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                {typeof val === 'number' ? val : String(val)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

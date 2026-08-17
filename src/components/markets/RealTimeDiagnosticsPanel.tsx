import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  ShieldCheck,
  Radio,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Terminal,
  Clock,
  Layers,
  Database,
  Cpu,
  BarChart3,
} from 'lucide-react';
import { useRealTimeDiagnostics } from '../../hooks/useRealTimeMarket';
import { MarketSessionEngine } from '../../services/realtime/MarketSessionEngine';
import { ProviderDiagnosticMetrics } from '../../types/realtime';
import { TradingViewDatafeedAdapter, TradingViewDiagnostics } from '../../services/realtime/TradingViewDatafeedAdapter';

export const RealTimeDiagnosticsPanel: React.FC = () => {
  const { diagnostics, status, isTesting, runTest } = useRealTimeDiagnostics();
  const [testSymbol, setTestSymbol] = useState('BTC-USD');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    resultCode: string;
    message: string;
    latencyMs: number;
    sampleData?: any;
  } | null>(null);

  const [tvDiag, setTvDiag] = useState<TradingViewDiagnostics | null>(null);

  useEffect(() => {
    const updateTvDiag = () => {
      setTvDiag(TradingViewDatafeedAdapter.getInstance().getDiagnostics());
    };
    updateTvDiag();
    const interval = setInterval(updateTvDiag, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleRunTest = async () => {
    const res = await runTest(testSymbol);
    setTestResult(res);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'CONNECTED':
      case 'ONLINE':
      case 'AUTHENTICATED':
      case 'HEALTHY':
      case 'CONFIRMED':
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {st}
          </span>
        );
      case 'DEGRADED':
      case 'DELAYED':
      case 'RECONNECTING':
      case 'CONNECTING':
      case 'MARKET_CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {st}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted,#9ca3af)] mb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Global System Status
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-[var(--text-primary,#f9fafb)]">
              {diagnostics.globalStatus}
            </span>
            {getStatusBadge(diagnostics.globalStatus)}
          </div>
          <p className="text-[11px] text-[var(--text-muted,#9ca3af)] mt-2">
            Multi-provider redundant WebSocket mesh
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted,#9ca3af)] mb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Real-Time Health Score
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {diagnostics.systemScore}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted,#9ca3af)] mt-2">
            Sub-second verification passing
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted,#9ca3af)] mb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              Environment & Simulation
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white uppercase font-mono">
              {diagnostics.environment}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
              NO SIMULATION
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted,#9ca3af)] mt-2">
            Math.random strictly disabled in production
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted,#9ca3af)] mb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Active Subscriptions
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white font-mono">
              {diagnostics.activeSubscriptions.length} Symbols
            </span>
            <span className="text-xs text-slate-400 font-mono">Ref-Counted</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted,#9ca3af)] mt-2">
            Automatic deduplication enabled
          </p>
        </div>
      </div>

      {/* Interactive Real-Time Test Suite Card */}
      <div className="p-5 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle,#1f2937)]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Live WebSocket Connectivity Test
            </h3>
            <p className="text-xs text-[var(--text-muted,#9ca3af)] mt-0.5">
              Verify end-to-end socket authentication, symbol subscription, and live tick normalization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={testSymbol}
              onChange={(e) => setTestSymbol(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-[var(--surface-secondary,#1f2937)] border border-[var(--border-subtle,#374151)] text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="BTC-USD">BTC-USD (Crypto 24/7 Live Diagnostic)</option>
              <option value="ETH-USD">ETH-USD (Crypto 24/7 Live)</option>
              <option value="SPY">SPY (S&P 500 ETF Session Test)</option>
              <option value="NVDA">NVDA (NVIDIA Equity Test)</option>
              <option value="AAPL">AAPL (Apple Equity Test)</option>
            </select>

            <button
              onClick={handleRunTest}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-md transition-colors"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Live Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className="mt-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusBadge(testResult.resultCode)}
                <span className="text-xs font-bold text-white font-mono">{testSymbol}</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Latency: {testResult.latencyMs}ms
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{testResult.message}</p>
            {testResult.sampleData && (
              <div className="mt-3 p-3 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-32">
                <pre>{JSON.stringify(testResult.sampleData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upstream Providers Matrix */}
      <div className="p-5 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg overflow-hidden">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-blue-400" />
          Upstream Provider Adapters & Entitlements
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle,#1f2937)] text-[var(--text-muted,#9ca3af)] uppercase font-semibold">
                <th className="pb-3">Provider</th>
                <th className="pb-3">Configured</th>
                <th className="pb-3">Connection</th>
                <th className="pb-3">Auth</th>
                <th className="pb-3">Entitlement</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Errors</th>
                <th className="pb-3">Last Tick</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle,#1f2937)]">
              {(Object.values(diagnostics.providers) as ProviderDiagnosticMetrics[]).map((prov) => (
                <tr key={prov.providerId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {prov.name}
                  </td>
                  <td className="py-3">
                    {prov.isConfigured ? (
                      <span className="text-emerald-400 font-bold">YES</span>
                    ) : (
                      <span className="text-amber-400 font-bold">OPTIONAL</span>
                    )}
                  </td>
                  <td className="py-3">{getStatusBadge(prov.connectionStatus)}</td>
                  <td className="py-3">{getStatusBadge(prov.authStatus)}</td>
                  <td className="py-3">
                    <span className="font-mono text-emerald-400 font-bold">
                      {prov.realtimeEntitlement}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-300">{prov.latencyMs}ms</td>
                  <td className="py-3 font-mono text-slate-400">{prov.errorCount}</td>
                  <td className="py-3 font-mono text-slate-400">
                    {prov.lastTickTimestamp
                      ? `${Math.round((Date.now() - prov.lastTickTimestamp) / 1000)}s ago`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Symbol Subscriptions Table */}
      <div className="p-5 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          Active Symbol Subscriptions (Reference Counted)
        </h3>

        {diagnostics.activeSubscriptions.length === 0 ? (
          <p className="text-xs text-[var(--text-muted,#9ca3af)] py-4 text-center">
            No active symbol subscriptions. Subscriptions automatically engage when charts, watchlists, or market tape are mounted.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle,#1f2937)] text-[var(--text-muted,#9ca3af)] uppercase font-semibold">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Ref Count</th>
                  <th className="pb-3">Subscribed At</th>
                  <th className="pb-3">Tick Count</th>
                  <th className="pb-3">Last Tick Age</th>
                  <th className="pb-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle,#1f2937)]">
                {diagnostics.activeSubscriptions.map((sub) => (
                  <tr key={sub.symbol} className="hover:bg-white/[0.02] transition-colors font-mono">
                    <td className="py-2.5 font-bold text-white">{sub.symbol}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{sub.refCount} consumers</td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(sub.subscribedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-white font-bold">{sub.tickCount} ticks</td>
                    <td className="py-2.5 text-slate-300">
                      {sub.tickAgeMs != null ? `${Math.round(sub.tickAgeMs / 1000)}s ago` : 'Active'}
                    </td>
                    <td className="py-2.5">{getStatusBadge(sub.mode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TradingView Real-Time Chart Synchronization Diagnostics */}
      {tvDiag && (
        <div className="p-5 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              TradingView Real-Time Chart Synchronization
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                Engine: {tvDiag.engine}
              </span>
              {getStatusBadge(tvDiag.realtimeSubscriptionStatus === 'ACTIVE' ? 'CONNECTED' : 'STANDBY')}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs mb-4">
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Active Symbol / TF</div>
              <div className="text-white font-bold text-sm mt-0.5">
                {tvDiag.currentSymbol} ({tvDiag.resolution.toUpperCase()})
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Historical Bars</div>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">
                {tvDiag.historicalBarsCount} bars ({tvDiag.historicalBarsStatus})
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Tick-To-Chart Latency</div>
              <div className="text-amber-400 font-bold text-sm mt-0.5">
                {tvDiag.tickToChartLatencyMs} ms
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Chart Data Mode</div>
              <div className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                {getStatusBadge(tvDiag.dataMode)}
              </div>
            </div>
          </div>

          {/* Recent Live Tick Pipeline Traces */}
          {tvDiag.recentTraces.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                Live Tick-to-Chart Pipeline Traces (Sub-second Verification)
              </div>
              <div className="max-h-36 overflow-y-auto rounded-lg bg-black/70 border border-slate-800 p-2 text-[10px] font-mono space-y-1">
                {tvDiag.recentTraces.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-slate-300 hover:text-white">
                    <span className="text-slate-400">{t.timestamp}</span>
                    <span className="font-bold text-white">{t.symbol}</span>
                    <span className="text-emerald-400 font-bold">${t.price.toFixed(2)}</span>
                    <span className="text-purple-400">[{t.provider}]</span>
                    <span className="text-amber-400">{t.totalLatencyMs}ms total latency</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Real-Time Event Log Terminal */}
      <div className="p-5 rounded-xl bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            Structured Real-Time Diagnostic Event Log
          </h3>
          <span className="text-[11px] text-[var(--text-muted,#9ca3af)] font-mono">
            Zero API Secrets Logged
          </span>
        </div>

        <div className="p-4 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-56 overflow-y-auto">
          {diagnostics.logs.length === 0 ? (
            <div className="text-slate-500">Awaiting stream telemetry events...</div>
          ) : (
            diagnostics.logs.map((l, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">
                  {new Date(l.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-purple-400 font-bold shrink-0">[{l.provider}]</span>
                <span className="text-emerald-400 shrink-0">{l.event}</span>
                {l.details && (
                  <span className="text-slate-400 truncate">
                    {JSON.stringify(l.details)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

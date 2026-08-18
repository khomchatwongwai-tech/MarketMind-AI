import React, { useState, useEffect } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
  RefreshCw,
  Sliders,
  Clock,
  Key,
  ExternalLink,
  Play,
  Lock,
  Info,
  Check,
} from 'lucide-react';
import { AdminNewsSourceConfig, FeedDelay } from '../../types/newsIntelligence';

export const AdminNewsSourcesView: React.FC = () => {
  const [sources, setSources] = useState<AdminNewsSourceConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latencyMs: number; message: string; sampleItem?: any }>
  >({});
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/news-sources/settings');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to load admin sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestConnection = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await fetch('/api/admin/news-sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [providerId]: data }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          latencyMs: 999,
          message: `Network error: ${err?.message || 'Failed to ping provider'}`,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleUpdateInterval = async (providerId: string, intervalSeconds: number) => {
    try {
      const res = await fetch('/api/admin/news-sources/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          settings: { pollingIntervalSeconds: intervalSeconds },
        }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === providerId ? { ...s, pollingIntervalSeconds: intervalSeconds } : s))
        );
        setSavedSettingsNotice(`Updated polling frequency for ${providerId} to ${intervalSeconds}s.`);
        setTimeout(() => setSavedSettingsNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderStatusBadge = (status: AdminNewsSourceConfig['status'], isConfigured: boolean) => {
    if (status === 'OFFLINE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> Source temporarily unavailable
        </span>
      );
    }
    if (!isConfigured || status === 'NOT_CONFIGURED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#181818] text-[#888] border border-[#333] flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" /> Awaiting Credentials
        </span>
      );
    }
    if (status === 'LIVE' || status === 'ONLINE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Connected
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/40 flex items-center gap-1">
        <AlertTriangle className="w-2.5 h-2.5" /> Degraded / Polling
      </span>
    );
  };

  const renderFeedDelayBadge = (delay: FeedDelay) => {
    switch (delay) {
      case 'REAL_TIME':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Real-Time Wire
          </span>
        );
      case 'NEAR_REAL_TIME':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Near Real-Time (&lt;45s)
          </span>
        );
      case 'DELAYED_15M':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
            15m Exchange Delayed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Official Regulatory
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#E2E8F0]">
      {/* Toast Notice */}
      {savedSettingsNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E0E0E] border border-[#D4AF37] text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedSettingsNotice}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/50 rounded-lg text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                  Administrator News Source Ingestion & Compliance Matrix
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
                  {sources.filter((s) => s.isConfigured).length} / {sources.length} CONNECTED
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Manage live connectors for CNBC, Yahoo Finance, Bloomberg, Fox Business, CNN, Benzinga, Finnhub, Massive, Alpaca, SEC EDGAR, and Federal Reserve.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSources}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#D4AF37] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All Source Statuses
          </button>
        </div>

        {/* Legal & Content Compliance Guidelines Banner */}
        <div className="mt-4 p-3.5 bg-[#060606] border border-[#222] rounded-lg text-xs text-[#AAA] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 text-[#D4AF37] mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-mono uppercase text-[11px]">
              Institutional Compliance & Content Rights Standards:
            </strong>
            <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
              MarketMind strictly utilizes official public APIs, approved XML/RSS feeds, and licensed provider credentials. The platform enforces SSRF-protected parsing, never bypasses paywalls, preserves publisher attributions, and clearly differentiates real-time from delayed feeds.
            </p>
          </div>
        </div>
      </div>

      {/* Sources Matrix Table */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#060606] border-b border-[#1F1F1F] text-[10px] font-mono font-bold text-[#888] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Provider / Source</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Feed Type / Delay</th>
                <th className="py-3 px-3">Configured Credential</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Polling Interval</th>
                <th className="py-3 px-4 text-right">Diagnostic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {sources.map((source) => {
                const testResult = testResults[source.id];
                const isTesting = testingId === source.id;

                return (
                  <React.Fragment key={source.id}>
                    <tr className="hover:bg-[#0E0E0E] transition">
                      {/* Name & Publisher */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{source.name}</div>
                        <div className="text-[10px] text-[#71717A] font-mono">{source.publisherName}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {renderStatusBadge(source.status, source.isConfigured)}
                      </td>

                      {/* Feed Delay */}
                      <td className="py-3 px-3">
                        {renderFeedDelayBadge(source.feedDelay)}
                      </td>

                      {/* Masked Credential / Endpoint */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] text-[#CCC] flex items-center gap-1">
                          <Key className="w-3 h-3 text-[#D4AF37]" />
                          <span className="truncate max-w-[200px]" title={source.maskedCredential}>
                            {source.maskedCredential}
                          </span>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            source.avgLatencyMs < 50
                              ? 'text-emerald-400'
                              : source.avgLatencyMs < 100
                              ? 'text-blue-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {source.avgLatencyMs > 0 ? `${source.avgLatencyMs}ms` : '—'}
                        </span>
                      </td>

                      {/* Polling Interval Select */}
                      <td className="py-3 px-3">
                        <select
                          value={source.pollingIntervalSeconds}
                          onChange={(e) => handleUpdateInterval(source.id, parseInt(e.target.value, 10))}
                          className="bg-[#141414] border border-[#2A2A2A] text-white rounded px-2 py-1 text-[11px] font-mono outline-none focus:border-[#D4AF37]"
                        >
                          <option value={15}>15s (Ultra High-Freq)</option>
                          <option value={30}>30s (Real-Time)</option>
                          <option value={45}>45s (Standard Wire)</option>
                          <option value={60}>60s (Periodic Check)</option>
                          <option value={120}>120s (Economy Mode)</option>
                        </select>
                      </td>

                      {/* Diagnostic Ping Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleTestConnection(source.id)}
                          disabled={isTesting}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-[#1E1E1E] text-[#D4AF37] border border-[#2C2C2C] hover:border-[#D4AF37]/50 rounded text-[11px] font-mono font-bold flex items-center gap-1 ml-auto transition disabled:opacity-50"
                        >
                          {isTesting ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          Test Ping
                        </button>
                      </td>
                    </tr>

                    {/* Test Result Expandable Row */}
                    {testResult && (
                      <tr className="bg-[#050505] border-t border-[#1C1C1C]">
                        <td colSpan={7} className="py-2.5 px-4">
                          <div
                            className={`p-3 rounded-lg border text-xs font-mono flex items-start justify-between gap-3 ${
                              testResult.success
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                {testResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                )}
                                <span>Diagnostic Result: {testResult.message}</span>
                              </div>
                              {testResult.sampleItem && (
                                <div className="text-[11px] text-[#AAA] mt-1 pt-1 border-t border-[#222]">
                                  Sample Verified Headline: <span className="text-white font-bold">"{testResult.sampleItem.headline}"</span> ({testResult.sampleItem.publishedAt})
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setTestResults((prev) => {
                                const next = { ...prev };
                                delete next[source.id];
                                return next;
                              })}
                              className="text-[10px] text-[#777] hover:text-white px-1.5 py-0.5 bg-[#111] rounded"
                            >
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

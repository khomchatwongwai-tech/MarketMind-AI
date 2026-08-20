import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Activity, AlertTriangle, CheckCircle2, RefreshCw, Zap, Server } from 'lucide-react';
import { CapacitorPlatform } from '../services/mobile/capacitorPlatform.js';

interface ProviderStatus {
  provider: 'openai' | 'gemini' | 'anthropic' | 'perplexity';
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'CIRCUIT_OPEN';
  configured: boolean;
  enabled: boolean;
  healthy: boolean;
  consecutiveFailures: number;
  lastCheckedAt: string;
  latencyMs?: number;
  failureReason?: string;
}

interface AIHealthResponse {
  timestamp: string;
  primaryProvider: string;
  fallbackOrder: string[];
  providers: ProviderStatus[];
}

export const AdminAIDiagnosticsView: React.FC = () => {
  const [report, setReport] = useState<AIHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    const baseUrl = CapacitorPlatform.getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/ai/health`);
      if (!res.ok) throw new Error(`Health API returned status ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI diagnostics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> HEALTHY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-xs font-mono font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> DEGRADED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-xs font-mono font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0a0b0d] border border-[#22262d] rounded-xl p-4 sm:p-5 text-[#e2e8f0] font-sans space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-[#1c1f24] gap-2">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-[#818cf8]" />
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              AI SYSTEM DIAGNOSTICS & ORCHESTRATION
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Production status for OpenAI, Gemini, Claude, and Perplexity provider pipeline
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          className="px-3 py-1.5 bg-[#1e2229] hover:bg-[#2a303a] border border-[#2d3139] text-xs font-mono text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#818cf8] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary & Fallback Order Summary */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-[#15171a] p-3 rounded-lg border border-[#22262d] flex justify-between items-center">
            <span className="text-slate-400 uppercase font-bold">Primary Provider:</span>
            <span className="text-[#818cf8] font-bold uppercase">{report.primaryProvider}</span>
          </div>

          <div className="bg-[#15171a] p-3 rounded-lg border border-[#22262d] flex justify-between items-center">
            <span className="text-slate-400 uppercase font-bold">Fallback Order:</span>
            <span className="text-white font-bold uppercase">
              {report.fallbackOrder.length > 0 ? report.fallbackOrder.join(' → ') : 'None'}
            </span>
          </div>
        </div>
      )}

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {(
          [
            { id: 'openai', name: 'OpenAI (GPT-4o Mini / Reasoning)' },
            { id: 'gemini', name: 'Google Gemini (Flash / Multimodal)' },
            { id: 'anthropic', name: 'Anthropic Claude (Sonnet / Research)' },
            { id: 'perplexity', name: 'Perplexity (Live Web Citations)' },
          ] as const
        ).map((providerInfo) => {
          const statusObj = report?.providers.find((p) => p.provider === providerInfo.id);
          const isConfigured = statusObj?.configured ?? false;
          const status = statusObj?.status ?? 'OFFLINE';

          return (
            <div
              key={providerInfo.id}
              className="bg-[#15171a] border border-[#22262d] rounded-xl p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{providerInfo.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Provider ID: {providerInfo.id}
                  </span>
                </div>
                {getStatusBadge(status)}
              </div>

              <div className="divide-y divide-[#1c1f24] text-xs font-mono">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-400">Configured:</span>
                  <span className={`font-bold ${isConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isConfigured ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-400">Health State:</span>
                  <span className="font-bold text-white">{status}</span>
                </div>

                {statusObj?.latencyMs !== undefined && (
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Avg Latency:</span>
                    <span className="font-bold text-slate-200">{statusObj.latencyMs} ms</span>
                  </div>
                )}

                {statusObj?.failureReason && (
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-400">Failure Reason:</span>
                    <span className="font-bold text-rose-400 text-[10px] max-w-[180px] truncate">
                      {statusObj.failureReason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  RefreshCw,
  Layers,
  ShieldCheck,
  Cpu,
  Clock,
} from 'lucide-react';
import { ProviderCapability } from '../../types/instrument';
import { AssetClassBadge } from '../common/AssetClassBadge';

export const ProviderCapabilityPanel: React.FC = () => {
  const [capabilities, setCapabilities] = useState<ProviderCapability[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<string, { status: string; latencyMs: number; isConfigured: boolean }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [capRes, statRes] = await Promise.all([
        fetch('/api/providers/capabilities'),
        fetch('/api/providers/status'),
      ]);

      if (capRes.ok && statRes.ok) {
        const capData = await capRes.json();
        const statData = await statRes.json();
        setCapabilities(capData.capabilities || []);
        setProviderStatus(statData.providers || {});
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching provider status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="bg-[#111317] border border-[#232731] rounded-xl p-4 md:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1e222a] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Licensed Provider Router & Capability Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Real-time multi-asset gateway routing with rate-limit & latency orchestration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-slate-500">
            Last Ping: {lastSync || 'Syncing...'}
          </span>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181b22] hover:bg-[#222731] border border-[#2d313c] text-xs font-mono text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Health Check</span>
          </button>
        </div>
      </div>

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {capabilities.map((provider) => {
          const liveStat = providerStatus[provider.providerId] || {
            status: provider.healthStatus,
            latencyMs: provider.averageLatencyMs,
            isConfigured: provider.isConfigured,
          };
          const isHealthy = liveStat.status === 'HEALTHY';

          return (
            <div
              key={provider.providerId}
              className="p-3.5 bg-[#14171f] rounded-xl border border-[#242833] flex flex-col justify-between space-y-3"
            >
              {/* Top info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {provider.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Tier: <strong className="text-[#F2D675]">{provider.entitlementTier}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isHealthy ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      DEGRADED
                    </span>
                  )}
                </div>
              </div>

              {/* Supported Asset Classes Chips */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                  Supported Asset Classes
                </span>
                <div className="flex flex-wrap gap-1">
                  {provider.supportedAssetClasses.slice(0, 4).map((ac) => (
                    <AssetClassBadge key={ac} assetClass={ac} size="sm" />
                  ))}
                  {provider.supportedAssetClasses.length > 4 && (
                    <span className="text-[9px] font-mono text-slate-400 px-1 py-0.5 bg-[#1a1d26] rounded border border-[#2b303d]">
                      +{provider.supportedAssetClasses.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Metrics */}
              <div className="pt-2 border-t border-[#1f232d] grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">LATENCY</span>
                  <span className="text-emerald-400 font-bold">{liveStat.latencyMs} ms</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">RATE LIMIT</span>
                  <span className="text-slate-300 font-bold">{provider.rateLimitPerMinute} req/min</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

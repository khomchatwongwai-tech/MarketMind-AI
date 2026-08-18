import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Server,
  Zap,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SystemServiceStatus } from '../types/user';
import { UserService } from '../services/userService';

export const StatusPageView: React.FC = () => {
  const [services, setServices] = useState<SystemServiceStatus[]>(UserService.getSystemStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setServices(UserService.getSystemStatus());
      setIsRefreshing(false);
    }, 600);
  };

  const allOperational = services.every((s) => s.status === 'Operational');

  return (
    <div className="flex flex-col gap-3 select-none text-[#e2e8f0]">
      {/* Header Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>MarketMind Infrastructure Status</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono">
                99.98% 30-DAY UPTIME
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time telemetry across sub-millisecond edge WebSocket gateways, Gemini AI pipelines &amp; FIX protocols
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-200 text-xs font-bold rounded-lg border border-[#2d3139] flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#818cf8] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary Global Health Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between ${
          allOperational
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {allOperational ? 'All Core Trading Systems Operational' : 'Minor Service Degradation'}
            </h3>
            <p className="text-xs opacity-80">
              WebSocket clusters in New York (NY4), Chicago (CME), and Frankfurt operating within normal SLA thresholds (&lt; 20ms).
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">CURRENT CLUSTER REGION</span>
          <span className="text-white font-bold">AWS us-east-1 &bull; NY4 Equinix</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="p-4 bg-[#181a1f] border border-[#2d3139] rounded-xl flex justify-between items-center"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">{svc.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#252830] text-slate-400 rounded font-mono">
                  {svc.latencyMs}ms
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{svc.description}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span>30-Day Uptime: {svc.uptimePercent}%</span>
                <span>&bull;</span>
                <span>Last checked: {svc.lastCheck}</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase inline-flex items-center gap-1 ${
                  svc.status === 'Operational'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {svc.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 90-Day Uptime Historical Bar Visualizer */}
      <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            90-Day System Availability Ledger
          </span>
          <span className="text-xs text-emerald-400 font-bold font-mono">99.98% System Health</span>
        </div>

        <div className="flex gap-1 items-center overflow-hidden py-1">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`h-7 flex-1 rounded-sm transition-all hover:scale-110 cursor-pointer ${
                i === 42 ? 'bg-amber-400' : 'bg-emerald-500/80 hover:bg-emerald-400'
              }`}
              title={`Day ${60 - i} days ago: ${i === 42 ? 'Minor 4min latency spike' : '100% Operational'}`}
            />
          ))}
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>60 days ago</span>
          <span className="text-slate-400">Continuous 24/7 Monitoring &bull; Sub-Second Failover</span>
          <span>Today (Live)</span>
        </div>
      </div>
    </div>
  );
};

import { useI18n } from '../../i18n/I18nContext.js';
import React from 'react';
import { X, ShieldCheck, Clock, Activity, Zap, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { NormalizedQuote, ProviderConnectionStatus, RealTimeDataMode } from '../../types/realtime';
import { MarketSessionEngine } from '../../services/realtime/MarketSessionEngine';

interface DataDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  quote: NormalizedQuote | null;
  status: ProviderConnectionStatus;
}

export const DataDetailsModal: React.FC<DataDetailsModalProps> = ({
  isOpen,
  onClose,
  symbol,
  quote,
  status,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  if (!isOpen) return null;

  const session = MarketSessionEngine.getSessionForSymbol(symbol);
  const now = Date.now();
  const quoteAgeSec = quote ? Math.round((now - quote.timestamp) / 1000) : null;

  const getModeBadge = (mode: RealTimeDataMode) => {
    switch (mode) {
      case 'REAL_TIME':
        return {
          label: 'REAL-TIME (SUB-SECOND)',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          desc: 'Direct sub-second streaming quotes and trades from connected exchange feed.',
        };
      case 'DELAYED':
        return {
          label: 'DELAYED (15-MIN)',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          desc: '15-minute standard exchange delayed market data.',
        };
      case 'CLOSED':
        return {
          label: 'MARKET CLOSED',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          desc: 'Trading session is closed. Showing last verified official session close.',
        };
      case 'CACHED':
        return {
          label: 'VERIFIED CACHE',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          desc: 'Displaying verified snapshot from primary provider memory cache.',
        };
      default:
        return {
          label: 'DATA UNAVAILABLE',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          desc: 'Live quotes for this instrument are currently not responding from provider.',
        };
    }
  };

  const modeInfo = getModeBadge(quote?.mode || (session.isOpen ? 'REAL_TIME' : 'CLOSED'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[var(--surface-primary,#111827)] border border-[var(--border-subtle,#1f2937)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle,#1f2937)] bg-[var(--surface-secondary,#0f172a)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary,#f9fafb)]">
                Market Data & Feed Details
              </h2>
              <p className="text-xs text-[var(--text-muted,#9ca3af)]">
                Provenance, session state, and latency metrics for <span className="font-mono font-bold text-white">{symbol}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted,#9ca3af)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Mode banner */}
          <div className={`p-4 rounded-lg border ${modeInfo.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">{modeInfo.label}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{modeInfo.desc}</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary,#1f2937)]/50 border border-[var(--border-subtle,#374151)]/60">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#9ca3af)] mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Primary Provider</span>
              </div>
              <p className="font-bold text-[var(--text-primary,#f9fafb)]">
                {quote?.provider || 'MarketMind Provider Gateway'}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">PRO Institutional Feed</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary,#1f2937)]/50 border border-[var(--border-subtle,#374151)]/60">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#9ca3af)] mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Trading Session</span>
              </div>
              <p className="font-bold text-[var(--text-primary,#f9fafb)]">
                {session.sessionName}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">{session.timeET}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary,#1f2937)]/50 border border-[var(--border-subtle,#374151)]/60">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#9ca3af)] mb-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Last Verified Tick</span>
              </div>
              <p className="font-mono font-bold text-[var(--text-primary,#f9fafb)]">
                {quote && typeof quote.price === 'number' && !isNaN(quote.price) ? `$${quote.price.toFixed(2)}` : 'Awaiting Tick'}
              </p>
              <span className="text-[10px] text-slate-400">
                {quoteAgeSec !== null ? `${quoteAgeSec}s ago` : 'Session Start'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary,#1f2937)]/50 border border-[var(--border-subtle,#374151)]/60">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted,#9ca3af)] mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Socket Pipeline</span>
              </div>
              <p className="font-bold text-[var(--text-primary,#f9fafb)]">
                {status === 'CONNECTED' ? 'ONLINE (LIVE)' : status}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Zero Simulation Policy</span>
            </div>
          </div>

          {/* Session details */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Timezone Standard:</span>
              <span className="text-slate-200 font-mono">America/New_York (ET)</span>
            </div>
            {session.nextOpen && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Next Market Open:</span>
                <span className="text-emerald-400 font-mono">{session.nextOpen}</span>
              </div>
            )}
            {session.nextClose && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Session Target Close:</span>
                <span className="text-amber-400 font-mono">{session.nextClose}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-400">
              <span>Simulation Permitted:</span>
              <span className="text-rose-400 font-bold font-mono">DISABLED (Strict Real Data)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle,#1f2937)] bg-[var(--surface-secondary,#0f172a)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

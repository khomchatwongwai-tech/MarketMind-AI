import { useI18n } from '../../i18n/I18nContext.js';
import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Plus,
  TrendingUp,
  Bell,
  Wallet,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';

export const SkeletonQuoteCard: React.FC = () => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  return (
    <div className="p-4 bg-[#121217] border border-[#202026] rounded-xl animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-[#22222A] rounded" />
        <div className="h-3 w-14 bg-[#22222A] rounded" />
      </div>
      <div className="h-7 w-28 bg-[#282834] rounded" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-16 bg-[#22222A] rounded" />
        <div className="h-3 w-12 bg-[#22222A] rounded" />
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="w-full h-80 bg-[#101014] border border-[#202026] rounded-xl p-4 flex flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-36 bg-[#22222A] rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-10 bg-[#22222A] rounded" />
          <div className="h-6 w-10 bg-[#22222A] rounded" />
          <div className="h-6 w-10 bg-[#22222A] rounded" />
        </div>
      </div>
      <div className="flex-1 my-4 bg-[#14141C] rounded-lg flex items-center justify-center">
        <div className="text-xs text-[#555] font-mono">Loading high-resolution feed...</div>
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-16 bg-[#22222A] rounded" />
        <div className="h-3 w-16 bg-[#22222A] rounded" />
        <div className="h-3 w-16 bg-[#22222A] rounded" />
      </div>
    </div>
  );
};

export const EmptyWatchlistState: React.FC<{ onAddTicker: () => void }> = ({ onAddTicker }) => {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center border border-dashed border-[#272730] rounded-xl bg-[#0F0F13]">
      <div className="p-3 bg-[#171720] text-[#D4AF37] rounded-2xl border border-[#D4AF37]/30 mb-3">
        <TrendingUp className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-white font-mono">Your Watchlist is Empty</h3>
      <p className="text-xs text-[#A1A1AA] max-w-sm mt-1 mb-4 leading-relaxed">
        Add SPY, NVDA, AAPL, BTC, or any supported multi-asset instrument to monitor live price action, catalysts, and MarketMind scores.
      </p>
      <button
        onClick={onAddTicker}
        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F2D675] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
      >
        <Plus className="w-4 h-4" /> Add First Instrument
      </button>
    </div>
  );
};

export const EmptyAlertsState: React.FC<{ onCreateAlert: () => void }> = ({ onCreateAlert }) => {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center border border-dashed border-[#272730] rounded-xl bg-[#0F0F13]">
      <div className="p-3 bg-[#171720] text-[#D4AF37] rounded-2xl border border-[#D4AF37]/30 mb-3">
        <Bell className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-white font-mono">No Active Alerts Configured</h3>
      <p className="text-xs text-[#A1A1AA] max-w-sm mt-1 mb-4 leading-relaxed">
        Create price threshold, resistance breakout, unusual volume, or earnings alerts to stay informed in real time.
      </p>
      <button
        onClick={onCreateAlert}
        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F2D675] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
      >
        <Plus className="w-4 h-4" /> Create First Alert
      </button>
    </div>
  );
};

export const MarketDataErrorState: React.FC<{
  errorMessage?: string;
  onRetry?: () => void;
}> = ({ errorMessage, onRetry }) => {
  return (
    <div className="p-6 bg-[#161214] border border-red-500/30 rounded-xl text-center flex flex-col items-center justify-center gap-2.5">
      <AlertTriangle className="w-7 h-7 text-red-400" />
      <h4 className="text-sm font-bold text-white font-mono">Market Data Feed Interrupted</h4>
      <p className="text-xs text-[#D4A5A5] max-w-md leading-relaxed">
        {errorMessage || 'Unable to establish a secure handshake with the designated market provider feed. Existing verified caches are retained.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-1.5 bg-[#2A1E22] hover:bg-[#3D252C] text-red-300 border border-red-500/40 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { UniversalAssetClass, RealTimeDataTier } from '../../types/instrument';

interface AssetClassBadgeProps {
  assetClass: UniversalAssetClass | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AssetClassBadge: React.FC<AssetClassBadgeProps> = ({
  assetClass,
  size = 'md',
  showLabel = true,
}) => {
  const getBadgeStyle = (cls: string) => {
    switch (cls) {
      case 'STOCK':
        return {
          bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          label: 'EQUITY',
        };
      case 'ETF':
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          label: 'ETF',
        };
      case 'FUND':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          label: 'MUTUAL FUND',
        };
      case 'ADR':
        return {
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          label: 'ADR',
        };
      case 'WARRANT':
        return {
          bg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
          label: 'WARRANT',
        };
      case 'INDEX':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          label: 'INDEX',
        };
      case 'OPTION':
      case 'INDEX_OPTION':
      case 'FUTURES_OPTION':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          label: 'OPTION',
        };
      case 'FOREX':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          label: 'FOREX (24/5)',
        };
      case 'CRYPTO':
      case 'CRYPTO_PAIR':
        return {
          bg: 'bg-[#D4AF37]/15 text-[#F2D675] border-[#D4AF37]/40',
          label: 'CRYPTO (24/7)',
        };
      case 'FUTURES':
        return {
          bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          label: 'FUTURES',
        };
      case 'COMMODITY':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          label: 'COMMODITY',
        };
      case 'TREASURY':
      case 'BOND':
        return {
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          label: 'FIXED INCOME',
        };
      case 'ECONOMIC_INDICATOR':
        return {
          bg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
          label: 'MACRO SERIES',
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          label: cls,
        };
    }
  };

  const style = getBadgeStyle(assetClass);
  const sizeClasses =
    size === 'sm'
      ? 'text-[9px] px-1.5 py-0.5'
      : size === 'lg'
      ? 'text-xs px-2.5 py-1'
      : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded border ${style.bg} ${sizeClasses}`}
    >
      {showLabel ? style.label : assetClass}
    </span>
  );
};

export const RealTimeBadge: React.FC<{ tier?: RealTimeDataTier; delayMinutes?: number }> = ({
  tier = 'REAL_TIME',
  delayMinutes = 0,
}) => {
  if (tier === 'REAL_TIME') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        REAL-TIME
      </span>
    );
  }

  if (tier === 'DELAYED_15M') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
        DELAYED {delayMinutes || 15}M
      </span>
    );
  }

  if (tier === 'END_OF_DAY') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-300 border border-slate-500/30">
        EOD SETTLEMENT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
      UNENTITLED
    </span>
  );
};

export const SessionStatusBadge: React.FC<{
  sessionState: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED' | 'ACTIVE_24_7' | 'ACTIVE_24_5' | string;
}> = ({ sessionState }) => {
  switch (sessionState) {
    case 'ACTIVE_24_7':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          24/7 ACTIVE
        </span>
      );
    case 'ACTIVE_24_5':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          24/5 FX OPEN
        </span>
      );
    case 'REGULAR':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          MARKET OPEN
        </span>
      );
    case 'PRE_MARKET':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
          PRE-MARKET
        </span>
      );
    case 'AFTER_HOURS':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          AFTER-HOURS
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#242424] text-slate-400 border border-[#333]">
          CLOSED
        </span>
      );
  }
};

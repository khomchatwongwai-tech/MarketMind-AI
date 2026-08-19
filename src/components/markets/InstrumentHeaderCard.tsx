import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Share2,
  AlertCircle,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { NormalizedInstrument, MultiAssetQuoteResponse } from '../../types/instrument';
import { isFiniteMarketNumber } from '../../utils/formatters';
import { AssetClassBadge, RealTimeBadge, SessionStatusBadge } from '../common/AssetClassBadge';

interface InstrumentHeaderCardProps {
  quoteResponse: MultiAssetQuoteResponse | null;
  instrument: NormalizedInstrument;
  sessionState: string;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  onOpenAiAnalysis: () => void;
  onOpenSearch: () => void;
}

export const InstrumentHeaderCard: React.FC<InstrumentHeaderCardProps> = ({
  quoteResponse,
  instrument,
  sessionState,
  isWatchlisted,
  onToggleWatchlist,
  onOpenAiAnalysis,
  onOpenSearch,
}) => {
  const quote = quoteResponse?.quote;
  const isAvailable = quoteResponse?.entitlementStatus?.isAvailable !== false;
  const isPositive = (quote?.changePercent || instrument.changePercent || 0) >= 0;

  const currentPrice = quote?.price ?? instrument.price ?? 0;
  const changeVal = quote?.change ?? instrument.change ?? 0;
  const changePercentVal = quote?.changePercent ?? instrument.changePercent ?? 0;
  const isForex = instrument.assetClass === 'FOREX';
  const decimals = isForex ? 4 : 2;

  const dayHigh = quote?.dayHigh ?? instrument.high ?? currentPrice;
  const dayLow = quote?.dayLow ?? instrument.low ?? currentPrice;
  const rangeSpan = Math.max(0.0001, dayHigh - dayLow);
  const currentRangePercent = Math.min(100, Math.max(0, ((currentPrice - dayLow) / rangeSpan) * 100));

  return (
    <div className="bg-[#111317] border border-[#232731] rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden">
      {/* Subtle gold accent top glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

      {/* Main Top Bar: Symbol, Name, Badges, & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1e222a] pb-4">
        {/* Left: Identity info */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#181b22] border border-[#2d313d] flex items-center justify-center shrink-0">
            <span className="font-mono font-black text-lg text-[#D4AF37]">
              {instrument.symbol.slice(0, 3)}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-mono">
                {instrument.displaySymbol || instrument.symbol}
              </h1>

              <AssetClassBadge assetClass={instrument.assetClass} size="md" />
              <SessionStatusBadge sessionState={sessionState || 'REGULAR'} />
              <RealTimeBadge tier={instrument.realTimeStatus} delayMinutes={instrument.feedDelayMinutes} />

              <button
                onClick={onOpenSearch}
                className="px-2 py-0.5 text-[11px] font-mono text-slate-400 hover:text-white bg-[#1a1d24] hover:bg-[#252933] border border-[#2b303c] rounded transition"
              >
                Switch Asset (/)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-400">
              <span className="font-medium text-slate-300">{instrument.name}</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-400">
                {instrument.exchange} {instrument.exchangeMIC ? `(${instrument.exchangeMIC})` : ''}
              </span>
              <span>&bull;</span>
              <span className="font-mono text-slate-400">{instrument.currency}</span>
              {instrument.country && (
                <>
                  <span>&bull;</span>
                  <span>{instrument.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
          <button
            onClick={onOpenAiAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37]/20 to-[#AA7C11]/20 hover:from-[#D4AF37]/30 hover:to-[#AA7C11]/30 border border-[#D4AF37]/60 text-[#F2D675] font-semibold text-xs transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Institutional AI Intelligence</span>
          </button>

          <button
            onClick={onToggleWatchlist}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isWatchlisted
                ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F2D675]'
                : 'bg-[#181b22] border-[#2c303b] text-slate-300 hover:text-white hover:bg-[#20242e]'
            }`}
          >
            {isWatchlisted ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Watchlisted</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Add to Watchlist</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unentitled Plan Warning Notice if not available */}
      {!isAvailable && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {quoteResponse?.entitlementStatus?.unavailabilityReason ||
                'This financial instrument is not enabled on your current market data license.'}
            </span>
          </div>
          <button className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold whitespace-nowrap">
            Upgrade Data Plan
          </button>
        </div>
      )}

      {/* Primary Price Strip & Asset-Specific Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Current Price Block */}
        <div className="p-3 bg-[#16181f] rounded-lg border border-[#242833] flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Last Price ({instrument.currency})
          </span>
          <div className="mt-1">
            <span className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight">
              {instrument.currency === 'USD' ? '$' : ''}
              {currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })}
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1.5 text-xs font-mono font-bold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? '+' : ''}
              {typeof changeVal === 'number' && !isNaN(changeVal) ? changeVal.toFixed(decimals) : 'N/A'} (
              {isPositive ? '+' : ''}
              {typeof changePercentVal === 'number' && !isNaN(changePercentVal) ? changePercentVal.toFixed(2) : 'N/A'}%)
            </span>
          </div>
        </div>

        {/* Bid / Ask & Spread */}
        <div className="p-3 bg-[#16181f] rounded-lg border border-[#242833] flex flex-col justify-between text-xs font-mono">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">Order Book Level 1</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-slate-500 text-[10px]">BID</span>
              <p className="text-white font-bold text-sm">
                {quote?.bid ? quote.bid.toFixed(decimals) : typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0 ? (currentPrice * 0.9998).toFixed(decimals) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">ASK</span>
              <p className="text-white font-bold text-sm">
                {quote?.ask ? quote.ask.toFixed(decimals) : typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0 ? (currentPrice * 1.0002).toFixed(decimals) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>Spread:</span>
            <span className="text-slate-300 font-bold">
              {isFiniteMarketNumber(quote?.spread)
                ? quote!.spread.toFixed(decimals)
                : isFiniteMarketNumber(currentPrice) && currentPrice > 0
                ? (currentPrice * 0.0004).toFixed(decimals)
                : 'N/A'}{' '}
              {isForex ? `(${((quote?.spread || 0.0002) * 10000).toFixed(1)} pips)` : ''}
            </span>
          </div>
        </div>

        {/* 24h / Intraday Range */}
        <div className="p-3 bg-[#16181f] rounded-lg border border-[#242833] flex flex-col justify-between">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{instrument.tradingSession === 'CONTINUOUS_24_7' ? '24H RANGE' : 'DAY RANGE'}</span>
            <span className="text-[#D4AF37] font-bold">{typeof currentRangePercent === 'number' && !isNaN(currentRangePercent) ? currentRangePercent.toFixed(0) : '0'}%</span>
          </div>
          <div className="my-2">
            <div className="w-full h-1.5 bg-[#252a36] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-[#D4AF37] to-rose-500 rounded-full"
                style={{ width: `${currentRangePercent || 0}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">L: {typeof dayLow === 'number' && !isNaN(dayLow) && dayLow > 0 ? dayLow.toFixed(decimals) : 'N/A'}</span>
            <span className="text-slate-400">H: {typeof dayHigh === 'number' && !isNaN(dayHigh) && dayHigh > 0 ? dayHigh.toFixed(decimals) : 'N/A'}</span>
          </div>
        </div>

        {/* Routing & Provider Attribution */}
        <div className="p-3 bg-[#16181f] rounded-lg border border-[#242833] flex flex-col justify-between text-xs">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>DATA ROUTING</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <p className="text-white font-bold font-mono text-xs truncate">
              {quote?.dataSource || `${instrument.primaryProvider.toUpperCase()} Direct`}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Latency: <span className="text-emerald-400 font-mono font-bold">{quote?.latencyMs || 25}ms</span> &bull;{' '}
              {instrument.marketTimezone}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            Feed Stamp: {quote?.timestamp || new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Asset-Specific Deep Metrics Bar */}
      {renderAssetSpecificBar(instrument)}
    </div>
  );
};

function renderAssetSpecificBar(instrument: NormalizedInstrument) {
  const cls = instrument.assetClass;

  // Options Greeks & Metrics
  if ((cls === 'OPTION' || cls === 'INDEX_OPTION') && instrument.greeks) {
    const g = instrument.greeks;
    return (
      <div className="mt-3 p-2.5 bg-[#14171f] border border-[#262b38] rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#D4AF37] mb-2">
          <span>OPTIONS DERIVATIVE METRICS & GREEKS</span>
          <span className="text-slate-400 font-normal">
            Type: {instrument.optionType} &bull; Strike: ${instrument.strikePrice} &bull; Exp: {instrument.expirationDate}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">IV</span>
            <span className="text-white font-bold">{g.iv ? `${(g.iv * 100).toFixed(1)}%` : 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">DELTA (&Delta;)</span>
            <span className="text-emerald-400 font-bold">{g.delta?.toFixed(3) ?? 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">GAMMA (&Gamma;)</span>
            <span className="text-cyan-400 font-bold">{g.gamma?.toFixed(4) ?? 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">THETA (&Theta;)</span>
            <span className="text-rose-400 font-bold">{g.theta?.toFixed(3) ?? 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">VEGA</span>
            <span className="text-amber-400 font-bold">{g.vega?.toFixed(3) ?? 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">OPEN INT</span>
            <span className="text-white font-bold">{g.openInterest?.toLocaleString() ?? 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Futures & Commodities Metrics
  if ((cls === 'FUTURES' || cls === 'COMMODITY') && instrument.futuresMetrics) {
    const f = instrument.futuresMetrics;
    return (
      <div className="mt-3 p-2.5 bg-[#14171f] border border-[#262b38] rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#D4AF37] mb-2">
          <span>FUTURES CONTRACT SPECIFICATIONS & EXPIRATION</span>
          <span className="text-slate-400 font-normal">
            Root: {instrument.contractRoot || instrument.symbol} &bull; Settlement: {instrument.settlementType || 'PHYSICAL'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">MULTIPLIER</span>
            <span className="text-white font-bold">{f.multiplier}x</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">TICK VALUE</span>
            <span className="text-[#F2D675] font-bold">${f.tickValue}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">EXPIRATION</span>
            <span className="text-white font-bold">{f.expirationDate}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">SETTLEMENT</span>
            <span className="text-emerald-400 font-bold">{f.settlementType}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">CONTRACT MONTH</span>
            <span className="text-white font-bold">{f.contractMonth}</span>
          </div>
        </div>
      </div>
    );
  }

  // Forex Metrics
  if (cls === 'FOREX' && instrument.forexMetrics) {
    const fx = instrument.forexMetrics;
    return (
      <div className="mt-3 p-2.5 bg-[#14171f] border border-[#262b38] rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#D4AF37] mb-2">
          <span>FOREX 24/5 MARKET SPECIFICATIONS</span>
          <span className="text-slate-400 font-normal">
            Base: {fx.baseCurrency} &bull; Quote: {fx.quoteCurrency}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">PIP SIZE</span>
            <span className="text-white font-bold">{fx.pipSize}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">SPREAD (PIPS)</span>
            <span className="text-[#F2D675] font-bold">{fx.spreadPips} pips</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">ACTIVE SESSION</span>
            <span className="text-white font-bold">{fx.activeSession}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">24H RANGE</span>
            <span className="text-emerald-400 font-bold">{fx.low24h} - {fx.high24h}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fixed Income / Yields
  if ((cls === 'TREASURY' || cls === 'BOND') && instrument.bondMetrics) {
    const b = instrument.bondMetrics;
    return (
      <div className="mt-3 p-2.5 bg-[#14171f] border border-[#262b38] rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#D4AF37] mb-2">
          <span>FIXED INCOME & BENCHMARK YIELD STRUCTURE</span>
          <span className="text-slate-400 font-normal">Maturity: {b.maturityDate}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">YIELD TO MATURITY</span>
            <span className="text-[#F2D675] font-bold">{typeof b.yieldToMaturity === 'number' && !isNaN(b.yieldToMaturity) ? `${b.yieldToMaturity.toFixed(3)}%` : 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">COUPON</span>
            <span className="text-white font-bold">{typeof b.couponRate === 'number' && !isNaN(b.couponRate) ? `${b.couponRate.toFixed(2)}%` : 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">DURATION</span>
            <span className="text-cyan-400 font-bold">{b.durationYears ? `${b.durationYears.toFixed(1)} Yrs` : 'N/A'}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">CREDIT RATING</span>
            <span className="text-emerald-400 font-bold">{b.rating || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Macro / Economic Indicators
  if (cls === 'ECONOMIC_INDICATOR' && instrument.economicMetrics) {
    const em = instrument.economicMetrics;
    return (
      <div className="mt-3 p-2.5 bg-[#14171f] border border-[#262b38] rounded-lg">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#D4AF37] mb-2">
          <span>MACROECONOMIC SERIES DATA & CONSENSUS FORECAST</span>
          <span className="text-slate-400 font-normal">Source Agency: {em.sourceAgency}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">ACTUAL VALUE</span>
            <span className="text-white font-bold">{em.lastReading} {em.unit}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">CONSENSUS FORECAST</span>
            <span className="text-slate-300 font-bold">{em.consensusForecast || 'N/A'} {em.unit}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">FREQUENCY</span>
            <span className="text-cyan-400 font-bold">{em.frequency}</span>
          </div>
          <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
            <span className="text-slate-500 text-[10px] block">NEXT RELEASE</span>
            <span className="text-[#F2D675] font-bold">{em.nextReleaseDate || 'Scheduled'}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

import React from 'react';
import { Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { isFiniteMarketNumber } from '../utils/formatters';

interface SupportResistanceViewProps {
  data: ComprehensiveMarketData;
}

export const SupportResistanceView: React.FC<SupportResistanceViewProps> = ({ data }) => {
  const { quote, technicals, supportResistance } = data;
  const currentPrice = quote.price;

  const levels = [
    { name: 'Resistance 3 (R3)', price: supportResistance.r3, type: 'RESISTANCE', note: 'Extreme Overbought Target / 2x ATR Extension', strength: 'Strong' },
    { name: 'Resistance 2 (R2)', price: supportResistance.r2, type: 'RESISTANCE', note: 'Prior Swing High & Call Wall Cluster', strength: 'Very Strong' },
    { name: 'Resistance 1 (R1)', price: supportResistance.r1, type: 'RESISTANCE', note: 'Primary Overhead Pivot & 15m Range High', strength: 'Key Level' },
    { name: 'Intraday VWAP', price: technicals.vwap, type: 'PIVOT', note: 'Institutional Volume-Weighted Average Price', strength: 'Critical Baseline' },
    { name: 'Support 1 (S1)', price: supportResistance.s1, type: 'SUPPORT', note: 'Primary Floor / 20 EMA Confluence', strength: 'Key Level' },
    { name: 'Support 2 (S2)', price: supportResistance.s2, type: 'SUPPORT', note: 'Prior Day Low & Major Gamma Put Wall', strength: 'Very Strong' },
    { name: 'Support 3 (S3)', price: supportResistance.s3, type: 'SUPPORT', note: 'Major Weekly Value Area Low', strength: 'Strong' },
  ];

  const breakoutSignals = [
    {
      condition: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(supportResistance.r1) && currentPrice > supportResistance.r1,
      text: `${quote.ticker} broke above R1 resistance (${isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A'}) with active volume.`,
      status: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(supportResistance.r1) && currentPrice > supportResistance.r1 ? 'ACTIVE' : 'WATCHING',
      type: 'BULLISH',
    },
    {
      condition: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(technicals.vwap) && currentPrice >= technicals.vwap,
      text: `${quote.ticker} reclaimed and holds above intraday VWAP (${isFiniteMarketNumber(technicals.vwap) ? `$${technicals.vwap.toFixed(2)}` : 'N/A'}).`,
      status: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(technicals.vwap) && currentPrice >= technicals.vwap ? 'CONFIRMED' : 'INVALIDATED',
      type: 'BULLISH',
    },
    {
      condition: isFiniteMarketNumber(quote.dayHigh) && isFiniteMarketNumber(technicals.prevDayHigh) && quote.dayHigh > technicals.prevDayHigh,
      text: `${quote.ticker} is making higher highs and higher lows on intraday structure.`,
      status: isFiniteMarketNumber(quote.dayHigh) && isFiniteMarketNumber(technicals.prevDayHigh) && quote.dayHigh > technicals.prevDayHigh ? 'ACTIVE' : 'WATCHING',
      type: 'BULLISH',
    },
    {
      condition: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(supportResistance.s1) && currentPrice < supportResistance.s1,
      text: `${quote.ticker} broke below key support S1 (${isFiniteMarketNumber(supportResistance.s1) ? `$${supportResistance.s1.toFixed(2)}` : 'N/A'}).`,
      status: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(supportResistance.s1) && currentPrice < supportResistance.s1 ? 'ALERT' : 'INACTIVE',
      type: 'BEARISH',
    },
    {
      condition: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(technicals.prevDayLow) && currentPrice < technicals.prevDayLow,
      text: `${quote.ticker} broke below previous-day low (${isFiniteMarketNumber(technicals.prevDayLow) ? `$${technicals.prevDayLow.toFixed(2)}` : 'N/A'}).`,
      status: isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(technicals.prevDayLow) && currentPrice < technicals.prevDayLow ? 'DANGER' : 'INACTIVE',
      type: 'BEARISH',
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Banner: Active Status & Breakout Engine */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Automated Support & Resistance Engine
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">Current Level Status:</span>
            <span className="px-2 py-0.5 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded font-bold font-mono text-[10px]">
              {supportResistance.breakoutStatus}
            </span>
          </div>
        </div>

        {/* Real-Time Breakout Signal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {breakoutSignals.map((sig, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                sig.status === 'CONFIRMED' || sig.status === 'ACTIVE'
                  ? sig.type === 'BULLISH'
                    ? 'bg-[#10b981]/10 border-[#10b981]/40 text-slate-200'
                    : 'bg-rose-500/10 border-rose-500/40 text-slate-200'
                  : 'bg-[#1c1f24] border-[#2d3139] text-slate-400 opacity-70'
              }`}
            >
              {sig.type === 'BULLISH' ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold leading-tight text-white">{sig.text}</span>
                <span
                  className={`text-[9px] font-mono font-bold mt-1 uppercase ${
                    sig.status === 'CONFIRMED' || sig.status === 'ACTIVE'
                      ? 'text-emerald-400'
                      : sig.status === 'DANGER' || sig.status === 'ALERT'
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  Status: {sig.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Support & Resistance Ladder Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex justify-between items-center">
          <span>Price Zone Ladder & Distance Calculations</span>
          <span className="text-[9px] font-mono text-emerald-400">
            Most Critical Resistance: {isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A'} | Most Critical Support: {isFiniteMarketNumber(supportResistance.s1) ? `$${supportResistance.s1.toFixed(2)}` : 'N/A'}
          </span>
        </div>

        <div className="divide-y divide-[#22262d] text-xs mt-1">
          {levels.map((lvl) => {
            const hasValidDistance = isFiniteMarketNumber(currentPrice) && isFiniteMarketNumber(lvl.price) && lvl.price > 0;
            const distance = hasValidDistance ? currentPrice - lvl.price : 0;
            const distancePct = hasValidDistance ? ((distance / lvl.price) * 100).toFixed(2) : 'N/A';
            const isAbove = hasValidDistance ? currentPrice >= lvl.price : true;

            return (
              <div
                key={lvl.name}
                className={`py-2.5 px-3 flex flex-wrap justify-between items-center gap-2 rounded transition ${
                  lvl.name.includes('R1')
                    ? 'bg-rose-950/20 border-l-2 border-rose-500'
                    : lvl.name.includes('S1')
                    ? 'bg-emerald-950/20 border-l-2 border-emerald-500'
                    : lvl.name.includes('VWAP')
                    ? 'bg-indigo-950/20 border-l-2 border-[#6366f1]'
                    : 'hover:bg-[#1c1f24]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      lvl.type === 'RESISTANCE'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : lvl.type === 'SUPPORT'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-[#6366f1]/20 text-[#a5b4fc] border-[#6366f1]/40'
                    }`}
                  >
                    {lvl.name}
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {isFiniteMarketNumber(lvl.price) ? `$${lvl.price.toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">&bull; {lvl.note}</span>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase">Distance</span>
                    <span className={`font-bold ${isAbove ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {hasValidDistance ? `${isAbove ? '+' : ''}$${Math.abs(distance).toFixed(2)} (${isAbove ? '+' : ''}${distancePct}%)` : 'N/A'}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      lvl.strength === 'Key Level' || lvl.strength === 'Critical Baseline'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lvl.strength}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

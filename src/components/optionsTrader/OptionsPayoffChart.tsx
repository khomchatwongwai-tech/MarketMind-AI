import React, { useState, useMemo } from 'react';
import { OptionContract, OptionType } from '../../types/optionsTrader';
import { calculateBlackScholes } from '../../services/options/blackScholesEngine';

interface OptionsPayoffChartProps {
  contract: OptionContract;
  spotPrice: number;
  entryPrice?: number;
  simulatedDTE?: number;
  simulatedIV?: number;
  height?: number;
}

export const OptionsPayoffChart: React.FC<OptionsPayoffChartProps> = ({
  contract,
  spotPrice,
  entryPrice = contract.mid,
  simulatedDTE = contract.dte,
  simulatedIV = contract.iv,
  height = 240,
}) => {
  const [hoverX, setHoverX] = useState<number | null>(null);

  const strike = contract.strike;
  const isCall = contract.type === 'CALL';
  const premiumPaid = entryPrice;

  // Generate range of prices for X-axis (+/- 15% around spot/strike)
  const { minPrice, maxPrice, priceStep, points } = useMemo(() => {
    const center = spotPrice;
    const spread = center * 0.18;
    const minP = Math.max(1, center - spread);
    const maxP = center + spread;
    const step = (maxP - minP) / 60;

    const pts: {
      price: number;
      expiryPL: number;
      t0PL: number;
    }[] = [];

    for (let p = minP; p <= maxP; p += step) {
      // Expiration Payoff (per 1 contract = 100 shares)
      const intrinsicAtExpiry = isCall ? Math.max(0, p - strike) : Math.max(0, strike - p);
      const expiryPL = (intrinsicAtExpiry - premiumPaid) * 100;

      // Pre-expiration (T+0 or current simulated DTE)
      const tYears = Math.max(0.0001, simulatedDTE / 365);
      const bsResult = calculateBlackScholes(contract.type, {
        spotPrice: p,
        strikePrice: strike,
        timeToExpiryYears: tYears,
        volatility: simulatedIV,
      });
      const t0PL = (bsResult.price - premiumPaid) * 100;

      pts.push({
        price: Number(p.toFixed(2)),
        expiryPL: Number(expiryPL.toFixed(2)),
        t0PL: Number(t0PL.toFixed(2)),
      });
    }

    return { minPrice: minP, maxPrice: maxP, priceStep: step, points: pts };
  }, [spotPrice, strike, isCall, premiumPaid, simulatedDTE, simulatedIV, contract.type]);

  // Find min and max PL for Y-axis scaling
  const { minPL, maxPL } = useMemo(() => {
    let min = -premiumPaid * 100;
    let max = premiumPaid * 100 * 2;
    for (const pt of points) {
      if (pt.expiryPL < min) min = pt.expiryPL;
      if (pt.expiryPL > max) max = pt.expiryPL;
      if (pt.t0PL < min) min = pt.t0PL;
      if (pt.t0PL > max) max = pt.t0PL;
    }
    // Padding
    const pad = (max - min) * 0.15;
    return { minPL: min - pad, maxPL: max + pad };
  }, [points, premiumPaid]);

  // Coordinate conversion helpers
  const svgWidth = 650;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getX = (price: number) => {
    return paddingLeft + ((price - minPrice) / (maxPrice - minPrice)) * plotWidth;
  };

  const getY = (pl: number) => {
    return paddingTop + (1 - (pl - minPL) / (maxPL - minPL)) * plotHeight;
  };

  const zeroY = getY(0);
  const spotX = getX(spotPrice);
  const strikeX = getX(strike);
  const breakeven = isCall ? strike + premiumPaid : strike - premiumPaid;
  const breakevenX = getX(breakeven);

  // SVG Paths
  const expiryPath = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      const x = getX(pt.price);
      const y = getY(pt.expiryPL);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  }, [points, minPrice, maxPrice, minPL, maxPL]);

  const t0Path = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      const x = getX(pt.price);
      const y = getY(pt.t0PL);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  }, [points, minPrice, maxPrice, minPL, maxPL]);

  // Hover data
  const hoveredPoint = useMemo(() => {
    if (hoverX === null) return null;
    const priceUnderCursor = minPrice + ((hoverX - paddingLeft) / plotWidth) * (maxPrice - minPrice);
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr.price - priceUnderCursor) < Math.abs(prev.price - priceUnderCursor) ? curr : prev
    );
    return closest;
  }, [hoverX, minPrice, maxPrice, points]);

  return (
    <div className="relative w-full select-none bg-[#0A0A0A] rounded-xl border border-[#222] p-2 flex flex-col">
      {/* Legend & Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 text-[10px] text-slate-400 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#D4AF37]" />
            <span className="text-slate-300 font-semibold">T+{simulatedDTE > 0 ? `${simulatedDTE}D` : '0'} Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-400 stroke-dasharray" />
            <span className="text-slate-300 font-semibold">Expiration Payoff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Spot: ${spotPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Breakeven: ${breakeven.toFixed(2)}</span>
          </div>
        </div>

        {hoveredPoint && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-300">Price: ${hoveredPoint.price.toFixed(2)}</span>
            <span
              className={`font-bold ${
                hoveredPoint.expiryPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              Exp P/L: {hoveredPoint.expiryPL >= 0 ? '+' : ''}${hoveredPoint.expiryPL.toFixed(0)} (
              {((hoveredPoint.expiryPL / (premiumPaid * 100)) * 100).toFixed(1)}%)
            </span>
            <span className="text-[#D4AF37]">
              T+{simulatedDTE}D P/L: {hoveredPoint.t0PL >= 0 ? '+' : ''}${hoveredPoint.t0PL.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (x >= paddingLeft && x <= svgWidth - paddingRight) {
              setHoverX(x);
            }
          }}
          onMouseLeave={() => setHoverX(null)}
        >
          {/* Defs / Gradients */}
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={zeroY}
            x2={svgWidth - paddingRight}
            y2={zeroY}
            stroke="#404040"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Vertical Guides */}
          {/* Current Spot Line */}
          <line
            x1={spotX}
            y1={paddingTop}
            x2={spotX}
            y2={height - paddingBottom}
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
          <text x={spotX} y={paddingTop - 5} fill="#38BDF8" fontSize="9" textAnchor="middle" fontWeight="bold">
            Spot ${spotPrice.toFixed(1)}
          </text>

          {/* Strike Line */}
          <line
            x1={strikeX}
            y1={paddingTop}
            x2={strikeX}
            y2={height - paddingBottom}
            stroke="#A3A3A3"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <text x={strikeX} y={height - paddingBottom + 12} fill="#A3A3A3" fontSize="9" textAnchor="middle">
            Strike ${strike}
          </text>

          {/* Breakeven Line */}
          {breakeven >= minPrice && breakeven <= maxPrice && (
            <>
              <line
                x1={breakevenX}
                y1={paddingTop}
                x2={breakevenX}
                y2={height - paddingBottom}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <text x={breakevenX} y={paddingTop - 5} fill="#F59E0B" fontSize="9" textAnchor="middle" fontWeight="bold">
                BE ${breakeven.toFixed(1)}
              </text>
            </>
          )}

          {/* Expiration Payoff Line */}
          <path d={expiryPath} fill="none" stroke="#10B981" strokeWidth="2.5" />

          {/* T+0 / Simulated Curve */}
          <path d={t0Path} fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="5,3" />

          {/* Hover indicator */}
          {hoverX !== null && hoveredPoint && (
            <>
              <line
                x1={hoverX}
                y1={paddingTop}
                x2={hoverX}
                y2={height - paddingBottom}
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle
                cx={hoverX}
                cy={getY(hoveredPoint.expiryPL)}
                r="4.5"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={hoverX}
                cy={getY(hoveredPoint.t0PL)}
                r="4.5"
                fill="#D4AF37"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Y-Axis Label */}
          <text x={paddingLeft - 8} y={zeroY + 3} fill="#9CA3AF" fontSize="9" textAnchor="end" fontFamily="monospace">
            $0
          </text>
          <text x={paddingLeft - 8} y={paddingTop + 10} fill="#10B981" fontSize="9" textAnchor="end" fontFamily="monospace">
            +${maxPL > 0 ? maxPL.toFixed(0) : ''}
          </text>
          <text x={paddingLeft - 8} y={height - paddingBottom - 5} fill="#EF4444" fontSize="9" textAnchor="end" fontFamily="monospace">
            -${Math.abs(minPL).toFixed(0)}
          </text>
        </svg>
      </div>
    </div>
  );
};

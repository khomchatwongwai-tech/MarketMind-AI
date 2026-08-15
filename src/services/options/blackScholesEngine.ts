import { OptionType, OptionPLScenario } from '../../types/optionsTrader';

/**
 * Standard Normal Probability Density Function (PDF)
 */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * High-precision approximation of the Cumulative Normal Distribution Function (CDF)
 * Abramowitz & Stegun approximation (error < 7.5e-8)
 */
export function normalCdf(x: number): number {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;

  if (x >= 0) {
    const k = 1.0 / (1.0 + p * x);
    const poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
    return 1.0 - normalPdf(x) * poly;
  } else {
    const k = 1.0 / (1.0 - p * x);
    const poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
    return normalPdf(x) * poly;
  }
}

export interface BlackScholesParams {
  spotPrice: number; // S: Current underlying price
  strikePrice: number; // K: Strike price
  timeToExpiryYears: number; // T: Time to expiration in years (DTE / 365)
  volatility: number; // sigma: Implied volatility (e.g. 0.25 for 25%)
  riskFreeRate?: number; // r: Risk-free rate (default: 0.045 for 4.5%)
  dividendYield?: number; // q: Dividend yield (default: 0.012 for SPY ~1.2%)
}

export interface BlackScholesResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // Per 1 calendar day decay in dollars
  vega: number; // Dollar change per 1% (0.01) change in IV
  rho: number; // Dollar change per 1% change in interest rate
  d1: number;
  d2: number;
  intrinsicValue: number;
  extrinsicValue: number;
}

/**
 * Calculate Black-Scholes price and Greeks for a Call or Put option
 */
export function calculateBlackScholes(
  type: OptionType,
  params: BlackScholesParams
): BlackScholesResult {
  const {
    spotPrice: S,
    strikePrice: K,
    timeToExpiryYears: T_raw,
    volatility: sigma_raw,
    riskFreeRate: r = 0.045,
    dividendYield: q = 0.012,
  } = params;

  // Protect against zero or negative time / volatility bounds
  const T = Math.max(0.0001, T_raw);
  const sigma = Math.max(0.01, sigma_raw);

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const exp_neg_qT = Math.exp(-q * T);
  const exp_neg_rT = Math.exp(-r * T);

  const Nd1 = normalCdf(d1);
  const Nd2 = normalCdf(d2);
  const N_neg_d1 = normalCdf(-d1);
  const N_neg_d2 = normalCdf(-d2);
  const pdf_d1 = normalPdf(d1);

  let price = 0;
  let delta = 0;
  let thetaYearly = 0;
  let rho = 0;

  if (type === 'CALL') {
    price = S * exp_neg_qT * Nd1 - K * exp_neg_rT * Nd2;
    delta = exp_neg_qT * Nd1;
    thetaYearly =
      -(S * exp_neg_qT * pdf_d1 * sigma) / (2 * sqrtT) -
      r * K * exp_neg_rT * Nd2 +
      q * S * exp_neg_qT * Nd1;
    rho = (K * T * exp_neg_rT * Nd2) / 100;
  } else {
    price = K * exp_neg_rT * N_neg_d2 - S * exp_neg_qT * N_neg_d1;
    delta = -exp_neg_qT * N_neg_d1;
    thetaYearly =
      -(S * exp_neg_qT * pdf_d1 * sigma) / (2 * sqrtT) +
      r * K * exp_neg_rT * N_neg_d2 -
      q * S * exp_neg_qT * N_neg_d1;
    rho = (-K * T * exp_neg_rT * N_neg_d2) / 100;
  }

  // Gamma and Vega are identical for Call and Put
  const gamma = (exp_neg_qT * pdf_d1) / (S * sigma * sqrtT);
  const vega = (S * exp_neg_qT * pdf_d1 * sqrtT) / 100; // Per 1% IV move
  const theta = thetaYearly / 365; // Per 1 day

  const safePrice = Math.max(0.01, Number(price.toFixed(4)));
  const intrinsicValue =
    type === 'CALL' ? Math.max(0, S - K) : Math.max(0, K - S);
  const extrinsicValue = Math.max(0, safePrice - intrinsicValue);

  return {
    price: safePrice,
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(5)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    rho: Number(rho.toFixed(4)),
    d1: Number(d1.toFixed(4)),
    d2: Number(d2.toFixed(4)),
    intrinsicValue: Number(intrinsicValue.toFixed(2)),
    extrinsicValue: Number(extrinsicValue.toFixed(2)),
  };
}

/**
 * Numerical Inversion to find Implied Volatility (Newton-Raphson with bisection fallback)
 */
export function calculateImpliedVolatility(
  targetPrice: number,
  type: OptionType,
  spotPrice: number,
  strikePrice: number,
  timeToExpiryYears: number,
  riskFreeRate: number = 0.045,
  dividendYield: number = 0.012
): number {
  if (targetPrice <= 0 || timeToExpiryYears <= 0) return 0.20;

  // Intrinsic value check
  const intrinsic =
    type === 'CALL'
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);

  if (targetPrice <= intrinsic) {
    return 0.15;
  }

  let sigma = 0.30; // Initial guess
  const maxIterations = 50;
  const tolerance = 1e-4;

  for (let i = 0; i < maxIterations; i++) {
    const result = calculateBlackScholes(type, {
      spotPrice,
      strikePrice,
      timeToExpiryYears,
      volatility: sigma,
      riskFreeRate,
      dividendYield,
    });

    const diff = result.price - targetPrice;
    if (Math.abs(diff) < tolerance) {
      return Number(sigma.toFixed(4));
    }

    const vega = result.vega * 100; // un-scale vega
    if (Math.abs(vega) < 1e-6) break;

    const nextSigma = sigma - diff / vega;
    if (nextSigma <= 0.001 || nextSigma > 5.0) {
      break; // Fallback to bisection
    }
    sigma = nextSigma;
  }

  // Fallback: Bisection Method
  let low = 0.01;
  let high = 5.0;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const midPrice = calculateBlackScholes(type, {
      spotPrice,
      strikePrice,
      timeToExpiryYears,
      volatility: mid,
      riskFreeRate,
      dividendYield,
    }).price;

    if (Math.abs(midPrice - targetPrice) < tolerance) {
      return Number(mid.toFixed(4));
    }
    if (midPrice < targetPrice) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Number(((low + high) / 2).toFixed(4));
}

/**
 * Generate full Options P/L Simulation across price scenarios and time steps
 */
export function generateOptionPLScenarios(
  type: OptionType,
  entrySpotPrice: number,
  strikePrice: number,
  totalDTE: number,
  currentIV: number,
  entryPremium: number,
  customPriceTarget?: number,
  ivShockPercent: number = 0
): OptionPLScenario[] {
  const priceScenarios = [
    { label: '-10%', mult: 0.90 },
    { label: '-5%', mult: 0.95 },
    { label: '-2%', mult: 0.98 },
    { label: 'Current (0%)', mult: 1.00 },
    { label: '+2%', mult: 1.02 },
    { label: '+5%', mult: 1.05 },
    { label: '+10%', mult: 1.10 },
  ];

  if (customPriceTarget && customPriceTarget > 0) {
    const diffPct = ((customPriceTarget - entrySpotPrice) / entrySpotPrice) * 100;
    priceScenarios.push({
      label: `Target $${customPriceTarget.toFixed(2)} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%)`,
      mult: customPriceTarget / entrySpotPrice,
    });
  }

  // Sort scenarios by mult
  priceScenarios.sort((a, b) => a.mult - b.mult);

  const effectiveIV = Math.max(0.05, currentIV * (1 + ivShockPercent / 100));

  const results: OptionPLScenario[] = [];

  for (const p of priceScenarios) {
    const simSpot = entrySpotPrice * p.mult;

    // Simulate at today (T=0)
    const todayResult = calculateBlackScholes(type, {
      spotPrice: simSpot,
      strikePrice,
      timeToExpiryYears: Math.max(0.0001, totalDTE / 365),
      volatility: effectiveIV,
    });

    const estimatedContractValue = todayResult.price;
    const estimatedPL = (estimatedContractValue - entryPremium) * 100; // per 1 contract (100 shares)
    const percentReturn = ((estimatedContractValue - entryPremium) / entryPremium) * 100;
    const thetaDecayEffect = todayResult.theta * 100; // 1-day theta effect in $
    const ivSensitivityEffect = todayResult.vega * 100; // 1% IV change in $

    results.push({
      underlyingPrice: Number(simSpot.toFixed(2)),
      percentChange: Number(((p.mult - 1) * 100).toFixed(2)),
      timePoint: 'Today',
      daysRemaining: totalDTE,
      estimatedContractValue: Number(estimatedContractValue.toFixed(2)),
      estimatedPL: Number(estimatedPL.toFixed(2)),
      percentReturn: Number(percentReturn.toFixed(2)),
      thetaDecayEffect: Number(thetaDecayEffect.toFixed(2)),
      ivSensitivityEffect: Number(ivSensitivityEffect.toFixed(2)),
    });
  }

  return results;
}

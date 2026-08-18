import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LineChart,
  Target,
  BotMessageSquare,
  Layers,
  Bell,
  Radio,
} from 'lucide-react';
import { UserService } from '../services/userService';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to MarketMind AI',
      subtitle: 'Institutional-Grade Multi-Asset Quantitative Terminal',
      icon: Sparkles,
      iconColor: 'text-[#818cf8]',
      description:
        'MarketMind AI combines sub-second live market feeds with Google Gemini 3.7 Flash AI to provide actionable quantitative directional probabilities, support/resistance levels, and institutional flow alerts.',
      badge: 'Step 1 of 6',
      tips: [
        'Real-time tick-by-tick streaming via Massive WebSocket',
        'Multi-timeframe bias validation (15M, 1H, 1D)',
        'Audited prediction ledger with Brier probability scoring',
      ],
    },
    {
      title: 'Interactive Candlestick Charting',
      subtitle: 'High-Performance Technical Canvas with EMA Ribbons & VWAP',
      icon: LineChart,
      iconColor: 'text-emerald-400',
      description:
        'Explore institutional candlestick charts with volume bars, VWAP anchor bands, EMA 9/20/50/200 overlays, RSI (14), and real-time live price flash ticks.',
      badge: 'Step 2 of 6',
      tips: [
        'Click chart timeframe buttons (1m, 5m, 15m, 1h, 1d) for instant multi-timeframe perspective',
        'Toggle volume profile and technical overlays dynamically',
        'Real-time simulation feed adapts continuously during active sessions',
      ],
    },
    {
      title: 'MarketMind AI Executive Card',
      subtitle: 'Live "Why is SPY Moving?" Drivers & Critical Pivots',
      icon: BotMessageSquare,
      iconColor: 'text-[#6366f1]',
      description:
        'Our Gemini 3.7 Flash engine analyzes real-time sector breadths, options sweep flow, and economic data to synthesize the core market driver in plain English.',
      badge: 'Step 3 of 6',
      tips: [
        'Directional bias score: BULLISH, BEARISH, or NEUTRAL',
        'Automated support & resistance key level boundaries',
        '1-click "Ask AI Assistant" deep drill-down questions',
      ],
    },
    {
      title: 'Support & Resistance & Quant Models',
      subtitle: 'Dynamic Mathematical Fibonacci & Liquidity Confluences',
      icon: Target,
      iconColor: 'text-rose-400',
      description:
        'Eliminate guesswork with mathematically calculated R1, R2, S1, S2 pivots, ATR-based risk channels, and probability-weighted setup quality tags.',
      badge: 'Step 4 of 6',
      tips: [
        'Green zones highlight high-probability long entry confluence',
        'Red zones highlight institutional profit-taking resistance',
        'Setup quality ratings: "Exceptional", "Strong", or "Wait for Confirmation"',
      ],
    },
    {
      title: 'Institutional Options Flow & Dark Pool Radar',
      subtitle: 'Unusual Volume Sweeps, Net Delta & Gamma Regimes',
      icon: Layers,
      iconColor: 'text-purple-400',
      description:
        'Track smart-money positioning before major moves happen. View live Put/Call ratios, open interest shifts, and dealer Gamma pinning levels.',
      badge: 'Step 5 of 6',
      tips: [
        'Dark pool block print detection across consolidated tape',
        'Gamma exposure regime highlights low vs high volatility environments',
        'Real-time option sweep tracking with strike and expiration details',
      ],
    },
    {
      title: 'Custom Watchlists, Alerts & PDF Reports',
      subtitle: 'Seamless Multi-Asset Tracking & Webhook Forwarding',
      icon: Bell,
      iconColor: 'text-amber-400',
      description:
        'Set up custom price and indicator alerts that dispatch directly to Discord or Telegram. Export institutional research reports with 1 click.',
      badge: 'Step 6 of 6',
      tips: [
        'Create custom watchlists with live sparklines and quick terminal jump',
        'Dispatch instant webhooks when VWAP or key resistance breaks',
        'Export morning prep and EOD settlement reports in PDF, CSV, or JSON',
      ],
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const handleFinish = () => {
    UserService.setOnboardingCompleted(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-[#e2e8f0]">
        {/* Top Header */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded font-mono font-bold uppercase">
              {current.badge}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Terminal Onboarding Tour
            </span>
          </div>
          <button
            onClick={handleFinish}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#2d3139] rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-[#1c1f24] border border-[#2d3139] flex items-center justify-center shrink-0 ${current.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{current.title}</h2>
              <p className="text-xs text-slate-400 font-medium">{current.subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {current.description}
          </p>

          {/* Key Tips Box */}
          <div className="p-3.5 bg-[#121316] rounded-xl border border-[#2d3139] space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Pro Terminal Tips
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {current.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-6 bg-[#6366f1]' : 'w-2 bg-[#2d3139] hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#1c1f24] border-t border-[#2d3139] flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-3 py-1.5 bg-[#252830] hover:bg-[#2d3139] text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-40 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <span>Launch Terminal</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

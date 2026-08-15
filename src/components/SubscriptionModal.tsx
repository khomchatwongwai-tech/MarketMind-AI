import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  Shield,
  Crown,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { SubscriptionPlanTier, UserProfile } from '../types/user';
import { UserService } from '../services/userService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onPlanUpdated: (user: UserProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPlanUpdated,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedTier, setSelectedTier] = useState<SubscriptionPlanTier>(currentUser.plan);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const plans: {
    id: SubscriptionPlanTier;
    name: string;
    badge?: string;
    icon: React.ElementType;
    priceMonthly: number;
    priceAnnualMonthly: number;
    description: string;
    features: string[];
    highlight?: boolean;
  }[] = [
    {
      id: 'free',
      name: 'Free Explorer',
      icon: Shield,
      priceMonthly: 0,
      priceAnnualMonthly: 0,
      description: 'Essential market data & basic indicators for retail traders.',
      features: [
        '15-minute delayed market quotes',
        'Standard Candlestick charts',
        '5 Gemini AI questions per day',
        '3 Active price alerts',
        '1 Watchlist (up to 5 tickers)',
        'Community access',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Trader',
      badge: 'MOST POPULAR',
      icon: Zap,
      priceMonthly: 49,
      priceAnnualMonthly: 39,
      description: 'Real-time WebSocket feeds, unlimited AI analysis & quantitative indicator engines.',
      highlight: true,
      features: [
        'Real-time tick-by-tick WebSocket stream',
        'Unlimited Gemini Market AI Analysis',
        'Full Technical Engine (EMAs, VWAP, RSI, MACD)',
        'Support & Resistance dynamic pivots',
        'Real-time Options Flow & Put/Call ratios',
        'Unlimited saved alerts with webhooks',
        'Morning & EOD Intelligence Reports',
        '5 Custom Watchlists with live sparklines',
      ],
    },
    {
      id: 'institutional',
      name: 'Institutional Alpha',
      badge: 'FULL QUANT SUITE',
      icon: Crown,
      priceMonthly: 199,
      priceAnnualMonthly: 159,
      description: 'Prop desk quantitative models, dark pool liquidity radar & programmatic API access.',
      features: [
        'Everything in Pro Trader',
        'Dark Pool print radar & Gamma exposure maps',
        'Direct Market Data REST & WebSocket API',
        'Historical backtesting & probability engine',
        'Predictive AI machine learning signal store',
        'Custom Webhook signals directly to bots',
        'Priority low-latency server cluster',
        'Dedicated quant strategist Slack channel',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise / Fund',
      icon: Building2,
      priceMonthly: 499,
      priceAnnualMonthly: 399,
      description: 'Multi-seat trading floor integration, custom model weights & dedicated SLA.',
      features: [
        'Everything in Institutional Alpha',
        'Unlimited team seats & role management',
        'Custom model fine-tuning on proprietary data',
        'Direct Chicago / New York cross-connects',
        'SOC2 Type II & regulatory export logs',
        'Dedicated 24/7 technical account manager',
        'Custom billing & invoice terms',
      ],
    },
  ];

  const handleUpgrade = (tier: SubscriptionPlanTier) => {
    setIsCheckingOut(true);
    setTimeout(() => {
      const updated = UserService.updatePlan(tier, billingCycle);
      onPlanUpdated(updated);
      setIsCheckingOut(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-[#E5E5E5]">
        {/* Header */}
        <div className="p-4 bg-[#101010] border-b border-[#1C1C1C] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#151515] border border-[rgba(212,175,55,0.4)] flex items-center justify-center text-[#D4AF37]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <span>Subscription Plans &amp; Upgrades</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 rounded-full font-mono">
                  Active: {currentUser.plan.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Unlock institutional-grade market intelligence, zero-latency order flow &amp; Gemini AI signals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#151515] rounded-lg transition border border-transparent hover:border-[#242424]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="p-3 bg-[#050505] border-b border-[#1C1C1C] flex justify-center items-center gap-3">
          <span
            className={`text-xs font-semibold ${
              billingCycle === 'monthly' ? 'text-white' : 'text-[#9CA3AF]'
            }`}
          >
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-12 h-6 bg-[#1C1C1C] rounded-full p-0.5 transition-colors duration-200 border border-[#242424]"
          >
            <div
              className={`w-5 h-5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] rounded-full shadow-md transform transition-transform duration-200 ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                billingCycle === 'annual' ? 'text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Annual Billing
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 rounded font-bold font-mono uppercase">
              Save 20%
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentUser.plan === plan.id;
            const price = billingCycle === 'annual' ? plan.priceAnnualMonthly : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  plan.highlight
                    ? 'bg-[#101010] border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.15)]'
                    : 'bg-[#101010] border-[#242424] hover:border-[rgba(212,175,55,0.4)]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-md font-mono">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        plan.highlight
                          ? 'bg-[#151515] border border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'bg-[#151515] text-[#9CA3AF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-white">{plan.name}</h3>
                  </div>

                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed mb-3 min-h-[34px]">
                    {plan.description}
                  </p>

                  <div className="mb-4 pb-3 border-b border-[#1C1C1C]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-white">
                        ${price}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">/ month</span>
                    </div>
                    {billingCycle === 'annual' && plan.priceMonthly > 0 && (
                      <span className="text-[10px] text-[#F2D675] font-mono">
                        Billed annually (${price * 12}/yr)
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 mb-4 text-[11px]">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#E5E5E5]">
                        <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || isCheckingOut}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                      isCurrent
                        ? 'bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] cursor-default'
                        : plan.highlight
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#FFE08A] hover:to-[#D4AF37] text-black font-black'
                        : 'bg-[#151515] hover:bg-[#202020] text-white border border-[#242424] hover:border-[#D4AF37]/50'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Current Active Plan</span>
                      </>
                    ) : (
                      <>
                        <span>Select {plan.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Enterprise & Security Assurance */}
        <div className="p-3.5 bg-[#050505] border-t border-[#1C1C1C] flex flex-wrap justify-between items-center text-[10px] text-[#9CA3AF] gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Instant invoice PDF generation with credit card, ACH wire, &amp; crypto accepted.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Cancel or switch anytime</span>
            <span>&bull;</span>
            <span>SOC2 Type II Certified</span>
            <span>&bull;</span>
            <span className="text-[#22C55E]">14-Day Money Back Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

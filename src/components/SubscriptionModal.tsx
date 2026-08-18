import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  Shield,
  Crown,
  Building2,
  CheckCircle2,
  ArrowRight,
  Receipt,
  AlertCircle,
  ExternalLink,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { SubscriptionPlanTier, UserProfile } from '../types/user';
import { SubscriptionPlanId, UserUsageRecord } from '../types/subscription';
import { UserService } from '../services/userService';
import { BillingService } from '../services/billingService';
import { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS } from '../config/plans';
import { AnalyticsService } from '../services/analyticsService';
import { LegalConsentService } from '../services/legalConsentService';
import { EntitlementService } from '../services/entitlementService';
import { LegalCenterModal, LegalCenterTab } from './legal/LegalCenterModal';
import { FinancialResearchDisclaimer } from './legal/FinancialResearchDisclaimer';

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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [userUsage, setUserUsage] = useState<UserUsageRecord | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [legalConsentChecked, setLegalConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalCenterTab | null>(null);

  useEffect(() => {
    if (isOpen) {
      AnalyticsService.track('pricing_viewed', {
        currentPlan: currentUser.plan,
        subscriptionStatus: currentUser.subscriptionStatus,
      });

      // Load active usage stats
      setIsLoadingUsage(true);
      BillingService.getUsage()
        .then((usage) => {
          if (usage) setUserUsage(usage);
        })
        .catch(() => {})
        .finally(() => setIsLoadingUsage(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const planCards: {
    id: SubscriptionPlanId;
    name: string;
    badge?: string;
    icon: React.ElementType;
    priceMonthly: number;
    priceAnnualMonthly: number;
    priceAnnualTotal: number;
    description: string;
    highlight?: boolean;
    tierTag: string;
    features: string[];
    deepResearchLimit: string;
    aiLimit: string;
  }[] = [
    {
      id: 'free',
      name: 'Free Explorer',
      icon: Shield,
      priceMonthly: 0,
      priceAnnualMonthly: 0,
      priceAnnualTotal: 0,
      tierTag: 'Free Forever',
      description: 'Essential market quotes, basic indicators, and sample AI capabilities.',
      deepResearchLimit: '1 report / month (max 3 sources)',
      aiLimit: '5 requests / day',
      features: [
        'Standard stock market quotes & charts',
        'Core technical indicators (SMA, EMA, RSI)',
        'Basic Bullish / Bearish trend bias',
        'Ask MarketMind AI (5 queries/day)',
        'Basic Deep Research (1 report/mo)',
        '1 Watchlist (up to 5 tickers)',
        '3 Active price alerts',
        'Community discussion access',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      icon: Activity,
      priceMonthly: 9.99,
      priceAnnualMonthly: 8.25,
      priceAnnualTotal: 99.0,
      tierTag: '$9.99 / mo',
      description: 'Affordable toolkit for beginning and casual investors starting their journey.',
      deepResearchLimit: '3 reports / month (max 6 sources)',
      aiLimit: '25 requests / day',
      features: [
        'Everything in Free',
        '1 Connected Brokerage Account (Read-Only)',
        'Ask MarketMind AI (25 requests/day)',
        'Deep Research (3 reports/mo, 6 sources)',
        'Basic stock scanner & sector heatmaps',
        'AI News sentiment & driver summaries',
        '3 Watchlists (15 tickers each)',
        '10 Active market price alerts',
        '10 Saved research reports',
        'CSV export of market data',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'MOST POPULAR',
      icon: Zap,
      priceMonthly: 19.99,
      priceAnnualMonthly: 16.58,
      priceAnnualTotal: 199.0,
      tierTag: '$19.99 / mo',
      highlight: true,
      description: 'Designed for active retail investors who need real-time streams and advanced analytics.',
      deepResearchLimit: '15 reports / month (max 12 sources)',
      aiLimit: '100 requests / day',
      features: [
        'Everything in Basic',
        'Real-time tick-by-tick WebSocket market feed',
        'Up to 5 Connected Brokerages with Risk Guardian™',
        'Ask MarketMind AI (100 requests/day)',
        'Deep Research (15 reports/mo, 12 sources)',
        'Earnings call intelligence & transcripts',
        'Macro trends & Fed rate sensitivity',
        'Multi-timeframe technical overlays',
        'Options chain flow & Put/Call ratios',
        '10 Watchlists (50 tickers each)',
        '50 Active technical alerts',
        '50 Saved research reports',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      badge: 'BEST FOR DEEP RESEARCH',
      icon: Sparkles,
      priceMonthly: 29.99,
      priceAnnualMonthly: 24.92,
      priceAnnualTotal: 299.0,
      tierTag: '$29.99 / mo',
      description: 'Built for serious investors requiring comprehensive institutional research.',
      deepResearchLimit: '40 reports / month (max 25 sources)',
      aiLimit: '250 requests / day',
      features: [
        'Everything in Pro',
        'Full Deep Research suite (40 reports/mo, 25 sources)',
        'Official SEC 10-K / 10-Q filing analysis',
        'Tone analysis & beat/miss probability',
        'Fed policy glidepath & macro modeling',
        'DCF & peer multiple valuation models',
        '"What Changed?" delta research tracking',
        'Unusual Options Flow & Gamma Exposure',
        'Professional PDF research reports export',
        'Ask MarketMind AI (250 requests/day)',
        '25 Watchlists (100 tickers each)',
        '100 Active multi-channel alerts',
        'Priority research queue processing',
      ],
    },
    {
      id: 'ultra',
      name: 'Ultra',
      badge: 'MAXIMUM ACCESS',
      icon: Crown,
      priceMonthly: 49.99,
      priceAnnualMonthly: 41.58,
      priceAnnualTotal: 499.0,
      tierTag: '$49.99 / mo',
      description: 'Highest usage allowances and priority compute for power investors & wealth managers.',
      deepResearchLimit: '100 reports / month (max 50 sources)',
      aiLimit: '600 requests / day',
      features: [
        'Everything in Premium',
        'Highest AI usage allowance (600 requests/day)',
        'Ultra Deep Research (100 reports/mo, 50 sources)',
        'Deep multi-step reasoning (up to 25 steps, 80k tokens)',
        'Dark pool liquidity radar & catalyst timelines',
        'Full options Greeks surface & volatility smiles',
        'Custom branded PDF report generation',
        '250 Saved research reports',
        '50 Watchlists (200 tickers each)',
        '250 Active multi-channel alerts',
        'Top-priority instant research queue',
        'Direct developer API keys with max rate limits',
        'Early access to new experimental AI models',
        'Dedicated 24/7 technical concierge support',
      ],
    },
  ];

  const handleStartTrial = async (tier: SubscriptionPlanId = 'pro') => {
    if (!legalConsentChecked) {
      setConsentError(true);
      setErrorMessage('Please review and check the legal agreements & disclaimer box below to proceed with your 15-day trial.');
      return;
    }

    setIsCheckingOut(true);
    setErrorMessage(null);
    setConsentError(false);
    setStatusMessage('Activating 15-day free trial on server...');

    AnalyticsService.track('trial_started', {
      planId: tier,
      email: currentUser.email,
    });

    // Record server-side legal consent
    LegalConsentService.submitConsent({
      userId: currentUser.id || currentUser.email,
      userEmail: currentUser.email,
      subscriptionPlan: tier,
      billingInterval: billingCycle,
      consentContext: 'trial_signup',
    }).catch((e) => console.warn('[Consent] Async log notice:', e));

    try {
      const res = await BillingService.startTrial(currentUser.email, tier);
      if (res.user) {
        UserService.saveUser(res.user);
        onPlanUpdated(res.user);
        setIsSuccess(true);
        setStatusMessage('15-Day Free Trial activated successfully!');
        setTimeout(() => {
          setIsSuccess(false);
          setStatusMessage(null);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('[SubscriptionModal] Trial error:', err);
      setErrorMessage(err.message || 'Unable to start trial. You may have already used your trial period.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setIsPortalLoading(true);
    setErrorMessage(null);
    setStatusMessage('Loading Stripe Customer Portal...');

    try {
      const res = await BillingService.createPortalSession(currentUser.email);
      if (res.portalUrl) {
        window.location.href = res.portalUrl;
      } else {
        setStatusMessage(res.message || 'Stripe Customer Portal is ready for live credentials.');
      }
    } catch (err: any) {
      console.error('[SubscriptionModal] Portal error:', err);
      setErrorMessage(err.message || 'Failed to initialize customer billing portal.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionPlanId) => {
    if (tier !== 'free' && !legalConsentChecked) {
      setConsentError(true);
      setErrorMessage('Please review and check the legal agreements & disclaimer box below to proceed.');
      return;
    }

    setIsCheckingOut(true);
    setErrorMessage(null);
    setConsentError(false);
    setStatusMessage(null);

    AnalyticsService.track('checkout_started', {
      planId: tier,
      billingCycle,
      email: currentUser.email,
    });

    if (tier !== 'free') {
      // Record server-side legal consent
      LegalConsentService.submitConsent({
        userId: currentUser.id || currentUser.email,
        userEmail: currentUser.email,
        subscriptionPlan: tier,
        billingInterval: billingCycle,
        consentContext: 'checkout',
      }).catch((e) => console.warn('[Consent] Async log notice:', e));
    }

    try {
      if (tier === 'free') {
        setStatusMessage('Updating subscription to Free tier...');
        const res = await BillingService.changePlan(currentUser.email, 'free', billingCycle);
        if (res.user) {
          UserService.saveUser(res.user);
          onPlanUpdated(res.user);
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            onClose();
          }, 1200);
        }
        return;
      }

      setStatusMessage('Creating secure Stripe checkout session...');
      const session = await BillingService.createCheckoutSession(currentUser.email, tier, billingCycle);

      if (session.checkoutUrl) {
        setStatusMessage('Redirecting to Stripe Checkout...');
        window.location.href = session.checkoutUrl;
        return;
      }

      if ((session as any).error) {
        throw new Error((session as any).error || 'Stripe Checkout is unavailable.');
      }

      throw new Error(
        session.message || 'Stripe checkout session could not be established. Set STRIPE_SECRET_KEY in server environment.'
      );
    } catch (err: any) {
      console.error('[SubscriptionModal] Upgrade error:', err);
      setErrorMessage(err.message || 'Failed to process subscription upgrade.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const normalizedCurrentPlan = (currentUser.plan || 'free').toLowerCase();
  const isPaidUser = normalizedCurrentPlan !== 'free' && currentUser.subscriptionStatus === 'active';
  const isTrialing = currentUser.subscriptionStatus === 'trialing' || currentUser.trialStatus === 'active';
  const canStartTrial = normalizedCurrentPlan === 'free' && !currentUser.hasUsedTrial && !isTrialing;

  return (
    <div
      id="modal-subscription-pricing"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
    >
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#E5E5E5]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#101010] border-b border-[#1C1C1C] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#151515] border border-[rgba(212,175,55,0.4)] flex items-center justify-center text-[#D4AF37] shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  INVEST SMARTER WITH MARKETMIND AI
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 rounded-full font-mono font-bold">
                  Current: {normalizedCurrentPlan.toUpperCase()}
                </span>
                {isTrialing && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-500/40 rounded-full font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    Trial ({currentUser.trialDaysRemaining ?? 15}d left)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Professional AI-powered market intelligence starting at $9.99/month.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaidUser && (
              <button
                id="btn-manage-stripe-portal"
                onClick={handleOpenCustomerPortal}
                disabled={isPortalLoading || isCheckingOut}
                className="px-3 py-1.5 text-xs font-semibold bg-[#1a1a1a] hover:bg-[#262626] text-[#F2D675] border border-[#D4AF37]/40 rounded-lg transition flex items-center gap-1.5 font-mono shadow-sm"
              >
                {isPortalLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                )}
                <span>Manage in Stripe Portal</span>
              </button>
            )}
            <button
              id="btn-close-subscription-modal"
              onClick={onClose}
              className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#151515] rounded-lg transition border border-transparent hover:border-[#242424]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trial Milestone Banner (Context-Aware for trialing or expired users) */}
        {isTrialing && (
          <div className="px-4 py-2.5 bg-blue-950/40 border-b border-blue-800/40 flex items-center justify-between gap-3 text-xs font-mono text-blue-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{EntitlementService.getTrialMilestoneMessage(currentUser)}</span>
            </div>
            <div className="text-[11px] text-blue-400">
              Ends {currentUser.trialEndsAt ? new Date(currentUser.trialEndsAt).toLocaleDateString() : 'soon'}
            </div>
          </div>
        )}

        {/* 15-Day Free Trial Callout Banner (For eligible users) */}
        {canStartTrial && (
          <div className="px-4 py-3 bg-gradient-to-r from-[#181504] via-[#221c08] to-[#181504] border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#F2D675]">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#F2D675] uppercase tracking-wide">
                  15-Day Free Trial Available
                </span>
                <p className="text-[11px] text-[#D1D5DB]">
                  Experience real-time feeds, 100 AI queries/day &amp; full Deep Research with no initial charge.
                </p>
              </div>
            </div>
            <button
              id="btn-activate-15day-trial"
              onClick={() => handleStartTrial('pro')}
              disabled={isCheckingOut}
              className="px-4 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#FFE08A] hover:to-[#D4AF37] text-black shadow-md transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Activate 15-Day Free Trial</span>
            </button>
          </div>
        )}

        {/* Status / Error Banner */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-red-950/60 border-b border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {statusMessage && !errorMessage && (
          <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-700/40 text-[#F2D675] text-xs flex items-center gap-2 font-mono">
            {isCheckingOut || isPortalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Billing Cycle Switcher & Comparison Toggle */}
        <div className="p-3 bg-[#050505] border-b border-[#1C1C1C] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <span
              className={`text-xs font-semibold ${
                billingCycle === 'monthly' ? 'text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Monthly Billing
            </span>
            <button
              id="btn-billing-cycle-toggle"
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
              <span className="text-[9px] px-2 py-0.5 bg-[#151515] text-[#22C55E] border border-[#22C55E]/40 rounded-full font-bold font-mono uppercase">
                Save ~17% (~2 Months Free)
              </span>
            </div>
          </div>

          <button
            id="btn-toggle-comparison-matrix"
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs text-[#9CA3AF] hover:text-white flex items-center gap-1 font-mono transition mx-auto sm:mx-0"
          >
            <span>{showComparison ? 'Hide Feature Matrix' : 'Compare All Features & Limits'}</span>
            {showComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live User Usage Summary Widget (If available) */}
        {userUsage && (
          <div className="px-4 py-2.5 bg-[#0D0D0D] border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <Cpu className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-bold text-white uppercase">Your Live Usage:</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[#9CA3AF]">AI Requests: </span>
                <span className="text-white font-bold">
                  {userUsage.todayAiRequestsCount} / {userUsage.todayAiRequestsLimit}
                </span>
                <span className="text-[10px] text-[#6B7280]"> (today)</span>
              </div>
              <div className="h-3 w-[1px] bg-[#242424]" />
              <div>
                <span className="text-[#9CA3AF]">Deep Research: </span>
                <span className="text-[#D4AF37] font-bold">
                  {userUsage.monthDeepResearchCount} / {userUsage.monthDeepResearchLimit}
                </span>
                <span className="text-[10px] text-[#6B7280]"> (this mo)</span>
              </div>
              <div className="h-3 w-[1px] bg-[#242424]" />
              <div>
                <span className="text-[#9CA3AF]">Saved Reports: </span>
                <span className="text-white font-bold">
                  {userUsage.savedResearchReportsCount} / {userUsage.savedResearchReportsLimit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid or Feature Comparison View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!showComparison ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {planCards.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = normalizedCurrentPlan === plan.id;
                const price = billingCycle === 'annual' ? plan.priceAnnualMonthly : plan.priceMonthly;

                return (
                  <div
                    key={plan.id}
                    id={`card-plan-${plan.id}`}
                    className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                      plan.highlight
                        ? 'bg-[#101010] border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50'
                        : isCurrent
                        ? 'bg-[#101010] border-[#22C55E]/60'
                        : 'bg-[#101010] border-[#242424] hover:border-[rgba(212,175,55,0.4)]'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black text-[8px] font-black uppercase tracking-wider rounded-full shadow-md font-mono">
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

                      <p className="text-[11px] text-[#9CA3AF] leading-relaxed mb-3 min-h-[38px]">
                        {plan.description}
                      </p>

                      {/* Pricing Block */}
                      <div className="mb-3.5 pb-2.5 border-b border-[#1C1C1C]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono text-white">
                            ${price.toFixed(2)}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">/ mo</span>
                        </div>
                        {billingCycle === 'annual' && plan.priceMonthly > 0 ? (
                          <div className="text-[10px] text-[#22C55E] font-mono mt-0.5">
                            ${plan.priceAnnualTotal.toFixed(0)} billed yearly
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                            {plan.priceMonthly === 0 ? 'No credit card needed' : 'Billed monthly'}
                          </div>
                        )}
                      </div>

                      {/* Quotas Highlight */}
                      <div className="mb-3 p-2 bg-[#0A0A0A] rounded-lg border border-[#1A1A1A] space-y-1 text-[10px] font-mono">
                        <div className="text-[#D4AF37] font-semibold flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-[#D4AF37]" />
                          <span>{plan.aiLimit}</span>
                        </div>
                        <div className="text-[#9CA3AF] flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{plan.deepResearchLimit}</span>
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <ul className="space-y-1.5 mb-4 text-[10.5px]">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[#D1D5DB]">
                            <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        id={`btn-select-plan-${plan.id}`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isCurrent || isCheckingOut}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm font-mono ${
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
                            <span>Current Plan</span>
                          </>
                        ) : isCheckingOut ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>{plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Comprehensive Feature Comparison Matrix */
            <div className="bg-[#101010] border border-[#242424] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#050505] border-b border-[#242424] text-white">
                      <th className="p-3 font-bold text-left min-w-[200px]">Capability / Feature</th>
                      <th className="p-3 text-center min-w-[110px]">Free Explorer</th>
                      <th className="p-3 text-center min-w-[110px]">Basic ($9.99)</th>
                      <th className="p-3 text-center min-w-[110px] text-[#F2D675] bg-[#181504]/50">
                        Pro ($19.99)
                      </th>
                      <th className="p-3 text-center min-w-[110px]">Premium ($29.99)</th>
                      <th className="p-3 text-center min-w-[110px]">Ultra ($49.99)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] text-[#D1D5DB]">
                    <tr>
                      <td className="p-3 font-semibold text-white">Ask MarketMind AI Queries</td>
                      <td className="p-3 text-center">5 / day</td>
                      <td className="p-3 text-center">25 / day</td>
                      <td className="p-3 text-center font-bold text-white bg-[#181504]/30">100 / day</td>
                      <td className="p-3 text-center font-bold text-white">250 / day</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">600 / day</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Deep Research Reports</td>
                      <td className="p-3 text-center">1 / mo</td>
                      <td className="p-3 text-center">3 / mo</td>
                      <td className="p-3 text-center font-bold text-white bg-[#181504]/30">15 / mo</td>
                      <td className="p-3 text-center font-bold text-white">40 / mo</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">100 / mo</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Max Sources Analyzed / Job</td>
                      <td className="p-3 text-center">3 sources</td>
                      <td className="p-3 text-center">6 sources</td>
                      <td className="p-3 text-center bg-[#181504]/30">12 sources</td>
                      <td className="p-3 text-center">25 sources</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">50 sources</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Real-Time Tick WebSocket Stream</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E] bg-[#181504]/30">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">SEC EDGAR 10-K / 10-Q Extraction</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280] bg-[#181504]/30">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Earnings Transcripts Intelligence</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E] bg-[#181504]/30">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Macro Models &amp; Fed Rate Glidepath</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E] bg-[#181504]/30">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">&quot;What Changed?&quot; Delta Research</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280] bg-[#181504]/30">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Options Flow &amp; Gamma Exposure</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E] bg-[#181504]/30">Basic Flow</td>
                      <td className="p-3 text-center text-[#22C55E]">Unusual Flow</td>
                      <td className="p-3 text-center text-[#22C55E]">Full Surface &amp; Smiles</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Connected Accounts (Risk Guardian™)</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center">1 Brokerage</td>
                      <td className="p-3 text-center bg-[#181504]/30">5 Brokerages</td>
                      <td className="p-3 text-center">20 Brokerages</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">50 Brokerages</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Watchlists &amp; Tickers</td>
                      <td className="p-3 text-center">1 (5 tickers)</td>
                      <td className="p-3 text-center">3 (15 tickers)</td>
                      <td className="p-3 text-center bg-[#181504]/30">10 (50 tickers)</td>
                      <td className="p-3 text-center">25 (100 tickers)</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">50 (200 tickers)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Active Alerts (Push/Webhook)</td>
                      <td className="p-3 text-center">3</td>
                      <td className="p-3 text-center">10</td>
                      <td className="p-3 text-center bg-[#181504]/30">50</td>
                      <td className="p-3 text-center">100</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">250</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">PDF Research Export</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280] bg-[#181504]/30">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center text-[#22C55E]">Branded Export</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Priority Research Queue</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280]">&mdash;</td>
                      <td className="p-3 text-center text-[#6B7280] bg-[#181504]/30">&mdash;</td>
                      <td className="p-3 text-center text-[#22C55E]">&#10003;</td>
                      <td className="p-3 text-center font-bold text-[#F2D675]">Top Instant Priority</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pre-Checkout Mandatory Legal Consent Box */}
        <div
          id="subscription-legal-consent-section"
          className={`p-4 bg-[#0A0A0A] border-t border-[#1C1C1C] text-xs transition-colors ${
            consentError ? 'border-red-500/80 bg-red-950/20' : ''
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="checkbox-legal-consent"
              checked={legalConsentChecked}
              onChange={(e) => {
                setLegalConsentChecked(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              className="mt-1 h-4 w-4 rounded border-[#333] bg-[#151515] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 transition cursor-pointer"
            />
            <div className="text-[11px] text-[#A3A3A3] leading-relaxed">
              <span className="font-semibold text-white">Mandatory Legal Agreement &amp; Non-Advisory Notice: </span>
              I have read and agree to the MarketMind AI{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalTab('terms');
                }}
                className="text-[#D4AF37] underline hover:text-[#FFE08A] font-semibold inline"
              >
                Terms of Service
              </button>
              ,{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalTab('privacy');
                }}
                className="text-[#D4AF37] underline hover:text-[#FFE08A] font-semibold inline"
              >
                Privacy Policy
              </button>
              ,{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalTab('billing');
                }}
                className="text-[#D4AF37] underline hover:text-[#FFE08A] font-semibold inline"
              >
                Subscription &amp; Billing Terms
              </button>
              , and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalModalTab('disclaimer');
                }}
                className="text-[#D4AF37] underline hover:text-[#FFE08A] font-semibold inline"
              >
                Financial &amp; AI Risk Disclaimer
              </button>
              . I understand that MarketMind AI provides algorithmic research and educational market data, not personalized investment advice. I understand the plan pricing (${billingCycle === 'annual' ? 'billed annually' : 'billed monthly'}), 15-day free trial rules, recurring billing, and self-service cancellation policy.
            </div>
          </label>
        </div>

        {/* Footer: Enterprise & Security Assurance */}
        <div className="p-3.5 bg-[#050505] border-t border-[#1C1C1C] flex flex-wrap justify-between items-center text-[10px] text-[#9CA3AF] gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Encrypted Stripe Checkout with credit card, ACH wire, &amp; Apple Pay.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLegalModalTab('terms')}
              className="hover:text-white transition underline"
            >
              Legal Center
            </button>
            <span>&bull;</span>
            <span>Cancel anytime</span>
            <span>&bull;</span>
            <span>PCI-DSS Level 1</span>
            <span>&bull;</span>
            <span className="text-[#22C55E]">14-Day Guarantee</span>
          </div>
        </div>
      </div>

      {/* Embedded Legal Center Modal for direct in-depth review */}
      <LegalCenterModal
        isOpen={legalModalTab !== null}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'terms'}
      />
    </div>
  );
};

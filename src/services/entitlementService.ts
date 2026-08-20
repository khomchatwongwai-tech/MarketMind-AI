import { UserProfile } from '../types/user.js';
import { FeatureEntitlements, SubscriptionPlanId, SubscriptionStatus } from '../types/subscription.js';
import { SUBSCRIPTION_PLANS, normalizePlanId } from '../config/plans.js';

export class EntitlementService {
  /**
   * Determine the effective plan tier for a user, respecting trial expiration & status
   */
  static getEffectivePlan(user: UserProfile | null | undefined): SubscriptionPlanId {
    if (!user) return 'free';

    // Administrator always gets full ultra access
    if (user.role === 'admin' || user.role === 'super_admin') return 'ultra';

    // Map legacy plan names if any
    const rawPlan = (user.plan || user.selectedPlan || 'free').toLowerCase();
    const normalizedPlan = normalizePlanId(rawPlan);

    // Check trial status
    if (user.subscriptionStatus === 'trialing' || user.trialStatus === 'active') {
      if (user.trialEndsAt) {
        const trialEnd = new Date(user.trialEndsAt).getTime();
        const now = Date.now();
        if (now > trialEnd) {
          // Trial has expired and not converted -> downgrade to free
          return 'free';
        }
      }
      // Active trial grants the plan they are trialing (default 'pro' or 'premium')
      return normalizedPlan === 'free' ? 'pro' : normalizedPlan;
    }

    // Check active paid status
    if (user.subscriptionStatus === 'active') {
      return normalizedPlan;
    }

    if (
      user.subscriptionStatus === 'expired' ||
      user.subscriptionStatus === 'canceled' ||
      user.subscriptionStatus === 'past_due'
    ) {
      // If still within current period (cancelAtPeriodEnd), maintain access
      if (user.planRenewsAt) {
        const periodEnd = new Date(user.planRenewsAt).getTime();
        if (Date.now() <= periodEnd) {
          return normalizedPlan;
        }
      }
      return 'free';
    }

    // Fallback based on plan
    return normalizedPlan;
  }

  /**
   * Calculate exact real trial days remaining based on actual stored timestamp
   */
  static getTrialInfo(user: UserProfile | null | undefined): {
    isTrial: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    trialEndsAt: string;
    trialEndsAtFormatted: string;
    isExpired: boolean;
    percentProgress: number;
  } {
    if (!user || (!user.trialEndsAt && user.trialStatus !== 'active' && user.subscriptionStatus !== 'trialing')) {
      return {
        isTrial: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        trialEndsAt: '',
        trialEndsAtFormatted: '',
        isExpired: false,
        percentProgress: 100,
      };
    }

    const startTimestamp = user.trialStartedAt ? new Date(user.trialStartedAt).getTime() : Date.now() - 3 * 86400000;
    const endTimestamp = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : startTimestamp + 15 * 86400000;
    const now = Date.now();

    const totalDuration = Math.max(1, endTimestamp - startTimestamp);
    const elapsed = Math.max(0, now - startTimestamp);
    const msRemaining = Math.max(0, endTimestamp - now);
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
    const isExpired = now >= endTimestamp;
    const percentProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    const endDateObj = new Date(endTimestamp);
    const trialEndsAtFormatted = isNaN(endDateObj.getTime())
      ? 'In 15 days'
      : endDateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

    return {
      isTrial: !isExpired && (user.subscriptionStatus === 'trialing' || user.trialStatus === 'active'),
      daysRemaining,
      hoursRemaining,
      trialEndsAt: new Date(endTimestamp).toISOString(),
      trialEndsAtFormatted,
      isExpired,
      percentProgress,
    };
  }

  /**
   * Get formatted trial milestone notification message based on exact days remaining
   */
  static getTrialMilestoneMessage(user: UserProfile | null | undefined): {
    title: string;
    message: string;
    stage: 'day_1' | 'day_10' | 'day_14' | 'expired' | 'active_paid' | 'free';
    urgency: 'info' | 'warning' | 'urgent';
  } {
    const trial = this.getTrialInfo(user);
    if (!user || user.subscriptionStatus === 'active') {
      return {
        title: 'Active Subscription',
        message: 'Your MarketMind AI subscription is active.',
        stage: 'active_paid',
        urgency: 'info',
      };
    }

    if (trial.isExpired || user.subscriptionStatus === 'expired') {
      return {
        title: 'Trial Ended',
        message: 'Your 15-day trial has ended. Choose a plan to continue using premium MarketMind features.',
        stage: 'expired',
        urgency: 'urgent',
      };
    }

    if (!trial.isTrial) {
      return {
        title: 'Free Starter Plan',
        message: 'Explore MarketMind AI or start your 15-day free trial of Pro intelligence.',
        stage: 'free',
        urgency: 'info',
      };
    }

    if (trial.daysRemaining <= 1) {
      return {
        title: 'Trial Ending Soon',
        message: 'Your MarketMind AI trial ends tomorrow. Choose your plan to keep uninterrupted access.',
        stage: 'day_14',
        urgency: 'urgent',
      };
    }

    if (trial.daysRemaining <= 5) {
      return {
        title: 'Trial Notice',
        message: `${trial.daysRemaining} days remaining in your trial. Select a plan to continue your research momentum.`,
        stage: 'day_10',
        urgency: 'warning',
      };
    }

    return {
      title: 'Welcome to Trial',
      message: 'Welcome to your 15-day MarketMind AI trial. Explore institutional deep research and AI intelligence.',
      stage: 'day_1',
      urgency: 'info',
    };
  }

  /**
   * Centralized Entitlements Matrix

   */
  static getEntitlements(user: UserProfile | null | undefined): FeatureEntitlements {
    const effectivePlan = this.getEffectivePlan(user);
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.free;
    const trialInfo = this.getTrialInfo(user);

    const status: SubscriptionStatus = user?.role === 'admin' || user?.role === 'super_admin'
      ? 'active'
      : trialInfo.isTrial
      ? 'trialing'
      : user?.subscriptionStatus || (effectivePlan === 'free' ? 'free' : 'active');

    return {
      planId: effectivePlan,
      status,
      isTrial: trialInfo.isTrial,
      trialDaysRemaining: trialInfo.daysRemaining,
      trialExpired: trialInfo.isExpired,
      canUseRealtimeData: planConfig.limits.canUseRealtimeData,
      canUseAdvancedAI: planConfig.limits.canUseAdvancedAI,
      canUseOptions: planConfig.limits.canUseOptions,
      canUseAdvancedOptions: planConfig.limits.canUseAdvancedOptions,
      canUseUnusualOptions: planConfig.limits.canUseUnusualOptions,
      canUseScanner: planConfig.limits.canUseScanner,
      scannerLevel: planConfig.limits.scannerLevel,
      canUseBacktesting: planConfig.limits.canUseBacktesting,
      backtestingLevel: planConfig.limits.backtestingLevel,
      canUseSimilarSignals: planConfig.limits.canUseSimilarSignals,
      canUsePredictionAccuracy: planConfig.limits.canUsePredictionAccuracy,
      canCreateAdvancedAlerts: planConfig.limits.canCreateAdvancedAlerts,
      canExportReports: planConfig.limits.canExportReports,
      canExportAdvancedData: planConfig.limits.canExportAdvancedData,
      canExportPdfResearch: planConfig.limits.canExportPdfResearch,
      canUseSecResearch: planConfig.limits.canUseSecResearch,
      canUseEarningsTranscripts: planConfig.limits.canUseEarningsTranscripts,
      canUseMacroResearch: planConfig.limits.canUseMacroResearch,
      canUseWhatChanged: planConfig.limits.canUseWhatChanged,
      hasPriorityResearchQueue: planConfig.limits.hasPriorityResearchQueue,
      hasEarlyAccessFeatures: planConfig.limits.hasEarlyAccessFeatures,
      canAccessApiKeys: planConfig.limits.canAccessApiKeys,
      hasPrioritySupport: planConfig.limits.hasPrioritySupport,
      canUseConnectedPortfolio: planConfig.limits.canUseConnectedPortfolio,
      canUseRiskGuardian: planConfig.limits.canUseRiskGuardian,
      maxConnectedAccounts: planConfig.limits.maxConnectedAccounts,
      maxAIRequestsPerDay: planConfig.limits.maxAIRequestsPerDay,
      maxMonthlyDeepResearchJobs: planConfig.limits.maxMonthlyDeepResearchJobs,
      maxDeepResearchSourcesPerJob: planConfig.limits.maxDeepResearchSourcesPerJob,
      maxDeepResearchAiSteps: planConfig.limits.maxDeepResearchAiSteps,
      maxDeepResearchTokens: planConfig.limits.maxDeepResearchTokens,
      maxSavedResearchReports: planConfig.limits.maxSavedResearchReports,
      maxWatchlists: planConfig.limits.maxWatchlists,
      maxWatchlistTickers: planConfig.limits.maxWatchlistTickers,
      maxAlerts: planConfig.limits.maxAlerts,
      predictionHistoryDays: planConfig.limits.predictionHistoryDays,
    };
  }

  /**
   * Check single permission
   */
  static can(
    user: UserProfile | null | undefined,
    permission: keyof FeatureEntitlements | 'realtime' | 'advanced_ai' | 'backtest' | 'options' | 'alerts_advanced' | 'pdf_export' | 'sec_research' | 'what_changed'
  ): boolean {
    const entitlements = this.getEntitlements(user);

    switch (permission) {
      case 'realtime':
        return entitlements.canUseRealtimeData;
      case 'advanced_ai':
        return entitlements.canUseAdvancedAI;
      case 'backtest':
        return entitlements.canUseBacktesting;
      case 'options':
        return entitlements.canUseOptions;
      case 'alerts_advanced':
        return entitlements.canCreateAdvancedAlerts;
      case 'pdf_export':
        return entitlements.canExportPdfResearch;
      case 'sec_research':
        return entitlements.canUseSecResearch;
      case 'what_changed':
        return entitlements.canUseWhatChanged;
      default:
        return !!(entitlements as any)[permission];
    }
  }

  /**
   * Required plan name for features
   */
  static getRequiredTierForFeature(feature: string): { plan: SubscriptionPlanId; planName: string; price: number } {
    switch (feature) {
      case 'ultra_ai':
      case 'darkpool':
      case 'early_access':
        return { plan: 'ultra', planName: 'Ultra', price: 49.99 };
      case 'sec_filings':
      case 'pdf_export':
      case 'what_changed':
      case 'advanced_options':
      case 'unusual_options':
        return { plan: 'premium', planName: 'Premium', price: 29.99 };
      case 'backtest':
      case 'realtime':
      case 'advanced_ai':
      case 'why_moving':
      case 'earnings_transcripts':
        return { plan: 'pro', planName: 'Pro', price: 19.99 };
      case 'technical_indicators':
      case 'scanner':
        return { plan: 'basic', planName: 'Basic', price: 9.99 };
      default:
        return { plan: 'pro', planName: 'Pro', price: 19.99 };
    }
  }
}

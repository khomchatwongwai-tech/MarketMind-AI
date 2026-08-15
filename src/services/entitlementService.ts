import { UserProfile } from '../types/user';
import { FeatureEntitlements, SubscriptionPlanId, SubscriptionStatus } from '../types/subscription';
import { SUBSCRIPTION_PLANS } from '../config/plans';

export class EntitlementService {
  /**
   * Determine the effective plan tier for a user, respecting trial expiration & status
   */
  static getEffectivePlan(user: UserProfile | null | undefined): SubscriptionPlanId {
    if (!user) return 'free';

    // Administrator always gets full institutional / premium access
    if (user.role === 'admin') return 'premium';

    // Map legacy plan names if any
    const rawPlan = (user.plan || user.selectedPlan || 'free').toLowerCase();
    let normalizedPlan: SubscriptionPlanId = 'free';
    if (rawPlan === 'premium' || rawPlan === 'institutional' || rawPlan === 'enterprise') {
      normalizedPlan = 'premium';
    } else if (rawPlan === 'pro') {
      normalizedPlan = 'pro';
    } else if (rawPlan === 'basic') {
      normalizedPlan = 'basic';
    } else {
      normalizedPlan = 'free';
    }

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

    if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'past_due') {
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
   * Centralized Entitlements Matrix
   */
  static getEntitlements(user: UserProfile | null | undefined): FeatureEntitlements {
    const effectivePlan = this.getEffectivePlan(user);
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.free;
    const trialInfo = this.getTrialInfo(user);

    const status: SubscriptionStatus = user?.role === 'admin'
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
      canAccessApiKeys: planConfig.limits.canAccessApiKeys,
      hasPrioritySupport: planConfig.limits.hasPrioritySupport,
      maxAIRequestsPerDay: planConfig.limits.maxAIRequestsPerDay,
      maxWatchlists: planConfig.limits.maxWatchlists,
      maxWatchlistTickers: planConfig.limits.maxWatchlistTickers,
      maxAlerts: planConfig.limits.maxAlerts,
      predictionHistoryDays: planConfig.limits.predictionHistoryDays,
    };
  }

  /**
   * Check single permission
   */
  static can(user: UserProfile | null | undefined, permission: keyof FeatureEntitlements | 'realtime' | 'advanced_ai' | 'backtest' | 'options' | 'alerts_advanced'): boolean {
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
      default:
        return !!(entitlements as any)[permission];
    }
  }

  /**
   * Required plan name for features
   */
  static getRequiredTierForFeature(feature: string): { plan: SubscriptionPlanId; planName: string; price: number } {
    switch (feature) {
      case 'options':
      case 'darkpool':
        return { plan: 'premium', planName: 'Premium', price: 69.99 };
      case 'backtest':
      case 'realtime':
      case 'advanced_ai':
      case 'why_moving':
        return { plan: 'pro', planName: 'Pro', price: 29.99 };
      case 'technical_indicators':
      case 'scanner':
        return { plan: 'basic', planName: 'Basic', price: 9.99 };
      default:
        return { plan: 'pro', planName: 'Pro', price: 29.99 };
    }
  }
}

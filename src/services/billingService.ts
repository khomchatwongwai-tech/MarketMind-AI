/**
 * Client-side Billing & Subscription Service
 */

import { UserProfile } from '../types/user';
import {
  BillingInvoice,
  PlanFeatureConfig,
  SubscriptionPlanId,
  AdminSubscriptionMetrics,
} from '../types/subscription';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { auth } = await import('../config/firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch {}

  try {
    const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('marketmind_auth_token') : null;
    if (savedToken) {
      headers['Authorization'] = `Bearer ${savedToken}`;
      return headers;
    }
  } catch {}

  try {
    const userStr = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('marketmind_user_profile') || localStorage.getItem('marketmind_user_v2'))
      : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        headers['Authorization'] = `Bearer mkt_dev_${user.id}`;
      }
    }
  } catch {}

  return headers;
}

export class BillingService {
  /**
   * Fetch all plans & configuration
   */
  static async getPlans(): Promise<{ trialDurationDays: number; plans: Record<SubscriptionPlanId, PlanFeatureConfig> }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/plans', { headers });
      if (!res.ok) throw new Error('Failed to load subscription plans');
      return await res.json();
    } catch (e) {
      console.warn('Fallback to local plans config', e);
      const { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS } = await import('../config/plans');
      return { trialDurationDays: TRIAL_DURATION_DAYS, plans: SUBSCRIPTION_PLANS };
    }
  }

  /**
   * Start 15-Day Free Trial
   */
  static async startTrial(email: string, planId: SubscriptionPlanId = 'pro'): Promise<{ message: string; user: UserProfile }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/start-trial', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, planId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start free trial');
    return data;
  }

  /**
   * Create Checkout Session (Stripe-ready Architecture)
   */
  static async createCheckoutSession(
    email: string,
    planId: SubscriptionPlanId,
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<{
    connected: boolean;
    checkoutUrl?: string;
    message?: string;
    providerStatus?: string;
    disclaimer?: string;
    simulatedPlan?: PlanFeatureConfig;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, planId, billingCycle }),
    });
    return await res.json();
  }

  /**
   * Customer Portal Session
   */
  static async createPortalSession(email: string): Promise<{
    connected: boolean;
    portalUrl?: string;
    message?: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/create-portal-session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });
    return await res.json();
  }

  /**
   * Upgrade or Downgrade Plan
   */
  static async changePlan(
    email: string,
    planId: SubscriptionPlanId,
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<{ message: string; user: UserProfile }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/change-plan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, planId, billingCycle }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change plan');
    return data;
  }

  /**
   * Cancel Subscription with grace period retention
   */
  static async cancelSubscription(email: string): Promise<{
    message: string;
    user: UserProfile;
    accessUntil: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/cancel-subscription', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription');
    return data;
  }

  /**
   * Get User Subscription Status & Invoices
   */
  static async getStatus(): Promise<{
    subscription: {
      planId: SubscriptionPlanId;
      status: string;
      trialStartedAt?: string;
      trialEndsAt?: string;
      hasUsedTrial: boolean;
      planBillingCycle: string;
      planRenewsAt: string;
      monthlyPrice: number;
      cancelAtPeriodEnd: boolean;
      paymentProvider: string;
    };
    usage?: any;
    invoices: BillingInvoice[];
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/billing/status', { headers });
    if (!res.ok) throw new Error('Failed to fetch billing status');
    return await res.json();
  }

  /**
   * Get User Real-time Usage & Quota Metrics
   */
  static async getUsage(): Promise<any> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/usage', { headers });
      if (!res.ok) throw new Error('Failed to fetch usage metrics');
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Get User Invoices / Billing History
   */
  static async getBillingHistory(email: string): Promise<BillingInvoice[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/billing/history?email=${encodeURIComponent(email)}`, { headers });
      const data = await res.json();
      return data.invoices || [];
    } catch {
      return [];
    }
  }

  /**
   * Get Admin Business Subscription Metrics
   */
  static async getAdminMetrics(): Promise<AdminSubscriptionMetrics> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/admin-metrics', { headers });
      return await res.json();
    } catch {
      return {
        totalUsers: 0,
        freeUsers: 0,
        trialUsers: 0,
        basicSubscribers: 0,
        proSubscribers: 0,
        premiumSubscribers: 0,
        ultraSubscribers: 0,
        activeSubscribers: 0,
        canceledSubscribers: 0,
        trialConversionRate: 0,
        monthlyRecurringRevenue: 0,
        annualRecurringRevenue: 0,
        churnRate: 0,
        failedPayments: 0,
        upcomingTrialExpirations: 0,
      };
    }
  }
}

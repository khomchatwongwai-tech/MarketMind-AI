/**
 * Server-side User & Subscription Store
 * Provides persistent metadata storage for subscriptions, entitlements, invoices, and preferences.
 * Identity and authentication are strictly authoritative through Firebase Authentication.
 */

import { UserProfile, UserRole } from '../types/user';
import { UserSubscriptionRecord, BillingInvoice, SubscriptionPlanId, AdminSubscriptionMetrics } from '../types/subscription';
import { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS } from '../config/plans';

export interface StoredUserAccount {
  id: string; // Firebase UID
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  country: string;
  language: string;
  timezone: string;
  plan: SubscriptionPlanId;
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  trialStartedAt?: string;
  trialEndsAt?: string;
  hasUsedTrial: boolean;
  planBillingCycle: 'monthly' | 'annual';
  planRenewsAt: string;
  monthlyPrice: number;
  cancelAtPeriodEnd: boolean;
  paymentProvider: 'none' | 'stripe' | 'manual';
  paymentCustomerId?: string;
  paymentSubscriptionId?: string;
  tradingExperience: 'Beginner' | 'Intermediate' | 'Pro Quant' | 'Institutional';
  defaultTicker: string;
  defaultTimeframe: string;
  riskTolerance: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// In-memory store indexed by Firebase UID
const accountsByUid: Map<string, StoredUserAccount> = new Map();
// Secondary index by email for fast lookup
const accountsByEmail: Map<string, string> = new Map();

// Invoices store
const invoicesList: BillingInvoice[] = [];

export class ServerUserStore {
  static findById(uid: string): StoredUserAccount | null {
    if (!uid) return null;
    return accountsByUid.get(uid) || null;
  }

  static findByEmail(email: string): StoredUserAccount | null {
    if (!email) return null;
    const uid = accountsByEmail.get(email.toLowerCase().trim());
    if (!uid) return null;
    return accountsByUid.get(uid) || null;
  }

  static getOrCreateUser({
    uid,
    email,
    name,
    firstName,
    lastName,
    role = 'user',
    country = 'US',
    language = 'en',
    timezone = 'America/New_York',
    selectedPlan = 'free',
  }: {
    uid: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    country?: string;
    language?: string;
    timezone?: string;
    selectedPlan?: SubscriptionPlanId;
  }): StoredUserAccount {
    const existing = this.findById(uid);
    if (existing) {
      return existing;
    }

    const cleanEmail = email.toLowerCase().trim();
    const fName = firstName || (name ? name.split(' ')[0] : 'Trader');
    const lName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');
    const now = new Date();
    const planConfig = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.free;

    const account: StoredUserAccount = {
      id: uid,
      email: cleanEmail,
      firstName: fName,
      lastName: lName,
      name: `${fName} ${lName}`.trim(),
      role,
      emailVerified: false,
      country,
      language,
      timezone,
      plan: selectedPlan,
      subscriptionStatus: selectedPlan === 'free' ? 'free' : 'trialing',
      trialStartedAt: selectedPlan !== 'free' ? now.toISOString() : undefined,
      trialEndsAt: selectedPlan !== 'free' ? new Date(now.getTime() + TRIAL_DURATION_DAYS * 86400000).toISOString() : undefined,
      hasUsedTrial: selectedPlan !== 'free',
      planBillingCycle: 'monthly',
      planRenewsAt: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0],
      monthlyPrice: planConfig.monthlyPrice,
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      tradingExperience: 'Intermediate',
      defaultTicker: 'SPY',
      defaultTimeframe: '5m',
      riskTolerance: 'Moderate',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastLoginAt: now.toISOString(),
    };

    accountsByUid.set(uid, account);
    accountsByEmail.set(cleanEmail, uid);

    return account;
  }

  static readonly SAFE_PROFILE_FIELDS = new Set([
    'name',
    'firstName',
    'lastName',
    'avatarUrl',
    'avatar',
    'theme',
    'language',
    'timezone',
    'country',
    'tradingExperience',
    'defaultTicker',
    'defaultTimeframe',
    'riskTolerance',
    'chartLayout',
    'technicalIndicators',
    'watchlist',
    'pinnedIndicators',
    'marketBriefPreferences',
    'notificationPreferences',
    'alertPreferences',
  ]);

  static readonly FORBIDDEN_PROFILE_FIELDS = new Set([
    'role',
    'plan',
    'planTier',
    'selectedPlan',
    'subscriptionStatus',
    'trialStatus',
    'trialStartedAt',
    'trialEndsAt',
    'hasUsedTrial',
    'trialDaysRemaining',
    'paymentProvider',
    'paymentCustomerId',
    'paymentSubscriptionId',
    'monthlyPrice',
    'planBillingCycle',
    'planRenewsAt',
    'cancelAtPeriodEnd',
    'entitlements',
    'apiKey',
    'apiKeys',
    'permissions',
    'isAdmin',
    'admin',
  ]);

  static updateSafeProfile(uid: string, rawUpdates: Record<string, any>): { user: StoredUserAccount } {
    const account = this.findById(uid);
    if (!account) throw new Error(`Account ${uid} not found.`);

    // Strict validation: Reject if any forbidden field is included in rawUpdates
    const forbiddenKeys = Object.keys(rawUpdates).filter(key => this.FORBIDDEN_PROFILE_FIELDS.has(key));
    if (forbiddenKeys.length > 0) {
      const err: any = new Error(`Forbidden field modification attempted: ${forbiddenKeys.join(', ')}`);
      err.statusCode = 400;
      err.code = 'FORBIDDEN_FIELD_MODIFICATION';
      throw err;
    }

    const safeUpdates: Partial<StoredUserAccount> = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
      if (this.SAFE_PROFILE_FIELDS.has(key)) {
        (safeUpdates as any)[key] = value;
      }
    }

    Object.assign(account, safeUpdates, { updatedAt: new Date().toISOString() });
    accountsByUid.set(uid, account);

    return { user: account };
  }

  static updateAccount(uid: string, updates: Partial<StoredUserAccount>): StoredUserAccount {
    const account = this.findById(uid);
    if (!account) throw new Error(`Account ${uid} not found.`);

    Object.assign(account, updates, { updatedAt: new Date().toISOString() });
    accountsByUid.set(uid, account);
    if (account.email) {
      accountsByEmail.set(account.email.toLowerCase().trim(), uid);
    }
    return account;
  }

  static updateSubscriptionByUid(
    uid: string,
    updates: {
      plan?: SubscriptionPlanId;
      subscriptionStatus?: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
      paymentProvider?: 'none' | 'stripe' | 'manual';
      paymentCustomerId?: string;
      paymentSubscriptionId?: string;
      cancelAtPeriodEnd?: boolean;
    }
  ): StoredUserAccount | null {
    const account = this.findById(uid);
    if (!account) return null;

    if (updates.plan) account.plan = updates.plan;
    if (updates.subscriptionStatus) account.subscriptionStatus = updates.subscriptionStatus;
    if (updates.paymentProvider) account.paymentProvider = updates.paymentProvider;
    if (updates.paymentCustomerId) account.paymentCustomerId = updates.paymentCustomerId;
    if (updates.paymentSubscriptionId) account.paymentSubscriptionId = updates.paymentSubscriptionId;
    if (typeof updates.cancelAtPeriodEnd === 'boolean') account.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;
    account.updatedAt = new Date().toISOString();

    return account;
  }

  static convertToUserProfile(account: StoredUserAccount): UserProfile {
    const now = Date.now();
    let isTrialActive = false;
    let daysRemaining = 0;

    if (account.trialEndsAt && account.subscriptionStatus === 'trialing') {
      const trialEnd = new Date(account.trialEndsAt).getTime();
      if (now < trialEnd) {
        isTrialActive = true;
        daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
      }
    }

    return {
      id: account.id,
      name: account.name,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      emailVerified: account.emailVerified,
      role: account.role,
      plan: account.plan as any,
      planTier: account.plan.toUpperCase(),
      selectedPlan: account.plan,
      isGuest: false,
      subscriptionStatus: account.subscriptionStatus,
      trialStartedAt: account.trialStartedAt,
      trialEndsAt: account.trialEndsAt,
      trialStatus: isTrialActive ? 'active' : account.trialStartedAt ? 'expired' : 'none',
      trialDaysRemaining: daysRemaining,
      hasUsedTrial: account.hasUsedTrial,
      planBillingCycle: account.planBillingCycle,
      planRenewsAt: account.planRenewsAt,
      monthlyPrice: account.monthlyPrice,
      nextBillingDate: account.planRenewsAt,
      cancelAtPeriodEnd: account.cancelAtPeriodEnd,
      paymentProvider: account.paymentProvider,
      paymentCustomerId: account.paymentCustomerId,
      paymentSubscriptionId: account.paymentSubscriptionId,
      createdAt: account.createdAt,
      tradingExperience: account.tradingExperience,
      defaultTicker: (account.defaultTicker as any) || 'SPY',
      defaultTimeframe: (account.defaultTimeframe as any) || '5m',
      riskTolerance: (account.riskTolerance as any) || 'Moderate',
      country: account.country,
      language: account.language,
      region: account.country,
      timezone: account.timezone,
      preferredCurrency: 'USD',
      preferredMarket: 'US (NYSE/NASDAQ)',
      aiResponseLanguage: account.language,
      notifications: {
        emailAlerts: true,
        pushAlerts: true,
        soundEnabled: true,
        telegramEnabled: false,
      },
      twoFactorEnabled: false,
      apiKeys: [],
    };
  }

  static getInvoicesForUser(userId: string): BillingInvoice[] {
    return invoicesList.filter((inv) => inv.userId === userId);
  }

  static addInvoice(invoice: BillingInvoice): void {
    invoicesList.unshift(invoice);
  }

  static getAdminMetrics(): AdminSubscriptionMetrics {
    const accounts = Array.from(accountsByUid.values());
    const totalUsers = accounts.length;

    let freeUsers = 0;
    let trialUsers = 0;
    let basicSubscribers = 0;
    let proSubscribers = 0;
    let premiumSubscribers = 0;
    let ultraSubscribers = 0;
    let activeSubscribers = 0;
    let canceledSubscribers = 0;
    let mrr = 0;
    let upcomingExpirations = 0;

    const now = Date.now();

    for (const acc of accounts) {
      if (acc.subscriptionStatus === 'trialing') {
        trialUsers++;
        if (acc.trialEndsAt) {
          const diff = new Date(acc.trialEndsAt).getTime() - now;
          if (diff > 0 && diff <= 3 * 86400000) {
            upcomingExpirations++;
          }
        }
      } else if (acc.subscriptionStatus === 'free' || acc.plan === 'free') {
        freeUsers++;
      } else if (acc.subscriptionStatus === 'active') {
        activeSubscribers++;
        if (acc.plan === 'basic') {
          basicSubscribers++;
          mrr += SUBSCRIPTION_PLANS.basic.monthlyPrice;
        } else if (acc.plan === 'pro') {
          proSubscribers++;
          mrr += SUBSCRIPTION_PLANS.pro.monthlyPrice;
        } else if (acc.plan === 'premium' || (acc.plan as string) === 'institutional') {
          premiumSubscribers++;
          mrr += SUBSCRIPTION_PLANS.premium.monthlyPrice;
        } else if (acc.plan === 'ultra' || (acc.plan as string) === 'enterprise') {
          ultraSubscribers++;
          mrr += SUBSCRIPTION_PLANS.ultra.monthlyPrice;
        }
      } else if (acc.subscriptionStatus === 'canceled' || acc.cancelAtPeriodEnd) {
        canceledSubscribers++;
      }
    }

    const trialConversionRate = trialUsers + activeSubscribers > 0
      ? Math.round((activeSubscribers / (trialUsers + activeSubscribers)) * 100)
      : 0;

    const churnRate = activeSubscribers + canceledSubscribers > 0
      ? Math.round((canceledSubscribers / (activeSubscribers + canceledSubscribers)) * 100)
      : 0;

    return {
      totalUsers,
      freeUsers,
      trialUsers,
      basicSubscribers,
      proSubscribers,
      premiumSubscribers,
      ultraSubscribers,
      activeSubscribers,
      canceledSubscribers,
      trialConversionRate,
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
      churnRate,
      failedPayments: 0,
      upcomingTrialExpirations: upcomingExpirations,
    };
  }
}

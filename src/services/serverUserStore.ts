/**
 * Server-side User & Subscription Store
 * Provides persistent memory and local storage for authentication, trials, and billing records
 */

import { UserProfile } from '../types/user';
import { UserSubscriptionRecord, BillingInvoice, SubscriptionPlanId, AdminSubscriptionMetrics } from '../types/subscription';
import { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS } from '../config/plans';

export interface StoredUserAccount {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
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

// Simple deterministic hash for demo/app environment
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_sim_${Math.abs(hash)}_${password.length * 997}`;
}

export const DEFAULT_ADMIN_EMAIL = 'khomchatwongwai@gmail.com';

// Pre-seeded Admin Account
const initialAccounts: Map<string, StoredUserAccount> = new Map();

// Helper to seed master user
function seedInitialAdmin() {
  const adminId = 'usr_alpha_9921';
  const now = new Date();
  const renews = new Date(now.getTime() + 365 * 86400000);

  const adminAccount: StoredUserAccount = {
    id: adminId,
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    passwordHash: hashPassword('MarketMind@2026!'),
    firstName: 'Khomchat',
    lastName: 'Wongwai',
    name: 'Khomchat Wongwai',
    role: 'admin',
    emailVerified: true,
    country: 'US',
    language: 'en',
    timezone: 'America/New_York',
    plan: 'premium',
    subscriptionStatus: 'active',
    hasUsedTrial: true,
    planBillingCycle: 'annual',
    planRenewsAt: renews.toISOString().split('T')[0],
    monthlyPrice: 69.99,
    cancelAtPeriodEnd: false,
    paymentProvider: 'manual',
    tradingExperience: 'Pro Quant',
    defaultTicker: 'SPY',
    defaultTimeframe: '5m',
    riskTolerance: 'Moderate',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: now.toISOString(),
    lastLoginAt: now.toISOString(),
  };

  initialAccounts.set(adminAccount.email, adminAccount);

  // Seed sample active subscribers for realistic metrics
  const sampleUsers: StoredUserAccount[] = [
    {
      id: 'usr_demo_01',
      email: 'alex.morgan@quantcap.com',
      passwordHash: hashPassword('Password123!'),
      firstName: 'Alex',
      lastName: 'Morgan',
      name: 'Alex Morgan',
      role: 'user',
      emailVerified: true,
      country: 'US',
      language: 'en',
      timezone: 'America/New_York',
      plan: 'pro',
      subscriptionStatus: 'trialing',
      trialStartedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      trialEndsAt: new Date(now.getTime() + 12 * 86400000).toISOString(),
      hasUsedTrial: true,
      planBillingCycle: 'monthly',
      planRenewsAt: new Date(now.getTime() + 12 * 86400000).toISOString().split('T')[0],
      monthlyPrice: 29.99,
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      tradingExperience: 'Intermediate',
      defaultTicker: 'QQQ',
      defaultTimeframe: '15m',
      riskTolerance: 'Moderate',
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'usr_demo_02',
      email: 'sarah.chen@singaporealpha.sg',
      passwordHash: hashPassword('Password123!'),
      firstName: 'Sarah',
      lastName: 'Chen',
      name: 'Sarah Chen',
      role: 'user',
      emailVerified: true,
      country: 'SG',
      language: 'en',
      timezone: 'Asia/Singapore',
      plan: 'premium',
      subscriptionStatus: 'active',
      hasUsedTrial: true,
      planBillingCycle: 'annual',
      planRenewsAt: new Date(now.getTime() + 240 * 86400000).toISOString().split('T')[0],
      monthlyPrice: 59.99,
      cancelAtPeriodEnd: false,
      paymentProvider: 'stripe',
      tradingExperience: 'Pro Quant',
      defaultTicker: 'NVDA',
      defaultTimeframe: '5m',
      riskTolerance: 'Aggressive',
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: now.toISOString(),
    },
    {
      id: 'usr_demo_03',
      email: 'marcus.weber@berlin-algo.de',
      passwordHash: hashPassword('Password123!'),
      firstName: 'Marcus',
      lastName: 'Weber',
      name: 'Marcus Weber',
      role: 'user',
      emailVerified: true,
      country: 'DE',
      language: 'de',
      timezone: 'Europe/Berlin',
      plan: 'basic',
      subscriptionStatus: 'active',
      hasUsedTrial: true,
      planBillingCycle: 'monthly',
      planRenewsAt: new Date(now.getTime() + 18 * 86400000).toISOString().split('T')[0],
      monthlyPrice: 9.99,
      cancelAtPeriodEnd: false,
      paymentProvider: 'stripe',
      tradingExperience: 'Beginner',
      defaultTicker: 'SPY',
      defaultTimeframe: '1d',
      riskTolerance: 'Conservative',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: now.toISOString(),
    },
    {
      id: 'usr_demo_04',
      email: 'trader.free@marketmind.ai',
      passwordHash: hashPassword('Password123!'),
      firstName: 'Jordan',
      lastName: 'Taylor',
      name: 'Jordan Taylor',
      role: 'user',
      emailVerified: true,
      country: 'GB',
      language: 'en',
      timezone: 'Europe/London',
      plan: 'free',
      subscriptionStatus: 'free',
      hasUsedTrial: true,
      trialStartedAt: '2026-01-01T00:00:00.000Z',
      trialEndsAt: '2026-01-16T00:00:00.000Z',
      planBillingCycle: 'monthly',
      planRenewsAt: '2026-12-31',
      monthlyPrice: 0,
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      tradingExperience: 'Beginner',
      defaultTicker: 'AAPL',
      defaultTimeframe: '1d',
      riskTolerance: 'Moderate',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: now.toISOString(),
    },
  ];

  for (const u of sampleUsers) {
    initialAccounts.set(u.email, u);
  }
}

seedInitialAdmin();

// Sample billing invoices
const invoicesList: BillingInvoice[] = [
  {
    id: 'inv_8832_01',
    userId: 'usr_alpha_9921',
    invoiceNumber: 'INV-2026-001',
    date: '2026-01-15',
    planName: 'MarketMind Premium (Annual Quant)',
    amount: 719.88,
    currency: 'USD',
    status: 'paid',
  },
];

export class ServerUserStore {
  static findByEmail(email: string): StoredUserAccount | null {
    if (!email) return null;
    return initialAccounts.get(email.toLowerCase().trim()) || null;
  }

  static findById(id: string): StoredUserAccount | null {
    if (!id) return null;
    for (const account of initialAccounts.values()) {
      if (account.id === id) return account;
    }
    return null;
  }

  static createAccount({
    email,
    password,
    firstName,
    lastName,
    country = 'US',
    language = 'en',
    timezone = 'America/New_York',
    selectedPlan = 'pro',
  }: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    country?: string;
    language?: string;
    timezone?: string;
    selectedPlan?: SubscriptionPlanId;
  }): StoredUserAccount {
    const cleanEmail = email.toLowerCase().trim();
    const existing = this.findByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const id = 'usr_' + Math.random().toString(36).substring(2, 10);
    const now = new Date();
    const trialStartedAt = now.toISOString();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 86400000).toISOString();
    const isAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

    const planConfig = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.pro;

    const account: StoredUserAccount = {
      id,
      email: cleanEmail,
      passwordHash: password ? hashPassword(password) : hashPassword('MarketMind_OAuth_SSO_Secret'),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      role: isAdmin ? 'admin' : 'user',
      emailVerified: isAdmin,
      verificationToken: 'ver_' + Math.random().toString(36).substring(2, 12),
      country,
      language,
      timezone,
      plan: isAdmin ? 'premium' : selectedPlan,
      subscriptionStatus: isAdmin ? 'active' : 'trialing',
      trialStartedAt: isAdmin ? undefined : trialStartedAt,
      trialEndsAt: isAdmin ? undefined : trialEndsAt,
      hasUsedTrial: true,
      planBillingCycle: 'monthly',
      planRenewsAt: new Date(now.getTime() + (isAdmin ? 365 : TRIAL_DURATION_DAYS) * 86400000).toISOString().split('T')[0],
      monthlyPrice: isAdmin ? 69.99 : planConfig.monthlyPrice,
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

    initialAccounts.set(cleanEmail, account);

    // Record invoice for trial start
    invoicesList.unshift({
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      userId: account.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      planName: `${planConfig.name} 15-Day Free Trial`,
      amount: 0.0,
      currency: 'USD',
      status: 'trial_credit',
    });

    return account;
  }

  static verifyPassword(account: StoredUserAccount, passwordAttempt: string): boolean {
    if (!passwordAttempt) return false;
    const targetHash = hashPassword(passwordAttempt);
    return account.passwordHash === targetHash;
  }

  static updateAccount(id: string, updates: Partial<StoredUserAccount>): StoredUserAccount {
    const account = this.findById(id);
    if (!account) throw new Error('Account not found.');

    Object.assign(account, updates, { updatedAt: new Date().toISOString() });
    initialAccounts.set(account.email, account);
    return account;
  }

  static deleteAccount(id: string): void {
    const account = this.findById(id);
    if (account) {
      initialAccounts.delete(account.email);
    }
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

  static getAdminMetrics(): AdminSubscriptionMetrics {
    const accounts = Array.from(initialAccounts.values());
    const totalUsers = accounts.length;

    let freeUsers = 0;
    let trialUsers = 0;
    let basicSubscribers = 0;
    let proSubscribers = 0;
    let premiumSubscribers = 0;
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
          mrr += 9.99;
        } else if (acc.plan === 'pro') {
          proSubscribers++;
          mrr += 29.99;
        } else if (acc.plan === 'premium') {
          premiumSubscribers++;
          mrr += 69.99;
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

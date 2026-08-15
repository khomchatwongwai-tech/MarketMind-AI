import { UserProfile } from './user';

export type SubscriptionPlanId = 'free' | 'basic' | 'pro' | 'premium';

export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'incomplete';

export interface PlanFeatureConfig {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualBilledTotal: number;
  description: string;
  trialDays: number;
  isPopular?: boolean;
  features: string[];
  limits: {
    maxAIRequestsPerDay: number;
    maxWatchlists: number;
    maxWatchlistTickers: number;
    maxAlerts: number;
    predictionHistoryDays: number;
    timeframes: string[];
    canUseRealtimeData: boolean;
    canUseAdvancedAI: boolean;
    canUseOptions: boolean;
    canUseAdvancedOptions: boolean;
    canUseUnusualOptions: boolean;
    canUseScanner: boolean;
    scannerLevel: 'none' | 'basic' | 'advanced' | 'premium';
    canUseBacktesting: boolean;
    backtestingLevel: 'none' | 'limited' | 'advanced';
    canUseSimilarSignals: boolean;
    canUsePredictionAccuracy: boolean;
    canCreateAdvancedAlerts: boolean;
    canExportReports: boolean;
    canExportAdvancedData: boolean;
    canAccessApiKeys: boolean;
    hasPrioritySupport: boolean;
  };
}

export interface UserSubscriptionRecord {
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  paymentProvider: 'none' | 'stripe' | 'manual';
  paymentCustomerId?: string;
  paymentSubscriptionId?: string;
  lastPaymentStatus?: 'succeeded' | 'failed' | 'pending' | 'none';
  lastPaymentError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'trial_credit';
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
}

export interface FeatureEntitlements {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  canUseRealtimeData: boolean;
  canUseAdvancedAI: boolean;
  canUseOptions: boolean;
  canUseAdvancedOptions: boolean;
  canUseUnusualOptions: boolean;
  canUseScanner: boolean;
  scannerLevel: 'none' | 'basic' | 'advanced' | 'premium';
  canUseBacktesting: boolean;
  backtestingLevel: 'none' | 'limited' | 'advanced';
  canUseSimilarSignals: boolean;
  canUsePredictionAccuracy: boolean;
  canCreateAdvancedAlerts: boolean;
  canExportReports: boolean;
  canExportAdvancedData: boolean;
  canAccessApiKeys: boolean;
  hasPrioritySupport: boolean;
  maxAIRequestsPerDay: number;
  maxWatchlists: number;
  maxWatchlistTickers: number;
  maxAlerts: number;
  predictionHistoryDays: number;
}

export interface AdminSubscriptionMetrics {
  totalUsers: number;
  freeUsers: number;
  trialUsers: number;
  basicSubscribers: number;
  proSubscribers: number;
  premiumSubscribers: number;
  activeSubscribers: number;
  canceledSubscribers: number;
  trialConversionRate: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  failedPayments: number;
  upcomingTrialExpirations: number;
}

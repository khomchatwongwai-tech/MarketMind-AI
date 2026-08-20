import { UserProfile } from './user.js';

export type SubscriptionPlanId = 'free' | 'basic' | 'pro' | 'premium' | 'ultra';

export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'incomplete';

export interface PlanLimits {
  maxAIRequestsPerDay: number;
  maxMonthlyDeepResearchJobs: number;
  maxDeepResearchSourcesPerJob: number;
  maxDeepResearchAiSteps: number;
  maxDeepResearchTokens: number;
  maxSavedResearchReports: number;
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
  scannerLevel: 'none' | 'basic' | 'advanced' | 'premium' | 'ultra';
  canUseBacktesting: boolean;
  backtestingLevel: 'none' | 'limited' | 'advanced' | 'institutional';
  canUseSimilarSignals: boolean;
  canUsePredictionAccuracy: boolean;
  canCreateAdvancedAlerts: boolean;
  canExportReports: boolean;
  canExportAdvancedData: boolean;
  canExportPdfResearch: boolean;
  canUseSecResearch: boolean;
  canUseEarningsTranscripts: boolean;
  canUseMacroResearch: boolean;
  canUseWhatChanged: boolean;
  hasPriorityResearchQueue: boolean;
  hasEarlyAccessFeatures: boolean;
  canAccessApiKeys: boolean;
  hasPrioritySupport: boolean;
  canUseConnectedPortfolio: boolean;
  canUseRiskGuardian: boolean;
  maxConnectedAccounts: number;
}

export interface PlanFeatureConfig {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualBilledTotal: number;
  annualSavingsPercent: number;
  description: string;
  trialDays: number;
  isPopular?: boolean;
  features: string[];
  limits: PlanLimits;
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
  scannerLevel: 'none' | 'basic' | 'advanced' | 'premium' | 'ultra';
  canUseBacktesting: boolean;
  backtestingLevel: 'none' | 'limited' | 'advanced' | 'institutional';
  canUseSimilarSignals: boolean;
  canUsePredictionAccuracy: boolean;
  canCreateAdvancedAlerts: boolean;
  canExportReports: boolean;
  canExportAdvancedData: boolean;
  canExportPdfResearch: boolean;
  canUseSecResearch: boolean;
  canUseEarningsTranscripts: boolean;
  canUseMacroResearch: boolean;
  canUseWhatChanged: boolean;
  hasPriorityResearchQueue: boolean;
  hasEarlyAccessFeatures: boolean;
  canAccessApiKeys: boolean;
  hasPrioritySupport: boolean;
  canUseConnectedPortfolio: boolean;
  canUseRiskGuardian: boolean;
  maxConnectedAccounts: number;
  maxAIRequestsPerDay: number;
  maxMonthlyDeepResearchJobs: number;
  maxDeepResearchSourcesPerJob: number;
  maxDeepResearchAiSteps: number;
  maxDeepResearchTokens: number;
  maxSavedResearchReports: number;
  maxWatchlists: number;
  maxWatchlistTickers: number;
  maxAlerts: number;
  predictionHistoryDays: number;
}

export interface UserUsageRecord {
  userId: string;
  todayAiRequestsCount: number;
  todayAiRequestsLimit: number;
  todayAiResetAt: string;
  monthDeepResearchCount: number;
  monthDeepResearchLimit: number;
  monthDeepResearchResetAt: string;
  savedResearchReportsCount: number;
  savedResearchReportsLimit: number;
  activeAlertsCount: number;
  activeAlertsLimit: number;
  watchlistsCount: number;
  watchlistsLimit: number;
  lastUpdated: string;
}

export interface AdminSubscriptionMetrics {
  totalUsers: number;
  freeUsers: number;
  trialUsers: number;
  basicSubscribers: number;
  proSubscribers: number;
  premiumSubscribers: number;
  ultraSubscribers: number;
  activeSubscribers: number;
  canceledSubscribers: number;
  trialConversionRate: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  failedPayments: number;
  upcomingTrialExpirations: number;
}

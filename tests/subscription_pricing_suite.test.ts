import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS, normalizePlanId } from '../src/config/plans';
import { EntitlementService } from '../src/services/entitlementService';
import { UsageService } from '../src/server/usageService';
import { ServerUserStore } from '../src/services/serverUserStore';
import { getStripePriceId, isAllowedPriceId } from '../src/server/stripeService';
import { UserProfile } from '../src/types/user';

function createTestUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test_user_1',
    name: 'Test User',
    email: 'user@test.com',
    role: 'user',
    plan: 'free',
    planBillingCycle: 'monthly',
    planRenewsAt: '2026-09-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    tradingExperience: 'Intermediate',
    defaultTicker: 'NVDA',
    defaultTimeframe: '1d',
    riskTolerance: 'Moderate',
    twoFactorEnabled: false,
    notifications: {
      emailAlerts: true,
      pushAlerts: true,
      soundEnabled: true,
      telegramEnabled: false,
    },
    apiKeys: [],
    ...overrides,
  };
}

describe('MarketMind AI - Subscription & Monetization Suite', () => {
  beforeEach(() => {
    UsageService.resetUsageForTesting();
  });

  describe('1. Canonical Pricing Configuration', () => {
    it('Defines all 5 required tiers with exact specifications', () => {
      assert.ok(SUBSCRIPTION_PLANS.free, 'Free plan must exist');
      assert.ok(SUBSCRIPTION_PLANS.basic, 'Basic plan must exist');
      assert.ok(SUBSCRIPTION_PLANS.pro, 'Pro plan must exist');
      assert.ok(SUBSCRIPTION_PLANS.premium, 'Premium plan must exist');
      assert.ok(SUBSCRIPTION_PLANS.ultra, 'Ultra plan must exist');

      // Price validations
      assert.equal(SUBSCRIPTION_PLANS.free.monthlyPrice, 0);
      assert.equal(SUBSCRIPTION_PLANS.basic.monthlyPrice, 9.99);
      assert.equal(SUBSCRIPTION_PLANS.basic.annualBilledTotal, 99.00);

      assert.equal(SUBSCRIPTION_PLANS.pro.monthlyPrice, 29.99);
      assert.equal(SUBSCRIPTION_PLANS.pro.annualBilledTotal, 199.00);
      assert.equal(SUBSCRIPTION_PLANS.pro.isPopular, true);

      assert.equal(SUBSCRIPTION_PLANS.premium.monthlyPrice, 69.99);
      assert.equal(SUBSCRIPTION_PLANS.premium.annualBilledTotal, 299.00);

      assert.equal(SUBSCRIPTION_PLANS.ultra.monthlyPrice, 99.99);
      assert.equal(SUBSCRIPTION_PLANS.ultra.annualBilledTotal, 499.00);
    });

    it('Correctly normalizes plan identifiers and legacy aliases', () => {
      assert.equal(normalizePlanId('basic'), 'basic');
      assert.equal(normalizePlanId('PRO'), 'pro');
      assert.equal(normalizePlanId('premium'), 'premium');
      assert.equal(normalizePlanId('institutional'), 'premium');
      assert.equal(normalizePlanId('ultra'), 'ultra');
      assert.equal(normalizePlanId('enterprise'), 'ultra');
      assert.equal(normalizePlanId(null), 'free');
    });

    it('Enforces Deep Research source and token limits per plan', () => {
      assert.equal(SUBSCRIPTION_PLANS.free.limits.maxDeepResearchSourcesPerJob, 3);
      assert.equal(SUBSCRIPTION_PLANS.basic.limits.maxDeepResearchSourcesPerJob, 6);
      assert.equal(SUBSCRIPTION_PLANS.pro.limits.maxDeepResearchSourcesPerJob, 12);
      assert.equal(SUBSCRIPTION_PLANS.premium.limits.maxDeepResearchSourcesPerJob, 25);
      assert.equal(SUBSCRIPTION_PLANS.ultra.limits.maxDeepResearchSourcesPerJob, 50);

      assert.equal(SUBSCRIPTION_PLANS.free.limits.maxMonthlyDeepResearchJobs, 1);
      assert.equal(SUBSCRIPTION_PLANS.basic.limits.maxMonthlyDeepResearchJobs, 3);
      assert.equal(SUBSCRIPTION_PLANS.pro.limits.maxMonthlyDeepResearchJobs, 15);
      assert.equal(SUBSCRIPTION_PLANS.premium.limits.maxMonthlyDeepResearchJobs, 40);
      assert.equal(SUBSCRIPTION_PLANS.ultra.limits.maxMonthlyDeepResearchJobs, 100);
    });
  });

  describe('2. 15-Day Free Trial System', () => {
    it('Provides exactly 15 days of trial duration', () => {
      assert.equal(TRIAL_DURATION_DAYS, 15);
    });

    it('Calculates days remaining accurately from start timestamp', () => {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 10 * 86400000).toISOString();

      const user = createTestUser({
        id: 'user_trial_1',
        name: 'Trial User',
        email: 'trial@test.com',
        role: 'user',
        plan: 'pro',
        planBillingCycle: 'monthly',
        planRenewsAt: trialEndsAt.split('T')[0],
        subscriptionStatus: 'trialing',
        trialStatus: 'active',
        trialStartedAt: now.toISOString(),
        trialEndsAt,
        hasUsedTrial: true,
      });

      const trialInfo = EntitlementService.getTrialInfo(user);
      assert.equal(trialInfo.isTrial, true);
      assert.equal(trialInfo.isExpired, false);
      assert.equal(trialInfo.daysRemaining, 10);
    });

    it('Fails closed and downgrades to free when trial expires', () => {
      const past = new Date(Date.now() - 2 * 86400000).toISOString();
      const user = createTestUser({
        id: 'user_expired_trial',
        name: 'Expired Trial User',
        email: 'expired@test.com',
        role: 'user',
        plan: 'pro',
        planBillingCycle: 'monthly',
        planRenewsAt: past.split('T')[0],
        subscriptionStatus: 'trialing',
        trialStatus: 'expired',
        trialStartedAt: new Date(Date.now() - 17 * 86400000).toISOString(),
        trialEndsAt: past,
        hasUsedTrial: true,
      });

      const effectivePlan = EntitlementService.getEffectivePlan(user);
      assert.equal(effectivePlan, 'free', 'Expired trial must downgrade to free plan');

      const entitlements = EntitlementService.getEntitlements(user);
      assert.equal(entitlements.canUseRealtimeData, false);
      assert.equal(entitlements.trialExpired, true);
    });
  });

  describe('3. Centralized Entitlement Matrix', () => {
    it('Grants Basic subscribers scanner & CSV exports, but restricts Real-time data', () => {
      const basicUser = createTestUser({
        id: 'basic_user_1',
        name: 'Basic Trader',
        email: 'basic@test.com',
        role: 'user',
        plan: 'basic',
        planBillingCycle: 'monthly',
        planRenewsAt: '2026-09-01',
        subscriptionStatus: 'active',
      });

      const ent = EntitlementService.getEntitlements(basicUser);
      assert.equal(ent.planId, 'basic');
      assert.equal(ent.canUseScanner, true);
      assert.equal(ent.canExportReports, true);
      assert.equal(ent.canUseRealtimeData, false);
      assert.equal(ent.maxAIRequestsPerDay, 20);
      assert.equal(ent.maxMonthlyDeepResearchJobs, 3);
      assert.equal(ent.maxConnectedAccounts, 1);
    });

    it('Grants Pro subscribers real-time WebSocket feeds and 100 AI requests', () => {
      const proUser = createTestUser({
        id: 'pro_user_1',
        name: 'Pro Trader',
        email: 'pro@test.com',
        role: 'user',
        plan: 'pro',
        planBillingCycle: 'annual',
        planRenewsAt: '2027-08-01',
        subscriptionStatus: 'active',
      });

      const ent = EntitlementService.getEntitlements(proUser);
      assert.equal(ent.planId, 'pro');
      assert.equal(ent.canUseRealtimeData, true);
      assert.equal(ent.canUseOptions, true);
      assert.equal(ent.canUseAdvancedOptions, false);
      assert.equal(ent.canUseSecResearch, false);
      assert.equal(ent.maxAIRequestsPerDay, 100);
      assert.equal(ent.maxMonthlyDeepResearchJobs, 15);
      assert.equal(ent.maxConnectedAccounts, 5);
    });

    it('Grants Premium subscribers SEC EDGAR filings, Unusual Options, and PDF export', () => {
      const premiumUser = createTestUser({
        id: 'premium_user_1',
        name: 'Premium Investor',
        email: 'premium@test.com',
        role: 'user',
        plan: 'premium',
        planBillingCycle: 'monthly',
        planRenewsAt: '2026-09-01',
        subscriptionStatus: 'active',
      });

      const ent = EntitlementService.getEntitlements(premiumUser);
      assert.equal(ent.planId, 'premium');
      assert.equal(ent.canUseSecResearch, true);
      assert.equal(ent.canUseUnusualOptions, true);
      assert.equal(ent.canExportPdfResearch, true);
      assert.equal(ent.canUseWhatChanged, true);
      assert.equal(ent.hasPriorityResearchQueue, true);
      assert.equal(ent.maxAIRequestsPerDay, 500);
      assert.equal(ent.maxMonthlyDeepResearchJobs, 40);
    });

    it('Grants Ultra subscribers top quotas and institutional features', () => {
      const ultraUser = createTestUser({
        id: 'ultra_user_1',
        name: 'Ultra Fund Manager',
        email: 'ultra@test.com',
        role: 'user',
        plan: 'ultra',
        planBillingCycle: 'annual',
        planRenewsAt: '2027-08-01',
        subscriptionStatus: 'active',
      });

      const ent = EntitlementService.getEntitlements(ultraUser);
      assert.equal(ent.planId, 'ultra');
      assert.equal(ent.maxAIRequestsPerDay, 2000);
      assert.equal(ent.maxMonthlyDeepResearchJobs, 100);
      assert.equal(ent.maxDeepResearchSourcesPerJob, 50);
      assert.equal(ent.maxDeepResearchAiSteps, 25);
      assert.equal(ent.hasEarlyAccessFeatures, true);
      assert.equal(ent.maxConnectedAccounts, 50);
    });

    it('Returns correct required tiers in getRequiredTierForFeature', () => {
      assert.equal(EntitlementService.getRequiredTierForFeature('sec_filings').plan, 'premium');
      assert.equal(EntitlementService.getRequiredTierForFeature('pdf_export').plan, 'premium');
      assert.equal(EntitlementService.getRequiredTierForFeature('realtime').plan, 'pro');
      assert.equal(EntitlementService.getRequiredTierForFeature('scanner').plan, 'basic');
      assert.equal(EntitlementService.getRequiredTierForFeature('darkpool').plan, 'ultra');
    });
  });

  describe('4. Server-Side Usage & Limit Enforcement', () => {
    it('Enforces daily AI request quotas and blocks when limit is exceeded', () => {
      const userId = 'user_usage_ai_test';

      // Free user has limit of 5 requests/day
      for (let i = 1; i <= 5; i++) {
        const result = UsageService.recordAiRequest(userId, 'free');
        assert.equal(result.allowed, true);
        assert.equal(result.current, i);
        assert.equal(result.limit, 5);
      }

      // 6th request must be rejected
      const rejected = UsageService.recordAiRequest(userId, 'free');
      assert.equal(rejected.allowed, false);
      assert.equal(rejected.remaining, 0);
      assert.ok(rejected.error?.includes('Daily AI request limit reached'));
    });

    it('Enforces monthly Deep Research quotas and blocks when monthly limit is reached', () => {
      const userId = 'user_usage_research_test';

      // Basic user has 3 reports/month
      for (let i = 0; i < 3; i++) {
        const check = UsageService.canExecuteDeepResearch(userId, 'basic');
        assert.equal(check.allowed, true);
        assert.equal(check.maxSources, 6);
        UsageService.recordDeepResearchExecution(userId);
      }

      // 4th research job must be rejected
      const rejectedCheck = UsageService.canExecuteDeepResearch(userId, 'basic');
      assert.equal(rejectedCheck.allowed, false);
      assert.equal(rejectedCheck.remaining, 0);
      assert.ok(rejectedCheck.error?.includes('Monthly Deep Research limit reached'));
    });

    it('Exempts administrator users from usage caps', () => {
      const adminId = 'admin_user_quota_test';
      const aiCheck = UsageService.recordAiRequest(adminId, 'free', false, true);
      assert.equal(aiCheck.allowed, true);

      const researchCheck = UsageService.canExecuteDeepResearch(adminId, 'free', false, true);
      assert.equal(researchCheck.allowed, true);
    });
  });

  describe('5. Admin Metrics & MRR Calculation', () => {
    it('Accurately computes MRR and ARR across all active subscription tiers', () => {
      // Seed store accounts
      ServerUserStore.getOrCreateUser({ uid: 'acc_basic_1', email: 'b1@test.com', selectedPlan: 'basic' });
      ServerUserStore.updateSubscriptionByUid('acc_basic_1', { plan: 'basic', subscriptionStatus: 'active' });

      ServerUserStore.getOrCreateUser({ uid: 'acc_pro_1', email: 'p1@test.com', selectedPlan: 'pro' });
      ServerUserStore.updateSubscriptionByUid('acc_pro_1', { plan: 'pro', subscriptionStatus: 'active' });

      ServerUserStore.getOrCreateUser({ uid: 'acc_premium_1', email: 'prem1@test.com', selectedPlan: 'premium' });
      ServerUserStore.updateSubscriptionByUid('acc_premium_1', { plan: 'premium', subscriptionStatus: 'active' });

      ServerUserStore.getOrCreateUser({ uid: 'acc_ultra_1', email: 'u1@test.com', selectedPlan: 'ultra' });
      ServerUserStore.updateSubscriptionByUid('acc_ultra_1', { plan: 'ultra', subscriptionStatus: 'active' });

      const metrics = ServerUserStore.getAdminMetrics();
      // Expected MRR: 9.99 + 29.99 + 69.99 + 99.99 = 209.96
      assert.ok(metrics.monthlyRecurringRevenue >= 209.96, `MRR should include all tiers, got ${metrics.monthlyRecurringRevenue}`);
      assert.ok(metrics.annualRecurringRevenue >= 209.96 * 12);
      assert.ok(metrics.basicSubscribers >= 1);
      assert.ok(metrics.proSubscribers >= 1);
      assert.ok(metrics.premiumSubscribers >= 1);
      assert.ok(metrics.ultraSubscribers >= 1);
    });
  });
});

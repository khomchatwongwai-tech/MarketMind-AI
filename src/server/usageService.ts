/**
 * Server-side Usage Tracking & Limit Enforcement Service
 * Manages daily AI query quotas, monthly Deep Research allocations, and resource guardrails.
 */

import { SubscriptionPlanId, UserUsageRecord } from '../types/subscription.js';
import { SUBSCRIPTION_PLANS, normalizePlanId } from '../config/plans.js';
import { getFirebaseFirestore } from './firebaseAdmin.js';

interface StoredUserUsage {
  userId: string;
  dailyAiCount: number;
  dailyAiDate: string; // YYYY-MM-DD
  monthlyResearchCount: number;
  monthlyResearchMonth: string; // YYYY-MM
  savedReportsCount: number;
  lastUpdated: string;
}

const userUsageMap: Map<string, StoredUserUsage> = new Map();

function getTodayUtc(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentMonthUtc(): string {
  return new Date().toISOString().substring(0, 7);
}

function getNextMidnightUtcIso(): string {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

function getNextMonthFirstUtcIso(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return nextMonth.toISOString();
}

export class UsageService {
  /**
   * Retrieves or initializes usage record for a user, handling automatic period resets.
   */
  static getOrCreateRecord(userId: string): StoredUserUsage {
    const today = getTodayUtc();
    const currentMonth = getCurrentMonthUtc();
    let record = userUsageMap.get(userId);

    if (!record) {
      record = {
        userId,
        dailyAiCount: 0,
        dailyAiDate: today,
        monthlyResearchCount: 0,
        monthlyResearchMonth: currentMonth,
        savedReportsCount: 0,
        lastUpdated: new Date().toISOString(),
      };
      userUsageMap.set(userId, record);
      return record;
    }

    // Reset daily AI count if day has rolled over
    if (record.dailyAiDate !== today) {
      record.dailyAiCount = 0;
      record.dailyAiDate = today;
    }

    // Reset monthly research count if month has rolled over
    if (record.monthlyResearchMonth !== currentMonth) {
      record.monthlyResearchCount = 0;
      record.monthlyResearchMonth = currentMonth;
    }

    return record;
  }

  /**
   * Checks and records an AI assistant query. Fails closed when limit is reached.
   */
  static recordAiRequest(
    userId: string,
    planId: SubscriptionPlanId = 'free',
    isTrial: boolean = false,
    isAdmin: boolean = false
  ): {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    resetAt: string;
    error?: string;
  } {
    if (isAdmin) {
      return {
        allowed: true,
        current: 0,
        limit: 999999,
        remaining: 999999,
        resetAt: getNextMidnightUtcIso(),
      };
    }

    const effectivePlan = normalizePlanId(planId);
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.free;
    // During 15-day trial, provide Pro-tier AI limits (100 queries/day)
    const limit = isTrial ? Math.max(planConfig.limits.maxAIRequestsPerDay, 100) : planConfig.limits.maxAIRequestsPerDay;

    const record = this.getOrCreateRecord(userId);

    if (record.dailyAiCount >= limit) {
      return {
        allowed: false,
        current: record.dailyAiCount,
        limit,
        remaining: 0,
        resetAt: getNextMidnightUtcIso(),
        error: `Daily AI request limit reached (${record.dailyAiCount}/${limit}). Upgrade your plan or wait for the daily reset at 00:00 UTC.`,
      };
    }

    record.dailyAiCount += 1;
    record.lastUpdated = new Date().toISOString();
    userUsageMap.set(userId, record);

    return {
      allowed: true,
      current: record.dailyAiCount,
      limit,
      remaining: Math.max(0, limit - record.dailyAiCount),
      resetAt: getNextMidnightUtcIso(),
    };
  }

  /**
   * Checks whether the user is entitled to run a Deep Research job and returns plan-specific limits.
   */
  static canExecuteDeepResearch(
    userId: string,
    planId: SubscriptionPlanId = 'free',
    isTrial: boolean = false,
    isAdmin: boolean = false
  ): {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    maxSources: number;
    maxSteps: number;
    maxTokens: number;
    resetAt: string;
    error?: string;
  } {
    if (isAdmin) {
      const ultraLimits = SUBSCRIPTION_PLANS.ultra.limits;
      return {
        allowed: true,
        current: 0,
        limit: 999,
        remaining: 999,
        maxSources: ultraLimits.maxDeepResearchSourcesPerJob,
        maxSteps: ultraLimits.maxDeepResearchAiSteps,
        maxTokens: ultraLimits.maxDeepResearchTokens,
        resetAt: getNextMonthFirstUtcIso(),
      };
    }

    const effectivePlan = normalizePlanId(planId);
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.free;

    // During trial, grant Pro research limits
    const limit = isTrial
      ? Math.max(planConfig.limits.maxMonthlyDeepResearchJobs, 15)
      : planConfig.limits.maxMonthlyDeepResearchJobs;

    const maxSources = isTrial
      ? Math.max(planConfig.limits.maxDeepResearchSourcesPerJob, 12)
      : planConfig.limits.maxDeepResearchSourcesPerJob;

    const maxSteps = isTrial
      ? Math.max(planConfig.limits.maxDeepResearchAiSteps, 10)
      : planConfig.limits.maxDeepResearchAiSteps;

    const maxTokens = isTrial
      ? Math.max(planConfig.limits.maxDeepResearchTokens, 15000)
      : planConfig.limits.maxDeepResearchTokens;

    const record = this.getOrCreateRecord(userId);

    if (record.monthlyResearchCount >= limit) {
      return {
        allowed: false,
        current: record.monthlyResearchCount,
        limit,
        remaining: 0,
        maxSources,
        maxSteps,
        maxTokens,
        resetAt: getNextMonthFirstUtcIso(),
        error: `Monthly Deep Research limit reached (${record.monthlyResearchCount}/${limit} reports). Upgrade to Premium or Ultra for expanded research capacity.`,
      };
    }

    return {
      allowed: true,
      current: record.monthlyResearchCount,
      limit,
      remaining: Math.max(0, limit - record.monthlyResearchCount),
      maxSources,
      maxSteps,
      maxTokens,
      resetAt: getNextMonthFirstUtcIso(),
    };
  }

  /**
   * Records execution of a Deep Research job upon successful launch.
   */
  static recordDeepResearchExecution(userId: string): void {
    const record = this.getOrCreateRecord(userId);
    record.monthlyResearchCount += 1;
    record.lastUpdated = new Date().toISOString();
    userUsageMap.set(userId, record);
  }

  /**
   * Updates saved reports counter for a user.
   */
  static setSavedReportsCount(userId: string, count: number): void {
    const record = this.getOrCreateRecord(userId);
    record.savedReportsCount = Math.max(0, count);
    record.lastUpdated = new Date().toISOString();
    userUsageMap.set(userId, record);
  }

  /**
   * Returns a complete usage snapshot for the user interface.
   */
  static getUserUsageSnapshot(
    userId: string,
    planId: SubscriptionPlanId = 'free',
    isTrial: boolean = false,
    activeAlertsCount: number = 0,
    watchlistsCount: number = 0
  ): UserUsageRecord {
    const record = this.getOrCreateRecord(userId);
    const effectivePlan = normalizePlanId(planId);
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan] || SUBSCRIPTION_PLANS.free;

    const aiLimit = isTrial
      ? Math.max(planConfig.limits.maxAIRequestsPerDay, 100)
      : planConfig.limits.maxAIRequestsPerDay;

    const researchLimit = isTrial
      ? Math.max(planConfig.limits.maxMonthlyDeepResearchJobs, 15)
      : planConfig.limits.maxMonthlyDeepResearchJobs;

    const savedLimit = isTrial
      ? Math.max(planConfig.limits.maxSavedResearchReports, 50)
      : planConfig.limits.maxSavedResearchReports;

    return {
      userId,
      todayAiRequestsCount: record.dailyAiCount,
      todayAiRequestsLimit: aiLimit,
      todayAiResetAt: getNextMidnightUtcIso(),
      monthDeepResearchCount: record.monthlyResearchCount,
      monthDeepResearchLimit: researchLimit,
      monthDeepResearchResetAt: getNextMonthFirstUtcIso(),
      savedResearchReportsCount: record.savedReportsCount,
      savedResearchReportsLimit: savedLimit,
      activeAlertsCount,
      activeAlertsLimit: planConfig.limits.maxAlerts,
      watchlistsCount,
      watchlistsLimit: planConfig.limits.maxWatchlists,
      lastUpdated: record.lastUpdated,
    };
  }

  /**
   * Resets usage for testing or sandbox simulations.
   */
  static resetUsageForTesting(userId?: string): void {
    if (userId) {
      userUsageMap.delete(userId);
    } else {
      userUsageMap.clear();
    }
  }
}

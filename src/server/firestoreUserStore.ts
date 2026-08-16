import { getFirebaseFirestore } from './firebaseAdmin';
import { ServerUserStore, StoredUserAccount } from '../services/serverUserStore';
import { BillingInvoice, SubscriptionPlanId, AdminSubscriptionMetrics } from '../types/subscription';
import { SUBSCRIPTION_PLANS } from '../config/plans';
import { UserProfile, UserRole } from '../types/user';

export class FirestoreUserStore {
  private static databaseProvider: () => any = () => getFirebaseFirestore();

  static setDatabaseProviderForTests(provider: (() => any) | null): void {
    if (process.env.NODE_ENV === 'production') throw new Error('Test database injection is disabled in production.');
    this.databaseProvider = provider || (() => getFirebaseFirestore());
  }

  private static db(): any { return this.databaseProvider(); }

  static async findById(uid: string): Promise<StoredUserAccount | null> {
    if (!uid) return null;
    const snapshot = await this.db().collection('users').doc(uid).get();
    return snapshot.exists ? snapshot.data() as StoredUserAccount : null;
  }

  static async getOrCreateUser(input: { uid: string; email: string; name?: string; firstName?: string; lastName?: string; role?: UserRole }): Promise<StoredUserAccount> {
    const db = this.db();
    const ref = db.collection('users').doc(input.uid);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) return snapshot.data() as StoredUserAccount;
      const now = new Date();
      const firstName = input.firstName || input.name?.split(' ')[0] || 'Trader';
      const lastName = input.lastName || input.name?.split(' ').slice(1).join(' ') || '';
      const account: StoredUserAccount = {
        id: input.uid, email: input.email.toLowerCase().trim(), firstName, lastName,
        name: `${firstName} ${lastName}`.trim(), role: 'user', emailVerified: false,
        country: 'US', language: 'en', timezone: 'America/New_York', plan: 'free',
        subscriptionStatus: 'free', hasUsedTrial: false, planBillingCycle: 'monthly',
        planRenewsAt: now.toISOString().slice(0, 10), monthlyPrice: 0, cancelAtPeriodEnd: false,
        paymentProvider: 'none', tradingExperience: 'Intermediate', defaultTicker: 'SPY',
        defaultTimeframe: '5m', riskTolerance: 'Moderate', createdAt: now.toISOString(),
        updatedAt: now.toISOString(), lastLoginAt: now.toISOString(),
      };
      transaction.create(ref, account);
      return account;
    });
  }

  static async updateSafeProfile(uid: string, rawUpdates: Record<string, unknown>): Promise<{ user: StoredUserAccount }> {
    const forbidden = Object.keys(rawUpdates).filter((key) => ServerUserStore.FORBIDDEN_PROFILE_FIELDS.has(key));
    if (forbidden.length) {
      const error = Object.assign(new Error('Profile contains protected fields.'), { statusCode: 400, code: 'FORBIDDEN_FIELD_MODIFICATION' });
      throw error;
    }
    const safe = Object.fromEntries(Object.entries(rawUpdates).filter(([key]) => ServerUserStore.SAFE_PROFILE_FIELDS.has(key)));
    const account = await this.updateAccount(uid, safe);
    return { user: account };
  }

  static async updateAccount(uid: string, updates: Partial<StoredUserAccount>): Promise<StoredUserAccount> {
    const db = this.db();
    const ref = db.collection('users').doc(uid);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });
      const account = { ...snapshot.data(), ...updates, id: uid, updatedAt: new Date().toISOString() } as StoredUserAccount;
      transaction.set(ref, account);
      return account;
    });
  }

  static async getInvoicesForUser(uid: string): Promise<BillingInvoice[]> {
    const snapshot = await this.db().collection('users').doc(uid).collection('invoices').orderBy('createdAt', 'desc').limit(100).get();
    return snapshot.docs.map((doc) => doc.data() as BillingInvoice);
  }

  static async getAdminMetrics(): Promise<AdminSubscriptionMetrics> {
    const snapshot = await this.db().collection('users').get();
    const accounts = snapshot.docs.map((doc) => doc.data() as StoredUserAccount);
    const counts = { free: 0, trial: 0, basic: 0, pro: 0, premium: 0, active: 0, canceled: 0 };
    let mrr = 0;
    for (const account of accounts) {
      if (account.subscriptionStatus === 'trialing') counts.trial++;
      if (account.subscriptionStatus === 'active') counts.active++;
      if (account.subscriptionStatus === 'canceled') counts.canceled++;
      if (account.plan === 'free') counts.free++;
      if (account.plan === 'basic' || account.plan === 'pro' || account.plan === 'premium') {
        counts[account.plan]++; mrr += SUBSCRIPTION_PLANS[account.plan].monthlyPrice;
      }
    }
    return { totalUsers: accounts.length, freeUsers: counts.free, trialUsers: counts.trial,
      basicSubscribers: counts.basic, proSubscribers: counts.pro, premiumSubscribers: counts.premium,
      activeSubscribers: counts.active, canceledSubscribers: counts.canceled,
      trialConversionRate: counts.active + counts.trial ? Math.round(counts.active / (counts.active + counts.trial) * 100) : 0,
      monthlyRecurringRevenue: mrr, annualRecurringRevenue: mrr * 12,
      churnRate: counts.active + counts.canceled ? Math.round(counts.canceled / (counts.active + counts.canceled) * 100) : 0,
      failedPayments: 0, upcomingTrialExpirations: 0 };
  }

  static convertToUserProfile(account: StoredUserAccount): UserProfile {
    return ServerUserStore.convertToUserProfile(account);
  }
}

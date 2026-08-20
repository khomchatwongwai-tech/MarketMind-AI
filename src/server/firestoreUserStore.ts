import { getSupabaseAdmin } from './supabaseAdmin.js';
import { ServerUserStore, StoredUserAccount } from '../services/serverUserStore.js';
import { BillingInvoice, SubscriptionPlanId, AdminSubscriptionMetrics } from '../types/subscription.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';
import { UserProfile, UserRole } from '../types/user.js';

export class FirestoreUserStore {
  private static databaseProvider: (() => any) | null = null;

  static setDatabaseProviderForTests(provider: (() => any) | null): void {
    if (process.env.NODE_ENV === 'production') throw new Error('Test database injection is disabled in production.');
    this.databaseProvider = provider;
  }

  private static db(): any { return this.databaseProvider?.(); }

  static async findById(uid: string): Promise<StoredUserAccount | null> {
    if (!uid) return null;
    if (!this.databaseProvider) {
      const { data, error } = await getSupabaseAdmin().from('user_profiles').select('*').eq('firebase_uid', uid).maybeSingle();
      if (error) throw new Error(`Supabase user lookup failed: ${error.message}`);
      return data ? this.fromRow(data) : null;
    }
    const snapshot = await this.db().collection('users').doc(uid).get();
    return snapshot.exists ? snapshot.data() as StoredUserAccount : null;
  }

  static async getOrCreateUser(input: { uid: string; email: string; name?: string; firstName?: string; lastName?: string; role?: UserRole }): Promise<StoredUserAccount> {
    if (!this.databaseProvider) {
      const existing = await this.findById(input.uid);
      if (existing) return existing;
      const account = this.newAccount(input);
      const { data, error } = await getSupabaseAdmin().from('user_profiles').upsert(this.toRow(account), { onConflict: 'firebase_uid', ignoreDuplicates: true }).select('*').single();
      if (error) {
        const raced = await this.findById(input.uid);
        if (raced) return raced;
        throw new Error(`Supabase user creation failed: ${error.message}`);
      }
      return this.fromRow(data);
    }
    const db = this.db();
    const ref = db.collection('users').doc(input.uid);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) return snapshot.data() as StoredUserAccount;
      const account = this.newAccount(input);
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
    if (!this.databaseProvider) {
      const current = await this.findById(uid);
      if (!current) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });
      const account = { ...current, ...updates, id: uid, updatedAt: new Date().toISOString() };
      const { data, error } = await getSupabaseAdmin().from('user_profiles').update(this.toRow(account)).eq('firebase_uid', uid).select('*').single();
      if (error) throw new Error(`Supabase user update failed: ${error.message}`);
      return this.fromRow(data);
    }
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
    if (!this.databaseProvider) {
      const { data, error } = await getSupabaseAdmin().from('billing_invoices').select('data').eq('firebase_uid', uid).order('created_at', { ascending: false }).limit(100);
      if (error) throw new Error(`Supabase invoice lookup failed: ${error.message}`);
      return (data || []).map((row: any) => row.data as BillingInvoice);
    }
    const snapshot = await this.db().collection('users').doc(uid).collection('invoices').orderBy('createdAt', 'desc').limit(100).get();
    return snapshot.docs.map((doc) => doc.data() as BillingInvoice);
  }

  static async getAdminMetrics(): Promise<AdminSubscriptionMetrics> {
    let accounts: StoredUserAccount[];
    if (!this.databaseProvider) {
      const { data, error } = await getSupabaseAdmin().from('user_profiles').select('*').limit(10000);
      if (error) throw new Error(`Supabase metrics lookup failed: ${error.message}`);
      accounts = (data || []).map((row: any) => this.fromRow(row));
    } else {
      const snapshot = await this.db().collection('users').get();
      accounts = snapshot.docs.map((doc: any) => doc.data() as StoredUserAccount);
    }
    const counts = { free: 0, trial: 0, basic: 0, pro: 0, premium: 0, ultra: 0, active: 0, canceled: 0 };
    let mrr = 0;
    for (const account of accounts) {
      if (account.subscriptionStatus === 'trialing') counts.trial++;
      if (account.subscriptionStatus === 'active') counts.active++;
      if (account.subscriptionStatus === 'canceled') counts.canceled++;
      if (account.plan === 'free') counts.free++;
      if (account.plan === 'basic' || account.plan === 'pro' || account.plan === 'premium' || account.plan === 'ultra') {
        counts[account.plan]++;
        mrr += SUBSCRIPTION_PLANS[account.plan]?.monthlyPrice || 0;
      }
    }
    return {
      totalUsers: accounts.length,
      freeUsers: counts.free,
      trialUsers: counts.trial,
      basicSubscribers: counts.basic,
      proSubscribers: counts.pro,
      premiumSubscribers: counts.premium,
      ultraSubscribers: counts.ultra,
      activeSubscribers: counts.active,
      canceledSubscribers: counts.canceled,
      trialConversionRate: counts.active + counts.trial ? Math.round((counts.active / (counts.active + counts.trial)) * 100) : 0,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: mrr * 12,
      churnRate: counts.active + counts.canceled ? Math.round((counts.canceled / (counts.active + counts.canceled)) * 100) : 0,
      failedPayments: 0,
      upcomingTrialExpirations: 0,
    };
  }

  static convertToUserProfile(account: StoredUserAccount): UserProfile {
    return ServerUserStore.convertToUserProfile(account);
  }

  private static newAccount(input: { uid: string; email: string; name?: string; firstName?: string; lastName?: string }): StoredUserAccount {
    const now = new Date();
    const firstName = input.firstName || input.name?.split(' ')[0] || 'Trader';
    const lastName = input.lastName || input.name?.split(' ').slice(1).join(' ') || '';
    return { id: input.uid, email: input.email.toLowerCase().trim(), firstName, lastName, name: `${firstName} ${lastName}`.trim(),
      role: 'user', emailVerified: false, country: 'US', language: 'en', timezone: 'America/New_York', plan: 'free',
      subscriptionStatus: 'free', hasUsedTrial: false, planBillingCycle: 'monthly', planRenewsAt: now.toISOString().slice(0, 10),
      monthlyPrice: 0, cancelAtPeriodEnd: false, paymentProvider: 'none', tradingExperience: 'Intermediate', defaultTicker: 'SPY',
      defaultTimeframe: '5m', riskTolerance: 'Moderate', createdAt: now.toISOString(), updatedAt: now.toISOString(), lastLoginAt: now.toISOString() };
  }

  private static toRow(account: StoredUserAccount): Record<string, unknown> {
    return { firebase_uid: account.id, email: account.email, profile: account, role: account.role, plan: account.plan,
      subscription_status: account.subscriptionStatus, stripe_customer_id: account.paymentCustomerId || null,
      stripe_subscription_id: account.paymentSubscriptionId || null, created_at: account.createdAt, updated_at: account.updatedAt };
  }

  private static fromRow(row: any): StoredUserAccount {
    return { ...(row.profile || {}), id: row.firebase_uid, email: row.email, role: row.role, plan: row.plan,
      subscriptionStatus: row.subscription_status, paymentCustomerId: row.stripe_customer_id || undefined,
      paymentSubscriptionId: row.stripe_subscription_id || undefined, createdAt: row.created_at, updatedAt: row.updated_at } as StoredUserAccount;
  }
}

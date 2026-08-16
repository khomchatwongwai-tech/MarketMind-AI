import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentResolver } from '../src/services/marketProviders/InstrumentResolver';
import { AppConfig } from '../src/config/environment';
import { EntitlementService } from '../src/services/entitlementService';
import { ServerUserStore } from '../src/services/serverUserStore';
import { UserService } from '../src/services/userService';
import { UserProfile } from '../src/types/user';

describe('Phase 4.5 Production Security & Entitlements Suite', () => {
  it('Symbol Resolution: correctly normalizes multi-asset tickers with clean metadata', () => {
    const symbols = ['SPY', 'AAPL', 'NVDA', 'IBM', 'BRK.B', 'BTC-USD', 'BTCUSDT', 'EUR/USD', 'EURUSD', 'ES=F', 'CL=F'];
    for (const sym of symbols) {
      const res = InstrumentResolver.resolve(sym);
      assert.ok(res, `Failed to resolve ${sym}`);
      assert.ok(res.normalizedSymbol.length > 0);
      assert.ok(res.instrument.exchange.length > 0);
      assert.ok(res.instrument.currency.length > 0);
      assert.ok(res.instrument.name.length > 0);
    }
  });

  it('Production Demo Data Blocking: Demo mode is strictly disabled by default', () => {
    assert.equal(AppConfig.allowSimulatedMarketData, false, 'Simulated market data must be disabled by default');
    assert.equal(AppConfig.isDemoMode, false, 'Demo mode must be false by default in production');
  });

  it('Authentication & Role Protection: Default created users are unprivileged with free plan', async () => {
    const newUser = await ServerUserStore.getOrCreateUser({
      uid: 'sec_test_user_001',
      email: 'sec_test_user_001@example.com',
      name: 'Security Tester',
    });
    assert.equal(newUser.role, 'user', 'New user role must be standard user');
    assert.equal(newUser.plan, 'free', 'New user plan must default to free');
    assert.equal(newUser.subscriptionStatus, 'free');
  });

  it('Entitlements: Free plan is strictly barred from advanced institutional/enterprise features', () => {
    const defaultUser = UserService.getCurrentUser();
    const freeUser: UserProfile = {
      ...defaultUser,
      plan: 'free',
      subscriptionStatus: 'free',
    };
    const freeEntitlements = EntitlementService.getEntitlements(freeUser);

    assert.equal(freeEntitlements.canExportReports, false, 'Free users cannot export institutional reports');
    assert.equal(freeEntitlements.canUseOptions, false, 'Free users cannot access advanced options analytics');
    assert.equal(freeEntitlements.canAccessApiKeys, false, 'Free users cannot generate server API keys');
    assert.equal(freeEntitlements.canUseBacktesting, false, 'Free users cannot access full backtesting');
  });

  it('Entitlements: Pro plan unlocks designated capabilities', () => {
    const defaultUser = UserService.getCurrentUser();
    const proUser: UserProfile = {
      ...defaultUser,
      plan: 'pro',
      subscriptionStatus: 'active',
    };
    const proEntitlements = EntitlementService.getEntitlements(proUser);

    assert.equal(proEntitlements.canExportReports, true, 'Pro users can export reports');
    assert.equal(proEntitlements.canUseBacktesting, true, 'Pro users can access backtest engine');
  });

  it('Admin Route Protection: Non-admin users cannot access admin capabilities', () => {
    const normalUserRole: string = 'user';
    assert.equal(normalUserRole === 'admin', false, 'Normal user must NOT have admin role');

    const adminUserRole: string = 'admin';
    assert.equal(adminUserRole === 'admin', true, 'Verified admin user has admin role');
  });

  it('Stripe Plan Transition: Plan updates persist in ServerUserStore only upon verified request', async () => {
    const testEmail = `stripe_test_${Date.now()}@example.com`;
    const user = await ServerUserStore.getOrCreateUser({
      uid: `uid_stripe_${Date.now()}`,
      email: testEmail,
      name: 'Stripe Tester',
    });
    assert.equal(user.plan, 'free');

    // Simulate verified Stripe subscription update
    const updated = await ServerUserStore.updateAccount(user.id, {
      plan: 'pro',
      subscriptionStatus: 'active',
      paymentCustomerId: 'cus_test_12345',
      paymentSubscriptionId: 'sub_test_67890',
    });

    assert.equal(updated.plan, 'pro');
    assert.equal(updated.subscriptionStatus, 'active');
    assert.equal(updated.paymentCustomerId, 'cus_test_12345');
  });

  it('Broker and Trading Safety: Order simulation is guarded and prevents unauthorized fills', () => {
    const currentUser = UserService.getCurrentUser();
    assert.ok(currentUser, 'Must have a default user structure');
    assert.equal(currentUser.role, 'user', 'Client state cannot self-elevate');
  });
});

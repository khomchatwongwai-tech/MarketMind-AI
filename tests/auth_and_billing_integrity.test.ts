import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserService } from '../src/services/userService';
import { AppConfig } from '../src/config/environment';

describe('Auth & Billing Integrity Unit Tests', () => {
  it('Normal users must always default to role="user" and plan="free"', () => {
    const user = UserService.login('regular.trader@example.com', 'Regular Trader');
    assert.equal(user.role, 'user', 'New user role must be "user"');
    assert.equal(user.plan, 'free', 'New user plan must be "free"');
    assert.equal(user.planTier, 'Free', 'New user planTier must be "Free"');
    assert.equal(user.isGuest, false);
  });

  it('No hardcoded email receives automatic admin privileges on login', () => {
    const legacyAdminEmail = 'khomchatwongwai@gmail.com';
    const loginResult = UserService.login(legacyAdminEmail);
    assert.equal(loginResult.role, 'user', 'Legacy email must not receive automatic admin role');
    assert.equal(loginResult.plan, 'free', 'Legacy email must not receive automatic premium plan');
  });

  it('Guest login creates standard unprivileged guest profile', () => {
    const guest = UserService.loginAsGuest();
    assert.equal(guest.role, 'user');
    assert.equal(guest.plan, 'free');
    assert.equal(guest.isGuest, true);
  });

  it('AppConfig fails closed in production environment', () => {
    // If not in development mode, allowSimulatedMarketData must evaluate to false
    if (AppConfig.isProduction) {
      assert.equal(AppConfig.allowSimulatedMarketData, false, 'Production must never allow simulated market data');
      assert.equal(AppConfig.isDemoMode, false, 'Production must disable demo mode by default');
    }
  });

  it('Default user state in UserService is unprivileged with free plan tier', () => {
    const defaultUser = UserService.getUser();
    assert.equal(defaultUser.role, 'user');
    assert.equal(defaultUser.plan, 'free');
    assert.equal(defaultUser.planTier, 'FREE');
  });

  it('requireAuth correctly extracts full UID from dev tokens with underscores', async () => {
    const { requireAuth } = await import('../src/server/authMiddleware');
    const { ServerUserStore } = await import('../src/services/serverUserStore');

    ServerUserStore.getOrCreateUser({
      uid: 'usr_default_trader',
      email: 'trader@marketmind.ai',
      role: 'user',
      selectedPlan: 'pro',
    });

    const mockReq: any = {
      headers: {
        authorization: 'Bearer mkt_dev_usr_default_trader',
      },
    };
    const mockRes: any = {
      status: (code: number) => ({
        json: (data: any) => ({ statusCode: code, data }),
      }),
    };
    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
    };

    await requireAuth(mockReq, mockRes, mockNext);
    assert.equal(nextCalled, true, 'requireAuth should call next()');
    assert.equal(mockReq.user?.uid, 'usr_default_trader', 'Dev UID with underscores should not be truncated');
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('MarketMind AI - Authentication & Billing Integrity', () => {
  it('ServerUserStore creates and retrieves users correctly', async () => {
    const { ServerUserStore } = await import('../src/services/serverUserStore');

    const created = ServerUserStore.getOrCreateUser({
      uid: 'usr_test_123',
      email: 'test@marketmind.ai',
      role: 'user',
      selectedPlan: 'pro',
    });

    assert.equal(created.uid, 'usr_test_123');
    assert.equal(created.email, 'test@marketmind.ai');
    assert.equal(created.role, 'user');
    assert.equal(created.plan, 'pro');
    assert.equal(created.planTier, 'PRO');

    const found = ServerUserStore.findById('usr_test_123');
    assert.ok(found);
    assert.equal(found.uid, 'usr_test_123');
    assert.equal(found.plan, 'pro');
  });

  it('ServerUserStore falls back to default free user when unauthenticated', async () => {
    const { ServerUserStore } = await import('../src/services/serverUserStore');

    const defaultUser = ServerUserStore.getOrCreateUser({});
    assert.ok(defaultUser);
    assert.equal(defaultUser.uid, 'dev_user_uid');
    assert.equal(defaultUser.plan, 'free');
    assert.equal(defaultUser.planTier, 'FREE');
  });

  it('requireAuth correctly extracts full UID from dev tokens with underscores', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
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
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

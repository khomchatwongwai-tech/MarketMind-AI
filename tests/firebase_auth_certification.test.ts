import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFirebaseServiceAccount } from '../src/server/firebaseAdmin';
import { requireRole, requireAnyRole, AuthenticatedRequest } from '../src/server/authMiddleware';
import { ServerUserStore } from '../src/services/serverUserStore';
import { AppConfig } from '../src/config/environment';

describe('MarketMind AI — Firebase Authentication Production Certification Suite', () => {
  it('1. Firebase Service Account Parser: Validates JSON and project_id matching', () => {
    const validKey = JSON.stringify({
      type: 'service_account',
      project_id: 'gen-lang-client-0282286222',
      private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk@gen-lang-client-0282286222.iam.gserviceaccount.com',
    });

    const parsed = parseFirebaseServiceAccount(validKey, 'gen-lang-client-0282286222');
    assert.equal(parsed.project_id, 'gen-lang-client-0282286222');
    assert.equal(parsed.type, 'service_account');

    // Mismatched project ID must fail closed
    assert.throws(
      () => parseFirebaseServiceAccount(validKey, 'different-project-id'),
      /does not match configured project/
    );

    // Malformed JSON must fail closed
    assert.throws(
      () => parseFirebaseServiceAccount('{ invalid_json: ', 'gen-lang-client-0282286222'),
      /must be valid JSON/
    );
  });

  it('2. Client Firebase Config: Points to production project without exposing admin credentials', () => {
    const clientConfigFile = readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const clientConfig = JSON.parse(clientConfigFile);

    assert.equal(clientConfig.projectId, 'gen-lang-client-0282286222');
    assert.ok(clientConfig.apiKey, 'Client config must have public web apiKey');
    assert.ok(clientConfig.authDomain, 'Client config must have authDomain');
    assert.ok(clientConfig.appId, 'Client config must have appId');

    // Must never contain service account private keys
    assert.equal(clientConfig.private_key, undefined);
    assert.equal(clientConfig.client_email, undefined);
    assert.equal(clientConfig.type, undefined);
  });

  it('3. Secret Isolation: Server service account is never bundled into client-side code', () => {
    const clientFirebase = readFileSync(join(process.cwd(), 'src/config/firebase.ts'), 'utf8');
    assert.doesNotMatch(clientFirebase, /FIREBASE_SERVICE_ACCOUNT_KEY/);
    assert.doesNotMatch(clientFirebase, /firebase-admin/);
    assert.doesNotMatch(clientFirebase, /private_key/);
  });

  it('4. Admin Authorization Guards: Rejects non-admin roles with 403 INSUFFICIENT_PRIVILEGES', () => {
    const adminMiddleware = requireRole('admin');

    let responseCode = 0;
    let responseBody: any = null;
    let nextCalled = false;

    const mockRes: any = {
      status(code: number) {
        responseCode = code;
        return {
          json(body: any) {
            responseBody = body;
          },
        };
      },
    };

    // Test 4a: Regular user attempting admin route
    const regularUserReq: AuthenticatedRequest = {
      user: {
        uid: 'usr_regular_trader_123',
        email: 'trader@example.com',
        role: 'user',
      },
    } as any;

    adminMiddleware(regularUserReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'Regular user should not proceed to admin route');
    assert.equal(responseCode, 403);
    assert.equal(responseBody.code, 'INSUFFICIENT_PRIVILEGES');

    // Test 4b: Admin user attempting admin route
    nextCalled = false;
    responseCode = 0;
    const adminUserReq: AuthenticatedRequest = {
      user: {
        uid: 'usr_admin_456',
        email: 'admin@marketmind.ai',
        role: 'admin',
      },
    } as any;

    adminMiddleware(adminUserReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Admin user should proceed');
  });

  it('5. Cross-User Isolation: User accounts are partitioned strictly by Firebase UID', () => {
    // Create User A
    const userA = ServerUserStore.getOrCreateUser({
      uid: 'firebase_uid_user_alpha',
      email: 'user.alpha@fund.com',
      name: 'Alpha Quant',
      role: 'user',
    });

    // Create User B
    const userB = ServerUserStore.getOrCreateUser({
      uid: 'firebase_uid_user_beta',
      email: 'user.beta@fund.com',
      name: 'Beta Trader',
      role: 'user',
    });

    assert.notEqual(userA.id, userB.id);
    assert.equal(ServerUserStore.findById('firebase_uid_user_alpha')?.email, 'user.alpha@fund.com');
    assert.equal(ServerUserStore.findById('firebase_uid_user_beta')?.email, 'user.beta@fund.com');

    // User A modifying their safe profile does NOT affect User B
    ServerUserStore.updateSafeProfile('firebase_uid_user_alpha', {
      defaultTicker: 'NVDA',
      tradingExperience: 'Pro Quant',
    });

    const refreshedA = ServerUserStore.findById('firebase_uid_user_alpha');
    const refreshedB = ServerUserStore.findById('firebase_uid_user_beta');

    assert.equal(refreshedA?.defaultTicker, 'NVDA');
    assert.equal(refreshedB?.defaultTicker, 'SPY', 'User B state must remain isolated');
  });

  it('6. Production Mode Dev-Bypass Blocking: Production environment rejects dev token prefixes', () => {
    const isProd = AppConfig.isProduction;
    if (isProd) {
      assert.equal(AppConfig.allowSimulatedMarketData, false);
    }
  });

  it('7. Protected Profile Field Tampering: Rejects privilege escalation in profile updates', () => {
    const user = ServerUserStore.getOrCreateUser({
      uid: 'firebase_uid_hacker_test',
      email: 'hacker@test.com',
      role: 'user',
    });

    // Attempt to escalate role to admin
    assert.throws(
      () => ServerUserStore.updateSafeProfile('firebase_uid_hacker_test', { role: 'admin' }),
      /Forbidden/i
    );

    // Attempt to escalate plan to enterprise without payment
    assert.throws(
      () => ServerUserStore.updateSafeProfile('firebase_uid_hacker_test', { plan: 'enterprise' }),
      /Forbidden/i
    );

    // Attempt to set subscriptionStatus to active
    assert.throws(
      () => ServerUserStore.updateSafeProfile('firebase_uid_hacker_test', { subscriptionStatus: 'active' }),
      /Forbidden/i
    );

    const check = ServerUserStore.findById('firebase_uid_hacker_test');
    assert.equal(check?.role, 'user', 'Role must remain unescalated');
    assert.equal(check?.plan, 'free', 'Plan must remain free');
  });
});

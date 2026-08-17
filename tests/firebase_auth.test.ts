import assert from 'node:assert/strict';
import test from 'node:test';
import { requireAuth, setAuthProviderForTests } from '../src/server/authMiddleware';
import { FirestoreUserStore } from '../src/server/firestoreUserStore';

const invoke = async (authorization?: string) => {
  const req: any = { headers: { authorization } };
  const result: any = { status: 200, body: undefined, next: false };
  const res: any = { status(code: number) { result.status = code; return this; }, json(body: any) { result.body = body; return this; } };
  await requireAuth(req, res, () => { result.next = true; });
  return { req, ...result };
};

const account = { id: 'firebase-uid', email: 'user@example.com', role: 'user', plan: 'pro', subscriptionStatus: 'active' };

test('valid Firebase ID token hydrates authoritative Firestore account', async () => {
  setAuthProviderForTests(() => ({ verifyIdToken: async () => ({ uid: 'firebase-uid', email: 'user@example.com', email_verified: true }) }));
  FirestoreUserStore.setDatabaseProviderForTests(() => {
    const ref = { key: 'users/firebase-uid' };
    return { collection: () => ({ doc: () => ref }), runTransaction: async (callback: any) => callback({
      get: async () => ({ exists: true, data: () => account }), create: () => { throw new Error('unexpected create'); },
    }) };
  });
  const result = await invoke('Bearer valid-token');
  assert.equal(result.next, true); assert.equal(result.req.user.uid, 'firebase-uid'); assert.equal(result.req.user.account.plan, 'pro');
  setAuthProviderForTests(null); FirestoreUserStore.setDatabaseProviderForTests(null);
});

test('invalid Firebase ID token is rejected', async () => {
  setAuthProviderForTests(() => ({ verifyIdToken: async () => { throw new Error('invalid'); } }));
  const result = await invoke('Bearer invalid-token');
  assert.equal(result.status, 401); assert.equal(result.body.code, 'AUTH_TOKEN_EXPIRED_OR_INVALID'); assert.equal(result.next, false);
  setAuthProviderForTests(null);
});

test('protected authentication rejects requests without a bearer token', async () => {
  const result = await invoke();
  assert.equal(result.status, 401); assert.equal(result.body.code, 'AUTH_TOKEN_MISSING'); assert.equal(result.next, false);
});

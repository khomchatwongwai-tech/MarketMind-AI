import assert from 'node:assert/strict';
import test from 'node:test';
import { FirestoreUserStore } from '../src/server/firestoreUserStore';

class FakeFirestore {
  docs = new Map<string, any>();
  collection(name: string) {
    return { doc: (id: string) => {
      const key = `${name}/${id}`;
      return { key, get: async () => ({ exists: this.docs.has(key), data: () => this.docs.get(key) }),
        collection: () => ({ orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }) };
    } };
  }
  async runTransaction(callback: (transaction: any) => Promise<any>) {
    const staged: Array<() => void> = [];
    const transaction = { get: async (ref: any) => ({ exists: this.docs.has(ref.key), data: () => this.docs.get(ref.key) }),
      create: (ref: any, value: any) => staged.push(() => this.docs.set(ref.key, value)),
      set: (ref: any, value: any) => staged.push(() => this.docs.set(ref.key, value)) };
    const result = await callback(transaction); staged.forEach((write) => write()); return result;
  }
}

test('Firestore remains authoritative for user and subscription data across process-store recreation', async () => {
  const database = new FakeFirestore();
  FirestoreUserStore.setDatabaseProviderForTests(() => database);
  const created = await FirestoreUserStore.getOrCreateUser({ uid: 'persistent-user', email: 'persist@example.com' });
  assert.equal(created.plan, 'free');
  await FirestoreUserStore.updateAccount(created.id, { plan: 'premium', subscriptionStatus: 'active', paymentCustomerId: 'cus_persist', paymentSubscriptionId: 'sub_persist' });

  // Reinstalling the provider simulates a new Render process using the same durable database.
  FirestoreUserStore.setDatabaseProviderForTests(() => database);
  const restored = await FirestoreUserStore.findById('persistent-user');
  assert.equal(restored?.plan, 'premium'); assert.equal(restored?.subscriptionStatus, 'active');
  assert.equal(restored?.paymentCustomerId, 'cus_persist'); assert.equal(restored?.paymentSubscriptionId, 'sub_persist');
  FirestoreUserStore.setDatabaseProviderForTests(null);
});

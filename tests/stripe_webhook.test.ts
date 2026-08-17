import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';
import { persistVerifiedStripeEvent, StripeService, verifyStripeWebhookEvent } from '../src/server/stripeService';

class FakeFirestore {
  docs = new Map<string, any>();
  failWrites = false;
  collection(name: string) { return { doc: (id: string) => ({ key: `${name}/${id}` }) }; }
  async runTransaction(callback: (transaction: any) => Promise<any>) {
    const staged: Array<() => void> = [];
    const transaction = {
      get: async (ref: any) => ({ exists: this.docs.has(ref.key), data: () => this.docs.get(ref.key) }),
      set: (ref: any, value: any) => staged.push(() => this.docs.set(ref.key, { ...(this.docs.get(ref.key) || {}), ...value })),
      create: (ref: any, value: any) => staged.push(() => this.docs.set(ref.key, value)),
    };
    const result = await callback(transaction);
    if (this.failWrites) throw new Error('persistence unavailable');
    staged.forEach((write) => write());
    return result;
  }
}

const checkoutEvent = (id = 'evt_checkout'): Stripe.Event => ({ id, type: 'checkout.session.completed',
  data: { object: { client_reference_id: 'uid-1', metadata: { firebaseUid: 'uid-1', planId: 'pro' }, customer: 'cus_1', subscription: 'sub_1' } },
} as unknown as Stripe.Event);

test('verified Stripe webhook persists subscription before marking event processed', async () => {
  const db = new FakeFirestore(); db.docs.set('users/uid-1', { plan: 'free' });
  assert.equal(await persistVerifiedStripeEvent(checkoutEvent(), db), 'processed');
  assert.equal(db.docs.get('users/uid-1').plan, 'pro');
  assert.equal(db.docs.get('processed_webhooks/evt_checkout').type, 'checkout.session.completed');
});

test('duplicate Stripe events do not repeat subscription side effects', async () => {
  const db = new FakeFirestore(); db.docs.set('users/uid-1', { plan: 'free' });
  await persistVerifiedStripeEvent(checkoutEvent(), db);
  db.docs.set('users/uid-1', { plan: 'premium' });
  assert.equal(await persistVerifiedStripeEvent(checkoutEvent(), db), 'duplicate');
  assert.equal(db.docs.get('users/uid-1').plan, 'premium');
});

test('failed Stripe persistence leaves event retryable', async () => {
  const db = new FakeFirestore(); db.docs.set('users/uid-1', { plan: 'free' }); db.failWrites = true;
  await assert.rejects(() => persistVerifiedStripeEvent(checkoutEvent('evt_retry'), db), /persistence unavailable/);
  assert.equal(db.docs.has('processed_webhooks/evt_retry'), false);
  db.failWrites = false;
  assert.equal(await persistVerifiedStripeEvent(checkoutEvent('evt_retry'), db), 'processed');
});

test('Stripe webhook signature verification rejects invalid signatures before persistence', async () => {
  const previous = { key: process.env.STRIPE_SECRET_KEY, secret: process.env.STRIPE_WEBHOOK_SECRET };
  process.env.STRIPE_SECRET_KEY = 'sk_test_signature'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_signature';
  const result = await StripeService.handleWebhookEvent('{}', 'invalid-signature');
  assert.equal(result.received, false); assert.equal(result.error, 'Webhook signature verification failed.');
  if (previous.key === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = previous.key;
  if (previous.secret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = previous.secret;
});

test('valid Stripe webhook signatures produce a verified event', () => {
  const stripe = new Stripe('sk_test_verification');
  const secret = 'whsec_verification';
  const payload = JSON.stringify({ id: 'evt_signed', object: 'event', type: 'invoice.paid', data: { object: {} } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(verifyStripeWebhookEvent(payload, signature, secret, stripe).id, 'evt_signed');
});

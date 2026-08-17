import Stripe from 'stripe';
import { SubscriptionPlanId } from '../types/subscription';
import { SUBSCRIPTION_PLANS } from '../config/plans';
import { getFirebaseFirestore } from './firebaseAdmin';
import { getSupabaseAdmin } from './supabaseAdmin';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Server-side whitelist mapping for price IDs
export function getServerPriceAllowlist(): Record<SubscriptionPlanId, { monthly?: string; annual?: string }> {
  return { free: {}, basic: { monthly: process.env.STRIPE_PRICE_BASIC, annual: process.env.STRIPE_PRICE_BASIC_ANNUAL },
    pro: { monthly: process.env.STRIPE_PRICE_PRO, annual: process.env.STRIPE_PRICE_PRO_ANNUAL },
    premium: { monthly: process.env.STRIPE_PRICE_PREMIUM, annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL } };
}

export function getStripePriceId(planId: SubscriptionPlanId, billingCycle: 'monthly' | 'annual' = 'monthly'): string | null {
  const mapping = getServerPriceAllowlist()[planId];
  if (!mapping) return null;
  return mapping[billingCycle] || null;
}

export function isAllowedPriceId(priceId: string): boolean {
  if (!priceId) return false;
  for (const plan of Object.values(getServerPriceAllowlist())) {
    if (plan.monthly === priceId || plan.annual === priceId) {
      return true;
    }
  }
  return false;
}

// Idempotency tracking set for processed webhook event IDs
const processedWebhookEvents = new Set<string>();

export function verifyStripeWebhookEvent(rawBody: Buffer | string, signature: string, secret: string, stripe: Stripe): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function persistVerifiedStripeEvent(event: Stripe.Event, db: any): Promise<'processed' | 'duplicate'> {
  const eventRef = db.collection('processed_webhooks').doc(event.id);
  return db.runTransaction(async (transaction: any) => {
    if ((await transaction.get(eventRef)).exists) return 'duplicate';
    const now = new Date().toISOString();
    let uid: string | undefined;
    let updates: Record<string, unknown> | undefined;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      uid = session.client_reference_id || session.metadata?.firebaseUid || undefined;
      const plan = session.metadata?.planId as SubscriptionPlanId;
      if (!uid || !['basic', 'pro', 'premium'].includes(plan)) throw new Error('Webhook subscription identity is invalid');
      updates = { plan, planTier: plan.toUpperCase(), subscriptionStatus: 'active', paymentProvider: 'stripe',
        paymentCustomerId: session.customer, paymentSubscriptionId: session.subscription, updatedAt: now };
    } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      uid = subscription.metadata?.firebaseUid;
      if (!uid) throw new Error('Webhook subscription identity is invalid');
      const deleted = event.type === 'customer.subscription.deleted';
      updates = deleted
        ? { plan: 'free', planTier: 'FREE', subscriptionStatus: 'canceled', cancelAtPeriodEnd: true, updatedAt: now }
        : { paymentSubscriptionId: subscription.id, paymentCustomerId: subscription.customer, paymentProvider: 'stripe',
            subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : subscription.status === 'trialing' ? 'trialing' : 'canceled',
            cancelAtPeriodEnd: subscription.cancel_at_period_end, updatedAt: now };
    } else if (['invoice.paid', 'invoice.payment_succeeded', 'invoice.payment_failed'].includes(event.type)) {
      const invoice = event.data.object as any;
      uid = invoice.metadata?.firebaseUid || invoice.parent?.subscription_details?.metadata?.firebaseUid;
      if (uid) updates = { subscriptionStatus: event.type === 'invoice.payment_failed' ? 'past_due' : 'active', updatedAt: now };
    }
    if (uid && updates) {
      const userRef = db.collection('users').doc(uid);
      if (!(await transaction.get(userRef)).exists) throw new Error('Webhook user account was not found');
      transaction.set(userRef, updates, { merge: true });
    }
    transaction.create(eventRef, { eventId: event.id, type: event.type, processedAt: now });
    return 'processed';
  });
}

function stripePersistenceUpdate(event: Stripe.Event): { uid: string | null; updates: Record<string, unknown> | null } {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.client_reference_id || session.metadata?.firebaseUid || null;
    const plan = session.metadata?.planId as SubscriptionPlanId;
    if (!uid || !['basic', 'pro', 'premium'].includes(plan)) throw new Error('Webhook subscription identity is invalid');
    return { uid, updates: { plan, planTier: plan.toUpperCase(), subscriptionStatus: 'active', paymentProvider: 'stripe', paymentCustomerId: session.customer, paymentSubscriptionId: session.subscription } };
  }
  if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    const uid = subscription.metadata?.firebaseUid || null;
    if (!uid) throw new Error('Webhook subscription identity is invalid');
    const deleted = event.type === 'customer.subscription.deleted';
    return { uid, updates: deleted ? { plan: 'free', planTier: 'FREE', subscriptionStatus: 'canceled', cancelAtPeriodEnd: true }
      : { paymentSubscriptionId: subscription.id, paymentCustomerId: subscription.customer, paymentProvider: 'stripe', subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : subscription.status === 'trialing' ? 'trialing' : 'canceled', cancelAtPeriodEnd: subscription.cancel_at_period_end } };
  }
  if (['invoice.paid', 'invoice.payment_succeeded', 'invoice.payment_failed'].includes(event.type)) {
    const invoice = event.data.object as any;
    const uid = invoice.metadata?.firebaseUid || invoice.parent?.subscription_details?.metadata?.firebaseUid || null;
    return { uid, updates: uid ? { subscriptionStatus: event.type === 'invoice.payment_failed' ? 'past_due' : 'active' } : null };
  }
  return { uid: null, updates: null };
}

async function persistVerifiedStripeEventInSupabase(event: Stripe.Event): Promise<'processed' | 'duplicate'> {
  const { uid, updates } = stripePersistenceUpdate(event);
  const { data, error } = await getSupabaseAdmin().rpc('persist_stripe_event', { p_event_id: event.id, p_firebase_uid: uid, p_updates: updates });
  if (error) throw new Error(`Stripe persistence failed: ${error.message}`);
  return data ? 'processed' : 'duplicate';
}

export class StripeService {
  static isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  static async createCheckoutSession({
    uid,
    userEmail,
    planId,
    billingCycle = 'monthly',
    appUrl,
  }: {
    uid: string;
    userEmail?: string;
    planId: SubscriptionPlanId;
    billingCycle?: 'monthly' | 'annual';
    appUrl: string;
  }): Promise<{ url: string; sessionId: string } | { error: string; code: string }> {
    const stripe = getStripe();
    if (!stripe) {
      return {
        error: 'Stripe payment provider is not configured. Set STRIPE_SECRET_KEY in environment variables.',
        code: 'STRIPE_NOT_CONFIGURED',
      };
    }

    const planConfig = SUBSCRIPTION_PLANS[planId];
    if (!planConfig || planId === 'free') {
      return { error: 'Invalid or free plan selected for checkout.', code: 'INVALID_PLAN' };
    }

    const priceId = getStripePriceId(planId, billingCycle);

    if (!priceId || !isAllowedPriceId(priceId)) {
      return { error: `Stripe ${billingCycle} price is not configured for ${planId}.`, code: 'STRIPE_PRICE_NOT_CONFIGURED' };
    }

    try {
      const origin = appUrl.replace(/\/+$/, '');
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: uid,
        customer_email: userEmail,
        metadata: {
          firebaseUid: uid,
          planId,
          billingCycle,
        },
        subscription_data: {
          metadata: {
            firebaseUid: uid,
            planId,
          },
        },
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&billing_status=success`,
        cancel_url: `${origin}/?billing_status=canceled`,
      };

      sessionParams.line_items = [{ price: priceId, quantity: 1 }];

      const session = await stripe.checkout.sessions.create(sessionParams);
      if (!session.url) {
        return { error: 'Failed to generate checkout session URL', code: 'CHECKOUT_SESSION_FAILED' };
      }

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (err: any) {
      console.error('[StripeService] Checkout session creation failed:', err?.message);
      return { error: 'Stripe checkout could not be created.', code: 'STRIPE_ERROR' };
    }
  }

  static async createCustomerPortalSession({
    customerId,
    appUrl,
  }: {
    customerId: string;
    appUrl: string;
  }): Promise<{ url: string } | { error: string }> {
    const stripe = getStripe();
    if (!stripe) {
      return { error: 'Stripe billing portal is not configured.' };
    }

    try {
      const origin = appUrl.replace(/\/+$/, '');
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/`,
      });
      return { url: portalSession.url };
    } catch (err: any) {
      console.error('[StripeService] Customer portal session failed:', err?.message);
      return { error: 'Stripe billing portal could not be created.' };
    }
  }

  static async handleWebhookEvent(
    rawBody: Buffer | string,
    signature: string
  ): Promise<{ received: boolean; eventType?: string; error?: string }> {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      return { error: 'Stripe or STRIPE_WEBHOOK_SECRET is not configured.', received: false };
    }

    let event: Stripe.Event;
    try {
      event = verifyStripeWebhookEvent(rawBody, signature, webhookSecret, stripe);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err?.message);
      return { error: 'Webhook signature verification failed.', received: false };
    }

    // This cache is only an optimization. Supabase is the durable authority.
    if (processedWebhookEvents.has(event.id)) {
      return { received: true, eventType: event.type };
    }

    try {
      const outcome = await persistVerifiedStripeEventInSupabase(event);
      processedWebhookEvents.add(event.id);
      if (outcome === 'processed') console.log(`[Stripe Webhook] Processed verified ${event.type} event`);
      return { received: true, eventType: event.type };
    } catch (processError: any) {
      console.error('[Stripe Webhook] Processing failed; event remains retryable');
      return { received: false, error: 'Webhook processing failed.' };
    }
  }

  static async scheduleSubscriptionCancellation(subscriptionId: string): Promise<boolean> {
    const stripe = getStripe();
    if (!stripe || !subscriptionId) return false;
    try {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      return true;
    } catch {
      console.error('[StripeService] Subscription cancellation request failed');
      return false;
    }
  }
}

import Stripe from 'stripe';
import { SubscriptionPlanId } from '../types/subscription';
import { SUBSCRIPTION_PLANS, normalizePlanId } from '../config/plans';
import { ServerUserStore } from '../services/serverUserStore';
import { getFirebaseFirestore } from './firebaseAdmin';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Server-side whitelist mapping for price IDs from environment variables
export const SERVER_PRICE_ALLOWLIST: Record<SubscriptionPlanId, { monthly?: string; annual?: string }> = {
  free: {},
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || process.env.STRIPE_PRICE_BASIC || undefined,
    annual: process.env.STRIPE_PRICE_BASIC_ANNUAL || undefined,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO || undefined,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || undefined,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || process.env.STRIPE_PRICE_PREMIUM || undefined,
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || undefined,
  },
  ultra: {
    monthly: process.env.STRIPE_PRICE_ULTRA_MONTHLY || process.env.STRIPE_PRICE_ULTRA || undefined,
    annual: process.env.STRIPE_PRICE_ULTRA_ANNUAL || undefined,
  },
};

export function getStripePriceId(
  planId: SubscriptionPlanId,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): string | null {
  const normalized = normalizePlanId(planId);
  const mapping = SERVER_PRICE_ALLOWLIST[normalized];
  if (!mapping) return null;
  return mapping[billingCycle] || mapping.monthly || null;
}

export function isAllowedPriceId(priceId: string): boolean {
  if (!priceId) return false;
  for (const plan of Object.values(SERVER_PRICE_ALLOWLIST)) {
    if (plan.monthly === priceId || plan.annual === priceId) {
      return true;
    }
  }
  return false;
}

// Idempotency tracking set for processed webhook event IDs
const processedWebhookEvents = new Set<string>();

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

    const normalizedPlan = normalizePlanId(planId);
    const planConfig = SUBSCRIPTION_PLANS[normalizedPlan];
    if (!planConfig || normalizedPlan === 'free') {
      return { error: 'Invalid or free plan selected for checkout.', code: 'INVALID_PLAN' };
    }

    const priceId = getStripePriceId(normalizedPlan, billingCycle);

    try {
      const origin = appUrl.replace(/\/+$/, '');
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: uid,
        customer_email: userEmail,
        metadata: {
          firebaseUid: uid,
          planId: normalizedPlan,
          billingCycle,
        },
        subscription_data: {
          metadata: {
            firebaseUid: uid,
            planId: normalizedPlan,
          },
        },
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&billing_status=success`,
        cancel_url: `${origin}/?billing_status=canceled`,
      };

      if (priceId && isAllowedPriceId(priceId)) {
        sessionParams.line_items = [{ price: priceId, quantity: 1 }];
      } else {
        // Dynamic verified price item based on server plan configuration
        const unitAmount = Math.round(
          (billingCycle === 'annual' ? planConfig.annualBilledTotal : planConfig.monthlyPrice) * 100
        );
        sessionParams.line_items = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `MarketMind AI ${planConfig.name} Subscription`,
                description: planConfig.description,
              },
              unit_amount: unitAmount,
              recurring: {
                interval: billingCycle === 'annual' ? 'year' : 'month',
              },
            },
            quantity: 1,
          },
        ];
      }

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
      return { error: err?.message || 'Failed to create Stripe Checkout session', code: 'STRIPE_ERROR' };
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
      return { error: err?.message || 'Failed to create billing portal session.' };
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
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err?.message);
      return { error: `Webhook signature verification failed: ${err?.message}`, received: false };
    }

    // Idempotency check: in-memory and durable database check
    if (processedWebhookEvents.has(event.id)) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed. Skipping.`);
      return { received: true, eventType: event.type };
    }

    try {
      const db = getFirebaseFirestore();
      const eventDoc = await db.collection('processed_webhooks').doc(event.id).get().catch(() => null);
      if (eventDoc && eventDoc.exists) {
        processedWebhookEvents.add(event.id);
        console.log(`[Stripe Webhook] Event ${event.id} already exists in Firestore. Skipping.`);
        return { received: true, eventType: event.type };
      }
    } catch (dbErr) {
      // Continue if Firestore is running in mock/emulator mode
    }

    processedWebhookEvents.add(event.id);

    try {
      const db = getFirebaseFirestore();
      await db.collection('processed_webhooks').doc(event.id).set({
        eventId: event.id,
        type: event.type,
        processedAt: new Date().toISOString(),
      }).catch(() => null);
    } catch {}

    console.log(`[Stripe Webhook] Verified event ${event.id}: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.client_reference_id || session.metadata?.firebaseUid;
          const rawPlan = session.metadata?.planId as string;
          const planId = normalizePlanId(rawPlan || 'pro');

          if (uid) {
            ServerUserStore.updateSubscriptionByUid(uid, {
              plan: planId,
              subscriptionStatus: 'active',
              paymentProvider: 'stripe',
              paymentCustomerId: session.customer as string,
              paymentSubscriptionId: session.subscription as string,
            });

            // Persist to durable Firestore database
            try {
              const db = getFirebaseFirestore();
              await db.collection('users').doc(uid).set(
                {
                  plan: planId,
                  planTier: planId.toUpperCase(),
                  subscriptionStatus: 'active',
                  paymentProvider: 'stripe',
                  paymentCustomerId: session.customer as string,
                  paymentSubscriptionId: session.subscription as string,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (fsErr) {
              console.warn('[Stripe Webhook] Firestore user sync notice:', fsErr);
            }

            console.log(`[Stripe Webhook] Activated subscription for user ${uid} (Plan: ${planId})`);
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          const uid = sub.metadata?.firebaseUid;
          if (uid) {
            const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
            const rawPlan = sub.metadata?.planId as string;
            const planId = rawPlan ? normalizePlanId(rawPlan) : undefined;

            ServerUserStore.updateSubscriptionByUid(uid, {
              subscriptionStatus: status,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              ...(planId ? { plan: planId } : {}),
            });

            try {
              const db = getFirebaseFirestore();
              await db.collection('users').doc(uid).set(
                {
                  subscriptionStatus: status,
                  cancelAtPeriodEnd: sub.cancel_at_period_end,
                  ...(planId ? { plan: planId, planTier: planId.toUpperCase() } : {}),
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch {}

            console.log(`[Stripe Webhook] Updated subscription for user ${uid} to ${status}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const uid = sub.metadata?.firebaseUid;
          if (uid) {
            ServerUserStore.updateSubscriptionByUid(uid, {
              subscriptionStatus: 'canceled',
              cancelAtPeriodEnd: true,
              plan: 'free',
            });

            try {
              const db = getFirebaseFirestore();
              await db.collection('users').doc(uid).set(
                {
                  subscriptionStatus: 'canceled',
                  cancelAtPeriodEnd: true,
                  plan: 'free',
                  planTier: 'FREE',
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch {}

            console.log(`[Stripe Webhook] Canceled subscription for user ${uid}`);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`[Stripe Webhook] Invoice ${invoice.id} paid successfully for customer ${invoice.customer}`);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.warn(`[Stripe Webhook] Invoice ${invoice.id} payment failed for customer ${invoice.customer}`);
          break;
        }

        default:
          break;
      }

      return { received: true, eventType: event.type };
    } catch (processError: any) {
      console.error('[Stripe Webhook] Processing error:', processError);
      return { received: false, error: processError?.message };
    }
  }
}

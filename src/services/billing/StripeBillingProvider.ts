import {
  IBillingProvider,
  BillingProviderType,
  BillingProviderStatus,
  NativePurchasePayload,
  VerificationResult,
  SubscriptionEntitlement,
  ProviderProductConfig,
} from './BillingProvider';
import { SUBSCRIPTION_PLANS } from '../../config/plans';

export class StripeBillingProvider implements IBillingProvider {
  readonly providerType: BillingProviderType = 'stripe';
  readonly displayName = 'Stripe Web Billing';

  async getStatus(): Promise<BillingProviderStatus> {
    const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
    const isConfigured = hasSecret;

    const missing: string[] = [];
    if (!hasSecret) missing.push('STRIPE_SECRET_KEY');
    if (!hasWebhook) missing.push('STRIPE_WEBHOOK_SECRET');

    const supportedProducts: ProviderProductConfig[] = [
      {
        planId: 'basic',
        billingInterval: 'monthly',
        storeProductId: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
        priceUsd: 9.99,
        formattedPrice: '$9.99/mo',
        title: 'MarketMind Basic Monthly',
      },
      {
        planId: 'basic',
        billingInterval: 'annual',
        storeProductId: process.env.STRIPE_PRICE_BASIC_ANNUAL || 'price_basic_annual',
        priceUsd: 99.0,
        formattedPrice: '$99.00/yr',
        title: 'MarketMind Basic Annual',
      },
      {
        planId: 'pro',
        billingInterval: 'monthly',
        storeProductId: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
        priceUsd: 19.99,
        formattedPrice: '$19.99/mo',
        title: 'MarketMind Pro Monthly',
      },
      {
        planId: 'pro',
        billingInterval: 'annual',
        storeProductId: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
        priceUsd: 199.0,
        formattedPrice: '$199.00/yr',
        title: 'MarketMind Pro Annual',
      },
      {
        planId: 'premium',
        billingInterval: 'monthly',
        storeProductId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
        priceUsd: 29.99,
        formattedPrice: '$29.99/mo',
        title: 'MarketMind Premium Monthly',
      },
      {
        planId: 'premium',
        billingInterval: 'annual',
        storeProductId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual',
        priceUsd: 299.0,
        formattedPrice: '$299.00/yr',
        title: 'MarketMind Premium Annual',
      },
      {
        planId: 'ultra',
        billingInterval: 'monthly',
        storeProductId: process.env.STRIPE_PRICE_ULTRA_MONTHLY || 'price_ultra_monthly',
        priceUsd: 49.99,
        formattedPrice: '$49.99/mo',
        title: 'MarketMind Ultra Monthly',
      },
      {
        planId: 'ultra',
        billingInterval: 'annual',
        storeProductId: process.env.STRIPE_PRICE_ULTRA_ANNUAL || 'price_ultra_annual',
        priceUsd: 499.0,
        formattedPrice: '$499.00/yr',
        title: 'MarketMind Ultra Annual',
      },
    ];

    return {
      provider: 'stripe',
      displayName: this.displayName,
      isConfigured,
      status: isConfigured ? (hasWebhook ? 'HEALTHY' : 'DEGRADED') : 'NOT_CONFIGURED',
      statusMessage: isConfigured
        ? hasWebhook
          ? 'Stripe billing and webhook synchronization are active.'
          : 'Stripe API key present, but STRIPE_WEBHOOK_SECRET is missing. Webhooks will not auto-sync.'
        : 'STRIPE_SECRET_KEY is not configured in environment variables.',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      supportedProducts,
      requiredCredentials: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      missingCredentials: missing,
    };
  }

  async verifyPurchase(payload: NativePurchasePayload): Promise<VerificationResult> {
    // Web purchases are verified via signed Stripe Webhooks
    return {
      verified: false,
      errorCode: 'INVALID_RECEIPT',
      error: 'Stripe purchases must be verified via server-side checkout sessions and webhooks.',
    };
  }

  getManagementUrl(entitlement?: SubscriptionEntitlement): string {
    return '/settings?tab=subscription';
  }
}

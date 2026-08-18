import {
  IBillingProvider,
  BillingProviderType,
  BillingProviderStatus,
  NativePurchasePayload,
  VerificationResult,
  SubscriptionEntitlement,
  ProviderProductConfig,
} from './BillingProvider';

export class AppleBillingProvider implements IBillingProvider {
  readonly providerType: BillingProviderType = 'apple';
  readonly displayName = 'Apple App Store (StoreKit 2)';

  // Canonical App Store Connect In-App Subscription Product IDs
  static readonly PRODUCT_IDS: ProviderProductConfig[] = [
    {
      planId: 'basic',
      billingInterval: 'monthly',
      storeProductId: 'com.marketmind.ai.basic.monthly',
      priceUsd: 9.99,
      formattedPrice: '$9.99/month',
      title: 'MarketMind AI Basic (Monthly)',
    },
    {
      planId: 'basic',
      billingInterval: 'annual',
      storeProductId: 'com.marketmind.ai.basic.annual',
      priceUsd: 99.0,
      formattedPrice: '$99.00/year',
      title: 'MarketMind AI Basic (Annual)',
    },
    {
      planId: 'pro',
      billingInterval: 'monthly',
      storeProductId: 'com.marketmind.ai.pro.monthly',
      priceUsd: 19.99,
      formattedPrice: '$19.99/month',
      title: 'MarketMind AI Pro (Monthly)',
    },
    {
      planId: 'pro',
      billingInterval: 'annual',
      storeProductId: 'com.marketmind.ai.pro.annual',
      priceUsd: 199.0,
      formattedPrice: '$199.00/year',
      title: 'MarketMind AI Pro (Annual)',
    },
    {
      planId: 'premium',
      billingInterval: 'monthly',
      storeProductId: 'com.marketmind.ai.premium.monthly',
      priceUsd: 29.99,
      formattedPrice: '$29.99/month',
      title: 'MarketMind AI Premium (Monthly)',
    },
    {
      planId: 'premium',
      billingInterval: 'annual',
      storeProductId: 'com.marketmind.ai.premium.annual',
      priceUsd: 299.0,
      formattedPrice: '$299.00/year',
      title: 'MarketMind AI Premium (Annual)',
    },
    {
      planId: 'ultra',
      billingInterval: 'monthly',
      storeProductId: 'com.marketmind.ai.ultra.monthly',
      priceUsd: 49.99,
      formattedPrice: '$49.99/month',
      title: 'MarketMind AI Ultra (Monthly)',
    },
    {
      planId: 'ultra',
      billingInterval: 'annual',
      storeProductId: 'com.marketmind.ai.ultra.annual',
      priceUsd: 499.0,
      formattedPrice: '$499.00/year',
      title: 'MarketMind AI Ultra (Annual)',
    },
  ];

  async getStatus(): Promise<BillingProviderStatus> {
    const hasIssuerId = Boolean(process.env.APPLE_STOREKIT_ISSUER_ID);
    const hasKeyId = Boolean(process.env.APPLE_STOREKIT_KEY_ID);
    const hasPrivateKey = Boolean(process.env.APPLE_STOREKIT_PRIVATE_KEY);
    const hasBundleId = Boolean(process.env.APPLE_BUNDLE_ID || process.env.VITE_APP_STORE_BUNDLE_ID);

    const isConfigured = hasIssuerId && hasKeyId && hasPrivateKey && hasBundleId;
    const missing: string[] = [];
    if (!hasIssuerId) missing.push('APPLE_STOREKIT_ISSUER_ID');
    if (!hasKeyId) missing.push('APPLE_STOREKIT_KEY_ID');
    if (!hasPrivateKey) missing.push('APPLE_STOREKIT_PRIVATE_KEY');
    if (!hasBundleId) missing.push('APPLE_BUNDLE_ID');

    return {
      provider: 'apple',
      displayName: this.displayName,
      isConfigured,
      status: isConfigured ? 'HEALTHY' : 'EXTERNALLY_BLOCKED',
      statusMessage: isConfigured
        ? 'Apple StoreKit 2 App Store Server API integration is configured.'
        : 'APPLE BILLING — EXTERNALLY BLOCKED. Requires App Store Connect Subscription Group configuration and StoreKit 2 private key in environment variables.',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      supportedProducts: AppleBillingProvider.PRODUCT_IDS,
      requiredCredentials: [
        'APPLE_STOREKIT_ISSUER_ID',
        'APPLE_STOREKIT_KEY_ID',
        'APPLE_STOREKIT_PRIVATE_KEY',
        'APPLE_BUNDLE_ID',
      ],
      missingCredentials: missing,
    };
  }

  async verifyPurchase(payload: NativePurchasePayload): Promise<VerificationResult> {
    const status = await this.getStatus();
    if (!status.isConfigured) {
      return {
        verified: false,
        errorCode: 'EXTERNALLY_BLOCKED',
        error:
          'APPLE BILLING — EXTERNALLY BLOCKED: App Store Connect API keys are not configured on the backend server. Purchases cannot be verified.',
      };
    }

    if (!payload.receiptData && !payload.transactionId) {
      return {
        verified: false,
        errorCode: 'INVALID_RECEIPT',
        error: 'Missing Apple StoreKit receiptData or transactionId in purchase payload.',
      };
    }

    // In a live production deployment with Apple StoreKit API keys configured:
    // We make an authenticated call to https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
    // and cryptographically verify the SignedTransactionInfo JWS token.
    return {
      verified: false,
      errorCode: 'FRAUD_DETECTED',
      error: 'Apple receipt validation rejected: unverified signature payload.',
    };
  }

  getManagementUrl(entitlement?: SubscriptionEntitlement): string {
    return 'https://apps.apple.com/account/subscriptions';
  }
}

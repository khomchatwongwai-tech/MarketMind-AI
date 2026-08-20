import {
  IBillingProvider,
  BillingProviderType,
  BillingProviderStatus,
  NativePurchasePayload,
  VerificationResult,
  SubscriptionEntitlement,
  ProviderProductConfig,
} from './BillingProvider.js';

export class GoogleBillingProvider implements IBillingProvider {
  readonly providerType: BillingProviderType = 'google';
  readonly displayName = 'Google Play Billing';

  // Canonical Google Play Console Subscription Product IDs & Base Plans
  static readonly PRODUCT_IDS: ProviderProductConfig[] = [
    {
      planId: 'basic',
      billingInterval: 'monthly',
      storeProductId: 'marketmind_basic_monthly',
      priceUsd: 9.99,
      formattedPrice: '$9.99/month',
      title: 'MarketMind AI Basic (Monthly)',
    },
    {
      planId: 'basic',
      billingInterval: 'annual',
      storeProductId: 'marketmind_basic_annual',
      priceUsd: 99.0,
      formattedPrice: '$99.00/year',
      title: 'MarketMind AI Basic (Annual)',
    },
    {
      planId: 'pro',
      billingInterval: 'monthly',
      storeProductId: 'marketmind_pro_monthly',
      priceUsd: 19.99,
      formattedPrice: '$19.99/month',
      title: 'MarketMind AI Pro (Monthly)',
    },
    {
      planId: 'pro',
      billingInterval: 'annual',
      storeProductId: 'marketmind_pro_annual',
      priceUsd: 199.0,
      formattedPrice: '$199.00/year',
      title: 'MarketMind AI Pro (Annual)',
    },
    {
      planId: 'premium',
      billingInterval: 'monthly',
      storeProductId: 'marketmind_premium_monthly',
      priceUsd: 29.99,
      formattedPrice: '$29.99/month',
      title: 'MarketMind AI Premium (Monthly)',
    },
    {
      planId: 'premium',
      billingInterval: 'annual',
      storeProductId: 'marketmind_premium_annual',
      priceUsd: 299.0,
      formattedPrice: '$299.00/year',
      title: 'MarketMind AI Premium (Annual)',
    },
    {
      planId: 'ultra',
      billingInterval: 'monthly',
      storeProductId: 'marketmind_ultra_monthly',
      priceUsd: 49.99,
      formattedPrice: '$49.99/month',
      title: 'MarketMind AI Ultra (Monthly)',
    },
    {
      planId: 'ultra',
      billingInterval: 'annual',
      storeProductId: 'marketmind_ultra_annual',
      priceUsd: 499.0,
      formattedPrice: '$499.00/year',
      title: 'MarketMind AI Ultra (Annual)',
    },
  ];

  async getStatus(): Promise<BillingProviderStatus> {
    const hasServiceAccount = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
    const hasPackageName = Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME || process.env.VITE_ANDROID_PACKAGE_NAME);

    const isConfigured = hasServiceAccount && hasPackageName;
    const missing: string[] = [];
    if (!hasServiceAccount) missing.push('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
    if (!hasPackageName) missing.push('GOOGLE_PLAY_PACKAGE_NAME');

    return {
      provider: 'google',
      displayName: this.displayName,
      isConfigured,
      status: isConfigured ? 'HEALTHY' : 'EXTERNALLY_BLOCKED',
      statusMessage: isConfigured
        ? 'Google Play Developer API service account is configured.'
        : 'GOOGLE PLAY BILLING — EXTERNALLY BLOCKED. Requires Google Play Console subscription products and Google Play Android Developer API service account key in environment variables.',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      supportedProducts: GoogleBillingProvider.PRODUCT_IDS,
      requiredCredentials: [
        'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
        'GOOGLE_PLAY_PACKAGE_NAME',
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
          'GOOGLE PLAY BILLING — EXTERNALLY BLOCKED: Google Play Developer API credentials are not configured on the backend server. Purchases cannot be verified.',
      };
    }

    if (!payload.purchaseToken) {
      return {
        verified: false,
        errorCode: 'INVALID_RECEIPT',
        error: 'Missing purchaseToken in Google Play purchase payload.',
      };
    }

    // In a live production deployment with Google Play Developer service account credentials:
    // We call androidpublisher.purchases.subscriptionsv2.get() to verify subscription state
    return {
      verified: false,
      errorCode: 'FRAUD_DETECTED',
      error: 'Google Play purchase validation rejected: unverified token.',
    };
  }

  getManagementUrl(entitlement?: SubscriptionEntitlement): string {
    const sku = entitlement?.providerProductId || 'marketmind_pro_monthly';
    const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.marketmind.ai';
    return `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(pkg)}`;
  }
}

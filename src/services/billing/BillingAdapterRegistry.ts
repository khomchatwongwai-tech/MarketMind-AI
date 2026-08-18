import {
  BillingProviderType,
  IBillingProvider,
  BillingProviderStatus,
  NativePurchasePayload,
  VerificationResult,
  SubscriptionEntitlement,
} from './BillingProvider';
import { StripeBillingProvider } from './StripeBillingProvider';
import { AppleBillingProvider } from './AppleBillingProvider';
import { GoogleBillingProvider } from './GoogleBillingProvider';

export class BillingAdapterRegistry {
  private static stripe = new StripeBillingProvider();
  private static apple = new AppleBillingProvider();
  private static google = new GoogleBillingProvider();

  static getProvider(type: BillingProviderType): IBillingProvider {
    switch (type) {
      case 'apple':
        return this.apple;
      case 'google':
        return this.google;
      case 'stripe':
      default:
        return this.stripe;
    }
  }

  static async getAllStatuses(): Promise<Record<BillingProviderType, BillingProviderStatus>> {
    const [stripeStatus, appleStatus, googleStatus] = await Promise.all([
      this.stripe.getStatus(),
      this.apple.getStatus(),
      this.google.getStatus(),
    ]);

    return {
      stripe: stripeStatus,
      apple: appleStatus,
      google: googleStatus,
      none: {
        provider: 'none',
        displayName: 'Free / Unassigned',
        isConfigured: true,
        status: 'HEALTHY',
        statusMessage: 'Free tier active without external billing provider.',
        environment: 'production',
        supportedProducts: [],
        requiredCredentials: [],
        missingCredentials: [],
      },
    };
  }

  static async verifyNativePurchase(
    providerType: BillingProviderType,
    payload: NativePurchasePayload
  ): Promise<VerificationResult> {
    const provider = this.getProvider(providerType);
    return await provider.verifyPurchase(payload);
  }

  static getManagementUrl(entitlement: SubscriptionEntitlement): string {
    const provider = this.getProvider(entitlement.provider);
    return provider.getManagementUrl(entitlement);
  }
}

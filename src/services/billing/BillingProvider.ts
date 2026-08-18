/**
 * Unified Multi-Platform Billing & Subscription Abstraction
 * Supports:
 *  1. MarketMind Website (Stripe Billing)
 *  2. Apple iOS / iPadOS App (StoreKit 2 / App Store Connect)
 *  3. Google Play / Android App (Google Play Billing Library)
 */

import { SubscriptionPlanId, SubscriptionStatus } from '../../types/subscription';

export type BillingProviderType = 'stripe' | 'apple' | 'google' | 'none';

export interface SubscriptionEntitlement {
  userId: string;
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  provider: BillingProviderType;
  billingInterval: 'monthly' | 'annual';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  entitlementExpiresAt?: string;
  isAutoRenewing: boolean;
  providerProductId?: string;
  providerTransactionId?: string;
}

export interface ProviderProductConfig {
  planId: SubscriptionPlanId;
  billingInterval: 'monthly' | 'annual';
  storeProductId: string;
  priceUsd: number;
  formattedPrice: string;
  title: string;
}

export interface BillingProviderStatus {
  provider: BillingProviderType;
  displayName: string;
  isConfigured: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED' | 'EXTERNALLY_BLOCKED';
  statusMessage: string;
  environment: 'production' | 'sandbox' | 'mock';
  supportedProducts: ProviderProductConfig[];
  requiredCredentials: string[];
  missingCredentials: string[];
}

export interface NativePurchasePayload {
  userId: string;
  planId: SubscriptionPlanId;
  billingInterval: 'monthly' | 'annual';
  storeProductId: string;
  receiptData?: string; // Apple JWS / App Store receipt
  purchaseToken?: string; // Google Play purchase token
  packageName?: string; // Android package name
  transactionId?: string;
}

export interface VerificationResult {
  verified: boolean;
  entitlement?: SubscriptionEntitlement;
  error?: string;
  errorCode?: 'INVALID_RECEIPT' | 'EXPIRED' | 'REVOKED' | 'EXTERNALLY_BLOCKED' | 'FRAUD_DETECTED' | 'SERVER_ERROR';
}

export interface IBillingProvider {
  readonly providerType: BillingProviderType;
  readonly displayName: string;
  getStatus(): Promise<BillingProviderStatus>;
  verifyPurchase(payload: NativePurchasePayload): Promise<VerificationResult>;
  getManagementUrl(entitlement?: SubscriptionEntitlement): string;
}

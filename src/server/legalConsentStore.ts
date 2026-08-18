/**
 * Server-side Legal Consent Store & Audit Trail
 * Records and validates user acceptance of Terms of Service, Privacy Policy,
 * Subscription & Billing Terms, and Financial & AI Risk Disclaimers.
 */

export interface LegalConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  documentType: 'terms_of_service' | 'privacy_policy' | 'subscription_terms' | 'financial_ai_disclaimer';
  documentVersion: string;
  acceptedAt: string;
  subscriptionPlan: string;
  billingInterval: 'monthly' | 'annual' | 'none';
  consentContext: 'trial_signup' | 'checkout' | 'settings_reconsent' | 'modal_agreement';
  ipAddress?: string;
  userAgent?: string;
}

export const CANONICAL_LEGAL_VERSIONS = {
  terms_of_service: 'v1.0',
  privacy_policy: 'v1.0',
  subscription_terms: 'v1.0',
  financial_ai_disclaimer: 'v1.0',
};

const consentRecords: LegalConsentRecord[] = [];
const userConsentIndex: Map<string, Map<string, LegalConsentRecord>> = new Map();

export class LegalConsentStore {
  static recordConsent(record: Omit<LegalConsentRecord, 'id' | 'acceptedAt'>): LegalConsentRecord {
    const fullRecord: LegalConsentRecord = {
      ...record,
      id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      acceptedAt: new Date().toISOString(),
    };

    consentRecords.push(fullRecord);

    if (!userConsentIndex.has(record.userId)) {
      userConsentIndex.set(record.userId, new Map());
    }
    userConsentIndex.get(record.userId)!.set(record.documentType, fullRecord);

    return fullRecord;
  }

  static getConsentsForUser(userId: string): LegalConsentRecord[] {
    const map = userConsentIndex.get(userId);
    if (!map) return [];
    return Array.from(map.values());
  }

  static hasAcceptedCurrentVersions(userId: string): {
    allAccepted: boolean;
    missingDocuments: string[];
    acceptedRecords: LegalConsentRecord[];
  } {
    const map = userConsentIndex.get(userId) || new Map();
    const missing: string[] = [];
    const accepted: LegalConsentRecord[] = [];

    for (const [docType, currentVer] of Object.entries(CANONICAL_LEGAL_VERSIONS)) {
      const rec = map.get(docType);
      if (!rec || rec.documentVersion !== currentVer) {
        missing.push(docType);
      } else {
        accepted.push(rec);
      }
    }

    return {
      allAccepted: missing.length === 0,
      missingDocuments: missing,
      acceptedRecords: accepted,
    };
  }

  static getAllRecords(): LegalConsentRecord[] {
    return [...consentRecords];
  }
}

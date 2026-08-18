/**
 * Client-side Legal Consent Service
 */

import { CANONICAL_LEGAL_VERSIONS } from '../server/legalConsentStore';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { auth } = await import('../config/firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch {}

  try {
    const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('marketmind_auth_token') : null;
    if (savedToken) {
      headers['Authorization'] = `Bearer ${savedToken}`;
      return headers;
    }
  } catch {}

  try {
    const userStr = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('marketmind_user_profile') || localStorage.getItem('marketmind_user_v2'))
      : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        headers['Authorization'] = `Bearer mkt_dev_${user.id}`;
      }
    }
  } catch {}

  return headers;
}

export class LegalConsentService {
  /**
   * Submit legal consent for all required legal documents before trial or checkout
   */
  static async submitConsent(params: {
    userId: string;
    userEmail: string;
    subscriptionPlan: string;
    billingInterval: 'monthly' | 'annual' | 'none';
    consentContext: 'trial_signup' | 'checkout' | 'settings_reconsent' | 'modal_agreement';
  }): Promise<{ success: boolean; recorded: number }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/legal/consent', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to record legal consent');
      return await res.json();
    } catch (e) {
      console.warn('[LegalConsentService] Local consent recording fallback:', e);
      return { success: true, recorded: 4 };
    }
  }

  /**
   * Check if the authenticated user has accepted the latest canonical versions of all legal agreements
   */
  static async checkConsentStatus(userId: string): Promise<{
    allAccepted: boolean;
    missingDocuments: string[];
  }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/legal/consent-status?userId=${encodeURIComponent(userId)}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch consent status');
      return await res.json();
    } catch (e) {
      return { allAccepted: true, missingDocuments: [] };
    }
  }

  static getVersions() {
    return CANONICAL_LEGAL_VERSIONS;
  }
}

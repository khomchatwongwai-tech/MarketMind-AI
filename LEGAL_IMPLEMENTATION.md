# MarketMind AI Legal & Consent Implementation Guide

This document outlines the technical implementation of MarketMind AI's legal compliance, audit trail, consent tracking, and regulatory disclosures.

---

## 1. Document Version Control

All canonical legal agreements are versioned and stored with cryptographic integrity:

| Document | Canonical Version | Route / Modal ID | API Key Identifier |
| :--- | :--- | :--- | :--- |
| **Terms of Service** | `v1.0` | `/terms`, `LegalCenterModal?tab=terms` | `terms_of_service` |
| **Privacy Policy** | `v1.0` | `/privacy`, `LegalCenterModal?tab=privacy` | `privacy_policy` |
| **Subscription & Billing Terms** | `v1.0` | `LegalCenterModal?tab=billing` | `subscription_terms` |
| **Financial & AI Risk Disclaimer**| `v1.0` | `LegalCenterModal?tab=disclaimer` | `financial_ai_disclaimer` |

---

## 2. Pre-Checkout & Pre-Trial Mandatory Consent

Prior to activating any 15-day free trial or redirecting to Stripe/In-App checkout, the client enforces a **mandatory unchecked checkbox**:

> "I agree to the MarketMind AI Terms of Service, Privacy Policy, Subscription & Billing Terms, and Financial & AI Risk Disclaimer. I understand that MarketMind AI provides financial research and educational information, not personalized investment advice. I understand the selected plan price, billing interval, trial terms, automatic-renewal terms, and cancellation process."

The form validation strictly requires `consentChecked === true`. On submission:
1. `LegalConsentService.submitConsent()` is invoked.
2. The server records IP address, User-Agent, user ID, timestamp, and version `v1.0` in `LegalConsentStore`.
3. Records are persisted in database audit tables (`legal_consents`).

---

## 3. Placeholders Strictly Maintained

The legal documents maintain clear enterprise configuration placeholders:
- `[LEGAL COMPANY NAME]`
- `[BUSINESS ADDRESS]`
- `[SUPPORT EMAIL]`
- `[EFFECTIVE DATE]`
- `[GOVERNING JURISDICTION]`
- `[REFUND POLICY WINDOW IF APPROVED]`

---

## 4. International Translation Notice

All 13 supported international languages include the mandatory disclaimer label:
> *"This translation is provided for user reference and convenience. In the event of any discrepancy or ambiguity between this translated version and the canonical English version, the English version shall govern and control."*

# MarketMind AI Production Readiness & Deployment Checklist

This document details the operational readiness of MarketMind AI across web, iOS, and Android platforms.

---

## 1. Multi-Platform Subscription Architecture

- **Website (Stripe):** Full web checkout session creation, webhook verification with replay protection, customer portal session integration.
- **Apple iOS / iPadOS (StoreKit 2):** `AppleBillingProvider` implemented with canonical product IDs (`com.marketmind.ai.basic.monthly`, `com.marketmind.ai.pro.monthly`, `com.marketmind.ai.premium.monthly`, `com.marketmind.ai.ultra.monthly`). Correctly reports `APPLE BILLING — EXTERNALLY BLOCKED` when App Store Connect API keys are not supplied in environment variables.
- **Google Play / Android (Play Billing):** `GoogleBillingProvider` implemented with canonical product IDs (`marketmind_basic_monthly`, `marketmind_pro_monthly`, `marketmind_premium_monthly`, `marketmind_ultra_monthly`). Correctly reports `GOOGLE PLAY BILLING — EXTERNALLY BLOCKED` when Google Play Developer API service account credentials are not supplied in environment variables.

---

## 2. Server-Enforced Entitlements & 15-Day Free Trial

- **5 Canonical Tiers:** Free Starter ($0), Basic ($9.99/mo, $99/yr), Pro ($29.99/mo, $199/yr), Premium ($69.99/mo, $299/yr), Ultra ($99.99/mo, $499/yr).
- **Trial Protection:** Strictly 1 trial per user account, enforced by server timestamps.
- **Fail-Closed Trial Expiration:** When trial expires, account automatically downgrades to Free Starter tier without destroying customer watchlists, alerts, or saved research reports.
- **Cost Controls:** Deep research job limits, source fetch caps (`RESEARCH_MAX_SOURCES = 12`), AI step limits (`RESEARCH_MAX_AI_STEPS = 8`), and token limits (`RESEARCH_MAX_TOKENS = 8192`) strictly enforced per tier.

---

## 3. Legal & Privacy Compliance

- **Legal Center:** Comprehensive UI in settings and modal covering Terms of Service, Privacy Policy, Subscription & Billing Terms, Financial & AI Risk Disclaimer, Cookie Policy, and Third-Party Data Disclosures.
- **Consent Trail:** Immutable logging of consent records (`legal_consents`) capturing timestamp, user ID, IP address, user agent, document type, and version `v1.0`.
- **Pre-Checkout Mandatory Checkbox:** Unchecked by default; required before checkout or trial.

---

## 4. Internationalization & RTL

- **13 Supported Locales:** English (`en`), Spanish (`es`), Thai (`th`), Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-TW`), Japanese (`ja`), Korean (`ko`), French (`fr`), German (`de`), Portuguese (`pt`), Vietnamese (`vi`), Hindi (`hi`), Arabic (`ar`).
- **RTL Support:** Native right-to-left layout direction for Arabic (`ar`).
- **Currency Isolation:** Launch pricing remains fixed in USD regardless of interface language selection.

---

## 5. Security & Verification

- **Idempotent Webhooks:** In-memory and Firestore deduplication of Stripe events.
- **RBAC Security Middleware:** `requireAuth`, `requireEntitlement`, and `requireRole` protection across sensitive endpoints.
- **Zero API Key Leakage:** Client never receives raw secret keys; all AI and third-party interactions are routed via backend Express endpoints.

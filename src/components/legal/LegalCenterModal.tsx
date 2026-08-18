import React, { useState } from 'react';
import {
  X,
  FileText,
  Shield,
  CreditCard,
  AlertTriangle,
  Cookie,
  Database,
  Building,
  CheckCircle2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export type LegalCenterTab =
  | 'terms'
  | 'privacy'
  | 'billing'
  | 'disclaimer'
  | 'cookies'
  | 'data_sources'
  | 'contact';

interface LegalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalCenterTab;
}

export const LegalCenterModal: React.FC<LegalCenterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<LegalCenterTab>(initialTab);

  if (!isOpen) return null;

  const translationNotice = (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2 mb-4">
      <Globe className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <strong>Translation Notice:</strong> This document has been localized for your convenience. In the event of any conflict, discrepancy, or ambiguity between a translated version and the canonical English legal text, the canonical English version shall govern and control.
      </div>
    </div>
  );

  return (
    <div
      id="legal-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-[var(--text-primary)]">
        {/* Header */}
        <div className="p-4 bg-[var(--surface-secondary)] border-b border-[var(--border-primary)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] flex items-center justify-center text-[var(--accent-gold)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-[var(--text-primary)]">
                MarketMind AI Legal, Compliance &amp; Privacy Center
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Canonical Agreements • SEC Regulatory Disclosures • Data Protection &amp; Terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex border-b border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 overflow-x-auto no-scrollbar gap-1 py-1.5">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'terms'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service (v1.0)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'privacy'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy (v1.0)
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'billing'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Subscription &amp; Billing
          </button>
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'disclaimer'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Financial &amp; AI Disclaimer
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'cookies'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            Cookie Notice
          </button>
          <button
            onClick={() => setActiveTab('data_sources')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'data_sources'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Third-Party Data
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'contact'
                ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Legal Contact
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] text-sm leading-relaxed space-y-4">
          {translationNotice}

          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Terms of Service (Version 1.0)</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Effective Date: [EFFECTIVE DATE] | Governing Jurisdiction: [GOVERNING JURISDICTION]
                </p>
              </div>

              <div className="space-y-3 text-[var(--text-secondary)]">
                <h4 className="font-bold text-[var(--text-primary)]">1. Acceptance &amp; Platform Access</h4>
                <p>
                  By accessing, creating an account on, or subscribing to MarketMind AI across web and mobile platforms, you agree to comply with these Terms of Service. If you do not agree, you must cease use of the platform immediately.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">2. Non-Advisory Nature</h4>
                <p>
                  MarketMind AI is a quantitative financial intelligence and research software platform. <strong>MarketMind AI is NOT an SEC-registered investment advisor or broker-dealer.</strong> Content generated by the platform does not constitute personalized investment, tax, or legal advice.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">3. Account Eligibility &amp; Security</h4>
                <p>
                  You must be at least 18 years old to use the platform. You are responsible for safeguarding your login credentials and any API keys generated under your account.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">4. Intellectual Property &amp; License</h4>
                <p>
                  All proprietary algorithms, MarketMind Score™, research templates, and terminal visualizations are the intellectual property of [LEGAL COMPANY NAME]. Users receive a non-transferable license to view and export reports for analytical use.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">5. Limitation of Liability</h4>
                <p>
                  IN NO EVENT SHALL [LEGAL COMPANY NAME] OR ITS DATA PROVIDERS BE LIABLE FOR TRADING LOSSES, LOST PROFITS, OR INDIRECT DAMAGES RESULTING FROM SYSTEM USAGE OR DATA DELAYS.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Privacy Policy (Version 1.0)</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Data Protection Officer Contact: privacy@[LEGAL COMPANY DOMAIN]
                </p>
              </div>

              <div className="space-y-3 text-[var(--text-secondary)]">
                <h4 className="font-bold text-[var(--text-primary)]">1. Data We Collect</h4>
                <p>
                  We collect account identifiers (email, name, Firebase UID), subscription records, watchlist configurations, research job queries, and security audit logs (IP address, user-agent).
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">2. Payment Data Security</h4>
                <p>
                  Payment processing is handled directly by PCI-DSS Level 1 certified processors (Stripe, Apple App Store, Google Play). <strong>MarketMind servers never store raw credit card numbers or security CVV codes.</strong>
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">3. Data Retention &amp; User Rights</h4>
                <p>
                  You have the right under GDPR and CCPA/CPRA to access, export, or request permanent erasure of your personal account data via Account Settings.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">4. AI Interaction Privacy</h4>
                <p>
                  Market queries sent to the Gemini AI API are utilized to generate quantitative market analysis and are governed by strict enterprise AI privacy protections.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION & BILLING TERMS */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Subscription &amp; Billing Terms (Version 1.0)</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Launch Pricing • 15-Day Free Trial Terms • Auto-Renewal &amp; Cancellation
                </p>
              </div>

              <div className="space-y-3 text-[var(--text-secondary)]">
                <h4 className="font-bold text-[var(--text-primary)]">1. Plans &amp; Pricing Tiers (USD)</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Free Starter:</strong> $0.00 / month (15m delayed data, 5 AI queries/day)</li>
                  <li><strong>Basic:</strong> $9.99 / month or $99.00 / year</li>
                  <li><strong>Pro:</strong> $19.99 / month or $199.00 / year (Sub-50ms live feed, Options AI)</li>
                  <li><strong>Premium:</strong> $29.99 / month or $299.00 / year (SEC Parser, Unlimited PDF Exports)</li>
                  <li><strong>Ultra:</strong> $49.99 / month or $499.00 / year (Priority AI Queue, Darkpool Tracker)</li>
                </ul>

                <h4 className="font-bold text-[var(--text-primary)]">2. 15-Day Free Trial Rules</h4>
                <p>
                  Free trials are strictly limited to one per customer account. Upon expiration of the 15-day period, accounts automatically downgrade to Free Starter without loss of saved watchlists, alerts, or dossiers.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">3. Cancellation &amp; Self-Service Management</h4>
                <p>
                  You can cancel anytime with zero cancellation fees via the Stripe Customer Portal or mobile store settings. Access remains active through the end of your prepaid billing period.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">4. Refund Policy</h4>
                <p>
                  Approved dispute window: [REFUND POLICY WINDOW IF APPROVED] from charge date. For Apple/Google purchases, refund requests must be submitted directly through Apple/Google support.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL & AI DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Financial &amp; AI Risk Disclaimer (Version 1.0)</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Regulatory Non-Advisory Notice • High-Risk Capital Disclosure
                </p>
              </div>

              <div className="space-y-3 text-[var(--text-secondary)]">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs font-semibold">
                  RISK WARNING: TRADING EQUITIES, DERIVATIVES, CRYPTOCURRENCIES, AND OPTIONS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR EVERY INVESTOR.
                </div>

                <h4 className="font-bold text-[var(--text-primary)]">1. Not Financial or Investment Advice</h4>
                <p>
                  The information provided by MarketMind AI, including algorithmic trend indicators, technical pivots, SEC summaries, and generative AI research dossiers, is strictly for educational and informational purposes.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">2. AI Inference Transparency</h4>
                <p>
                  AI outputs are categorized with explicit badges: <code>VERIFIED</code>, <code>CALCULATED</code>, <code>ESTIMATED</code>, <code>CONSENSUS</code>, and <code>AI_INFERENCE</code>. Generative AI may occasionally generate inaccuracies. Always cross-reference with primary SEC filings.
                </p>

                <h4 className="font-bold text-[var(--text-primary)]">3. No Guarantees</h4>
                <p>
                  Past statistical performance, historical simulations, and algorithmic backtesting metrics do not guarantee future returns.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: COOKIES & TRACKING */}
          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Cookie &amp; Local Storage Policy</h3>
              </div>
              <div className="space-y-3 text-[var(--text-secondary)]">
                <p>
                  MarketMind AI uses strictly essential cookies and browser LocalStorage to store authentication session tokens, theme preferences (light/dark), and selected language locales.
                </p>
                <p>
                  We do not sell user data to third-party ad networks or engage in cross-site tracking.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: THIRD PARTY DATA */}
          {activeTab === 'data_sources' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Third-Party Market Data Sources &amp; Attribution</h3>
              </div>
              <div className="space-y-3 text-[var(--text-secondary)]">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Massive / Polygon.io:</strong> US Equities &amp; Options Real-Time Feeds.</li>
                  <li><strong>Alpaca Markets LLC:</strong> Real-time streaming financial news and brokerage connection API.</li>
                  <li><strong>Finnhub Stock API:</strong> Corporate earnings transcripts, company profiles, and filings.</li>
                  <li><strong>SEC EDGAR:</strong> Official public company 10-K, 10-Q, 8-K, Form 4 filings and disclosures.</li>
                  <li><strong>Federal Reserve Economic Data (FRED):</strong> Macroeconomic indicators, CPI, and Fed funds rates.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 7: CONTACT & LEGAL ENTITY */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Legal Entity &amp; Contact Information</h3>
              </div>
              <div className="bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-2 text-xs font-mono">
                <div><strong>Company:</strong> [LEGAL COMPANY NAME]</div>
                <div><strong>Registered Address:</strong> [BUSINESS ADDRESS]</div>
                <div><strong>Support &amp; Compliance Email:</strong> [SUPPORT EMAIL]</div>
                <div><strong>Governing Jurisdiction:</strong> [GOVERNING JURISDICTION]</div>
                <div><strong>Official Web Terminal:</strong> https://marketmind.ai</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--surface-secondary)] border-t border-[var(--border-primary)] flex justify-between items-center">
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Canonical Version: v1.0 • Last Updated: [EFFECTIVE DATE]
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] font-semibold rounded-lg text-xs transition"
          >
            Close Legal Center
          </button>
        </div>
      </div>
    </div>
  );
};

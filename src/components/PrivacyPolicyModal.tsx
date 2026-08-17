import React from 'react';
import { X, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Privacy Policy &amp; Data Protection
              </h2>
              <p className="text-xs text-slate-400">
                GDPR &bull; CCPA Compliance &bull; Last Revised: August 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2d3139] rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#818cf8]" />
              1. Information We Collect
            </h3>
            <p>
              MarketMind AI (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) collects information necessary to deliver real-time quantitative market intelligence, custom alert webhooks, and subscription services. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Account Credentials:</strong> Email address, user display name, and authentication tokens.</li>
              <li><strong>Trading Preferences:</strong> Saved watchlists, custom alert triggers, and paper simulation logs.</li>
              <li><strong>Telemetry &amp; API Usage:</strong> Timestamped query logs, WebSocket connection durations, and rate limit telemetry.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. How We Use Data &amp; AI Processing
            </h3>
            <p>
              We process market inputs using our server-side integration with the Google Gemini 3.7 Flash model. User queries in the AI assistant are routed securely through encrypted proxy endpoints. <strong>We do not sell, rent, or trade your personal data or custom strategy formulas to third-party advertisers or brokerages.</strong>
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Data Security &amp; Transport Encryption
            </h3>
            <p>
              MarketMind uses managed authentication services and industry-standard HTTPS/TLS encrypted connections for data in transit. Authentication credentials are handled by the configured identity provider rather than a separate MarketMind password-hashing system.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              4. GDPR &amp; CCPA User Rights
            </h3>
            <p>
              Under European General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you retain full rights to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Request an export of all your stored watchlists and alert logs.</li>
              <li>Request instantaneous permanent deletion of your account and API tokens.</li>
              <li>Opt-out of non-essential analytical cookies and marketing broadcasts.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              5. Contacting the Data Protection Officer
            </h3>
            <p>
              For privacy compliance or data deletion inquiries, contact our Data Protection Officer at <code className="text-[#a5b4fc]">privacy@marketmind.ai</code>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#1c1f24] border-t border-[#2d3139] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};

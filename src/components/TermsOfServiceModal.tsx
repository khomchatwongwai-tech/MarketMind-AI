import { useI18n } from '../i18n/I18nContext.js';
import React from 'react';
import { X, FileText, AlertTriangle, Scale, ShieldCheck } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Terms of Service &amp; Regulatory Disclosures
              </h2>
              <p className="text-xs text-slate-400">
                Institutional User Agreement &bull; SEC / FINRA Educational Notice
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
          {/* Important Regulatory Disclaimer Banner */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1.5 text-amber-200">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Mandatory Financial &amp; Non-Advisory Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              MarketMind AI is a quantitative financial software tool designed solely for informational, research, and educational purposes. MarketMind AI is <strong>NOT</strong> a registered investment advisor, broker-dealer, or commodity trading advisor with the SEC, FINRA, CFTC, or any international regulatory authority. No content, probabilistic score, or AI response constitutes a personalized investment recommendation or solicitation to buy or sell securities.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing, browsing, or subscribing to the MarketMind AI terminal, APIs, or real-time WebSocket feeds, you acknowledge that you have read, understood, and agree to be bound by this Agreement in full.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Trading &amp; Capital Risk Disclosures
            </h3>
            <p>
              Trading equities, options, futures, and leveraged exchange-traded products involves substantial risk of loss and is not suitable for every investor. Past mathematical performance, historical backtest win rates, and Brier accuracy metrics do not guarantee future market results.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Intellectual Property &amp; Algorithmic Models
            </h3>
            <p>
              All proprietary algorithms, support/resistance regression math, custom UI layout structures, and real-time synthesis feeds are the exclusive intellectual property of MarketMind AI. Reverse engineering, unauthorized programmatic scraping, or reselling of feeds is strictly prohibited.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Subscription Billing &amp; Cancellations
            </h3>
            <p>
              Subscriptions renew automatically at the start of each billing cycle (monthly or annual). Users may cancel or modify their plan at any time through Account Settings. Refunds for unused portions of billing cycles are subject to our 14-day institutional money-back policy.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              5. Limitation of Liability
            </h3>
            <p>
              Under no circumstances shall MarketMind AI, its directors, data suppliers, or affiliates be liable for any direct, indirect, incidental, punitive, or consequential trading losses resulting from feed latency, API downtime, or execution decisions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#1c1f24] border-t border-[#2d3139] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition"
          >
            Acknowledge &amp; Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, ShieldCheck, Cpu, Database, Calculator, Info } from 'lucide-react';

export type InferenceBadgeType = 'VERIFIED' | 'CALCULATED' | 'ESTIMATED' | 'CONSENSUS' | 'AI_INFERENCE' | 'UNAVAILABLE';

interface FinancialResearchDisclaimerProps {
  badges?: InferenceBadgeType[];
  compact?: boolean;
  className?: string;
  sourceAttribution?: string;
}

export const FinancialResearchDisclaimer: React.FC<FinancialResearchDisclaimerProps> = ({
  badges = ['VERIFIED', 'CALCULATED', 'AI_INFERENCE'],
  compact = false,
  className = '',
  sourceAttribution,
}) => {
  const getBadgeStyle = (badge: InferenceBadgeType) => {
    switch (badge) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'VERIFIED SOURCE',
        };
      case 'CALCULATED':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Calculator,
          label: 'QUANTITATIVELY CALCULATED',
        };
      case 'ESTIMATED':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Info,
          label: 'ESTIMATED PROJECTION',
        };
      case 'CONSENSUS':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: Database,
          label: 'CONSENSUS AGGREGATE',
        };
      case 'AI_INFERENCE':
        return {
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          icon: Cpu,
          label: 'AI SYNTHESIS & INFERENCE',
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
          icon: AlertTriangle,
          label: 'FEED OFFLINE',
        };
    }
  };

  if (compact) {
    return (
      <div
        id="financial-research-disclaimer-compact"
        className={`text-[11px] text-[var(--text-muted)] border-t border-[var(--border-primary)] pt-2.5 mt-3 flex flex-wrap items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
          <span>
            <strong>Non-Advisory Notice:</strong> For informational &amp; educational research only. Not personalized investment advice.
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {badges.map((b: InferenceBadgeType) => {
            const style = getBadgeStyle(b);
            const Icon = style.icon;
            return (
              <span
                key={b}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${style.bg}`}
              >
                <Icon className="w-2.5 h-2.5" />
                {style.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      id="financial-research-disclaimer"
      className={`bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-xl p-4 text-xs text-[var(--text-secondary)] space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2.5">
        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] text-xs tracking-wider uppercase">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-gold)]" />
          <span>Financial Research &amp; Regulatory Disclosure</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {badges.map((b: InferenceBadgeType) => {
            const style = getBadgeStyle(b);
            const Icon = style.icon;
            return (
              <span
                key={b}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${style.bg}`}
              >
                <Icon className="w-3 h-3" />
                {style.label}
              </span>
            );
          })}
        </div>
      </div>

      <p className="leading-relaxed">
        <strong>MarketMind AI is not a registered broker-dealer or financial investment advisor.</strong> All quantitative scores, price targets, options flow analytics, Deep Research reports, and AI explanations are generated algorithmically for educational and analytical purposes. Past performance and quantitative models do not guarantee future market returns.
      </p>

      {sourceAttribution && (
        <div className="text-[11px] text-[var(--text-muted)] font-mono">
          Attribution: {sourceAttribution} | SEC EDGAR Direct Records | US Exchange Feeds
        </div>
      )}
    </div>
  );
};

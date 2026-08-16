import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Clock,
  Database,
  Bot,
} from 'lucide-react';
import { AppConfig } from '../config/environment';
import { AnalyticsService } from '../services/analyticsService';

interface ReportDataIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  provider?: string;
  currentPrice?: number | string;
  activeTab?: string;
}

const ISSUE_CATEGORIES = [
  'Incorrect Price / Quote',
  'Stale / Delayed Data',
  'Incorrect News / Misattribution',
  'Technical Indicator / Level Discrepancy',
  'Options Chain / Greeks Discrepancy',
  'AI Analysis Grounding Issue',
  'Bug / Layout Glitch',
  'Feature Suggestion',
  'Security Concern',
];

export const ReportDataIssueModal: React.FC<ReportDataIssueModalProps> = ({
  isOpen,
  onClose,
  symbol = 'SPY',
  provider = 'Institutional Market Router',
  currentPrice,
  activeTab = 'Dashboard',
}) => {
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [expectedValue, setExpectedValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      category,
      symbol,
      provider,
      currentPrice,
      activeTab,
      expectedValue,
      description,
      appVersion: AppConfig.appVersion,
      buildId: AppConfig.buildId,
      timestamp: new Date().toISOString(),
    };

    AnalyticsService.track('data_issue_reported', {
      category,
      symbol,
      provider,
    });

    try {
      if (typeof window !== 'undefined' && window.fetch) {
        await fetch('/api/beta/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
    } catch {
      // Graceful
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="report-data-issue-modal"
        className="relative w-full max-w-lg bg-[#0F0F12] border border-[#27272E] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222228] bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1C1C24] border border-amber-500/40 rounded-xl text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">
                REPORT DATA OR AI ISSUE
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Public Beta Quality Assurance &bull; Help verify accuracy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#222228] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">Report Submitted</h3>
            <p className="text-xs text-[#A1A1AA] max-w-xs">
              Thank you for helping us maintain verified data integrity during our Public Beta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#D4D4D8]">
            {/* Metadata Context Badge */}
            <div className="p-3 bg-[#14141A] border border-[#22222A] rounded-xl flex items-center justify-between text-[11px] font-mono">
              <div>
                <span className="text-[#71717A] block">Target Asset / Page</span>
                <span className="font-bold text-[#F2D675]">{symbol} &bull; {activeTab}</span>
              </div>
              <div className="text-right">
                <span className="text-[#71717A] block">Data Provider</span>
                <span className="text-white">{provider}</span>
              </div>
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-[#A1A1AA] font-semibold mb-1.5">
                Issue Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#14141A] border border-[#272730] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Value (Optional) */}
            <div>
              <label className="block text-[#A1A1AA] font-semibold mb-1.5">
                Expected Value / Correct Reference (Optional)
              </label>
              <input
                type="text"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder="e.g., Price should be $514.20 on official exchange feed"
                className="w-full bg-[#14141A] border border-[#272730] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#A1A1AA] font-semibold mb-1.5">
                Description of Discrepancy
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what appears incorrect or any relevant details..."
                className="w-full bg-[#14141A] border border-[#272730] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            {/* Version Telemetry Footer */}
            <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono pt-1">
              <span>MarketMind {AppConfig.appVersion}</span>
              <span>Build: {AppConfig.buildId}</span>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F2D675] text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    Submit Report <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

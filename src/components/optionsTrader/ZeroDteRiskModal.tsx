import { useI18n } from '../../i18n/I18nContext.js';
import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { OptionContract } from '../../types/optionsTrader';

interface ZeroDteRiskModalProps {
  contract: OptionContract;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export const ZeroDteRiskModal: React.FC<ZeroDteRiskModalProps> = ({
  contract,
  isOpen,
  onClose,
  onAcknowledge,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121212] border-2 border-amber-500/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col">
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Risk Guardian™ Critical Warning
              </div>
              <h3 className="text-lg font-black text-white">HIGH-RISK 0DTE OPTION</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-slate-300">
          <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs leading-relaxed text-amber-200">
            <strong>Selected Contract:</strong> {contract.underlyingSymbol} ${contract.strike}{' '}
            {contract.type} ({contract.expiration} &bull; Expires Today at Market Close)
          </div>

          <p className="font-semibold text-white">
            This options contract expires today. Possible risks include:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Extremely Rapid Theta Decay:</strong> Extrinsic time
                value evaporates exponentially by the minute, accelerating into market close.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">High Gamma Sensitivity:</strong> Small moves in the
                underlying stock cause massive percentage swings in the option price.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Wide Bid/Ask Spreads:</strong> Slippage can quickly
                erode potential gains on rapid execution.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-rose-300">Potential Total Premium Loss:</strong> Out-of-the-money
                contracts will expire completely worthless at 4:00 PM ET.
              </span>
            </li>
          </ul>

          <div className="p-3 bg-[#181818] rounded-xl border border-[#2A2A2A] text-[11px] text-slate-400">
            Educational analysis is never blocked. However, explicit acknowledgement is required
            before generating an order ticket.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-[#222222] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAcknowledge}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            I Acknowledge & Understand 0DTE Risks
          </button>
        </div>
      </div>
    </div>
  );
};

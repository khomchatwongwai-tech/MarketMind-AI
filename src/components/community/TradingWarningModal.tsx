import { useI18n } from '../../i18n/I18nContext.js';
import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { TickerSymbol } from '../../types/market';
import { FINANCIAL_DISCLAIMER_TEXT } from '../../services/community/safetyGuard';

interface TradingWarningModalProps {
  ticker: TickerSymbol;
  onClose: () => void;
  onConfirm: () => void;
}

export const TradingWarningModal: React.FC<TradingWarningModalProps> = ({
  ticker,
  onClose,
  onConfirm,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Financial Risk Disclosure</h3>
              <p className="text-[11px] text-slate-400 font-mono">Analyzing Ticker: ${ticker}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-200">
            <span className="font-bold text-[#F2D675] block mb-1">Important Investor Notice:</span>
            {FINANCIAL_DISCLAIMER_TEXT}
          </div>

          <ul className="space-y-2 text-[11px] text-slate-400 list-disc pl-4">
            <li>Community posts express subjective trader sentiment and technical interpretations.</li>
            <li>MarketMind AI never supports automatic copy-trading or guarantee of profitability.</li>
            <li>Always inspect verified SEC filings, earnings data, and quantitative metrics before allocating capital.</li>
          </ul>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242424]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#F2D675] hover:to-[#D4AF37] text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              <span>Acknowledge &amp; View ${ticker}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

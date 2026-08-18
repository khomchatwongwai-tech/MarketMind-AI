import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Zap,
  Calendar,
  X,
} from 'lucide-react';
import { OptionsAlertRule, OptionAlertCondition } from '../../types/optionsTrader';
import { optionsAlertsService } from '../../services/options/optionsAlertsService';

interface OptionsAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
}

export const OptionsAlertsModal: React.FC<OptionsAlertsModalProps> = ({
  isOpen,
  onClose,
  defaultSymbol = 'SPY',
}) => {
  const [alerts, setAlerts] = useState<OptionsAlertRule[]>(() => optionsAlertsService.getAlerts());
  const [symbol, setSymbol] = useState<string>(defaultSymbol);
  const [condition, setCondition] = useState<OptionAlertCondition>('IV_ABOVE');
  const [targetValue, setTargetValue] = useState<number>(30);
  const [customDesc, setCustomDesc] = useState<string>('');

  if (!isOpen) return null;

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();

    let desc = customDesc;
    if (!desc) {
      if (condition === 'IV_ABOVE') desc = `Alert if ${symbol} IV rises above ${targetValue}%`;
      else if (condition === 'PRICE_DROP_PCT') desc = `Alert if ${symbol} contract loses ${targetValue}%`;
      else if (condition === 'PRICE_GAIN_PCT') desc = `Alert if ${symbol} contract gains ${targetValue}%`;
      else if (condition === 'UNUSUAL_VOLUME_SPIKE') desc = `Alert if ${symbol} volume spikes >${targetValue}x average`;
      else if (condition === 'EARNINGS_BEFORE_EXP') desc = `Alert if ${symbol} scheduled earnings occurs within current contract expiration cycle`;
      else desc = `Alert for ${symbol} options condition`;
    }

    const created = optionsAlertsService.addAlert({
      symbol,
      condition,
      targetValue,
      description: desc,
      isActive: true,
    });

    setAlerts(optionsAlertsService.getAlerts());
    setCustomDesc('');
  };

  const handleToggle = (id: string) => {
    optionsAlertsService.toggleAlert(id);
    setAlerts(optionsAlertsService.getAlerts());
  };

  const handleDelete = (id: string) => {
    optionsAlertsService.deleteAlert(id);
    setAlerts(optionsAlertsService.getAlerts());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0D0D0D] border border-[#D4AF37]/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#141414] border-b border-[#2A2A2A] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                Smart Options Alerts Desk™
              </div>
              <h2 className="text-lg font-black text-white">Manage Automated Options Triggers</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Create Alert Form */}
          <form onSubmit={handleAddAlert} className="p-4 bg-[#141414] rounded-xl border border-[#262626] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Create New Options Alert Rule
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Trigger Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full h-9 px-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="IV_ABOVE">Implied Volatility (IV) &gt; X%</option>
                  <option value="PRICE_DROP_PCT">Contract Price Drops &gt; X%</option>
                  <option value="PRICE_GAIN_PCT">Contract Price Gains &gt; X%</option>
                  <option value="UNUSUAL_VOLUME_SPIKE">Unusual Flow &gt; X.Xx Avg</option>
                  <option value="EARNINGS_BEFORE_EXP">Earnings Within Expiration</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Threshold</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 transition-all shadow-md shadow-[#D4AF37]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Alert Rule
              </button>
            </div>
          </form>

          {/* Active Alerts List */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Trigger Rules ({alerts.length})
            </div>

            <div className="space-y-2">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    al.triggered
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : al.isActive
                      ? 'bg-[#141414] border-[#262626] text-slate-200'
                      : 'bg-[#111] border-[#1C1C1C] text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(al.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        al.isActive ? 'bg-[#D4AF37] text-black' : 'bg-[#222] text-slate-600'
                      }`}
                    >
                      {al.isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{al.description}</span>
                        {al.triggered && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/30 text-amber-300 border border-amber-500/40 uppercase font-bold">
                            TRIGGERED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Created: {al.createdAt} {al.triggeredAt ? `&bull; ${al.triggeredAt}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(al.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-[#222] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 transition-all shadow-md shadow-[#D4AF37]/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

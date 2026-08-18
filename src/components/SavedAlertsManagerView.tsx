import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Play,
  Pause,
  Trash2,
  Volume2,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
} from 'lucide-react';
import { SavedAlert } from '../types/user';
import { TickerSymbol } from '../types/market';
import { UserService } from '../services/userService';

interface SavedAlertsManagerViewProps {
  currentTicker: TickerSymbol;
  onSelectTicker: (ticker: TickerSymbol) => void;
}

export const SavedAlertsManagerView: React.FC<SavedAlertsManagerViewProps> = ({
  currentTicker,
  onSelectTicker,
}) => {
  const [alerts, setAlerts] = useState<SavedAlert[]>(UserService.getSavedAlerts());
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'triggered' | 'paused'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [ticker, setTicker] = useState<TickerSymbol>(currentTicker);
  const [alertType, setAlertType] = useState<SavedAlert['type']>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState<number>(515.0);
  const [label, setLabel] = useState('');
  const [soundAlert, setSoundAlert] = useState(true);
  const [webhookAlert, setWebhookAlert] = useState(true);
  const [notes, setNotes] = useState('');
  const [testChimePlaying, setTestChimePlaying] = useState(false);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = UserService.createAlert({
      ticker,
      type: alertType,
      targetValue: Number(targetValue),
      label: label || `${ticker} ${alertType.replace(/_/g, ' ')}`,
      condition: `${alertType.replace(/_/g, ' ')} threshold @ ${targetValue}`,
      soundAlert,
      webhookAlert,
      notes,
    });
    setAlerts(UserService.getSavedAlerts());
    setShowCreateModal(false);
    setLabel('');
    setNotes('');
  };

  const handleToggleStatus = (id: string) => {
    UserService.toggleAlertStatus(id);
    setAlerts(UserService.getSavedAlerts());
  };

  const handleDelete = (id: string) => {
    UserService.deleteAlert(id);
    setAlerts(UserService.getSavedAlerts());
  };

  const playTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      setTestChimePlaying(true);
      setTimeout(() => setTestChimePlaying(false), 500);
    } catch (e) {
      console.warn('AudioContext unavailable', e);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterTab === 'all') return true;
    return a.status === filterTab;
  });

  return (
    <div className="flex flex-col gap-3 select-none text-[#e2e8f0]">
      {/* Header Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Saved Alert Dispatch Engine</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono">
                DISCORD / TELEGRAM / AUDIO
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Trigger instant executions on VWAP crosses, RSI extremes &amp; support/resistance breaches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playTestChime}
            className={`px-2.5 py-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-300 text-xs font-bold rounded-lg border border-[#2d3139] flex items-center gap-1.5 transition ${
              testChimePlaying ? 'text-emerald-400 border-emerald-500/50' : ''
            }`}
            title="Test Audio Chime"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Sound</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Alert</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-[#15171a] border border-[#2d3139] rounded-lg p-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              filterTab === 'all' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              filterTab === 'active' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({alerts.filter((a) => a.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterTab('triggered')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              filterTab === 'triggered' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Triggered ({alerts.filter((a) => a.status === 'triggered').length})
          </button>
          <button
            onClick={() => setFilterTab('paused')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              filterTab === 'paused' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paused ({alerts.filter((a) => a.status === 'paused').length})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
          Active Webhook: <span className="text-emerald-400 font-bold">DISCORD BOT CONNECTED</span>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-[#181a1f] border rounded-xl p-4 flex flex-col justify-between transition-all ${
              alert.status === 'active'
                ? 'border-[#2d3139] hover:border-[#6366f1]/50'
                : alert.status === 'triggered'
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : 'border-[#2d3139]/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onSelectTicker(alert.ticker)}
                    className="font-black font-mono text-base text-white hover:text-[#818cf8] cursor-pointer"
                  >
                    {alert.ticker}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.2 rounded font-mono font-bold uppercase ${
                      alert.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : alert.status === 'triggered'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(alert.id)}
                    className="p-1 bg-[#252830] hover:bg-[#2d3139] text-slate-300 rounded transition"
                    title={alert.status === 'active' ? 'Pause Alert' : 'Activate Alert'}
                  >
                    {alert.status === 'active' ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1 bg-[#252830] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-xs text-white mb-1">{alert.label}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2 font-mono">
                {alert.condition}
              </p>

              {alert.notes && (
                <div className="p-2 bg-[#14161a] rounded text-[10px] text-slate-400 border border-[#23272f] mb-3">
                  <span className="font-bold text-slate-300">Note: </span>
                  {alert.notes}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#23272f] flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                {alert.soundAlert && (
                  <span className="flex items-center gap-0.5 text-emerald-400" title="Audio Alert Active">
                    <Volume2 className="w-3 h-3" />
                  </span>
                )}
                {alert.webhookAlert && (
                  <span className="flex items-center gap-0.5 text-[#818cf8]" title="Discord Webhook Active">
                    <Send className="w-3 h-3" />
                  </span>
                )}
              </div>
              <span>{alert.triggeredAt ? `Triggered: ${alert.triggeredAt}` : alert.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2d3139] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#818cf8]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Create Quantitative Alert
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase() as TickerSymbol)}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#6366f1]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Condition Type
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as SavedAlert['type'])}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="PRICE_ABOVE">Price Above ($)</option>
                    <option value="PRICE_BELOW">Price Below ($)</option>
                    <option value="VWAP_CROSS">VWAP Upside Cross</option>
                    <option value="RSI_OVERBOUGHT">RSI Overbought (&gt; 70)</option>
                    <option value="RSI_OVERSOLD">RSI Oversold (&lt; 30)</option>
                    <option value="RESISTANCE_BREAK">Resistance Breakout</option>
                    <option value="SUPPORT_BREAK">Support Breakdown</option>
                    <option value="UNUSUAL_OPTIONS_SPIKE">Unusual Options Spike</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Target Price / Indicator Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Alert Label / Strategy Name
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Afternoon VWAP Breakout Continuation"
                  className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Trading Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Risk 1R, scale out 50% at first resistance..."
                  className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundAlert}
                    onChange={(e) => setSoundAlert(e.target.checked)}
                    className="accent-[#6366f1]"
                  />
                  <span>Audio Chime</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookAlert}
                    onChange={(e) => setWebhookAlert(e.target.checked)}
                    className="accent-[#6366f1]"
                  />
                  <span>Discord / Webhook</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2d3139]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-[#252830] text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6366f1] text-white text-xs font-bold rounded shadow-sm hover:bg-[#4f46e5]"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

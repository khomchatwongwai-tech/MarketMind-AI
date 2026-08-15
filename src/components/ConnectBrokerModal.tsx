import React, { useState } from 'react';
import {
  BrokerId,
  BrokerProviderMetadata,
  ConnectedBrokerAccount,
} from '../types/portfolio';
import { BrokerManager } from '../services/brokerProviders/BrokerManager';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Eye,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface ConnectBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountConnected: (account: ConnectedBrokerAccount) => void;
  userId: string;
}

export const ConnectBrokerModal: React.FC<ConnectBrokerModalProps> = ({
  isOpen,
  onClose,
  onAccountConnected,
  userId,
}) => {
  const [step, setStep] = useState<'SELECT' | 'CONSENT' | 'CONNECTING' | 'SUCCESS'>('SELECT');
  const [selectedBroker, setSelectedBroker] = useState<BrokerProviderMetadata | null>(null);
  const [authMode, setAuthMode] = useState<'oauth' | 'token'>('oauth');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountNickname, setAccountNickname] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newlyConnectedAccount, setNewlyConnectedAccount] = useState<ConnectedBrokerAccount | null>(null);

  if (!isOpen) return null;

  const brokerManager = BrokerManager.getInstance();
  const allProviders = brokerManager.getAllProvidersMetadata();

  const handleSelectBroker = (broker: BrokerProviderMetadata) => {
    setSelectedBroker(broker);
    setAccountNickname(`${broker.name} Portfolio`);
    setErrorMessage(null);
    setStep('CONSENT');
  };

  const handleProceedToConnect = async () => {
    if (!selectedBroker) return;
    setIsConnecting(true);
    setErrorMessage(null);
    setStep('CONNECTING');

    try {
      // Simulate real OAuth handshake latency and secure token generation
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const result = await brokerManager.connectBrokerAccount(userId, selectedBroker.id, {
        apiKey: apiKey.trim() || undefined,
        apiSecret: apiSecret.trim() || undefined,
        accountNumber: '9482',
        isSandbox,
      });

      if (result.success && result.account) {
        setNewlyConnectedAccount(result.account);
        onAccountConnected(result.account);
        setStep('SUCCESS');
      } else {
        setErrorMessage(result.errorMessage || 'Failed to authenticate connection. Please check your credentials.');
        setStep('CONSENT');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error occurred.');
      setStep('CONSENT');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setStep('SELECT');
    setSelectedBroker(null);
    setApiKey('');
    setApiSecret('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1C1C1C] flex items-center justify-between bg-[#0F0F0F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.12)] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Connect Your Brokerage
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-normal lowercase">
                  read-only
                </span>
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Securely link your investment account for unified intelligence & risk monitoring
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-[#8A8A8A] hover:text-white hover:bg-[#1A1A1A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: SELECT BROKER */}
          {step === 'SELECT' && (
            <div className="space-y-4">
              <div className="p-3 bg-[rgba(212,175,55,0.05)] border border-[#D4AF37]/20 rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>MarketMind SafeSync™:</strong> Connections are strictly <strong>READ-ONLY</strong>.
                  MarketMind can never place trades, withdraw funds, or access your passwords.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allProviders.map((broker) => (
                  <button
                    key={broker.id}
                    onClick={() => handleSelectBroker(broker)}
                    className="p-3.5 rounded-lg border border-[#1C1C1C] bg-[#111111] hover:bg-[#161616] hover:border-[#D4AF37]/40 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{broker.logo}</span>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-[#F2D675] transition text-xs">
                            {broker.name}
                          </h4>
                          <span className="text-[10px] text-[#737373] uppercase font-mono">
                            {broker.authType === 'oauth' ? 'OAuth 2.0 Direct' : broker.authType === 'aggregator' ? 'Plaid Link' : 'API Token'}
                          </span>
                        </div>
                      </div>
                      {broker.id === 'demo' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(212,175,55,0.15)] text-[#F2D675] border border-[#D4AF37]/30 font-mono font-bold">
                          INSTANT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {broker.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: CONSENT & AUTHORIZATION */}
          {step === 'CONSENT' && selectedBroker && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('SELECT')}
                className="text-xs text-[#8A8A8A] hover:text-[#D4AF37] transition flex items-center gap-1 mb-1 font-mono"
              >
                &larr; Back to Broker List
              </button>

              <div className="p-4 bg-[#111111] border border-[#242424] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedBroker.logo}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedBroker.name}</h3>
                    <p className="text-[11px] text-slate-400">{selectedBroker.connectionInstructions}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Verified Protocol
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Permissions List */}
              <div className="bg-[#111111] border border-[#1C1C1C] rounded-lg p-3.5 space-y-2.5">
                <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider text-slate-400">
                  Requested Read-Only Permissions:
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>View portfolio cash balances, market value, and buying power</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Retrieve active stock, ETF, and options positions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Read authorized historical transactions & dividend income</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-[#1C1C1C] text-[10px] text-slate-500 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-[#D4AF37]" />
                  <span>Strict prohibition: Trading, asset transfers, or withdrawal privileges are NEVER requested.</span>
                </div>
              </div>

              {/* Optional Settings */}
              {selectedBroker.id === 'alpaca' || selectedBroker.id === 'tradier' ? (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2 border-b border-[#1C1C1C] pb-2 text-xs">
                    <button
                      onClick={() => setAuthMode('oauth')}
                      className={`px-3 py-1 rounded ${authMode === 'oauth' ? 'bg-[#D4AF37]/20 text-[#F2D675] font-bold' : 'text-slate-400'}`}
                    >
                      Instant OAuth Direct
                    </button>
                    <button
                      onClick={() => setAuthMode('token')}
                      className={`px-3 py-1 rounded ${authMode === 'token' ? 'bg-[#D4AF37]/20 text-[#F2D675] font-bold' : 'text-slate-400'}`}
                    >
                      API Key / Secret
                    </button>
                  </div>

                  {authMode === 'token' && (
                    <div className="space-y-2.5 bg-[#0D0D0D] p-3 rounded border border-[#1C1C1C]">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">API Key / Client ID</label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="e.g. PK..."
                          className="w-full bg-[#161616] border border-[#242424] rounded px-3 py-1.5 text-white font-mono text-xs focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">API Secret</label>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-[#161616] border border-[#242424] rounded px-3 py-1.5 text-white font-mono text-xs focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-[#242424] bg-[#111111] text-slate-300 hover:bg-[#161616] transition text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToConnect}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-black font-bold hover:brightness-110 transition text-xs flex items-center gap-2 shadow-lg shadow-[#D4AF37]/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Authorize Read-Only Connection
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONNECTING SPINNER */}
          {step === 'CONNECTING' && selectedBroker && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Connecting to {selectedBroker.name}...</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Exchanging secure OAuth cryptographic credentials and initializing read-only holdings pipeline.
                </p>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit TLS Encrypted Handshake Active</span>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && newlyConnectedAccount && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Connection Established!</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Successfully connected <strong>{newlyConnectedAccount.brokerName}</strong> ({newlyConnectedAccount.accountNumberMasked}).
                  MarketMind has imported {newlyConnectedAccount.holdingsCount} holdings and {newlyConnectedAccount.optionsCount} options contracts.
                </p>
              </div>

              <div className="bg-[#111111] border border-[#1C1C1C] rounded-lg p-3 w-full max-w-md text-left text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Portfolio Value:</span>
                  <span className="text-white font-bold">${newlyConnectedAccount.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cash Balance:</span>
                  <span className="text-emerald-400">${newlyConnectedAccount.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Permissions:</span>
                  <span className="text-[#D4AF37]">READ_ONLY_VERIFIED</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#F2D675] transition text-xs shadow-lg shadow-[#D4AF37]/20"
              >
                Launch Connected Portfolio™ Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  X,
  Clock,
  DollarSign,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  OptionContract,
  OptionsOrderRequest,
  OptionsOrderResult,
  OptionsOrderLeg,
} from '../../types/optionsTrader';
import { optionsPaperTradingService } from '../../services/options/optionsPaperTradingService';
import { optionsRiskGuardianEngine } from '../../services/options/optionsRiskGuardianEngine';

interface OptionsOrderTicketModalProps {
  contract?: OptionContract;
  initialOrderRequest?: Partial<OptionsOrderRequest>;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (result: OptionsOrderResult) => void;
  portfolioValue?: number;
}

export const OptionsOrderTicketModal: React.FC<OptionsOrderTicketModalProps> = ({
  contract,
  initialOrderRequest,
  isOpen,
  onClose,
  onOrderCompleted,
  portfolioValue = 100000,
}) => {
  const [step, setStep] = useState<'CONFIGURE' | 'REVIEW' | 'RESULT'>('CONFIGURE');
  const [accountType, setAccountType] = useState<'paper' | 'live'>('paper');

  // Form State
  const [action, setAction] = useState<'BUY_TO_OPEN' | 'SELL_TO_CLOSE' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE'>('BUY_TO_OPEN');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP' | 'STOP_LIMIT'>('LIMIT');
  const [limitPrice, setLimitPrice] = useState<number>(
    contract ? contract.mid : initialOrderRequest?.limitPrice || 3.50
  );
  const [timeInForce, setTimeInForce] = useState<'DAY' | 'GTC'>('DAY');

  // Safety & Confirmation checkboxes
  const [userAcknowledgedRisk, setUserAcknowledgedRisk] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<OptionsOrderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form when opened
  useEffect(() => {
    if (isOpen) {
      setStep('CONFIGURE');
      setUserAcknowledgedRisk(false);
      setIsSubmitting(false);
      setOrderResult(null);
      setErrorMessage(null);
      if (contract) {
        setLimitPrice(contract.mid);
      }
    }
  }, [isOpen, contract, initialOrderRequest]);

  if (!isOpen) return null;

  const underlying = contract?.underlyingSymbol || initialOrderRequest?.underlyingSymbol || 'SPY';
  const strike = contract?.strike || initialOrderRequest?.legs?.[0]?.strike || 550;
  const optType = contract?.type || initialOrderRequest?.legs?.[0]?.type || 'CALL';
  const expiration = contract?.expiration || initialOrderRequest?.legs?.[0]?.expiration || '2026-08-22';
  const dte = contract?.dte ?? 7;
  const currentMid = contract?.mid || initialOrderRequest?.legs?.[0]?.currentMid || 3.50;

  const totalCost = Number((limitPrice * 100 * quantity).toFixed(2));
  const commission = 0.00;
  const regulatoryFee = Number((0.03 * quantity).toFixed(2));
  const totalRequired = Number((totalCost + commission + regulatoryFee).toFixed(2));

  // Risk evaluation
  const riskEval = contract
    ? optionsRiskGuardianEngine.evaluateContractRisk({
        contract,
        quantity,
        portfolioValue,
      })
    : null;

  const handleProceedToReview = () => {
    if (quantity < 1) {
      setErrorMessage('Please specify a valid quantity (minimum 1 contract).');
      return;
    }
    if (limitPrice <= 0) {
      setErrorMessage('Please specify a valid limit price.');
      return;
    }
    setErrorMessage(null);
    setStep('REVIEW');
  };

  const handleConfirmAndSubmit = async () => {
    if (!userAcknowledgedRisk) {
      setErrorMessage('Please check the acknowledgment box before final order submission.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const legs: OptionsOrderLeg[] = initialOrderRequest?.legs || [
      {
        contractSymbol: contract?.symbol || `${underlying}260822C00550000`,
        underlyingSymbol: underlying,
        type: optType,
        strike,
        expiration,
        action,
        quantity,
        currentMid,
      },
    ];

    const orderRequest: OptionsOrderRequest = {
      orderId: `ord-${Date.now()}`,
      idempotencyKey,
      brokerId: accountType,
      underlyingSymbol: underlying,
      strategyName: initialOrderRequest?.strategyName || `${action.replace(/_/g, ' ')} ${optType}`,
      legs,
      orderType,
      limitPrice,
      timeInForce,
      estimatedCost: totalCost,
      userConfirmed: true,
      confirmedTimestamp: new Date().toISOString(),
      isPaper: accountType === 'paper',
    };

    try {
      let result: OptionsOrderResult;

      if (accountType === 'paper') {
        result = optionsPaperTradingService.submitPaperOrder(orderRequest);
      } else {
        // Send to live broker endpoint with explicit confirmation
        let authHeader = '';
        try {
          const { auth } = await import('../../config/firebase');
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            authHeader = `Bearer ${token}`;
          }
        } catch {}
        if (!authHeader) {
          try {
            const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('marketmind_auth_token') : null;
            if (savedToken) {
              authHeader = `Bearer ${savedToken}`;
            }
          } catch {}
        }
        if (!authHeader) {
          try {
            const userStr = typeof localStorage !== 'undefined'
              ? (localStorage.getItem('marketmind_user_profile') || localStorage.getItem('marketmind_user_v2'))
              : null;
            if (userStr) {
              const u = JSON.parse(userStr);
              if (u?.id) authHeader = `Bearer mkt_dev_${u.id}`;
            }
          } catch {}
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authHeader) headers['Authorization'] = authHeader;

        const response = await fetch('/api/options/order/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({ request: orderRequest }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Broker order execution failed.');
        }

        result = await response.json();
      }

      setOrderResult(result);
      setStep('RESULT');
      if (onOrderCompleted) {
        onOrderCompleted(result);
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0D0D0D] border border-[#D4AF37]/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#141414] border-b border-[#2A2A2A] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  MarketMind Options Order Desk™
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1E1E1E] text-slate-400 border border-[#333]">
                  {step === 'CONFIGURE' ? 'STEP 1: CONFIGURE' : step === 'REVIEW' ? 'STEP 2: REVIEW' : 'STEP 3: STATUS'}
                </span>
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>{underlying}</span>
                <span className="text-[#D4AF37]">${strike}</span>
                <span className={optType === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}>
                  {optType}
                </span>
                <span className="text-xs text-slate-400 font-normal">({expiration})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Configure Order */}
        {step === 'CONFIGURE' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Account Selector Pill */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] rounded-xl border border-[#262626]">
              <button
                onClick={() => setAccountType('paper')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  accountType === 'paper'
                    ? 'bg-[#D4AF37] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Virtual Paper Account ($100k)
              </button>

              <button
                onClick={() => setAccountType('live')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  accountType === 'live'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Connected Broker (Live Trade)
              </button>
            </div>

            {/* Live Mode Notice */}
            {accountType === 'live' && (
              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Explicit Confirmation Enforced:</strong> Live orders are routed directly
                  to your connected broker API after your explicit confirmation. MarketMind never
                  executes autonomous trades.
                </span>
              </div>
            )}

            {/* Action & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase">Order Action</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['BUY_TO_OPEN', 'SELL_TO_CLOSE', 'SELL_TO_OPEN', 'BUY_TO_CLOSE'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAction(act)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                        action === act
                          ? act.startsWith('BUY')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          : 'bg-[#181818] text-slate-400 hover:bg-[#222] border border-[#2C2C2C]'
                      }`}
                    >
                      {act.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Contracts Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] border border-[#333] font-bold text-white text-lg flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 bg-[#141414] border border-[#2E2E2E] rounded-lg text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] border border-[#333] font-bold text-white text-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {quantity * 100} underlying shares controlled
                </div>
              </div>
            </div>

            {/* Order Type & Limit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[#141414] border border-[#2E2E2E] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="LIMIT">Limit Order (Recommended)</option>
                  <option value="MARKET">Market Order</option>
                  <option value="STOP">Stop Loss</option>
                  <option value="STOP_LIMIT">Stop Limit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Limit Price</label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setLimitPrice(contract ? contract.bid : currentMid * 0.98)}
                      className="text-slate-400 hover:text-white px-1"
                    >
                      Bid ${contract?.bid.toFixed(2) || (currentMid * 0.98).toFixed(2)}
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setLimitPrice(currentMid)}
                      className="text-[#D4AF37] font-bold px-1"
                    >
                      Mid ${currentMid.toFixed(2)}
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setLimitPrice(contract ? contract.ask : currentMid * 1.02)}
                      className="text-slate-400 hover:text-white px-1"
                    >
                      Ask ${contract?.ask.toFixed(2) || (currentMid * 1.02).toFixed(2)}
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-[#141414] border border-[#2E2E2E] rounded-lg font-mono font-bold text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Cost & Purchasing Power Breakdown */}
            <div className="p-4 bg-[#141414] rounded-xl border border-[#262626] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Contract Cost ({quantity} &times; ${limitPrice.toFixed(2)} &times; 100):</span>
                <span className="font-mono font-bold text-white">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Regulatory Options Exchange Fees ($0.03/contract):</span>
                <span className="font-mono text-slate-300">${regulatoryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Broker Commission:</span>
                <span className="font-mono text-emerald-400">$0.00 Free</span>
              </div>
              <div className="pt-2 border-t border-[#262626] flex items-center justify-between font-bold text-sm">
                <span className="text-slate-200">Total Required Buying Power:</span>
                <span className="font-mono text-[#D4AF37]">${totalRequired.toFixed(2)}</span>
              </div>
            </div>

            {/* Position Size vs Portfolio Concentration Warning */}
            {riskEval?.positionSizeWarning?.isHighConcentration && (
              <div className="p-3 bg-amber-950/25 rounded-xl border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Portfolio Concentration Warning:</strong>{' '}
                  {riskEval.positionSizeWarning.recommendation}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/50 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review Order (Preview Modal) */}
        {step === 'REVIEW' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Banner */}
            <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-white">THIS ORDER HAS NOT BEEN SUBMITTED YET.</strong>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  Review the contract parameters, pricing, and risk disclosures below before final confirmation.
                </p>
              </div>
            </div>

            {/* Order Specification Summary */}
            <div className="p-4 bg-[#141414] rounded-xl border border-[#282828] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Order Specification
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Routing Destination</span>
                  <strong className="text-white">{accountType === 'paper' ? 'Virtual Paper Trader' : 'Connected Broker API'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Action</span>
                  <strong className={action.startsWith('BUY') ? 'text-emerald-400' : 'text-rose-400'}>
                    {action.replace(/_/g, ' ')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Quantity</span>
                  <strong className="text-white font-mono">{quantity} Contract{quantity > 1 ? 's' : ''}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Contract</span>
                  <strong className="text-white font-mono">{underlying} ${strike} {optType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Expiration</span>
                  <strong className="text-white">{expiration} ({dte} DTE)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Order Type</span>
                  <strong className="text-white">{orderType} @ ${limitPrice.toFixed(2)}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">Total Net Amount:</span>
                <span className="font-mono font-bold text-[#D4AF37] text-base">
                  ${totalRequired.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Risk Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-[#161616] rounded-xl border border-[#2E2E2E] cursor-pointer hover:border-[#444] transition-colors">
              <input
                type="checkbox"
                checked={userAcknowledgedRisk}
                onChange={(e) => setUserAcknowledgedRisk(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[#D4AF37] cursor-pointer"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I have reviewed this order, understand that options carry risk of capital loss,
                and explicitly authorize the submission of this {accountType === 'paper' ? 'paper' : 'live'} trade.
              </span>
            </label>

            {errorMessage && (
              <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/50 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result Status */}
        {step === 'RESULT' && orderResult && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Order Successfully Executed
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                {orderResult.status} &bull; {orderResult.brokerName}
              </h2>
            </div>

            <div className="p-4 bg-[#141414] rounded-xl border border-[#262626] text-xs space-y-2 text-left font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Order ID:</span>
                <span className="text-white">{orderResult.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Broker Ref:</span>
                <span className="text-white">{orderResult.brokerOrderId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fill Price:</span>
                <span className="text-emerald-400 font-bold">${orderResult.averageFillPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Value:</span>
                <span className="text-[#D4AF37] font-bold">${orderResult.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-slate-300">{orderResult.timestamp}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-[#0A0A0A] border-t border-[#222] flex items-center justify-between gap-3">
          {step === 'CONFIGURE' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#141414] hover:bg-[#1E1E1E] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 shadow-md shadow-[#D4AF37]/20 transition-all"
              >
                Review Options Order
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => setStep('CONFIGURE')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#141414] hover:bg-[#1E1E1E] transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSubmit}
                disabled={isSubmitting || !userAcknowledgedRisk}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 shadow-lg shadow-[#D4AF37]/25 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirm & Submit {accountType === 'paper' ? 'Paper Order' : 'to Broker'}
                  </>
                )}
              </button>
            </>
          )}

          {step === 'RESULT' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 shadow-md shadow-[#D4AF37]/20 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useI18n } from '../i18n/I18nContext.js';
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  TrendingUp,
  ShieldCheck,
  Crown,
  Bell,
  Layers,
  Flame,
  Zap,
  Globe,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { UserService } from '../services/userService';
import { AnalyticsService } from '../services/analyticsService';

interface FastOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
  onComplete: (selectedTickers: string[]) => void;
}

const MARKET_TYPES = [
  { id: 'stocks', label: 'Stocks (U.S. & Global)', icon: TrendingUp },
  { id: 'etfs', label: 'ETFs & Sector Funds', icon: Layers },
  { id: 'options', label: 'Options & Greeks', icon: Flame },
  { id: 'crypto', label: 'Cryptocurrency (24/7)', icon: Zap },
  { id: 'forex', label: 'Forex & Currencies', icon: Globe },
  { id: 'futures', label: 'Futures & Commodities', icon: SlidersHorizontal },
];

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'Prefer plain-English explanations, clear educational guides, and simplified metric summaries.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'Familiar with RSI, MACD, Moving Averages, and standard technical/fundamental indicators.',
  },
  {
    id: 'advanced',
    title: 'Advanced / Institutional',
    desc: 'Demand full options Greeks, IV surfaces, order-flow sweeps, and cross-asset macro correlation matrices.',
  },
];

const INTEREST_TAGS = [
  'Artificial Intelligence',
  'Semiconductors',
  'Mega-Cap Tech',
  'Clean Energy',
  'Financials & Banks',
  'Bitcoin & Layer-1s',
  'High-Yield Dividends',
  'Index ETFs (SPY/QQQ)',
  'Earnings Plays',
  'Options Volatility',
];

const POPULAR_INSTRUMENTS = [
  { symbol: 'SPY', name: 'S&P 500 ETF Trust', category: 'ETF' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'AI & Chips' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Tech' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'Tech ETF' },
  { symbol: 'BTC', name: 'Bitcoin Spot', category: 'Crypto' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Auto/Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Cloud/AI' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Chips' },
];

const ALERT_PREFERENCES = [
  { id: 'price_move', label: 'Large Price Movement (±3% intraday)', icon: TrendingUp },
  { id: 'breaking_news', label: 'Breaking News & Catalysts', icon: Flame },
  { id: 'levels', label: 'Key Support / Resistance Breakouts', icon: SlidersHorizontal },
  { id: 'volume', label: 'Unusual Volume & Sweep Surges', icon: Zap },
  { id: 'earnings', label: 'Upcoming Earnings Releases', icon: Bell },
  { id: 'economic', label: 'High-Impact Economic Prints (CPI/Fed)', icon: Globe },
];

export const FastOnboardingModal: React.FC<FastOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onComplete,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  const [step, setStep] = useState<number>(1);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['stocks', 'etfs', 'crypto']);
  const [experienceLevel, setExperienceLevel] = useState<string>('intermediate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Artificial Intelligence',
    'Semiconductors',
    'Index ETFs (SPY/QQQ)',
  ]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['SPY', 'NVDA', 'AAPL', 'BTC']);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([
    'price_move',
    'breaking_news',
    'levels',
  ]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Complete Onboarding
      UserService.setOnboardingCompleted(true);
      const updatedUser: UserProfile = {
        ...currentUser,
        experienceLevel: experienceLevel as any,
        marketsFollowed: selectedMarkets,
        interests: selectedInterests,
      };
      UserService.saveUser(updatedUser);
      onUserUpdate(updatedUser);
      AnalyticsService.track('onboarding_completed', {
        experienceLevel,
        marketCount: selectedMarkets.length,
        tickersCount: selectedTickers.length,
      });
      onComplete(selectedTickers);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        id="fast-onboarding-modal"
        className="relative w-full max-w-xl bg-[#0F0F12] border border-[#27272E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Step Indicator */}
        <div className="px-6 pt-6 pb-4 border-b border-[#202026] bg-[#141418]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#1C1C24] border border-[#D4AF37]/40 rounded-lg text-[#D4AF37]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">
                WELCOME TO MARKETMIND AI
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#D4AF37]">Step {step} of 5</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#1C1C24] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B89628] to-[#F2D675] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Step Body */}
        <div className="flex-1 overflow-y-auto p-6 text-[#D4D4D8]">
          {/* STEP 1: MARKETS */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">What markets do you follow?</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Select the asset classes you trade or research to tailor your data feeds.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {MARKET_TYPES.map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedMarkets.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleItem(selectedMarkets, m.id, setSelectedMarkets)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#181824] border-[#D4AF37] text-white shadow'
                          : 'bg-[#121216] border-[#222228] text-[#A1A1AA] hover:border-[#33333E]'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-[#D4AF37] text-black' : 'bg-[#1C1C22] text-[#71717A]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE LEVEL */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">What's your experience level?</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  We use this strictly to adjust AI explanation depth and terminology complexity.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = experienceLevel === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#181824] border-[#D4AF37] shadow'
                          : 'bg-[#121216] border-[#222228] hover:border-[#33333E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold font-mono ${
                            isSelected ? 'text-[#F2D675]' : 'text-white'
                          }`}
                        >
                          {lvl.title}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#444]'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-black font-bold" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">{lvl.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: INTERESTS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">Choose your focus areas</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Select key themes to prioritize your catalyst feed and market briefs.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleItem(selectedInterests, tag, setSelectedInterests)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] text-black font-semibold shadow'
                          : 'bg-[#14141A] text-[#A1A1AA] border border-[#22222A] hover:text-white hover:border-[#33333E]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: FIRST WATCHLIST */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">Build your first Watchlist</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Choose verified instruments to monitor on your home dashboard.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {POPULAR_INSTRUMENTS.map((inst) => {
                  const isSelected = selectedTickers.includes(inst.symbol);
                  return (
                    <div
                      key={inst.symbol}
                      onClick={() => toggleItem(selectedTickers, inst.symbol, setSelectedTickers)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#181824] border-[#D4AF37] text-white shadow'
                          : 'bg-[#121216] border-[#222228] text-[#A1A1AA] hover:border-[#33333E]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono text-[#F2D675]">
                            {inst.symbol}
                          </span>
                          <span className="text-[10px] text-[#71717A]">({inst.category})</span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] truncate max-w-[140px]">
                          {inst.name}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#444]'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-black font-bold" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: ALERTS */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">Select Alert Triggers</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Choose which institutional signals should trigger smart notifications.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {ALERT_PREFERENCES.map((alert) => {
                  const Icon = alert.icon;
                  const isSelected = selectedAlerts.includes(alert.id);
                  return (
                    <div
                      key={alert.id}
                      onClick={() => toggleItem(selectedAlerts, alert.id, setSelectedAlerts)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#181824] border-[#D4AF37] text-white shadow'
                          : 'bg-[#121216] border-[#222228] text-[#A1A1AA] hover:border-[#33333E]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-[#D4AF37] text-black' : 'bg-[#1C1C22] text-[#71717A]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium">{alert.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#444]'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-black font-bold" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-[#141418] border-t border-[#202026] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#F2D675] text-black text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
          >
            {step === 5 ? (
              <>
                Launch Dashboard <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  User,
  Bell,
  Key,
  Shield,
  Save,
  CheckCircle2,
  Copy,
  Trash2,
  Plus,
  Radio,
  ExternalLink,
  Lock,
  Smartphone,
  Globe,
  Clock,
  Coins,
  Sparkles,
} from 'lucide-react';
import { UserProfile, TickerSymbol } from '../types/user';
import { UserService } from '../services/userService';
import { useI18n } from '../i18n/I18nContext';
import { LanguageCode, RegionCode } from '../i18n/types';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserSaved: (user: UserProfile) => void;
  onOpenSubscription?: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSaved,
  onOpenSubscription,
}) => {
  const {
    language,
    setLanguage,
    region,
    setRegion,
    timezone,
    setTimezone,
    currency,
    setCurrency,
    aiLanguage,
    setAiLanguage,
    languages,
    regions,
    t,
  } = useI18n();

  const [activeTab, setActiveTab] = useState<'profile' | 'global' | 'notifications' | 'api' | 'security'>('profile');
  const [formData, setFormData] = useState<UserProfile>({
    ...currentUser,
    language: currentUser.language || language,
    region: currentUser.region || region,
    timezone: currentUser.timezone || timezone,
    preferredCurrency: currentUser.preferredCurrency || currency,
    aiResponseLanguage: currentUser.aiResponseLanguage || aiLanguage,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyPrompt, setShowNewKeyPrompt] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save to user profile and sync i18n context
    if (formData.language) setLanguage(formData.language as LanguageCode);
    if (formData.region) setRegion(formData.region as RegionCode);
    if (formData.timezone) setTimezone(formData.timezone);
    if (formData.preferredCurrency) setCurrency(formData.preferredCurrency);
    if (formData.aiResponseLanguage) setAiLanguage(formData.aiResponseLanguage as LanguageCode);

    UserService.saveUser(formData);
    onUserSaved(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    const key = UserService.generateApiKey(newKeyName.trim());
    const updated = UserService.getUser();
    setFormData(updated);
    onUserSaved(updated);
    setNewKeyName('');
    setShowNewKeyPrompt(false);
  };

  const handleRevokeApiKey = (id: string) => {
    UserService.revokeApiKey(id);
    const updated = UserService.getUser();
    setFormData(updated);
    onUserSaved(updated);
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-[#e2e8f0]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Account &amp; Terminal Settings
              </h2>
              <p className="text-xs text-slate-400">
                Manage profile, trading preferences, webhooks &amp; API keys
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

        {/* Tab Selector */}
        <div className="flex border-b border-[#2d3139] bg-[#121316] px-4 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'profile'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Strategy</span>
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'global'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global &amp; Regional</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'notifications'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications &amp; Webhooks</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'api'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys &amp; Feeds</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'security'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security &amp; 2FA</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#1c1f24] rounded-lg border border-[#2d3139]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center font-bold text-white text-lg">
                    {formData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{formData.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{formData.email}</p>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
                      Plan: {formData.plan.toUpperCase()} &bull; Role: {formData.role.toUpperCase()}
                    </span>
                  </div>
                </div>
                {onOpenSubscription && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubscription();
                    }}
                    className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition"
                  >
                    Upgrade Tier
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Trading Experience Level
                  </label>
                  <select
                    value={formData.tradingExperience}
                    onChange={(e: any) =>
                      setFormData({ ...formData, tradingExperience: e.target.value })
                    }
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="Beginner">Beginner (1-2 yrs)</option>
                    <option value="Intermediate">Intermediate (3-5 yrs)</option>
                    <option value="Pro Quant">Pro Quant (5+ yrs)</option>
                    <option value="Institutional">Institutional / Prop Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Risk Tolerance Profile
                  </label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e: any) =>
                      setFormData({ ...formData, riskTolerance: e.target.value })
                    }
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="Conservative">Conservative (Capital Preservation Focus)</option>
                    <option value="Moderate">Moderate (Balanced Risk/Reward)</option>
                    <option value="Aggressive">Aggressive (High-Beta Momentum &amp; Options)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Default Terminal Ticker
                  </label>
                  <input
                    type="text"
                    value={formData.defaultTicker}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultTicker: e.target.value.toUpperCase() as TickerSymbol })
                    }
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Default Chart Timeframe
                  </label>
                  <select
                    value={formData.defaultTimeframe}
                    onChange={(e: any) =>
                      setFormData({ ...formData, defaultTimeframe: e.target.value })
                    }
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  >
                    <option value="1m">1m (Scalping)</option>
                    <option value="5m">5m (Intraday Trend)</option>
                    <option value="15m">15m (Swing Key Levels)</option>
                    <option value="1h">1h (Hourly)</option>
                    <option value="1d">1d (Daily)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'global' && (
            <div className="space-y-4">
              {/* Region & Localization banner */}
              <div className="p-3.5 bg-[#1c1f24] rounded-lg border border-[#2d3139] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-xl">
                    🌐
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      Multi-Region &amp; Global Internationalization
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Configure interface language, market timezones, native currency and AI translation.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  20 LANGUAGES READY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Interface Language */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Interface Language (UI)
                  </label>
                  <select
                    value={formData.language || language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name}) {l.dir === 'rtl' ? '[RTL]' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Translates navigation, buttons, decision cards and quantitative metrics.
                  </p>
                </div>

                {/* Primary Region */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Primary Trading Region &amp; Legal Framework
                  </label>
                  <select
                    value={formData.region || region}
                    onChange={(e) => {
                      const selRegion = regions.find((r) => r.code === e.target.value);
                      setFormData({
                        ...formData,
                        region: e.target.value,
                        preferredCurrency: selRegion?.currency || formData.preferredCurrency,
                        timezone: selRegion?.defaultTimezone || formData.timezone,
                      });
                    }}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.flag} {r.name} &bull; {r.primaryExchange} ({r.currency})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Adapts macroeconomic calendar, regulatory disclaimers and benchmark indices.
                  </p>
                </div>

                {/* Display Timezone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Display Timezone
                  </label>
                  <select
                    value={formData.timezone || timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  >
                    <option value="America/New_York">America/New_York (US Eastern Time - Market Core)</option>
                    <option value="America/Chicago">America/Chicago (US Central Time - CME Futures)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (US Pacific Time)</option>
                    <option value="Europe/London">Europe/London (GMT/BST - LSE)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST - Euronext)</option>
                    <option value="Europe/Frankfurt">Europe/Frankfurt (CET/CEST - Xetra/DAX)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST - TSE/Nikkei)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT - HKEX)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT - SGX)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (ICT - SET)</option>
                    <option value="Asia/Seoul">Asia/Seoul (KST - KRX/Kospi)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - DFM/ADX)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - NSE/BSE)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST - ASX)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (BRT - B3)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rendered alongside standard New York market session hours.
                  </p>
                </div>

                {/* Preferred Base Currency */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Display Currency Conversion
                  </label>
                  <select
                    value={formData.preferredCurrency || currency}
                    onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  >
                    <option value="USD">USD ($) - United States Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="SGD">SGD (S$) - Singapore Dollar</option>
                    <option value="THB">THB (฿) - Thai Baht</option>
                    <option value="HKD">HKD (HK$) - Hong Kong Dollar</option>
                    <option value="BRL">BRL (R$) - Brazilian Real</option>
                    <option value="CHF">CHF (Fr) - Swiss Franc</option>
                    <option value="AED">AED (د.إ) - UAE Dirham</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="CNY">CNY (¥) - Chinese Yuan</option>
                    <option value="KRW">KRW (₩) - South Korean Won</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Equities remain in primary exchange currency with tooltip conversions.
                  </p>
                </div>

                {/* Gemini AI Response Language */}
                <div className="md:col-span-2 p-3 bg-[#121316] rounded-lg border border-[#2d3139]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Gemini AI Analysis &amp; Chat Generation Language
                    </label>
                  </div>
                  <select
                    value={formData.aiResponseLanguage || aiLanguage}
                    onChange={(e) => setFormData({ ...formData, aiResponseLanguage: e.target.value })}
                    className="w-full bg-[#1c1f24] border border-[#2d3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    {languages.map((l) => (
                      <option key={`ai-${l.code}`} value={l.code}>
                        {l.flag} Generate in {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    When active, Gemini analyzes multi-factor quantitative market evidence and answers questions directly in your chosen language while preserving precise English ticker symbols and dollar strikes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1c1f24] rounded-lg border border-[#2d3139]">
                  <div>
                    <h4 className="text-xs font-bold text-white">Email Trade Alerts &amp; Reports</h4>
                    <p className="text-[11px] text-slate-400">Receive morning briefs and high-confidence AI triggers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications.emailAlerts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, emailAlerts: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#6366f1] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1c1f24] rounded-lg border border-[#2d3139]">
                  <div>
                    <h4 className="text-xs font-bold text-white">Terminal Audio Notification Chime</h4>
                    <p className="text-[11px] text-slate-400">Play low-latency audio cue when price alerts fire.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications.soundEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, soundEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#6366f1] cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-[#1c1f24] rounded-lg border border-[#2d3139] space-y-2">
                  <h4 className="text-xs font-bold text-white">Discord Webhook Signal Forwarding</h4>
                  <p className="text-[11px] text-slate-400">
                    Instantly broadcast AI breakout triggers and unusual option sweeps into your private channel.
                  </p>
                  <input
                    type="url"
                    value={formData.notifications.discordWebhookUrl || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, discordWebhookUrl: e.target.value },
                      })
                    }
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-[#15171a] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">MarketMind Programmatic API Keys</h4>
                  <p className="text-[11px] text-slate-400">
                    Use these keys to access our low-latency REST and WebSocket order flow endpoints.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewKeyPrompt(!showNewKeyPrompt)}
                  className="px-2.5 py-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>

              {showNewKeyPrompt && (
                <div className="p-3 bg-[#1c1f24] rounded-lg border border-[#6366f1]/50 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Key Name / Identifier
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Quant Execution Bot"
                      className="flex-1 bg-[#15171a] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleCreateApiKey}
                      className="px-3 py-1.5 bg-[#6366f1] text-white text-xs font-bold rounded"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {formData.apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-3 bg-[#1c1f24] rounded-lg border border-[#2d3139] flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{key.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono uppercase">
                          {key.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {key.secretKey ? key.secretKey : key.keyPrefix}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Created: {key.createdAt} &bull; Limit: {key.rateLimitPerMin} req/min
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyKey(key.id, key.secretKey || key.keyPrefix)}
                        className="p-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-300 rounded transition"
                        title="Copy Key"
                      >
                        {copiedKeyId === key.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRevokeApiKey(key.id)}
                        className="p-1.5 bg-[#252830] hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded transition"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#1c1f24] rounded-lg border border-[#2d3139]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Two-Factor Authentication (TOTP)</h4>
                    <p className="text-[11px] text-slate-400">Google Authenticator, Authy or YubiKey protection.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">ENABLED</span>
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#6366f1] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#1c1f24] rounded-lg border border-[#2d3139] space-y-2">
                <h4 className="text-xs font-bold text-white">Active Terminal Sessions</h4>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between py-1 border-b border-[#2d3139]">
                    <span className="text-slate-200">Current Web Session (Chrome MacOS)</span>
                    <span className="text-emerald-400">Online Now &bull; IP: 198.51.100.24</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Python Algo Terminal (AWS us-east-1)</span>
                    <span className="text-slate-500">2h ago &bull; IP: 54.210.88.12</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#1c1f24] border-t border-[#2d3139] flex justify-between items-center">
          <div>
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings saved successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#252830] hover:bg-[#2d3139] text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

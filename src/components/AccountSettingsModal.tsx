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
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  LogOut,
} from 'lucide-react';
import { UserProfile, TickerSymbol } from '../types/user';
import { UserService } from '../services/userService';
import { useI18n } from '../i18n/I18nContext';
import { LanguageCode, RegionCode } from '../i18n/types';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserSaved: (user: UserProfile) => void;
  onOpenSubscription?: () => void;
  onSignOut: () => void | Promise<void>;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSaved,
  onOpenSubscription,
  onSignOut,
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

  const { theme, setTheme, resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'global' | 'notifications' | 'ai' | 'api' | 'security' | 'data_export'>('appearance');
  const [formData, setFormData] = useState<UserProfile>({
    ...currentUser,
    language: currentUser.language || language,
    region: currentUser.region || region,
    timezone: currentUser.timezone || timezone,
    preferredCurrency: currentUser.preferredCurrency || currency,
    aiResponseLanguage: currentUser.aiResponseLanguage || aiLanguage,
    themePreference: currentUser.themePreference || theme,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyPrompt, setShowNewKeyPrompt] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save to user profile and sync i18n & theme context
    if (formData.language) setLanguage(formData.language as LanguageCode);
    if (formData.region) setRegion(formData.region as RegionCode);
    if (formData.timezone) setTimezone(formData.timezone);
    if (formData.preferredCurrency) setCurrency(formData.preferredCurrency);
    if (formData.aiResponseLanguage) setAiLanguage(formData.aiResponseLanguage as LanguageCode);
    if (formData.themePreference) setTheme(formData.themePreference);

    UserService.saveUser(formData);
    onUserSaved(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setFormData({ ...formData, themePreference: mode });
    setTheme(mode);
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
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl text-[var(--text-primary)]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[var(--surface-secondary)] border-b border-[var(--border-primary)] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] flex items-center justify-center text-[var(--accent-gold)] font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                Account &amp; Terminal Settings
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage appearance themes, trading profile, localization &amp; API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border-primary)] bg-[var(--background-secondary)] px-4 gap-1 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'appearance'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance &amp; Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'profile'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Strategy</span>
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'global'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global &amp; Regional</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'notifications'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications &amp; Webhooks</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'ai'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Reasoning</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'api'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys &amp; Feeds</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'security'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security &amp; 2FA</span>
          </button>
          <button
            onClick={() => setActiveTab('data_export')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'data_export'
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Data &amp; Privacy</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* ----------------- APPEARANCE & THEME TAB ----------------- */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Banner */}
              <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] flex items-center justify-center text-[var(--accent-gold)]">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                      <span>MarketMind Dual-Theme Design Engine</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border border-[var(--accent-gold-border)]">
                        DAY &amp; NIGHT
                      </span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Switch effortlessly between High-End Night Mode (deep black &amp; metallic gold) and Professional Day Mode (clean white &amp; soft gray).
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] font-mono text-[var(--accent-gold)] font-bold block">
                    ACTIVE: {resolvedTheme === 'dark' ? 'NIGHT' : 'DAY'}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    Mode: {formData.themePreference || theme}
                  </span>
                </div>
              </div>

              {/* Theme Options Cards */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-2.5">
                  Select Terminal Visual Theme
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: System */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('system')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      (formData.themePreference || theme) === 'system'
                        ? 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)] shadow-md'
                        : 'bg-[var(--surface-secondary)] border-[var(--border-primary)] hover:border-[var(--border-gold)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-gold)]">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          (formData.themePreference || theme) === 'system'
                            ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                            : 'border-[var(--border-primary)]'
                        }`}>
                          {(formData.themePreference || theme) === 'system' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        Use Device Setting
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                        Automatically mirrors your operating system (macOS/Windows/Linux/iOS) dark or light preference.
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>Dynamic Auto-Sync</span>
                    </div>
                  </button>

                  {/* Option 2: Day Mode */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('light')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      (formData.themePreference || theme) === 'light'
                        ? 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)] shadow-md ring-1 ring-[var(--accent-gold)]'
                        : 'bg-[var(--surface-secondary)] border-[var(--border-primary)] hover:border-[var(--border-gold)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-600 shadow-sm">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          (formData.themePreference || theme) === 'light'
                            ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                            : 'border-[var(--border-primary)]'
                        }`}>
                          {(formData.themePreference || theme) === 'light' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>Day Mode</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/15 text-amber-700 font-mono font-bold rounded">
                          LIGHT
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                        Clean white background, soft gray cards, dark charcoal typography with warm metallic gold accents.
                      </p>
                    </div>

                    {/* Color Swatch Preview */}
                    <div className="mt-4 pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-[#FFFFFF] border border-slate-300" title="#FFFFFF" />
                      <div className="w-3.5 h-3.5 rounded bg-[#F1F3F5] border border-slate-300" title="#F1F3F5" />
                      <div className="w-3.5 h-3.5 rounded bg-[#B58A18]" title="#B58A18 Gold" />
                      <div className="w-3.5 h-3.5 rounded bg-[#16A34A]" title="#16A34A Green" />
                      <div className="w-3.5 h-3.5 rounded bg-[#DC2626]" title="#DC2626 Red" />
                    </div>
                  </button>

                  {/* Option 3: Night Mode */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('dark')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      (formData.themePreference || theme) === 'dark'
                        ? 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)] shadow-md ring-1 ring-[var(--accent-gold)]'
                        : 'bg-[var(--surface-secondary)] border-[var(--border-primary)] hover:border-[var(--border-gold)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-black border border-[#333] flex items-center justify-center text-[#FFD700] shadow-sm">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          (formData.themePreference || theme) === 'dark'
                            ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                            : 'border-[var(--border-primary)]'
                        }`}>
                          {(formData.themePreference || theme) === 'dark' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>Night Mode</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#FFD700]/20 text-[#FFD700] font-mono font-bold rounded">
                          PRIMARY
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                        Deep black canvas (#080808), charcoal cards (#181818), metallic gold accents and luminous text.
                      </p>
                    </div>

                    {/* Color Swatch Preview */}
                    <div className="mt-4 pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-[#080808] border border-neutral-700" title="#080808" />
                      <div className="w-3.5 h-3.5 rounded bg-[#181818] border border-neutral-700" title="#181818" />
                      <div className="w-3.5 h-3.5 rounded bg-[#D4AF37]" title="#D4AF37 Gold" />
                      <div className="w-3.5 h-3.5 rounded bg-[#22C55E]" title="#22C55E Green" />
                      <div className="w-3.5 h-3.5 rounded bg-[#EF4444]" title="#EF4444 Red" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme Settings Details Card */}
              <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  Theme Behavior &amp; Accessibility Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[var(--surface-primary)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                      <span>Smooth 200–300ms Transitions</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Instant zero-reload theme toggling with smooth transitions across all cards, navigation bars, modals, tables, and buttons.
                    </p>
                  </div>

                  <div className="p-3 bg-[var(--surface-primary)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WCAG AA Contrast Compliant</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Carefully balanced gold and neutral tones ensure legibility on both deep black and crisp white canvases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- PROFILE TAB ----------------- */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Display Name / Trader Handle
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Trading Risk Tolerance
                  </label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e: any) =>
                      setFormData({ ...formData, riskTolerance: e.target.value })
                    }
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="Conservative">Conservative (Capital Preservation Focus)</option>
                    <option value="Moderate">Moderate (Balanced Risk/Reward)</option>
                    <option value="Aggressive">Aggressive (Maximum Alpha / Growth)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Default Chart Timeframe
                  </label>
                  <select
                    value={formData.defaultTimeframe}
                    onChange={(e: any) =>
                      setFormData({ ...formData, defaultTimeframe: e.target.value })
                    }
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] font-mono"
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

          {/* ----------------- GLOBAL & REGIONAL TAB ----------------- */}
          {activeTab === 'global' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] flex items-center justify-center text-xl">
                    🌐
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                      Multi-Region &amp; Global Internationalization
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Configure interface language, market timezones, native currency and AI translation.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/40">
                  20 LANGUAGES READY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Interface Language (UI)
                  </label>
                  <select
                    value={formData.language || language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name}) {l.dir === 'rtl' ? '[RTL]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
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
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.flag} {r.name} &bull; {r.primaryExchange} ({r.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Display Timezone
                  </label>
                  <select
                    value={formData.timezone || timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] font-mono"
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
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Display Currency Conversion
                  </label>
                  <select
                    value={formData.preferredCurrency || currency}
                    onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] font-mono"
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
                </div>
              </div>
            </div>
          )}

          {/* ----------------- NOTIFICATIONS TAB ----------------- */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Browser Push Alerts</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Instant alerts for target price reaches &amp; AI bias shifts.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.pushAlerts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, pushAlerts: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Daily Pre-Market Intelligence Briefing</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Delivered to your email daily at 08:30 ET before market open.</p>
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
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Terminal Audio Notification Chime</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Play low-latency audio cue when price alerts fire.</p>
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
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ----------------- API KEYS TAB ----------------- */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Programmatic API Keys</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Access our low-latency REST and WebSocket order flow endpoints.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewKeyPrompt(!showNewKeyPrompt)}
                  className="px-2.5 py-1 bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-bright)] text-[var(--text-inverse)] text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>

              {showNewKeyPrompt && (
                <div className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-gold)] space-y-2">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Key Name / Identifier
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Quant Execution Bot"
                      className="flex-1 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <button
                      onClick={handleCreateApiKey}
                      className="px-3 py-1.5 bg-[var(--accent-gold)] text-[var(--text-inverse)] text-xs font-bold rounded"
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
                    className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{key.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono uppercase">
                          {key.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                        {key.secretKey ? key.secretKey : key.keyPrefix}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        Created: {key.createdAt} &bull; Limit: {key.rateLimitPerMin} req/min
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyKey(key.id, key.secretKey || key.keyPrefix)}
                        className="p-1.5 bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition"
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
                        className="p-1.5 bg-[var(--surface-primary)] hover:bg-rose-950/50 hover:text-rose-400 text-[var(--text-muted)] rounded transition"
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

          {/* ----------------- SECURITY TAB ----------------- */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Two-Factor Authentication (TOTP)</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">Google Authenticator, Authy or YubiKey protection.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">ENABLED</span>
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------- AI PREFERENCES TAB ----------------- */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
                  <span>Gemini Financial Intelligence Reasoning Depth</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[var(--surface-primary)] rounded-lg border border-[var(--accent-gold)]/40 flex flex-col justify-between">
                    <div className="font-bold text-[var(--accent-gold)]">Standard Multi-Factor (Fast)</div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Synthesizes technical, sentiment, and macro drivers in sub-second streaming speed.
                    </p>
                    <span className="text-[10px] text-emerald-400 font-mono mt-2 font-bold">ACTIVE (DEFAULT)</span>
                  </div>
                  <div className="p-3 bg-[var(--surface-primary)] rounded-lg border border-[var(--border-primary)] flex flex-col justify-between">
                    <div className="font-bold text-[var(--text-primary)]">Deep Grounded Institutional Audit</div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Performs full cross-verification against SEC filings, options chains, and intermarket yield curve ratios.
                    </p>
                    <span className="text-[10px] text-[var(--accent-gold)] font-mono mt-2 font-bold">PRO &amp; ENTERPRISE</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Plain English Translation Mode</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Include simple analogies alongside quantitative metrics for non-institutional traders.</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ----------------- DATA & PRIVACY TAB ----------------- */}
          {activeTab === 'data_export' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Export Watchlists &amp; Trading Journals</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">Download all saved tickers, notes, custom alert triggers, and backtest results.</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const jsonBlob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(jsonBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `marketmind-data-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                    }}
                    className="px-3 py-1.5 bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-primary)] rounded-lg transition"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = 'data:text/csv;charset=utf-8,Symbol,AssetClass,AlertCount\nSPY,ETF,4\nQQQ,ETF,3\nNVDA,STOCK,8\nBTC,CRYPTO,12\n';
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', 'marketmind-watchlists.csv');
                      document.body.appendChild(link);
                      link.click();
                    }}
                    className="px-3 py-1.5 bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-primary)] rounded-lg transition"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-primary)] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Anonymous Usage Telemetry &amp; Crash Reports</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Help us improve terminal stability. No financial data, portfolio values, or API keys are ever collected.</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--surface-secondary)] border-t border-[var(--border-primary)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onSignOut}
              className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings &amp; Theme saved successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] text-xs font-semibold rounded-lg border border-[var(--border-primary)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 gold-gradient-btn text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
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

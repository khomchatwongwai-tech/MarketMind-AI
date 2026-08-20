import { LanguageSelector } from './LanguageSelector.js';
import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  LayoutDashboard,
  LineChart,
  Target,
  Globe2,
  PieChart,
  Layers,
  Calendar,
  Newspaper,
  BotMessageSquare,
  Calculator,
  History,
  ShieldAlert,
  ListPlus,
  Bell,
  FileText,
  HelpCircle,
  Activity,
  ShieldCheck,
  Briefcase,
  Users,
  Sparkles,
  Menu,
  X,
  Search,
  Crown,
  ChevronRight,
} from 'lucide-react';

import { UserProfile } from '../types/user';

export type ActiveTab =
  | 'overview'
  | 'scanner'
  | 'research'
  | 'multi_asset_markets'
  | 'connected_portfolio'
  | 'technicals'
  | 'support_resistance'
  | 'breadth_intermarket'
  | 'sectors'
  | 'options'
  | 'economic_fed'
  | 'news'
  | 'community'
  | 'chat'
  | 'watchlists'
  | 'saved_alerts'
  | 'prediction_history'
  | 'export_reports'
  | 'simulator'
  | 'backtest'
  | 'alerts_ml'
  | 'help_center'
  | 'status_page'
  | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  setupQuality: string;
  breadthStatus: string;
  currentUser?: UserProfile | null;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  onOpenSubscription?: () => void;
  onOpenSettings?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  setupQuality,
  breadthStatus,
  currentUser,
  isMenuOpen: externalIsMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenSubscription,
  onOpenSettings,
}) => {
  const { t } = useI18n();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  const isMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalMenuOpen;
  const toggleMenu = () => {
    if (onToggleMenu) onToggleMenu();
    else setInternalMenuOpen(!internalMenuOpen);
  };
  const closeMenu = () => {
    if (onCloseMenu) onCloseMenu();
    else setInternalMenuOpen(false);
  };

  const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string; category: string; adminOnly?: boolean }[] = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard, category: 'Core' },
    { id: 'scanner', label: 'Market Scanner', icon: Search, badge: '5000+ UNIVERSE', category: 'Markets' },
    { id: 'research', label: 'Deep Research', icon: Sparkles, badge: 'NEW AI', category: 'Core' },
    { id: 'multi_asset_markets', label: 'Multi-Asset Markets', icon: Globe2, badge: 'UNIVERSAL', category: 'Markets' },
    { id: 'connected_portfolio', label: 'Connected Accounts', icon: Briefcase, badge: 'PORTFOLIO', category: 'Portfolio' },
    { id: 'technicals', label: t('nav.technical'), icon: LineChart, category: 'Quant Engine' },
    { id: 'support_resistance', label: t('nav.supportResistance'), icon: Target, category: 'Quant Engine' },
    { id: 'breadth_intermarket', label: t('nav.breadth'), icon: Globe2, badge: breadthStatus.split(' ')[0], category: 'Markets' },
    { id: 'sectors', label: t('nav.heatmap'), icon: PieChart, category: 'Markets' },
    { id: 'options', label: 'Options Trader', icon: Layers, badge: 'AI TRADER', category: 'Quant Engine' },
    { id: 'economic_fed', label: t('nav.economic'), icon: Calendar, category: 'Macro' },
    { id: 'news', label: 'News & Macro Intelligence', icon: Newspaper, badge: '17 FEEDS', category: 'Macro' },
    { id: 'community', label: 'Community Feed', icon: Users, badge: 'Social', category: 'Social' },
    { id: 'chat', label: t('nav.chat'), icon: BotMessageSquare, badge: 'AI', category: 'AI Intelligence' },
    { id: 'watchlists', label: t('nav.watchlists'), icon: ListPlus, category: 'Portfolio' },
    { id: 'saved_alerts', label: t('nav.alerts'), icon: Bell, category: 'Signals' },
    { id: 'prediction_history', label: t('nav.history'), icon: History, badge: 'ACCURACY', category: 'Intelligence' },
    { id: 'export_reports', label: t('nav.reports'), icon: FileText, badge: 'PDF', category: 'Tools' },
    { id: 'simulator', label: t('nav.simulator'), icon: Calculator, category: 'Tools' },
    { id: 'backtest', label: t('nav.backtest'), icon: History, category: 'Tools' },
    { id: 'alerts_ml', label: 'Signals & ML Store', icon: ShieldAlert, category: 'Signals' },
    { id: 'help_center', label: t('nav.help'), icon: HelpCircle, category: 'System' },
    { id: 'status_page', label: t('nav.systemStatus'), icon: Activity, badge: 'HEALTH', category: 'System' },
    ...(isAdminUser ? [{ id: 'admin' as ActiveTab, label: t('nav.admin'), icon: ShieldCheck, badge: 'ADMIN', category: 'Admin' }] : []),
  ];

  const filteredTabs = tabs.filter(
    (tab) =>
      tab.label.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      tab.category.toLowerCase().includes(drawerSearch.toLowerCase())
  );

  return (
    <>
      {/* 1. Desktop High-Density Navigation Bar (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 border-b border-[var(--border-primary)] scrollbar-none text-xs font-semibold select-none bg-[var(--background-secondary)] p-1 rounded-lg shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all duration-200 relative border cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border-[var(--accent-gold)] font-bold shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                    tab.badge === 'ADMIN'
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40'
                      : tab.badge === 'AI' || tab.badge === 'PDF'
                      ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border border-[var(--accent-gold-border)]'
                      : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 2. Mobile Fixed Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-[#1C1C1C] px-3 py-1.5 flex items-center justify-around text-[10px] font-mono select-none shadow-2xl pb-safe">
        {/* HOME */}
        <button
          onClick={() => {
            onTabChange('overview');
            closeMenu();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeTab === 'overview' && !isMenuOpen
              ? 'text-[#F2D675] font-bold'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 ${
              activeTab === 'overview' && !isMenuOpen ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'
            }`}
          />
          <span className="tracking-tight uppercase">HOME</span>
        </button>

        {/* PORTFOLIO */}
        <button
          onClick={() => {
            onTabChange('connected_portfolio');
            closeMenu();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeTab === 'connected_portfolio' && !isMenuOpen
              ? 'text-[#F2D675] font-bold'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          <Briefcase
            className={`w-4 h-4 ${
              activeTab === 'connected_portfolio' && !isMenuOpen
                ? 'text-[#D4AF37]'
                : 'text-[#9CA3AF]'
            }`}
          />
          <span className="tracking-tight uppercase">PORTFOLIO</span>
        </button>

        {/* RESEARCH */}
        <button
          onClick={() => {
            onTabChange('research');
            closeMenu();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeTab === 'research' && !isMenuOpen
              ? 'text-[#F2D675] font-bold'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          <Sparkles
            className={`w-4 h-4 ${
              activeTab === 'research' && !isMenuOpen ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'
            }`}
          />
          <span className="tracking-tight uppercase">RESEARCH</span>
        </button>

        {/* ALERTS */}
        <button
          onClick={() => {
            onTabChange('saved_alerts');
            closeMenu();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeTab === 'saved_alerts' && !isMenuOpen
              ? 'text-[#F2D675] font-bold'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          <Bell
            className={`w-4 h-4 ${
              activeTab === 'saved_alerts' && !isMenuOpen ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'
            }`}
          />
          <span className="tracking-tight uppercase">ALERTS</span>
        </button>

        {/* MENU */}
        <button
          onClick={toggleMenu}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            isMenuOpen ? 'text-[#F2D675] font-bold' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          <Menu className={`w-4 h-4 ${isMenuOpen ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'}`} />
          <span className="tracking-tight uppercase">MENU</span>
        </button>
      </div>

      {/* 3. Mobile Slide-Over Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#242424] bg-[#0F0F0F]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-[#8C6B18] via-[#D4AF37] to-[#FFE08A] p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0A0A0A] rounded-[3px] flex items-center justify-center">
                  <span className="gold-gradient-text font-black text-[10px]">M</span>
                </div>
              </div>
              <span className="text-sm font-black text-white tracking-wider font-mono">
                TERMINAL DIRECTORY
              </span>
            </div>
            <button
              onClick={closeMenu}
              className="p-1.5 rounded-lg bg-[#151515] border border-[#242424] text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-3 border-b border-[#1C1C1C] bg-[#0A0A0A]">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-[#242424] rounded-xl">
              <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
              <input
                type="text"
                placeholder="Search terminal views..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-[#6B7280] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Language Selector in Mobile Drawer */
          <div className="px-4 py-2 bg-[#121212] border-b border-[#1C1C1C]">
            <LanguageSelector variant="mobile-row" />
          </div>

          /* Quick Subscription / Plan Banner */}
          {currentUser && (
            <div className="px-4 py-2.5 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold font-mono text-white">
                  Plan: {currentUser.planTier}
                </span>
              </div>
              {onOpenSubscription && (
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenSubscription();
                  }}
                  className="px-2.5 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F2D675] text-[10px] font-bold rounded-lg font-mono"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}

          {/* All Views Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 pb-20 divide-y divide-[#181818]">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    closeMenu();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#181818] border border-[#D4AF37]/40 text-white font-bold'
                      : 'hover:bg-[#121212] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive ? 'bg-[#D4AF37]/20 text-[#F2D675]' : 'bg-[#141414] text-[#9CA3AF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">{tab.label}</span>
                      <span className="text-[10px] text-[#6B7280] font-mono">{tab.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[#D4AF37]/15 text-[#F2D675] border border-[#D4AF37]/30">
                        {tab.badge}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};


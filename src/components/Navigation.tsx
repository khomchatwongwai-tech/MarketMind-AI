import React from 'react';
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
} from 'lucide-react';

import { UserProfile } from '../types/user';

export type ActiveTab =
  | 'overview'
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
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  setupQuality,
  breadthStatus,
  currentUser,
}) => {
  const { t } = useI18n();

  const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string; adminOnly?: boolean }[] = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'multi_asset_markets', label: 'Multi-Asset Markets', icon: Globe2, badge: 'UNIVERSAL' },
    { id: 'connected_portfolio', label: 'Connected Accounts', icon: Briefcase, badge: 'PORTFOLIO' },
    { id: 'technicals', label: t('nav.technical'), icon: LineChart },
    { id: 'support_resistance', label: t('nav.supportResistance'), icon: Target },
    { id: 'breadth_intermarket', label: t('nav.breadth'), icon: Globe2, badge: breadthStatus.split(' ')[0] },
    { id: 'sectors', label: t('nav.heatmap'), icon: PieChart },
    { id: 'options', label: 'Options Trader', icon: Layers, badge: 'AI TRADER' },
    { id: 'economic_fed', label: t('nav.economic'), icon: Calendar },
    { id: 'news', label: 'News & Macro Intelligence', icon: Newspaper, badge: '17 FEEDS' },
    { id: 'community', label: 'Community Feed', icon: Users, badge: 'SOCIAL' },
    { id: 'chat', label: t('nav.chat'), icon: BotMessageSquare, badge: 'AI' },
    { id: 'watchlists', label: t('nav.watchlists'), icon: ListPlus },
    { id: 'saved_alerts', label: t('nav.alerts'), icon: Bell },
    { id: 'prediction_history', label: t('nav.history'), icon: History, badge: 'ACCURACY' },
    { id: 'export_reports', label: t('nav.reports'), icon: FileText, badge: 'PDF' },
    { id: 'simulator', label: t('nav.simulator'), icon: Calculator },
    { id: 'backtest', label: t('nav.backtest'), icon: History },
    { id: 'alerts_ml', label: 'Signals & ML Store', icon: ShieldAlert },
    { id: 'help_center', label: t('nav.help'), icon: HelpCircle },
    { id: 'status_page', label: t('nav.systemStatus'), icon: Activity, badge: 'HEALTH' },
    ...(isAdminUser ? [{ id: 'admin' as ActiveTab, label: t('nav.admin'), icon: ShieldCheck, badge: 'ADMIN' }] : []),
  ];

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 border-b border-[var(--border-primary)] scrollbar-none text-xs font-semibold select-none bg-[var(--background-secondary)] p-1 rounded-lg shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all duration-200 relative border ${
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
  );
};

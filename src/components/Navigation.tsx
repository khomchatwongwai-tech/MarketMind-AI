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
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'technicals'
  | 'support_resistance'
  | 'breadth_intermarket'
  | 'sectors'
  | 'options'
  | 'economic_fed'
  | 'news'
  | 'chat'
  | 'simulator'
  | 'backtest'
  | 'alerts_ml'
  | 'watchlists'
  | 'saved_alerts'
  | 'prediction_history'
  | 'export_reports'
  | 'help_center'
  | 'status_page'
  | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  setupQuality: string;
  breadthStatus: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  setupQuality,
  breadthStatus,
}) => {
  const { t } = useI18n();

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'technicals', label: t('nav.technical'), icon: LineChart },
    { id: 'support_resistance', label: t('nav.supportResistance'), icon: Target },
    { id: 'breadth_intermarket', label: t('nav.breadth'), icon: Globe2, badge: breadthStatus.split(' ')[0] },
    { id: 'sectors', label: t('nav.heatmap'), icon: PieChart },
    { id: 'options', label: t('nav.options'), icon: Layers },
    { id: 'economic_fed', label: t('nav.economic'), icon: Calendar },
    { id: 'news', label: t('nav.news'), icon: Newspaper },
    { id: 'chat', label: t('nav.chat'), icon: BotMessageSquare, badge: 'AI' },
    { id: 'watchlists', label: t('nav.watchlists'), icon: ListPlus },
    { id: 'saved_alerts', label: t('nav.alerts'), icon: Bell },
    { id: 'prediction_history', label: t('nav.history'), icon: History, badge: '71%' },
    { id: 'export_reports', label: t('nav.reports'), icon: FileText, badge: 'PDF' },
    { id: 'simulator', label: t('nav.simulator'), icon: Calculator },
    { id: 'backtest', label: t('nav.backtest'), icon: History },
    { id: 'alerts_ml', label: 'Signals & ML Store', icon: ShieldAlert },
    { id: 'help_center', label: t('nav.help'), icon: HelpCircle },
    { id: 'status_page', label: t('nav.systemStatus'), icon: Activity, badge: '99.9%' },
    { id: 'admin', label: t('nav.admin'), icon: ShieldCheck, badge: 'ADMIN' },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 border-b border-[#2d3139] scrollbar-none text-xs font-semibold select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t whitespace-nowrap transition-colors relative ${
              isActive
                ? 'bg-[#1c1f24] text-white border-t-2 border-[#6366f1] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#15171a]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#818cf8]' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                  tab.badge === 'ADMIN'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : tab.badge === 'AI' || tab.badge === 'PDF'
                    ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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

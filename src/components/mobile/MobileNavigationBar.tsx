import React from 'react';
import {
  TrendingUp,
  Search,
  Star,
  Briefcase,
  Sparkles,
  Newspaper,
} from 'lucide-react';

export type MobileTab = 'MARKETS' | 'SEARCH' | 'WATCHLIST' | 'PORTFOLIO' | 'AI_CHAT' | 'NEWS';

interface MobileNavigationBarProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  watchlistCount?: number;
}

export const MobileNavigationBar: React.FC<MobileNavigationBarProps> = ({
  activeTab,
  onSelectTab,
  watchlistCount = 0,
}) => {
  const tabs: Array<{ id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'MARKETS', label: 'Markets', icon: TrendingUp },
    { id: 'SEARCH', label: 'Search 5K+', icon: Search },
    { id: 'WATCHLIST', label: 'Watchlist', icon: Star, badge: watchlistCount },
    { id: 'PORTFOLIO', label: 'Portfolio', icon: Briefcase },
    { id: 'NEWS', label: 'News', icon: Newspaper },
    { id: 'AI_CHAT', label: 'AI Mind', icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1017]/95 backdrop-blur-lg border-t border-[#1c2230] pb-[env(safe-area-inset-bottom,8px)] pt-1.5 px-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
                isActive
                  ? 'text-[#D4AF37] scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#D4AF37] text-black font-bold text-[9px] rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

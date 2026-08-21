import { useI18n } from '../i18n/I18nContext.js';
import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Info,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  SmartAlertEngine,
  SmartNotification,
  AlertCategory,
  AlertSeverity,
} from '../services/smartAlertEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

const CATEGORIES: { id: AlertCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Notifications' },
  { id: 'MARKET', label: 'Market' },
  { id: 'WATCHLIST', label: 'Watchlist' },
  { id: 'NEWS', label: 'News' },
  { id: 'ECONOMIC', label: 'Economic' },
  { id: 'EARNINGS', label: 'Earnings' },
  { id: 'OPTIONS', label: 'Options' },
  { id: 'SYSTEM', label: 'System' },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
}) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  const [notifications, setNotifications] = useState<SmartNotification[]>(() =>
    SmartAlertEngine.getNotifications()
  );
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'ALL'>('ALL');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    SmartAlertEngine.markAllAsRead();
    setNotifications(SmartAlertEngine.getNotifications());
  };

  const handleMarkOneRead = (id: string) => {
    SmartAlertEngine.markAsRead(id);
    setNotifications(SmartAlertEngine.getNotifications());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SmartAlertEngine.deleteNotification(id);
    setNotifications(SmartAlertEngine.getNotifications());
  };

  const handleClearAll = () => {
    SmartAlertEngine.clearAll();
    setNotifications([]);
  };

  const filtered = notifications.filter((n) => {
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (filterUnreadOnly && n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3" /> High
          </span>
        );
      case 'IMPORTANT':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Important
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[#262626] text-[#A3A3A3] border border-[#333333] flex items-center gap-1">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="notification-center-modal"
        className="relative w-full max-w-2xl bg-[#0F0F11] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#141417]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1C1C22] border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  NOTIFICATION CENTER
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D4AF37] text-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Verified real-time triggers, catalyst events, and macro alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#1C1C22] rounded-lg transition-colors flex items-center gap-1 border border-[#2E2E38]"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark All Read
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-1.5 text-[#71717A] hover:text-red-400 hover:bg-[#1C1C22] rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-[#111114] border-b border-[#222228] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#D4AF37] text-black font-semibold shadow-sm'
                    : 'bg-[#18181D] text-[#A1A1AA] hover:text-white hover:bg-[#22222A]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded border-[#333] text-[#D4AF37] focus:ring-0 bg-[#18181D]"
            />
            Unread only
          </label>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#1F1F26]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#71717A] flex flex-col items-center justify-center gap-3">
              <Bell className="w-10 h-10 opacity-30 text-[#D4AF37]" />
              <p className="text-sm font-medium text-white">No notifications matching filters</p>
              <p className="text-xs text-[#71717A] max-w-xs">
                You will receive verified notifications when watchlist thresholds or market catalysts occur.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  handleMarkOneRead(item.id);
                  if (item.symbol && onSelectSymbol) {
                    onSelectSymbol(item.symbol);
                    onClose();
                  }
                }}
                className={`pt-2.5 first:pt-0 group flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-[#121216]/60 border-[#1E1E26] hover:border-[#2D2D38]'
                    : 'bg-[#181822] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(item.severity)}
                    {item.symbol && (
                      <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-[#1C1C26] text-[#F2D675] border border-[#D4AF37]/30">
                        {item.symbol}
                      </span>
                    )}
                    <span className="text-xs font-bold text-white font-mono">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#71717A] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#D4D4D8] leading-relaxed">{item.message}</p>

                <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono pt-1">
                  <span>Source: {item.provider}</span>
                  {item.actionLabel && (
                    <span className="text-[#D4AF37] font-semibold flex items-center gap-0.5 group-hover:underline">
                      {item.actionLabel} <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#141417] border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Spam Cooldown &bull; Verified Institutional Sources</span>
          </div>
          <span className="font-mono">{notifications.length} Total Alerts</span>
        </div>
      </div>
    </div>
  );
};

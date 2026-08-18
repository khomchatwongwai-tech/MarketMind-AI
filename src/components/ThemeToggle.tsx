import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'dropdown' | 'segmented' | 'full';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const options: Array<{ value: ThemeMode; label: string; subLabel: string; icon: React.ElementType }> = [
    { value: 'dark', label: 'Night Mode', subLabel: 'Premium Black & Gold', icon: Moon },
    { value: 'light', label: 'Day Mode', subLabel: 'Clean White & Gold', icon: Sun },
    { value: 'system', label: 'Use Device Setting', subLabel: 'Auto-sync with OS', icon: Laptop },
  ];

  // Segmented control style (for Settings page & Modals)
  if (variant === 'segmented') {
    return (
      <div className={`grid grid-cols-3 gap-2 p-1 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-xl ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-semibold transition-all relative ${
                isSelected
                  ? 'bg-[var(--surface-primary)] text-[var(--accent-gold)] border border-[var(--border-gold)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'}`} />
              <span>{opt.label}</span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 font-normal">
                {opt.value === 'dark' ? 'Night' : opt.value === 'light' ? 'Day' : 'Auto'}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Full radio style (for Appearance section in Settings)
  if (variant === 'full') {
    return (
      <div className={`space-y-2 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)] text-[var(--text-primary)]'
                  : 'bg-[var(--surface-primary)] border-[var(--border-primary)] hover:border-[var(--border-gold)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  isSelected
                    ? 'bg-[var(--surface-primary)] border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-sm'
                    : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border border-[var(--accent-gold-border)]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {opt.subLabel}
                  </div>
                </div>
              </div>

              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                isSelected
                  ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                  : 'border-[var(--border-primary)]'
              }`}>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown style
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] text-xs text-[var(--text-primary)] transition"
          title="Toggle Day / Night Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-[#FFD700]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#B58A18]" />
          )}
          <span className="font-semibold text-[11px] hidden sm:inline">
            {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Night' : 'Day'}
          </span>
          <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
              Visual Theme
            </div>
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-gold)]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Compact 1-click icon toggle (Header / Quick toggle)
  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleTheme}
        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] text-xs transition flex items-center gap-1.5 group"
        title={`Current: ${resolvedTheme === 'dark' ? 'Night Mode' : 'Day Mode'} (Click to switch to ${resolvedTheme === 'dark' ? 'Day' : 'Night'})`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-[#FFD700] group-hover:scale-110 transition-transform" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#B58A18] group-hover:scale-110 transition-transform" />
        )}
        <span className="text-[11px] font-semibold text-[var(--text-primary)] hidden lg:inline">
          {resolvedTheme === 'dark' ? 'Night' : 'Day'}
        </span>
      </button>
    </div>
  );
};

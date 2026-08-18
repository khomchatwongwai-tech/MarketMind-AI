import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { UserService } from '../services/userService';
import { FirestoreService } from '../services/firestoreService';
import { auth } from '../config/firebase';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceHover: string;
  borderPrimary: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  goldPrimary: string;
  goldBright: string;
  marketPositive: string;
  marketNegative: string;
  warning: string;
  chart: {
    background: string;
    textColor: string;
    gridColor: string;
    borderColor: string;
    crosshairColor: string;
    crosshairLabelBg: string;
    upColor: string;
    downColor: string;
    volumeUp: string;
    volumeDown: string;
    vwapColor: string;
    goldColor: string;
  };
}

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

const STORAGE_KEY = 'marketmind_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial theme retrieval (user profile -> localStorage -> system)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const user = UserService.getUser();
      if (user?.themePreference) {
        return user.themePreference;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  // 2. System preference detection
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  // 3. Resolved effective theme ('light' or 'dark')
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  // 4. Update DOM attribute & document classes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [resolvedTheme, isDark]);

  // 5. Change Theme handler & persistence
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      // Persist to user profile
      const user = UserService.getUser();
      if (user) {
        const updated = { ...user, themePreference: newTheme };
        UserService.saveUser(updated);
        if (auth.currentUser && !user.isGuest) {
          FirestoreService.syncUserProfile(updated).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // 6. Comprehensive theme colors object for JS/Canvas/Recharts/Lightweight-charts
  const colors: ThemeColors = useMemo(() => {
    if (isDark) {
      return {
        isDark: true,
        bgPrimary: '#080808',
        bgSecondary: '#111111',
        surfacePrimary: '#181818',
        surfaceSecondary: '#1e1e1e',
        surfaceHover: '#242424',
        borderPrimary: '#2a2a2a',
        borderSubtle: '#1f1f1f',
        textPrimary: '#ffffff',
        textSecondary: '#a7a7a7',
        textMuted: '#737373',
        goldPrimary: '#D4AF37',
        goldBright: '#FFD700',
        marketPositive: '#22C55E',
        marketNegative: '#EF4444',
        warning: '#F59E0B',
        chart: {
          background: '#0d0d0f',
          textColor: '#a7a7a7',
          gridColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: '#2a2a2a',
          crosshairColor: '#D4AF37',
          crosshairLabelBg: '#8C6B18',
          upColor: '#22C55E',
          downColor: '#EF4444',
          volumeUp: 'rgba(34, 197, 94, 0.45)',
          volumeDown: 'rgba(239, 68, 68, 0.45)',
          vwapColor: '#06b6d4',
          goldColor: '#D4AF37',
        },
      };
    } else {
      return {
        isDark: false,
        bgPrimary: '#F8F9FA',
        bgSecondary: '#F1F3F5',
        surfacePrimary: '#FFFFFF',
        surfaceSecondary: '#F4F5F7',
        surfaceHover: '#E9ECEF',
        borderPrimary: '#E2E5E9',
        borderSubtle: '#ECEFF2',
        textPrimary: '#151515',
        textSecondary: '#62666D',
        textMuted: '#8C929C',
        goldPrimary: '#B58A18',
        goldBright: '#D4AF37',
        marketPositive: '#16A34A',
        marketNegative: '#DC2626',
        warning: '#D97706',
        chart: {
          background: '#FFFFFF',
          textColor: '#62666D',
          gridColor: 'rgba(0, 0, 0, 0.06)',
          borderColor: '#E2E5E9',
          crosshairColor: '#B58A18',
          crosshairLabelBg: '#B58A18',
          upColor: '#16A34A',
          downColor: '#DC2626',
          volumeUp: 'rgba(22, 163, 74, 0.45)',
          volumeDown: 'rgba(220, 38, 38, 0.45)',
          vwapColor: '#0284c7',
          goldColor: '#B58A18',
        },
      };
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isDark,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

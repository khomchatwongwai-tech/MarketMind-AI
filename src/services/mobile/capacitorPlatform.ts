/**
 * MarketMind AI - Unified Capacitor & Native Platform Bridge
 * Coordinates base URL resolution, native platform identification, and network connectivity.
 */

export type MobilePlatform = 'ios' | 'android' | 'web';

export class CapacitorPlatform {
  /**
   * Determine if running inside a native Capacitor shell (iOS or Android)
   */
  public static isNative(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    if (win.Capacitor?.isNativePlatform?.()) return true;
    if (win.Capacitor?.getPlatform?.() === 'ios' || win.Capacitor?.getPlatform?.() === 'android') return true;
    return false;
  }

  /**
   * Get the current execution platform
   */
  public static getPlatform(): MobilePlatform {
    if (typeof window === 'undefined') return 'web';
    const win = window as any;
    const capPlatform = win.Capacitor?.getPlatform?.();
    if (capPlatform === 'ios') return 'ios';
    if (capPlatform === 'android') return 'android';
    return 'web';
  }

  /**
   * Get the production or staging API base URL.
   * On Web: Returns explicit VITE_API_BASE_URL if set, or production Render backend URL when hosted on Vercel/production domain.
   * On Native (iOS/Android): Returns absolute HTTPS URL from environment.
   */
  public static getApiBaseUrl(): string {
    // If running in browser on production domain or Vercel preview, route API requests to Render backend
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'getmarketmindai.com' || host.endsWith('.getmarketmindai.com') || host.endsWith('.vercel.app')) {
        return 'https://marketmind-ai.onrender.com';
      }
    }

    const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
    if (isNode && (typeof window === 'undefined' || !window.location?.hostname)) {
      return process.env.APP_URL || 'http://localhost:3000';
    }

    try {
      const meta = import.meta as any;
      const env = meta?.env || {};

      // If explicit API Base URL is configured in environment, use it
      if (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.trim() !== '') {
        return env.VITE_API_BASE_URL.replace(/\/$/, '');
      }

      // If running inside Native Capacitor (iOS/Android), point to production backend
      if (this.isNative()) {
        if (env.VITE_APP_URL && env.VITE_APP_URL.trim() !== '') {
          return env.VITE_APP_URL.replace(/\/$/, '');
        }
        return 'https://marketmind-ai.onrender.com';
      }

      // In local browser dev (localhost), relative API calls route to local Vite dev proxy / server
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Get WebSocket endpoint URL for server-controlled market stream.
   * Resolves WSS URL targeting Render backend or configured WebSocket server.
   */
  public static getWebSocketUrl(path: string = '/ws/market-stream'): string {
    const meta = (import.meta as any) || {};
    const env = meta?.env || {};
    if (env.VITE_WS_URL && env.VITE_WS_URL.trim() !== '') {
      return env.VITE_WS_URL.replace(/\/$/, '');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase.startsWith('https://')) {
      return `${apiBase.replace('https://', 'wss://')}${path.startsWith('/') ? path : '/' + path}`;
    }
    if (apiBase.startsWith('http://')) {
      return `${apiBase.replace('http://', 'ws://')}${path.startsWith('/') ? path : '/' + path}`;
    }

    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'getmarketmindai.com' || host.endsWith('.getmarketmindai.com') || host.endsWith('.vercel.app')) {
        return `wss://marketmind-ai.onrender.com${path.startsWith('/') ? path : '/' + path}`;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${path.startsWith('/') ? path : '/' + path}`;
    }

    return `ws://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Check if device is connected to the internet
   */
  public static isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }
}

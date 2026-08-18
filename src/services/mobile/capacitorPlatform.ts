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
   * On Web: Returns relative '' or origin to leverage standard proxying.
   * On Native (iOS/Android): Returns absolute HTTPS URL from environment.
   */
  public static getApiBaseUrl(): string {
    const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
    if (isNode) {
      return process.env.APP_URL || 'http://localhost:3000';
    }

    try {
      const meta = import.meta as any;
      const env = meta?.env || {};

      // If explicit API Base URL is configured in environment, use it
      if (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.trim() !== '') {
        return env.VITE_API_BASE_URL.replace(/\/$/, '');
      }

      // If running inside Native Capacitor (iOS/Android), must point to production HTTPS server
      if (this.isNative()) {
        if (env.VITE_APP_URL && env.VITE_APP_URL.trim() !== '') {
          return env.VITE_APP_URL.replace(/\/$/, '');
        }
        return 'https://marketmind.ai';
      }

      // In browser, relative API calls route to the same origin
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Get WebSocket endpoint URL for server-controlled market stream.
   * Connects to `/ws/market-stream` with upstream 30-symbol cap.
   */
  public static getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws/market-stream';
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase.startsWith('https://')) {
      return `${apiBase.replace('https://', 'wss://')}/ws/market-stream`;
    }
    if (apiBase.startsWith('http://')) {
      return `${apiBase.replace('http://', 'ws://')}/ws/market-stream`;
    }

    // Default browser relative calculation
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/market-stream`;
  }

  /**
   * Check if device is connected to the internet
   */
  public static isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }
}

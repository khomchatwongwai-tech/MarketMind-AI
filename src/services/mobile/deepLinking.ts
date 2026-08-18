/**
 * MarketMind AI - Deep Link Manager
 * Handles universal links (https://marketmind.ai/stock/:symbol) and custom scheme (marketmind://stock/:symbol).
 */

export interface DeepLinkRoute {
  type: 'STOCK' | 'NEWS' | 'WATCHLIST' | 'DASHBOARD' | 'UNKNOWN';
  symbol?: string;
  url: string;
}

export class DeepLinkManager {
  private static listeners: Array<(route: DeepLinkRoute) => void> = [];
  private static isInitialized = false;

  /**
   * Parse deep link URL into a structured route
   */
  public static parseUrl(url: string): DeepLinkRoute {
    if (!url) {
      return { type: 'UNKNOWN', url: '' };
    }

    try {
      const cleanUrl = url.trim();

      // 1. Custom URL Scheme: marketmind://stock/NVDA
      if (cleanUrl.startsWith('marketmind://')) {
        const path = cleanUrl.replace('marketmind://', '');
        const segments = path.split('/').filter(Boolean);

        if (segments[0]?.toLowerCase() === 'stock' && segments[1]) {
          return { type: 'STOCK', symbol: segments[1].toUpperCase(), url: cleanUrl };
        }
        if (segments[0]?.toLowerCase() === 'watchlist') {
          return { type: 'WATCHLIST', url: cleanUrl };
        }
        if (segments[0]?.toLowerCase() === 'news') {
          return { type: 'NEWS', url: cleanUrl };
        }
      }

      // 2. HTTPS Universal Links: https://marketmind.ai/stock/NVDA
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        const parsed = new URL(cleanUrl);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);

        if (pathSegments[0]?.toLowerCase() === 'stock' && pathSegments[1]) {
          return { type: 'STOCK', symbol: pathSegments[1].toUpperCase(), url: cleanUrl };
        }
        if (pathSegments[0]?.toLowerCase() === 'watchlist') {
          return { type: 'WATCHLIST', url: cleanUrl };
        }
      }
    } catch {}

    return { type: 'UNKNOWN', url };
  }

  /**
   * Register listener for incoming deep links
   */
  public static onRoute(listener: (route: DeepLinkRoute) => void): () => void {
    this.listeners.push(listener);
    this.init();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Initialize native deep link listeners if running inside Capacitor
   */
  private static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    const win = window as any;
    if (win.Capacitor?.Plugins?.App) {
      win.Capacitor.Plugins.App.addListener('appUrlOpen', (event: { url: string }) => {
        const route = this.parseUrl(event.url);
        this.notifyListeners(route);
      });
    }

    // Check initial launch URL if in browser or PWA
    if (typeof window !== 'undefined' && window.location) {
      const route = this.parseUrl(window.location.href);
      if (route.type !== 'UNKNOWN') {
        setTimeout(() => this.notifyListeners(route), 100);
      }
    }
  }

  private static notifyListeners(route: DeepLinkRoute): void {
    for (const listener of this.listeners) {
      try {
        listener(route);
      } catch (err) {
        console.error('[DeepLink Error]:', err);
      }
    }
  }
}

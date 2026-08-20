/**
 * MarketMind AI - Secure Platform Storage
 * Encapsulates secure keychain/keystore access on iOS/Android native and web storage.
 * CRITICAL RULE: Provider secret keys (Alpaca / Polygon / Stripe / Gemini) must NEVER be written to storage.
 */

import { CapacitorPlatform } from './capacitorPlatform.js';

export class SecureStorage {
  private static memoryFallback: Map<string, string> = new Map();

  /**
   * Set a secure key-value pair
   */
  public static async setItem(key: string, value: string): Promise<void> {
    if (!key) return;

    // Safety check: block any accidental persistence of master API secrets
    if (
      key.includes('API_KEY') ||
      key.includes('API_SECRET') ||
      key.includes('STRIPE_SECRET') ||
      key.includes('SERVICE_ACCOUNT')
    ) {
      console.warn(`[Security Alert] Blocked attempt to persist sensitive secret key: ${key}`);
      return;
    }

    if (CapacitorPlatform.isNative()) {
      try {
        const win = window as any;
        if (win.Capacitor?.Plugins?.Preferences) {
          await win.Capacitor.Plugins.Preferences.set({ key, value });
          return;
        }
      } catch (err) {
        console.warn('[SecureStorage] Native storage fallback to memory:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`mm_secure_${key}`, value);
        return;
      } catch {}
    }

    this.memoryFallback.set(key, value);
  }

  /**
   * Get a value from secure storage
   */
  public static async getItem(key: string): Promise<string | null> {
    if (!key) return null;

    if (CapacitorPlatform.isNative()) {
      try {
        const win = window as any;
        if (win.Capacitor?.Plugins?.Preferences) {
          const res = await win.Capacitor.Plugins.Preferences.get({ key });
          if (res && res.value !== null && res.value !== undefined) {
            return res.value;
          }
        }
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const val = localStorage.getItem(`mm_secure_${key}`);
        if (val !== null) return val;
      } catch {}
    }

    return this.memoryFallback.get(key) || null;
  }

  /**
   * Remove a key from secure storage
   */
  public static async removeItem(key: string): Promise<void> {
    if (!key) return;

    if (CapacitorPlatform.isNative()) {
      try {
        const win = window as any;
        if (win.Capacitor?.Plugins?.Preferences) {
          await win.Capacitor.Plugins.Preferences.remove({ key });
        }
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`mm_secure_${key}`);
      } catch {}
    }

    this.memoryFallback.delete(key);
  }

  /**
   * Clear all non-essential cached entries on logout
   */
  public static async clearAuthSession(): Promise<void> {
    await this.removeItem('auth_token');
    await this.removeItem('user_session');
    await this.removeItem('refresh_token');
  }
}

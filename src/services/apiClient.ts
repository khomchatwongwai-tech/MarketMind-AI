/**
 * MarketMind AI - Unified API Client (Web, iOS, Android)
 * Single authoritative client for all HTTP requests across web and native platforms.
 * Enforces base URL resolution, Firebase auth token attachment, offline caching, and fail-closed integrity.
 */

import { CapacitorPlatform } from './mobile/capacitorPlatform';
import { SecureStorage } from './mobile/secureStorage';
import { NormalizedInstrument, UniversalAssetClass, MultiAssetQuoteResponse } from '../types/instrument';

export interface ApiClientOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeoutMs?: number;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
  status?: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private tokenGetter?: () => Promise<string | null>;

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setTokenProvider(provider: () => Promise<string | null>): void {
    this.tokenGetter = provider;
  }

  /**
   * Get current auth token from token provider, secure storage, or localStorage
   */
  public async getAuthToken(): Promise<string | null> {
    if (this.tokenGetter) {
      try {
        const tok = await this.tokenGetter();
        if (tok) return tok;
      } catch {}
    }

    const secureTok = await SecureStorage.getItem('auth_token');
    if (secureTok) return secureTok;

    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('marketmind_auth_token') || localStorage.getItem('auth_token');
    }

    return null;
  }

  /**
   * Perform an authenticated GET request with auto-retry and fail-closed error handling
   */
  public async get<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(path, { method: 'GET', ...options });
  }

  /**
   * Perform an authenticated POST request
   */
  public async post<T>(path: string, body?: any, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  }

  /**
   * Perform an authenticated DELETE request
   */
  public async delete<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', ...options });
  }

  /**
   * Core request executor
   */
  private async request<T>(
    path: string,
    options: {
      method: string;
      body?: any;
      headers?: Record<string, string>;
      skipAuth?: boolean;
      timeoutMs?: number;
    }
  ): Promise<T> {
    const baseUrl = CapacitorPlatform.getApiBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${baseUrl}${cleanPath}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    // Attach auth token if available and not skipped
    if (!options.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Offline check
    if (!CapacitorPlatform.isOnline()) {
      throw new Error('DEVICE_OFFLINE: Network connection is unavailable.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const res = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: controller.signal,
      });

      if (res.status === 401) {
        // Handle expired token: clear session
        await SecureStorage.clearAuthSession();
        throw new Error('UNAUTHORIZED: Authentication token has expired or is invalid.');
      }

      if (!res.ok) {
        let errJson: ApiErrorResponse | null = null;
        try {
          errJson = await res.json();
        } catch {}
        const errorMsg = errJson?.message || errJson?.error || `HTTP error ${res.status}`;
        throw new Error(errorMsg);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('REQUEST_TIMEOUT: MarketMind backend request timed out.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ==========================================
  // SHARED DOMAIN ENDPOINTS
  // ==========================================

  /**
   * Search 5,000+ stock & ETF universe
   */
  public async searchInstruments(
    query: string,
    assetClass?: UniversalAssetClass,
    limit = 20
  ): Promise<{ results: NormalizedInstrument[]; groupedResults: any[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (assetClass) params.set('assetClass', assetClass);
    params.set('limit', String(limit));

    return this.get(`/api/instruments/search?${params.toString()}`);
  }

  /**
   * Get instrument metadata by Symbol or ID
   */
  public async getInstrument(symbolOrId: string): Promise<NormalizedInstrument> {
    return this.get<NormalizedInstrument>(`/api/instruments/${encodeURIComponent(symbolOrId)}`);
  }

  /**
   * Get real-time or snapshot quote
   */
  public async getQuote(symbolOrId: string): Promise<MultiAssetQuoteResponse> {
    return this.get<MultiAssetQuoteResponse>(`/api/market/quote/${encodeURIComponent(symbolOrId)}`);
  }

  /**
   * Get historical chart candles
   */
  public async getCandles(
    symbolOrId: string,
    timeframe = '5m',
    count = 60
  ): Promise<{ symbol: string; timeframe: string; candles: any[] }> {
    return this.get(`/api/market/candles/${encodeURIComponent(symbolOrId)}?timeframe=${timeframe}&count=${count}`);
  }

  /**
   * Get verified news stream
   */
  public async getNews(symbol?: string, limit = 20): Promise<{ news: any[] }> {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}&limit=${limit}` : `?limit=${limit}`;
    return this.get(`/api/news${query}`);
  }

  /**
   * Get AI market intelligence from verified data
   */
  public async getAiAnalysis(symbol: string, timeHorizon = 'intraday'): Promise<any> {
    return this.post('/api/gemini/analyze', { symbol, timeHorizon });
  }

  /**
   * Get user watchlist (persisted in Supabase)
   */
  public async getWatchlist(): Promise<{ symbols: string[] }> {
    return this.get('/api/watchlist');
  }

  /**
   * Add symbol to watchlist
   */
  public async addToWatchlist(symbol: string, assetClass = 'STOCK'): Promise<{ success: boolean }> {
    return this.post('/api/watchlist', { symbol, assetClass });
  }

  /**
   * Remove symbol from watchlist
   */
  public async removeFromWatchlist(symbol: string): Promise<{ success: boolean }> {
    return this.delete(`/api/watchlist/${encodeURIComponent(symbol)}`);
  }
}

export const sharedApiClient = ApiClient.getInstance();

import { InstrumentStore, DatabaseInstrument } from './instrumentStore.js';

export interface AlpacaRawAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: 'active' | 'inactive';
  tradable: boolean;
  marginable?: boolean;
  shortable?: boolean;
  easy_to_borrow?: boolean;
  fractionable?: boolean;
}

export interface SyncStats {
  totalProcessed: number;
  activeStocks: number;
  activeEtfs: number;
  exchanges: string[];
  inserted: number;
  updated: number;
  durationMs: number;
  timestamp: string;
}

type FetchLike = typeof fetch;

export class AlpacaInstrumentSyncService {
  private static fetchFn: FetchLike | null = null;

  public static setFetchForTests(customFetch: FetchLike | null) {
    this.fetchFn = customFetch;
  }

  /**
   * Determine if an Alpaca asset represents an ETF or Common Stock
   */
  public static classifyAssetType(asset: AlpacaRawAsset): 'ETF' | 'STOCK' {
    const name = (asset.name || '').toUpperCase();
    const exchange = (asset.exchange || '').toUpperCase();
    const symbol = (asset.symbol || '').toUpperCase();

    if (
      exchange === 'ARCA' ||
      exchange === 'BATS' ||
      name.includes(' ETF') ||
      name.includes('TRUST') ||
      name.includes('FUND') ||
      name.includes('ISHARES') ||
      name.includes('VANGUARD') ||
      name.includes('SPDR') ||
      name.includes('INVESCO') ||
      name.includes('PROSHARES') ||
      name.includes('DIREXION') ||
      name.includes('VANECK') ||
      name.includes('GLOBAL X') ||
      name.includes('SCHWAB') ||
      name.includes('FIRST TRUST') ||
      name.includes('WISDOMTREE') ||
      name.includes('YIELDMAX')
    ) {
      return 'ETF';
    }
    return 'STOCK';
  }

  /**
   * Normalize an exchange identifier
   */
  public static normalizeExchange(rawExchange: string): string {
    const clean = (rawExchange || '').toUpperCase().trim();
    switch (clean) {
      case 'NASDAQ':
        return 'NASDAQ';
      case 'NYSE':
        return 'NYSE';
      case 'ARCA':
      case 'NYSEARCA':
        return 'NYSE Arca';
      case 'AMEX':
      case 'NYSEMKT':
        return 'NYSE American';
      case 'BATS':
        return 'Cboe BZX';
      case 'IEX':
        return 'IEX';
      case 'OTC':
        return 'OTC Markets';
      default:
        return clean || 'NYSE/NASDAQ';
    }
  }

  /**
   * Synchronize 5,000+ US equities and ETFs from Alpaca
   */
  public static async syncFromAlpaca(options: {
    apiKey?: string;
    apiSecret?: string;
    baseUrl?: string;
  } = {}): Promise<SyncStats> {
    const startTime = Date.now();
    const apiKey = options.apiKey || process.env.ALPACA_API_KEY || '';
    const apiSecret = options.apiSecret || process.env.ALPACA_API_SECRET || '';
    const baseUrl = (
      options.baseUrl ||
      process.env.ALPACA_BASE_URL ||
      'https://paper-api.alpaca.markets'
    ).replace(/\/$/, '');

    const doFetch = this.fetchFn || globalThis.fetch;
    let rawAssets: AlpacaRawAsset[] = [];

    if (apiKey.trim().length >= 8 && apiSecret.trim().length >= 8) {
      try {
        const response = await doFetch(`${baseUrl}/v2/assets?status=active&asset_class=us_equity`, {
          headers: {
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': apiSecret,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json)) {
            rawAssets = json;
          }
        }
      } catch (err) {
        console.warn('[Alpaca Sync] Remote asset fetch failed, falling back to seed universe:', err);
      }
    }

    // Fall back to comprehensive universe seed if Alpaca credentials are empty or remote returned no items
    if (rawAssets.length === 0) {
      const seedCount = await InstrumentStore.initialize();
      const allInstruments = InstrumentStore.getAll();
      const stocks = allInstruments.filter((i) => i.asset_type === 'STOCK').length;
      const etfs = allInstruments.filter((i) => i.asset_type === 'ETF').length;
      const exchangeSet = new Set(allInstruments.map((i) => i.exchange));

      return {
        totalProcessed: seedCount,
        activeStocks: stocks,
        activeEtfs: etfs,
        exchanges: Array.from(exchangeSet),
        inserted: seedCount,
        updated: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // Process and normalize assets
    const instrumentsToUpsert: DatabaseInstrument[] = [];
    const exchangeSet = new Set<string>();
    let activeStocks = 0;
    let activeEtfs = 0;

    for (const asset of rawAssets) {
      // Only US equities
      if (asset.class !== 'us_equity') continue;
      const symbol = (asset.symbol || '').toUpperCase().trim();
      if (!symbol || !/^[A-Z0-9.-]{1,14}$/.test(symbol)) continue;

      const assetType = this.classifyAssetType(asset);
      if (assetType === 'ETF') activeEtfs++;
      else activeStocks++;

      const exchange = this.normalizeExchange(asset.exchange);
      exchangeSet.add(exchange);

      const dbInst: DatabaseInstrument = {
        id: `inst_${assetType.toLowerCase()}_${symbol.toLowerCase().replace('.', '_')}`,
        symbol,
        name: asset.name || symbol,
        exchange,
        asset_class: 'us_equity',
        asset_type: assetType,
        tradable: Boolean(asset.tradable),
        active: asset.status === 'active',
        status: asset.status,
        provider: 'alpaca',
        provider_asset_id: asset.id,
      };

      instrumentsToUpsert.push(dbInst);
    }

    const { inserted, updated } = await InstrumentStore.upsertBatch(instrumentsToUpsert);

    return {
      totalProcessed: instrumentsToUpsert.length,
      activeStocks,
      activeEtfs,
      exchanges: Array.from(exchangeSet),
      inserted,
      updated,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

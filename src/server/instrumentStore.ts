import { getSupabaseAdmin } from './supabaseAdmin';
import { buildUniverseSeed } from '../services/marketProviders/universeCatalog';
import { NormalizedInstrument, UniversalAssetClass } from '../types/instrument';

export interface DatabaseInstrument {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  asset_class: string;
  asset_type: string; // 'STOCK' | 'ETF'
  tradable: boolean;
  active: boolean;
  status: string;
  sector?: string | null;
  industry?: string | null;
  provider: string;
  provider_asset_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InstrumentSearchResult {
  instrument: DatabaseInstrument;
  score: number;
  matchType: 'EXACT_SYMBOL' | 'PREFIX_SYMBOL' | 'NAME_WORD' | 'SUBSTRING' | 'FUZZY';
}

export class InstrumentStore {
  private static inMemoryCatalog: Map<string, DatabaseInstrument> = new Map();
  private static symbolIndex: Map<string, DatabaseInstrument> = new Map();
  private static isInitialized = false;
  private static searchCache = new Map<string, { timestamp: number; results: DatabaseInstrument[] }>();
  private static readonly SEARCH_CACHE_TTL_MS = 60_000; // 60 seconds

  /**
   * Initializes the instrument catalog in-memory from seed and Supabase
   */
  public static async initialize(): Promise<number> {
    if (this.isInitialized && this.inMemoryCatalog.size >= 5000) {
      return this.inMemoryCatalog.size;
    }

    // 1. Seed from compiled universe seed
    const seed = buildUniverseSeed();
    for (const inst of seed) {
      this.inMemoryCatalog.set(inst.id, inst);
      this.symbolIndex.set(inst.symbol.toUpperCase(), inst);
    }

    // 2. Try loading any dynamic assets from Supabase if configured
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('instruments')
        .select('*')
        .eq('active', true);

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          const mapped: DatabaseInstrument = {
            id: row.id,
            symbol: row.symbol,
            name: row.name,
            exchange: row.exchange || 'NYSE/NASDAQ',
            asset_class: row.asset_class || 'us_equity',
            asset_type: row.asset_type || 'STOCK',
            tradable: Boolean(row.tradable),
            active: Boolean(row.active),
            status: row.status || 'active',
            sector: row.sector,
            industry: row.industry,
            provider: row.provider || 'alpaca',
            provider_asset_id: row.provider_asset_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
          this.inMemoryCatalog.set(mapped.id, mapped);
          this.symbolIndex.set(mapped.symbol.toUpperCase(), mapped);
        }
      }
    } catch {
      // Supabase not reachable or offline in local test, continue with seed catalog
    }

    this.isInitialized = true;
    return this.inMemoryCatalog.size;
  }

  /**
   * Ensure catalog is initialized
   */
  private static ensureReady(): void {
    if (!this.isInitialized || this.inMemoryCatalog.size === 0) {
      const seed = buildUniverseSeed();
      for (const inst of seed) {
        this.inMemoryCatalog.set(inst.id, inst);
        this.symbolIndex.set(inst.symbol.toUpperCase(), inst);
      }
      this.isInitialized = true;
    }
  }

  /**
   * Get instrument by symbol
   */
  public static getBySymbol(symbol: string): DatabaseInstrument | null {
    this.ensureReady();
    if (!symbol) return null;
    return this.symbolIndex.get(symbol.trim().toUpperCase()) || null;
  }

  /**
   * Get instrument by unique ID
   */
  public static getById(id: string): DatabaseInstrument | null {
    this.ensureReady();
    if (!id) return null;
    return this.inMemoryCatalog.get(id) || null;
  }

  /**
   * Total count of active instruments
   */
  public static count(): number {
    this.ensureReady();
    return this.inMemoryCatalog.size;
  }

  /**
   * Get all instruments matching optional filters
   */
  public static getAll(filter?: { assetType?: string; exchange?: string }): DatabaseInstrument[] {
    this.ensureReady();
    const all = Array.from(this.inMemoryCatalog.values());
    if (!filter) return all;
    return all.filter((inst) => {
      if (filter.assetType && inst.asset_type !== filter.assetType) return false;
      if (filter.exchange && !inst.exchange.toUpperCase().includes(filter.exchange.toUpperCase())) return false;
      return true;
    });
  }

  /**
   * High-performance scored search and autocomplete
   */
  public static search(
    query: string,
    options: {
      limit?: number;
      assetType?: string;
      exchange?: string;
    } = {}
  ): DatabaseInstrument[] {
    this.ensureReady();
    const cleanQuery = (query || '').trim().toUpperCase();
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const cacheKey = `${cleanQuery}|${options.assetType || ''}|${options.exchange || ''}|${limit}`;

    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.SEARCH_CACHE_TTL_MS) {
      return cached.results;
    }

    if (!cleanQuery) {
      // Default top benchmark list
      const topSymbols = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'IWM', 'DIA', 'VOO', 'SMH', 'PLTR', 'AMD', 'COIN', 'MSTR'];
      const defaults: DatabaseInstrument[] = [];
      for (const s of topSymbols) {
        const found = this.symbolIndex.get(s);
        if (found) defaults.push(found);
      }
      return defaults.slice(0, limit);
    }

    const scored: InstrumentSearchResult[] = [];
    const queryLower = cleanQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(Boolean);

    for (const inst of this.inMemoryCatalog.values()) {
      if (!inst.active) continue;

      if (options.assetType && inst.asset_type.toUpperCase() !== options.assetType.toUpperCase()) {
        continue;
      }
      if (options.exchange && !inst.exchange.toUpperCase().includes(options.exchange.toUpperCase())) {
        continue;
      }

      const sym = inst.symbol.toUpperCase();
      const name = inst.name.toLowerCase();

      // 1. Exact Symbol Match (Score: 100)
      if (sym === cleanQuery) {
        scored.push({ instrument: inst, score: 100, matchType: 'EXACT_SYMBOL' });
        continue;
      }

      // 2. Symbol Prefix Match (Score: 80)
      if (sym.startsWith(cleanQuery)) {
        scored.push({ instrument: inst, score: 80 - (sym.length - cleanQuery.length), matchType: 'PREFIX_SYMBOL' });
        continue;
      }

      // 3. Name Word Boundary Match (Score: 60)
      const nameStarts = queryWords.every((qw) => {
        const regex = new RegExp(`\\b${qw}`, 'i');
        return regex.test(name);
      });
      if (nameStarts) {
        scored.push({ instrument: inst, score: 60, matchType: 'NAME_WORD' });
        continue;
      }

      // 4. Substring Match in Symbol or Name (Score: 40)
      if (sym.includes(cleanQuery) || name.includes(queryLower)) {
        scored.push({ instrument: inst, score: 40, matchType: 'SUBSTRING' });
        continue;
      }

      // 5. Fuzzy Match (Score: 20)
      if (cleanQuery.length >= 3 && name.includes(queryLower.slice(0, 3))) {
        scored.push({ instrument: inst, score: 20, matchType: 'FUZZY' });
      }
    }

    // Sort by Score DESC, then alphabetically by symbol
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.instrument.symbol.localeCompare(b.instrument.symbol);
    });

    const results = scored.slice(0, limit).map((s) => s.instrument);

    // Update cache
    this.searchCache.set(cacheKey, { timestamp: Date.now(), results });
    return results;
  }

  /**
   * Batch upsert instruments into in-memory catalog and Supabase
   */
  public static async upsertBatch(instruments: DatabaseInstrument[]): Promise<{ inserted: number; updated: number }> {
    this.ensureReady();
    let inserted = 0;
    let updated = 0;

    for (const inst of instruments) {
      const sym = inst.symbol.toUpperCase().trim();
      const existing = this.symbolIndex.get(sym);
      if (existing) {
        updated++;
      } else {
        inserted++;
      }
      this.inMemoryCatalog.set(inst.id, inst);
      this.symbolIndex.set(sym, inst);
    }

    // Clear search cache
    this.searchCache.clear();

    // Persist to Supabase if reachable
    try {
      const rows = instruments.map((i) => ({
        id: i.id,
        symbol: i.symbol,
        name: i.name,
        exchange: i.exchange,
        asset_class: i.asset_class,
        asset_type: i.asset_type,
        tradable: i.tradable,
        active: i.active,
        status: i.status,
        sector: i.sector || null,
        industry: i.industry || null,
        provider: i.provider,
        provider_asset_id: i.provider_asset_id || null,
        updated_at: new Date().toISOString(),
      }));

      // Chunk in blocks of 500
      const CHUNK_SIZE = 500;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        await getSupabaseAdmin()
          .from('instruments')
          .upsert(chunk, { onConflict: 'symbol' });
      }
    } catch {
      // Supabase upsert optional / non-blocking for in-memory operations
    }

    return { inserted, updated };
  }

  /**
   * Convert DatabaseInstrument to NormalizedInstrument format
   */
  public static toNormalizedInstrument(dbInst: DatabaseInstrument): NormalizedInstrument {
    const isEtf = dbInst.asset_type === 'ETF';
    return {
      instrumentId: dbInst.id,
      symbol: dbInst.symbol,
      displaySymbol: dbInst.symbol,
      name: dbInst.name,
      assetClass: (isEtf ? 'ETF' : 'STOCK') as UniversalAssetClass,
      instrumentType: isEtf ? 'Exchange Traded Fund' : 'Common Stock',
      exchange: dbInst.exchange,
      country: 'United States',
      currency: 'USD',
      providerSymbol: dbInst.symbol,
      providerSymbols: {
        alpaca: dbInst.symbol,
        massive: dbInst.symbol,
        yahoo: dbInst.symbol,
      },
      marketTimezone: 'America/New_York',
      tradingSession: 'US_EQUITIES_REGULAR',
      activeStatus: dbInst.active ? 'ACTIVE' : 'DELISTED',
      primaryProvider: 'alpaca',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
    };
  }

  /**
   * Reset store for test isolation
   */
  public static resetForTests(): void {
    this.inMemoryCatalog.clear();
    this.symbolIndex.clear();
    this.searchCache.clear();
    this.isInitialized = false;
  }
}

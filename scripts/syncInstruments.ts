import dotenv from 'dotenv';
import { AlpacaInstrumentSyncService } from '../src/server/alpacaInstrumentSync';
import { InstrumentStore } from '../src/server/instrumentStore';

dotenv.config();

async function main() {
  console.log('======================================================');
  console.log('MarketMind AI - Alpaca Free 5,000+ Instrument Sync');
  console.log('======================================================');

  const apiKey = process.env.ALPACA_API_KEY;
  const apiSecret = process.env.ALPACA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('[Notice] No ALPACA_API_KEY/ALPACA_API_SECRET found in environment.');
    console.log('[Notice] Seeding catalog from comprehensive 5,000+ US equity/ETF database...');
  } else {
    console.log(`[Sync] Connecting to Alpaca (${process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'})...`);
  }

  const startTime = Date.now();
  const stats = await AlpacaInstrumentSyncService.syncFromAlpaca();
  const totalInStore = InstrumentStore.count();

  console.log('------------------------------------------------------');
  console.log('Synchronization Completed Successfully:');
  console.log(`  Total Processed:  ${stats.totalProcessed}`);
  console.log(`  Active Stocks:    ${stats.activeStocks}`);
  console.log(`  Active ETFs:      ${stats.activeEtfs}`);
  console.log(`  Exchanges:        ${stats.exchanges.join(', ')}`);
  console.log(`  Total In Catalog: ${totalInStore}`);
  console.log(`  Duration:         ${stats.durationMs}ms`);
  console.log('======================================================');
}

main().catch((err) => {
  console.error('[Fatal Sync Error]:', err);
  process.exit(1);
});

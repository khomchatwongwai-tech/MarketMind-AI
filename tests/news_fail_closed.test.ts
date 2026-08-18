import assert from 'node:assert/strict';
import test from 'node:test';
import { AlpacaNewsProvider } from '../src/services/newsProviders/AlpacaNewsProvider';
import { FinnhubNewsProvider } from '../src/services/newsProviders/FinnhubNewsProvider';
import { MassiveNewsProvider } from '../src/services/newsProviders/MassiveNewsProvider';
import { BenzingaNewsProvider } from '../src/services/newsProviders/BenzingaNewsProvider';

test('AlpacaNewsProvider fails closed and returns empty array on unconfigured or error state', async () => {
  const provider = new AlpacaNewsProvider();
  const news = await provider.getLatestNews();
  assert.equal(Array.isArray(news), true);
  assert.equal(news.length, 0);
  const tickerNews = await provider.getTickerNews('NVDA');
  assert.equal(tickerNews.length, 0);
});

test('FinnhubNewsProvider fails closed and returns empty array on unconfigured or error state', async () => {
  const provider = new FinnhubNewsProvider();
  const news = await provider.getLatestNews();
  assert.equal(Array.isArray(news), true);
  assert.equal(news.length, 0);
  const tickerNews = await provider.getTickerNews('AAPL');
  assert.equal(tickerNews.length, 0);
});

test('MassiveNewsProvider fails closed and returns empty array on unconfigured or error state', async () => {
  const provider = new MassiveNewsProvider();
  const news = await provider.getLatestNews();
  assert.equal(Array.isArray(news), true);
  assert.equal(news.length, 0);
  const tickerNews = await provider.getTickerNews('TSLA');
  assert.equal(tickerNews.length, 0);
});

test('BenzingaNewsProvider fails closed and returns empty array on unconfigured or error state', async () => {
  const provider = new BenzingaNewsProvider();
  const news = await provider.getLatestNews();
  assert.equal(Array.isArray(news), true);
  assert.equal(news.length, 0);
  const tickerNews = await provider.getTickerNews('MSFT');
  assert.equal(tickerNews.length, 0);
});

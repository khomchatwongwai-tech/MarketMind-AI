import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateVerifiedCatalyst, formatRelativeTime } from '../src/utils/verifiedCatalystService.js';

describe('Verified Market Catalyst Brief Suite', () => {
  const sampleNow = Date.parse('2026-08-20T12:00:00Z');
  const lastVisitMs = Date.parse('2026-08-20T08:00:00Z'); // 4 hours ago

  it('validates a verified market catalyst with full provenance metadata', () => {
    const raw = {
      id: 'news_101',
      ticker: 'NVDA',
      headline: 'NVIDIA Announces Enterprise AI Infrastructure Expansion',
      description: 'Quarterly enterprise data center bookings expanded by 42%.',
      source: 'Finnhub Institutional',
      url: 'https://api.finnhub.io/news/101',
      publishedTime: '2026-08-20T10:30:00Z',
      sentiment: 'BULLISH',
      verificationStatus: 'VERIFIED',
    };

    const validated = validateVerifiedCatalyst(raw, lastVisitMs);
    assert.ok(validated !== null);
    assert.equal(validated!.symbol, 'NVDA');
    assert.equal(validated!.title, 'NVIDIA Announces Enterprise AI Infrastructure Expansion');
    assert.equal(validated!.source, 'Finnhub Institutional');
    assert.equal(validated!.url, 'https://api.finnhub.io/news/101');
    assert.equal(validated!.verificationStatus, 'VERIFIED');
    assert.equal(formatRelativeTime(validated!.publishedAtMs, sampleNow), '1h ago');
  });

  it('rejects an event when verificationStatus is UNVERIFIED or missing', () => {
    const rawUnverified = {
      ticker: 'AAPL',
      headline: 'Unconfirmed rumor on supply chain shifts',
      source: 'Tech Blog',
      url: 'https://example.com/rumor',
      publishedTime: '2026-08-20T11:00:00Z',
      verificationStatus: 'UNVERIFIED',
    };

    const validated = validateVerifiedCatalyst(rawUnverified, lastVisitMs);
    assert.equal(validated, null, 'Unverified items must be rejected');
  });

  it('rejects an event when source URL is missing or invalid', () => {
    const rawMissingUrl = {
      ticker: 'MSFT',
      headline: 'Microsoft Cloud Margin Expansion',
      source: 'Reuters',
      url: '', // missing URL
      publishedTime: '2026-08-20T11:00:00Z',
      verificationStatus: 'VERIFIED',
    };

    const validated = validateVerifiedCatalyst(rawMissingUrl, lastVisitMs);
    assert.equal(validated, null, 'Items without valid HTTPS/HTTP source URL must be rejected');
  });

  it('rejects an event when publication timestamp is missing or invalid', () => {
    const rawMissingDate = {
      ticker: 'TSLA',
      headline: 'Tesla Autonomous Vehicle Delivery Update',
      source: 'Bloomberg',
      url: 'https://bloomberg.com/news/123',
      publishedTime: '', // missing date
      verificationStatus: 'VERIFIED',
    };

    const validated = validateVerifiedCatalyst(rawMissingDate, lastVisitMs);
    assert.equal(validated, null, 'Items without publication timestamp must be rejected');
  });

  it('rejects stale events published before the user last visit timestamp', () => {
    const rawStale = {
      ticker: 'SPY',
      headline: 'CPI Inflation Data Released Yesterday',
      source: 'FRED Data',
      url: 'https://fred.stlouisfed.org/series/CPI',
      publishedTime: '2026-08-19T12:00:00Z', // 24h ago (before 4h ago last visit)
      verificationStatus: 'VERIFIED',
    };

    const validated = validateVerifiedCatalyst(rawStale, lastVisitMs);
    assert.equal(validated, null, 'Events published before user last visit must be rejected');
  });

  it('calculates human-readable relative time correctly from published timestamp', () => {
    const now = Date.now();
    const tenMinAgo = now - 10 * 60 * 1000;
    const twoHoursAgo = now - 2 * 3600 * 1000;
    const oneDayAgo = now - 26 * 3600 * 1000;

    assert.equal(formatRelativeTime(tenMinAgo, now), '10m ago');
    assert.equal(formatRelativeTime(twoHoursAgo, now), '2h ago');
    assert.equal(formatRelativeTime(oneDayAgo, now), '1d ago');
  });
});

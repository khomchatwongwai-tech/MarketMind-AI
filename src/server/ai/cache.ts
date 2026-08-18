import type { OrchestratedResponse } from './types';
type Entry = { value: OrchestratedResponse; expiresAt: number; userId?: string };
const entries = new Map<string, Entry>();
export function cacheKey(parts: { query: string; intent: string; symbol?: string; contextVersion?: string; userId?: string }) { return JSON.stringify({ q: parts.query.trim().toLowerCase(), i: parts.intent, s: parts.symbol, c: parts.contextVersion, u: parts.userId }); }
export function getCached(key: string, userId?: string) { const entry = entries.get(key); if (!entry) return undefined; if (entry.expiresAt < Date.now()) { entries.delete(key); return undefined; } if (entry.userId !== userId) return undefined; return entry.value; }
export function setCached(key: string, value: OrchestratedResponse, ttlMs: number, userId?: string) { if (ttlMs > 0) entries.set(key, { value, expiresAt: Date.now() + ttlMs, userId }); }
export function cacheTtl(intent: string) { if (intent === 'GENERAL_EDUCATION') return 3_600_000; if (intent === 'SEC_FILINGS') return 900_000; if (intent === 'WHY_MOVING' || intent === 'TECHNICAL_ANALYSIS') return 0; return 60_000; }

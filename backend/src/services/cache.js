import { config } from '../config.js';

/**
 * In-memory TTL cache with a deliberate second life.
 *
 * Marketaux's free plan allows 100 requests a day, so repeat lookups must not
 * cost quota. Entries stay "fresh" for `ttlMs` and are then kept as "stale"
 * for much longer: when upstream is failing, rate limited, or the daily quota
 * is spent, a stale answer is far better than an error page, so the news
 * controller falls back to it and flags the response.
 */
class TtlCache {
  constructor({ ttlMs, staleMs }) {
    this.ttlMs = ttlMs;
    this.staleMs = staleMs;
    this.store = new Map();
    this.stats = { hits: 0, misses: 0, staleServed: 0 };
  }

  /** Fresh value only, or null. */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses += 1;
      return null;
    }
    if (Date.now() > entry.freshUntil) {
      this.stats.misses += 1;
      return null;
    }
    this.stats.hits += 1;
    return entry.value;
  }

  /** Expired but still usable value, for when upstream lets us down. */
  getStale(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.staleUntil) {
      this.store.delete(key);
      return null;
    }
    this.stats.staleServed += 1;
    return { value: entry.value, storedAt: entry.storedAt };
  }

  set(key, value) {
    const now = Date.now();
    this.store.set(key, {
      value,
      storedAt: now,
      freshUntil: now + this.ttlMs,
      staleUntil: now + this.staleMs,
    });
    return value;
  }

  /** Drops entries nothing can use any more. */
  prune() {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.staleUntil) {
        this.store.delete(key);
      }
    });
  }

  getStats() {
    return { ...this.stats, size: this.store.size };
  }
}

export const newsCache = new TtlCache(config.cache);

// Keep the map from growing without bound on a long-lived process.
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
const pruneTimer = setInterval(() => newsCache.prune(), PRUNE_INTERVAL_MS);
pruneTimer.unref();

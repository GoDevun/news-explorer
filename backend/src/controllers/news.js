import { newsCache } from '../services/cache.js';
import { fetchScoredNews } from '../services/marketaux.js';
import { summarize } from '../services/sentiment.js';
import { HttpError, UpstreamError } from '../utils/errors.js';
import { config } from '../config.js';

const buildPayload = (symbol, { articles, quota, found }) => ({
  symbol,
  summary: summarize(articles),
  articles,
  meta: { fetchedAt: new Date().toISOString(), quota: quota || null, found: found || 0 },
});

/**
 * GET /news?symbol=TSLA
 *
 * Order of preference: a fresh cached feed, then a live fetch, then a stale
 * cached feed. Only when all three are unavailable does the client see an
 * error, which is the point: a spent daily quota or a provider outage should
 * degrade the page, not break it.
 */
export const getNewsBySymbol = async (req, res, next) => {
  const symbol = String(req.query.symbol || '').trim().toUpperCase();

  if (!config.marketaux.apiKey) {
    next(new UpstreamError('The news provider is not configured on the server'));
    return;
  }

  const cached = newsCache.get(symbol);
  if (cached) {
    res.send({ ...cached, meta: { ...cached.meta, cached: true, stale: false } });
    return;
  }

  try {
    const result = await fetchScoredNews(symbol);
    const payload = buildPayload(symbol, result);
    newsCache.set(symbol, payload);
    res.send({ ...payload, meta: { ...payload.meta, cached: false, stale: false } });
  } catch (error) {
    const stale = newsCache.getStale(symbol);

    if (stale) {
      res.send({
        ...stale.value,
        meta: {
          ...stale.value.meta,
          cached: true,
          stale: true,
          staleSince: new Date(stale.storedAt).toISOString(),
          notice:
            error instanceof HttpError && error.statusCode === 429
              ? 'Showing the last saved feed: the daily news quota is used up.'
              : 'Showing the last saved feed: the news provider is unavailable.',
        },
      });
      return;
    }

    next(error);
  }
};

/** Cache and quota visibility, handy when the daily budget matters. */
export const getStatus = (req, res) => {
  res.send({ cache: newsCache.getStats(), configured: Boolean(config.marketaux.apiKey) });
};

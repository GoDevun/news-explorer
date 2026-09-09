import { config } from '../config.js';
import { TooManyRequestsError, UpstreamError } from '../utils/errors.js';
import { classifyArticle } from './sentiment.js';

/**
 * Marketaux client.
 *
 * Everything crossing this boundary is treated as untrusted: fields go
 * missing, images are null, the entities array can be absent, and the free
 * plan runs out of quota mid-day. The rest of the app only ever sees the
 * normalized shape produced here, or a typed error.
 */

const requestWithTimeout = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.marketaux.timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new UpstreamError('The news provider timed out');
    }
    throw new UpstreamError('Could not reach the news provider');
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Marketaux reports the daily budget as `limit` plus `remaining`; some
 * responses carry `used` instead, so derive whichever half is missing.
 */
const readQuota = (response) => {
  const limit = Number(response.headers.get('x-usagelimit-limit'));
  const remainingHeader = response.headers.get('x-usagelimit-remaining');
  const usedHeader = response.headers.get('x-usagelimit-used');

  if (!Number.isFinite(limit)) {
    return null;
  }

  if (remainingHeader !== null && Number.isFinite(Number(remainingHeader))) {
    const remaining = Number(remainingHeader);
    return { limit, used: Math.max(0, limit - remaining), remaining };
  }

  if (usedHeader !== null && Number.isFinite(Number(usedHeader))) {
    const used = Number(usedHeader);
    return { limit, used, remaining: Math.max(0, limit - used) };
  }

  return null;
};

const callApi = async (path, params) => {
  const search = new URLSearchParams({ ...params, api_token: config.marketaux.apiKey });
  const response = await requestWithTimeout(`${config.marketaux.baseUrl}${path}?${search}`);

  if (response.status === 401 || response.status === 403) {
    throw new UpstreamError('The news provider rejected the API key');
  }
  if (response.status === 402 || response.status === 429) {
    throw new TooManyRequestsError('The daily news quota has been used up');
  }
  if (!response.ok) {
    throw new UpstreamError(`The news provider returned ${response.status}`);
  }

  const body = await response.json().catch(() => {
    throw new UpstreamError('The news provider returned an unreadable response');
  });

  // Marketaux reports usage problems in a 200 body as well as by status code.
  if (body && body.error) {
    const code = String(body.error.code || '');
    if (code.includes('usage_limit') || code.includes('rate_limit')) {
      throw new TooManyRequestsError('The daily news quota has been used up');
    }
    throw new UpstreamError(body.error.message || 'The news provider returned an error');
  }

  return {
    data: Array.isArray(body && body.data) ? body.data : [],
    meta: (body && body.meta) || {},
    quota: readQuota(response),
  };
};

const fetchPage = (query, page) =>
  callApi('/news/all', { ...query, language: 'en', page: String(page) });

/**
 * Maps a free-text query to entities Marketaux knows about, so "netflix"
 * can become NFLX. US listings are preferred; the endpoint also returns
 * every foreign cross-listing of the same company.
 */
export const searchEntities = async (query) => {
  const { data } = await callApi('/entity/search', { search: query });

  const scored = data
    .filter((entity) => entity && entity.symbol)
    .map((entity) => ({
      symbol: entity.symbol,
      name: entity.name || '',
      country: entity.country || '',
      type: entity.type || '',
      // Plain US symbols carry no exchange suffix; prefer those.
      rank: (entity.country === 'us' ? 0 : 2) + (entity.symbol.includes('.') ? 1 : 0),
    }))
    .sort((a, b) => a.rank - b.rank);

  return scored;
};

/** Picks the entity for the ticker we asked about, tolerating a missing array. */
const findEntity = (raw, symbol) => {
  if (!Array.isArray(raw.entities)) {
    return null;
  }
  const upper = symbol.toUpperCase();
  return (
    raw.entities.find((entity) => (entity.symbol || '').toUpperCase() === upper) || null
  );
};

/**
 * The sentiment of the entity where it appears in the headline, if the
 * provider highlighted it there. This is what makes a headline-level label
 * possible rather than an article-wide one.
 */
const findTitleSentiment = (entity) => {
  if (!entity || !Array.isArray(entity.highlights)) {
    return null;
  }
  const titleHighlight = entity.highlights.find(
    (highlight) => highlight && highlight.highlighted_in === 'title'
  );
  return titleHighlight && typeof titleHighlight.sentiment === 'number'
    ? titleHighlight.sentiment
    : null;
};

const trimText = (value, maxLength) => {
  if (typeof value !== 'string') {
    return '';
  }
  const clean = value.trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
};

/**
 * Maps a provider article onto the shape the UI renders. Missing fields are
 * filled rather than passed through, so no component has to defend itself.
 */
export const normalizeArticle = (raw, symbol) => {
  const entity = findEntity(raw, symbol);
  const title = trimText(raw.title, 200);

  if (!raw.url || !title) {
    return null;
  }

  const description = trimText(raw.description || raw.snippet, 320);
  const publishedAt = raw.published_at ? new Date(raw.published_at) : null;
  const providerScore =
    entity && typeof entity.sentiment_score === 'number' ? entity.sentiment_score : null;

  const sentiment = classifyArticle({
    title,
    description,
    providerScore,
    titleScore: findTitleSentiment(entity),
  });

  return {
    id: raw.uuid || raw.url,
    title,
    description,
    url: raw.url,
    imageUrl: typeof raw.image_url === 'string' ? raw.image_url : '',
    source: trimText(raw.source, 60) || 'Unknown source',
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toISOString() : '',
    entity: entity
      ? { symbol: entity.symbol, name: entity.name || '', industry: entity.industry || '' }
      : { symbol: symbol.toUpperCase(), name: '', industry: '' },
    sentiment,
  };
};

/**
 * Fetches several pages, because the free plan returns only a handful of
 * articles per request. Pages that fail after the first are skipped rather
 * than failing the whole lookup.
 */
const fetchPages = async (query, symbol, maxPages) => {
  const seen = new Set();
  const articles = [];
  let quota = null;
  let found = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    let result;
    try {
      // Pages are intentionally sequential: the free plan is request-limited,
      // so bailing out early on an empty page saves quota.
      result = await fetchPage(query, page);
    } catch (error) {
      if (page === 1) {
        throw error;
      }
      break;
    }

    quota = result.quota || quota;
    found = result.meta.found || found;

    result.data.forEach((raw) => {
      const article = normalizeArticle(raw, symbol);
      if (article && !seen.has(article.url)) {
        seen.add(article.url);
        articles.push(article);
      }
    });

    if (!result.data.length) {
      break;
    }
  }

  articles.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return { articles, quota, found };
};

/**
 * Resolves whatever the user typed into a feed.
 *
 * Marketaux tags articles to entities, but its entity coverage is narrower
 * than its news coverage: "QBTS" returns nothing while a free-text search for
 * "D-Wave" returns thousands. And people type company names, not tickers. So
 * the lookup widens in stages, stopping at the first that yields articles:
 *
 *   1. the query as a ticker symbol   - precise, carries provider sentiment
 *   2. a symbol resolved from the name - "netflix" becomes NFLX
 *   3. a free-text search              - catches everything else
 *
 * Each stage costs quota, so a stage that returns nothing bails after one page.
 */
export const fetchScoredNews = async (rawQuery) => {
  const query = rawQuery.trim();
  const upper = query.toUpperCase();
  const looksLikeTicker = /^[A-Z][A-Z.-]{0,9}$/.test(upper);

  if (looksLikeTicker) {
    const bySymbol = await fetchPages(
      { symbols: upper, filter_entities: 'true' },
      upper,
      config.marketaux.pagesPerLookup
    );
    if (bySymbol.articles.length) {
      return { ...bySymbol, symbol: upper, matchedBy: 'symbol', entityName: '' };
    }
  }

  let resolved = null;
  try {
    const entities = await searchEntities(query);
    resolved = entities.find((entity) => entity.symbol.toUpperCase() !== upper) || null;
  } catch {
    resolved = null;
  }

  if (resolved) {
    const byResolved = await fetchPages(
      { symbols: resolved.symbol, filter_entities: 'true' },
      resolved.symbol,
      config.marketaux.pagesPerLookup
    );
    if (byResolved.articles.length) {
      return {
        ...byResolved,
        symbol: resolved.symbol.toUpperCase(),
        entityName: resolved.name,
        matchedBy: 'name',
        resolvedFrom: query,
      };
    }
  }

  // Last resort: the company name if we found one, otherwise what was typed.
  const keyword = (resolved && resolved.name) || query;
  const byKeyword = await fetchPages(
    { search: `"${keyword}"` },
    upper,
    Math.min(2, config.marketaux.pagesPerLookup)
  );

  return {
    ...byKeyword,
    symbol: upper,
    entityName: (resolved && resolved.name) || '',
    matchedBy: 'keyword',
    keyword,
  };
};

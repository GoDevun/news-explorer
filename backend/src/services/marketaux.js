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

const readQuota = (response) => {
  const limit = Number(response.headers.get('x-usagelimit-limit'));
  const used = Number(response.headers.get('x-usagelimit-used'));
  if (!Number.isFinite(limit) || !Number.isFinite(used)) {
    return null;
  }
  return { limit, used, remaining: Math.max(0, limit - used) };
};

const fetchPage = async (symbol, page) => {
  const params = new URLSearchParams({
    symbols: symbol,
    filter_entities: 'true',
    language: 'en',
    page: String(page),
    api_token: config.marketaux.apiKey,
  });

  const response = await requestWithTimeout(
    `${config.marketaux.baseUrl}/news/all?${params}`
  );

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
    articles: Array.isArray(body && body.data) ? body.data : [],
    meta: (body && body.meta) || {},
    quota: readQuota(response),
  };
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

  const sentiment = classifyArticle({ title, description, providerScore });

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
export const fetchScoredNews = async (symbol) => {
  const seen = new Set();
  const articles = [];
  let quota = null;
  let found = 0;

  for (let page = 1; page <= config.marketaux.pagesPerLookup; page += 1) {
    let result;
    try {
      // Pages are intentionally sequential: the free plan is request-limited,
      // so bailing out early on an empty page saves quota.
      result = await fetchPage(symbol, page);
    } catch (error) {
      if (page === 1) {
        throw error;
      }
      break;
    }

    quota = result.quota || quota;
    found = result.meta.found || found;

    result.articles.forEach((raw) => {
      const article = normalizeArticle(raw, symbol);
      if (article && !seen.has(article.url)) {
        seen.add(article.url);
        articles.push(article);
      }
    });

    if (!result.articles.length) {
      break;
    }
  }

  articles.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return { articles, quota, found };
};

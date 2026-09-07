import {
  FINNHUB_API_BASE_URL,
  FINNHUB_API_KEY,
  STOCK_NEWS_DAYS_RANGE,
  STOCK_NEWS_LIMIT,
} from './constants';

/**
 * Client for the Finnhub market data API (https://finnhub.io/docs/api).
 *
 * Every endpoint used here is available on the free plan. Endpoints that are
 * not (or that are temporarily rate limited) fail softly: `getStockOverview`
 * collects whatever came back and reports the rest as unavailable, so a lookup
 * still renders with fewer signals instead of erroring out entirely.
 */

export const STOCK_ERROR_KINDS = {
  missingKey: 'missing-key',
  notFound: 'not-found',
  rateLimit: 'rate-limit',
  request: 'request',
};

class StockApiError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'StockApiError';
    this.kind = kind;
  }
}

const kindForStatus = (status) => {
  if (status === 401 || status === 403) {
    return STOCK_ERROR_KINDS.missingKey;
  }
  if (status === 429) {
    return STOCK_ERROR_KINDS.rateLimit;
  }
  return STOCK_ERROR_KINDS.request;
};

const checkResponse = (response) =>
  response.ok
    ? response.json()
    : Promise.reject(
        new StockApiError(kindForStatus(response.status), `Error: ${response.status}`)
      );

const request = (path, params) => {
  if (!FINNHUB_API_KEY) {
    return Promise.reject(
      new StockApiError(STOCK_ERROR_KINDS.missingKey, 'Missing Finnhub API key')
    );
  }

  const searchParams = new URLSearchParams({ ...params, token: FINNHUB_API_KEY });
  return fetch(`${FINNHUB_API_BASE_URL}${path}?${searchParams}`).then(checkResponse);
};

const formatQueryDate = (date) => date.toISOString().split('T')[0];

/** Latest price snapshot: c=current, d=change, dp=change %, h/l/o=day, pc=prev close. */
export const getQuote = (symbol) => request('/quote', { symbol });

/** Company name, logo, exchange and industry. */
export const getProfile = (symbol) => request('/stock/profile2', { symbol });

/** Basic financials; the `price` group carries the 52-week range and returns. */
export const getPriceMetrics = (symbol) =>
  request('/stock/metric', { symbol, metric: 'price' });

/** Analyst recommendation trends, newest period first. */
export const getRecommendations = (symbol) =>
  request('/stock/recommendation', { symbol });

export const getCompanyNews = (symbol) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - STOCK_NEWS_DAYS_RANGE);

  return request('/company-news', {
    symbol,
    from: formatQueryDate(fromDate),
    to: formatQueryDate(toDate),
  });
};

export const searchSymbols = (query) => request('/search', { q: query, exchange: 'US' });

/**
 * Finnhub answers an unknown symbol with a 200 and an all-zero quote rather
 * than a 404, so treat a quote with no price and no previous close as a miss.
 */
const isEmptyQuote = (quote) => !quote || (!quote.c && !quote.pc);

/**
 * Reshapes a Finnhub news item into the NewsAPI article shape the rest of the
 * app already renders and saves, so NewsCard works unchanged on both pages.
 */
const normalizeArticle = (item) => ({
  url: item.url,
  title: item.headline,
  description: item.summary,
  urlToImage: item.image || '',
  publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : '',
  source: { name: item.source },
});

export const normalizeCompanyNews = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && item.url && item.headline)
    .map(normalizeArticle)
    .filter(
      (article, index, list) =>
        list.findIndex((item) => item.url === article.url) === index
    );
};

// Dropped from a company name before matching, so "NVIDIA Corp" matches on
// "NVIDIA" and "Ford Motor Co" on "Ford Motor".
const CORPORATE_SUFFIX_PATTERN =
  /\s+\b(corp|corporation|inc|incorporated|ltd|limited|plc|co|company|holdings?|group|sa|nv|ag|se)\b\.?/gi;

const escapeTerm = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finnhub tags syndicated wire stories with a symbol even when the article is
 * about a different company entirely - a request for NVDA comes back with
 * pieces on Costco and Nike. Scoring sentiment on those would be meaningless,
 * so keep only articles that actually name the company or its ticker.
 */
export const buildRelevanceMatchers = (ticker, companyName) => {
  const matchers = [new RegExp(`\\b${escapeTerm(ticker)}\\b`)];

  if (companyName) {
    const coreName = companyName.replace(CORPORATE_SUFFIX_PATTERN, '').trim();
    if (coreName.length > 2) {
      matchers.push(new RegExp(`\\b${escapeTerm(coreName)}\\b`, 'i'));
    }
  }

  return matchers;
};

export const filterRelevantArticles = (articles, ticker, companyName) => {
  const matchers = buildRelevanceMatchers(ticker, companyName);

  return articles
    .filter((article) => {
      const text = `${article.title || ''} ${article.description || ''}`;
      return matchers.some((matcher) => matcher.test(text));
    })
    .slice(0, STOCK_NEWS_LIMIT);
};

const settledValue = (result) => (result.status === 'fulfilled' ? result.value : null);

/**
 * Loads everything one ticker lookup needs. The quote decides whether the
 * symbol exists at all, so it is awaited first; the rest run in parallel and
 * any that fail are listed in `unavailable`.
 */
export const getStockOverview = async (symbol) => {
  const ticker = symbol.trim().toUpperCase();
  const quote = await getQuote(ticker);

  if (isEmptyQuote(quote)) {
    throw new StockApiError(STOCK_ERROR_KINDS.notFound, `Unknown symbol: ${ticker}`);
  }

  const [profile, metrics, recommendation, news] = await Promise.allSettled([
    getProfile(ticker),
    getPriceMetrics(ticker),
    getRecommendations(ticker),
    getCompanyNews(ticker),
  ]);

  const unavailable = [];
  if (metrics.status === 'rejected') {
    unavailable.push('52-week range and momentum');
  }
  if (recommendation.status === 'rejected') {
    unavailable.push('analyst ratings');
  }
  if (news.status === 'rejected') {
    unavailable.push('company news');
  }

  const profileValue = settledValue(profile);
  const metricsValue = settledValue(metrics);

  return {
    ticker,
    quote,
    profile: profileValue && profileValue.ticker ? profileValue : null,
    metrics: (metricsValue && metricsValue.metric) || null,
    recommendation: settledValue(recommendation) || [],
    articles: filterRelevantArticles(
      normalizeCompanyNews(settledValue(news)),
      ticker,
      profileValue && profileValue.name
    ),
    unavailable,
  };
};

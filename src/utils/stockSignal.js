/**
 * Turns raw market data into a bullish/bearish reading.
 *
 * Every input is weighted and every factor is reported back with its own score
 * and a plain-English detail line, so the verdict on screen can be traced to
 * the numbers behind it. Factors with no data are dropped and the remaining
 * weights are renormalized.
 */

// Verbs are listed in base form and matched across their common inflections, so
// "tumble" also catches "tumbles", "tumbled" and "tumbling". Words that collide
// with everyday English ("fall" as in autumn, "rise" as in sunrise) are listed
// as explicit inflections instead, in the literal lists below.
const BULLISH_VERBS = [
  'surge', 'soar', 'rally', 'jump', 'climb', 'rebound', 'beat', 'upgrade',
  'expand', 'boost', 'outperform', 'accelerate', 'exceed',
];

const BEARISH_VERBS = [
  'tumble', 'plunge', 'plummet', 'slump', 'sink', 'slide', 'downgrade', 'slash',
  'halt', 'delay', 'resign', 'sue', 'probe', 'recall', 'underperform', 'warn',
  'miss', 'stumble',
];

const BULLISH_LITERALS = [
  'beat estimates', 'beats estimates', 'tops estimates', 'topped estimates',
  'record high', 'record revenue', 'record profit', 'all-time high',
  'price target raised', 'raises guidance', 'raised guidance', 'raises outlook',
  'buyback', 'share repurchase', 'dividend increase', 'raises dividend',
  'strong demand', 'strong growth', 'strong results', 'wins contract',
  'new contract', 'approval', 'approved', 'partnership', 'breakthrough',
  'bullish', 'buy rating', 'tailwind', 'momentum', 'gains', 'gained',
  'rises', 'rose', 'rising', 'outlook raised', 'better than expected',
];

const BEARISH_LITERALS = [
  'missed estimates', 'misses estimates', 'falls short', 'price target cut',
  'cuts guidance', 'cut guidance', 'lowers guidance', 'lowered guidance',
  'cuts outlook', 'profit warning', 'selloff', 'sell-off', 'layoffs',
  'job cuts', 'lawsuit', 'subpoena', 'fraud', 'investigation', 'bankruptcy',
  'default', 'weak demand', 'weak results', 'slowing growth', 'loss widens',
  'widening loss', 'bearish', 'sell rating', 'short seller', 'steps down',
  'scandal', 'roadblock', 'setback', 'headwind', 'falls', 'fell', 'falling',
  'drops', 'dropped', 'declines', 'declined', 'worse than expected', 'recalls',
];

const escapeTerm = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Expands a base verb into a pattern covering its regular inflections,
 * accounting for the silent -e ("tumble" -> "tumbl(e|es|ed|ing)").
 */
const inflect = (verb) => {
  const stem = escapeTerm(verb);
  if (/[^aeiou]e$/.test(verb)) {
    return `${stem.slice(0, -1)}(?:e|es|ed|ing)`;
  }
  if (/(?:s|x|z|ch|sh)$/.test(verb)) {
    return `${stem}(?:es|ed|ing)?`;
  }
  return `${stem}(?:s|ed|ing)?`;
};

const buildMatchers = (verbs, literals) => [
  ...verbs.map((verb) => new RegExp(`\\b${inflect(verb)}\\b`, 'i')),
  ...literals.map((term) => new RegExp(`\\b${escapeTerm(term)}\\b`, 'i')),
];

const BULLISH_MATCHERS = buildMatchers(BULLISH_VERBS, BULLISH_LITERALS);
const BEARISH_MATCHERS = buildMatchers(BEARISH_VERBS, BEARISH_LITERALS);

const countMatches = (text, matchers) =>
  matchers.reduce((count, matcher) => (matcher.test(text) ? count + 1 : count), 0);

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

export const scoreToTone = (score) => {
  if (score >= 0.15) {
    return 'bullish';
  }
  if (score <= -0.15) {
    return 'bearish';
  }
  return 'neutral';
};

export const scoreToLabel = (score) => {
  if (score >= 0.45) {
    return 'Strongly bullish';
  }
  if (score >= 0.15) {
    return 'Bullish';
  }
  if (score > -0.15) {
    return 'Neutral';
  }
  if (score > -0.45) {
    return 'Bearish';
  }
  return 'Strongly bearish';
};

const formatSignedPercent = (value) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatPrice = (value) => `$${value.toFixed(2)}`;

/** Classifies one headline (plus its summary) as bullish, bearish or neutral. */
export const classifyHeadline = (article) => {
  const text = `${article.title || ''}. ${article.description || ''}`;
  const bullishHits = countMatches(text, BULLISH_MATCHERS);
  const bearishHits = countMatches(text, BEARISH_MATCHERS);

  if (bullishHits > bearishHits) {
    return 'bullish';
  }
  if (bearishHits > bullishHits) {
    return 'bearish';
  }
  return 'neutral';
};

/** Aggregate headline tone, plus a url -> tone map for tagging the cards. */
export const analyzeHeadlines = (articles = []) => {
  const tones = {};
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  articles.forEach((article) => {
    const tone = classifyHeadline(article);
    tones[article.url] = tone;
    if (tone === 'bullish') {
      bullish += 1;
    } else if (tone === 'bearish') {
      bearish += 1;
    } else {
      neutral += 1;
    }
  });

  return { analyzed: articles.length, bullish, bearish, neutral, tones };
};

const buildRangeFactor = (quote, metrics) => {
  const high = metrics && metrics['52WeekHigh'];
  const low = metrics && metrics['52WeekLow'];
  const price = quote && quote.c;

  if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(price)) {
    return null;
  }
  if (high <= low) {
    return null;
  }

  const position = clamp((price - low) / (high - low), 0, 1);

  return {
    key: 'range',
    name: '52-week range',
    weight: 0.2,
    score: position * 2 - 1,
    detail: `Trading ${Math.round(position * 100)}% of the way up its 52-week range (${formatPrice(low)} - ${formatPrice(high)})`,
  };
};

const buildMomentumFactor = (metrics) => {
  const returns = [
    metrics && metrics['13WeekPriceReturnDaily'],
    metrics && metrics['26WeekPriceReturnDaily'],
    metrics && metrics['52WeekPriceReturnDaily'],
  ].filter(isFiniteNumber);

  if (!returns.length) {
    return null;
  }

  const average = returns.reduce((total, value) => total + value, 0) / returns.length;

  return {
    key: 'momentum',
    name: 'Price momentum',
    weight: 0.25,
    // A 20% average return over the trailing windows counts as a full signal.
    score: clamp(average / 20),
    detail: `Trailing returns average ${formatSignedPercent(average)} across 3, 6 and 12 months`,
  };
};

const buildDayMoveFactor = (quote) => {
  if (!quote || !isFiniteNumber(quote.dp)) {
    return null;
  }

  return {
    key: 'day-move',
    name: "Today's move",
    weight: 0.1,
    // A 5% day counts as a full signal in either direction.
    score: clamp(quote.dp / 5),
    detail: `${formatSignedPercent(quote.dp)} versus the previous close`,
  };
};

const buildAnalystFactor = (recommendation) => {
  const latest = Array.isArray(recommendation) ? recommendation[0] : null;
  if (!latest) {
    return null;
  }

  const strongBuy = latest.strongBuy || 0;
  const buy = latest.buy || 0;
  const hold = latest.hold || 0;
  const sell = latest.sell || 0;
  const strongSell = latest.strongSell || 0;
  const total = strongBuy + buy + hold + sell + strongSell;

  if (!total) {
    return null;
  }

  return {
    key: 'analysts',
    name: 'Analyst ratings',
    weight: 0.2,
    score: (strongBuy * 2 + buy - sell - strongSell * 2) / (total * 2),
    detail: `${strongBuy + buy} buy, ${hold} hold, ${sell + strongSell} sell out of ${total} analysts (${latest.period})`,
  };
};

const buildNewsFactor = (news) => {
  if (!news || !news.analyzed) {
    return null;
  }

  const decided = news.bullish + news.bearish;
  // Below five opinionated headlines the sample is thin, so scale the signal
  // down rather than reading a 2-0 split as full conviction.
  const score = decided
    ? clamp(((news.bullish - news.bearish) / decided) * Math.min(1, decided / 5))
    : 0;

  return {
    key: 'news',
    name: 'News sentiment',
    weight: 0.25,
    score,
    detail: `${news.bullish} bullish, ${news.bearish} bearish and ${news.neutral} neutral headlines out of ${news.analyzed}`,
  };
};

/**
 * Combines every available factor into one weighted score in [-1, 1].
 */
export const buildStockSignal = ({ quote, metrics, recommendation, articles }) => {
  const news = analyzeHeadlines(articles);

  const factors = [
    buildRangeFactor(quote, metrics),
    buildMomentumFactor(metrics),
    buildDayMoveFactor(quote),
    buildAnalystFactor(recommendation),
    buildNewsFactor(news),
  ].filter(Boolean);

  const totalWeight = factors.reduce((total, factor) => total + factor.weight, 0);
  const score = totalWeight
    ? factors.reduce((total, factor) => total + factor.score * factor.weight, 0) /
      totalWeight
    : 0;

  return {
    score,
    label: scoreToLabel(score),
    tone: scoreToTone(score),
    news,
    factors: factors.map((factor) => ({
      ...factor,
      tone: scoreToTone(factor.score),
      // Share of the verdict this factor was responsible for.
      share: Math.round((factor.weight / totalWeight) * 100),
    })),
  };
};

/**
 * Headline classification.
 *
 * Marketaux returns a sentiment_score per matched entity, which is the primary
 * signal. It is frequently absent or exactly 0 though (no sentiment detected),
 * so a keyword lexicon fills the gap rather than letting those headlines
 * silently count as neutral.
 */

// Verbs are stored in base form and matched across their inflections, so
// "tumble" also catches "tumbles", "tumbled" and "tumbling". Words that collide
// with everyday English ("fall" as in autumn) live in the literal lists.
const BULLISH_VERBS = [
  'surge', 'soar', 'rally', 'jump', 'climb', 'rebound', 'beat', 'upgrade',
  'expand', 'boost', 'outperform', 'accelerate', 'exceed',
];

const BEARISH_VERBS = [
  'tumble', 'plunge', 'plummet', 'slump', 'sink', 'slide', 'downgrade', 'slash',
  'halt', 'delay', 'resign', 'sue', 'probe', 'recall', 'underperform', 'warn',
  'miss', 'stumble', 'drag', 'cripple', 'lag',
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

/** "tumble" -> tumbl(e|es|ed|ing), respecting the silent -e. */
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

// Below this magnitude a provider score is treated as "no opinion".
const SENTIMENT_EPSILON = 0.05;
const TONE_THRESHOLD = 0.15;

export const scoreToTone = (score) => {
  if (score >= TONE_THRESHOLD) {
    return 'bullish';
  }
  if (score <= -TONE_THRESHOLD) {
    return 'bearish';
  }
  return 'neutral';
};

export const scoreToLabel = (score) => {
  if (score >= 0.45) {
    return 'Strongly bullish';
  }
  if (score >= TONE_THRESHOLD) {
    return 'Bullish';
  }
  if (score > -TONE_THRESHOLD) {
    return 'Neutral';
  }
  if (score > -0.45) {
    return 'Bearish';
  }
  return 'Strongly bearish';
};

/** Lexicon score in [-1, 1] from the words in a headline. */
export const scoreByKeywords = (text) => {
  const bullishHits = countMatches(text, BULLISH_MATCHERS);
  const bearishHits = countMatches(text, BEARISH_MATCHERS);
  const decided = bullishHits + bearishHits;

  if (!decided) {
    return 0;
  }
  // Two or more matching terms in one direction reads as full conviction.
  return Math.max(-1, Math.min(1, ((bullishHits - bearishHits) / decided) * Math.min(1, decided / 2)));
};

const hasOpinion = (value) =>
  typeof value === 'number' && Math.abs(value) >= SENTIMENT_EPSILON;

/**
 * Decides one article's tone.
 *
 * This is a headline classifier, so headline evidence wins. Marketaux scores an
 * entity wherever it appears, which is often deep in the body: an article
 * headlined "Tech Sector Drags on Markets" can carry a +0.72 score for TSLA
 * because of a positive mention further down. Reporting that as the headline's
 * tone would be wrong, so the provider's article-level score is used only as a
 * last resort and is labelled as coming from the body.
 *
 * Priority: the provider's score for the entity in the title, then a keyword
 * reading of the headline, then the provider's article-level score.
 */
export const classifyArticle = ({ title, description, providerScore, titleScore }) => {
  if (hasOpinion(titleScore)) {
    return { score: titleScore, tone: scoreToTone(titleScore), source: 'headline' };
  }

  const keywordScore = scoreByKeywords(`${title || ''}. ${description || ''}`);
  if (keywordScore !== 0) {
    return { score: keywordScore, tone: scoreToTone(keywordScore), source: 'keywords' };
  }

  if (hasOpinion(providerScore)) {
    return { score: providerScore, tone: scoreToTone(providerScore), source: 'article' };
  }

  return { score: 0, tone: 'neutral', source: 'none' };
};

/** Rolls scored articles up into one verdict for the ticker. */
export const summarize = (articles) => {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  articles.forEach((article) => {
    counts[article.sentiment.tone] += 1;
  });

  const decided = counts.bullish + counts.bearish;
  const total = articles.length;
  const mean = total
    ? articles.reduce((sum, article) => sum + article.sentiment.score, 0) / total
    : 0;

  // A lone opinionated headline should not read as full conviction, so scale
  // the average up to a five-article sample.
  const confidenceScale = decided ? Math.min(1, decided / 5) : 0;
  const score = Number((mean * confidenceScale).toFixed(4));

  return {
    score,
    tone: scoreToTone(score),
    label: scoreToLabel(score),
    counts,
    analyzed: total,
    decided,
  };
};

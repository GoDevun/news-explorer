import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyArticle,
  scoreByKeywords,
  summarize,
  scoreToTone,
} from '../src/services/sentiment.js';

test('provider sentiment wins when it has an opinion', () => {
  const result = classifyArticle({ title: 'Anything', providerScore: 0.78 });
  assert.equal(result.tone, 'bullish');
  assert.equal(result.source, 'provider');
});

test('falls back to keywords when the provider score is missing or zero', () => {
  const missing = classifyArticle({ title: 'Shares plunge after guidance cut' });
  assert.equal(missing.tone, 'bearish');
  assert.equal(missing.source, 'keywords');

  const zero = classifyArticle({
    title: 'Company beats estimates as revenue surges',
    providerScore: 0,
  });
  assert.equal(zero.tone, 'bullish');
  assert.equal(zero.source, 'keywords');
});

test('keyword matching covers verb inflections', () => {
  assert.ok(scoreByKeywords('Tesla stock is tumbling toward a roadblock') < 0);
  assert.ok(scoreByKeywords('Nvidia shares surging on record revenue') > 0);
});

test('does not mistake the season for a price move', () => {
  assert.equal(scoreByKeywords('Apple announces its fall product launch event'), 0);
});

test('genuinely neutral headlines stay neutral', () => {
  const result = classifyArticle({ title: 'Company announces shareholder meeting date' });
  assert.equal(result.tone, 'neutral');
  assert.equal(result.source, 'none');
});

test('summarize counts tones and scales down a thin sample', () => {
  const strong = summarize(
    Array.from({ length: 5 }, () => ({ sentiment: { score: 0.8, tone: 'bullish' } }))
  );
  assert.equal(strong.counts.bullish, 5);
  assert.equal(strong.tone, 'bullish');

  // One opinionated headline must not read as full conviction.
  const thin = summarize([{ sentiment: { score: 0.8, tone: 'bullish' } }]);
  assert.ok(thin.score < strong.score);
});

test('an empty feed is neutral rather than a crash', () => {
  const empty = summarize([]);
  assert.equal(empty.score, 0);
  assert.equal(empty.tone, 'neutral');
  assert.equal(empty.analyzed, 0);
});

test('tone thresholds', () => {
  assert.equal(scoreToTone(0.2), 'bullish');
  assert.equal(scoreToTone(-0.2), 'bearish');
  assert.equal(scoreToTone(0.05), 'neutral');
});

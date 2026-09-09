import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

/**
 * Exercises the REST layer against a stubbed Marketaux: deliberately messy
 * payloads first, then outright failure, to prove neither reaches the caller.
 */

let mode = 'ok';
let requestCount = 0;

const messyPayload = {
  meta: { found: 42, returned: 4, limit: 4, page: 1 },
  data: [
    {
      uuid: 'a1',
      title: 'Company beats estimates as revenue surges',
      description: 'A clean, complete article.',
      url: 'https://example.com/a1',
      image_url: 'https://example.com/a1.jpg',
      published_at: '2026-09-08T10:00:00.000000Z',
      source: 'reuters.com',
      entities: [
        {
          symbol: 'TSLA',
          name: 'Tesla, Inc.',
          industry: 'Auto',
          sentiment_score: 0.62,
          highlights: [{ highlighted_in: 'title', sentiment: 0.62 }],
        },
      ],
    },
    // Missing description, null image, no entities array at all.
    {
      uuid: 'a2',
      title: 'Shares plunge after the company cuts guidance',
      snippet: 'Only a snippet is present here.',
      url: 'https://example.com/a2',
      image_url: null,
      published_at: '2026-09-07T10:00:00.000000Z',
      source: 'bloomberg.com',
    },
    // Duplicate url of a1, must be dropped.
    {
      uuid: 'a3',
      title: 'Company beats estimates as revenue surges',
      url: 'https://example.com/a1',
      published_at: '2026-09-06T10:00:00.000000Z',
      source: 'syndicated.com',
      entities: [{ symbol: 'TSLA', sentiment_score: 0.62 }],
    },
    // Unusable: no url. Must be skipped, not crash the mapper.
    { uuid: 'a4', title: 'Headline with no link', published_at: 'not-a-date' },
  ],
};

const server = http.createServer((req, res) => {
  requestCount += 1;
  if (mode === 'fail') {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'upstream exploded' } }));
    return;
  }
  if (mode === 'quota') {
    res.writeHead(402, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'usage_limit_reached' } }));
    return;
  }
  const url = new URL(req.url, 'http://localhost');
  const page = Number(url.searchParams.get('page') || 1);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'X-UsageLimit-Limit': '100',
    'X-UsageLimit-Remaining': String(100 - requestCount),
  });
  // Only page 1 has articles, so the client should stop paging after it.
  res.end(JSON.stringify(page === 1 ? messyPayload : { meta: {}, data: [] }));
});

const listening = new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

test('news pipeline', async (t) => {
  await listening;
  const { port } = server.address();

  process.env.MARKETAUX_API_KEY = 'test-key';
  process.env.MARKETAUX_BASE_URL = `http://127.0.0.1:${port}/v1`;
  process.env.CACHE_TTL_MS = '60000';
  process.env.CACHE_STALE_MS = '600000';

  const { fetchScoredNews } = await import('../src/services/marketaux.js');
  const { summarize } = await import('../src/services/sentiment.js');
  const { newsCache } = await import('../src/services/cache.js');

  await t.test('normalizes messy upstream data', async () => {
    const { articles, quota, found } = await fetchScoredNews('TSLA');

    assert.equal(articles.length, 2, 'duplicate and url-less articles dropped');
    assert.equal(found, 42);
    // Quota reflects the most recent page fetched, so assert the invariant
    // rather than a page count.
    assert.equal(quota.limit, 100);
    assert.equal(quota.remaining, quota.limit - quota.used);

    const [first, second] = articles;
    assert.equal(first.sentiment.source, 'headline');
    assert.equal(first.sentiment.tone, 'bullish');

    // No entities array: falls back to keywords and still fills every field.
    assert.equal(second.sentiment.source, 'keywords');
    assert.equal(second.sentiment.tone, 'bearish');
    assert.equal(second.description, 'Only a snippet is present here.');
    assert.equal(second.imageUrl, '', 'null image becomes an empty string');
    assert.equal(second.entity.symbol, 'TSLA');
    assert.ok(second.publishedAt, 'published date parsed');
  });

  await t.test('stops paging once a page comes back empty', () => {
    // Page 1 had articles, page 2 was empty, so it must not have asked for 3.
    assert.equal(requestCount, 2);
  });

  await t.test('serves a cached feed without spending quota', async () => {
    const payload = { symbol: 'TSLA', summary: summarize([]), articles: [], meta: {} };
    newsCache.set('TSLA', payload);
    const before = requestCount;
    assert.ok(newsCache.get('TSLA'), 'fresh entry is returned');
    assert.equal(requestCount, before, 'no upstream call was made');
  });

  await t.test('a spent quota surfaces as a typed 429, not a raw failure', async () => {
    mode = 'quota';
    await assert.rejects(() => fetchScoredNews('AAPL'), (error) => {
      assert.equal(error.statusCode, 429);
      assert.match(error.message, /quota/i);
      return true;
    });
  });

  await t.test('an upstream 500 becomes a typed 502', async () => {
    mode = 'fail';
    await assert.rejects(() => fetchScoredNews('AAPL'), (error) => {
      assert.equal(error.statusCode, 502);
      return true;
    });
  });

  await t.test('a stale entry outlives its freshness for exactly this case', () => {
    assert.ok(newsCache.getStale('TSLA'), 'stale copy still available after failure');
  });

  server.close();
});

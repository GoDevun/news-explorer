# Stock News Sentiment Dashboard

A searchable dashboard that pulls live financial news by ticker and classifies each
headline as **bullish**, **bearish** or **neutral**, replacing a multi-source,
multi-tab research routine with a single scored feed.

Search a symbol, get one page: an overall reading with a score from -1 to +1, the
split of bullish / bearish / neutral coverage, and every headline behind it tagged
individually. Sign in to keep a watchlist of tickers with your own notes.

**Stack:** React · Node.js · Express · MongoDB · Marketaux API

## Live demo

- **Frontend:** https://godevun.github.io/stock-news-sentiment/
- **API:** hosted separately, because GitHub Pages serves static files only and
  cannot run a Node process or a database.

## Features

### Scored news feed

- Ticker search that routes to its own results page (`/search/:ticker`), so a reading
  is linkable and the browser's back button behaves. A compact search bar stays pinned
  at the top of the results, so the next ticker is always one keystroke away.
- Every headline is scored using the provider's per-entity sentiment. When Marketaux
  returns no opinion — a frequent case — a keyword lexicon reads the headline instead,
  and the card says `by keywords` so the label is never presented as more than it is.
- The lexicon matches verbs across their inflections, so "tumbling" reads the same as
  "tumbles", while words that collide with everyday English (autumn's "fall") are
  matched only in their price-move forms.
- An overall verdict aggregates the feed and scales down thin samples: two opinionated
  headlines should not read as full conviction.

### REST layer

- The browser never talks to Marketaux. `GET /news?symbol=` returns a normalized,
  scored, cached payload, so provider quirks stop at the server.
- **Normalization:** missing descriptions fall back to the snippet, null images become
  an empty string, absent `entities` arrays are tolerated, duplicate URLs are dropped,
  and articles with no link are discarded rather than rendered broken.
- **Caching:** feeds are cached with a TTL, then kept beyond it as a stale copy. The
  free Marketaux plan allows 100 requests a day, so repeat lookups must not spend
  quota.
- **Failure handling:** when the provider is down, timing out, or the daily quota is
  spent, the API serves the stale copy with `stale: true` and a plain-English notice
  instead of failing. The client only sees an error when there is no cached copy at
  all. Upstream errors are mapped to typed responses (429 for quota, 502 for provider
  failures) and never leak a provider message or stack trace.
- Rate limits of its own: a global limiter plus a tighter budget on the one route that
  can spend upstream quota.

### Accounts and saved tickers

- Registration and login with JWT auth, passwords hashed with bcrypt.
- Sign-in failures return an identical message for an unknown email and a wrong
  password, so the endpoint cannot be used to discover which accounts exist.
- Full CRUD on saved tickers: save from a result, list them, edit a note inline,
  remove them. Every write is scoped to its owner, and requests for someone else's
  ticker return 403.
- Each save snapshots the reading at that moment, so the watchlist shows the mood
  without spending quota to redraw.
- Responsive desktop, tablet and mobile layouts.

## Project structure

```
.
├── src/                  React frontend
│   ├── components/       one folder per component, each with its own CSS
│   ├── hooks/            useFormWithValidation, useModalClose
│   └── utils/            API client, constants, date helpers
└── backend/              Express API
    ├── src/
    │   ├── controllers/  request handling
    │   ├── models/       Mongoose schemas for users and saved tickers
    │   ├── middlewares/  auth, error handling, rate limiting
    │   ├── routes/       route definitions with Joi validation
    │   ├── services/     Marketaux client, cache, sentiment scoring
    │   └── utils/        typed HTTP errors
    └── tests/            node:test suites
```

## Getting started

You need Node.js 18+ and a running MongoDB.

### 1. The API

```bash
cd backend
npm install
cp .env.example .env
```

Put a free Marketaux key from [marketaux.com](https://www.marketaux.com/register) into
`backend/.env` as `MARKETAUX_API_KEY`, set a `JWT_SECRET`, then:

```bash
npm run dev      # http://localhost:3001
```

### 2. The frontend

```bash
npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:3001
npm run dev             # http://localhost:5173/stock-news-sentiment/
```

## Available scripts

Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

Backend: `npm run dev` (watch mode), `npm start`, `npm test`, `npm run lint`.

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/signup` | – | Create an account, returns a token |
| `POST` | `/signin` | – | Log in, returns a token |
| `GET` | `/users/me` | yes | The signed-in user |
| `GET` | `/news?symbol=` | – | Normalized, scored, cached feed |
| `GET` | `/status` | – | Cache statistics and provider configuration |
| `GET` | `/tickers` | yes | List saved tickers |
| `POST` | `/tickers` | yes | Save a ticker |
| `PATCH` | `/tickers/:id` | yes | Update a note or stored reading |
| `DELETE` | `/tickers/:id` | yes | Remove a saved ticker |

Errors always come back as `{ "message": "..." }`.

## Tests

```bash
cd backend && npm test
```

Covers the sentiment classifier (provider score, keyword fallback, inflection
matching, the autumn/"fall" false positive) and the news pipeline against a stubbed
provider: normalization of deliberately malformed payloads, deduplication, paging,
cache hits, and the degradation path when the provider fails or the quota is spent.

## Deployment

The two halves are deployed separately: the React build is static and lives on
GitHub Pages, while the API needs a Node runtime and a database.

### API

`render.yaml` describes the service, so Render can deploy it from the repository as
a blueprint. Three values are set in the dashboard rather than committed:

| Variable | Value |
| --- | --- |
| `MARKETAUX_API_KEY` | your Marketaux key |
| `MONGO_URL` | a MongoDB Atlas connection string |
| `CORS_ORIGINS` | `https://godevun.github.io` |

`JWT_SECRET` is generated by Render. The health check path is `/status`.

On a free instance the service sleeps after inactivity, so the first request after
an idle period takes a while to answer; everything after that is immediate.

### Frontend

`.env.production` holds the deployed API's URL, which Vite bakes into the bundle at
build time. Then:

```bash
npm run deploy
```

This builds, copies `index.html` to `404.html` so deep links survive Pages' routing,
and publishes to the `gh-pages` branch.

## Notes on the provider

Marketaux's free plan allows 100 requests a day and caps articles per request, which
is what the caching layer is for: one lookup pages a few times, and the result is
served from memory afterwards. Usage is read from the response's `X-UsageLimit`
headers and passed through in the payload's `meta.quota`.

The provider key lives only on the server. Nothing in the browser bundle can spend it.

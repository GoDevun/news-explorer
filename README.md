# NewsExplorer

Final project for the TripleTen Software Engineering program. NewsExplorer is a React
application that lets users search recent news articles by keyword through the
[News API](https://newsapi.org) and save the ones they care about to a personal account.
A `/stocks` page extends the same idea to the market: enter a ticker and the app reads a
bullish or bearish signal from live quotes, analyst ratings and recent company headlines
via [Finnhub](https://finnhub.io).

## Live demo

- **Frontend:** https://godevun.github.io/news-explorer/

<!-- TODO: after recording the pitch video, uncomment this line and paste the URL.
- **Project walkthrough (video):** PASTE_VIDEO_URL_HERE
-->

## Features

- Keyword search against the News API covering the last seven days, with client-side
  validation that shows "Please enter a keyword" when the field is empty.
- A spinning preloader while the request is in flight, a "Nothing found" state when the
  search returns no articles, and an error message if the request fails.
- Results render three cards at a time; a "Show more" button reveals the next three and
  disappears once every article is on the page.
- Saving articles from a card. Signed-out visitors see a "Sign in to save articles"
  tooltip and get the registration modal when they click the bookmark.
- A `/saved-news` page listing saved articles with the keyword each was found by and a
  trash icon to remove them.
- Registration and login modals built on a single reusable `ModalWithForm` component,
  closable by the cross icon, a click on the overlay, or the Escape key.
- Two header states — a "Sign in" button when signed out, and the username plus a
  "Saved articles" link when signed in.

### Stock signals

- A `/stocks` page that takes a ticker (or one of the quick-pick chips) and returns a
  quote card: price, day change, open, previous close, day range, market cap and a
  marker showing where the price sits in its 52-week range.
- A bullish/bearish reading scored from -1 to +1 out of five weighted factors — 52-week
  range position (20%), price momentum across 3, 6 and 12 months (25%), today's move
  (10%), analyst ratings (20%) and news sentiment (25%). Every factor is shown with its
  own score, tone and a plain-English explanation, so the verdict is traceable.
- Company headlines from the last 14 days, each tagged bullish, bearish or neutral by a
  keyword lexicon over the headline and summary. They reuse the same cards as the news
  search, so signed-in users can save them; saved stock articles keep the ticker as
  their keyword.
- Factors with no data are dropped and the remaining weights renormalize, so a symbol
  with, say, no analyst coverage still gets a reading instead of an error.

## Tech stack

- React 18 with functional components and hooks
- React Router v5 for routing
- Vite for the build tooling
- Plain CSS with BEM naming, no CSS framework
- The Fetch API for all network requests, with no third-party HTTP libraries
- Finnhub for quotes, company profiles, basic financials, analyst recommendation trends
  and company news — all free-tier endpoints

## Project structure

```
src/
├── components/     JSX components, each with its own CSS file
├── hooks/          useFormWithValidation, useModalClose
├── images/         SVG icons and raster assets
├── utils/          constants, News API and Finnhub clients, the bullish/bearish signal
│                   engine, simulated backend, date helpers
└── vendor/         normalize.css and @font-face declarations
```

## Simulated backend

The real backend arrives in Stage 2. Until then, `src/utils/fakeApi.js` stands in for it:
registration, login, token checking, and saving or deleting articles all resolve
asynchronously and persist to `localStorage`, so the whole signed-in experience is
reviewable without a server.

## Getting started

Install the dependencies:

```bash
npm install
```

Add your API keys. Register for a free News API key at
[newsapi.org/register](https://newsapi.org/register) and a free market data key at
[finnhub.io/register](https://finnhub.io/register), then create a `.env` file based on
`.env.example`:

```bash
cp .env.example .env
```

```
VITE_NEWS_API_KEY=your_key_here
VITE_FINNHUB_API_KEY=your_finnhub_key_here
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173/news-explorer/`.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Publish `dist/` to GitHub Pages |

## A note on the News API

The free News API tier only serves requests from `localhost`. In production the app
switches to the proxy at `https://nomoreparties.co/news/v2/everything`, handled
automatically in `src/utils/constants.js`.

## A note on the market data API

Finnhub serves browser requests with `Access-Control-Allow-Origin: *`, so the stocks page
calls it directly in both development and production — no proxy needed. The free tier
allows 60 calls a minute and one ticker lookup costs five, so a rapid burst of searches
returns a rate-limit message rather than data.

Like the News API key, the Finnhub key is a `VITE_` variable and therefore visible in the
built bundle. That is fine for a free read-only market data key, but any paid key belongs
behind the Stage 2 backend instead.

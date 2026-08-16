# NewsExplorer

Final project for the TripleTen Software Engineering program. NewsExplorer is a React
application that lets users search recent news articles by keyword through the
[News API](https://newsapi.org) and save the ones they care about to a personal account.

## Live demo

- **Frontend:** _deployment link to be added_

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

## Tech stack

- React 18 with functional components and hooks
- React Router v5 for routing
- Vite for the build tooling
- Plain CSS with BEM naming, no CSS framework
- The Fetch API for all network requests, with no third-party HTTP libraries

## Project structure

```
src/
├── components/     JSX components, each with its own CSS file
├── hooks/          useFormWithValidation, useEscapeClose
├── images/         SVG icons and raster assets
├── utils/          constants, News API client, simulated backend, date helpers
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

Add your News API key. Register for a free key at
[newsapi.org/register](https://newsapi.org/register), then create a `.env` file based on
`.env.example`:

```bash
cp .env.example .env
```

```
VITE_NEWS_API_KEY=your_key_here
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

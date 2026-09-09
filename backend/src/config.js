import dotenv from 'dotenv';

dotenv.config();

const { NODE_ENV } = process.env;
const isProduction = NODE_ENV === 'production';

// The fallback secret keeps local development frictionless, but a production
// boot without a real secret is a security bug, not a convenience.
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-me');

if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

const rawMarketauxKey = (process.env.MARKETAUX_API_KEY || '').trim();

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 3001,
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/stock-news-sentiment',
  jwtSecret,
  jwtExpiresIn: '7d',
  marketaux: {
    apiKey: rawMarketauxKey.startsWith('REPLACE_WITH') ? '' : rawMarketauxKey,
    baseUrl: process.env.MARKETAUX_BASE_URL || 'https://api.marketaux.com/v1',
    // The free plan caps articles per request, so one lookup pages a few
    // times and the result is cached hard.
    pagesPerLookup: Number(process.env.MARKETAUX_PAGES) || 3,
    timeoutMs: 8000,
  },
  cache: {
    ttlMs: Number(process.env.CACHE_TTL_MS) || 15 * 60 * 1000,
    staleMs: Number(process.env.CACHE_STALE_MS) || 24 * 60 * 60 * 1000,
  },
};

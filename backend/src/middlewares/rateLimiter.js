import rateLimit from 'express-rate-limit';

/** Protects the whole API from a runaway client. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

/**
 * The news route is the only one that can spend Marketaux quota, so it gets a
 * tighter budget of its own. Cached lookups still pass through here, which is
 * fine: the limit is about protecting the upstream key, not the database.
 */
export const newsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many ticker lookups, please slow down' },
});

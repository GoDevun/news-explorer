import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { usersRouter, signinValidator, signupValidator } from './users.js';
import { tickersRouter } from './tickers.js';
import { getNewsBySymbol, getStatus } from '../controllers/news.js';
import { createUser, login } from '../controllers/users.js';
import { newsLimiter } from '../middlewares/rateLimiter.js';
import { requireDatabase } from '../middlewares/requireDatabase.js';
import { NotFoundError } from '../utils/errors.js';

export const router = Router();

router.post('/signup', requireDatabase, signupValidator, createUser);
router.post('/signin', requireDatabase, signinValidator, login);

router.get(
  '/news',
  newsLimiter,
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      symbol: Joi.string().required().uppercase().max(10).pattern(/^[A-Z][A-Z.-]{0,9}$/),
    }),
  }),
  getNewsBySymbol
);

router.get('/status', getStatus);

router.use('/users', requireDatabase, usersRouter);
router.use('/tickers', requireDatabase, tickersRouter);

router.use((req, res, next) => next(new NotFoundError('Requested resource not found')));

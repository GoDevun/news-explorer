import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import {
  createTicker,
  deleteTicker,
  listTickers,
  updateTicker,
} from '../controllers/tickers.js';
import { auth } from '../middlewares/auth.js';

const sentimentSchema = Joi.object().keys({
  score: Joi.number().min(-1).max(1),
  tone: Joi.string().valid('bullish', 'bearish', 'neutral'),
  label: Joi.string().max(40),
  capturedAt: Joi.date(),
});

export const tickersRouter = Router();

tickersRouter.use(auth);

tickersRouter.get('/', listTickers);

tickersRouter.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      symbol: Joi.string().required().uppercase().max(10).pattern(/^[A-Z][A-Z.-]{0,9}$/),
      companyName: Joi.string().allow('').max(120),
      note: Joi.string().allow('').max(280),
      lastSentiment: sentimentSchema,
    }),
  }),
  createTicker
);

tickersRouter.patch(
  '/:id',
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({ id: Joi.string().hex().length(24) }),
    [Segments.BODY]: Joi.object()
      .keys({ note: Joi.string().allow('').max(280), lastSentiment: sentimentSchema })
      .min(1),
  }),
  updateTicker
);

tickersRouter.delete(
  '/:id',
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({ id: Joi.string().hex().length(24) }),
  }),
  deleteTicker
);

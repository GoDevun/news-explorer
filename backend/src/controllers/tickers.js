import { SavedTicker } from '../models/savedTicker.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export const listTickers = async (req, res, next) => {
  try {
    const tickers = await SavedTicker.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.send(tickers);
  } catch (error) {
    next(error);
  }
};

export const createTicker = async (req, res, next) => {
  const { symbol, companyName, note, lastSentiment } = req.body;

  try {
    const ticker = await SavedTicker.create({
      owner: req.user._id,
      symbol,
      companyName,
      note,
      lastSentiment,
    });
    res.status(201).send(ticker);
  } catch (error) {
    if (error.code === 11000) {
      next(new ConflictError('That ticker is already saved'));
      return;
    }
    next(error);
  }
};

export const updateTicker = async (req, res, next) => {
  const { note, lastSentiment } = req.body;

  try {
    const ticker = await SavedTicker.findById(req.params.id)
      .select('+owner')
      .orFail(() => new NotFoundError('Saved ticker not found'));

    if (ticker.owner.toString() !== req.user._id) {
      throw new ForbiddenError('You can only edit your own saved tickers');
    }

    if (note !== undefined) {
      ticker.note = note;
    }
    if (lastSentiment !== undefined) {
      ticker.lastSentiment = lastSentiment;
    }

    await ticker.save();
    res.send(await SavedTicker.findById(ticker._id));
  } catch (error) {
    next(error);
  }
};

export const deleteTicker = async (req, res, next) => {
  try {
    const ticker = await SavedTicker.findById(req.params.id)
      .select('+owner')
      .orFail(() => new NotFoundError('Saved ticker not found'));

    if (ticker.owner.toString() !== req.user._id) {
      throw new ForbiddenError('You can only remove your own saved tickers');
    }

    await ticker.deleteOne();
    res.send({ _id: ticker._id, symbol: ticker.symbol });
  } catch (error) {
    next(error);
  }
};

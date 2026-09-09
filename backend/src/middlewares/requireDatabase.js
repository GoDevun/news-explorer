import { dbState } from '../db.js';
import { ServiceUnavailableError } from '../utils/errors.js';

/** Guards the routes that cannot work without persistence. */
export const requireDatabase = (req, res, next) => {
  if (!dbState.connected) {
    next(
      new ServiceUnavailableError(
        'Accounts are temporarily unavailable. Please try again shortly.'
      )
    );
    return;
  }
  next();
};

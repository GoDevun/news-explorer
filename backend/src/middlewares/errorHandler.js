import { isCelebrateError } from 'celebrate';

const firstCelebrateMessage = (error) => {
  const details = [...error.details.values()];
  return details.length ? details[0].message : 'Invalid request data';
};

/**
 * The single place that decides what a client sees. Mongoose and validation
 * failures are translated here so no controller leaks a driver-specific
 * message, and unexpected errors never reveal a stack trace.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
export const errorHandler = (err, req, res, next) => {
  if (isCelebrateError(err)) {
    res.status(400).send({ message: firstCelebrateMessage(err) });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).send({ message: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).send({ message: 'That id is not valid' });
    return;
  }

  if (err.code === 11000) {
    res.status(409).send({ message: 'That resource already exists' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'An error occurred on the server' : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).send({ message });
};

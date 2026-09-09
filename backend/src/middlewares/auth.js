import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UnauthorizedError } from '../utils/errors.js';

const extractToken = (header) => {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.replace('Bearer ', '');
};

export const auth = (req, res, next) => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    next(new UnauthorizedError('Authorization required'));
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new UnauthorizedError('Authorization required'));
  }
};

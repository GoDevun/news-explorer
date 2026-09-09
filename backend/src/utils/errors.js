/**
 * Typed errors so controllers can express intent and a single error handler
 * decides what the client actually sees.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Invalid request data') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authorization required') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have access to this resource') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'That resource already exists') {
    super(409, message);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too many requests') {
    super(429, message);
  }
}

/** A dependency this route needs (the database) is not available yet. */
export class ServiceUnavailableError extends HttpError {
  constructor(message = 'This feature is temporarily unavailable') {
    super(503, message);
  }
}

/** Upstream (Marketaux) is unreachable, erroring, or out of quota. */
export class UpstreamError extends HttpError {
  constructor(message = 'The news provider is unavailable') {
    super(502, message);
  }
}

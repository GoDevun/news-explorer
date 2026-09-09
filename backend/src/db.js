import mongoose from 'mongoose';
import { config } from './config.js';

/**
 * Database connection with retry.
 *
 * The scored news feed needs no database at all, so a database that is down,
 * misconfigured, or still waking up must not take the whole API with it. The
 * server listens immediately and keeps retrying in the background; routes that
 * genuinely need persistence say so with a 503 until it is up.
 */

export const dbState = { connected: false, lastError: null };

const MAX_RETRY_MS = 60000;

export const connectToDatabase = (retryMs = 5000) =>
  mongoose
    .connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      dbState.connected = true;
      dbState.lastError = null;
      console.log('MongoDB connected');
    })
    .catch((error) => {
      dbState.connected = false;
      dbState.lastError = error.message;
      console.error(
        `MongoDB connection failed (${error.message}); retrying in ${retryMs}ms`
      );
      const timer = setTimeout(
        () => connectToDatabase(Math.min(retryMs * 2, MAX_RETRY_MS)),
        retryMs
      );
      timer.unref();
    });

mongoose.connection.on('disconnected', () => {
  dbState.connected = false;
});
mongoose.connection.on('connected', () => {
  dbState.connected = true;
});

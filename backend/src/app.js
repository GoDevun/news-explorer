import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { connectToDatabase } from './db.js';
import { router } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const app = express();

// Render (like most hosts) terminates TLS at a proxy, so the rate limiter has
// to read the forwarded address or it would see every request as one client.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors(
    config.corsOrigins.length ? { origin: config.corsOrigins } : {}
  )
);
app.use(express.json());
app.use(apiLimiter);

app.use(router);

app.use(errorHandler);

// Listen first so the news feed and health check are available immediately,
// then bring the database up behind it.
app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});

connectToDatabase();

export { app };

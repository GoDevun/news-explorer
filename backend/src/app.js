import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { router } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

app.use(router);

app.use(errorHandler);

const start = async () => {
  await mongoose.connect(config.mongoUrl);
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start the server:', error.message);
  process.exit(1);
});

export { app };

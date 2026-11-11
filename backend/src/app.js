/**
 * Express application (no listening here — see server.js). Kept separate so
 * tests can import the app with Supertest without opening a port.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1); // correct client IPs behind AWS ALB / CloudFront

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.clientUrls,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Rate limiting (relaxed globally, stricter on auth). Disabled during tests.
if (!config.isTest) {
  app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: { success: false, message: 'Too many attempts, try again later' } })
  );
}

app.get('/', (_req, res) => res.json({ name: 'CampusOne API', version: '1.0.0', docs: '/api/health' }));

app.use('/api', apiRouter);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { listingsRouter } from './modules/listings/listings.routes';
import { reservationsRouter } from './modules/reservations/reservations.routes';
import { supplierRouter } from './modules/supplier/supplier.routes';
import { recipientRouter } from './modules/recipient/recipient.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { sendError } from './utils/apiResponse';

export function createApp(): Express {
  const app = express();

  // 1. Security & Core Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: [
        env.FRONTEND_ORIGIN,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 2. Health check endpoints
  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);

  // 3. API module routing (mounted on both /api/path and /path for maximum frontend compatibility)
  app.use('/api/auth', authRouter);
  app.use('/auth', authRouter);

  app.use('/api/listings', listingsRouter);
  app.use('/listings', listingsRouter);

  app.use('/api/reservations', reservationsRouter);
  app.use('/reservations', reservationsRouter);

  app.use('/api/supplier', supplierRouter);
  app.use('/supplier', supplierRouter);

  app.use('/api/recipient', recipientRouter);
  app.use('/recipient', recipientRouter);

  app.use('/api/notifications', notificationsRouter);
  app.use('/notifications', notificationsRouter);

  // 4. 404 Not Found Catch-All
  app.use((req: Request, res: Response) => {
    sendError(res, `Cannot ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  });

  // 5. Centralized Error Handling
  app.use(errorHandler);

  return app;
}

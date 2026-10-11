import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../../lib/prisma';
import { env } from '../../config/env';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const dbHealth = await checkDbConnection();
  const isHealthy = dbHealth.connected;

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      connected: dbHealth.connected,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
  };

  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json(payload);
});

import { Request, Response } from 'express';
import * as analyticsService from './analytics.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function getSupplierAnalytics(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const period = (req.query.period as string) || '30d';
  const data = await analyticsService.getSupplierMetrics(req.user.organizationId, period);
  sendSuccess(res, data, 200);
}

export async function getRecipientAnalytics(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const period = (req.query.period as string) || '30d';
  const data = await analyticsService.getRecipientMetrics(req.user.organizationId, period);
  sendSuccess(res, data, 200);
}

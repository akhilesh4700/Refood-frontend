import { Request, Response } from 'express';
import * as notificationsService from './notifications.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const items = await notificationsService.getNotifications(req.user.organizationId);
  sendSuccess(res, items, 200);
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const { id } = req.params;
  if (!id) {
    throw new AppError('Notification ID is required', 400, 'VALIDATION_ERROR');
  }

  const updated = await notificationsService.markNotificationAsRead(id, req.user.organizationId);
  sendSuccess(res, updated, 200, 'Notification marked as read');
}

export async function markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const result = await notificationsService.markAllNotificationsAsRead(req.user.organizationId);
  sendSuccess(res, result, 200, 'All notifications marked as read');
}

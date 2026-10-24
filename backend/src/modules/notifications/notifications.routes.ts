import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';

export const notificationsRouter = Router();

// List current organization's notifications
notificationsRouter.get(
  '/',
  asyncHandler(authenticate),
  asyncHandler(notificationsController.getMyNotifications)
);

// Mark a single notification as read
notificationsRouter.patch(
  '/:id/read',
  asyncHandler(authenticate),
  asyncHandler(notificationsController.markNotificationAsRead)
);

// Mark all notifications for the organization as read
notificationsRouter.post(
  '/read-all',
  asyncHandler(authenticate),
  asyncHandler(notificationsController.markAllNotificationsAsRead)
);

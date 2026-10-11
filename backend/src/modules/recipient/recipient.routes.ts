import { Router } from 'express';
import { getRecipientAnalytics } from '../analytics/analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRole } from '../../middleware/authorizeRole';
import { asyncHandler } from '../../utils/asyncHandler';

export const recipientRouter = Router();

recipientRouter.get(
  '/analytics',
  asyncHandler(authenticate),
  authorizeRole('RECIPIENT', 'PROCESSOR'),
  asyncHandler(getRecipientAnalytics)
);

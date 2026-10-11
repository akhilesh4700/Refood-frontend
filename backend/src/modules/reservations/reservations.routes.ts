import { Router } from 'express';
import * as reservationsController from './reservations.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRole } from '../../middleware/authorizeRole';
import { asyncHandler } from '../../utils/asyncHandler';

export const reservationsRouter = Router();

// Recipient views their own reservations
reservationsRouter.get(
  '/',
  asyncHandler(authenticate),
  authorizeRole('RECIPIENT', 'PROCESSOR'),
  asyncHandler(reservationsController.getMyReservations)
);

// View specific reservation by ID
reservationsRouter.get(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(reservationsController.getReservationById)
);

// Update status of a reservation
reservationsRouter.patch(
  '/:id/status',
  asyncHandler(authenticate),
  asyncHandler(reservationsController.updateReservationStatus)
);

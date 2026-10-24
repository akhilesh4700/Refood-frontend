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

// Supplier initiates single-use handover OTP
reservationsRouter.post(
  '/:id/otp/initiate',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  asyncHandler(reservationsController.initiateHandoverOtp)
);

// Supplier retrieves their active OTP
reservationsRouter.get(
  '/:id/otp',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  asyncHandler(reservationsController.getReservationOtp)
);

// Recipient verifies handover OTP (completes physical transfer)
reservationsRouter.post(
  '/:id/otp/verify',
  asyncHandler(authenticate),
  authorizeRole('RECIPIENT', 'PROCESSOR'),
  asyncHandler(reservationsController.verifyHandoverOtp)
);

// View chat messages for reservation (parties to reservation)
reservationsRouter.get(
  '/:id/chat',
  asyncHandler(authenticate),
  asyncHandler(reservationsController.getChatMessages)
);

// Send chat message for reservation (parties to reservation)
reservationsRouter.post(
  '/:id/chat',
  asyncHandler(authenticate),
  asyncHandler(reservationsController.sendChatMessage)
);

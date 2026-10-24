import { Request, Response } from 'express';
import * as reservationsService from './reservations.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function getMyReservations(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const items = await reservationsService.getRecipientReservations(req.user.organizationId);
  sendSuccess(res, items, 200);
}

export async function getSupplierPickups(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const items = await reservationsService.getSupplierPickups(req.user.organizationId);
  sendSuccess(res, items, 200);
}

export async function getReservationById(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const item = await reservationsService.getReservationById(req.params.id, req.user.organizationId);
  sendSuccess(res, item, 200);
}

export async function updateReservationStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const { status } = req.body;
  if (!status) throw new AppError('Field \'status\' is required', 400, 'VALIDATION_ERROR');
  const item = await reservationsService.updateReservationStatus(
    req.params.id,
    req.user.organizationId,
    status
  );
  sendSuccess(res, item, 200, 'Reservation status updated');
}

export async function initiateHandoverOtp(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const result = await reservationsService.initiateHandoverOtp(
    req.params.id,
    req.user.organizationId
  );
  sendSuccess(res, result, 200, 'Handover OTP initiated');
}

export async function getReservationOtp(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const result = await reservationsService.getReservationOtp(
    req.params.id,
    req.user.organizationId
  );
  sendSuccess(res, result, 200);
}

export async function verifyHandoverOtp(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const { otp } = req.body;
  if (!otp) throw new AppError('Field \'otp\' is required', 400, 'VALIDATION_ERROR');
  const result = await reservationsService.verifyHandoverOtp(
    req.params.id,
    req.user.organizationId,
    otp
  );
  sendSuccess(res, result, 200, 'Handover verified and completed successfully');
}

export async function getChatMessages(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const items = await reservationsService.getChatMessages(
    req.params.id,
    req.user.organizationId
  );
  sendSuccess(res, items, 200);
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  const { text } = req.body;
  const item = await reservationsService.sendChatMessage(
    req.params.id,
    {
      id: req.user.id,
      organizationId: req.user.organizationId,
      role: req.user.role,
    },
    text
  );
  sendSuccess(res, item, 201, 'Message sent successfully');
}

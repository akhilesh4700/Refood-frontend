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

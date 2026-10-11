import { Router } from 'express';
import { getMyListings } from '../listings/listings.controller';
import { getSupplierPickups } from '../reservations/reservations.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRole } from '../../middleware/authorizeRole';
import { validateRequest } from '../../middleware/validateRequest';
import { queryListingsSchema } from '../listings/listings.schemas';
import { asyncHandler } from '../../utils/asyncHandler';

export const supplierRouter = Router();

supplierRouter.get(
  '/listings',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  validateRequest({ query: queryListingsSchema }),
  asyncHandler(getMyListings)
);

supplierRouter.get(
  '/pickups',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  asyncHandler(getSupplierPickups)
);

supplierRouter.get(
  '/analytics',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  asyncHandler(async (req, res) => {
    const { getSupplierAnalytics } = await import('../analytics/analytics.controller');
    await getSupplierAnalytics(req, res);
  })
);

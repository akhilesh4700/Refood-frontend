import { Router } from 'express';
import * as listingsController from './listings.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { authorizeRole } from '../../middleware/authorizeRole';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createListingSchema,
  updateListingSchema,
  withdrawListingSchema,
  queryListingsSchema,
} from './listings.schemas';
import { asyncHandler } from '../../utils/asyncHandler';

export const listingsRouter = Router();

// Public marketplace listings
listingsRouter.get(
  '/',
  asyncHandler(optionalAuthenticate),
  validateRequest({ query: queryListingsSchema }),
  asyncHandler(listingsController.getMarketplaceListings)
);

// Supplier's own inventory listings
listingsRouter.get(
  '/mine',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  validateRequest({ query: queryListingsSchema }),
  asyncHandler(listingsController.getMyListings)
);

// Get single listing by ID
listingsRouter.get(
  '/:id',
  asyncHandler(optionalAuthenticate),
  asyncHandler(listingsController.getListingById)
);

// Create new listing (Suppliers only)
listingsRouter.post(
  '/',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  validateRequest({ body: createListingSchema }),
  asyncHandler(listingsController.createListing)
);

// Update existing listing (Suppliers only, must own)
listingsRouter.patch(
  '/:id',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  validateRequest({ body: updateListingSchema }),
  asyncHandler(listingsController.updateListing)
);

// Withdraw listing (Suppliers only, must own)
listingsRouter.post(
  '/:id/withdraw',
  asyncHandler(authenticate),
  authorizeRole('SUPPLIER'),
  validateRequest({ body: withdrawListingSchema }),
  asyncHandler(listingsController.withdrawListing)
);

// Atomic single-recipient claim (Recipients / Processors only)
listingsRouter.post(
  '/:id/claim',
  asyncHandler(authenticate),
  authorizeRole('RECIPIENT', 'PROCESSOR'),
  asyncHandler(listingsController.claimListing)
);

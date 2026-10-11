import { Request, Response } from 'express';
import * as listingsService from './listings.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function createListing(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const listing = await listingsService.createListing(
    req.body,
    req.user.organizationId,
    req.user.id
  );
  sendSuccess(res, listing, 201, 'Listing created successfully');
}

export async function getMarketplaceListings(req: Request, res: Response): Promise<void> {
  const result = await listingsService.getMarketplaceListings(req.query as any);
  sendPaginated(res, result.items, result.total, result.page, result.pageSize);
}

export async function getMyListings(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const result = await listingsService.getSupplierListings(
    req.user.organizationId,
    req.query as any
  );
  sendPaginated(res, result.items, result.total, result.page, result.pageSize);
}

export async function getListingById(req: Request, res: Response): Promise<void> {
  const listing = await listingsService.getListingById(req.params.id);
  sendSuccess(res, listing, 200);
}

export async function updateListing(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const updated = await listingsService.updateListing(
    req.params.id,
    req.user.organizationId,
    req.body
  );
  sendSuccess(res, updated, 200, 'Listing updated successfully');
}

export async function withdrawListing(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const result = await listingsService.withdrawListing(
    req.params.id,
    req.user.organizationId,
    req.body.reason
  );
  sendSuccess(res, result, 200, 'Listing withdrawn successfully');
}

export async function claimListing(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const reservation = await listingsService.claimListing(
    req.params.id,
    req.user.organizationId,
    req.user.id
  );
  sendSuccess(res, reservation, 201, 'Listing claimed successfully');
}

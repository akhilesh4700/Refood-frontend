import { Listing, Organization, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateListingInput, UpdateListingInput, QueryListingsInput } from './listings.schemas';

export interface FormattedListing {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierLocation: string;
  type: string;
  status: string;
  category: string;
  subcategory?: string | null;
  title: string;
  description: string;
  weightKg: number;
  portions?: number | null;
  storageMethod: string;
  handlingInstructions?: string | null;
  allergens: string[];
  preparedAt?: string | null;
  safeUntil?: string | null;
  earliestPickup: string;
  collectionDeadline: string;
  pickupAddress: string;
  pickupInstructions?: string | null;
  onSiteContact: string;
  onSitePhone: string;
  imageUrl?: string | null;
  isFree: boolean;
  price?: number | null;
  currency?: string | null;
  createdAt: string;
}

export function formatListing(listing: Listing & { supplierOrg?: Organization | null }): FormattedListing {
  return {
    id: listing.id,
    supplierId: listing.supplierOrgId,
    supplierName: listing.supplierOrg?.name || 'Verified Supplier',
    supplierLocation: listing.supplierOrg?.city || 'Bengaluru',
    type: listing.type.toLowerCase(),
    status: listing.status.toLowerCase(),
    category: listing.category,
    subcategory: listing.subcategory,
    title: listing.title,
    description: listing.description,
    weightKg: Number(listing.weightKg),
    portions: listing.portions,
    storageMethod: listing.storageMethod.toLowerCase(),
    handlingInstructions: listing.handlingInstructions,
    allergens: listing.allergens,
    preparedAt: listing.preparedAt?.toISOString() || null,
    safeUntil: listing.safeUntil?.toISOString() || null,
    earliestPickup: listing.earliestPickup.toISOString(),
    collectionDeadline: listing.collectionDeadline.toISOString(),
    pickupAddress: listing.pickupAddress,
    pickupInstructions: listing.pickupInstructions,
    onSiteContact: listing.onSiteContact,
    onSitePhone: listing.onSitePhone,
    imageUrl: listing.imageUrl,
    isFree: listing.isFree,
    price: listing.price ? Number(listing.price) : null,
    currency: listing.currency,
    createdAt: listing.createdAt.toISOString(),
  };
}

export async function createListing(
  input: CreateListingInput,
  supplierOrgId: string,
  createdById: string
): Promise<FormattedListing> {
  const now = new Date();

  // Validate collection deadline is in the future
  const deadline = new Date(input.collectionDeadline);
  if (deadline <= now) {
    throw new AppError('Collection deadline must be in the future', 400, 'INVALID_DEADLINE');
  }

  // Validate edible food safety deadline
  if (input.type === 'EDIBLE' && input.safeUntil) {
    const safeUntilDate = new Date(input.safeUntil);
    if (safeUntilDate <= now) {
      throw new AppError('Safe-until consumption deadline has already passed', 400, 'FOOD_SAFETY_VIOLATION');
    }
    if (deadline > safeUntilDate) {
      throw new AppError('Collection deadline cannot exceed the safe-consumption deadline', 400, 'FOOD_SAFETY_VIOLATION');
    }
  }

  const created = await prisma.listing.create({
    data: {
      supplierOrgId,
      createdById,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'ACTIVE',
      category: input.category,
      subcategory: input.subcategory,
      weightKg: new Prisma.Decimal(input.weightKg),
      portions: input.portions,
      storageMethod: input.storageMethod,
      handlingInstructions: input.handlingInstructions,
      allergens: input.allergens,
      preparedAt: input.preparedAt ? new Date(input.preparedAt) : null,
      safeUntil: input.safeUntil ? new Date(input.safeUntil) : null,
      earliestPickup: new Date(input.earliestPickup),
      collectionDeadline: deadline,
      pickupAddress: input.pickupAddress,
      pickupInstructions: input.pickupInstructions,
      onSiteContact: input.onSiteContact,
      onSitePhone: input.onSitePhone,
      imageUrl: input.imageUrl,
      isFree: input.isFree,
      price: input.price ? new Prisma.Decimal(input.price) : null,
      currency: input.currency,
    },
    include: {
      supplierOrg: true,
    },
  });

  return formatListing(created);
}

export async function getMarketplaceListings(
  query: QueryListingsInput
): Promise<{ items: FormattedListing[]; total: number; page: number; pageSize: number }> {
  const now = new Date();
  const where: Prisma.ListingWhereInput = {
    status: query.status || 'ACTIVE',
    collectionDeadline: {
      gt: now, // Do not list expired items in active marketplace
    },
    ...(query.type && { type: query.type }),
    ...(query.category && { category: query.category }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  let orderBy: Prisma.ListingOrderByWithRelationInput = { collectionDeadline: query.sortDir };
  if (query.sortBy === 'created') orderBy = { createdAt: query.sortDir };
  if (query.sortBy === 'weight') orderBy = { weightKg: query.sortDir };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { supplierOrg: true },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items: items.map(formatListing),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getSupplierListings(
  supplierOrgId: string,
  query: QueryListingsInput
): Promise<{ items: FormattedListing[]; total: number; page: number; pageSize: number }> {
  const where: Prisma.ListingWhereInput = {
    supplierOrgId,
    ...(query.status && { status: query.status }),
    ...(query.type && { type: query.type }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { supplierOrg: true },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items: items.map(formatListing),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getListingById(id: string): Promise<FormattedListing> {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { supplierOrg: true },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  return formatListing(listing);
}

export async function updateListing(
  id: string,
  supplierOrgId: string,
  input: UpdateListingInput
): Promise<FormattedListing> {
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (listing.supplierOrgId !== supplierOrgId) {
    throw new AppError('You are not authorized to modify another organization\'s listing', 403, 'FORBIDDEN');
  }

  if (listing.status !== 'ACTIVE' && listing.status !== 'DRAFT') {
    throw new AppError(`Cannot modify listing in status '${listing.status.toLowerCase()}'`, 400, 'INVALID_STATUS');
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.category && { category: input.category }),
      ...(input.weightKg && { weightKg: new Prisma.Decimal(input.weightKg) }),
      ...(input.portions !== undefined && { portions: input.portions }),
      ...(input.storageMethod && { storageMethod: input.storageMethod }),
      ...(input.allergens && { allergens: input.allergens }),
      ...(input.collectionDeadline && { collectionDeadline: new Date(input.collectionDeadline) }),
      ...(input.pickupAddress && { pickupAddress: input.pickupAddress }),
      ...(input.pickupInstructions !== undefined && { pickupInstructions: input.pickupInstructions }),
      ...(input.onSiteContact && { onSiteContact: input.onSiteContact }),
      ...(input.onSitePhone && { onSitePhone: input.onSitePhone }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
    },
    include: { supplierOrg: true },
  });

  return formatListing(updated);
}

export async function withdrawListing(
  id: string,
  supplierOrgId: string,
  reason = 'Withdrawn by supplier'
): Promise<{ withdrawn: boolean }> {
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (listing.supplierOrgId !== supplierOrgId) {
    throw new AppError('You are not authorized to withdraw another organization\'s listing', 403, 'FORBIDDEN');
  }

  if (listing.status !== 'ACTIVE' && listing.status !== 'DRAFT') {
    throw new AppError(`Cannot withdraw listing in status '${listing.status.toLowerCase()}'`, 400, 'INVALID_STATUS');
  }

  await prisma.listing.update({
    where: { id },
    data: {
      status: 'WITHDRAWN',
      withdrawalReason: reason,
    },
  });

  return { withdrawn: true };
}

/**
 * Core atomic claim operation with single-claim concurrency protection.
 */
export async function claimListing(
  listingId: string,
  recipientOrgId: string,
  claimedById: string,
  userRole?: string
) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // 1. Fetch current listing state
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      include: { supplierOrg: true },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404, 'NOT_FOUND');
    }

    // Role safety check: processors cannot claim edible food for human consumption
    if (userRole === 'PROCESSOR' && listing.type === 'EDIBLE') {
      throw new AppError(
        'Processors are restricted to claiming organic biomass listings, not edible human food',
        403,
        'ROLE_RESTRICTION'
      );
    }

    // 2. Prevent supplier from claiming their own surplus batch
    if (listing.supplierOrgId === recipientOrgId) {
      throw new AppError('Supplier organizations cannot claim their own surplus batches', 400, 'SELF_CLAIM_NOT_ALLOWED');
    }

    // 3. Strict single-claim check
    if (listing.status === 'CLAIMED' || listing.status === 'COMPLETED') {
      throw new AppError(
        'This listing has already been claimed by another recipient',
        409,
        'ALREADY_CLAIMED'
      );
    }

    if (listing.status !== 'ACTIVE') {
      throw new AppError(
        `Listing is not available for claim (current status: ${listing.status.toLowerCase()})`,
        400,
        'LISTING_UNAVAILABLE'
      );
    }

    // 4. Food-safety: Edible consumption window check
    if (listing.type === 'EDIBLE' && listing.safeUntil && listing.safeUntil < now) {
      // Mark as expired to prevent further attempts
      await tx.listing.update({
        where: { id: listingId },
        data: { status: 'EXPIRED' },
      });
      throw new AppError(
        'Food safety violation: This edible surplus batch has passed its safe-consumption deadline',
        410,
        'LISTING_EXPIRED'
      );
    }

    // 5. Collection deadline check
    if (listing.collectionDeadline < now) {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: 'EXPIRED' },
      });
      throw new AppError(
        'The collection window for this surplus batch has expired',
        410,
        'COLLECTION_WINDOW_EXPIRED'
      );
    }

    // 6. Transition listing state atomically to CLAIMED
    await tx.listing.update({
      where: { id: listingId },
      data: { status: 'CLAIMED' },
    });

    // 7. Create the official reservation record
    const reservation = await tx.reservation.create({
      data: {
        listingId: listing.id,
        recipientOrgId,
        claimedById,
        status: 'CONFIRMED',
        paymentStatus: listing.isFree ? 'NOT_REQUIRED' : 'PENDING',
        quantityClaimedKg: listing.weightKg,
        priceAgreed: listing.price,
        pickupAddress: listing.pickupAddress,
        earliestPickup: listing.earliestPickup,
        collectionDeadline: listing.collectionDeadline,
        onSiteContact: listing.onSiteContact,
        onSitePhone: listing.onSitePhone,
      },
      include: {
        listing: {
          include: { supplierOrg: true },
        },
        recipientOrg: true,
      },
    });

    return {
      id: reservation.id,
      listingId: reservation.listingId,
      listing: {
        id: reservation.listing.id,
        title: reservation.listing.title,
        type: reservation.listing.type.toLowerCase(),
        weightKg: Number(reservation.listing.weightKg),
        supplierName: reservation.listing.supplierOrg.name,
        supplierLocation: reservation.listing.supplierOrg.city,
        imageUrl: reservation.listing.imageUrl,
        isFree: reservation.listing.isFree,
        storageMethod: reservation.listing.storageMethod.toLowerCase(),
        allergens: reservation.listing.allergens,
      },
      recipientId: reservation.recipientOrgId,
      recipientName: reservation.recipientOrg.name,
      reservationStatus: reservation.status.toLowerCase(),
      paymentStatus: reservation.paymentStatus.toLowerCase(),
      pickupAddress: reservation.pickupAddress,
      earliestPickup: reservation.earliestPickup.toISOString(),
      collectionDeadline: reservation.collectionDeadline.toISOString(),
      onSiteContact: reservation.onSiteContact,
      onSitePhone: reservation.onSitePhone,
      otpReady: !!reservation.otpHash,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };
  });
}

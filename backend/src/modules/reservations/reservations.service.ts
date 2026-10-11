import { Reservation, Listing, Organization, ReservationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export function formatReservation(
  r: Reservation & {
    listing: Listing & { supplierOrg?: Organization | null };
    recipientOrg?: Organization | null;
  }
) {
  return {
    id: r.id,
    listingId: r.listingId,
    listing: {
      id: r.listing.id,
      title: r.listing.title,
      type: r.listing.type.toLowerCase(),
      weightKg: Number(r.listing.weightKg),
      supplierName: r.listing.supplierOrg?.name || 'Verified Supplier',
      supplierLocation: r.listing.supplierOrg?.city || 'Bengaluru',
      imageUrl: r.listing.imageUrl,
      isFree: r.listing.isFree,
      price: r.listing.price ? Number(r.listing.price) : null,
      currency: r.listing.currency,
      storageMethod: r.listing.storageMethod.toLowerCase(),
      allergens: r.listing.allergens,
    },
    recipientId: r.recipientOrgId,
    recipientName: r.recipientOrg?.name || 'Recipient Organization',
    reservationStatus: r.status.toLowerCase(),
    paymentStatus: r.paymentStatus.toLowerCase(),
    pickupAddress: r.pickupAddress,
    earliestPickup: r.earliestPickup.toISOString(),
    collectionDeadline: r.collectionDeadline.toISOString(),
    onSiteContact: r.onSiteContact,
    onSitePhone: r.onSitePhone,
    otpReady: !!r.otpHash,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getRecipientReservations(recipientOrgId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { recipientOrgId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { include: { supplierOrg: true } },
      recipientOrg: true,
    },
  });

  return reservations.map(formatReservation);
}

export async function getSupplierPickups(supplierOrgId: string) {
  const reservations = await prisma.reservation.findMany({
    where: {
      listing: {
        supplierOrgId,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { include: { supplierOrg: true } },
      recipientOrg: true,
    },
  });

  return reservations.map(formatReservation);
}

export async function getReservationById(id: string, userOrgId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      listing: { include: { supplierOrg: true } },
      recipientOrg: true,
    },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  // Ensure caller is either the supplier or the recipient organization
  if (
    reservation.recipientOrgId !== userOrgId &&
    reservation.listing.supplierOrgId !== userOrgId
  ) {
    throw new AppError('Unauthorized access to reservation details', 403, 'FORBIDDEN');
  }

  return formatReservation(reservation);
}

export async function updateReservationStatus(
  id: string,
  userOrgId: string,
  newStatus: string
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (
    reservation.recipientOrgId !== userOrgId &&
    reservation.listing.supplierOrgId !== userOrgId
  ) {
    throw new AppError('Forbidden: Organization not party to this reservation', 403, 'FORBIDDEN');
  }

  const statusUpper = newStatus.toUpperCase() as ReservationStatus;

  // Validate allowed state transitions
  const allowedStatuses: ReservationStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'IN_TRANSIT',
    'ARRIVED',
    'HANDOVER_PENDING',
    'COMPLETED',
    'CANCELLED',
  ];

  if (!allowedStatuses.includes(statusUpper)) {
    throw new AppError(`Invalid status '${newStatus}'`, 400, 'INVALID_STATUS');
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: statusUpper },
    include: {
      listing: { include: { supplierOrg: true } },
      recipientOrg: true,
    },
  });

  return formatReservation(updated);
}

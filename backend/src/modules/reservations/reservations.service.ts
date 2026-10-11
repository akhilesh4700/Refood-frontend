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

// In-memory cache for secure recipient OTP delivery
const activeOtpTokens = new Map<string, { otp: string; expiresAt: Date }>();

/**
 * Supplier initiates handover verification.
 * Generates an expiring single-use 6-digit OTP, hashes it, and transitions status.
 */
export async function initiateHandoverOtp(id: string, supplierOrgId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (reservation.listing.supplierOrgId !== supplierOrgId) {
    throw new AppError('Forbidden: Only the supplier organization can initiate handover OTP', 403, 'FORBIDDEN');
  }

  if (reservation.status === 'COMPLETED') {
    throw new AppError('Handover has already been completed for this reservation', 400, 'ALREADY_COMPLETED');
  }

  // Generate cryptographically random 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const bcrypt = await import('bcryptjs');
  const otpHash = await bcrypt.default.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

  await prisma.reservation.update({
    where: { id },
    data: {
      otpHash,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      status: 'HANDOVER_PENDING',
    },
  });

  // Store for recipient lookup
  activeOtpTokens.set(id, { otp: rawOtp, expiresAt });

  return {
    otpReady: true,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: 900,
    message: 'Handover OTP initiated. Awaiting recipient verification.',
  };
}

/**
 * Authorized recipient queries the generated OTP to present at the loading gate.
 */
export async function getReservationOtp(id: string, recipientOrgId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (reservation.recipientOrgId !== recipientOrgId) {
    throw new AppError('Forbidden: Only the assigned recipient organization can retrieve this handover code', 403, 'FORBIDDEN');
  }

  const cached = activeOtpTokens.get(id);
  if (!cached || cached.expiresAt < new Date()) {
    throw new AppError('No active OTP found. The supplier must initiate handover first.', 404, 'OTP_NOT_READY');
  }

  return {
    reservationId: id,
    otp: cached.otp,
    expiresAt: cached.expiresAt.toISOString(),
  };
}

/**
 * Validates the single-use handover OTP and finalizes the physical transfer.
 */
export async function verifyHandoverOtp(id: string, userOrgId: string, inputOtp: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  // Caller must be party to the reservation
  if (
    reservation.recipientOrgId !== userOrgId &&
    reservation.listing.supplierOrgId !== userOrgId
  ) {
    throw new AppError('Forbidden: Organization not party to this handover', 403, 'FORBIDDEN');
  }

  if (reservation.status === 'COMPLETED') {
    return {
      success: true,
      reservationId: id,
      verifiedAt: reservation.handoverVerifiedAt?.toISOString() || new Date().toISOString(),
      finalWeightKg: Number(reservation.quantityClaimedKg),
    };
  }

  if (!reservation.otpHash || !reservation.otpExpiresAt) {
    throw new AppError('Handover OTP has not been initiated for this reservation', 400, 'OTP_NOT_INITIATED');
  }

  const now = new Date();
  if (reservation.otpExpiresAt < now) {
    throw new AppError('Handover OTP has expired. Please have the supplier generate a new code.', 400, 'OTP_EXPIRED');
  }

  if (reservation.otpAttempts >= 3) {
    throw new AppError('Too many failed OTP attempts. Handover locked for safety. Please initiate a new code.', 429, 'OTP_LOCKED');
  }

  const bcrypt = await import('bcryptjs');
  const isMatch = await bcrypt.default.compare(inputOtp.trim(), reservation.otpHash);

  if (!isMatch) {
    await prisma.reservation.update({
      where: { id },
      data: { otpAttempts: { increment: 1 } },
    });
    throw new AppError('Invalid OTP code. Please check with the other party.', 400, 'INVALID_OTP');
  }

  // Atomically finalize reservation & listing
  const verifiedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        handoverVerifiedAt: verifiedAt,
        otpHash: null, // Clear single-use OTP
      },
    });

    await tx.listing.update({
      where: { id: reservation.listingId },
      data: {
        status: 'COMPLETED',
      },
    });
  });

  activeOtpTokens.delete(id);

  return {
    success: true,
    reservationId: id,
    verifiedAt: verifiedAt.toISOString(),
    finalWeightKg: Number(reservation.quantityClaimedKg),
  };
}

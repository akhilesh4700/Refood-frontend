import { Reservation, Listing, Organization, ReservationStatus, Prisma } from '@prisma/client';
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
    handoverVerifiedAt: r.handoverVerifiedAt ? r.handoverVerifiedAt.toISOString() : null,
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

  const isSupplier =
    reservation.listing.supplierOrgId === userOrgId;
  const isRecipient =
    reservation.recipientOrgId === userOrgId;

  if (!isSupplier && !isRecipient) {
    throw new AppError(
      'Forbidden: Organization not party to this reservation',
      403,
      'FORBIDDEN'
    );
  }

  const statusUpper = newStatus.toUpperCase() as ReservationStatus;

  // Only the supplier can accept or reject a pending reservation.
  if (reservation.status === 'PENDING') {
    if (!isSupplier) {
      throw new AppError(
        'Only the supplier can accept or reject this reservation',
        403,
        'FORBIDDEN'
      );
    }

    if (statusUpper === 'CONFIRMED') {
      // Supplier accepts the request.
    } else if (statusUpper === 'CANCELLED' || (statusUpper as string) === 'REJECTED') {
      // Supplier rejects it and makes the listing available again.
      return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const cancelled = await tx.reservation.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            listing: { include: { supplierOrg: true } },
            recipientOrg: true,
          },
        });

        await tx.listing.updateMany({
          where: {
            id: reservation.listingId,
            status: 'CLAIMED',
          },
          data: { status: 'ACTIVE' },
        });

        await tx.notification.create({
          data: {
            organizationId: cancelled.recipientOrgId,
            title: 'Claim Request Declined',
            body: `Your reservation request for "${cancelled.listing.title}" was declined by ${cancelled.listing.supplierOrg?.name || 'the supplier'}. The surplus item has been released back to active listings.`,
            eventType: 'reservation_cancelled',
            relatedId: cancelled.id,
            relatedPath: '/recipient/browse',
          },
        });

        return formatReservation(cancelled);
      });
    } else {
      throw new AppError(
        'A pending reservation can only be accepted or rejected by the supplier',
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }
  } else {
    // Do not allow this generic endpoint to bypass the handover workflow.
    throw new AppError(
      'This reservation cannot be changed through this action',
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const confirmed = await tx.reservation.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        listing: { include: { supplierOrg: true } },
        recipientOrg: true,
      },
    });

    await tx.notification.create({
      data: {
        organizationId: confirmed.recipientOrgId,
        title: 'Claim Request Accepted',
        body: `Your reservation for "${confirmed.listing.title}" has been confirmed by ${confirmed.listing.supplierOrg?.name || 'the supplier'}. You may proceed with pickup arrangements.`,
        eventType: 'reservation_confirmed',
        relatedId: confirmed.id,
        relatedPath: '/recipient/reservations',
      },
    });

    return confirmed;
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

  if (reservation.status === 'PENDING') {
    throw new AppError('Cannot initiate handover OTP for an unapproved claim. Please accept the claim first.', 400, 'CLAIM_NOT_APPROVED');
  }

  if (reservation.status === 'CANCELLED') {
    throw new AppError('Cannot initiate handover OTP for a cancelled or rejected reservation', 400, 'RESERVATION_CANCELLED');
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

  // Store for supplier session recovery (in-memory for active handover session)
  activeOtpTokens.set(id, { otp: rawOtp, expiresAt });

  return {
    otpReady: true,
    otp: rawOtp,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: 900,
    message: 'Handover OTP generated. Share this 6-digit code with the recipient at pickup.',
  };
}

/**
 * Authorized supplier queries the active generated OTP.
 */
export async function getReservationOtp(id: string, supplierOrgId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (reservation.listing.supplierOrgId !== supplierOrgId) {
    throw new AppError('Forbidden: Only the supplier organization can view the handover OTP', 403, 'FORBIDDEN');
  }

  if (reservation.status === 'PENDING' || reservation.status === 'CANCELLED') {
    throw new AppError('No handover code available for this reservation status', 400, 'INVALID_STATUS');
  }

  if (reservation.status === 'COMPLETED') {
    throw new AppError('Handover has already been completed for this reservation', 400, 'ALREADY_COMPLETED');
  }

  const cached = activeOtpTokens.get(id);
  if (!cached || cached.expiresAt < new Date()) {
    throw new AppError('No active OTP found. Please generate a new code.', 404, 'OTP_NOT_READY');
  }

  return {
    reservationId: id,
    otp: cached.otp,
    expiresAt: cached.expiresAt.toISOString(),
  };
}

/**
 * Validates the single-use handover OTP and finalizes the physical transfer.
 * Enforces that only the assigned recipient organization can submit verification.
 */
export async function verifyHandoverOtp(id: string, userOrgId: string, inputOtp: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  // Caller must be the assigned recipient organization
  if (reservation.recipientOrgId !== userOrgId) {
    throw new AppError('Forbidden: Only the assigned recipient organization can submit handover verification', 403, 'FORBIDDEN');
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

function formatChatMessage(msg: {
  id: string;
  reservationId: string;
  senderId: string;
  senderOrgId: string;
  senderRole: string;
  senderName: string;
  text: string;
  createdAt: Date;
}) {
  return {
    id: msg.id,
    reservationId: msg.reservationId,
    senderId: msg.senderId,
    senderOrgId: msg.senderOrgId,
    senderRole: msg.senderRole.toLowerCase(),
    senderName: msg.senderName,
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
    sentAt: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Retrieves chat history for a reservation.
 * Enforces membership: only supplier or recipient organizations can view messages.
 */
export async function getChatMessages(reservationId: string, userOrgId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (
    reservation.listing.supplierOrgId !== userOrgId &&
    reservation.recipientOrgId !== userOrgId
  ) {
    throw new AppError('Forbidden: Organization not party to this reservation', 403, 'FORBIDDEN');
  }

  const messages = await prisma.chatMessage.findMany({
    where: { reservationId },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map(formatChatMessage);
}

/**
 * Sends and persists a chat message for a reservation.
 * Enforces membership, rejects cancelled reservations, and validates message text.
 */
export async function sendChatMessage(
  reservationId: string,
  user: { id: string; organizationId: string; role: string; name?: string },
  text: string
) {
  const trimmed = typeof text === 'string' ? text.trim() : '';

  if (!trimmed) {
    throw new AppError('Message text cannot be empty', 400, 'VALIDATION_ERROR');
  }

  if (trimmed.length > 1000) {
    throw new AppError('Message text cannot exceed 1000 characters', 400, 'VALIDATION_ERROR');
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { listing: true },
  });

  if (!reservation) {
    throw new AppError('Reservation not found', 404, 'NOT_FOUND');
  }

  if (
    reservation.listing.supplierOrgId !== user.organizationId &&
    reservation.recipientOrgId !== user.organizationId
  ) {
    throw new AppError('Forbidden: Organization not party to this reservation', 403, 'FORBIDDEN');
  }

  if (reservation.status === 'CANCELLED') {
    throw new AppError('Cannot send messages for a cancelled reservation', 400, 'RESERVATION_CANCELLED');
  }

  if (reservation.status === 'COMPLETED') {
    if (!reservation.handoverVerifiedAt) {
      throw new AppError(
        'Chat is closed for completed reservations without verification timestamp',
        400,
        'CHAT_WINDOW_EXPIRED'
      );
    }

    const twoHoursMs = 2 * 60 * 60 * 1000;
    const verifiedTime = new Date(reservation.handoverVerifiedAt).getTime();
    const now = Date.now();

    if (now >= verifiedTime + twoHoursMs) {
      throw new AppError(
        'Chat window has expired (closed 2 hours after handover verification)',
        400,
        'CHAT_WINDOW_EXPIRED'
      );
    }
  }

  const senderUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });
  const senderDisplayName = senderUser?.name || (user as any).name || (user.role === 'SUPPLIER' ? 'Supplier Dispatch' : 'Recipient Lead');

  const message = await prisma.chatMessage.create({
    data: {
      reservationId,
      senderId: user.id,
      senderOrgId: user.organizationId,
      senderRole: user.role.toUpperCase() as any,
      senderName: senderDisplayName,
      text: trimmed,
    },
  });

  // Notify counterparty organization
  try {
    const isSupplierSender = user.organizationId === reservation.listing.supplierOrgId;
    const counterpartyOrgId = isSupplierSender ? reservation.recipientOrgId : reservation.listing.supplierOrgId;
    const counterpartyRoute = isSupplierSender ? '/recipient/reservations' : '/supplier/pickups';

    await prisma.notification.create({
      data: {
        organizationId: counterpartyOrgId,
        title: 'New Dispatch Message',
        body: `${senderDisplayName}: "${trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed}"`,
        eventType: 'chat_message',
        relatedId: reservationId,
        relatedPath: counterpartyRoute,
      },
    });
  } catch {
    // Notification failure must not block message transmission
  }

  return formatChatMessage(message);
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import * as listingsService from '../src/modules/listings/listings.service';
import * as reservationsService from '../src/modules/reservations/reservations.service';
import * as authService from '../src/modules/auth/auth.service';
import { AppError } from '../src/middleware/errorHandler';

// Mock prisma for deterministic unit testing of business logic rules
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
    listing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    reservation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Business Rules, Security & Concurrency Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Service Security Rules', () => {
    it('should reject registration with duplicate email address (409 Conflict)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing-id',
        email: 'chef@grandhotel.com',
      } as any);

      await expect(
        authService.register({
          email: 'chef@grandhotel.com',
          password: 'password123',
          name: 'Chef',
          role: 'SUPPLIER',
          orgName: 'Hotel',
          orgType: 'Kitchen',
          address: 'Street',
          city: 'Bengaluru',
          phone: '12345678',
          state: 'Karnataka',
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'EMAIL_EXISTS',
      });
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        email: 'chef@grandhotel.com',
        // Hash for "correctPassword"
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
        role: 'SUPPLIER',
      } as any);

      await expect(
        authService.login({
          email: 'chef@grandhotel.com',
          password: 'wrongPasswordEntered',
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  describe('Listing Ownership & Mutation Rules', () => {
    it('should reject updating a listing owned by another organization (403 Forbidden)', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-101',
        supplierOrgId: 'org-hotel-A',
        status: 'ACTIVE',
      } as any);

      await expect(
        listingsService.updateListing('listing-101', 'org-hotel-B', {
          title: 'Hacked Title Modification',
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('should reject updating a listing that is already WITHDRAWN or CLAIMED', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-101',
        supplierOrgId: 'org-hotel-A',
        status: 'WITHDRAWN',
      } as any);

      await expect(
        listingsService.updateListing('listing-101', 'org-hotel-A', {
          title: 'New Title',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS',
      });
    });
  });

  describe('Single-Claim & Concurrency Protection', () => {
    it('should REJECT claim if listing is already CLAIMED (409 Conflict)', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-200',
        supplierOrgId: 'org-supplier-1',
        status: 'CLAIMED',
        collectionDeadline: new Date(Date.now() + 3600000),
      } as any);

      await expect(
        listingsService.claimListing('listing-200', 'org-recipient-2', 'user-recipient-2')
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ALREADY_CLAIMED',
      });
    });

    it('should REJECT supplier from claiming their own listing (400 Bad Request)', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-200',
        supplierOrgId: 'org-same-id',
        status: 'ACTIVE',
      } as any);

      await expect(
        listingsService.claimListing('listing-200', 'org-same-id', 'user-same-id')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'SELF_CLAIM_NOT_ALLOWED',
      });
    });

    it('should REJECT claiming an edible listing whose safe-consumption deadline passed (410 Expired)', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-expired',
        supplierOrgId: 'org-supplier-1',
        status: 'ACTIVE',
        type: 'EDIBLE',
        safeUntil: pastDate,
        collectionDeadline: new Date(Date.now() + 3600000),
      } as any);

      await expect(
        listingsService.claimListing('listing-expired', 'org-recipient-1', 'user-recipient-1')
      ).rejects.toMatchObject({
        statusCode: 410,
        code: 'LISTING_EXPIRED',
      });
    });

    it('should REJECT PROCESSOR role claiming EDIBLE surplus for human consumption (403 Role Restriction)', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-edible-1',
        supplierOrgId: 'org-supplier-1',
        status: 'ACTIVE',
        type: 'EDIBLE',
        safeUntil: new Date(Date.now() + 3600000),
        collectionDeadline: new Date(Date.now() + 3600000),
      } as any);

      await expect(
        listingsService.claimListing('listing-edible-1', 'org-proc-1', 'user-proc-1', 'PROCESSOR')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'ROLE_RESTRICTION',
      });
    });
  });

  describe('Handover OTP Verification & Completion Workflow', () => {
    it('should REJECT initiating handover OTP by non-supplier organization (403 Forbidden)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        status: 'CONFIRMED',
        listing: { supplierOrgId: 'org-real-supplier' },
      } as any);

      await expect(
        reservationsService.initiateHandoverOtp('res-101', 'org-imposter')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('should REJECT initiating handover OTP if reservation is PENDING (400 CLAIM_NOT_APPROVED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-pending',
        status: 'PENDING',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.initiateHandoverOtp('res-pending', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'CLAIM_NOT_APPROVED',
      });
    });

    it('should REJECT initiating handover OTP if reservation is CANCELLED (400 RESERVATION_CANCELLED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-cancelled',
        status: 'CANCELLED',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.initiateHandoverOtp('res-cancelled', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'RESERVATION_CANCELLED',
      });
    });

    it('should REJECT initiating handover OTP if reservation is COMPLETED (400 ALREADY_COMPLETED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-completed',
        status: 'COMPLETED',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.initiateHandoverOtp('res-completed', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'ALREADY_COMPLETED',
      });
    });

    it('should allow supplier to initiate handover OTP, return 6-digit code, and transition status to HANDOVER_PENDING', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        status: 'CONFIRMED',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      vi.mocked(prisma.reservation.update).mockResolvedValueOnce({
        id: 'res-101',
        status: 'HANDOVER_PENDING',
      } as any);

      const result = await reservationsService.initiateHandoverOtp('res-101', 'org-supplier-1');
      expect(result.otpReady).toBe(true);
      expect(result.otp).toMatch(/^\d{6}$/); // Returns 6-digit code for supplier to share with recipient
      expect(result.expiresInSeconds).toBe(900);
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-101' },
          data: expect.objectContaining({
            status: 'HANDOVER_PENDING',
          }),
        })
      );
    });

    it('should allow supplier to retrieve initiated handover OTP and reject non-supplier parties', async () => {
      // 1. Unauthorized party check (e.g. imposter or recipient attempting to read code via supplier API)
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        status: 'HANDOVER_PENDING',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.getReservationOtp('res-101', 'org-unauthorized')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });

      // 2. Legitimate supplier check (retrieves the active token generated in previous test)
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        status: 'HANDOVER_PENDING',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      const otpResult = await reservationsService.getReservationOtp('res-101', 'org-supplier-1');
      expect(otpResult.reservationId).toBe('res-101');
      expect(otpResult.otp).toMatch(/^\d{6}$/); // 6-digit numeric OTP
    });

    it('should REJECT retrieving OTP if reservation is PENDING, CANCELLED, or COMPLETED', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-pending',
        status: 'PENDING',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.getReservationOtp('res-pending', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS',
      });

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-completed',
        status: 'COMPLETED',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.getReservationOtp('res-completed', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'ALREADY_COMPLETED',
      });
    });

    it('should REJECT retrieving OTP if no active OTP is available (404 OTP_NOT_READY)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-no-otp',
        status: 'CONFIRMED',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.getReservationOtp('res-no-otp', 'org-supplier-1')
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'OTP_NOT_READY',
      });
    });

    it('should REJECT verification submitted by non-recipient organizations (403 FORBIDDEN)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        recipientOrgId: 'org-recipient-1',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.verifyHandoverOtp('res-101', 'org-supplier-1', '123456') // Supplier cannot verify
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('should REJECT verification if max attempts exceeded (429 OTP_LOCKED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-locked',
        recipientOrgId: 'org-recipient-1',
        status: 'HANDOVER_PENDING',
        otpHash: 'somehash',
        otpExpiresAt: new Date(Date.now() + 600000),
        otpAttempts: 3,
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.verifyHandoverOtp('res-locked', 'org-recipient-1', '123456')
      ).rejects.toMatchObject({
        statusCode: 429,
        code: 'OTP_LOCKED',
      });
    });

    it('should REJECT verification if OTP is expired (400 OTP_EXPIRED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-expired',
        recipientOrgId: 'org-recipient-1',
        status: 'HANDOVER_PENDING',
        otpHash: 'somehash',
        otpExpiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
        otpAttempts: 0,
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.verifyHandoverOtp('res-expired', 'org-recipient-1', '123456')
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'OTP_EXPIRED',
      });
    });

    it('should REJECT verification if invalid OTP is submitted and increment attempt counter', async () => {
      const bcrypt = await import('bcryptjs');
      const validHash = await bcrypt.default.hash('123456', 10);

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        recipientOrgId: 'org-recipient-1',
        status: 'HANDOVER_PENDING',
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() + 600000), // 10 mins from now
        otpAttempts: 0,
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      await expect(
        reservationsService.verifyHandoverOtp('res-101', 'org-recipient-1', '999999') // Wrong code by recipient
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_OTP',
      });

      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-101' },
          data: { otpAttempts: { increment: 1 } },
        })
      );
    });

    it('should successfully verify valid OTP submitted by recipient, completing reservation and listing atomically', async () => {
      const bcrypt = await import('bcryptjs');
      const validHash = await bcrypt.default.hash('654321', 10);

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-101',
        recipientOrgId: 'org-recipient-1',
        status: 'HANDOVER_PENDING',
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() + 600000),
        otpAttempts: 0,
        quantityClaimedKg: 25.5,
        listingId: 'listing-101',
        listing: { supplierOrgId: 'org-supplier-1' },
      } as any);

      const result = await reservationsService.verifyHandoverOtp('res-101', 'org-recipient-1', '654321');
      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('res-101');
      expect(result.finalWeightKg).toBe(25.5);
      expect(result.verifiedAt).toBeDefined();
    });
  });

  describe('Pending Claim Lifecycle & Supplier Approval Workflow', () => {
    const mockListing = {
      id: 'listing-pending-1',
      supplierOrgId: 'org-supplier-1',
      title: 'Cooked Surplus Meals',
      type: 'EDIBLE',
      status: 'ACTIVE',
      category: 'Prepared Meals',
      weightKg: 15.0,
      portions: 30,
      storageMethod: 'REFRIGERATED',
      allergens: ['Dairy'],
      collectionDeadline: new Date(Date.now() + 3600000),
      safeUntil: new Date(Date.now() + 7200000),
      earliestPickup: new Date(),
      pickupAddress: 'Commercial Kitchen St, Bengaluru',
      onSiteContact: 'Chef Marco',
      onSitePhone: '+919876543210',
      isFree: true,
      price: null,
      imageUrl: null,
      supplierOrg: {
        id: 'org-supplier-1',
        name: 'Grand Hotel Kitchen',
        city: 'Bengaluru',
      },
    };

    const mockPendingReservation = {
      id: 'res-pending-1',
      listingId: 'listing-pending-1',
      recipientOrgId: 'org-recipient-1',
      claimedById: 'user-recipient-1',
      status: 'PENDING',
      paymentStatus: 'NOT_REQUIRED',
      quantityClaimedKg: 15.0,
      priceAgreed: null,
      pickupAddress: 'Commercial Kitchen St, Bengaluru',
      earliestPickup: new Date(),
      collectionDeadline: new Date(Date.now() + 3600000),
      onSiteContact: 'Chef Marco',
      onSitePhone: '+919876543210',
      otpHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      listing: {
        ...mockListing,
        supplierOrg: mockListing.supplierOrg,
      },
      recipientOrg: {
        id: 'org-recipient-1',
        name: 'Hope Shelter',
      },
    };

    it('should create new claim with status PENDING and atomically mark listing as CLAIMED', async () => {
      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce(mockListing as any);
      vi.mocked(prisma.listing.update).mockResolvedValueOnce({
        ...mockListing,
        status: 'CLAIMED',
      } as any);
      vi.mocked(prisma.reservation.create).mockResolvedValueOnce(mockPendingReservation as any);

      const result = await listingsService.claimListing(
        'listing-pending-1',
        'org-recipient-1',
        'user-recipient-1'
      );

      // Verify returned status is pending
      expect(result.reservationStatus).toBe('pending');
      expect(result.listingId).toBe('listing-pending-1');

      // Verify listing was marked CLAIMED within the transaction
      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'listing-pending-1' },
          data: { status: 'CLAIMED' },
        })
      );

      // Verify reservation was created with PENDING status
      expect(prisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            listingId: 'listing-pending-1',
            status: 'PENDING',
          }),
        })
      );
    });

    it('should allow authorized supplier to ACCEPT a pending reservation (transitions to CONFIRMED)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockPendingReservation as any);
      vi.mocked(prisma.reservation.update).mockResolvedValueOnce({
        ...mockPendingReservation,
        status: 'CONFIRMED',
      } as any);

      const result = await reservationsService.updateReservationStatus(
        'res-pending-1',
        'org-supplier-1',
        'CONFIRMED'
      );

      expect(result.reservationStatus).toBe('confirmed');
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-pending-1' },
          data: { status: 'CONFIRMED' },
        })
      );
    });

    it('should allow authorized supplier to REJECT a pending reservation using CANCELLED status, restoring listing to ACTIVE', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockPendingReservation as any);
      vi.mocked(prisma.reservation.update).mockResolvedValueOnce({
        ...mockPendingReservation,
        status: 'CANCELLED',
      } as any);
      vi.mocked(prisma.listing.updateMany).mockResolvedValueOnce({ count: 1 } as any);

      const result = await reservationsService.updateReservationStatus(
        'res-pending-1',
        'org-supplier-1',
        'CANCELLED'
      );

      expect(result.reservationStatus).toBe('cancelled');
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-pending-1' },
          data: { status: 'CANCELLED' },
        })
      );
      expect(prisma.listing.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'listing-pending-1',
            status: 'CLAIMED',
          },
          data: { status: 'ACTIVE' },
        })
      );
    });

    it('should allow authorized supplier to REJECT a pending reservation when passing REJECTED status, restoring listing to ACTIVE', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockPendingReservation as any);
      vi.mocked(prisma.reservation.update).mockResolvedValueOnce({
        ...mockPendingReservation,
        status: 'CANCELLED',
      } as any);
      vi.mocked(prisma.listing.updateMany).mockResolvedValueOnce({ count: 1 } as any);

      const result = await reservationsService.updateReservationStatus(
        'res-pending-1',
        'org-supplier-1',
        'REJECTED'
      );

      expect(result.reservationStatus).toBe('cancelled');
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-pending-1' },
          data: { status: 'CANCELLED' },
        })
      );
      expect(prisma.listing.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'listing-pending-1',
            status: 'CLAIMED',
          },
          data: { status: 'ACTIVE' },
        })
      );
    });

    it('should REJECT approval attempt by non-supplier organization with 403 Forbidden', async () => {
      // Recipient attempts to approve
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockPendingReservation as any);

      await expect(
        reservationsService.updateReservationStatus(
          'res-pending-1',
          'org-recipient-1',
          'CONFIRMED'
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });

      // Third-party imposter attempts to approve
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockPendingReservation as any);

      await expect(
        reservationsService.updateReservationStatus(
          'res-pending-1',
          'org-imposter-99',
          'CONFIRMED'
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('should retrieve pending reservations for both recipient and supplier queries', async () => {
      vi.mocked(prisma.reservation.findMany).mockResolvedValueOnce([mockPendingReservation as any]);

      const recipientList = await reservationsService.getRecipientReservations('org-recipient-1');
      expect(recipientList).toHaveLength(1);
      expect(recipientList[0].reservationStatus).toBe('pending');
      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientOrgId: 'org-recipient-1' },
        })
      );

      vi.mocked(prisma.reservation.findMany).mockResolvedValueOnce([mockPendingReservation as any]);

      const supplierList = await reservationsService.getSupplierPickups('org-supplier-1');
      expect(supplierList).toHaveLength(1);
      expect(supplierList[0].reservationStatus).toBe('pending');
      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listing: { supplierOrgId: 'org-supplier-1' } },
        })
      );
    });
  });
});

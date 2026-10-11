import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import * as listingsService from '../src/modules/listings/listings.service';
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
    },
    reservation: {
      create: vi.fn(),
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
  });
});

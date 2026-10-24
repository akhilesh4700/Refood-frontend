import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import * as notificationsService from '../src/modules/notifications/notifications.service';
import * as listingsService from '../src/modules/listings/listings.service';
import * as reservationsService from '../src/modules/reservations/reservations.service';
import { AppError } from '../src/middleware/errorHandler';

// Mock prisma for deterministic unit testing
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    reservation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Notifications System & Lifecycle Events', () => {
  const app = createApp();

  const orgA = 'org-supplier-100';
  const orgB = 'org-recipient-200';

  const tokenOrgA = jwt.sign(
    { userId: 'user-a', email: 'a@example.com', role: 'SUPPLIER', organizationId: orgA },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenOrgB = jwt.sign(
    { userId: 'user-b', email: 'b@example.com', role: 'RECIPIENT', organizationId: orgB },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service: Access Control & Organization Isolation', () => {
    it('getNotifications should only return notifications for the specified organization', async () => {
      const mockList = [
        {
          id: 'notif-1',
          organizationId: orgA,
          title: 'Test Title',
          body: 'Test Body',
          eventType: 'reservation_new',
          isRead: false,
          relatedPath: '/supplier/pickups',
          relatedId: 'res-1',
          createdAt: new Date('2026-10-12T10:00:00Z'),
        },
      ];
      vi.mocked(prisma.notification.findMany).mockResolvedValueOnce(mockList as any);

      const result = await notificationsService.getNotifications(orgA);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgA },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-1');
      expect(result[0].isRead).toBe(false);
      expect(result[0].createdAt).toBe('2026-10-12T10:00:00.000Z');
    });

    it('markNotificationAsRead should reject modifying another organization\'s notification with 403 FORBIDDEN', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce({
        id: 'notif-1',
        organizationId: orgA, // belongs to Org A
        title: 'Title',
        body: 'Body',
        eventType: 'reservation_new',
        isRead: false,
        createdAt: new Date(),
      } as any);

      // Org B attempts to mark Org A's notification as read
      let error: any;
      try {
        await notificationsService.markNotificationAsRead('notif-1', orgB);
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('markNotificationAsRead should throw 404 NOT_FOUND if notification does not exist', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce(null);

      await expect(
        notificationsService.markNotificationAsRead('non-existent', orgA)
      ).rejects.toThrowError('Notification not found');
    });

    it('markNotificationAsRead should successfully mark own notification as read', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce({
        id: 'notif-1',
        organizationId: orgA,
        title: 'Title',
        body: 'Body',
        eventType: 'reservation_new',
        isRead: false,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.notification.update).mockResolvedValueOnce({
        id: 'notif-1',
        organizationId: orgA,
        title: 'Title',
        body: 'Body',
        eventType: 'reservation_new',
        isRead: true,
        createdAt: new Date('2026-10-12T10:00:00Z'),
      } as any);

      const result = await notificationsService.markNotificationAsRead('notif-1', orgA);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    it('markAllNotificationsAsRead should update all unread notifications for organization', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValueOnce({ count: 5 });

      const result = await notificationsService.markAllNotificationsAsRead(orgA);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { organizationId: orgA, isRead: false },
        data: { isRead: true },
      });
      expect(result.count).toBe(5);
    });
  });

  describe('Lifecycle Events Notification Triggers', () => {
    it('claimListing should create reservation_new notification for the supplier organization', async () => {
      const now = new Date();
      const future = new Date(Date.now() + 86400000);

      vi.mocked(prisma.listing.findUnique).mockResolvedValueOnce({
        id: 'listing-1',
        supplierOrgId: orgA,
        status: 'ACTIVE',
        type: 'EDIBLE',
        title: 'Fresh Biryani',
        weightKg: 10,
        price: null,
        isFree: true,
        safeUntil: future,
        collectionDeadline: future,
        pickupAddress: 'Kitchen 1',
        earliestPickup: now,
        supplierOrg: { name: 'Hotel Taj', city: 'Bengaluru' },
      } as any);

      vi.mocked(prisma.listing.update).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.reservation.create).mockResolvedValueOnce({
        id: 'res-1',
        listingId: 'listing-1',
        recipientOrgId: orgB,
        claimedById: 'user-b',
        status: 'PENDING',
        paymentStatus: 'NOT_REQUIRED',
        quantityClaimedKg: 10,
        pickupAddress: 'Kitchen 1',
        earliestPickup: now,
        collectionDeadline: future,
        createdAt: now,
        updatedAt: now,
        listing: {
          id: 'listing-1',
          title: 'Fresh Biryani',
          type: 'EDIBLE',
          weightKg: 10,
          isFree: true,
          storageMethod: 'AMBIENT',
          allergens: [],
          supplierOrg: { name: 'Hotel Taj', city: 'Bengaluru' },
        },
        recipientOrg: { id: orgB, name: 'Robin Hood Army' },
      } as any);

      vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any);

      await listingsService.claimListing('listing-1', orgB, 'user-b', 'RECIPIENT');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgA, // supplier org
          title: 'New Claim Request',
          body: expect.stringContaining('Robin Hood Army has claimed your listing "Fresh Biryani"'),
          eventType: 'reservation_new',
          relatedId: 'res-1',
          relatedPath: '/supplier/pickups',
        },
      });
    });

    it('updateReservationStatus(CONFIRMED) should create reservation_confirmed notification for recipient organization', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-1',
        listingId: 'listing-1',
        recipientOrgId: orgB,
        status: 'PENDING',
        listing: {
          id: 'listing-1',
          title: 'Fresh Bread',
          supplierOrgId: orgA,
          supplierOrg: { name: 'Artisan Bakery', city: 'Bengaluru' },
        },
      } as any);

      const confirmedRes = {
        id: 'res-1',
        listingId: 'listing-1',
        recipientOrgId: orgB,
        status: 'CONFIRMED',
        paymentStatus: 'NOT_REQUIRED',
        earliestPickup: new Date(),
        collectionDeadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        listing: {
          id: 'listing-1',
          title: 'Fresh Bread',
          type: 'EDIBLE',
          weightKg: 5,
          isFree: true,
          storageMethod: 'AMBIENT',
          allergens: [],
          supplierOrg: { name: 'Artisan Bakery', city: 'Bengaluru' },
        },
        recipientOrg: { name: 'Community Kitchen' },
      };

      vi.mocked(prisma.reservation.update).mockResolvedValueOnce(confirmedRes as any);
      vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any);

      await reservationsService.updateReservationStatus('res-1', orgA, 'CONFIRMED');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgB, // recipient org
          title: 'Claim Request Accepted',
          body: expect.stringContaining('Your reservation for "Fresh Bread" has been confirmed by Artisan Bakery'),
          eventType: 'reservation_confirmed',
          relatedId: 'res-1',
          relatedPath: '/recipient/reservations',
        },
      });
    });

    it('updateReservationStatus(CANCELLED) should create reservation_cancelled notification and restore listing status', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce({
        id: 'res-1',
        listingId: 'listing-1',
        recipientOrgId: orgB,
        status: 'PENDING',
        listing: {
          id: 'listing-1',
          title: 'Surplus Apples',
          supplierOrgId: orgA,
          supplierOrg: { name: 'City Market', city: 'Bengaluru' },
        },
      } as any);

      const cancelledRes = {
        id: 'res-1',
        listingId: 'listing-1',
        recipientOrgId: orgB,
        status: 'CANCELLED',
        paymentStatus: 'NOT_REQUIRED',
        earliestPickup: new Date(),
        collectionDeadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        listing: {
          id: 'listing-1',
          title: 'Surplus Apples',
          type: 'EDIBLE',
          weightKg: 20,
          isFree: true,
          storageMethod: 'AMBIENT',
          allergens: [],
          supplierOrg: { name: 'City Market', city: 'Bengaluru' },
        },
        recipientOrg: { name: 'Hope Center' },
      };

      vi.mocked(prisma.reservation.update).mockResolvedValueOnce(cancelledRes as any);
      vi.mocked(prisma.listing.updateMany).mockResolvedValueOnce({ count: 1 } as any);
      vi.mocked(prisma.notification.create).mockResolvedValueOnce({} as any);

      await reservationsService.updateReservationStatus('res-1', orgA, 'CANCELLED');

      expect(prisma.listing.updateMany).toHaveBeenCalledWith({
        where: { id: 'listing-1', status: 'CLAIMED' },
        data: { status: 'ACTIVE' },
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgB, // recipient org
          title: 'Claim Request Declined',
          body: expect.stringContaining('Your reservation request for "Surplus Apples" was declined by City Market'),
          eventType: 'reservation_cancelled',
          relatedId: 'res-1',
          relatedPath: '/recipient/browse',
        },
      });
    });
  });

  describe('HTTP Endpoints & Authentication Guards', () => {
    it('GET /api/notifications should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/notifications should return list of notifications for authenticated user', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([
        {
          id: 'notif-1',
          organizationId: orgA,
          title: 'Order Received',
          body: 'Details here',
          eventType: 'reservation_new',
          isRead: false,
          createdAt: new Date('2026-10-12T10:00:00Z'),
        },
      ] as any);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('notif-1');
    });

    it('PATCH /api/notifications/:id/read should mark notification read', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce({
        id: 'notif-1',
        organizationId: orgA,
        title: 'Title',
        body: 'Body',
        eventType: 'reservation_new',
        isRead: false,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.notification.update).mockResolvedValueOnce({
        id: 'notif-1',
        organizationId: orgA,
        title: 'Title',
        body: 'Body',
        eventType: 'reservation_new',
        isRead: true,
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .patch('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('POST /api/notifications/read-all should mark all notifications read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValueOnce({ count: 3 });

      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(3);
    });
  });
});

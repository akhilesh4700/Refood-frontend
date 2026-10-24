import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import * as reservationsService from '../src/modules/reservations/reservations.service';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

describe('Reservation Chat & Dispatch Messaging', () => {
  const app = createApp();

  const supplierOrg = 'org-supplier-1';
  const recipientOrg = 'org-recipient-1';
  const imposterOrg = 'org-unrelated-99';

  const supplierToken = jwt.sign(
    { userId: 'user-sup', email: 'chef@grandhotel.com', role: 'SUPPLIER', organizationId: supplierOrg, name: 'Chef Marco' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const recipientToken = jwt.sign(
    { userId: 'user-rec', email: 'driver@shelter.org', role: 'RECIPIENT', organizationId: recipientOrg, name: 'Driver Ravi' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const imposterToken = jwt.sign(
    { userId: 'user-imp', email: 'imposter@hacker.io', role: 'RECIPIENT', organizationId: imposterOrg, name: 'Imposter' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mockActiveReservation = {
    id: 'res-chat-1',
    status: 'CONFIRMED',
    recipientOrgId: recipientOrg,
    listingId: 'listing-100',
    listing: {
      id: 'listing-100',
      supplierOrgId: supplierOrg,
      title: 'Chilled Catering Trays',
    },
  };

  const mockCancelledReservation = {
    ...mockActiveReservation,
    status: 'CANCELLED',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication & Authorization Guards', () => {
    it('should reject unauthenticated request to read chat (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/reservations/res-chat-1/chat');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to send chat (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .send({ text: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('should reject unrelated organization from reading messages (403 Forbidden)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockActiveReservation as any);

      const res = await request(app)
        .get('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${imposterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unrelated organization from sending messages (403 Forbidden)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockActiveReservation as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${imposterToken}`)
        .send({ text: 'Attempting to inject message' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 if reservation does not exist', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/reservations/res-nonexistent/chat')
        .set('Authorization', `Bearer ${supplierToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Validation & Status Rules', () => {
    it('should reject empty or whitespace-only messages (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject messages exceeding 1000 characters (400 Bad Request)', async () => {
      const longText = 'a'.repeat(1001);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ text: longText });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject sending messages on a CANCELLED reservation (400 Bad Request)', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockCancelledReservation as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ text: 'Are you still there?' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('RESERVATION_CANCELLED');
    });
  });

  describe('Successful Read & Send Operations with Persistence', () => {
    it('should allow supplier to read chat history in chronological order', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockActiveReservation as any);
      vi.mocked(prisma.chatMessage.findMany).mockResolvedValueOnce([
        {
          id: 'msg-1',
          reservationId: 'res-chat-1',
          senderId: 'user-rec',
          senderOrgId: recipientOrg,
          senderRole: 'RECIPIENT',
          senderName: 'Driver Ravi',
          text: 'Arriving in 10 minutes at Dock 4',
          createdAt: new Date('2026-10-12T10:00:00Z'),
        },
        {
          id: 'msg-2',
          reservationId: 'res-chat-1',
          senderId: 'user-sup',
          senderOrgId: supplierOrg,
          senderRole: 'SUPPLIER',
          senderName: 'Chef Marco',
          text: 'Confirmed, bay 4 is open for loading',
          createdAt: new Date('2026-10-12T10:02:00Z'),
        },
      ] as any);

      const res = await request(app)
        .get('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe('msg-1');
      expect(res.body.data[0].senderRole).toBe('recipient');
      expect(res.body.data[1].id).toBe('msg-2');
      expect(res.body.data[1].senderRole).toBe('supplier');
      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reservationId: 'res-chat-1' },
          orderBy: { createdAt: 'asc' },
        })
      );
    });

    it('should allow recipient to send a message, derive server-side identity, and persist', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockActiveReservation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ name: 'Driver Ravi' } as any);
      vi.mocked(prisma.chatMessage.create).mockResolvedValueOnce({
        id: 'msg-new-1',
        reservationId: 'res-chat-1',
        senderId: 'user-rec',
        senderOrgId: recipientOrg,
        senderRole: 'RECIPIENT',
        senderName: 'Driver Ravi',
        text: 'Vehicle parked at Loading Dock 4',
        createdAt: new Date('2026-10-12T10:05:00Z'),
      } as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          text: '  Vehicle parked at Loading Dock 4  ',
          // Malicious attempt to spoof sender details should be ignored
          senderRole: 'ADMIN',
          senderName: 'SuperAdmin Spoof',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Vehicle parked at Loading Dock 4');
      expect(res.body.data.senderRole).toBe('recipient');

      // Verify server-side user data was used
      expect(prisma.chatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservationId: 'res-chat-1',
            senderId: 'user-rec',
            senderOrgId: recipientOrg,
            senderRole: 'RECIPIENT',
            senderName: 'Driver Ravi',
            text: 'Vehicle parked at Loading Dock 4',
          }),
        })
      );
    });

    it('should reject with 500 and not fabricate success when database insertion fails', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockActiveReservation as any);
      vi.mocked(prisma.chatMessage.create).mockRejectedValueOnce(new Error('Connection lost to PostgreSQL'));

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ text: 'Testing database error failure handling' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Chat Lifecycle, Completion & 2-Hour Cutoff Enforcement', () => {
    it('should allow sending messages within the 2-hour window on a COMPLETED reservation', async () => {
      const withinWindowReservation = {
        ...mockActiveReservation,
        status: 'COMPLETED',
        handoverVerifiedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      };

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(withinWindowReservation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ name: 'Chef Marco' } as any);
      vi.mocked(prisma.chatMessage.create).mockResolvedValueOnce({
        id: 'msg-comp-1',
        reservationId: 'res-chat-1',
        senderId: 'user-sup',
        senderOrgId: supplierOrg,
        senderRole: 'SUPPLIER',
        senderName: 'Chef Marco',
        text: 'Follow-up regarding handover storage temp',
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ text: 'Follow-up regarding handover storage temp' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Follow-up regarding handover storage temp');
    });

    it('should reject sending messages exactly at the 2-hour cutoff (400 CHAT_WINDOW_EXPIRED)', async () => {
      const exactlyAtCutoffReservation = {
        ...mockActiveReservation,
        status: 'COMPLETED',
        handoverVerifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // exactly 2 hours ago
      };

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(exactlyAtCutoffReservation as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ text: 'Attempting to send exactly at 2-hour mark' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CHAT_WINDOW_EXPIRED');
    });

    it('should reject sending messages after the 2-hour window has expired (400 CHAT_WINDOW_EXPIRED)', async () => {
      const expiredReservation = {
        ...mockActiveReservation,
        status: 'COMPLETED',
        handoverVerifiedAt: new Date(Date.now() - (2 * 60 * 60 * 1000 + 10000)), // 2 hours 10s ago
      };

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(expiredReservation as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ text: 'Attempting to send after cutoff' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CHAT_WINDOW_EXPIRED');
    });

    it('should reject sending messages on a COMPLETED reservation missing handoverVerifiedAt (400 CHAT_WINDOW_EXPIRED)', async () => {
      const missingTimestampReservation = {
        ...mockActiveReservation,
        status: 'COMPLETED',
        handoverVerifiedAt: null,
      };

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(missingTimestampReservation as any);

      const res = await request(app)
        .post('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ text: 'Message without timestamp' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CHAT_WINDOW_EXPIRED');
    });

    it('should allow reading chat history after the 2-hour cutoff has expired', async () => {
      const expiredReservation = {
        ...mockActiveReservation,
        status: 'COMPLETED',
        handoverVerifiedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      };

      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(expiredReservation as any);
      vi.mocked(prisma.chatMessage.findMany).mockResolvedValueOnce([
        {
          id: 'msg-old-1',
          reservationId: 'res-chat-1',
          senderId: 'user-sup',
          senderOrgId: supplierOrg,
          senderRole: 'SUPPLIER',
          senderName: 'Chef Marco',
          text: 'Pickup complete, thank you!',
          createdAt: new Date('2026-10-12T10:00:00Z'),
        },
      ] as any);

      const res = await request(app)
        .get('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].text).toBe('Pickup complete, thank you!');
    });

    it('should allow reading chat history on a CANCELLED reservation', async () => {
      vi.mocked(prisma.reservation.findUnique).mockResolvedValueOnce(mockCancelledReservation as any);
      vi.mocked(prisma.chatMessage.findMany).mockResolvedValueOnce([
        {
          id: 'msg-cancelled-1',
          reservationId: 'res-chat-1',
          senderId: 'user-rec',
          senderOrgId: recipientOrg,
          senderRole: 'RECIPIENT',
          senderName: 'Driver Ravi',
          text: 'Understood, claim was declined',
          createdAt: new Date('2026-10-12T09:00:00Z'),
        },
      ] as any);

      const res = await request(app)
        .get('/api/reservations/res-chat-1/chat')
        .set('Authorization', `Bearer ${supplierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].text).toBe('Understood, claim was declined');
    });
  });
});

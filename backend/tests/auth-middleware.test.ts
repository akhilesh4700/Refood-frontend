import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('Authentication & Role Authorization Middleware', () => {
  const app = createApp();

  const supplierToken = jwt.sign(
    {
      userId: 'user-supp-1',
      email: 'supplier@hotel.com',
      role: 'SUPPLIER',
      organizationId: 'org-supp-1',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const recipientToken = jwt.sign(
    {
      userId: 'user-recip-1',
      email: 'ngo@hope.org',
      role: 'RECIPIENT',
      organizationId: 'org-recip-1',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  it('should reject protected route when Authorization header is missing (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject protected route with invalid token (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-corrupted-token-signature');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should reject RECIPIENT user from creating a listing (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        title: 'Unauthorized Listing',
        description: 'Should be rejected because recipient cannot supply',
        type: 'edible',
        category: 'Bakery',
        weightKg: 10,
        collectionDeadline: new Date(Date.now() + 3600000).toISOString(),
        pickupAddress: 'Street 1',
        onSiteContact: 'Test',
        onSitePhone: '12345678',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain("Role 'RECIPIENT' is not authorized");
  });

  it('should reject SUPPLIER user from claiming a listing (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .post('/api/listings/mock-listing-id/claim')
      .set('Authorization', `Bearer ${supplierToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain("Role 'SUPPLIER' is not authorized");
  });

  it('should reject RECIPIENT user from viewing supplier-only inventory (403 FORBIDDEN)', async () => {
    const res = await request(app)
      .get('/api/listings/mine')
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

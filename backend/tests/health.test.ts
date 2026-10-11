import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health Check API', () => {
  const app = createApp();

  it('GET /api/health should respond with health status payload', async () => {
    const res = await request(app).get('/api/health');

    // Either 200 (healthy) or 503 (degraded without active postgres)
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('connected');
  });

  it('GET /health (alias) should respond identical to /api/health', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });

  it('GET /unknown-route should return structured 404 response', async () => {
    const res = await request(app).get('/unknown-nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Cannot GET /unknown-nonexistent-endpoint',
      },
    });
  });
});

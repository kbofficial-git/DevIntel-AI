import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

// Mock the healthRepository so tests can run deterministically without requiring a live PostgreSQL instance
vi.mock('../src/repositories/health.repository', () => {
  return {
    healthRepository: {
      getDatabaseHealth: vi.fn().mockResolvedValue({
        connected: true,
        pgvectorAvailable: true,
        latencyMs: 12,
      }),
    },
  };
});

describe('Health Check API', () => {
  it('GET /api/health returns 200 and valid system status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toMatchObject({
      status: 'ok',
      service: 'devintel-backend',
      version: '0.1.0',
    });
    expect(response.body.data.database).toMatchObject({
      connected: true,
      pgvectorAvailable: true,
    });
    expect(response.headers).toHaveProperty('x-request-id');
  });

  it('GET /api/non-existent-route returns 404 error response', async () => {
    const response = await request(app).get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});

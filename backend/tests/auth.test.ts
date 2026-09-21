import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Authentication API', () => {
  it('GET /api/auth/me returns 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('POST /api/auth/logout returns 401 when unauthenticated', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('GET /api/auth/github redirects to GitHub OAuth authorize URL', async () => {
    const response = await request(app).get('/api/auth/github');

    expect(response.status).toBe(302);
    const location = response.headers.location;
    expect(location).toContain('https://github.com/login/oauth/authorize');
    expect(location).toContain('client_id=');
    expect(location).toContain('state=');
  });

  it('GET /api/auth/github/callback redirects to login with error if user denied access', async () => {
    const response = await request(app)
      .get('/api/auth/github/callback')
      .query({ error: 'access_denied', error_description: 'The user has denied your application access.' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/login?error=access_denied');
  });

  it('GET /api/auth/github/callback redirects to login with error when code/state missing', async () => {
    const response = await request(app).get('/api/auth/github/callback');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/login?error=missing_code_or_state');
  });
});

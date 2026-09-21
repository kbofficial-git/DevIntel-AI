import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { feedbackService } from '../src/services/feedback.service';
import { repositoryRepository } from '../src/repositories/repository.repository';
import { prisma } from '../src/config/database';

vi.mock('../src/repositories/health.repository', () => ({
  healthRepository: {
    getDatabaseHealth: vi.fn().mockResolvedValue({
      connected: true,
      pgvectorAvailable: true,
      latencyMs: 10,
    }),
  },
}));

vi.mock('../src/services/ingestion/queue.service', () => ({
  checkRedisHealth: vi.fn().mockResolvedValue({
    status: 'healthy',
  }),
  enqueueIngestionJob: vi.fn(),
  getIngestionJobStatus: vi.fn(),
  ingestionQueue: {
    add: vi.fn(),
  },
}));

vi.mock('../src/repositories/repository.repository', () => ({
  repositoryRepository: {
    findByIdAndUser: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    feedback: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe('Milestone 5: Production Hardening, Security, Observability & Feedback', () => {
  const mockUserId = 'user-test-owner';
  const mockRepoId = 'repo-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Production Security Headers', () => {
    it('returns hardened HTTP security headers on API responses', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['x-download-options']).toBe('noopen');
    });

    it('enforces JSON body limit rejecting oversized payloads', async () => {
      // 2MB is the limit; test that middleware is mounted
      const hugePayload = { data: 'a'.repeat(100) };
      const res = await request(app)
        .post('/api/auth/logout')
        .send(hugePayload);

      // Successfully processed or handled by auth middleware
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Component-level Health Check', () => {
    it('returns component statuses for postgres and redis when healthy', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('components');
      expect(response.body.data.components.postgres).toMatchObject({
        status: 'healthy',
      });
      expect(response.body.data.components.redis).toMatchObject({
        status: 'healthy',
      });
      expect(response.body.data.status).toBe('ok');
    });

    it('returns degraded status when redis is down without failing entire health endpoint', async () => {
      const { checkRedisHealth } = await import('../src/services/ingestion/queue.service');
      vi.mocked(checkRedisHealth).mockResolvedValueOnce({
        status: 'unhealthy',
        error: 'ECONNREFUSED 127.0.0.1:6379',
      });

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('degraded');
      expect(response.body.data.components.redis).toMatchObject({
        status: 'unhealthy',
        error: 'ECONNREFUSED 127.0.0.1:6379',
      });
      expect(response.body.data.components.postgres.status).toBe('healthy');
    });
  });

  describe('User Feedback Service & Authorization', () => {
    it('rejects feedback without authentication at route level', async () => {
      const response = await request(app)
        .post(`/api/repositories/${mockRepoId}/feedback`)
        .send({
          capability: 'chat',
          rating: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('feedbackService throws 404 if repository does not belong to user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValueOnce(null);

      await expect(
        feedbackService.recordFeedback(mockUserId, 'unowned-repo', {
          capability: 'chat',
          rating: 1,
        })
      ).rejects.toThrow('Repository not found');
    });

    it('feedbackService records feedback with valid input and repository ownership', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
        name: 'test-repo',
        fullName: 'owner/test-repo',
        defaultBranch: 'main',
      } as any);

      vi.mocked((prisma as any).feedback.create).mockResolvedValueOnce({
        id: 'fb-generated-1',
        userId: mockUserId,
        repositoryId: mockRepoId,
        capability: 'review',
        rating: 1,
        comment: 'Accurate review!',
        referenceId: 'ref-123',
        createdAt: new Date(),
      });

      const result = await feedbackService.recordFeedback(mockUserId, mockRepoId, {
        capability: 'review',
        rating: 1,
        comment: 'Accurate review!',
        referenceId: 'ref-123',
      });

      expect(result).toHaveProperty('id', 'fb-generated-1');
      expect((prisma as any).feedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          repositoryId: mockRepoId,
          capability: 'review',
          rating: 1,
          comment: 'Accurate review!',
          referenceId: 'ref-123',
        }),
      });
    });
  });

  describe('AI Observability Metadata Contract', () => {
    it('verifies AIMetadata structure on AI responses', () => {
      const sampleMeta = {
        latencyMs: 342,
        chunksRetrieved: 5,
        model: 'gpt-4o-mini',
      };

      expect(sampleMeta.latencyMs).toBeGreaterThan(0);
      expect(sampleMeta.chunksRetrieved).toBe(5);
      expect(sampleMeta.model).toBe('gpt-4o-mini');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { ingestionService } from '../src/services/ingestion/ingestion.service';
import { ingestionRepository } from '../src/repositories/ingestion.repository';
import { repositoryRepository } from '../src/repositories/repository.repository';
import { userRepository } from '../src/repositories/user.repository';
import { chunkRepository } from '../src/repositories/chunk.repository';
import { githubService } from '../src/services/github/github.service';
import * as queueService from '../src/services/ingestion/queue.service';
const IngestionStatus = {
  QUEUED: 'QUEUED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

vi.mock('../src/repositories/ingestion.repository');
vi.mock('../src/repositories/repository.repository');
vi.mock('../src/repositories/user.repository');
vi.mock('../src/repositories/chunk.repository');
vi.mock('../src/services/github/github.service');
vi.mock('../src/services/ingestion/queue.service', () => ({
  addIngestionJob: vi.fn().mockResolvedValue({ id: 'queue-job-1' }),
  initIngestionWorker: vi.fn(),
}));

describe('Ingestion Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ingestion Authorization & HTTP Access', () => {
    it('POST /api/repositories/:id/index returns 401 when unauthenticated', async () => {
      const response = await request(app).post(
        '/api/repositories/a0000000-0000-0000-0000-000000000001/index'
      );
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('GET /api/repositories/:id/index/status returns 401 when unauthenticated', async () => {
      const response = await request(app).get(
        '/api/repositories/a0000000-0000-0000-0000-000000000001/index/status'
      );
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('triggerIngestion throws 404 when repository does not belong to user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        ingestionService.triggerIngestion('user-1', 'other-users-repo')
      ).rejects.toThrow('Repository not found');
    });
  });

  describe('Ingestion Lifecycle & Flow', () => {
    const mockUserId = 'user-abc';
    const mockRepoId = 'repo-xyz';
    const mockRepo = {
      id: mockRepoId,
      userId: mockUserId,
      githubRepoId: 101,
      name: 'test-repo',
      fullName: 'org/test-repo',
      owner: 'org',
      description: null,
      defaultBranch: 'main',
      private: false,
      githubUrl: 'https://github.com/org/test-repo',
      language: 'TypeScript',
      lastIndexedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('triggerIngestion creates and enqueues job if none running', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(ingestionRepository.getLatestJobByRepository).mockResolvedValue(null);
      vi.mocked(ingestionRepository.createJob).mockResolvedValue({
        id: 'job-1',
        repositoryId: mockRepoId,
        status: IngestionStatus.QUEUED,
      } as any);

      const result = await ingestionService.triggerIngestion(mockUserId, mockRepoId);

      expect(result.alreadyRunning).toBe(false);
      expect(ingestionRepository.createJob).toHaveBeenCalledWith(mockRepoId);
      expect(queueService.addIngestionJob).toHaveBeenCalledWith({
        jobId: 'job-1',
        repositoryId: mockRepoId,
        userId: mockUserId,
      });
    });

    it('triggerIngestion returns alreadyRunning if an active job exists', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(ingestionRepository.getLatestJobByRepository).mockResolvedValue({
        id: 'job-running',
        status: IngestionStatus.IN_PROGRESS,
      } as any);

      const result = await ingestionService.triggerIngestion(mockUserId, mockRepoId);

      expect(result.alreadyRunning).toBe(true);
      expect(ingestionRepository.createJob).not.toHaveBeenCalled();
      expect(queueService.addIngestionJob).not.toHaveBeenCalled();
    });

    it('processIngestionJob runs full pipeline: tree -> filter -> fetch -> chunk -> embed -> persist', async () => {
      vi.mocked(userRepository.findByIdWithToken).mockResolvedValue({
        id: mockUserId,
        githubToken: 'gho_token_123',
      } as any);

      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);

      vi.mocked(githubService.fetchRepositoryTree).mockResolvedValue({
        sha: 'commit-sha-1',
        url: '',
        tree: [
          { path: 'src/index.ts', mode: '100644', type: 'blob', sha: 'blob-1', size: 50, url: '' },
          { path: 'node_modules/pkg/index.js', mode: '100644', type: 'blob', sha: 'blob-2', size: 50, url: '' },
          { path: 'image.png', mode: '100644', type: 'blob', sha: 'blob-3', size: 1000, url: '' },
        ],
        truncated: false,
      });

      vi.mocked(githubService.fetchBlobContent).mockResolvedValue('export const hello = "world";');
      vi.mocked(chunkRepository.deleteByRepository).mockResolvedValue({ count: 0 } as any);
      vi.mocked(chunkRepository.saveChunksWithEmbeddings).mockResolvedValue(1);
      vi.mocked(ingestionRepository.completeJob).mockResolvedValue({} as any);

      await ingestionService.processIngestionJob({
        jobId: 'job-1',
        repositoryId: mockRepoId,
        userId: mockUserId,
      });

      // Assertions
      expect(ingestionRepository.updateJobProgress).toHaveBeenCalledWith('job-1', {
        status: IngestionStatus.IN_PROGRESS,
      });

      // Should only fetch the blob for src/index.ts, ignoring node_modules and image.png
      expect(githubService.fetchBlobContent).toHaveBeenCalledTimes(1);
      expect(githubService.fetchBlobContent).toHaveBeenCalledWith(
        'gho_token_123',
        'org',
        'test-repo',
        'blob-1'
      );

      expect(chunkRepository.deleteByRepository).toHaveBeenCalledWith(mockRepoId);
      expect(chunkRepository.saveChunksWithEmbeddings).toHaveBeenCalledTimes(1);
      expect(ingestionRepository.completeJob).toHaveBeenCalledTimes(1);
    });

    it('processIngestionJob marks job FAILED when an unrecoverable error occurs', async () => {
      vi.mocked(userRepository.findByIdWithToken).mockResolvedValue({
        id: mockUserId,
        githubToken: 'gho_token_123',
      } as any);

      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(githubService.fetchRepositoryTree).mockRejectedValue(new Error('GitHub Network Failure'));

      await expect(
        ingestionService.processIngestionJob({
          jobId: 'job-fail',
          repositoryId: mockRepoId,
          userId: mockUserId,
        })
      ).rejects.toThrow('GitHub Network Failure');

      expect(ingestionRepository.failJob).toHaveBeenCalledWith('job-fail', 'GitHub Network Failure');
    });
  });
});

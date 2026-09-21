import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { repositoryService } from '../src/services/repository/repository.service';
import { repositoryRepository } from '../src/repositories/repository.repository';
import { userRepository } from '../src/repositories/user.repository';
import { githubService } from '../src/services/github/github.service';
import { connectRepositorySchema, repositoryIdParamSchema } from '../src/schemas/repository.schema';
import { AppError } from '../src/middleware/errorHandler';

vi.mock('../src/repositories/repository.repository');
vi.mock('../src/repositories/user.repository');
vi.mock('../src/services/github/github.service');

describe('Repository API & Service Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated HTTP Access Control', () => {
    it('GET /api/repositories returns 401 when not logged in', async () => {
      const response = await request(app).get('/api/repositories');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('POST /api/repositories returns 401 when not logged in', async () => {
      const response = await request(app).post('/api/repositories').send({
        githubRepoId: 12345,
        name: 'test-repo',
        fullName: 'user/test-repo',
        owner: 'user',
        githubUrl: 'https://github.com/user/test-repo',
      });
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('GET /api/repositories/:id returns 401 when not logged in', async () => {
      const response = await request(app).get('/api/repositories/a0000000-0000-0000-0000-000000000001');
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('DELETE /api/repositories/:id returns 401 when not logged in', async () => {
      const response = await request(app).delete('/api/repositories/a0000000-0000-0000-0000-000000000001');
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('GET /api/github/repositories returns 401 when not logged in', async () => {
      const response = await request(app).get('/api/github/repositories');
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('Validation Schemas', () => {
    it('connectRepositorySchema validates valid repo input', () => {
      const valid = {
        githubRepoId: 987654,
        name: 'devintel-ai',
        fullName: 'developer/devintel-ai',
        owner: 'developer',
        description: 'AI platform',
        defaultBranch: 'main',
        private: false,
        githubUrl: 'https://github.com/developer/devintel-ai',
        language: 'TypeScript',
      };

      const result = connectRepositorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('connectRepositorySchema rejects missing required fields and invalid URLs', () => {
      const invalid = {
        githubRepoId: -1,
        name: '',
        githubUrl: 'not-a-valid-url',
      };

      const result = connectRepositorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('githubRepoId');
        expect(fields).toContain('name');
        expect(fields).toContain('fullName');
        expect(fields).toContain('owner');
        expect(fields).toContain('githubUrl');
      }
    });

    it('repositoryIdParamSchema enforces valid UUID format', () => {
      expect(repositoryIdParamSchema.safeParse({ id: 'invalid-id' }).success).toBe(false);
      expect(
        repositoryIdParamSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' }).success
      ).toBe(true);
    });
  });

  describe('Repository Business Logic & Multi-Tenant Isolation', () => {
    const mockUserId = 'user-abc-123';

    it('listConnected queries repositories strictly filtered by current user', async () => {
      const mockRepos = [
        {
          id: 'repo-1',
          userId: mockUserId,
          githubRepoId: 100,
          name: 'repo-one',
          fullName: 'user/repo-one',
          owner: 'user',
          description: null,
          defaultBranch: 'main',
          private: false,
          githubUrl: 'https://github.com/user/repo-one',
          language: 'TypeScript',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(repositoryRepository.findAllByUser).mockResolvedValue(mockRepos as any);

      const result = await repositoryService.listConnected(mockUserId);
      expect(repositoryRepository.findAllByUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockRepos);
    });

    it('connect throws 409 Conflict when repository is already connected by user', async () => {
      vi.mocked(repositoryRepository.findByGithubRepoIdAndUser).mockResolvedValue({
        id: 'existing-repo',
      } as any);

      await expect(
        repositoryService.connect(mockUserId, {
          githubRepoId: 100,
          name: 'repo-one',
          fullName: 'user/repo-one',
          owner: 'user',
          githubUrl: 'https://github.com/user/repo-one',
        })
      ).rejects.toThrowError(AppError);

      expect(repositoryRepository.create).not.toHaveBeenCalled();
    });

    it('getById returns 404 NOT_FOUND when repository belongs to a different user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        repositoryService.getById('repo-belonging-to-other-user', mockUserId)
      ).rejects.toThrow('Repository not found');

      expect(repositoryRepository.findByIdAndUser).toHaveBeenCalledWith(
        'repo-belonging-to-other-user',
        mockUserId
      );
    });

    it('delete returns 404 NOT_FOUND when deleting repository not owned by user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        repositoryService.delete('non-existent-or-other-user-repo', mockUserId)
      ).rejects.toThrow('Repository not found');

      expect(repositoryRepository.delete).not.toHaveBeenCalled();
    });

    it('listAvailableGitHub identifies already connected repos', async () => {
      vi.mocked(userRepository.findByIdWithToken).mockResolvedValue({
        id: mockUserId,
        githubToken: 'gho_secret_token_123',
      } as any);

      vi.mocked(githubService.listUserRepositories).mockResolvedValue([
        {
          id: 101,
          name: 'repo-connected',
          full_name: 'user/repo-connected',
          owner: { login: 'user' },
          description: 'A connected repo',
          default_branch: 'main',
          private: false,
          html_url: 'https://github.com/user/repo-connected',
          language: 'Go',
          stargazers_count: 5,
          forks_count: 1,
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 102,
          name: 'repo-available',
          full_name: 'user/repo-available',
          owner: { login: 'user' },
          description: 'A remote repo',
          default_branch: 'main',
          private: false,
          html_url: 'https://github.com/user/repo-available',
          language: 'Python',
          stargazers_count: 12,
          forks_count: 3,
          updated_at: '2026-01-02T00:00:00Z',
        },
      ]);

      vi.mocked(repositoryRepository.findAllByUser).mockResolvedValue([
        { githubRepoId: 101 } as any,
      ]);

      const result = await repositoryService.listAvailableGitHub(mockUserId);
      expect(result).toHaveLength(2);
      expect(result.find((r) => r.id === 101)?.isConnected).toBe(true);
      expect(result.find((r) => r.id === 102)?.isConnected).toBe(false);
    });
  });
});

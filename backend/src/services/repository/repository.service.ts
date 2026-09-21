import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { repositoryRepository, CreateRepositoryData } from '../../repositories/repository.repository';
import { userRepository } from '../../repositories/user.repository';
import { githubService, GitHubRepo } from '../github/github.service';

export interface ConnectRepositoryInput {
  githubRepoId: number;
  name: string;
  fullName: string;
  owner: string;
  description?: string | null;
  defaultBranch?: string;
  private?: boolean;
  githubUrl: string;
  language?: string | null;
}

export const repositoryService = {
  async listConnected(userId: string) {
    return repositoryRepository.findAllByUser(userId);
  },

  async getById(id: string, userId: string) {
    const repo = await repositoryRepository.findByIdAndUser(id, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }
    return repo;
  },

  async connect(userId: string, input: ConnectRepositoryInput) {
    // Check if already connected by this user
    const existing = await repositoryRepository.findByGithubRepoIdAndUser(input.githubRepoId, userId);
    if (existing) {
      throw new AppError('Repository is already connected', 409, 'CONFLICT');
    }

    const created = await repositoryRepository.create({
      ...input,
      userId,
    });

    logger.info({ repoId: created.id, fullName: created.fullName, userId }, 'Repository connected');
    return created;
  },

  async delete(id: string, userId: string) {
    const existing = await repositoryRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    await repositoryRepository.delete(id, userId);
    logger.info({ repoId: id, userId }, 'Repository disconnected');
    return { success: true };
  },

  async listAvailableGitHub(userId: string): Promise<(GitHubRepo & { isConnected: boolean })[]> {
    const user = await userRepository.findByIdWithToken(userId);
    if (!user || !user.githubToken) {
      throw new AppError('GitHub authentication required to fetch remote repositories', 401, 'UNAUTHORIZED');
    }

    const githubRepos = await githubService.listUserRepositories(user.githubToken);
    const connectedRepos = await repositoryRepository.findAllByUser(userId);

    const connectedGithubIds = new Set(connectedRepos.map((r: { githubRepoId: number }) => r.githubRepoId));

    return githubRepos.map((repo: GitHubRepo) => ({
      ...repo,
      isConnected: connectedGithubIds.has(repo.id),
    }));
  },
};

import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface CreateRepositoryData {
  userId: string;
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

export const repositoryRepository = {
  async findAllByUser(userId: string) {
    return prisma.repository.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findByIdAndUser(id: string, userId: string) {
    return prisma.repository.findFirst({
      where: { id, userId },
    });
  },

  async findByGithubRepoIdAndUser(githubRepoId: number, userId: string) {
    return prisma.repository.findUnique({
      where: {
        userId_githubRepoId: {
          userId,
          githubRepoId,
        },
      },
    });
  },

  async create(data: CreateRepositoryData) {
    return prisma.repository.create({
      data: {
        userId: data.userId,
        githubRepoId: data.githubRepoId,
        name: data.name,
        fullName: data.fullName,
        owner: data.owner,
        description: data.description,
        defaultBranch: data.defaultBranch || 'main',
        private: data.private ?? false,
        githubUrl: data.githubUrl,
        language: data.language,
      },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.repository.deleteMany({
      where: { id, userId },
    });
  },
};

logger.debug('RepositoryRepository initialized');

import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface UpsertUserData {
  githubId: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  githubToken: string;
}

export const userRepository = {
  async upsertByGithubId(data: UpsertUserData) {
    return prisma.user.upsert({
      where: { githubId: data.githubId },
      create: {
        githubId: data.githubId,
        login: data.login,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        githubToken: data.githubToken,
      },
      update: {
        login: data.login,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        githubToken: data.githubToken,
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        githubId: true,
        login: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        // Deliberately omit githubToken — never expose to callers outside this layer
      },
    });
  },

  async findByIdWithToken(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },
};

// Prevent accidentally logging tokens
logger.debug('UserRepository initialized');

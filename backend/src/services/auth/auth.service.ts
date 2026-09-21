import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { userRepository } from '../../repositories/user.repository';
import { githubService } from '../github/github.service';

export const authService = {
  initiateOAuth() {
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'read:user,repo',
      state,
    });

    const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return { redirectUrl, state };
  },

  async handleCallback(code: string, state: string, expectedState?: string) {
    if (!state || !expectedState || state !== expectedState) {
      logger.warn({ receivedState: state, expectedState }, 'OAuth state parameter mismatch');
      throw new AppError('Invalid or expired OAuth state parameter', 400, 'BAD_REQUEST');
    }

    // 1. Exchange code for GitHub access token
    const token = await githubService.exchangeCodeForToken(code);

    // 2. Fetch authenticated GitHub profile
    const githubUser = await githubService.getAuthenticatedUser(token);

    // 3. Upsert user in database
    const user = await userRepository.upsertByGithubId({
      githubId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
      githubToken: token,
    });

    logger.info({ userId: user.id, githubLogin: user.login }, 'User authenticated successfully');

    // Return safe user object (token omitted)
    return {
      id: user.id,
      githubId: user.githubId,
      login: user.login,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  },
};

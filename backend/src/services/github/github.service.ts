import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url?: string;
  };
  description: string | null;
  default_branch: string;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export const githubService = {
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      if (!response.ok) {
        throw new AppError('Failed to exchange code with GitHub', 502, 'BAD_GATEWAY');
      }

      const data = (await response.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (data.error || !data.access_token) {
        logger.error({ error: data.error, description: data.error_description }, 'GitHub OAuth token exchange failed');
        throw new AppError(data.error_description || 'Invalid GitHub authorization code', 400, 'BAD_REQUEST');
      }

      return data.access_token;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Unexpected error during GitHub token exchange');
      throw new AppError('Failed to communicate with GitHub OAuth service', 502, 'BAD_GATEWAY');
    }
  },

  async getAuthenticatedUser(token: string): Promise<GitHubUser> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevIntel-AI',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AppError('Invalid or expired GitHub token', 401, 'UNAUTHORIZED');
        }
        throw new AppError('Failed to fetch authenticated user from GitHub', 502, 'BAD_GATEWAY');
      }

      const user = (await response.json()) as GitHubUser;
      return {
        id: user.id,
        login: user.login,
        name: user.name ?? null,
        email: user.email ?? null,
        avatar_url: user.avatar_url ?? null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Error fetching GitHub user');
      throw new AppError('Failed to retrieve GitHub profile', 502, 'BAD_GATEWAY');
    }
  },

  async listUserRepositories(token: string, page = 1, perPage = 100): Promise<GitHubRepo[]> {
    try {
      const url = `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevIntel-AI',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AppError('GitHub session expired. Please re-authenticate.', 401, 'UNAUTHORIZED');
        }
        throw new AppError('Failed to fetch repositories from GitHub', 502, 'BAD_GATEWAY');
      }

      const repos = (await response.json()) as GitHubRepo[];
      return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
        description: repo.description,
        default_branch: repo.default_branch,
        private: repo.private,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Error fetching repositories from GitHub');
      throw new AppError('Failed to list repositories from GitHub', 502, 'BAD_GATEWAY');
    }
  },

  async getRepository(token: string, owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevIntel-AI',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new AppError('Repository not found on GitHub', 404, 'NOT_FOUND');
        }
        throw new AppError('Failed to fetch repository details from GitHub', 502, 'BAD_GATEWAY');
      }

      return (await response.json()) as GitHubRepo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, owner, repo }, 'Error fetching single repository from GitHub');
      throw new AppError('Failed to fetch repository details', 502, 'BAD_GATEWAY');
    }
  },

  async fetchRepositoryTree(
    token: string,
    owner: string,
    repo: string,
    branch = 'main'
  ): Promise<GitHubTreeResponse> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'DevIntel-AI',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new AppError(`Repository branch '${branch}' or tree not found on GitHub`, 404, 'NOT_FOUND');
        }
        throw new AppError('Failed to fetch repository tree from GitHub', 502, 'BAD_GATEWAY');
      }

      return (await response.json()) as GitHubTreeResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, owner, repo, branch }, 'Error fetching Git tree from GitHub');
      throw new AppError('Failed to retrieve repository file structure', 502, 'BAD_GATEWAY');
    }
  },

  async fetchBlobContent(
    token: string,
    owner: string,
    repo: string,
    fileSha: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${fileSha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'DevIntel-AI',
          },
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to fetch file content from GitHub', 502, 'BAD_GATEWAY');
      }

      const data = (await response.json()) as {
        content: string;
        encoding: string;
        size: number;
      };

      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return data.content || '';
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, fileSha }, 'Error fetching Git blob from GitHub');
      throw new AppError('Failed to retrieve file content', 502, 'BAD_GATEWAY');
    }
  },
};

export interface User {
  id: string;
  githubId: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Repository {
  id: string;
  userId: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  defaultBranch: string;
  private: boolean;
  githubUrl: string;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepository {
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
  isConnected?: boolean;
}

export interface ConnectRepositoryPayload {
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

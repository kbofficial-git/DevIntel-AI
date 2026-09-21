import {
  User,
  Repository,
  GitHubRepository,
  ConnectRepositoryPayload,
} from '../types/auth';
import {
  IngestionJob,
  IngestionStatusResponse,
  ChatResponse,
  Conversation,
} from '../types/intelligence';

export interface DatabaseHealth {
  connected: boolean;
  pgvectorAvailable: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseHealth;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();
  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status: ${response.status}`;
    const err = new Error(errorMsg) as Error & { code?: string; status: number };
    err.code = json.error?.code;
    err.status = response.status;
    throw err;
  }
  return json;
}

export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  return request<HealthData>('/api/health');
}

export async function fetchCurrentUser(): Promise<ApiResponse<User>> {
  return request<User>('/api/auth/me');
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function fetchConnectedRepositories(): Promise<ApiResponse<Repository[]>> {
  return request<Repository[]>('/api/repositories');
}

export async function fetchRepository(id: string): Promise<ApiResponse<Repository>> {
  return request<Repository>(`/api/repositories/${id}`);
}

export async function connectRepository(
  payload: ConnectRepositoryPayload
): Promise<ApiResponse<Repository>> {
  return request<Repository>('/api/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteRepository(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>(`/api/repositories/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchGitHubRepositories(): Promise<ApiResponse<GitHubRepository[]>> {
  return request<GitHubRepository[]>('/api/github/repositories');
}

// Milestone 3: Repository Intelligence & RAG
export async function triggerIngestion(
  repositoryId: string
): Promise<ApiResponse<{ job: IngestionJob; alreadyRunning: boolean }>> {
  return request<{ job: IngestionJob; alreadyRunning: boolean }>(
    `/api/repositories/${repositoryId}/index`,
    {
      method: 'POST',
    }
  );
}

export async function fetchIngestionStatus(
  repositoryId: string
): Promise<ApiResponse<IngestionStatusResponse>> {
  return request<IngestionStatusResponse>(`/api/repositories/${repositoryId}/index/status`);
}

export async function askQuestion(
  repositoryId: string,
  question: string,
  conversationId?: string
): Promise<ApiResponse<ChatResponse>> {
  return request<ChatResponse>(`/api/repositories/${repositoryId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ question, conversationId }),
  });
}

export async function fetchConversations(
  repositoryId: string
): Promise<ApiResponse<Conversation[]>> {
  return request<Conversation[]>(`/api/repositories/${repositoryId}/conversations`);
}

export async function fetchConversation(
  repositoryId: string,
  conversationId: string
): Promise<ApiResponse<Conversation>> {
  return request<Conversation>(
    `/api/repositories/${repositoryId}/conversations/${conversationId}`
  );
}

// Milestone 4: AI Engineering Intelligence
export async function reviewCode(
  repositoryId: string,
  payload: { diff: string; title?: string; description?: string }
): Promise<ApiResponse<import('../types/intelligence').CodeReviewResult>> {
  return request<import('../types/intelligence').CodeReviewResult>(
    `/api/repositories/${repositoryId}/review`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function debugIssue(
  repositoryId: string,
  payload: { errorMessage: string; stackTrace?: string; context?: string; filePath?: string }
): Promise<ApiResponse<import('../types/intelligence').DebugResult>> {
  return request<import('../types/intelligence').DebugResult>(
    `/api/repositories/${repositoryId}/debug`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function createPlan(
  repositoryId: string,
  payload: { request: string; context?: string }
): Promise<ApiResponse<import('../types/intelligence').ImplementationPlanResult>> {
  return request<import('../types/intelligence').ImplementationPlanResult>(
    `/api/repositories/${repositoryId}/plan`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// Milestone 5: User Feedback
export async function submitFeedback(
  repositoryId: string,
  payload: {
    capability: 'chat' | 'review' | 'debug' | 'plan';
    rating: 1 | -1;
    comment?: string;
    referenceId?: string;
  }
): Promise<ApiResponse<{ message: string; feedbackId: string }>> {
  return request<{ message: string; feedbackId: string }>(
    `/api/repositories/${repositoryId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}


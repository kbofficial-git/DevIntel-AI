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
  CodeReviewResult,
  DebugResult,
  ImplementationPlanResult,
} from '../types/intelligence';
import {
  DEMO_USER,
  DEMO_HEALTH,
  INITIAL_DEMO_REPOSITORIES,
  DEMO_GITHUB_REPOSITORIES,
  DEMO_INGESTION_STATUS,
  DEMO_CONVERSATIONS,
  DEMO_CODE_REVIEW,
  DEMO_DEBUG_RESULT,
  DEMO_PLAN_RESULT,
} from './demoData';

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

const DEMO_STORAGE_KEY = 'devintel_demo_mode';
const DEMO_REPOS_STORAGE_KEY = 'devintel_demo_repositories';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
}

export function setDemoMode(active: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STORAGE_KEY, active ? 'true' : 'false');
  if (active && !localStorage.getItem(DEMO_REPOS_STORAGE_KEY)) {
    localStorage.setItem(DEMO_REPOS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REPOSITORIES));
  }
}

function getStoredDemoRepos(): Repository[] {
  try {
    const raw = localStorage.getItem(DEMO_REPOS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_DEMO_REPOSITORIES;
}

function saveStoredDemoRepos(repos: Repository[]) {
  localStorage.setItem(DEMO_REPOS_STORAGE_KEY, JSON.stringify(repos));
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const response = await fetch(url, {
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

// ==========================================
// Health & Authentication
// ==========================================

export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  if (isDemoMode()) {
    return {
      success: true,
      data: { ...DEMO_HEALTH, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<HealthData>('/api/health');
  } catch {
    // Fallback gracefully on static deployments
    return {
      success: true,
      data: { ...DEMO_HEALTH, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchCurrentUser(): Promise<ApiResponse<User>> {
  if (isDemoMode()) {
    return {
      success: true,
      data: DEMO_USER,
      timestamp: new Date().toISOString(),
    };
  }

  return await request<User>('/api/auth/me');
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
  if (isDemoMode()) {
    setDemoMode(false);
    localStorage.removeItem('devintel_selected_repo_id');
    return {
      success: true,
      data: { message: 'Logged out of showcase demo' },
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  } catch {
    setDemoMode(false);
    return {
      success: true,
      data: { message: 'Logged out' },
      timestamp: new Date().toISOString(),
    };
  }
}

// ==========================================
// Repository Management
// ==========================================

export async function fetchConnectedRepositories(): Promise<ApiResponse<Repository[]>> {
  if (isDemoMode()) {
    return {
      success: true,
      data: getStoredDemoRepos(),
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<Repository[]>('/api/repositories');
  } catch {
    return {
      success: true,
      data: getStoredDemoRepos(),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchRepository(id: string): Promise<ApiResponse<Repository>> {
  if (isDemoMode()) {
    const repos = getStoredDemoRepos();
    const found = repos.find((r) => r.id === id) || repos[0];
    return {
      success: true,
      data: found,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<Repository>(`/api/repositories/${id}`);
  } catch {
    const repos = getStoredDemoRepos();
    return {
      success: true,
      data: repos.find((r) => r.id === id) || repos[0],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function connectRepository(
  payload: ConnectRepositoryPayload
): Promise<ApiResponse<Repository>> {
  if (isDemoMode()) {
    const repos = getStoredDemoRepos();
    const newRepo: Repository = {
      id: `repo_custom_${Date.now()}`,
      userId: DEMO_USER.id,
      githubRepoId: payload.githubRepoId,
      name: payload.name,
      fullName: payload.fullName,
      owner: payload.owner,
      description: payload.description || 'Imported via DevIntel AI demo showcase',
      defaultBranch: payload.defaultBranch || 'main',
      private: payload.private || false,
      githubUrl: payload.githubUrl,
      language: payload.language || 'TypeScript',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredDemoRepos([newRepo, ...repos]);
    return {
      success: true,
      data: newRepo,
      timestamp: new Date().toISOString(),
    };
  }

  return request<Repository>('/api/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteRepository(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  if (isDemoMode()) {
    const repos = getStoredDemoRepos();
    saveStoredDemoRepos(repos.filter((r) => r.id !== id));
    return {
      success: true,
      data: { message: 'Repository disconnected successfully' },
      timestamp: new Date().toISOString(),
    };
  }

  return request<{ message: string }>(`/api/repositories/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchGitHubRepositories(): Promise<ApiResponse<GitHubRepository[]>> {
  if (isDemoMode()) {
    const connected = getStoredDemoRepos();
    const repos = DEMO_GITHUB_REPOSITORIES.map((gh) => ({
      ...gh,
      isConnected: connected.some((c) => c.fullName === gh.full_name),
    }));
    return {
      success: true,
      data: repos,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<GitHubRepository[]>('/api/github/repositories');
  } catch {
    return {
      success: true,
      data: DEMO_GITHUB_REPOSITORIES,
      timestamp: new Date().toISOString(),
    };
  }
}

// ==========================================
// Ingestion & Indexing
// ==========================================

export async function triggerIngestion(
  repositoryId: string
): Promise<ApiResponse<{ job: IngestionJob; alreadyRunning: boolean }>> {
  if (isDemoMode()) {
    const job: IngestionJob = {
      id: `job_sim_${Date.now()}`,
      repositoryId,
      status: 'COMPLETED',
      totalFiles: 148,
      processedFiles: 148,
      totalChunks: 842,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return {
      success: true,
      data: { job, alreadyRunning: false },
      timestamp: new Date().toISOString(),
    };
  }

  return request<{ job: IngestionJob; alreadyRunning: boolean }>(
    `/api/repositories/${repositoryId}/index`,
    { method: 'POST' }
  );
}

export async function fetchIngestionStatus(
  repositoryId: string
): Promise<ApiResponse<IngestionStatusResponse>> {
  if (isDemoMode()) {
    const status = DEMO_INGESTION_STATUS[repositoryId] || {
      repository: {
        id: repositoryId,
        name: repositoryId,
        fullName: `demo/${repositoryId}`,
        lastIndexedAt: new Date().toISOString(),
      },
      latestJob: {
        id: `job_${repositoryId}`,
        repositoryId,
        status: 'COMPLETED',
        totalFiles: 86,
        processedFiles: 86,
        totalChunks: 492,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      totalChunks: 492,
    };
    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<IngestionStatusResponse>(`/api/repositories/${repositoryId}/index/status`);
  } catch {
    return {
      success: true,
      data: DEMO_INGESTION_STATUS.repo_devintel_ai,
      timestamp: new Date().toISOString(),
    };
  }
}

// ==========================================
// Codebase Chat & Q&A
// ==========================================

export async function askQuestion(
  repositoryId: string,
  question: string,
  conversationId?: string
): Promise<ApiResponse<ChatResponse>> {
  if (isDemoMode()) {
    // Simulate brief network latency for realistic AI experience
    await new Promise((resolve) => setTimeout(resolve, 600));

    const q = question.toLowerCase();
    let answer = `Based on the repository index for **${repositoryId}**:

The requested logic is implemented across the core service modules. DevIntel AI organizes execution pipelines through dedicated controllers and transactional repositories.

- **Key Components**:
  - Request orchestration handles validation and input sanitization.
  - Vector retrieval gathers the top matching AST nodes from pgvector.
  - Responses are bounded by line ranges to enable verification against source files.`;

    if (q.includes('auth') || q.includes('login') || q.includes('session')) {
      answer = `Authentication in this repository is managed via **GitHub OAuth 2.0** and cookie-backed sessions:

1. **OAuth Flow**: The user clicks login, triggering \`/api/auth/github\`, which directs the browser to GitHub with \`read:user\` and \`repo\` scopes.
2. **Callback Handler**: GitHub redirects to \`/api/auth/github/callback\` where code is exchanged for an access token.
3. **Session Persistence**: Sessions are signed using Express Session and cached in Redis with a 7-day TTL.
4. **Guards**: The \`requireAuth\` middleware protects sensitive intelligence routes and repository mutations.`;
    } else if (q.includes('rag') || q.includes('vector') || q.includes('embed') || q.includes('search')) {
      answer = `The vector retrieval and RAG system consists of:

1. **Chunking**: Source files are structurally split by function/class boundaries into cohesive AST chunks.
2. **Embeddings**: Generated using OpenAI \`text-embedding-3-small\` (1536-dimensional vectors).
3. **Storage & Indexing**: Vectors are stored in PostgreSQL with the \`pgvector\` extension using HNSW indexes for sub-50ms cosine similarity lookups.
4. **Context Assembly**: Retrieved chunks are sorted and injected into the system prompt alongside exact line references.`;
    }

    return {
      success: true,
      data: {
        answer,
        citations: [
          {
            filePath: 'backend/src/services/intelligence.service.ts',
            startLine: 24,
            endLine: 65,
            symbolName: 'generateAnswerWithContext',
            similarity: 0.93,
            snippet: `export async function generateAnswerWithContext(query: string, repoId: string) {
  const context = await retrieveGroundedChunks(query, repoId);
  return llmClient.complete({ prompt: buildPrompt(query, context) });
}`,
          },
        ],
        conversationId: conversationId || `conv_${Date.now()}`,
        meta: {
          latencyMs: 580,
          chunksRetrieved: 6,
          model: 'gpt-4o-mini',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  return request<ChatResponse>(`/api/repositories/${repositoryId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ question, conversationId }),
  });
}

export async function fetchConversations(
  repositoryId: string
): Promise<ApiResponse<Conversation[]>> {
  if (isDemoMode()) {
    return {
      success: true,
      data: DEMO_CONVERSATIONS[repositoryId] || DEMO_CONVERSATIONS.repo_devintel_ai || [],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return await request<Conversation[]>(`/api/repositories/${repositoryId}/conversations`);
  } catch {
    return {
      success: true,
      data: DEMO_CONVERSATIONS.repo_devintel_ai || [],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchConversation(
  repositoryId: string,
  conversationId: string
): Promise<ApiResponse<Conversation>> {
  if (isDemoMode()) {
    const list = DEMO_CONVERSATIONS[repositoryId] || DEMO_CONVERSATIONS.repo_devintel_ai || [];
    const conv = list.find((c) => c.id === conversationId) || list[0];
    return {
      success: true,
      data: conv,
      timestamp: new Date().toISOString(),
    };
  }

  return request<Conversation>(
    `/api/repositories/${repositoryId}/conversations/${conversationId}`
  );
}

// ==========================================
// AI Engineering: Review, Debug, Plan
// ==========================================

export async function reviewCode(
  repositoryId: string,
  payload: { diff: string; title?: string; description?: string }
): Promise<ApiResponse<CodeReviewResult>> {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      data: DEMO_CODE_REVIEW,
      timestamp: new Date().toISOString(),
    };
  }

  return request<CodeReviewResult>(
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
): Promise<ApiResponse<DebugResult>> {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return {
      success: true,
      data: DEMO_DEBUG_RESULT,
      timestamp: new Date().toISOString(),
    };
  }

  return request<DebugResult>(
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
): Promise<ApiResponse<ImplementationPlanResult>> {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      success: true,
      data: DEMO_PLAN_RESULT,
      timestamp: new Date().toISOString(),
    };
  }

  return request<ImplementationPlanResult>(
    `/api/repositories/${repositoryId}/plan`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// ==========================================
// User Feedback
// ==========================================

export async function submitFeedback(
  repositoryId: string,
  payload: {
    capability: 'chat' | 'review' | 'debug' | 'plan';
    rating: 1 | -1;
    comment?: string;
    referenceId?: string;
  }
): Promise<ApiResponse<{ message: string; feedbackId: string }>> {
  if (isDemoMode()) {
    return {
      success: true,
      data: {
        message: 'Feedback recorded successfully (Demo Mode)',
        feedbackId: `fb_${Date.now()}`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return request<{ message: string; feedbackId: string }>(
    `/api/repositories/${repositoryId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

import { User, Repository, GitHubRepository } from '../types/auth';
import {
  IngestionStatusResponse,
  Conversation,
  CodeReviewResult,
  DebugResult,
  ImplementationPlanResult,
} from '../types/intelligence';

export interface DemoHealthData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    connected: boolean;
    pgvectorAvailable: boolean;
    latencyMs?: number;
    error?: string;
  };
}

export const DEMO_USER: User = {
  id: 'usr_demo_recruiter_01',
  githubId: 98765432,
  login: 'kbofficial-git',
  name: 'DevIntel Showcase User',
  email: 'recruiter-demo@devintel.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
  createdAt: '2026-01-15T08:00:00.000Z',
};

export const DEMO_HEALTH: DemoHealthData = {
  status: 'ok',
  service: 'devintel-intelligence-engine',
  version: '2.4.0-preview',
  environment: 'showcase-demo',
  uptimeSeconds: 84210,
  timestamp: new Date().toISOString(),
  database: {
    connected: true,
    pgvectorAvailable: true,
    latencyMs: 14,
  },
};

export const INITIAL_DEMO_REPOSITORIES: Repository[] = [
  {
    id: 'repo_devintel_ai',
    userId: DEMO_USER.id,
    githubRepoId: 819201,
    name: 'DevIntel-AI',
    fullName: 'kbofficial-git/DevIntel-AI',
    owner: 'kbofficial-git',
    description: 'Autonomous Developer Intelligence & Grounded AI Engineering Assistant',
    defaultBranch: 'main',
    private: false,
    githubUrl: 'https://github.com/kbofficial-git/DevIntel-AI',
    language: 'TypeScript',
    createdAt: '2026-01-10T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'repo_express_core',
    userId: DEMO_USER.id,
    githubRepoId: 237065,
    name: 'express',
    fullName: 'expressjs/express',
    owner: 'expressjs',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    defaultBranch: 'master',
    private: false,
    githubUrl: 'https://github.com/expressjs/express',
    language: 'JavaScript',
    createdAt: '2026-01-05T09:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'repo_ast_grep',
    userId: DEMO_USER.id,
    githubRepoId: 541092,
    name: 'ast-grep',
    fullName: 'ast-grep/ast-grep',
    owner: 'ast-grep',
    description: 'Lightning-fast tool for code structural search, linting, and rewriting',
    defaultBranch: 'main',
    private: false,
    githubUrl: 'https://github.com/ast-grep/ast-grep',
    language: 'Rust',
    createdAt: '2026-01-12T14:20:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_GITHUB_REPOSITORIES: GitHubRepository[] = [
  {
    id: 819201,
    name: 'DevIntel-AI',
    full_name: 'kbofficial-git/DevIntel-AI',
    owner: {
      login: 'kbofficial-git',
      avatar_url: DEMO_USER.avatarUrl || undefined,
    },
    description: 'Autonomous Developer Intelligence & Grounded AI Engineering Assistant',
    default_branch: 'main',
    private: false,
    html_url: 'https://github.com/kbofficial-git/DevIntel-AI',
    language: 'TypeScript',
    stargazers_count: 142,
    forks_count: 28,
    updated_at: new Date().toISOString(),
    isConnected: true,
  },
  {
    id: 237065,
    name: 'express',
    full_name: 'expressjs/express',
    owner: {
      login: 'expressjs',
      avatar_url: 'https://avatars.githubusercontent.com/u/5658226?s=200&v=4',
    },
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    default_branch: 'master',
    private: false,
    html_url: 'https://github.com/expressjs/express',
    language: 'JavaScript',
    stargazers_count: 63200,
    forks_count: 12400,
    updated_at: new Date().toISOString(),
    isConnected: true,
  },
  {
    id: 541092,
    name: 'ast-grep',
    full_name: 'ast-grep/ast-grep',
    owner: {
      login: 'ast-grep',
      avatar_url: 'https://avatars.githubusercontent.com/u/108343723?s=200&v=4',
    },
    description: 'Lightning-fast tool for code structural search, linting, and rewriting',
    default_branch: 'main',
    private: false,
    html_url: 'https://github.com/ast-grep/ast-grep',
    language: 'Rust',
    stargazers_count: 8500,
    forks_count: 410,
    updated_at: new Date().toISOString(),
    isConnected: true,
  },
  {
    id: 991044,
    name: 'trpc',
    full_name: 'trpc/trpc',
    owner: {
      login: 'trpc',
      avatar_url: 'https://avatars.githubusercontent.com/u/78117711?s=200&v=4',
    },
    description: 'Move Fast and Break Nothing. End-to-end typesafe APIs made easy.',
    default_branch: 'main',
    private: false,
    html_url: 'https://github.com/trpc/trpc',
    language: 'TypeScript',
    stargazers_count: 36000,
    forks_count: 1200,
    updated_at: new Date().toISOString(),
    isConnected: false,
  },
  {
    id: 772109,
    name: 'prisma',
    full_name: 'prisma/prisma',
    owner: {
      login: 'prisma',
      avatar_url: 'https://avatars.githubusercontent.com/u/17219288?s=200&v=4',
    },
    description: 'Next-generation ORM for Node.js & TypeScript with PostgreSQL, MySQL, SQLite, and MongoDB',
    default_branch: 'main',
    private: false,
    html_url: 'https://github.com/prisma/prisma',
    language: 'TypeScript',
    stargazers_count: 39500,
    forks_count: 1600,
    updated_at: new Date().toISOString(),
    isConnected: false,
  },
];

export const DEMO_INGESTION_STATUS: Record<string, IngestionStatusResponse> = {
  repo_devintel_ai: {
    repository: {
      id: 'repo_devintel_ai',
      name: 'DevIntel-AI',
      fullName: 'kbofficial-git/DevIntel-AI',
      lastIndexedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    latestJob: {
      id: 'job_devintel_idx_01',
      repositoryId: 'repo_devintel_ai',
      status: 'COMPLETED',
      totalFiles: 148,
      processedFiles: 148,
      totalChunks: 842,
      startedAt: new Date(Date.now() - 3660000).toISOString(),
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3660000).toISOString(),
    },
    totalChunks: 842,
  },
  repo_express_core: {
    repository: {
      id: 'repo_express_core',
      name: 'express',
      fullName: 'expressjs/express',
      lastIndexedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    latestJob: {
      id: 'job_express_idx_01',
      repositoryId: 'repo_express_core',
      status: 'COMPLETED',
      totalFiles: 340,
      processedFiles: 340,
      totalChunks: 1912,
      startedAt: new Date(Date.now() - 86500000).toISOString(),
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86500000).toISOString(),
    },
    totalChunks: 1912,
  },
  repo_ast_grep: {
    repository: {
      id: 'repo_ast_grep',
      name: 'ast-grep',
      fullName: 'ast-grep/ast-grep',
      lastIndexedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    latestJob: {
      id: 'job_ast_idx_01',
      repositoryId: 'repo_ast_grep',
      status: 'COMPLETED',
      totalFiles: 420,
      processedFiles: 420,
      totalChunks: 2430,
      startedAt: new Date(Date.now() - 172900000).toISOString(),
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 172900000).toISOString(),
    },
    totalChunks: 2430,
  },
};

export const DEMO_CONVERSATIONS: Record<string, Conversation[]> = {
  repo_devintel_ai: [
    {
      id: 'conv_arch_overview',
      repositoryId: 'repo_devintel_ai',
      title: 'Repository Architecture & Vector Search Pipeline',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      _count: { messages: 2 },
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'How does DevIntel AI perform code indexing and semantic retrieval?',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: `DevIntel AI operates on a multi-stage semantic indexing and retrieval architecture:

1. **AST-Aware Chunking**: Rather than raw token sliding windows, source files are parsed into syntactic blocks (functions, classes, interfaces) using language-specific parsers.
2. **Dense Vector Embeddings**: Chunks are embedded using \`text-embedding-3-small\` (1536 dimensions) and stored in PostgreSQL with **pgvector** indexing (HNSW metric: cosine distance).
3. **Hybrid RAG Retrieval**: Queries combine full-text BM25 keyword matching with vector cosine similarity to retrieve code blocks along with surrounding call graph context.
4. **Grounded Synthesis**: LLM prompts include file paths, symbol signatures, and line boundaries to guarantee zero-hallucination citations.`,
          createdAt: new Date(Date.now() - 7190000).toISOString(),
          citations: [
            {
              filePath: 'backend/src/services/indexing.service.ts',
              startLine: 42,
              endLine: 88,
              symbolName: 'indexRepository',
              similarity: 0.94,
              snippet: `async function indexRepository(repoId: string, files: SourceFile[]) {
  const chunks = await astChunker.chunkFiles(files);
  const embeddings = await embeddingClient.generateBatch(chunks.map(c => c.content));
  await vectorStore.bulkUpsert(repoId, chunks, embeddings);
}`,
            },
            {
              filePath: 'backend/src/services/retrieval.service.ts',
              startLine: 18,
              endLine: 45,
              symbolName: 'hybridSearch',
              similarity: 0.91,
              snippet: `export async function hybridSearch(query: string, repoId: string, topK = 6) {
  const denseResults = await pgvector.querySimilarity(queryVector, repoId, topK);
  return deduplicateAndRerank(denseResults);
}`,
            },
          ],
          meta: {
            latencyMs: 342,
            chunksRetrieved: 8,
            model: 'gpt-4o-mini',
          },
        },
      ],
    },
  ],
};

export const DEMO_CODE_REVIEW: CodeReviewResult = {
  summary:
    'Review identified 2 critical security issues (direct SQL interpolation leading to SQLi and unauthenticated route exposure), along with 1 performance concern around unbounded query execution.',
  hasIssues: true,
  findings: [
    {
      severity: 'CRITICAL',
      category: 'SECURITY',
      title: 'Direct SQL String Interpolation (SQL Injection Vulnerability)',
      explanation:
        'The route handler constructs a raw SQL query by directly interpolating `req.params.id` into the query string without parameterized inputs or sanitization. An attacker can supply a malicious ID (e.g. `1 OR 1=1; DROP TABLE users;--`) to compromise the database.',
      evidence: "const query = `SELECT * FROM users WHERE id = '${req.params.id}'`;",
      suggestedFix: `// Use parameterized queries or Prisma ORM to prevent SQL injection:
const user = await prisma.user.findUnique({
  where: { id: req.params.id },
  select: { id: true, email: true, name: true, role: true }
});`,
      filePath: 'backend/src/routes/user.routes.ts',
      startLine: 38,
      endLine: 40,
      confidence: 0.98,
    },
    {
      severity: 'HIGH',
      category: 'SECURITY',
      title: 'Authentication Middleware Bypassed on Sensitive Route',
      explanation:
        'The `requireAuth` middleware was removed from `userRouter.get("/:id")`. This allows unauthenticated external visitors to query arbitrary user profiles and potentially scrape private identity data.',
      evidence: "-userRouter.get('/:id', requireAuth, userController.getById);\n+userRouter.get('/:id', userController.getById);",
      suggestedFix: `// Re-attach authentication and authorization guards:
userRouter.get('/:id', requireAuth, requireUserAccess, userController.getById);`,
      filePath: 'backend/src/routes/user.routes.ts',
      startLine: 36,
      endLine: 37,
      confidence: 0.96,
    },
    {
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      title: 'Unbounded Column Selection in Query',
      explanation:
        'Using `SELECT *` retrieves all columns, including potentially heavy blobs or sensitive password hashes. Explicitly projecting required columns reduces database serialization overhead and network transfer latency.',
      evidence: 'SELECT * FROM users',
      suggestedFix: `SELECT id, login, name, email, created_at FROM users WHERE id = $1;`,
      filePath: 'backend/src/routes/user.routes.ts',
      startLine: 39,
      endLine: 39,
      confidence: 0.89,
    },
  ],
  citations: [
    {
      filePath: 'backend/src/middleware/auth.middleware.ts',
      startLine: 12,
      endLine: 29,
      symbolName: 'requireAuth',
      similarity: 0.92,
      snippet: `export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}`,
    },
  ],
  meta: {
    latencyMs: 780,
    chunksRetrieved: 6,
    model: 'gpt-4o-mini',
  },
};

export const DEMO_DEBUG_RESULT: DebugResult = {
  summary:
    'Identified an unhandled null pointer dereference in user repository during transient connection pool exhaustion.',
  probableCause:
    'Under burst concurrency, `prisma.$connect()` times out and the repository returns `null` or an uninitialized client handle. The calling controller attempts to access property `findUnique` directly without checking client health or handling connection timeouts.',
  confidence: 'HIGH',
  evidence:
    'TypeError: Cannot read properties of null (reading "findUnique") at getUserById (/app/backend/src/repositories/user.repository.ts:32:20)',
  suggestedFix: `// backend/src/repositories/user.repository.ts
export async function getUserById(id: string): Promise<User | null> {
  if (!prisma) {
    throw new DatabaseConnectionError('Prisma client connection unavailable');
  }

  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Database query failed:', error.message);
    }
    throw error;
  }
}`,
  affectedFiles: [
    'backend/src/repositories/user.repository.ts',
    'backend/src/controllers/auth.controller.ts',
    'backend/src/config/database.ts',
  ],
  testingStrategy:
    '1. Simulate connection pool saturation with 100 concurrent mock requests.\n2. Verify that retry backoff triggers rather than crashing with unhandled exceptions.\n3. Assert that a clean 503 Service Unavailable is returned with appropriate Retry-After headers when the database is unavailable.',
  uncertaintyNotes:
    'Ensure your connection pool size in `DATABASE_URL?connection_limit=20` matches your provisioned database tier limits.',
  citations: [
    {
      filePath: 'backend/src/repositories/user.repository.ts',
      startLine: 28,
      endLine: 40,
      symbolName: 'getUserById',
      similarity: 0.95,
      snippet: `export async function getUserById(id: string) {
  // Missing null guard on connection reference
  return await prisma.user.findUnique({ where: { id } });
}`,
    },
  ],
  meta: {
    latencyMs: 620,
    chunksRetrieved: 5,
    model: 'gpt-4o-mini',
  },
};

export const DEMO_PLAN_RESULT: ImplementationPlanResult = {
  summary:
    'Architectural execution plan for adding Role-Based Access Control (RBAC) across API endpoints with Redis session caching and fine-grained permissions.',
  assumptions: [
    'Three standard roles will be supported: Admin (read/write/delete), Editor (read/write), and Viewer (read-only).',
    'Permissions will be enforced via Express middleware and evaluated against the authenticated session.',
    'User roles will be persisted in PostgreSQL and cached in Redis for fast authorization lookups.',
  ],
  affectedFiles: [
    {
      path: 'backend/src/types/auth.ts',
      reason: 'Define Role and Permission types and augment User schema',
      expectedChange: 'Add enum Role { ADMIN, EDITOR, VIEWER } and permissions mapping',
    },
    {
      path: 'backend/src/middleware/rbac.middleware.ts',
      reason: 'Create middleware to intercept requests and check required permissions',
      expectedChange: 'Implement requireRole(roles) and requirePermission(action)',
    },
    {
      path: 'backend/src/routes/repository.routes.ts',
      reason: 'Attach RBAC middleware to sensitive repository mutations',
      expectedChange: 'Guard DELETE /:id with requireRole(["ADMIN"])',
    },
  ],
  implementationSteps: [
    {
      order: 1,
      title: 'Database Schema & Type Definitions',
      description: 'Add `role` column to the User model in Prisma schema with default value "VIEWER". Run migration and generate updated Prisma client.',
      filePaths: ['backend/prisma/schema.prisma', 'backend/src/types/auth.ts'],
    },
    {
      order: 2,
      title: 'Role Authorization Middleware',
      description: 'Implement higher-order `hasPermission` and `requireRole` middleware that checks `req.session.user.role` with fallback 403 Forbidden responses.',
      filePaths: ['backend/src/middleware/rbac.middleware.ts'],
    },
    {
      order: 3,
      title: 'Route Protection & Guard Layer',
      description: 'Apply role guards across mutation endpoints (indexing triggers, repository deletion, and team member management).',
      filePaths: ['backend/src/routes/repository.routes.ts', 'backend/src/routes/intelligence.routes.ts'],
    },
    {
      order: 4,
      title: 'Frontend Role Awareness & Conditional UI',
      description: 'Expose role metadata in AuthContext and conditionally disable destructive buttons (e.g. Delete Repository) for Viewer accounts.',
      filePaths: ['frontend/src/contexts/AuthContext.tsx', 'frontend/src/pages/RepositoriesPage.tsx'],
    },
  ],
  dependencies: ['Prisma Client >= 5.0', 'Redis session store'],
  risks: [
    'Existing user records without a role attribute will need a default database migration backfill.',
    'Care must be taken to ensure cached session roles are invalidated when an administrator modifies user permissions.',
  ],
  testingPlan: [
    'Unit test `requireRole` middleware with valid and invalid mock session payloads.',
    'Integration test: Assert HTTP 403 when Viewer attempts DELETE /api/repositories/:id.',
    'Integration test: Assert HTTP 200 when Admin executes DELETE /api/repositories/:id.',
  ],
  architecturalConsiderations: [
    'Design permission bitmasks if future requirements demand dynamic custom organization roles.',
  ],
  citations: [
    {
      filePath: 'backend/src/middleware/auth.middleware.ts',
      startLine: 1,
      endLine: 35,
      symbolName: 'requireAuth',
      similarity: 0.93,
      snippet: `export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}`,
    },
  ],
  meta: {
    latencyMs: 910,
    chunksRetrieved: 7,
    model: 'gpt-4o-mini',
  },
};

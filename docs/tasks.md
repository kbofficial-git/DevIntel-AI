# Task Breakdown
# AI Developer Intelligence Platform

## Phase 0 — Planning

### T0.1 Finalize MVP scope
- [x] Confirm core features.
- [x] Confirm non-goals.
- [x] Confirm technology versions.
- [x] Confirm AI provider and embedding provider.
- [x] Confirm PostgreSQL + pgvector approach.

### T0.2 Repository setup
- [x] Create Git repository.
- [x] Add README.
- [x] Add `.gitignore`.
- [x] Add environment example.
- [x] Add issue/task tracking.
- [x] Define commit convention.

---

# Phase 1 — Foundation

### T1.1 Frontend
- [x] Create React + TypeScript + Vite application.
- [x] Configure Tailwind.
- [x] Configure routing.
- [x] Configure base layout and shell.
- [x] Create navigation and connectivity display.

### T1.2 Backend
- [x] Create Node + TypeScript + Express application.
- [x] Configure environment variables (Zod validated).
- [x] Add request logging (Pino with request ID tagging).
- [x] Add centralized error handling.
- [x] Add validation.
- [x] Add health endpoint (GET /api/health).
- [x] Add API version prefix (/api).

### T1.3 Database
- [x] Set up PostgreSQL configuration.
- [x] Enable pgvector schema extension.
- [x] Configure ORM (Prisma Client).
- [x] Create initial database connection & client setup.
- [x] Add database health check and pgvector verification.

### T1.4 Local infrastructure
- [x] Create Docker Compose (PostgreSQL with pgvector).
- [x] Persistent volume configuration for PostgreSQL.
- [ ] Add Redis (Deferred to Phase 4 / Phase 10 as specified).
- [x] Verify local startup and test execution.

---

# Phase 2 — Authentication

### T2.1 GitHub OAuth
- [x] Create GitHub OAuth application configuration.
- [x] Implement OAuth initiation (GET /api/auth/github with state verification).
- [x] Implement callback (GET /api/auth/github/callback with state validation & token exchange).
- [x] Store GitHub account association (User model via Prisma).
- [x] Implement secure application session (express-session with connect-pg-simple).
- [x] Implement logout (POST /api/auth/logout with session destruction & cookie clear).
- [x] Implement current-user endpoint (GET /api/auth/me).

### T2.2 Authorization
- [x] Add authentication middleware (requireAuth).
- [x] Add repository ownership checks (strict userId scoping in all queries).
- [x] Add authorization tests (unit & integration tests).
- [x] Verify cross-user data cannot be accessed (404 isolation test).

---

# Phase 3 — Repository Management

### T3.1 Repository API
- [x] Fetch accessible GitHub repositories (GET /api/github/repositories).
- [x] Create local repository record (POST /api/repositories with Zod validation).
- [x] List connected repositories (GET /api/repositories).
- [x] Retrieve repository details (GET /api/repositories/:id).
- [x] Remove repository (DELETE /api/repositories/:id).
- [x] Handle repository access changes and conflict checking (409 on duplicate connect).

### T3.2 Repository UI
- [x] Repository listing page (two-panel connected vs available layout).
- [x] Repository card (metadata, language tag, stars, forks, visibility badges).
- [x] Repository connection flow (instant connect/disconnect with status updates).
- [x] Repository selection flow (header integration with active user context).
- [x] Empty/error states (search filter, loading skeletons, error alerts).

---

# Phase 4 — Repository Ingestion

### T4.1 Job system
- [x] Configure BullMQ with Redis connection.
- [x] Create ingestion queue and worker.
- [x] Add job status tracking (QUEUED, IN_PROGRESS, COMPLETED, FAILED).
- [x] Add retries with exponential backoff.
- [x] Add failure handling and error logging.

### T4.2 GitHub ingestion
- [x] Fetch repository tree recursively via GitHub API.
- [x] Filter files by extension, size, directory, and lockfile rules.
- [x] Fetch file contents concurrently via blob API.
- [x] Detect language from file extension.
- [x] Store file and repository metadata.
- [x] Handle large files (<500 KB limit).
- [x] Handle API rate limits with controlled concurrency.

### T4.3 Code chunking
- [x] Implement deterministic code-aware chunking.
- [x] Preserve path.
- [x] Preserve line ranges (1-indexed startLine and endLine).
- [x] Preserve language.
- [x] Preserve commit SHA.
- [x] Generate SHA-256 content hash.
- [x] Avoid duplicate chunks where possible.

### T4.4 Embeddings
- [x] Select embedding model (text-embedding-3-small, 1536 dims).
- [x] Implement AI provider abstraction (OpenAIProvider + MockAIProvider).
- [x] Store vector embeddings in PostgreSQL with pgvector.
- [x] Add vector indexes (HNSW index).
- [x] Test retrieval quality and vector similarity.

### T4.5 Indexing UI
- [x] Index / Re-index button on repository cards.
- [x] Progress/status UI (QUEUED, IN_PROGRESS, COMPLETED, FAILED).
- [x] Error display.
- [x] Last indexed information and total chunk counts.

---

# Phase 5 — RAG

### T5.1 Retrieval
- [x] Implement query embedding generation.
- [x] Implement pgvector similarity search (<=> cosine distance).
- [x] Add repository filtering (strict multi-tenant isolation).
- [x] Add metadata filtering.
- [x] Configure top-K (K=6) with similarity threshold floor.
- [x] Handle no results with honest grounded fallback.

### T5.2 Context construction
- [x] Build bounded XML context formatter (<context><chunk>...</chunk></context>).
- [x] Include file path.
- [x] Include line ranges.
- [x] Bound context size.
- [x] Prevent irrelevant context where possible.

### T5.3 LLM integration
- [x] Implement AI provider abstraction (CompletionProvider interface).
- [x] Add grounded codebase Q&A system prompt.
- [x] Add structured response handling and citation generation.
- [x] Add timeout/error handling.
- [x] Add provider configuration via environment.

### T5.4 Source citations
- [x] Return source metadata with similarity scores.
- [x] Render source references as interactive citation badges.
- [x] Allow source navigation and code drawer inspection.

---

# Phase 6 — AI Chat

### T6.1 Backend
- [x] Create conversation model in Prisma.
- [x] Create message model in Prisma.
- [x] Create chat endpoint (POST /api/repositories/:id/chat).
- [x] Store messages and citation JSON.
- [x] Connect chat to RAG pipeline.
- [x] Add request IDs and error handling.

### T6.2 Frontend
- [x] Chat interface (/chat) with repository selector.
- [x] Markdown rendering for code snippets.
- [x] Code blocks and citation badges.
- [x] Citation code inspector drawer.
- [x] Loading state with pulsing indicator.
- [x] Error state handling.
- [x] Conversation history list.

---

# Phase 7 — AI Code Review

### T7.1 Review backend
- [x] Accept code diff (POST /api/repositories/:id/review with Zod validation).
- [x] Parse changed files (diff file extractor).
- [x] Retrieve repository context (targeted file chunks + semantic vector search).
- [x] Construct review prompt (prompt injection defenses included).
- [x] Request structured AI output (Zod schema enforced with JSON mode).
- [x] Validate output (severity, category, title, explanation, evidence, fix, lines, confidence).
- [x] Handle clean diffs explicitly ("no significant issues found").

### T7.2 Review UI
- [x] Diff input (interactive code editor with sample diffs).
- [x] Review trigger and loading states.
- [x] Findings list grouped/filtered by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO).
- [x] Category badges (BUG, SECURITY, PERFORMANCE, CORRECTNESS, MAINTAINABILITY, TESTING).
- [x] File/line references and confidence gauges.
- [x] Suggested fix code blocks and explanation cards.
- [x] Interactive citation inspector drawer.

### T7.3 Testing
- [x] Test obvious bug / security issue.
- [x] Test clean diff ("no significant issues found").
- [x] Test malformed / invalid input.
- [x] Test repository authorization and ownership.
- [x] Test AI provider structured completion and mock provider.

---

# Phase 8 — AI Debugging

### T8.1 Backend
- [x] Error and stack-trace input (POST /api/repositories/:id/debug with Zod validation).
- [x] Stack trace file and symbol parser.
- [x] Context retrieval (targeted file chunks + error query vector search).
- [x] Debugging prompt with prompt injection defenses.
- [x] Structured response (probable cause, confidence, evidence, fix, testing strategy).
- [x] Uncertainty handling (low confidence when evidence is ambiguous).

### T8.2 Frontend
- [x] Debug input screen (error message, stack trace, file path, extra context, sample loader).
- [x] Result display with confidence badge (HIGH, MEDIUM, LOW).
- [x] Probable root cause card.
- [x] Evidence/source section distinguishing facts from AI inference.
- [x] Suggested code fix and reproduction/testing strategy.
- [x] Interactive citation drawer.

---

# Phase 9 — Implementation Planning

### T9.1 Backend
- [x] Planning prompt with prompt injection defenses and read-only guarantee.
- [x] Retrieve architecture-relevant code (semantic vector search over schemas/routes/controllers).
- [x] Generate structured plan (summary, assumptions, affected files, steps, dependencies, risks, tests, architecture).
- [x] Validate output with Zod schema.
- [x] Read-only verification: no repo modifications.

### T9.2 Frontend
- [x] Feature request input with sample prompt loaders.
- [x] Plan display with executive summary and assumptions.
- [x] Affected files table (path, reason, expected change).
- [x] Sequenced step-by-step implementation checklist.
- [x] Dependencies and risks/mitigations panels.
- [x] Testing plan and architectural considerations.
- [x] Interactive citation drawer.

---

# Phase 10 — Redis and Performance

### T10.1 Cache
- [ ] Identify safe cache candidates.
- [ ] Implement repository metadata caching.
- [ ] Add TTL.
- [ ] Add invalidation.

### T10.2 Rate limiting
- [ ] Rate-limit AI endpoints.
- [ ] Rate-limit expensive operations.
- [ ] Return useful errors.

### T10.3 Performance
- [x] Measure ingestion time.
- [x] Measure retrieval latency.
- [x] Measure AI latency.
- [x] Avoid unnecessary database queries.

---

# Phase 11 — Evaluation and Observability

### T11.1 AI request tracking
- [x] Store request ID.
- [x] Store latency (`latencyMs` in `AIMetadata`).
- [x] Store model (`model` in `AIMetadata`).
- [x] Store retrieval count (`chunksRetrieved` in `AIMetadata`).
- [x] Return lightweight metadata consistently across Chat, Review, Debug, Plan.

### T11.2 Feedback
- [x] Add thumbs up/down feedback widget in UI.
- [x] Store feedback via Prisma `Feedback` model.
- [x] Associate feedback with user, repository, capability, and referenceId.
- [x] API endpoint `POST /api/repositories/:id/feedback`.

---

# Phase 12 — Security Hardening

- [x] Audit authorization (user ownership on all repository & feedback endpoints).
- [x] Audit secrets (GitHub access tokens never returned to client or logged).
- [x] Validate repository inputs with Zod schemas.
- [x] Limit payload sizes (2MB JSON/urlencoded body limits).
- [x] Prevent arbitrary code execution (diffs/code treated strictly as data).
- [x] Add security headers (Helmet, CSP, X-Frame-Options: DENY, Referrer-Policy, nosniff).
- [x] Add production CORS configuration (restricted to FRONTEND_URL, credentials enabled).
- [x] Rate limits (express-rate-limit: global 120/min, AI endpoints 20/min).
- [x] Secure production cookies (httpOnly, sameSite=lax, secure in production).

---

# Phase 13 — Testing

### Backend
- [x] Unit tests for services (68 tests across 10 test suites in Vitest).
- [x] Repository authorization tests.
- [x] Ingestion tests with BullMQ worker retry & backoff.
- [x] RAG retrieval tests with vector search & mock provider.
- [x] AI intelligence tests for Review, Debug, Plan.
- [x] Security headers and rate limiting tests.
- [x] Component-level health check tests.

### Frontend
- [x] Frontend TypeScript typecheck passing (0 errors).
- [x] Frontend production bundle build passing (0 errors).

---

# Phase 14 — Production Containerization & CI/CD

### Containerization
- [x] Multi-stage `backend/Dockerfile` (Node 20 Alpine, Prisma generate, tsc build, non-root user).
- [x] Multi-stage `frontend/Dockerfile` (Node 20 Alpine builder, Nginx Alpine runner).
- [x] Production `frontend/nginx.conf` (SPA routing fallback, `/api/` proxy pass).
- [x] Production Compose `docker-compose.prod.yml` (PostgreSQL pgvector, Redis, Backend, Frontend).

### CI/CD
- [x] GitHub Actions workflow `.github/workflows/ci.yml`.
- [x] Node.js 20 environment with PostgreSQL and Redis service containers.
- [x] Backend typecheck and tests.
- [x] Frontend typecheck and production build.

---

# Phase 15 — Interview Readiness

Be able to explain:

### Architecture
- [ ] Complete architecture.
- [ ] Why modular monolith?
- [ ] Why React instead of Next.js?
- [ ] Why PostgreSQL?
- [ ] Why pgvector?
- [ ] Why Redis?
- [ ] Why background jobs?

### RAG
- [ ] Why RAG?
- [ ] Embeddings.
- [ ] Chunking.
- [ ] Vector similarity.
- [ ] Metadata filtering.
- [ ] Retrieval failures.
- [ ] Hallucination mitigation.

### Backend
- [ ] Authentication.
- [ ] Authorization.
- [ ] API design.
- [ ] Error handling.
- [ ] Rate limiting.
- [ ] Caching.

### AI
- [ ] Prompt design.
- [ ] Structured output.
- [ ] Tool calling if implemented.
- [ ] Evaluation.
- [ ] Cost/latency trade-offs.

### Scaling
- [ ] What happens with 10x repositories?
- [ ] What happens with 1,000 simultaneous indexing jobs?
- [ ] How would you scale workers?
- [ ] What would you cache?
- [ ] Where are bottlenecks?

---

# Suggested MVP order

Do not attempt every task immediately.

Build in this order:

```text
1. Foundation
2. Auth
3. Repository connection
4. Ingestion
5. Embeddings + pgvector
6. RAG retrieval
7. AI chat
8. Code review
9. Debugging
10. Planning
11. Redis
12. Evaluation
13. Security hardening
14. Deployment
```

The project is already impressive after step 8 if the implementation is solid.

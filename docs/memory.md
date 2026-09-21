# Project Memory
# AI Developer Intelligence Platform

This file is the persistent project context for AI coding agents.

## 1. Project Identity

**Name:** AI Developer Intelligence Platform

**Working name:** DevIntel AI

**Purpose:** A developer-focused AI platform that connects to GitHub repositories, indexes source code, and provides grounded AI assistance for codebase understanding, code review, debugging, and implementation planning.

## 2. Current Product Direction

The project is intentionally NOT:
- A generic chatbot.
- A simple "chat with PDF" app.
- A portfolio landing page.
- An autonomous coding agent.

It is a full-stack engineering product demonstrating:
- React
- TypeScript
- Node.js
- Express
- PostgreSQL
- pgvector
- Redis
- background jobs
- GitHub API/OAuth
- RAG
- LLM integration
- AI evaluation
- Docker
- AWS deployment

## 3. Current Architectural Decision

Use a **modular monolith**.

Do not split into microservices during MVP.

### Frontend
React + TypeScript + Vite + Tailwind.

### Backend
Node.js + TypeScript + Express.

### Database
PostgreSQL + pgvector.

### Middleware / supporting infrastructure
Redis + BullMQ.

### AI
Provider-agnostic AI service abstraction.
Use an LLM API and embedding API selected during implementation.

### Deployment
Docker + GitHub Actions + AWS.

## 4. Explicit Constraint

**Do NOT use Next.js.**

React.js is sufficient for the project and is an intentional decision.

Do not introduce Next.js unless the project owner explicitly changes this decision.

## 5. UI Strategy

Lovable may be used to accelerate frontend UI design.

Lovable should generate:
- Screens
- Components
- Layouts
- Mock data

Lovable should NOT become the backend architecture.

Final application logic must be integrated into the main React/TypeScript codebase.

## 6. Development Strategy

The project owner is using AI-assisted/vibe coding because of limited time.

The development strategy is:

```text
Design
 -> Ask AI to implement a small feature
 -> Run it
 -> Inspect it
 -> Understand it
 -> Test it
 -> Debug it
 -> Move to next feature
```

Never build the whole application blindly.

## 7. Learning Objective

The project is also a practical learning vehicle.

The project owner should understand:
- end-to-end data flow
- API architecture
- database design
- authentication
- GitHub integration
- repository ingestion
- code chunking
- embeddings
- vector search
- RAG
- LLM integration
- Redis
- background jobs
- security
- deployment
- AI evaluation

The project owner does NOT need to memorise every line of generated code.

They DO need to understand every major component and design decision.

## 8. MVP Definition

MVP must support:

1. Authentication.
2. GitHub connection.
3. Repository selection.
4. Repository indexing.
5. Code embeddings.
6. Vector retrieval.
7. Grounded codebase Q&A.
8. Source references.
9. AI code review.
10. AI debugging.
11. Basic implementation planning.
12. Dashboard.
13. Secure deployment.

## 9. Deferred Features

Do not implement unless MVP is stable:

- Autonomous code modification.
- Automatic PR creation.
- Multi-agent architecture.
- Kubernetes.
- Microservices.
- Enterprise SSO.
- Billing.
- Fine-tuning.
- Custom ML training.
- Mobile app.

## 10. Important Data Flow

### Repository indexing

```text
GitHub
 -> Repository tree
 -> File filtering
 -> File content
 -> Parsing/normalization
 -> Code-aware chunks
 -> Embeddings
 -> PostgreSQL/pgvector
```

### User question

```text
Question
 -> Query embedding
 -> pgvector retrieval
 -> Metadata filtering
 -> Context construction
 -> LLM
 -> Answer + sources
```

### Code review

```text
Diff
 -> Changed files
 -> Repository context retrieval
 -> LLM
 -> Structured findings
 -> Validation
 -> Review UI
```

## 11. Database Entities

Initial entities:

```text
users
github_accounts
repositories
repository_memberships
ingestion_jobs
code_chunks
conversations
messages
ai_requests
code_reviews
review_findings
debug_sessions
feedback
```

## 12. Important Security Decisions

- GitHub tokens stay server-side.
- API keys stay server-side.
- Never execute repository code.
- Repository authorization is server-side.
- Validate external input.
- Rate-limit expensive AI operations.
- Do not log secrets.
- Protect against prompt injection.
- Limit repository/file sizes.

## 13. AI/RAG Decisions

Use repository metadata with every code chunk where possible:

```text
repositoryId
filePath
language
startLine
endLine
symbolName
commitSha
contentHash
```

Answers about repository code should include source references.

The system should clearly distinguish:
- Retrieved evidence.
- Model inference.
- Uncertainty.

## 14. Current Status
 
 Status should be updated by the AI agent after meaningful milestones.
 
### Current Project State (Milestone 3 Savepoint)

```text
Phase: Milestone 3 (Phases 4, 5 & 6) — Repository Intelligence & Grounded Codebase Q&A
Feature: Ingestion Pipeline, File Filtering, Code Chunking, Vector Embeddings, pgvector Search, RAG & Citations
State: COMPLETE
Last completed:
- Added Redis service to docker-compose.yml for BullMQ background job queues
- Updated backend/src/config/env.ts with Redis, AI provider, embedding, and ingestion limits
- Updated Prisma schema with IngestionJob, CodeChunk (with pgvector embedding), Conversation, and Message models
- Implemented fileFilter.service.ts with directory, lockfile, binary, secret, and size exclusions
- Implemented codeChunker.service.ts for deterministic code chunking preserving line numbers and symbols
- Implemented AIProvider abstraction (OpenAIProvider + MockAIProvider)
- Implemented queue.service.ts with BullMQ queue, worker, and clear Redis connection error handling
- Implemented ingestion.service.ts managing tree fetching, concurrent blob ingestion, batch embeddings, and pgvector persistence
- Implemented rag.service.ts with vector similarity retrieval (<=> cosine distance), grounding prompt, and citation extraction
- Implemented chat and ingestion REST endpoints (POST /index, GET /index/status, POST /chat, GET /conversations)
- Implemented frontend ChatPage (/chat) with repository selector, message history, markdown code blocks, and clickable citation drawer
- Enhanced RepositoriesPage with live indexing status and trigger buttons
- Implemented 46/46 unit and integration tests across 8 test suites passing in Vitest
- Verified clean backend tsc --noEmit and frontend production build

Currently working on:
- Milestone 3 completion and sign-off

Next:
- Milestone 4 / Phase 7 — AI Code Review (Diff parsing, context retrieval, severity findings)

Known issues:
- None

Important decisions:
- Redis + BullMQ used for background jobs without in-process fallback; fails fast with actionable advice
- text-embedding-3-small (1536 dimensions) configured via AIProvider abstraction
- pgvector cosine distance query performed via typed raw queries for native performance
- Grounded RAG returns honest fallback when repository has 0 indexed chunks or no relevant code is found
- Strictly preserved modular monolith architecture without Next.js, microservices, or separate vector databases

Tests:
- fileFilter.test.ts (6 tests passing)
- codeChunker.test.ts (4 tests passing)
- aiProvider.test.ts (3 tests passing)
- ingestion.test.ts (7 tests passing)
- rag.test.ts (6 tests passing)
- repository.test.ts (13 tests passing)
- auth.test.ts (5 tests passing)
- health.test.ts (2 tests passing)
- Total: 46 passed (100%)

Deployment:
- Local docker compose with postgres (pgvector) and redis (7-alpine)
```

## 15. Savepoint Rule

Before a major architectural change, update this file with:
- Current state.
- Why the change is needed.
- What was changed.
- What remains.
- Any migration concerns.

Do not silently change major architecture.

## 16. Agent Context Rule

Before starting work:
1. Read this memory file.
2. Read `rules.md`.
3. Read relevant architecture sections.
4. Inspect current code.
5. Identify the current task in `tasks.md`.

After completing meaningful work:
1. Update task status.
2. Update this memory file.
3. Record important architectural decisions.
4. Record tests run.
5. Record unresolved issues.

## 17. Current Project Philosophy

Build fewer features deeply rather than many features superficially.

A smaller system that is:
- secure
- tested
- understandable
- deployed
- observable

is preferable to a huge system full of unnecessary technologies.

## 18. Interview Readiness

The final project owner should be able to explain:

> Why did I choose this architecture?

> How does repository ingestion work?

> Why do I need embeddings?

> Why use vector search?

> Why use RAG?

> Why PostgreSQL + pgvector?

> What does Redis do?

> Why use a background worker?

> How is GitHub authentication handled?

> How is repository access secured?

> How does the AI code review work?

> How do I evaluate AI responses?

> What would I change to scale the system?

Answers must be based on the actual implementation.

## 19. Do Not Fabricate

Never claim:
- performance improvements that were not measured
- accuracy percentages that were not evaluated
- scale that was not tested
- security guarantees that were not verified
- AI capabilities that are not implemented

Use measured results wherever possible.

## 20. Milestone 4 Implementation Memory

### AI Engineering Intelligence Capabilities (Completed)
1. **AI Code Review (`POST /api/repositories/:id/review`)**:
   - Accepts git diffs (up to 100KB), parses affected files, retrieves targeted chunks, and generates structured findings.
   - Findings include: severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`), category (`BUG`, `SECURITY`, `PERFORMANCE`, `CORRECTNESS`, `MAINTAINABILITY`, `TESTING`), title, explanation, evidence, suggestedFix, line numbers, confidence, and source citations.
   - Strictly enforces clean-diff handling: returns `noIssuesMessage: "no significant issues found"` rather than fabricating issues.

2. **AI Debugging (`POST /api/repositories/:id/debug`)**:
   - Accepts error messages, stack traces, and suspected paths.
   - Parses file paths and frames, retrieves code context, and returns structured diagnostics.
   - Clearly distinguishes verified repository evidence from AI inference and explicit uncertainty notes.

3. **AI Implementation Planning (`POST /api/repositories/:id/plan`)**:
   - Accepts high-level feature requests and technical constraints.
   - Semantically searches architecture, schemas, and routes to produce an actionable roadmap: summary, assumptions, affected files table, sequenced steps, dependencies, risks, testing plan, and architectural considerations.
   - Strictly read-only: never modifies repository files.

4. **Shared AI & Security Architecture**:
   - `CompletionProvider.generateStructured<T>()` with Zod schema validation.
   - Reusable hybrid retrieval (`contextRetriever.ts`) combining targeted file lookup and pgvector cosine similarity search.
   - Prompt-injection defense directives treating all repository contents and inputs strictly as untrusted data.
   - Multi-tenant repository ownership enforcement on every endpoint.

## 21. Milestone 5 Implementation Memory (Final Milestone: Production Hardening, Observability & Deployment)

### Production Security Hardening
- **Helmet Security Headers**: Strict CSP compatible with React/Vite SPA, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS in production.
- **CORS**: Restricted strictly to `FRONTEND_URL` with explicit methods (`GET, POST, PUT, DELETE, OPTIONS`) and headers (`Content-Type, Authorization, x-request-id`).
- **Body Limits**: Express JSON and urlencoded body parsers bounded to 2MB.
- **Rate Limiting**: Configured with `express-rate-limit`:
  - Global API limiter: 120 requests / minute.
  - AI endpoint limiter: 20 requests / minute (applied to `/index`, `/chat`, `/review`, `/debug`, `/plan`).
- **PostgreSQL-backed Sessions**: Secure cookie configuration (`httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production). Token leakage prevented — GitHub tokens never returned in API payloads or serialized into logs.

### Redis & BullMQ Reliability
- **Component-Level Health Check**: `GET /api/health` reports status for Postgres and Redis (`ok` or `degraded`), uptime, database latency, and non-blocking failure reporting.
- **BullMQ Resiliency**: 3 job retry attempts with exponential backoff (1000ms delay), resilient failure capture writing safe error messages to `IngestionJob.errorMessage`.

### AI Observability & Feedback
- **Metadata Emission**: Consistent `AIMetadata` (`latencyMs`, `chunksRetrieved`, `model`) returned across Chat, Code Review, Debugging, and Implementation Planning.
- **User Feedback API**: `POST /api/repositories/:id/feedback` backed by Prisma `Feedback` model (`rating: 1 | -1`, `capability`, `comment`, `referenceId`), with strict repository ownership checks.
- **UI Feedback Widget**: Reusable `FeedbackWidget` in frontend rendering latency tag, chunks count, model badge, and thumbs up/down action with confirmation feedback.

### Production Containerization & CI/CD
- Multi-stage `backend/Dockerfile` with Node 20 Alpine, Prisma generate, and non-root `node` execution.
- Multi-stage `frontend/Dockerfile` with Node 20 Alpine build and Nginx Alpine runner with SPA fallback and `/api/` proxy.
- `docker-compose.prod.yml` provisioning PostgreSQL 16 with pgvector, Redis 7, backend, and frontend with health checks and auto-restart policies.
- `.github/workflows/ci.yml` running dual-job CI pipeline: checkout, Node 20 setup, dependency installation, backend typecheck + tests (with Postgres & Redis service containers), frontend typecheck + production build.

## 22. Final Reminder

The goal is not merely to create a visually impressive project.

The goal is to create a credible engineering project that demonstrates:

**Full-stack development + backend engineering + AI/RAG + databases + infrastructure + practical software engineering.**


# Architecture
# AI Developer Intelligence Platform

## 1. Architecture Principles

1. Start as a modular monolith, not microservices.
2. Keep frontend, backend, AI, data access, and infrastructure concerns separated.
3. Keep AI provider-specific code behind interfaces/services.
4. Perform all sensitive operations server-side.
5. Use asynchronous jobs for repository ingestion.
6. Prefer simple, observable components over unnecessary infrastructure.
7. Design for future scaling without implementing unnecessary complexity now.

## 2. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Component library only if it improves consistency
- TanStack Query for server-state management where useful

### Backend
- Node.js
- TypeScript
- Express.js
- REST APIs
- Zod or equivalent validation
- Pino or equivalent structured logging

### Middleware / Supporting Infrastructure
- Redis
- BullMQ for background jobs
- GitHub REST API / OAuth
- AI provider SDK
- Embedding model/API
- Vector search layer
- Docker

### Database
- PostgreSQL
- pgvector extension for vector search, unless a separate vector database becomes necessary
- Prisma or Drizzle ORM

**Default recommendation:** PostgreSQL + pgvector to reduce infrastructure complexity.

### Deployment
- Docker
- GitHub Actions for CI/CD
- AWS
- Frontend: static/container deployment according to final architecture
- Backend: AWS ECS/Fargate or a simpler AWS container deployment
- PostgreSQL: managed PostgreSQL/RDS
- Redis: managed Redis where available
- Object storage: S3 if repository artifacts or larger files need persistent storage

Do not introduce Kubernetes for MVP.

## 3. High-Level Architecture

```text
                         Browser
                            |
                            v
                   React + TypeScript
                            |
                       HTTPS / REST
                            |
                            v
                    Node.js + Express
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   Auth Service       Repository Service    AI Service
        |                   |                   |
        |                   v                   |
        |              GitHub API              |
        |                   |                   |
        |                   v                   |
        |             Job Queue (BullMQ)       |
        |                   |                   |
        |                   v                   |
        |            Ingestion Worker          |
        |                   |                   |
        |          +--------+--------+          |
        |          |                 |          |
        v          v                 v          v
   PostgreSQL    Redis          Embeddings    LLM
        |                           |           |
        +---------------------------+-----------+
                                    |
                                    v
                             pgvector Search
```

## 4. Frontend Architecture

Suggested structure:

```text
src/
  app/
  components/
  features/
    auth/
    repositories/
    codebase/
    review/
    debugging/
    planning/
    dashboard/
  hooks/
  lib/
  services/
  types/
  routes/
```

Principles:
- Feature-oriented organization.
- API calls isolated from UI components.
- Reusable components for tables, cards, dialogs, code blocks, status indicators.
- Server state managed separately from local UI state.
- Do not put business logic directly into visual components.

## 5. Backend Architecture

Suggested structure:

```text
src/
  config/
  routes/
  controllers/
  services/
    auth/
    github/
    repository/
    ingestion/
    rag/
    ai/
    review/
    debugging/
    planning/
  repositories/
  workers/
  middleware/
  schemas/
  utils/
  prompts/
  types/
  app.ts
  server.ts
```

### Request flow

```text
Route
  -> Middleware
  -> Validation
  -> Controller
  -> Service
  -> Repository/Data layer
  -> Response
```

Controllers should remain thin.

Business logic belongs in services.

Database access belongs in repositories/data-access modules.

## 6. Authentication Architecture

Preferred approach:
- GitHub OAuth.
- Backend handles OAuth callback.
- Backend creates an authenticated application session.
- Frontend receives only safe session state.
- GitHub access tokens remain server-side.

Never place GitHub OAuth secrets or provider tokens in React source code.

## 7. Repository Ingestion Architecture

```text
User selects repository
        |
        v
POST /repositories/:id/index
        |
        v
Create ingestion job
        |
        v
BullMQ / Redis
        |
        v
Ingestion Worker
        |
        +--> Fetch repository tree
        |
        +--> Filter files
        |
        +--> Fetch file content
        |
        +--> Parse/normalize
        |
        +--> Chunk code
        |
        +--> Generate embeddings
        |
        +--> Store chunks + metadata
        |
        +--> Store vectors
        |
        v
Update job/repository status
```

Indexing must not block the HTTP request.

## 8. Code Chunking

MVP strategy:
- Prefer function/class/module-aware chunks where practical.
- Preserve file path and language metadata.
- Preserve start/end line numbers.
- Keep chunk size bounded.
- Include a small overlap only when useful.

Metadata example:

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

Avoid embedding binary/generated files.

## 9. RAG Architecture

```text
User Question
     |
     v
Question validation
     |
     v
Query embedding
     |
     v
pgvector similarity search
     |
     v
Metadata filtering
     |
     v
Top-K context
     |
     v
Optional reranking
     |
     v
Prompt construction
     |
     v
LLM
     |
     +----> Answer
     |
     +----> Source references
```

The RAG service should expose a clean interface so the vector provider can be replaced later.

## 10. AI Service

Create an abstraction such as:

```text
AIProvider
  - generateText()
  - generateStructuredOutput()
  - createEmbedding()
```

Provider-specific code should not be scattered throughout controllers.

Prompts should live in version-controlled prompt modules/files.

## 11. Code Review Architecture

Input:
- User-provided diff OR GitHub PR data.

Pipeline:

```text
Diff
 |
 v
Parse changed files
 |
 v
Retrieve relevant surrounding repository context
 |
 v
Construct review prompt
 |
 v
LLM structured output
 |
 v
Validate output
 |
 v
Store review
 |
 v
Display findings
```

Structured result:

```text
severity
category
file
line
finding
explanation
recommendation
confidence
```

## 12. Debugging Architecture

```text
Error + stack trace
        |
        v
Extract relevant identifiers
        |
        v
Repository retrieval
        |
        v
Relevant source context
        |
        v
LLM analysis
        |
        v
Cause + evidence + suggested fix + tests
```

The system should distinguish evidence from speculation.

## 13. Redis Usage

Redis should initially be used for:
- BullMQ job queues.
- Short-lived caching.
- Rate limiting where appropriate.
- Temporary job/status data if useful.

Do not use Redis as the primary database.

Potential cache candidates:
- Repository metadata.
- Frequently repeated read-only dashboard queries.
- Repeated retrieval metadata when appropriate.

## 14. PostgreSQL Data Model

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

Vector embeddings may live in `code_chunks` using pgvector.

## 15. API Design

Example endpoints:

```text
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/github/repositories
POST   /api/repositories
GET    /api/repositories
GET    /api/repositories/:id
DELETE /api/repositories/:id

POST   /api/repositories/:id/index
GET    /api/repositories/:id/index/status

POST   /api/repositories/:id/chat
GET    /api/repositories/:id/conversations

POST   /api/repositories/:id/reviews
GET    /api/repositories/:id/reviews/:reviewId

POST   /api/repositories/:id/debug

POST   /api/repositories/:id/plans

POST   /api/feedback
```

Exact endpoints may change during implementation.

## 16. Security Architecture

Mandatory:
- Validate all external input.
- Authorize repository access server-side.
- Rate-limit expensive AI endpoints.
- Keep secrets server-side.
- Sanitize/render code safely.
- Never execute arbitrary repository code.
- Avoid logging secrets.
- Protect against prompt injection.
- Restrict file size and repository size.
- Restrict supported file types.
- Use secure HTTP headers.
- Use HTTPS in production.

## 17. Deployment Architecture

Development:

```text
Docker Compose
 ├── frontend
 ├── backend
 ├── postgres + pgvector
 └── redis
```

Production target:

```text
Users
  |
HTTPS
  |
Frontend
  |
Backend container
  |
  +---- Managed PostgreSQL
  +---- Managed Redis
  +---- GitHub API
  +---- AI Provider
```

A separate worker container should process ingestion jobs.

## 18. Observability

Every important backend request should have:
- request ID
- structured logs
- duration
- status
- error information

AI requests should additionally track:
- provider/model
- latency
- token usage where available
- estimated cost where available
- retrieval count
- retrieved source identifiers

Do not log raw secrets or sensitive OAuth tokens.

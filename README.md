# DevIntel AI — AI Developer Intelligence Platform

DevIntel AI is a production-hardened developer intelligence platform designed for engineering teams. It connects securely to GitHub repositories, deterministically indexes codebase source trees with language-aware chunking and vector embeddings, and delivers source-grounded AI capabilities: codebase Q&A, automated code review, context-aware debugging, and feature implementation planning.

Unlike generic chatbots, DevIntel AI operates strictly on retrieved repository context with exact file and line citations, enforceable repository authorization, resilient background workers, and lightweight operational observability.

---

## System Architecture

DevIntel AI is built as a **Modular Monolith** in TypeScript across Node.js/Express and React 18/Vite, backed by PostgreSQL with `pgvector`, Redis with BullMQ, and OpenAI's API.

```mermaid
flowchart TD
    subgraph Client ["Client (Browser)"]
        UI["React 18 + Vite SPA"]
    end

    subgraph Gateway ["Reverse Proxy & Security"]
        Nginx["Nginx (Alpine) / Helmet"]
        RateLimit["Global & AI Rate Limiters"]
    end

    subgraph Backend ["Modular Monolith Backend (Node.js + Express)"]
        AuthSvc["Auth Service (GitHub OAuth + PG Sessions)"]
        RepoSvc["Repository Service"]
        QueueSvc["Queue Service (BullMQ)"]
        RAGSvc["RAG & Retrieval Service"]
        IntelSvc["AI Intelligence (Review, Debug, Plan)"]
        FeedbackSvc["Feedback Service"]
    end

    subgraph Workers ["Async Background Processing"]
        IngestWorker["Ingestion Worker (Tree Filter -> Chunker -> Embedder)"]
    end

    subgraph Storage ["Data & Cache Layer"]
        PG[("PostgreSQL 16 + pgvector")]
        Redis[("Redis 7 (BullMQ Queue & Cache)")]
    end

    subgraph External ["External Services"]
        GH["GitHub API"]
        OAI["OpenAI API (Embeddings & Completions)"]
    end

    UI -->|HTTPS / REST| Nginx
    Nginx --> RateLimit
    RateLimit --> AuthSvc
    RateLimit --> RepoSvc
    RateLimit --> RAGSvc
    RateLimit --> IntelSvc
    RateLimit --> FeedbackSvc

    AuthSvc <-->|OAuth 2.0| GH
    AuthSvc -->|Sessions & Users| PG
    RepoSvc -->|Metadata & Ownership| PG
    RepoSvc -->|Sync Tree| GH

    RepoSvc -->|Enqueue Ingestion| QueueSvc
    QueueSvc -->|Jobs| Redis
    Redis -->|Consume| IngestWorker

    IngestWorker -->|Fetch Content| GH
    IngestWorker -->|Batch Embeddings| OAI
    IngestWorker -->|Store Chunks & Vectors| PG

    RAGSvc -->|Vector Similarity Search| PG
    RAGSvc -->|Grounded Prompts| OAI

    IntelSvc -->|Context Retrieval| PG
    IntelSvc -->|Structured Inference| OAI

    FeedbackSvc -->|Store Ratings & Comments| PG
```

---

## Core Capabilities

1. **Codebase Q&A (RAG):** Multi-turn conversational question-answering with exact file and line citations, semantic chunk matching, and cosine similarity ranking.
2. **AI Code Review (`/review`):** Analyzes unified git diffs against retrieved repository architectural context to identify bugs, security vulnerabilities, and design regressions with categorized severity levels.
3. **AI Debugging Assistant (`/debug`):** Maps runtime exceptions and stack traces to repository symbols, identifying plausible root causes and generating targeted unit test recommendations.
4. **Feature Implementation Planning (`/plans`):** Formulates step-by-step technical blueprints for proposed features, including affected files, component impact, risk mitigation, and validation strategies.
5. **Observability & Feedback:** Emits execution telemetry (`latencyMs`, `chunksRetrieved`, `model`) on all AI endpoints, paired with an integrated user rating and feedback mechanism.

---

## Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6.
* **Backend:** Node.js 20, TypeScript, Express 4, Prisma ORM, Zod, Pino (structured logging).
* **Security & Hardening:** Helmet (strict CSP, HSTS, frame protection, referrer policy), CORS origin restrictions, `express-rate-limit`, secure session cookies (`httpOnly`, `sameSite=lax`, `secure` in production), PostgreSQL session store (`connect-pg-simple`).
* **Database & Vector Store:** PostgreSQL 16 with `pgvector` extension.
* **Job Queue & Cache:** Redis 7 with BullMQ (exponential backoff, 3 retries, resilient error handling).
* **AI Provider:** OpenAI `text-embedding-3-small` (1536 dims) and `gpt-4o-mini` (or configurable model via `AIProvider` interface).
* **Containerization & CI:** Multi-stage Dockerfiles (Node 20 Alpine, Nginx Alpine), Docker Compose production stack, GitHub Actions CI.

---

## Environment Variables

Configure these in `backend/.env` (or via container environment variables):

| Variable | Description | Default / Example | Required in Prod |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` | Yes |
| `PORT` | Backend HTTP port | `4000` | No |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/devintel_ai` | Yes |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | Yes |
| `SESSION_SECRET` | Cryptographic secret for signing session cookies | `(min 32 characters string)` | Yes |
| `FRONTEND_URL` | Allowed CORS origin & redirect URL | `http://localhost:5173` | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth application client ID | `your_github_client_id` | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth application client secret | `your_github_client_secret` | Yes |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback endpoint | `http://localhost:4000/api/auth/github/callback` | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings & completions | `sk-...` | Yes |
| `RATE_LIMIT_WINDOW_MS`| Global rate limit time window in ms | `60000` (1 min) | No |
| `RATE_LIMIT_MAX_REQUESTS`| Global max requests per window | `120` | No |
| `AI_RATE_LIMIT_MAX_REQUESTS`| AI endpoint max requests per window | `20` | No |

---

## Quick Start (Local Development)

### Prerequisites
* Node.js 20+ LTS
* Docker and Docker Compose
* GitHub OAuth App (set callback URL to `http://localhost:4000/api/auth/github/callback`)
* OpenAI API key

### 1. Start Database & Redis
```bash
docker compose up -d
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Fill in your GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and OPENAI_API_KEY in .env

npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Configure Frontend
```bash
cd ../frontend
npm install
npm run dev
```

* Frontend UI runs at: `http://localhost:5173`
* Backend API runs at: `http://localhost:4000`
* Health check: `http://localhost:4000/api/health`

---

## Production Setup (Docker Compose)

The repository provides a production-ready stack in `docker-compose.prod.yml` featuring multi-stage builds, non-root execution, Nginx reverse proxying, and built-in health checks.

```bash
# 1. Set environment variables in your environment or .env
export SESSION_SECRET="your-production-secret-key-minimum-32-chars-long"
export GITHUB_CLIENT_ID="your_github_client_id"
export GITHUB_CLIENT_SECRET="your_github_client_secret"
export OPENAI_API_KEY="sk-your-openai-api-key"
export FRONTEND_URL="http://localhost"
export GITHUB_CALLBACK_URL="http://localhost/api/auth/github/callback"

# 2. Build and launch the production containers
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify health of all services
docker compose -f docker-compose.prod.yml ps
```

The production application is served on port 80 via Nginx, which serves the compiled React SPA and proxies `/api/*` traffic internally to the backend container.

---

## API Reference Overview

### System & Health
* `GET /api/health` — Component-level health check (`status`, `components.postgres`, `components.redis`, database latency).

### Authentication & User
* `GET /api/auth/github` — Initiate GitHub OAuth handshake.
* `GET /api/auth/github/callback` — Exchange code for token, upsert user, create session.
* `GET /api/auth/me` — Return authenticated user profile (access tokens are NEVER exposed).
* `POST /api/auth/logout` — Destroy server session and clear cookies.

### Repositories & Ingestion
* `GET /api/github/repositories` — List user's available GitHub repositories.
* `POST /api/repositories` — Connect repository for tracking.
* `GET /api/repositories` — List connected repositories.
* `POST /api/repositories/:id/index` — Enqueue asynchronous ingestion job.
* `GET /api/repositories/:id/index/status` — Get job progress, chunk counts, and indexing status.

### Developer Intelligence
* `POST /api/repositories/:id/chat` — Ask questions about the codebase; returns grounded answer, citations, and observability `meta`.
* `GET /api/repositories/:id/conversations` — List conversation threads.
* `GET /api/repositories/:id/conversations/:convoId` — Fetch chat history for thread.
* `POST /api/repositories/:id/review` — Run AI code review on unified git diff.
* `POST /api/repositories/:id/debug` — Diagnose errors and stack traces with repository context.
* `POST /api/repositories/:id/plan` — Generate architectural implementation plans.

### User Feedback
* `POST /api/repositories/:id/feedback` — Submit thumbs up/down rating and optional comment for AI interactions.
  ```json
  {
    "capability": "chat",
    "rating": 1,
    "comment": "Accurate response",
    "referenceId": "conv-123"
  }
  ```

---

## Security Considerations

1. **Helmet & Security Headers:** Enforces Content Security Policy, blocks clickjacking via `X-Frame-Options: DENY`, mandates MIME sniff prevention (`X-Content-Type-Options: nosniff`), and enables HSTS in production.
2. **CORS Hardening:** API strictly restricts CORS origins to the configured `FRONTEND_URL` with explicit HTTP methods and headers.
3. **Rate Limiting:** Protects standard routes (`120 req/min`) and resource-intensive AI endpoints (`20 req/min`) against abuse and runaway provider costs.
4. **Credential Isolation:** GitHub access tokens are stored in the database, used strictly server-side for repository synchronization, and never serialized or leaked to clients or logs.
5. **Session Security:** Backed by PostgreSQL session table with cryptographic signing, `httpOnly`, `sameSite=lax`, and `secure` cookies in production.
6. **Input Boundaries & Untrusted Data:** All request payloads are validated via Zod schemas; code content and diffs are treated as untrusted strings and never dynamically evaluated.

---

## Verification & Testing

### Running Tests
DevIntel AI includes 10 test suites covering unit logic, integration flows, authorization, RAG pipelines, and security headers:

```bash
# Run backend test suite (Vitest)
cd backend
npm test

# Run backend TypeScript compiler check
npx tsc --noEmit

# Run frontend TypeScript compiler check
cd ../frontend
npx tsc --noEmit

# Run frontend production build test
npm run build
```

---

## Known Limitations

1. **Repository Scale:** Ingestion processes up to 300 source files per repository synchronously or asynchronously. Massive monolithic repositories (tens of thousands of files) require multi-worker partitioning and pagination.
2. **Supported Languages:** Syntax-aware structural chunking is optimized for TypeScript, JavaScript, Python, Go, Rust, Java, C/C++, HTML, CSS, Markdown, JSON, and YAML. Binary files, PDFs, and compiled artifacts are automatically filtered out.
3. **Embeddings & Rate Limits:** Embedding generation relies on OpenAI API throughput; high-volume simultaneous ingestion jobs may encounter provider rate limits if concurrent workers exceed tier thresholds.
4. **Git Operations:** The platform operates in read-only mode against GitHub. It does not automatically execute repository code, apply changes, create pull requests, or publish comments without explicit human control.

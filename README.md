# DevIntel AI (AI Developer Intelligence Platform)

DevIntel AI is a full-stack developer intelligence platform that connects to GitHub repositories, indexes source code, and provides grounded AI assistance for codebase understanding, code review, debugging, and implementation planning.

Rather than acting as a generic chatbot, DevIntel AI operates as an engineering-focused developer tool with strict source grounding, repository-level context retrieval, and full architectural explainability.

---

## Architecture Summary

DevIntel AI is architected as a **Modular Monolith** designed for high clarity, clean service boundaries, and manageable operational complexity.

```text
                         Browser
                            │
                            ▼
                   React + TypeScript (Vite)
                            │
                       HTTPS / REST
                            │
                            ▼
                    Node.js + Express
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Auth Service       Repository Service    AI Service
        │                   │                   │
        │                   ▼                   │
        │              GitHub API               │
        │                   │                   │
        │                   ▼                   │
        │             Job Queue (BullMQ)        │
        │                   │                   │
        │                   ▼                   │
        │            Ingestion Worker           │
        │                   │                   │
        │          ┌────────┴────────┐          │
        │          │                 │          │
        ▼          ▼                 ▼          ▼
   PostgreSQL    Redis          Embeddings     LLM
   (+ pgvector)                     │           │
        │                           │           │
        └───────────────────────────┴───────────┘
                                    │
                                    ▼
                             pgvector Search
```

### Core Pipelines
1. **Repository Ingestion:** Asynchronous processing via BullMQ worker. Traverses GitHub repository trees, filters non-essential/generated files, generates code-aware chunks with preserved symbol and line metadata, creates vector embeddings, and persists them into PostgreSQL with `pgvector`.
2. **Codebase Q&A (RAG):** Grounded question answering using semantic vector search and metadata filtering against code chunks, feeding top-K relevant contexts to the LLM with mandatory source file and line citations.
3. **AI Code Review:** Diff parsing and context retrieval to generate structured review findings classified by severity (Critical, High, Medium, Low, Informational).
4. **AI Debugging:** Error and stack trace ingestion mapped to repository symbols for evidence-backed cause identification and test suggestions.
5. **Implementation Planning:** Architectural roadmapping for proposed features outlining modified files, risk analyses, and validation steps.

---

## Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query.
* **Backend:** Node.js, TypeScript, Express.js, Zod (schema validation), Pino (structured logging).
* **Database & Vector Search:** PostgreSQL with `pgvector` extension via Prisma/Drizzle ORM.
* **Background Jobs & Cache:** Redis + BullMQ.
* **AI Layer:** Abstracted `AIProvider` service interface, version-controlled prompt templates, configurable embedding and LLM providers.
* **Infrastructure & Tooling:** Docker & Docker Compose, Git, ESLint, Prettier.
* **Cloud Target:** AWS (ECS/Fargate, RDS PostgreSQL with pgvector, ElastiCache Redis, S3).

---

## Project Structure

```text
.
├── backend/          # Node.js + Express backend service & ingestion workers
├── frontend/         # React + Vite + Tailwind frontend application
├── docs/             # Product specifications, architecture, and guides
│   ├── architecture.md
│   ├── design.md
│   ├── memory.md
│   ├── product_requirements.md
│   ├── rules.md
│   └── tasks.md
├── .env.example      # Environment variable template
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation
```

---

## Local Development Prerequisites

Ensure you have the following installed on your local development system:
* **Node.js:** `>= 20.x LTS`
* **npm / pnpm / yarn**
* **Git:** `>= 2.40`
* **Docker & Docker Compose:** For running PostgreSQL (with pgvector) and Redis locally

---

## Development Phases

The project follows a phased roadmap:

* **Phase 0 — Planning & Foundation Setup** *(Completed)*
* **Phase 1 — Core Foundation** (Frontend, Backend, Database with pgvector, Local Docker Compose)
* **Phase 2 — Authentication & Authorization** (GitHub OAuth, secure sessions, repo RBAC)
* **Phase 3 — Repository Management** (GitHub API integration, local repository records)
* **Phase 4 — Repository Ingestion** (BullMQ job queues, code chunking, vector embeddings)
* **Phase 5 — RAG & Retrieval Engine** (pgvector search, context construction, source citations)
* **Phase 6 — AI Codebase Chat** (Conversations, grounded Q&A UI, source panel)
* **Phase 7 — AI Code Review** (Diff analysis, structured findings, severity badges)
* **Phase 8 — AI Debugging Assistant** (Stack trace analysis, root cause evidence, fixes)
* **Phase 9 — Implementation Planning** (Step-by-step architectural roadmaps)
* **Phase 10 — Redis Caching & Performance** (Rate limiting, query caching, optimization)
* **Phase 11 — Evaluation & Observability** (Telemetry, latency tracking, evaluation dataset)
* **Phase 12 — Security Hardening** (Input validation, secret management, security headers)
* **Phase 13 — Testing** (Unit tests, integration tests, end-to-end flows)
* **Phase 14 — Deployment & CI/CD** (GitHub Actions, AWS ECS/RDS/Redis deployment)
* **Phase 15 — Interview Readiness** (Architectural justifications, tradeoffs, and defense)

---

## Documentation

For full project specifications and guidelines, refer to the [`docs/`](./docs) directory:
* [Product Requirements](docs/product_requirements.md)
* [Architecture Specification](docs/architecture.md)
* [Development Rules](docs/rules.md)
* [UI/UX Design Guidelines](docs/design.md)
* [Task Plan](docs/tasks.md)
* [Project Memory & State](docs/memory.md)

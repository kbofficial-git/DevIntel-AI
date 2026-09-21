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

### Current Project State (Phase 0 Savepoint)

```text
Phase: Phase 0 — Planning & Repository Setup
Feature: Initial Workspace Foundation
State: COMPLETE
Last completed:
- Confirmed project root and workspace parameters
- Initialized Git repository on branch 'main'
- Created project folder structure: frontend/, backend/, docs/
- Created root README.md with architecture, tech stack, and prerequisites
- Created root .gitignore covering Node, TypeScript, Vite, Docker, IDEs, and environments
- Created root .env.example with safe placeholder configuration variables
- Updated docs/tasks.md marking Phase 0 tasks as complete

Currently working on:
- Phase 0 verification and sign-off

Next:
- Phase 1 — Foundation (Frontend Vite setup, Backend Express scaffolding, PostgreSQL + pgvector config, Docker Compose)

Known issues:
- None

Important decisions:
- Retained React 18 + Vite (Strictly NO Next.js)
- Modular Monolith architecture chosen over microservices
- PostgreSQL with pgvector confirmed for vector embeddings and relational data
- Redis + BullMQ chosen for async ingestion jobs
- Initialized empty directories with .gitkeep to ensure Git tracking without pre-installing dependencies

Tests:
- Git repository initialization verified
- Directory structure verified

Deployment:
- Local setup planned via Docker Compose (Phase 1)
- AWS ECS + RDS target for production (Phase 14)
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

## 20. Final Reminder

The goal is not merely to create a visually impressive project.

The goal is to create a credible engineering project that demonstrates:

**Full-stack development + backend engineering + AI/RAG + databases + infrastructure + practical software engineering.**

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
- [ ] Create React + TypeScript + Vite application.
- [ ] Configure Tailwind.
- [ ] Configure routing.
- [ ] Configure ESLint/Prettier.
- [ ] Create base layout.
- [ ] Create reusable UI primitives.

### T1.2 Backend
- [ ] Create Node + TypeScript + Express application.
- [ ] Configure environment variables.
- [ ] Add request logging.
- [ ] Add centralized error handling.
- [ ] Add validation.
- [ ] Add health endpoint.
- [ ] Add API version prefix.

### T1.3 Database
- [ ] Set up PostgreSQL.
- [ ] Enable pgvector.
- [ ] Configure ORM.
- [ ] Configure migrations.
- [ ] Create initial database connection.
- [ ] Add database health check.

### T1.4 Local infrastructure
- [ ] Create Dockerfiles.
- [ ] Create Docker Compose.
- [ ] Add PostgreSQL.
- [ ] Add Redis.
- [ ] Verify local startup.

---

# Phase 2 — Authentication

### T2.1 GitHub OAuth
- [ ] Create GitHub OAuth application.
- [ ] Implement OAuth initiation.
- [ ] Implement callback.
- [ ] Store GitHub account association.
- [ ] Implement secure application session.
- [ ] Implement logout.
- [ ] Implement current-user endpoint.

### T2.2 Authorization
- [ ] Add authentication middleware.
- [ ] Add repository ownership checks.
- [ ] Add authorization tests.
- [ ] Verify cross-user data cannot be accessed.

---

# Phase 3 — Repository Management

### T3.1 Repository API
- [ ] Fetch accessible GitHub repositories.
- [ ] Create local repository record.
- [ ] List connected repositories.
- [ ] Retrieve repository details.
- [ ] Remove repository.
- [ ] Handle repository access changes.

### T3.2 Repository UI
- [ ] Repository listing page.
- [ ] Repository card.
- [ ] Repository detail page.
- [ ] Repository selection flow.
- [ ] Empty/error states.

---

# Phase 4 — Repository Ingestion

### T4.1 Job system
- [ ] Configure BullMQ.
- [ ] Create ingestion queue.
- [ ] Create worker.
- [ ] Add job status tracking.
- [ ] Add retries.
- [ ] Add failure handling.

### T4.2 GitHub ingestion
- [ ] Fetch repository tree.
- [ ] Filter files.
- [ ] Fetch file contents.
- [ ] Detect language.
- [ ] Store file metadata.
- [ ] Handle large files.
- [ ] Handle API rate limits.

### T4.3 Code chunking
- [ ] Implement basic code-aware chunking.
- [ ] Preserve path.
- [ ] Preserve line ranges.
- [ ] Preserve language.
- [ ] Preserve commit SHA.
- [ ] Generate content hash.
- [ ] Avoid duplicate chunks where possible.

### T4.4 Embeddings
- [ ] Select embedding model.
- [ ] Implement embedding service.
- [ ] Store embeddings in pgvector.
- [ ] Add vector indexes if appropriate.
- [ ] Test retrieval quality.

### T4.5 Indexing UI
- [ ] Index button.
- [ ] Progress/status UI.
- [ ] Error display.
- [ ] Retry action.
- [ ] Last indexed information.

---

# Phase 5 — RAG

### T5.1 Retrieval
- [ ] Implement query embedding.
- [ ] Implement vector similarity search.
- [ ] Add repository filtering.
- [ ] Add metadata filtering.
- [ ] Configure top-K.
- [ ] Handle no results.

### T5.2 Context construction
- [ ] Build context formatter.
- [ ] Include file path.
- [ ] Include line ranges.
- [ ] Bound context size.
- [ ] Prevent irrelevant context where possible.

### T5.3 LLM integration
- [ ] Implement AI provider abstraction.
- [ ] Add codebase Q&A prompt.
- [ ] Add structured response handling where useful.
- [ ] Add timeout/error handling.
- [ ] Add provider configuration.

### T5.4 Source citations
- [ ] Return source metadata.
- [ ] Render source references.
- [ ] Allow source navigation.

---

# Phase 6 — AI Chat

### T6.1 Backend
- [ ] Create conversation model.
- [ ] Create message model.
- [ ] Create chat endpoint.
- [ ] Store messages.
- [ ] Connect chat to RAG.
- [ ] Add request IDs.

### T6.2 Frontend
- [ ] Chat interface.
- [ ] Markdown rendering.
- [ ] Code blocks.
- [ ] Source panel.
- [ ] Loading state.
- [ ] Error state.
- [ ] Conversation history.

---

# Phase 7 — AI Code Review

### T7.1 Review backend
- [ ] Accept code diff.
- [ ] Parse changed files.
- [ ] Retrieve repository context.
- [ ] Construct review prompt.
- [ ] Request structured AI output.
- [ ] Validate output.
- [ ] Store review.

### T7.2 Review UI
- [ ] Diff input.
- [ ] Review trigger.
- [ ] Findings list.
- [ ] Severity display.
- [ ] File/line references.
- [ ] Recommendation display.

### T7.3 Testing
- [ ] Test obvious bug.
- [ ] Test security issue.
- [ ] Test clean diff.
- [ ] Test malformed diff.
- [ ] Test LLM failure.

---

# Phase 8 — AI Debugging

### T8.1 Backend
- [ ] Debug session model.
- [ ] Error/stack-trace input.
- [ ] Context retrieval.
- [ ] Debugging prompt.
- [ ] Structured response.

### T8.2 Frontend
- [ ] Debug input screen.
- [ ] Result display.
- [ ] Evidence/source section.
- [ ] Suggested tests.

---

# Phase 9 — Implementation Planning

### T9.1 Backend
- [ ] Planning prompt.
- [ ] Retrieve architecture-relevant code.
- [ ] Generate structured plan.
- [ ] Validate output.

### T9.2 Frontend
- [ ] Goal input.
- [ ] Plan display.
- [ ] Files affected.
- [ ] Risks.
- [ ] Testing strategy.

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
- [ ] Measure ingestion time.
- [ ] Measure retrieval latency.
- [ ] Measure AI latency.
- [ ] Avoid unnecessary database queries.

---

# Phase 11 — Evaluation and Observability

### T11.1 AI request tracking
- [ ] Store request ID.
- [ ] Store latency.
- [ ] Store model.
- [ ] Store token usage if available.
- [ ] Store retrieval count.
- [ ] Store source identifiers.

### T11.2 Feedback
- [ ] Add thumbs up/down or equivalent.
- [ ] Store feedback.
- [ ] Associate feedback with AI response.

### T11.3 Evaluation dataset
Create 20–30 representative repository questions.

For each:
- expected relevant files
- expected concepts
- acceptable answer characteristics

Measure retrieval and answer quality manually initially.

---

# Phase 12 — Security Hardening

- [ ] Audit authorization.
- [ ] Audit secrets.
- [ ] Validate repository inputs.
- [ ] Limit file sizes.
- [ ] Prevent arbitrary code execution.
- [ ] Review prompt injection risks.
- [ ] Sanitize rendered content.
- [ ] Add security headers.
- [ ] Add production CORS configuration.
- [ ] Review rate limits.
- [ ] Remove sensitive logs.

---

# Phase 13 — Testing

### Backend
- [ ] Unit tests for services.
- [ ] Repository authorization tests.
- [ ] Ingestion tests.
- [ ] RAG retrieval tests.
- [ ] API integration tests.

### Frontend
- [ ] Critical component tests.
- [ ] Authentication state tests.
- [ ] Chat states.
- [ ] Repository states.

### End-to-end
- [ ] Login.
- [ ] Connect repository.
- [ ] Index repository.
- [ ] Ask question.
- [ ] Receive sources.
- [ ] Perform code review.

---

# Phase 14 — Deployment

### CI/CD
- [ ] GitHub Actions.
- [ ] Install dependencies.
- [ ] Lint.
- [ ] Type check.
- [ ] Test.
- [ ] Build.
- [ ] Build Docker image.

### AWS
- [ ] Configure networking/security.
- [ ] Deploy frontend.
- [ ] Deploy backend.
- [ ] Deploy worker.
- [ ] Configure managed PostgreSQL.
- [ ] Configure Redis.
- [ ] Configure secrets.
- [ ] Configure domain/HTTPS.
- [ ] Configure logs.

### Production verification
- [ ] Health checks.
- [ ] Authentication.
- [ ] Repository connection.
- [ ] Ingestion.
- [ ] RAG.
- [ ] AI review.
- [ ] Error handling.

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

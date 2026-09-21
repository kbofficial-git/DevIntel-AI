# Development Rules
# AI Developer Intelligence Platform

These rules apply to all AI-assisted development.

## 1. Core Principle

Build a real, understandable product.

AI coding tools may generate code, but every major architectural decision must remain understandable to the developer.

## 2. No Blind Vibe Coding

Before implementing a major feature:
1. Explain the goal.
2. Explain the architecture/data flow.
3. Identify files that will change.
4. Implement the smallest useful increment.
5. Run/test it.
6. Explain the resulting implementation.

Do not generate the entire application in one prompt.

## 3. Keep the Architecture Simple

- Use a modular monolith.
- Do not introduce microservices for MVP.
- Do not introduce Kubernetes.
- Do not add technologies without a concrete requirement.
- Prefer PostgreSQL + pgvector over adding a separate vector database initially.
- Prefer BullMQ + Redis for background jobs.

## 4. Frontend Rules

- React + TypeScript only.
- Do not introduce Next.js.
- Keep UI components reusable.
- Keep API logic outside visual components.
- Use clear loading, error and empty states.
- Avoid unnecessary global state.
- Validate forms.
- Handle API failures gracefully.
- Keep accessibility in mind.
- Do not expose secrets in frontend code.

## 5. Backend Rules

- TypeScript.
- Express routes should remain thin.
- Controllers coordinate; services contain business logic.
- Database access belongs in repositories/data-access modules.
- Validate request bodies, params and query strings.
- Use consistent error responses.
- Never expose stack traces in production responses.
- Never trust frontend authorization checks.
- Perform authorization server-side.

## 6. Database Rules

- Use PostgreSQL as the source of truth for relational data.
- Use migrations.
- Add indexes based on actual query patterns.
- Define foreign keys where appropriate.
- Avoid storing large duplicated data unnecessarily.
- Use transactions for operations that must be atomic.
- Store vector metadata with code chunks.

## 7. Redis Rules

Redis is a supporting system, not the source of truth.

Use it for:
- Queues
- Cache
- Rate limiting
- Temporary state

Always define TTL for temporary/cache data where appropriate.

## 8. RAG Rules

- Never send an entire repository to the LLM by default.
- Retrieve only relevant context.
- Preserve source metadata.
- Cite sources in repository-specific answers.
- Bound retrieval count and context size.
- Handle no-result retrieval explicitly.
- Do not claim repository facts unsupported by retrieved evidence.
- Version prompt templates.
- Log retrieval metadata for evaluation, while respecting privacy.

## 9. AI Rules

- Keep provider-specific code behind an abstraction.
- Never hardcode API keys.
- Validate structured model output.
- Treat LLM output as untrusted data.
- Do not execute generated code automatically.
- Use human approval before any future code-writing/push workflow.
- Handle provider timeouts and rate limits.
- Provide graceful fallback errors.

## 10. Security Rules

Never:
- Commit secrets.
- Log OAuth tokens.
- Execute arbitrary repository code.
- Trust user-supplied repository URLs without validation.
- Allow one user to access another user's repository data.
- Expose internal errors to users.
- Render untrusted HTML without sanitization.

## 11. Code Quality

- TypeScript strict mode where practical.
- ESLint.
- Prettier.
- Meaningful names.
- Small functions.
- Avoid unnecessary abstractions.
- Avoid duplicated business logic.
- Comments should explain WHY, not obvious WHAT.
- Remove dead code.
- Keep dependencies minimal.

## 12. Testing Rules

At minimum:
- Unit test critical services.
- Integration test important API/database flows.
- Test authentication/authorization.
- Test ingestion edge cases.
- Test RAG no-result and failure cases.
- Test rate limiting for expensive endpoints where practical.

## 13. Git Rules

Use small, meaningful commits.

Examples:

```text
feat: add github repository listing
feat: add repository ingestion worker
feat: add code chunk metadata
feat: add vector retrieval
feat: add grounded codebase chat
fix: handle failed ingestion jobs
test: add repository authorization tests
```

Do not commit generated secrets, local databases, or `.env` files.

## 14. AI Coding Assistant Rules

When using Antigravity:
- Inspect the repository before modifying it.
- Do not overwrite working features unnecessarily.
- Show or summarize planned changes before major refactors.
- Keep changes scoped.
- Run tests/build/lint after meaningful changes.
- Explain unfamiliar code.
- Never claim a feature works without testing it.

## 15. Lovable UI Rules

Lovable may be used for frontend design/prototyping.

Lovable should NOT be the source of truth for:
- Backend architecture
- Database architecture
- Authentication security
- RAG architecture
- AI provider logic
- Background jobs

Use mock data where necessary and integrate the UI with the actual backend afterward.

## 16. Interview-Readiness Rule

Any technology included in the final project must be explainable.

If the developer cannot explain why a component exists, how data flows through it, and what its limitations are, remove it or learn it before including it in the project.

## 17. Scope Control

MVP first.

If a feature does not contribute to:
- repository understanding
- grounded AI assistance
- code review
- debugging
- implementation planning
- security
- reliability

defer it.

## 18. Definition of Done

A feature is done only when:
- Implemented.
- Integrated.
- Tested.
- Error states handled.
- Security implications considered.
- Documented enough to explain.
- No unrelated regressions introduced.

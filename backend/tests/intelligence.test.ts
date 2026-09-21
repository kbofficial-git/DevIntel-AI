import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { repositoryRepository } from '../src/repositories/repository.repository';
import { chunkRepository } from '../src/repositories/chunk.repository';
import { codeReviewService } from '../src/services/ai/review/codeReview.service';
import { debuggingService } from '../src/services/ai/debugging/debugging.service';
import { planningService } from '../src/services/ai/planning/planning.service';
import { contextRetriever } from '../src/services/ai/retrieval/contextRetriever';
import { getAIProvider } from '../src/services/ai/ai.provider';
import { codeReviewLLMOutputSchema } from '../src/services/ai/schemas/review.schema';
import { debugLLMOutputSchema } from '../src/services/ai/schemas/debug.schema';
import { planLLMOutputSchema } from '../src/services/ai/schemas/plan.schema';

vi.mock('../src/repositories/repository.repository');
vi.mock('../src/repositories/chunk.repository');

describe('AI Engineering Intelligence Suite (Milestone 4)', () => {
  const mockUserId = 'user-123';
  const mockRepoId = 'repo-456';
  const mockRepo = {
    id: mockRepoId,
    userId: mockUserId,
    name: 'devintel-backend',
    fullName: 'dev/devintel-backend',
    defaultBranch: 'main',
  };

  const sampleRetrievedChunks = [
    {
      id: 'chunk-1',
      filePath: 'src/repositories/example.repository.ts',
      language: 'typescript',
      startLine: 20,
      endLine: 40,
      symbolName: 'getUserById',
      content: 'export async function getUserById(id: string) {\n  return prisma.user.findUnique({ where: { id } });\n}',
      similarity: 0.88,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP & Access Control', () => {
    it('POST /api/repositories/:id/review returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/repositories/${mockRepoId}/review`)
        .send({ diff: 'diff --git a/src/app.ts b/src/app.ts\n+console.log("test");' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('POST /api/repositories/:id/debug returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/repositories/${mockRepoId}/debug`)
        .send({ errorMessage: 'TypeError: Cannot read properties of undefined' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('POST /api/repositories/:id/plan returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/repositories/${mockRepoId}/plan`)
        .send({ request: 'Add role-based access control' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('Repository Authorization & Ownership', () => {
    it('codeReviewService.review throws 404 if repository does not belong to user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        codeReviewService.review(mockUserId, 'unowned-repo', {
          diff: 'diff --git a/test.ts b/test.ts\n+const a = 1;',
        })
      ).rejects.toThrow('Repository not found');
    });

    it('debuggingService.debug throws 404 if repository does not belong to user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        debuggingService.debug(mockUserId, 'unowned-repo', {
          errorMessage: 'Null pointer exception',
        })
      ).rejects.toThrow('Repository not found');
    });

    it('planningService.createPlan throws 404 if repository does not belong to user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        planningService.createPlan(mockUserId, 'unowned-repo', {
          request: 'Implement two factor auth',
        })
      ).rejects.toThrow('Repository not found');
    });
  });

  describe('Input Validation & Diff Extraction', () => {
    it('contextRetriever correctly extracts file paths from unified git diff', () => {
      const sampleDiff = `diff --git a/backend/src/auth.ts b/backend/src/auth.ts
--- a/backend/src/auth.ts
+++ b/backend/src/auth.ts
@@ -10,3 +10,4 @@
+import jwt from 'jsonwebtoken';
diff --git a/frontend/src/App.tsx b/frontend/src/App.tsx
--- a/frontend/src/App.tsx
+++ b/frontend/src/App.tsx`;

      const files = contextRetriever.extractFilesFromDiff(sampleDiff);
      expect(files).toContain('backend/src/auth.ts');
      expect(files).toContain('frontend/src/App.tsx');
      expect(files.length).toBe(2);
    });

    it('contextRetriever correctly extracts file paths from stack traces', () => {
      const sampleStackTrace = `TypeError: Cannot read properties of null
    at getUser (/app/backend/src/services/user.service.ts:45:12)
    at handleRequest (/app/backend/src/controllers/user.controller.ts:18:9)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

      const files = contextRetriever.extractFilesFromStackTrace(sampleStackTrace);
      expect(files).toContain('user.service.ts');
      expect(files).toContain('user.controller.ts');
    });
  });

  describe('AI Code Review Domain Service', () => {
    it('analyzes a diff with issues and returns structured findings with citations', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chunkRepository.findByFilePaths).mockResolvedValue(sampleRetrievedChunks);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue(sampleRetrievedChunks);

      const diffWithIssue = `diff --git a/src/repositories/example.repository.ts b/src/repositories/example.repository.ts
@@ -24,4 +24,5 @@
-const query = prisma.$queryRaw\`SELECT * FROM users WHERE id = \${id}\`;
+const query = \`SELECT * FROM users WHERE id = \${req.params.id}\`;`;

      const result = await codeReviewService.review(mockUserId, mockRepoId, {
        diff: diffWithIssue,
        title: 'Update query logic',
        description: 'Direct query interpolation',
      });

      expect(result.hasIssues).toBe(true);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0]).toHaveProperty('severity');
      expect(result.findings[0]).toHaveProperty('category');
      expect(result.findings[0]).toHaveProperty('suggestedFix');
      expect(result.findings[0]).toHaveProperty('filePath');
      expect(result.findings[0]).toHaveProperty('confidence');
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations[0].filePath).toBe('src/repositories/example.repository.ts');
    });

    it('explicitly returns "no significant issues found" when diff is clean', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chunkRepository.findByFilePaths).mockResolvedValue([]);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue([]);

      const cleanDiff = `diff --git a/README.md b/README.md
@@ -1,3 +1,4 @@
 # DevIntel AI
+Clean documentation improvement with no code changes`;

      const result = await codeReviewService.review(mockUserId, mockRepoId, {
        diff: cleanDiff,
      });

      expect(result.hasIssues).toBe(false);
      expect(result.findings).toHaveLength(0);
      expect(result.noIssuesMessage).toBe('no significant issues found');
    });
  });

  describe('AI Debugging Domain Service', () => {
    it('analyzes error and stack trace and returns structured diagnostic', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chunkRepository.findByFilePaths).mockResolvedValue(sampleRetrievedChunks);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue(sampleRetrievedChunks);

      const result = await debuggingService.debug(mockUserId, mockRepoId, {
        errorMessage: 'TypeError: Cannot read properties of null (reading "id")',
        stackTrace: 'at getUser (/app/src/services/entity.service.ts:45:12)',
        filePath: 'src/services/entity.service.ts',
      });

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('probableCause');
      expect(result.confidence).toBe('HIGH');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('suggestedFix');
      expect(result.affectedFiles).toContain('src/services/entity.service.ts');
      expect(result).toHaveProperty('testingStrategy');
      expect(result.citations.length).toBeGreaterThan(0);
    });

    it('handles low confidence and notes uncertainty appropriately', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chunkRepository.findByFilePaths).mockResolvedValue([]);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue([]);

      const result = await debuggingService.debug(mockUserId, mockRepoId, {
        errorMessage: 'Ambiguous and uncertain intermittent network timeout',
      });

      expect(result.confidence).toBe('LOW');
      expect(result.uncertaintyNotes).toBeDefined();
    });
  });

  describe('AI Implementation Planning Domain Service', () => {
    it('generates an architectural plan with affected files, steps, dependencies, and risks', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue(sampleRetrievedChunks);

      const result = await planningService.createPlan(mockUserId, mockRepoId, {
        request: 'Add role-based access control with admin and member roles',
      });

      expect(result).toHaveProperty('summary');
      expect(result.assumptions.length).toBeGreaterThan(0);
      expect(result.affectedFiles.length).toBeGreaterThan(0);
      expect(result.affectedFiles[0]).toHaveProperty('path');
      expect(result.affectedFiles[0]).toHaveProperty('reason');
      expect(result.affectedFiles[0]).toHaveProperty('expectedChange');

      expect(result.implementationSteps.length).toBeGreaterThan(0);
      expect(result.implementationSteps[0]).toHaveProperty('order');
      expect(result.implementationSteps[0]).toHaveProperty('title');
      expect(result.implementationSteps[0]).toHaveProperty('description');

      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.testingPlan.length).toBeGreaterThan(0);
      expect(result.architecturalConsiderations.length).toBeGreaterThan(0);
      expect(result.citations.length).toBeGreaterThan(0);
    });
  });

  describe('AI Provider Structured Output & Schemas', () => {
    it('MockAIProvider produces outputs conforming strictly to Zod schemas', async () => {
      const provider = getAIProvider();

      const reviewRes = await provider.generateStructured(
        'Code Review directives',
        'Review this diff',
        codeReviewLLMOutputSchema
      );
      expect(codeReviewLLMOutputSchema.safeParse(reviewRes).success).toBe(true);

      const debugRes = await provider.generateStructured(
        'Debugging directives',
        'Debug this error',
        debugLLMOutputSchema
      );
      expect(debugLLMOutputSchema.safeParse(debugRes).success).toBe(true);

      const planRes = await provider.generateStructured(
        'Planning directives',
        'Plan this feature',
        planLLMOutputSchema
      );
      expect(planLLMOutputSchema.safeParse(planRes).success).toBe(true);
    });
  });
});

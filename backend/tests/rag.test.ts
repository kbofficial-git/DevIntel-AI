import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { ragService } from '../src/services/rag/rag.service';
import { repositoryRepository } from '../src/repositories/repository.repository';
import { chunkRepository } from '../src/repositories/chunk.repository';
import { chatRepository } from '../src/repositories/chat.repository';

vi.mock('../src/repositories/repository.repository');
vi.mock('../src/repositories/chunk.repository');
vi.mock('../src/repositories/chat.repository');

describe('RAG & Codebase Chat Suite', () => {
  const mockUserId = 'user-123';
  const mockRepoId = 'repo-456';
  const mockRepo = {
    id: mockRepoId,
    userId: mockUserId,
    name: 'devintel-backend',
    fullName: 'dev/devintel-backend',
    defaultBranch: 'main',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP & Access Control', () => {
    it('POST /api/repositories/:id/chat returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/repositories/a0000000-0000-0000-0000-000000000001/chat')
        .send({ question: 'How does authentication work?' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('GET /api/repositories/:id/conversations returns 401 when unauthenticated', async () => {
      const response = await request(app).get(
        '/api/repositories/a0000000-0000-0000-0000-000000000001/conversations'
      );
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('askQuestion throws 404 when repository belongs to another user', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(null);

      await expect(
        ragService.askQuestion(mockUserId, 'unowned-repo', 'What is this?')
      ).rejects.toThrow('Repository not found');
    });
  });

  describe('RAG Context & Grounding Behavior', () => {
    it('returns honest fallback when repository has 0 indexed chunks', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chatRepository.findOrCreateConversation).mockResolvedValue({
        id: 'convo-1',
      } as any);
      vi.mocked(chunkRepository.countByRepository).mockResolvedValue(0);

      const response = await ragService.askQuestion(
        mockUserId,
        mockRepoId,
        'Where is database schema?'
      );

      expect(response.answer).toContain('This repository has not been indexed yet');
      expect(response.citations).toHaveLength(0);
      expect(chatRepository.createMessage).toHaveBeenCalledTimes(2); // user + assistant
    });

    it('returns ungrounded fallback when no relevant code matches query vector', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chatRepository.findOrCreateConversation).mockResolvedValue({
        id: 'convo-1',
      } as any);
      vi.mocked(chunkRepository.countByRepository).mockResolvedValue(50);
      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue([]); // No similar chunks

      const response = await ragService.askQuestion(
        mockUserId,
        mockRepoId,
        'Something completely unrelated'
      );

      expect(response.answer).toContain('could not find code relevant to your question');
      expect(response.citations).toHaveLength(0);
    });

    it('retrieves similar chunks, generates answer, and returns structured citations', async () => {
      vi.mocked(repositoryRepository.findByIdAndUser).mockResolvedValue(mockRepo as any);
      vi.mocked(chatRepository.findOrCreateConversation).mockResolvedValue({
        id: 'convo-1',
      } as any);
      vi.mocked(chunkRepository.countByRepository).mockResolvedValue(10);

      const mockChunks = [
        {
          id: 'chunk-1',
          filePath: 'src/middleware/auth.middleware.ts',
          language: 'typescript',
          startLine: 1,
          endLine: 10,
          symbolName: 'requireAuth',
          content: 'export function requireAuth(req, res, next) { ... }',
          similarity: 0.88,
        },
        {
          id: 'chunk-2',
          filePath: 'src/routes/auth.routes.ts',
          language: 'typescript',
          startLine: 1,
          endLine: 15,
          symbolName: null,
          content: 'authRouter.get("/me", requireAuth, ...)',
          similarity: 0.76,
        },
      ];

      vi.mocked(chunkRepository.findSimilarChunks).mockResolvedValue(mockChunks);

      const response = await ragService.askQuestion(
        mockUserId,
        mockRepoId,
        'Explain authentication in this project.'
      );

      expect(response.answer).toBeDefined();
      expect(response.citations).toHaveLength(2);
      expect(response.citations[0]).toMatchObject({
        filePath: 'src/middleware/auth.middleware.ts',
        startLine: 1,
        endLine: 10,
        symbolName: 'requireAuth',
        similarity: 0.88,
      });

      // Verify message persistence
      expect(chatRepository.createMessage).toHaveBeenCalledWith(
        'convo-1',
        'user',
        'Explain authentication in this project.'
      );
      expect(chatRepository.createMessage).toHaveBeenCalledWith(
        'convo-1',
        'assistant',
        expect.any(String),
        expect.any(Array)
      );
    });
  });
});

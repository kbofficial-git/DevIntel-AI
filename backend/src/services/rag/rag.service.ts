import { AppError } from '../../middleware/errorHandler';
import { repositoryRepository } from '../../repositories/repository.repository';
import { chunkRepository, RetrievedChunk } from '../../repositories/chunk.repository';
import { chatRepository } from '../../repositories/chat.repository';
import { getAIProvider } from '../ai/ai.provider';

import { env } from '../../config/env';
import { AIMetadata } from '../ai/schemas/review.schema';

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  similarity: number;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversationId: string;
  meta?: AIMetadata;
}

export const ragService = {
  async askQuestion(
    userId: string,
    repositoryId: string,
    question: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Get or create conversation thread
    let conversation;
    if (conversationId) {
      conversation = await chatRepository.getConversation(conversationId, userId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404, 'NOT_FOUND');
      }
    } else {
      conversation = await chatRepository.findOrCreateConversation(
        userId,
        repositoryId,
        question.slice(0, 40)
      );
    }

    // 3. Verify repository has indexed chunks
    const chunkCount = await chunkRepository.countByRepository(repositoryId);
    if (chunkCount === 0) {
      const fallbackAnswer =
        'This repository has not been indexed yet. Please trigger indexing on the Repositories page before asking codebase questions.';

      await chatRepository.createMessage(conversation.id, 'user', question);
      await chatRepository.createMessage(conversation.id, 'assistant', fallbackAnswer);

      return {
        answer: fallbackAnswer,
        citations: [],
        conversationId: conversation.id,
      };
    }

    // 4. Generate question vector embedding
    const aiProvider = getAIProvider();
    const queryEmbedding = await aiProvider.generateEmbedding(question);

    // 5. Retrieve top relevant chunks from pgvector
    const topChunks: RetrievedChunk[] = await chunkRepository.findSimilarChunks(
      repositoryId,
      queryEmbedding,
      6,
      0.35
    );

    // 6. Handle case where no relevant chunks are found
    if (topChunks.length === 0) {
      const ungroundedAnswer =
        'I searched the repository vector index but could not find code relevant to your question. Please verify the component or file name you are asking about.';

      await chatRepository.createMessage(conversation.id, 'user', question);
      await chatRepository.createMessage(conversation.id, 'assistant', ungroundedAnswer);

      return {
        answer: ungroundedAnswer,
        citations: [],
        conversationId: conversation.id,
      };
    }

    // 7. Assemble bounded context
    const contextBlocks = topChunks
      .map(
        (chunk, idx) =>
          `<chunk index="${idx + 1}" file="${chunk.filePath}" lines="${chunk.startLine}-${chunk.endLine}"${
            chunk.symbolName ? ` symbol="${chunk.symbolName}"` : ''
          }>\n${chunk.content}\n</chunk>`
      )
      .join('\n\n');

    const systemPrompt = `You are DevIntel AI, a senior engineering assistant explaining the "${repo.fullName}" codebase.
Ground your answer strictly in the provided code context.
Always cite file paths and line ranges when explaining architecture, functions, or patterns.
If the retrieved code does not contain sufficient details to answer completely, explicitly state what is missing.
Format code references and snippets using clean Markdown syntax.`;

    const userPrompt = `Context from indexed repository:
<context>
${contextBlocks}
</context>

Question: ${question}

Provide a well-structured, grounded answer with clear file and line citations.`;

    // 8. Generate completion
    const answer = await aiProvider.generateAnswer(systemPrompt, userPrompt);

    // 9. Format structured citations
    const citations: Citation[] = topChunks.map((chunk) => ({
      filePath: chunk.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      symbolName: chunk.symbolName,
      similarity: Math.round(chunk.similarity * 100) / 100,
      snippet: chunk.content.slice(0, 300),
    }));

    // 10. Persist user and assistant messages
    await chatRepository.createMessage(conversation.id, 'user', question);
    await chatRepository.createMessage(conversation.id, 'assistant', answer, citations);

    const latencyMs = Date.now() - startTime;

    return {
      answer,
      citations,
      conversationId: conversation.id,
      meta: {
        latencyMs,
        chunksRetrieved: topChunks.length,
        model: env.LLM_MODEL,
      },
    };
  },

  async getConversationHistory(userId: string, repositoryId: string, conversationId: string) {
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    const conversation = await chatRepository.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    return conversation;
  },

  async listConversations(userId: string, repositoryId: string) {
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    return chatRepository.listConversations(userId, repositoryId);
  },
};

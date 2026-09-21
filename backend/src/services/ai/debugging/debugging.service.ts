import { AppError } from '../../../middleware/errorHandler';
import { repositoryRepository } from '../../../repositories/repository.repository';
import { env } from '../../../config/env';
import { getAIProvider } from '../ai.provider';
import { contextRetriever } from '../retrieval/contextRetriever';
import { buildDebugPrompts } from '../prompts/debug.prompt';
import {
  DebugInput,
  DebugResult,
  debugLLMOutputSchema,
} from '../schemas/debug.schema';

export const debuggingService = {
  async debug(
    userId: string,
    repositoryId: string,
    input: DebugInput
  ): Promise<DebugResult> {
    const startTime = Date.now();

    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Identify potential affected files from stack trace & explicit filePath input
    const extractedPaths = input.stackTrace
      ? contextRetriever.extractFilesFromStackTrace(input.stackTrace)
      : [];

    if (input.filePath) {
      extractedPaths.push(input.filePath);
    }

    // 3. Retrieve relevant context (targeted file chunks + error query embedding)
    const { chunks, citations } = await contextRetriever.retrieveContext(
      repositoryId,
      {
        filePaths: extractedPaths,
        queryText: `${input.errorMessage} ${input.context || ''}`.trim(),
        maxChunks: 8,
      }
    );

    // 4. Assemble bounded, injection-defended debug prompts
    const { systemPrompt, userMessage } = buildDebugPrompts(
      repo.fullName,
      input.errorMessage,
      input.stackTrace,
      input.context,
      input.filePath,
      chunks
    );

    // 5. Generate structured diagnostic output via LLM
    const aiProvider = getAIProvider();
    const llmOutput = await aiProvider.generateStructured(
      systemPrompt,
      userMessage,
      debugLLMOutputSchema
    );

    const latencyMs = Date.now() - startTime;

    return {
      ...llmOutput,
      citations,
      meta: {
        latencyMs,
        chunksRetrieved: chunks.length,
        model: env.LLM_MODEL,
      },
    };
  },
};

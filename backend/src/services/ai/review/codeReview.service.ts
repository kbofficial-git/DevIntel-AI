import { AppError } from '../../../middleware/errorHandler';
import { repositoryRepository } from '../../../repositories/repository.repository';
import { env } from '../../../config/env';
import { getAIProvider } from '../ai.provider';
import { contextRetriever } from '../retrieval/contextRetriever';
import { buildReviewPrompts } from '../prompts/review.prompt';
import {
  ReviewInput,
  CodeReviewResult,
  codeReviewLLMOutputSchema,
} from '../schemas/review.schema';

export const codeReviewService = {
  async review(
    userId: string,
    repositoryId: string,
    input: ReviewInput
  ): Promise<CodeReviewResult> {
    const startTime = Date.now();

    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Identify target files from unified diff
    const affectedFiles = contextRetriever.extractFilesFromDiff(input.diff);

    // 3. Retrieve relevant context (targeted file chunks + semantic fallback)
    const { chunks, citations } = await contextRetriever.retrieveContext(
      repositoryId,
      {
        filePaths: affectedFiles,
        queryText: input.title || input.description || input.diff.slice(0, 1000),
        maxChunks: 8,
      }
    );

    // 4. Assemble bounded, injection-defended review prompts
    const { systemPrompt, userMessage } = buildReviewPrompts(
      repo.fullName,
      input.diff,
      input.title,
      input.description,
      chunks
    );

    // 5. Generate structured review output via LLM
    const aiProvider = getAIProvider();
    const llmOutput = await aiProvider.generateStructured(
      systemPrompt,
      userMessage,
      codeReviewLLMOutputSchema
    );

    // 6. Enforce explicit "no significant issues found" convention when clean
    if (!llmOutput.hasIssues || llmOutput.findings.length === 0) {
      llmOutput.hasIssues = false;
      llmOutput.findings = [];
      llmOutput.noIssuesMessage = llmOutput.noIssuesMessage || 'no significant issues found';
    }

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

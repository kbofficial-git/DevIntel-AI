import { AppError } from '../../../middleware/errorHandler';
import { repositoryRepository } from '../../../repositories/repository.repository';
import { env } from '../../../config/env';
import { getAIProvider } from '../ai.provider';
import { contextRetriever } from '../retrieval/contextRetriever';
import { buildPlanPrompts } from '../prompts/plan.prompt';
import {
  PlanInput,
  ImplementationPlanResult,
  planLLMOutputSchema,
} from '../schemas/plan.schema';

export const planningService = {
  async createPlan(
    userId: string,
    repositoryId: string,
    input: PlanInput
  ): Promise<ImplementationPlanResult> {
    const startTime = Date.now();

    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Retrieve architectural and relevant context based on feature request
    const { chunks, citations } = await contextRetriever.retrieveContext(
      repositoryId,
      {
        queryText: `${input.request} ${input.context || ''}`.trim(),
        maxChunks: 8,
      }
    );

    // 3. Assemble bounded, injection-defended planning prompts
    const { systemPrompt, userMessage } = buildPlanPrompts(
      repo.fullName,
      input.request,
      input.context,
      chunks
    );

    // 4. Generate structured architectural plan via LLM (read-only)
    const aiProvider = getAIProvider();
    const llmOutput = await aiProvider.generateStructured(
      systemPrompt,
      userMessage,
      planLLMOutputSchema
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

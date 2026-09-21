import OpenAI from 'openai';
import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

import { z } from 'zod';

export interface EmbeddingProvider {
  readonly dimension: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface CompletionProvider {
  generateAnswer(systemPrompt: string, userMessage: string): Promise<string>;
  generateStructured<T>(
    systemPrompt: string,
    userMessage: string,
    schema: z.ZodSchema<T>
  ): Promise<T>;
}

export interface AIProvider extends EmbeddingProvider, CompletionProvider {
  readonly name: string;
}

/**
 * Concrete OpenAI Provider using official OpenAI client.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly dimension = env.EMBEDDING_DIMENSION;
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      if (!env.AI_API_KEY) {
        throw new AppError(
          'AI_API_KEY is not configured. Please add an OpenAI API key in your environment.',
          503,
          'SERVICE_UNAVAILABLE'
        );
      }
      this.client = new OpenAI({ apiKey: env.AI_API_KEY });
    }
    return this.client;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const client = this.getClient();
    try {
      const response = await client.embeddings.create({
        model: env.EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error({ err: error }, 'OpenAI embedding generation failed');
      throw new AppError('Failed to generate vector embedding from AI provider', 502, 'BAD_GATEWAY');
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const client = this.getClient();

    try {
      // OpenAI handles arrays of strings in embeddings.create
      const response = await client.embeddings.create({
        model: env.EMBEDDING_MODEL,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      logger.error({ err: error, count: texts.length }, 'OpenAI batch embedding generation failed');
      throw new AppError('Failed to generate batch vector embeddings from AI provider', 502, 'BAD_GATEWAY');
    }
  }

  async generateAnswer(systemPrompt: string, userMessage: string): Promise<string> {
    const client = this.getClient();
    try {
      const response = await client.chat.completions.create({
        model: env.LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content || 'No answer generated.';
    } catch (error) {
      logger.error({ err: error }, 'OpenAI chat completion failed');
      throw new AppError('Failed to generate AI response from completion provider', 502, 'BAD_GATEWAY');
    }
  }

  async generateStructured<T>(
    systemPrompt: string,
    userMessage: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const client = this.getClient();
    try {
      const response = await client.chat.completions.create({
        model: env.LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new AppError('AI provider returned empty response', 502, 'BAD_GATEWAY');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch (parseError) {
        logger.error({ rawContent, parseError }, 'Failed to parse AI JSON response');
        throw new AppError('AI provider returned invalid JSON', 502, 'BAD_GATEWAY');
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        logger.error(
          { errors: validated.error.errors, parsed },
          'AI structured output failed schema validation'
        );
        throw new AppError(
          `AI output failed schema validation: ${validated.error.errors.map((e) => e.message).join('; ')}`,
          502,
          'BAD_GATEWAY'
        );
      }

      return validated.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'OpenAI structured completion failed');
      throw new AppError('Failed to generate structured AI response', 502, 'BAD_GATEWAY');
    }
  }
}

/**
 * Deterministic Mock AI Provider for testing and local zero-cost verification.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'MockAI';
  readonly dimension = env.EMBEDDING_DIMENSION;

  /**
   * Generates a deterministic unit vector with dimension matching the configuration.
   */
  private generateDeterministicVector(seed: string): number[] {
    const hash = crypto.createHash('sha256').update(seed).digest();
    const vec: number[] = new Array(this.dimension);

    for (let i = 0; i < this.dimension; i++) {
      // Generate pseudo-random float between -1 and 1
      const byteVal = hash[i % hash.length];
      vec[i] = (byteVal / 128.0) - 1.0;
    }

    // Normalize to unit length (L2 norm)
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((val) => val / norm);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateDeterministicVector(t));
  }

  async generateAnswer(systemPrompt: string, userMessage: string): Promise<string> {
    return `[Mock AI Response] Based on the indexed repository context, here is an explanation for "${userMessage}":

The relevant logic was located in the retrieved codebase files. Authentication, database access, and routing follow standard architectural layers.`;
  }

  async generateStructured<T>(
    systemPrompt: string,
    userMessage: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const lowerUser = userMessage.toLowerCase();
    const lowerSystem = systemPrompt.toLowerCase();

    let mockObject: unknown;

    if (lowerSystem.includes('code review') || lowerSystem.includes('review directives')) {
      // Code Review Mock
      const isClean = lowerUser.includes('clean') || lowerUser.includes('no-issues') || lowerUser.includes('perfect');

      if (isClean) {
        mockObject = {
          summary: 'The proposed diff is clean and adheres to repository standards.',
          hasIssues: false,
          noIssuesMessage: 'no significant issues found',
          findings: [],
        };
      } else {
        mockObject = {
          summary: 'Review identified potential security and correctness concerns in proposed diff.',
          hasIssues: true,
          findings: [
            {
              severity: 'HIGH',
              category: 'SECURITY',
              title: 'Unvalidated user input in SQL or query parameter',
              explanation: 'The proposed change interpolates input directly without parameterization.',
              evidence: 'const query = `SELECT * FROM users WHERE id = ${req.params.id}`;',
              suggestedFix: 'Use parameterized queries: prisma.$queryRaw`SELECT * FROM users WHERE id = ${req.params.id}`',
              filePath: 'src/repositories/example.repository.ts',
              startLine: 24,
              endLine: 28,
              confidence: 0.95,
            },
            {
              severity: 'LOW',
              category: 'MAINTAINABILITY',
              title: 'Missing explicit return type annotation',
              explanation: 'Exported service method relies on implicit TypeScript return type inference.',
              evidence: 'export async function processData(input: string)',
              suggestedFix: 'export async function processData(input: string): Promise<ProcessResult>',
              filePath: 'src/services/example.service.ts',
              startLine: 10,
              endLine: 12,
              confidence: 0.85,
            },
          ],
        };
      }
    } else if (lowerSystem.includes('debugging') || lowerSystem.includes('debugging directives')) {
      // Debugging Mock
      const isUncertain = lowerUser.includes('uncertain') || lowerUser.includes('low-confidence') || lowerUser.includes('ambiguous');

      mockObject = {
        summary: 'Unhandled null reference encountered during entity lookup.',
        probableCause: 'The repository query returned null for the specified identifier, leading to an uncaught TypeError on property access.',
        confidence: isUncertain ? 'LOW' : 'HIGH',
        evidence: 'TypeError: Cannot read properties of null (reading "id") in findById() call stack.',
        suggestedFix: 'if (!entity) {\n  throw new AppError("Entity not found", 404, "NOT_FOUND");\n}',
        affectedFiles: ['src/services/entity.service.ts', 'src/controllers/entity.controller.ts'],
        testingStrategy: 'Add a unit test checking that passing a non-existent entity ID returns a 404 response instead of throwing 500.',
        uncertaintyNotes: isUncertain ? 'Retrieved codebase context does not show the schema definition for this table.' : undefined,
      };
    } else if (lowerSystem.includes('planning') || lowerSystem.includes('planning directives')) {
      // Planning Mock
      mockObject = {
        summary: 'Implementation plan for the requested capability integrating with existing modular architecture.',
        assumptions: [
          'PostgreSQL and pgvector remain the primary persistence and retrieval store.',
          'Repository ownership authorization is enforced across all newly introduced endpoints.',
        ],
        affectedFiles: [
          {
            path: 'backend/src/services/feature.service.ts',
            reason: 'Encapsulate domain business logic',
            expectedChange: 'Create service methods and orchestrate data flow',
          },
          {
            path: 'backend/src/controllers/feature.controller.ts',
            reason: 'Expose HTTP endpoints with Zod validation',
            expectedChange: 'Implement request handlers and status mapping',
          },
          {
            path: 'backend/src/routes/feature.routes.ts',
            reason: 'Mount secured route endpoints',
            expectedChange: 'Register Express router with requireAuth middleware',
          },
        ],
        implementationSteps: [
          {
            order: 1,
            title: 'Define Domain Schemas & Interfaces',
            description: 'Create Zod schemas for input validation and output types.',
            filePaths: ['backend/src/services/feature.schema.ts'],
          },
          {
            order: 2,
            title: 'Implement Core Service Logic',
            description: 'Write domain service functions and integrate with persistence layers.',
            filePaths: ['backend/src/services/feature.service.ts'],
          },
          {
            order: 3,
            title: 'Expose API & Middleware',
            description: 'Add controller handlers and register routes with authentication middleware.',
            filePaths: ['backend/src/controllers/feature.controller.ts', 'backend/src/routes/feature.routes.ts'],
          },
        ],
        dependencies: ['Zod schema validation', 'Express session authentication'],
        risks: [
          'Potential latency on external AI calls; mitigated by bounded retrieval contexts and timeouts.',
        ],
        testingPlan: [
          'Unit tests for input validation with invalid payloads.',
          'Integration tests for authentication and repository ownership enforcement.',
          'Mock-based end-to-end tests verifying structured responses.',
        ],
        architecturalConsiderations: [
          'Keep business logic strictly in service layer without coupling to controllers.',
          'Ensure all operations are read-only and do not execute untrusted user code.',
        ],
      };
    } else {
      throw new AppError('Mock AI provider encountered unrecognized structured completion context', 500);
    }

    const validated = schema.safeParse(mockObject);
    if (!validated.success) {
      logger.error({ errors: validated.error.errors, mockObject }, 'Mock AI structured output failed schema');
      throw new AppError('Mock AI generated invalid schema structure', 500);
    }

    return validated.data;
  }
}

let activeProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!activeProvider) {
    if (env.AI_PROVIDER === 'mock' || env.NODE_ENV === 'test') {
      activeProvider = new MockAIProvider();
    } else {
      activeProvider = new OpenAIProvider();
    }
    logger.info({ provider: activeProvider.name, dimension: activeProvider.dimension }, 'AI Provider initialized');
  }
  return activeProvider;
}

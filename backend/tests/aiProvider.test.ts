import { describe, it, expect } from 'vitest';
import { MockAIProvider, OpenAIProvider } from '../src/services/ai/ai.provider';
import { AppError } from '../src/middleware/errorHandler';

describe('AI Provider Abstraction', () => {
  it('MockAIProvider produces deterministic normalized unit vectors of configured dimension', async () => {
    const provider = new MockAIProvider();
    expect(provider.dimension).toBe(1536);

    const vec1 = await provider.generateEmbedding('hello world');
    const vec2 = await provider.generateEmbedding('hello world');
    const vecDifferent = await provider.generateEmbedding('different text');

    expect(vec1).toHaveLength(1536);
    expect(vec2).toHaveLength(1536);
    expect(vec1).toEqual(vec2); // Deterministic
    expect(vec1).not.toEqual(vecDifferent);

    // Verify L2 norm is ~1.0
    const norm = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it('MockAIProvider batch generation returns expected count and dimensions', async () => {
    const provider = new MockAIProvider();
    const texts = ['function one() {}', 'class Two {}', 'const three = 3;'];
    const embeddings = await provider.generateBatchEmbeddings(texts);

    expect(embeddings).toHaveLength(3);
    embeddings.forEach((emb) => {
      expect(emb).toHaveLength(1536);
    });
  });

  it('OpenAIProvider throws actionable 503 error when API key is missing', async () => {
    const originalKey = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;

    const provider = new OpenAIProvider();
    // @ts-ignore: force unsetting client
    provider['client'] = null;

    await expect(provider.generateEmbedding('test')).rejects.toThrowError(AppError);

    process.env.AI_API_KEY = originalKey;
  });
});

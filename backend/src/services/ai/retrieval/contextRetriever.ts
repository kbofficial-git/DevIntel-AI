import { chunkRepository, RetrievedChunk } from '../../../repositories/chunk.repository';
import { getAIProvider } from '../ai.provider';
import { Citation } from '../schemas/review.schema';

export interface RetrievalOptions {
  filePaths?: string[];
  queryText?: string;
  maxChunks?: number;
  similarityThreshold?: number;
}

export const contextRetriever = {
  /**
   * Hybrid retrieval: combines targeted file-path lookups with semantic vector search.
   */
  async retrieveContext(
    repositoryId: string,
    options: RetrievalOptions
  ): Promise<{ chunks: RetrievedChunk[]; citations: Citation[] }> {
    const maxChunks = options.maxChunks ?? 8;
    const similarityThreshold = options.similarityThreshold ?? 0.35;
    const collectedChunks: RetrievedChunk[] = [];
    const seenIds = new Set<string>();

    // 1. Targeted file path retrieval (if specific files are identified)
    if (options.filePaths && options.filePaths.length > 0) {
      const cleanPaths = options.filePaths
        .map((p) => p.trim().replace(/^([ab]\/)/, '')) // Strip git a/ and b/ prefixes
        .filter((p) => p.length > 0);

      if (cleanPaths.length > 0) {
        const fileChunks = await chunkRepository.findByFilePaths(
          repositoryId,
          cleanPaths,
          maxChunks
        );

        for (const chunk of fileChunks) {
          if (!seenIds.has(chunk.id)) {
            seenIds.add(chunk.id);
            collectedChunks.push(chunk);
          }
        }
      }
    }

    // 2. Semantic vector retrieval (if query text provided and we have space)
    if (options.queryText && collectedChunks.length < maxChunks) {
      try {
        const aiProvider = getAIProvider();
        const queryEmbedding = await aiProvider.generateEmbedding(options.queryText);
        const remainingLimit = maxChunks - collectedChunks.length;

        const semanticChunks = await chunkRepository.findSimilarChunks(
          repositoryId,
          queryEmbedding,
          remainingLimit,
          similarityThreshold
        );

        for (const chunk of semanticChunks) {
          if (!seenIds.has(chunk.id)) {
            seenIds.add(chunk.id);
            collectedChunks.push(chunk);
          }
        }
      } catch (err) {
        // Semantic retrieval fallback: continue with file chunks if vector fails
      }
    }

    // 3. Format structured citations
    const citations: Citation[] = collectedChunks.map((chunk) => ({
      filePath: chunk.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      symbolName: chunk.symbolName,
      similarity: Math.round(chunk.similarity * 100) / 100,
      snippet: chunk.content.slice(0, 300),
    }));

    return {
      chunks: collectedChunks,
      citations,
    };
  },

  /**
   * Helper to extract file paths from a unified git diff.
   */
  extractFilesFromDiff(diff: string): string[] {
    const paths = new Set<string>();
    const lines = diff.split('\n');

    for (const line of lines) {
      // Matches: diff --git a/path/to/file.ts b/path/to/file.ts
      const gitMatch = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
      if (gitMatch) {
        paths.add(gitMatch[2]);
        continue;
      }

      // Matches: +++ b/path/to/file.ts
      const plusMatch = line.match(/^\+\+\+ b\/(.+?)$/);
      if (plusMatch && plusMatch[1] !== '/dev/null') {
        paths.add(plusMatch[1]);
        continue;
      }

      // Matches: --- a/path/to/file.ts
      const minusMatch = line.match(/^--- a\/(.+?)$/);
      if (minusMatch && minusMatch[1] !== '/dev/null') {
        paths.add(minusMatch[1]);
      }
    }

    return Array.from(paths);
  },

  /**
   * Helper to extract file paths from stack traces.
   */
  extractFilesFromStackTrace(stackTrace: string): string[] {
    const paths = new Set<string>();
    const lines = stackTrace.split('\n');

    for (const line of lines) {
      // Matches: at Object.<anonymous> (/path/to/file.ts:12:34) or at file.ts:12:34
      const match = line.match(/(?:at\s+.*?\s*\(|\bat\s+)(?:.*?[\/\\])?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+):\d+/);
      if (match && match[1]) {
        const candidate = match[1].replace(/\\/g, '/');
        if (!candidate.includes('node_modules')) {
          paths.add(candidate);
          const parts = candidate.split('/');
          const filename = parts[parts.length - 1];
          if (filename) {
            paths.add(filename);
          }
        }
      }
    }

    return Array.from(paths);
  },
};

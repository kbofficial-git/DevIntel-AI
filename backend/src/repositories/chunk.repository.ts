import { prisma } from '../config/database';
import crypto from 'crypto';

export interface ChunkWithEmbedding {
  repositoryId: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbolName?: string | null;
  content: string;
  contentHash: string;
  commitSha?: string | null;
  embedding: number[];
}

export interface RetrievedChunk {
  id: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  content: string;
  similarity: number;
}

export const chunkRepository = {
  async deleteByRepository(repositoryId: string) {
    return (prisma as any).codeChunk.deleteMany({
      where: { repositoryId },
    });
  },

  async countByRepository(repositoryId: string): Promise<number> {
    return (prisma as any).codeChunk.count({
      where: { repositoryId },
    });
  },

  async saveChunksWithEmbeddings(chunks: ChunkWithEmbedding[]) {
    if (chunks.length === 0) return 0;

    // Insert in batches of 25 to avoid parameter limit issues in postgres
    const batchSize = 25;
    let totalInserted = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      await Promise.all(
        batch.map((chunk) => {
          const id = crypto.randomUUID();
          const vectorStr = `[${chunk.embedding.join(',')}]`;

          return prisma.$executeRawUnsafe(
            `INSERT INTO code_chunks 
              (id, "repositoryId", "filePath", language, "startLine", "endLine", "symbolName", content, "contentHash", "commitSha", embedding, "createdAt", "updatedAt")
             VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector, NOW(), NOW())`,
            id,
            chunk.repositoryId,
            chunk.filePath,
            chunk.language,
            chunk.startLine,
            chunk.endLine,
            chunk.symbolName ?? null,
            chunk.content,
            chunk.contentHash,
            chunk.commitSha ?? null,
            vectorStr
          );
        })
      );
      totalInserted += batch.length;
    }

    return totalInserted;
  },

  async findSimilarChunks(
    repositoryId: string,
    queryEmbedding: number[],
    limit = 6,
    similarityThreshold = 0.35
  ): Promise<RetrievedChunk[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Query pgvector using cosine distance operator (<=>)
    const rawResults = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
         id, 
         "filePath", 
         language, 
         "startLine", 
         "endLine", 
         "symbolName", 
         content,
         1 - (embedding <=> $1::vector) as similarity
       FROM code_chunks
       WHERE "repositoryId" = $2
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector ASC
       LIMIT $3`,
      vectorStr,
      repositoryId,
      limit
    );

    return rawResults
      .map((row) => ({
        id: row.id,
        filePath: row.filePath,
        language: row.language,
        startLine: Number(row.startLine),
        endLine: Number(row.endLine),
        symbolName: row.symbolName,
        content: row.content,
        similarity: Number(row.similarity),
      }))
      .filter((chunk) => chunk.similarity >= similarityThreshold);
  },

  async findByFilePaths(
    repositoryId: string,
    filePaths: string[],
    limit = 10
  ): Promise<RetrievedChunk[]> {
    if (filePaths.length === 0) return [];

    const chunks = await (prisma as any).codeChunk.findMany({
      where: {
        repositoryId,
        filePath: { in: filePaths },
      },
      take: limit,
      orderBy: [{ filePath: 'asc' }, { startLine: 'asc' }],
    });

    return chunks.map((c: any) => ({
      id: c.id,
      filePath: c.filePath,
      language: c.language,
      startLine: c.startLine,
      endLine: c.endLine,
      symbolName: c.symbolName,
      content: c.content,
      similarity: 1.0, // Exact file path match
    }));
  },
};

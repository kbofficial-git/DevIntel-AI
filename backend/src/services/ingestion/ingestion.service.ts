import { IngestionStatus } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { repositoryRepository } from '../../repositories/repository.repository';
import { userRepository } from '../../repositories/user.repository';
import { ingestionRepository } from '../../repositories/ingestion.repository';
import { chunkRepository, ChunkWithEmbedding } from '../../repositories/chunk.repository';
import { githubService } from '../github/github.service';
import { fileFilterService } from './fileFilter.service';
import { codeChunkerService, CodeChunkResult } from './codeChunker.service';
import { addIngestionJob, IngestionJobData } from './queue.service';
import { getAIProvider } from '../ai/ai.provider';

export const ingestionService = {
  async triggerIngestion(userId: string, repositoryId: string) {
    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Check for active indexing jobs
    const latestJob = await ingestionRepository.getLatestJobByRepository(repositoryId);
    if (
      latestJob &&
      (latestJob.status === IngestionStatus.QUEUED || latestJob.status === IngestionStatus.IN_PROGRESS)
    ) {
      return { job: latestJob, alreadyRunning: true };
    }

    // 3. Create IngestionJob record
    const job = await ingestionRepository.createJob(repositoryId);

    // 4. Enqueue background job via BullMQ
    await addIngestionJob({
      jobId: job.id,
      repositoryId,
      userId,
    });

    return { job, alreadyRunning: false };
  },

  async getIngestionStatus(userId: string, repositoryId: string) {
    // 1. Enforce repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    const [latestJob, totalChunks] = await Promise.all([
      ingestionRepository.getLatestJobByRepository(repositoryId),
      chunkRepository.countByRepository(repositoryId),
    ]);

    return {
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        lastIndexedAt: repo.lastIndexedAt,
      },
      latestJob,
      totalChunks,
    };
  },

  async processIngestionJob(data: IngestionJobData) {
    const { jobId, repositoryId, userId } = data;
    logger.info({ jobId, repositoryId }, 'Executing repository ingestion');

    try {
      // 1. Update status to IN_PROGRESS
      await ingestionRepository.updateJobProgress(jobId, {
        status: IngestionStatus.IN_PROGRESS,
      });

      // 2. Retrieve user's GitHub token
      const user = await userRepository.findByIdWithToken(userId);
      if (!user || !user.githubToken) {
        throw new AppError('GitHub authentication token missing for user', 401, 'UNAUTHORIZED');
      }

      // 3. Retrieve repository details
      const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
      if (!repo) {
        throw new AppError('Repository not found', 404, 'NOT_FOUND');
      }

      // 4. Fetch repository tree from GitHub
      const treeData = await githubService.fetchRepositoryTree(
        user.githubToken,
        repo.owner,
        repo.name,
        repo.defaultBranch
      );

      // 5. Filter for eligible code files
      const eligibleFiles = treeData.tree
        .filter((item) => item.type === 'blob' && fileFilterService.isIndexableFile(item.path, item.size))
        .slice(0, env.MAX_REPO_FILES); // Cap file count for safety

      await ingestionRepository.updateJobProgress(jobId, {
        totalFiles: eligibleFiles.length,
        processedFiles: 0,
      });

      logger.info(
        { repo: repo.fullName, totalEligible: eligibleFiles.length },
        'Filtered eligible repository files'
      );

      // 6. Fetch contents and chunk files (concurrency = 5)
      const allChunks: CodeChunkResult[] = [];
      const concurrency = 5;

      for (let i = 0; i < eligibleFiles.length; i += concurrency) {
        const batch = eligibleFiles.slice(i, i + concurrency);
        const results = await Promise.all(
          batch.map(async (file) => {
            try {
              const content = await githubService.fetchBlobContent(
                user.githubToken,
                repo.owner,
                repo.name,
                file.sha
              );
              const lang = fileFilterService.detectLanguage(file.path);
              return codeChunkerService.chunkCode(file.path, content, lang);
            } catch (err) {
              logger.warn({ file: file.path, err }, 'Failed to process individual file blob; skipping');
              return [];
            }
          })
        );

        for (const fileChunks of results) {
          allChunks.push(...fileChunks);
        }

        // Update progress count
        await ingestionRepository.updateJobProgress(jobId, {
          processedFiles: Math.min(i + concurrency, eligibleFiles.length),
        });
      }

      logger.info(
        { repo: repo.fullName, totalChunks: allChunks.length },
        'Extracted code chunks from files'
      );

      // 7. Generate embeddings in batches of 50
      const aiProvider = getAIProvider();
      const chunksWithEmbeddings: ChunkWithEmbedding[] = [];
      const embeddingBatchSize = 50;

      for (let i = 0; i < allChunks.length; i += embeddingBatchSize) {
        const chunkBatch = allChunks.slice(i, i + embeddingBatchSize);
        const texts = chunkBatch.map((c) => `File: ${c.filePath}\n${c.content}`);
        const embeddings = await aiProvider.generateBatchEmbeddings(texts);

        for (let j = 0; j < chunkBatch.length; j++) {
          const chunk = chunkBatch[j];
          chunksWithEmbeddings.push({
            repositoryId,
            filePath: chunk.filePath,
            language: chunk.language,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            symbolName: chunk.symbolName,
            content: chunk.content,
            contentHash: chunk.contentHash,
            commitSha: treeData.sha,
            embedding: embeddings[j],
          });
        }
      }

      // 8. Atomic Database Update (delete old chunks and save new chunks)
      await chunkRepository.deleteByRepository(repositoryId);
      await chunkRepository.saveChunksWithEmbeddings(chunksWithEmbeddings);

      // 9. Complete job
      await ingestionRepository.completeJob(jobId, chunksWithEmbeddings.length);
      logger.info(
        { repo: repo.fullName, totalChunks: chunksWithEmbeddings.length },
        'Repository ingestion completed successfully'
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown ingestion failure';
      await ingestionRepository.failJob(jobId, errorMsg);
      throw error;
    }
  },
};

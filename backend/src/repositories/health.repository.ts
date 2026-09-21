import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface DatabaseHealthResult {
  connected: boolean;
  pgvectorAvailable: boolean;
  latencyMs?: number;
  error?: string;
}

export class HealthRepository {
  async getDatabaseHealth(): Promise<DatabaseHealthResult> {
    const start = Date.now();
    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;

      // Check if pgvector extension is installed or enabled
      let pgvectorAvailable = false;
      try {
        const extensions = await prisma.$queryRaw<{ extname: string }[]>`
          SELECT extname FROM pg_extension WHERE extname = 'vector'
        `;
        pgvectorAvailable = Array.isArray(extensions) && extensions.length > 0;
      } catch {
        // If extension table can't be read or pgvector is not initialized yet
        pgvectorAvailable = false;
      }

      return {
        connected: true,
        pgvectorAvailable,
        latencyMs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      logger.warn({ err: error }, 'HealthRepository: Database ping failed');
      return {
        connected: false,
        pgvectorAvailable: false,
        error: message,
      };
    }
  }
}

export const healthRepository = new HealthRepository();

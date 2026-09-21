import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root if available, then backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/devintel_ai?schema=public'),
  LOG_LEVEL: z.string().default('info'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  GITHUB_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/auth/github/callback'),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Redis (BullMQ queues)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // AI & Embeddings
  AI_PROVIDER: z.enum(['openai', 'mock']).default('openai'),
  AI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSION: z.coerce.number().default(1536),

  // Ingestion Limits
  MAX_FILE_SIZE_KB: z.coerce.number().default(500),
  MAX_REPO_FILES: z.coerce.number().default(500),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120), // 120 req/min for general API
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(20), // 20 req/min for AI endpoints
});

// In test environment, provide safe defaults for required credentials
const testOverrides =
  process.env.NODE_ENV === 'test'
    ? {
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'test-client-id',
        GITHUB_CLIENT_SECRET:
          process.env.GITHUB_CLIENT_SECRET || 'test-client-secret',
        SESSION_SECRET:
          process.env.SESSION_SECRET ||
          'test-session-secret-at-least-32-chars-long',
        AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
        AI_API_KEY: process.env.AI_API_KEY || 'test-api-key',
      }
    : {};

const parseEnv = () => {
  const input = { ...process.env, ...testOverrides };
  const result = envSchema.safeParse(input);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  const parsed = result.data;
  // Ensure DATABASE_URL is set in process.env for Prisma
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = parsed.DATABASE_URL;
  }
  return parsed;
};

export const env = parseEnv();

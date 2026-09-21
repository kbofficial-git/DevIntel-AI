import { healthRepository, DatabaseHealthResult } from '../repositories/health.repository';
import { checkRedisHealth } from './ingestion/queue.service';
import { env } from '../config/env';

export interface ComponentStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  components: {
    postgres: ComponentStatus;
    redis: ComponentStatus;
  };
  database: DatabaseHealthResult;
}

export class HealthService {
  async checkHealth(): Promise<HealthCheckResponse> {
    const [dbHealth, redisHealth] = await Promise.all([
      healthRepository.getDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const isPostgresHealthy = dbHealth.connected;
    const isRedisHealthy = redisHealth.status === 'healthy';

    return {
      status: isPostgresHealthy && isRedisHealthy ? 'ok' : 'degraded',
      service: 'devintel-backend',
      version: '0.1.0',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      components: {
        postgres: {
          status: isPostgresHealthy ? 'healthy' : 'unhealthy',
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
        redis: {
          status: redisHealth.status,
          error: redisHealth.error,
        },
      },
      database: dbHealth,
    };
  }
}

export const healthService = new HealthService();

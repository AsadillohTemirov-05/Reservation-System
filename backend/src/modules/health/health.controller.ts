import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../../database/database.service';
import { ExpirationService } from '../expiration/expiration.service';
import { RedisService } from 'src/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly expirationService: ExpirationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-02-17T10:00:00.000Z',
        uptime: 3600,
        services: {
          database: {
            connected: true,
            state: 'connected',
            ping: true,
          },
          redis: {
            connected: true,
            ping: true,
          },
          expiration: {
            pendingExpiredCount: 0,
          },
        },
      },
    },
  })
  async check() {
    const [dbConnected, dbPing, redisPing, expirationStats] =
      await Promise.all([
        this.databaseService.isConnected(),
        this.databaseService.ping(),
        this.redisService.ping(),
        this.expirationService.getStats(),
      ]);

    const redisConnected = this.redisService.isConnected();

    const isHealthy = dbConnected && dbPing;

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        database: {
          connected: dbConnected,
          state: this.databaseService.getConnectionState(),
          ping: dbPing,
        },
        redis: {
          connected: redisConnected,
          ping: redisPing,
        },
        expiration: {
          pendingExpiredCount: expirationStats.pendingExpiredCount,
        },
      },
    };
  }
}
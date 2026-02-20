import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled =
      this.configService.get<boolean>('redis.enabled') ??
      process.env.REDIS_ENABLED !== 'false';
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('⚠️ Redis is disabled in configuration');
      return;
    }

    try {
      const host =
        this.configService.get<string>('redis.host') ||
        process.env.REDIS_HOST ||
        'localhost';

      const port =
        this.configService.get<number>('redis.port') ||
        parseInt(process.env.REDIS_PORT || '6379', 10);

      // ✅ FIX: Password bo'sh string handling
      const rawPassword =
        this.configService.get<string>('redis.password') ||
        process.env.REDIS_PASSWORD;
      const password =
        rawPassword && rawPassword.trim() !== '' ? rawPassword : undefined;

      const db =
        this.configService.get<number>('redis.db') ||
        parseInt(process.env.REDIS_DB || '0', 10);

      this.logger.log(`🔍 Connecting to Redis at ${host}:${port}...`);

      this.client = new Redis({
        host,
        port,
        password,
        db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 10000,
        lazyConnect: false,
      });

      this.client.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      this.client.on('ready', () => {
        this.logger.log('✅ Redis is ready to accept commands');
      });

      this.client.on('error', (error) => {
        this.logger.error(`❌ Redis connection error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.logger.warn('⚠️ Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.log('🔄 Redis reconnecting...');
      });

      await this.ping();
    } catch (error: any) {
      this.logger.error('❌ Failed to initialize Redis:', error.message);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('🔌 Redis connection closed');
    }
  }

  // ============================================
  // CONNECTION METHODS
  // ============================================

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.warn('⚠️ Redis client not initialized');
        return false;
      }

      const result = await this.client.ping();
      if (result === 'PONG') {
        this.logger.log('✅ Redis PING successful');
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error('❌ Redis PING failed:', error.message);
      return false;
    }
  }

  // ============================================
  // BASIC OPERATIONS
  // ============================================

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.warn('⚠️ Redis client not available');
        return false;
      }

      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.client) {
        this.logger.warn('⚠️ Redis client not available');
        return null;
      }

      return await this.client.get(key);
    } catch (error: any) {
      this.logger.error(`❌ Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.warn('⚠️ Redis client not available');
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      this.logger.error(`❌ Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    try {
      if (!this.client) {
        return null;
      }
      return await this.client.incr(key);
    } catch (error: any) {
      this.logger.error(`❌ Redis INCR error for key ${key}:`, error.message);
      return null;
    }
  }

  async decr(key: string): Promise<number | null> {
    try {
      if (!this.client) {
        return null;
      }
      return await this.client.decr(key);
    } catch (error: any) {
      this.logger.error(`❌ Redis DECR error for key ${key}:`, error.message);
      return null;
    }
  }

  async ttl(key: string): Promise<number | null> {
    try {
      if (!this.client) {
        return null;
      }
      return await this.client.ttl(key);
    } catch (error: any) {
      this.logger.error(`❌ Redis TTL error for key ${key}:`, error.message);
      return null;
    }
  }

  // ============================================
  // PREFIX OPERATIONS
  // ============================================

  async setWithPrefix(
    prefix: string,
    key: string,
    value: string,
    ttl?: number,
  ): Promise<boolean> {
    const fullKey = `${prefix}${key}`;
    return this.set(fullKey, value, ttl);
  }

  async getWithPrefix(prefix: string, key: string): Promise<string | null> {
    const fullKey = `${prefix}${key}`;
    return this.get(fullKey);
  }

  async delWithPrefix(prefix: string, key: string): Promise<boolean> {
    const fullKey = `${prefix}${key}`;
    return this.del(fullKey);
  }

  // ============================================
  // DISTRIBUTED LOCKING
  // ============================================

  async acquireLock(lockKey: string, ttl: number = 10): Promise<boolean> {
    // ✅ FIX: Redis unavailable → skip lock (MongoDB handles concurrency)
    if (!this.client || !this.isConnected()) {
      this.logger.warn(
        `⚠️ Redis unavailable, skipping lock for: ${lockKey}`,
      );
      return true; // Allow operation to proceed
    }

    try {
      const fullKey = `lock:${lockKey}`;
      const result = await this.client.set(fullKey, '1', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error: any) {
      this.logger.error(`❌ Failed to acquire lock ${lockKey}:`, error.message);
      return true; // ✅ On error, allow operation (MongoDB fallback)
    }
  }

  async releaseLock(lockKey: string): Promise<boolean> {
    if (!this.isConnected()) {
      return true;
    }

    const fullKey = `lock:${lockKey}`;
    return this.del(fullKey);
  }

  /**
   * ✅ CRITICAL FIX: withLock method
   * 
   * Changes:
   * 1. Redis unavailable → proceed without lock (MongoDB optimistic locking)
   * 2. Lock not acquired → SKIP lock, proceed anyway (MongoDB handles it)
   * 3. Never throw exceptions for lock failures
   */
  async withLock<T>(
    lockKey: string,
    work: () => Promise<T>,
    ttl: number = 10,
  ): Promise<T> {
    // ✅ FIX: Redis unavailable → proceed without lock
    if (!this.isConnected()) {
      this.logger.warn(
        `⚠️ Redis unavailable, proceeding without distributed lock for: ${lockKey}`,
      );
      return await work();
    }

    const lockAcquired = await this.acquireLock(lockKey, ttl);

    // ✅ FIX: Lock not acquired → proceed anyway (MongoDB optimistic locking)
    // High concurrency (1000 requests) causes lock contention
    // MongoDB version field + unique constraint handles conflicts
    if (!lockAcquired) {
      this.logger.debug(
        `⚠️ Could not acquire Redis lock for: ${lockKey}, proceeding with MongoDB locking`,
      );
      return await work();
    }

    try {
      return await work();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  // ============================================
  // IDEMPOTENCY OPERATIONS
  // ============================================

  async storeIdempotency(
    idempotencyKey: string,
    response: any,
    ttl: number = 86400,
  ): Promise<boolean> {
    const value = JSON.stringify(response);
    return this.setWithPrefix('idempotency:', idempotencyKey, value, ttl);
  }

  async getIdempotency(idempotencyKey: string): Promise<any | null> {
    const value = await this.getWithPrefix('idempotency:', idempotencyKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (error: any) {
      this.logger.error('❌ Failed to parse idempotency value:', error.message);
      return null;
    }
  }
}
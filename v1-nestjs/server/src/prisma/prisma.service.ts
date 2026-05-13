import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Database access layer.
 *
 * Caching Strategy (future Redis integration):
 * - Frequently accessed read-heavy queries (project lists, user profiles, dashboard stats)
 *   should be cached with short TTL (30s-5min) via CacheService.
 * - Cache invalidation: on write operations, invalidate related cache keys.
 * - Pattern: cache-aside (check cache -> miss -> query DB -> set cache).
 * - Redis key prefix: "syncflow:" + entity type + ":" + id.
 * - Use CacheService from common/cache/cache.module.ts (in-memory placeholder, swap to Redis later).
 */

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

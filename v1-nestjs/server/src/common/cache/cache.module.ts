import { Injectable, Module, Global } from '@nestjs/common';

/**
 * CacheService - In-memory cache placeholder.
 *
 * Architecture notes for future Redis integration:
 * - Replace the internal Map with a Redis client (e.g. ioredis).
 * - The `get`/`set`/`del` API should remain the same.
 * - Add TTL support: keys auto-expire after the specified seconds.
 * - Redis connection config via REDIS_URL env var.
 * - Consider using @nestjs/common CacheModule + cache-manager with redis store
 *   when moving to production.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number | null; // null = no expiry
}

@Injectable()
export class CacheService {
  private store = new Map<string, CacheEntry>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
}

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}

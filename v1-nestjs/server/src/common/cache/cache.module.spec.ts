import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.module';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should return null for missing keys', async () => {
    expect(await service.get('nonexistent')).toBeNull();
  });

  it('should set and get a value', async () => {
    await service.set('key1', { name: 'test' });
    expect(await service.get('key1')).toEqual({ name: 'test' });
  });

  it('should delete a value', async () => {
    await service.set('key2', 'value2');
    expect(await service.get('key2')).toBe('value2');

    const deleted = await service.del('key2');
    expect(deleted).toBe(true);
    expect(await service.get('key2')).toBeNull();
  });

  it('should return false when deleting non-existent key', async () => {
    const deleted = await service.del('missing');
    expect(deleted).toBe(false);
  });

  it('should expire keys after TTL', async () => {
    jest.useFakeTimers();

    await service.set('ttl-key', 'data', 10); // 10 second TTL

    // Should exist immediately
    expect(await service.get('ttl-key')).toBe('data');

    // Advance time past TTL
    jest.advanceTimersByTime(11_000);

    expect(await service.get('ttl-key')).toBeNull();

    jest.useRealTimers();
  });
});

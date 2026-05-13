import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.module';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should publish and receive messages via subscribe', async () => {
    const received: unknown[] = [];

    service.subscribe('test-topic', (data) => {
      received.push(data);
    });

    await service.publish('test-topic', { message: 'hello' });
    await service.publish('test-topic', { message: 'world' });

    expect(received).toEqual([
      { message: 'hello' },
      { message: 'world' },
    ]);
  });

  it('should support unsubscribing', async () => {
    const received: unknown[] = [];

    const unsubscribe = service.subscribe('topic-a', (data) => {
      received.push(data);
    });

    await service.publish('topic-a', { id: 1 });
    expect(received).toHaveLength(1);

    unsubscribe();

    await service.publish('topic-a', { id: 2 });
    expect(received).toHaveLength(1); // no new messages
  });
});

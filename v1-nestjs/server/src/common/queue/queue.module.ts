import { Injectable, Module, Global } from '@nestjs/common';

/**
 * QueueService - In-memory message queue placeholder.
 *
 * Architecture notes for future RabbitMQ integration:
 * - Replace in-memory Map with amqplib / @nestjs/microservices RabbitMQ transport.
 * - Connection config via RABBITMQ_URL env var (amqp://user:pass@host:5672).
 * - Exchange: "syncflow.events" (topic exchange).
 * - Queues: syncflow.notifications, syncflow.approvals, syncflow.files, syncflow.audit.
 * - Use durable queues + persistent messages for reliability.
 * - Add dead-letter exchange (DLX) for failed message handling.
 * - Retry strategy: exponential backoff, max 3 retries.
 * - Consider using @nestjs/bull (Redis-based) as alternative if RabbitMQ is overkill.
 */

type MessageHandler = (data: unknown) => void | Promise<void>;

@Injectable()
export class QueueService {
  private handlers = new Map<string, MessageHandler[]>();

  /**
   * Publish a message to a topic.
   * In production, this will push to RabbitMQ exchange.
   */
  async publish(topic: string, data: unknown): Promise<void> {
    const handlers = this.handlers.get(topic) || [];
    for (const handler of handlers) {
      await handler(data);
    }
  }

  /**
   * Subscribe to a topic with a message handler.
   * In production, this will bind a queue to the RabbitMQ exchange.
   */
  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);

    // Return unsubscribe function
    return () => {
      const list = this.handlers.get(topic);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx !== -1) list.splice(idx, 1);
      }
    };
  }
}

@Global()
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: string,
    title: string,
    content: string,
    relatedType?: string,
    relatedId?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, content, relatedType, relatedId },
    });
  }

  async findAll(
    userId: string,
    options?: { isRead?: boolean; page?: number; pageSize?: number },
  ) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const where: Record<string, unknown> = { userId };
    if (options?.isRead !== undefined) where.isRead = options.isRead;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

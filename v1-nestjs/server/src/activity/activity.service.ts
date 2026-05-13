import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    entityName: string,
    projectId?: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        entityName,
        projectId,
        metadata,
      },
    });
  }

  async getByProject(
    projectId: string,
    options?: { page?: number; pageSize?: number },
  ) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activityLog.count({ where: { projectId } }),
    ]);

    return { data, total, page, pageSize };
  }

  async getByUser(
    userId: string,
    options?: { page?: number; pageSize?: number },
  ) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return { data, total, page, pageSize };
  }
}

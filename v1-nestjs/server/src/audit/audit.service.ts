import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, any>,
  ) {
    return this.prisma.auditLog.create({
      data: { userId, action, entityType, entityId, changes },
    });
  }

  async findAll(options?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const where: any = {};

    if (options?.userId) where.userId = options.userId;
    if (options?.entityType) where.entityType = options.entityType;
    if (options?.entityId) where.entityId = options.entityId;
    if (options?.action) where.action = options.action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cleanupOldLogs(retentionDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deletedCount: result.count, cutoffDate };
  }

  async archiveLogs(_retentionDays: number = 90) {
    // Placeholder for log archival logic
    // In production, this would move old logs to cold storage (S3, etc.)
    return { archivedCount: 0, message: 'Archive not yet implemented' };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaskStats() {
    return this.prisma.task.groupBy({
      by: ['status'],
      _count: { id: true },
    });
  }

  async getProjectStats() {
    return this.prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
    });
  }

  async getOverdueTasks() {
    return this.prisma.task.findMany({
      where: {
        planEnd: { lt: new Date() },
        status: { not: 'completed' },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { planEnd: 'asc' },
    });
  }
}

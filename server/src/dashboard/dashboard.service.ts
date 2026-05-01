import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const totalTasks = await this.prisma.task.count({});
    const completed = await this.prisma.task.count({ where: { status: 'completed' } });
    const inProgress = await this.prisma.task.count({ where: { status: 'in_progress' } });
    const overdue = await this.prisma.task.count({ where: { status: 'overdue' } });
    const notStarted = await this.prisma.task.count({ where: { status: 'not_started' } });
    const pendingAssign = await this.prisma.task.count({ where: { status: 'pending_assign' } });
    const urgent = await this.prisma.task.count({ where: { priority: 'urgent' } });

    return {
      totalTasks,
      completed,
      inProgress,
      overdue,
      notStarted,
      pendingAssign,
      urgent,
      warnings: 3,
      risks: 2,
      suggestions: 4,
    };
  }
}

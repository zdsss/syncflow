import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalTasks = await this.prisma.task.count({});
    const completed = await this.prisma.task.count({ where: { status: 'COMPLETED' } });
    const inProgress = await this.prisma.task.count({ where: { status: 'IN_PROGRESS' } });
    const overdue = await this.prisma.task.count({ where: { status: 'OVERDUE' } });
    const notStarted = await this.prisma.task.count({ where: { status: 'NOT_STARTED' } });
    const pendingAssign = await this.prisma.task.count({ where: { status: 'PENDING_ASSIGN' } });
    const urgent = await this.prisma.task.count({ where: { priority: 'URGENT' } });

    // Dynamic computation for warnings, risks, and suggestions
    const delayedProjects = await this.prisma.project.count({ where: { status: 'DELAYED' } });

    const atRisk = await this.prisma.task.count({
      where: { progress: { lt: 50 }, planEnd: { lt: sevenDaysFromNow, gt: now } },
    });

    const unassignedTasks = await this.prisma.task.count({
      where: { assigneeId: '' },
    });

    const stalledTasks = await this.prisma.task.count({
      where: { progress: 0, planStart: { lt: now } },
    });

    const warnings = overdue + delayedProjects;
    const risks = atRisk;
    const suggestions = unassignedTasks + stalledTasks;

    return {
      totalTasks,
      completed,
      inProgress,
      overdue,
      notStarted,
      pendingAssign,
      urgent,
      warnings,
      risks,
      suggestions,
    };
  }
}

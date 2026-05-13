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
        status: { not: 'COMPLETED' },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { planEnd: 'asc' },
    });
  }

  async getProjectProgress(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return null;

    const totalTasks = await this.prisma.task.count({ where: { projectId } });
    const completedTasks = await this.prisma.task.count({ where: { projectId, status: 'COMPLETED' } });

    return {
      project,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  async getUserWorkload(userId: string) {
    const tasks = await this.prisma.task.findMany({ where: { assigneeId: userId } });
    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total: tasks.length, byStatus };
  }

  async getDepartmentStats(departmentId: string) {
    const users = await (this.prisma as any).user.findMany({
      where: { departmentId },
      select: { id: true, name: true },
    });

    const userIds = users.map((u: { id: string }) => u.id);

    if (userIds.length === 0) return [];

    const taskGroups = await this.prisma.task.groupBy({
      by: ['assigneeId', 'status'],
      where: { assigneeId: { in: userIds } },
      _count: { id: true },
    });

    const statsMap = new Map<string, { taskCount: number; byStatus: Record<string, number> }>();
    for (const u of users) {
      statsMap.set(u.id, { taskCount: 0, byStatus: {} });
    }

    for (const group of taskGroups) {
      const entry = statsMap.get(group.assigneeId);
      if (entry) {
        entry.byStatus[group.status] = group._count.id;
        entry.taskCount += group._count.id;
      }
    }

    return users.map((u: { id: string; name: string }) => ({
      ...u,
      ...statsMap.get(u.id)!,
    }));
  }

  async exportTasks(filters?: { projectId?: string; status?: string; priority?: string }) {
    const where: any = {};
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    const tasks = await this.prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } });

    const header = 'ID,Name,Project,Status,Priority,Assignee,PlanStart,PlanEnd,Progress';
    const rows = tasks.map(t =>
      `${t.id},"${t.name}",${t.projectId},${t.status},${t.priority},${t.assigneeId || ''},${t.planStart || ''},${t.planEnd || ''},${t.progress}`,
    );
    return [header, ...rows].join('\n');
  }

  async exportProjects(filters?: { status?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const projects = await this.prisma.project.findMany({ where, orderBy: { createdAt: 'desc' } });

    const header = 'ID,Name,Status,Phase,Leader,StartDate,EndDate,Completion';
    const rows = projects.map(p =>
      `${p.id},"${p.name}",${p.status},${p.phase},${p.leaderId || ''},${p.startDate || ''},${p.endDate || ''},${p.completion}`,
    );
    return [header, ...rows].join('\n');
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(status?: string) {
    return this.prisma.project.findMany({
      where: status ? { status } as any : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    });
  }

  async create(data: any) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        category: data.category,
        phase: data.phase,
        status: data.status,
        leaderId: data.leaderId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : undefined,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : undefined,
        completion: data.completion,
        budget: data.budget,
      },
    });
  }

  async update(id: string, data: any) {
    // Check if completion is changing
    let oldCompletion: number | undefined;
    if (data.completion !== undefined) {
      const existing = await this.prisma.project.findUnique({ where: { id } });
      oldCompletion = existing?.completion;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data,
    });

    // Notify project members when completion changes
    if (data.completion !== undefined && oldCompletion !== undefined && data.completion !== oldCompletion) {
      const tasks = await this.prisma.task.findMany({
        where: { projectId: id },
        select: { assigneeId: true },
      });
      const memberIds = new Set(tasks.map((t) => t.assigneeId));
      if (project.leaderId) memberIds.add(project.leaderId);

      const title = `项目进度更新`;
      const content = `项目「${project.name}」进度已更新为 ${data.completion}%`;
      for (const memberId of memberIds) {
        await this.notificationsService.create(memberId, 'project_progress', title, content, 'project', id);
      }
    }

    return project;
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async searchProjects(keyword: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getProjectTree() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async getMilestones(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId, milestone: true },
      orderBy: { planEnd: 'asc' },
    });
  }

  async duplicateProject(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // Find source project with tasks
      const source = await tx.project.findUnique({
        where: { id },
        include: { tasks: true },
      });

      if (!source) {
        throw new NotFoundException('Project not found');
      }

      // Calculate task date offsets relative to source project start
      const sourceStart = source.startDate;

      // Create the new project
      const newProject = await tx.project.create({
        data: {
          name: `${source.name} (副本)`,
          description: source.description,
          parentId: source.parentId,
          category: source.category,
          phase: source.phase,
          status: 'NOT_STARTED',
          leaderId: source.leaderId,
          startDate: source.startDate,
          endDate: source.endDate,
          completion: 0,
          budget: source.budget,
        },
        include: {
          tasks: true,
          _count: { select: { tasks: true } },
        },
      });

      // Copy tasks if any exist
      if (source.tasks.length > 0) {
        const taskData = source.tasks.map((task) => {
          // Preserve relative date offsets
          let newPlanStart: Date | null = null;
          let newPlanEnd: Date | null = null;

          if (task.planStart) {
            const offsetMs = task.planStart.getTime() - sourceStart.getTime();
            newPlanStart = new Date(newProject.startDate.getTime() + offsetMs);
          }
          if (task.planEnd) {
            const offsetMs = task.planEnd.getTime() - sourceStart.getTime();
            newPlanEnd = new Date(newProject.startDate.getTime() + offsetMs);
          }

          return {
            name: task.name,
            description: task.description,
            projectId: newProject.id,
            type: task.type,
            priority: task.priority,
            status: 'NOT_STARTED' as const,
            assigneeId: task.assigneeId,
            participantIds: task.participantIds,
            planStart: newPlanStart,
            planEnd: newPlanEnd,
            plannedHours: task.plannedHours,
            loggedHours: 0,
            progress: 0,
            milestone: task.milestone,
            dependencies: task.dependencies,
            reminderStrategy: task.reminderStrategy,
            archiveLocation: task.archiveLocation,
            tags: task.tags,
          };
        });

        await tx.task.createMany({ data: taskData });
      }

      return newProject;
    });
  }

  async importProjects(data: any[]): Promise<{ imported: number; errors: string[] }> {
    if (!data || data.length === 0) {
      return { imported: 0, errors: [] };
    }

    const errors: string[] = [];
    const validRows: any[] = [];

    data.forEach((row, index) => {
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${index + 1}: missing required field "name"`);
      } else {
        validRows.push({
          name: row.name,
          description: row.description || '',
          category: row.category || 'development',
          phase: row.phase || 'SURVEY',
          status: 'NOT_STARTED',
          leaderId: row.leaderId || '',
          startDate: row.startDate ? new Date(row.startDate) : new Date(),
          endDate: row.endDate ? new Date(row.endDate) : new Date(),
          completion: 0,
          budget: row.budget ? parseFloat(row.budget) : null,
        });
      }
    });

    if (validRows.length === 0) {
      return { imported: 0, errors };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      return tx.project.createMany({ data: validRows });
    });

    return { imported: result.count, errors };
  }

  async setMilestone(taskId: string, isMilestone: boolean) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id: taskId },
      data: { milestone: isMilestone },
    });
  }
}

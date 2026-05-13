import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private wsService: WebSocketService,
    private auditService: AuditService,
    private activityService: ActivityService,
  ) {}

  async findAll(query: {
    status?: string;
    priority?: string;
    keyword?: string;
    projectId?: string;
    parentId?: string | null;
    rootOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.keyword) {
      where.name = { contains: query.keyword, mode: 'insensitive' };
    }

    if (query.rootOnly) {
      where.parentId = null;
    } else if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { children: true },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { children: true },
    });
  }

  async create(data: any) {
    const task = await this.prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        parentId: data.parentId,
        type: data.type,
        priority: data.priority,
        status: data.status,
        assigneeId: data.assigneeId,
        participantIds: data.participantIds,
        planStart: data.planStart ? new Date(data.planStart) : undefined,
        planEnd: data.planEnd ? new Date(data.planEnd) : undefined,
        actualStart: data.actualStart ? new Date(data.actualStart) : undefined,
        actualEnd: data.actualEnd ? new Date(data.actualEnd) : undefined,
        plannedHours: data.plannedHours,
        loggedHours: data.loggedHours,
        progress: data.progress,
        milestone: data.milestone,
        dependencies: data.dependencies,
        reminderStrategy: data.reminderStrategy,
        archiveLocation: data.archiveLocation,
        tags: data.tags,
      },
    });

    if (task.assigneeId) {
      this.wsService.emitTaskAssigned(task.id, task.assigneeId);
    }

    await this.auditService.log(data.assigneeId || 'system', 'create', 'task', task.id);

    await this.activityService.log(
      data.assigneeId || 'system',
      'created',
      'task',
      task.id,
      task.name,
      task.projectId,
    );

    return task;
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    const oldStatus = existing?.status;

    // Optimistic locking: check updatedAt matches expected value
    if (data.expectedUpdatedAt && existing) {
      const existingTime = new Date(existing.updatedAt).getTime();
      const expectedTime = new Date(data.expectedUpdatedAt).getTime();
      if (existingTime !== expectedTime) {
        throw new ConflictException('数据已被他人修改，请刷新后重试');
      }
    }

    const { expectedUpdatedAt, ...updateData } = data;

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    if (data.status && data.status !== oldStatus) {
      this.wsService.emitTaskStatusChanged(task.id, task.status, task.assigneeId);
    }

    // Compute changes
    const changes: Record<string, { old: any; new: any }> = {};
    for (const key of Object.keys(data)) {
      if (existing && (existing as any)[key] !== data[key]) {
        changes[key] = { old: (existing as any)[key], new: data[key] };
      }
    }

    await this.auditService.log(
      task.assigneeId || 'system',
      'update',
      'task',
      id,
      Object.keys(changes).length > 0 ? changes : undefined,
    );

    return task;
  }

  async remove(id: string) {
    const task = await this.prisma.task.delete({
      where: { id },
    });

    await this.auditService.log(task.assigneeId || 'system', 'delete', 'task', id);

    return task;
  }

  async addDependency(taskId: string, dependencyId: string, depType: string = 'FS') {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const depTask = await this.prisma.task.findUnique({ where: { id: dependencyId } });
    if (!depTask) throw new NotFoundException('Dependency task not found');

    // Check for circular dependency via TaskDependency table
    const reverseDep = await this.prisma.taskDependency.findFirst({
      where: { taskId: dependencyId, dependsOnId: taskId },
    });
    if (reverseDep) {
      throw new BadRequestException('Circular dependency detected');
    }

    // Check if already exists
    const existing = await this.prisma.taskDependency.findFirst({
      where: { taskId, dependsOnId: dependencyId },
    });
    if (existing) return task;

    await this.prisma.taskDependency.create({
      data: { taskId, dependsOnId: dependencyId, type: depType },
    });

    // Also maintain legacy field for backward compat
    const deps = ((task as any).dependencies || []) as string[];
    if (!deps.includes(dependencyId)) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { dependencies: [...deps, dependencyId] },
      });
    }

    return this.prisma.task.findUnique({ where: { id: taskId } });
  }

  async removeDependency(taskId: string, dependencyId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.taskDependency.deleteMany({
      where: { taskId, dependsOnId: dependencyId },
    });

    // Also maintain legacy field
    const deps = ((task as any).dependencies || []) as string[];
    return this.prisma.task.update({
      where: { id: taskId },
      data: { dependencies: deps.filter((d: string) => d !== dependencyId) },
    });
  }

  async getDependencies(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const depRecords = await this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { dependsOn: true },
    });

    return depRecords.map((r) => ({
      ...r.dependsOn,
      dependencyType: r.type,
    }));
  }

  async addTag(taskId: string, tag: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if ((task as any).tags.includes(tag)) return task;
    return this.prisma.task.update({
      where: { id: taskId },
      data: { tags: [...(task as any).tags, tag] },
    });
  }

  async removeTag(taskId: string, tag: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id: taskId },
      data: { tags: (task as any).tags.filter((t: string) => t !== tag) },
    });
  }

  async getTags(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    return (task as any).tags;
  }
}

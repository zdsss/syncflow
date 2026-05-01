import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    status?: string;
    priority?: string;
    keyword?: string;
    projectId?: string;
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

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
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
    });
  }

  async create(data: any) {
    return this.prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
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
  }

  async update(id: string, data: any) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}

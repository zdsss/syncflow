import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.project.findMany({
      where: status ? { status } : {},
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
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}

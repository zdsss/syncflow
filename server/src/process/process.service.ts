import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.processRoute.findMany({
      where: { projectId },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.processRoute.findUnique({
      where: { id },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async create(data: any) {
    return this.prisma.processRoute.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
      },
      include: { steps: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.processRoute.update({
      where: { id },
      data,
      include: { steps: true },
    });
  }

  async addStep(routeId: string, data: any) {
    return this.prisma.processStep.create({
      data: {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
        parameters: data.parameters,
        routeId,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.processRoute.delete({
      where: { id },
    });
  }
}

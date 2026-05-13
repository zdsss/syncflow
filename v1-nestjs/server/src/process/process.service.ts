import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) {}

  async createVersion(routeId: string, description?: string) {
    const maxResult = await this.prisma.processVersion.aggregate({
      where: { routeId },
      _max: { version: true },
    });
    const nextVersion = (maxResult._max.version ?? 0) + 1;

    return this.prisma.processVersion.create({
      data: {
        routeId,
        version: nextVersion,
        description,
        status: 'draft',
      },
    });
  }

  async getVersions(routeId: string) {
    return this.prisma.processVersion.findMany({
      where: { routeId },
      orderBy: { version: 'desc' },
    });
  }

  async publishVersion(routeId: string, versionId: string) {
    const version = await this.prisma.processVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.routeId !== routeId) {
      throw new NotFoundException('Version not found');
    }

    return this.prisma.processVersion.update({
      where: { id: versionId },
      data: { status: 'published' },
    });
  }

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
        parameters: data.parameters as any,
        routeId,
      },
    });
  }

  async updateStepParameters(
    routeId: string,
    stepId: string,
    parameters: Array<{
      name: string;
      targetValue: string | number;
      upperLimit?: string | number;
      lowerLimit?: string | number;
      unit?: string;
      inspectionMethod?: string;
    }>,
  ) {
    const step = await this.prisma.processStep.findFirst({
      where: { id: stepId, routeId },
    });
    if (!step) throw new NotFoundException('Step not found');

    return this.prisma.processStep.update({
      where: { id: stepId },
      data: { parameters },
    });
  }

  async getStepParameters(routeId: string, stepId: string) {
    const step = await this.prisma.processStep.findFirst({
      where: { id: stepId, routeId },
    });
    if (!step) throw new NotFoundException('Step not found');

    return step.parameters || [];
  }

  async remove(id: string) {
    return this.prisma.processRoute.delete({
      where: { id },
    });
  }

  async removeStep(routeId: string, stepId: string) {
    const step = await this.prisma.processStep.findFirst({
      where: { id: stepId, routeId },
    });

    if (!step) {
      throw new Error(`Step ${stepId} not found in route ${routeId}`);
    }

    await this.prisma.processStep.delete({
      where: { id: stepId },
    });

    // Decrement sortOrder for steps that were after the deleted step
    await this.prisma.processStep.updateMany({
      where: { routeId, sortOrder: { gt: step.sortOrder } },
      data: { sortOrder: { decrement: 1 } },
    });

    return { code: 0, message: 'Step removed' };
  }

  async reorderSteps(routeId: string, stepOrders: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      stepOrders.map((so) =>
        this.prisma.processStep.update({
          where: { id: so.id },
          data: { sortOrder: so.sortOrder },
        }),
      ),
    );

    return { code: 0, message: 'Steps reordered' };
  }

  async getRouteVisualization(routeId: string) {
    const route = await this.prisma.processRoute.findUnique({
      where: { id: routeId },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!route) return null;

    const paramCount = (route.steps as any[]).reduce((sum, step) => {
      const params = step.parameters as any[];
      return sum + (Array.isArray(params) ? params.length : 0);
    }, 0);

    return {
      ...route,
      stepCount: route.steps.length,
      totalParameters: paramCount,
    };
  }

  async getRouteStats(routeId: string) {
    const route = await this.prisma.processRoute.findUnique({
      where: { id: routeId },
      include: {
        steps: { select: { id: true } },
      },
    });
    if (!route) return null;

    const versionCount = await this.prisma.processVersion.count({
      where: { routeId },
    });

    return {
      routeId: route.id,
      name: route.name,
      stepCount: route.steps.length,
      versionCount,
    };
  }
}

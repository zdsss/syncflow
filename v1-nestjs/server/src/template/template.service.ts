import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    const templates = await this.prisma.template.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    return templates.map(t => t.type);
  }

  async duplicateTemplate(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.template.create({
      data: {
        name: `${template.name} (副本)`,
        type: template.type,
        description: template.description,
        content: template.content as any,
        usageCount: 0,
        creatorId: template.creatorId,
      } as any,
    });
  }

  async findAll(type?: string) {
    return this.prisma.template.findMany({
      where: type ? { type } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.template.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    type: string;
    description?: string;
    content: Record<string, unknown>;
    creatorId: string;
  }) {
    return this.prisma.template.create({ data: data as any });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.template.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.template.delete({ where: { id } });
  }

  async applyTemplate(
    templateId: string,
    projectData: { name: string; leaderId: string; startDate: string },
  ) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const content = template.content as any;

    // Create project
    const project = await this.prisma.project.create({
      data: {
        name: projectData.name,
        leaderId: projectData.leaderId,
        startDate: new Date(projectData.startDate),
        status: 'NOT_STARTED',
        phase: 'PLANNING',
        completion: 0,
        category: 'default',
        endDate: new Date(projectData.startDate),
      } as any,
    });

    // Create tasks from template phases
    const tasks = [];
    if (content?.phases) {
      for (const phase of content.phases) {
        for (const taskDef of phase.tasks || []) {
          const task = await this.prisma.task.create({
            data: {
              name: taskDef.name,
              projectId: project.id,
              priority: taskDef.priority || 'MEDIUM',
              status: 'NOT_STARTED',
              progress: 0,
              assigneeId: projectData.leaderId,
            } as any,
          });
          tasks.push(task);
        }
      }
    }

    // Increment usage count
    await this.prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return { project, tasks };
  }

  async exportTemplate(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    return {
      name: template.name,
      type: template.type,
      description: template.description,
      content: template.content,
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
    };
  }

  async importTemplate(data: Record<string, any>, creatorId: string) {
    if (!data.name || !data.type || !data.content) {
      throw new Error('Invalid template data: missing required fields (name, type, content)');
    }
    if (typeof data.content !== 'object' || Array.isArray(data.content)) {
      throw new Error('Invalid template data: content must be an object');
    }

    return this.prisma.template.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description || '',
        content: data.content,
        usageCount: 0,
        creatorId,
      } as any,
    });
  }

  async previewTemplate(templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template.content;
  }
}

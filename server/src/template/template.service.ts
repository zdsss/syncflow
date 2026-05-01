import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.template.create({ data });
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
}

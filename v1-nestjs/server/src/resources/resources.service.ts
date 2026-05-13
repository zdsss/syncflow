import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { type?: string; status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resource.count({ where }),
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
    return this.prisma.resource.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.resource.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        tags: data.tags,
        status: data.status,
        metadata: data.metadata as any,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.resource.update({
      where: { id },
      data,
    });
  }

  async getByType(type: string) {
    return this.prisma.resource.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTypes() {
    const resources = await this.prisma.resource.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    return resources.map(r => r.type);
  }

  async remove(id: string) {
    return this.prisma.resource.delete({
      where: { id },
    });
  }
}

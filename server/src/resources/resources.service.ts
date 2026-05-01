import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { type?: string; status?: string }) {
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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

  async remove(id: string) {
    return this.prisma.resource.delete({
      where: { id },
    });
  }
}

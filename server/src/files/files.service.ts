import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    type?: string;
    projectId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: Record<string, unknown> = { isDeleted: false };

    if (query.type) where.type = query.type;
    if (query.projectId) where.projectId = query.projectId;

    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        include: { project: true, uploader: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      code: 0,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.file.findFirst({
      where: { id, isDeleted: false },
      include: { project: true, uploader: true },
    });

    if (!data) return { code: 404, message: 'File not found' };
    return { code: 0, data };
  }

  async create(dto: {
    name: string;
    type: string;
    extension?: string;
    size: number | bigint;
    path: string;
    uploaderId: string;
    projectId?: string;
    parentFolderId?: string;
  }) {
    const data = await this.prisma.file.create({ data: dto as any });
    return { code: 0, data };
  }

  async update(id: string, dto: Record<string, unknown>) {
    const data = await this.prisma.file.update({
      where: { id },
      data: dto as any,
    });
    return { code: 0, data };
  }

  async remove(id: string) {
    await this.prisma.file.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { code: 0, message: 'File deleted' };
  }

  async getStats() {
    const totalFiles = await this.prisma.file.count({
      where: { isDeleted: false },
    });

    const usedResult = await this.prisma.file.aggregate({
      where: { isDeleted: false },
      _sum: { size: true },
    });

    const deletedResult = await this.prisma.file.aggregate({
      where: { isDeleted: true },
      _sum: { size: true },
    });

    const usedSpace = usedResult._sum.size || BigInt(0);
    const deletedSpace = deletedResult._sum.size || BigInt(0);
    const totalSpace = usedSpace + deletedSpace;

    return {
      code: 0,
      data: { totalFiles, usedSpace, totalSpace },
    };
  }
}

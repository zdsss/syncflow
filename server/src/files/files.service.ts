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

  async uploadFile(
    file: Express.Multer.File,
    body: { uploaderId: string; projectId?: string; parentFolderId?: string },
  ) {
    const name = file.originalname;
    const extension = name.includes('.')
      ? '.' + name.split('.').pop()
      : null;

    const existing = await this.prisma.file.findFirst({
      where: { name, projectId: body.projectId || null, isDeleted: false },
      orderBy: { version: 'desc' },
    });
    const version = existing ? existing.version + 1 : 1;

    const data = await this.prisma.file.create({
      data: {
        name,
        type: this.getFileType(extension),
        extension,
        size: BigInt(file.size),
        path: `/uploads/${file.filename}`,
        uploaderId: body.uploaderId,
        projectId: body.projectId,
        parentFolderId: body.parentFolderId,
        version,
      },
    });

    return { code: 0, data };
  }

  private getFileType(extension: string | null): string {
    if (!extension) return 'other';
    const map: Record<string, string> = {
      '.pdf': 'document',
      '.doc': 'document',
      '.docx': 'document',
      '.xls': 'document',
      '.xlsx': 'document',
      '.ppt': 'document',
      '.pptx': 'document',
      '.txt': 'document',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.mp4': 'video',
      '.avi': 'video',
      '.mov': 'video',
      '.mp3': 'audio',
      '.wav': 'audio',
      '.zip': 'archive',
      '.rar': 'archive',
      '.7z': 'archive',
      '.dwg': 'cad',
      '.dxf': 'cad',
      '.step': 'cad',
      '.stp': 'cad',
    };
    return map[extension.toLowerCase()] || 'other';
  }
}

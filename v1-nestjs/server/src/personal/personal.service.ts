import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.file.findMany({
      where: {
        uploaderId: userId,
        projectId: null,
        isDeleted: false,
      },
      include: { uploader: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string;
    type: string;
    extension?: string;
    size: number | bigint;
    path: string;
    uploaderId: string;
  }) {
    return this.prisma.file.create({
      data: {
        ...data,
        projectId: null,
      } as any,
    });
  }

  async remove(id: string) {
    return this.prisma.file.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // === Notes ===

  async createNote(userId: string, title: string, content: string, category?: string) {
    return this.prisma.note.create({
      data: {
        userId,
        title,
        content,
        category,
      },
    });
  }

  async getNotes(userId: string, options?: { page?: number; pageSize?: number; category?: string }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (options?.category) {
      where.category = options.category;
    }

    const [items, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.note.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateNote(id: string, data: { title?: string; content?: string; category?: string }) {
    return this.prisma.note.update({
      where: { id },
      data,
    });
  }

  async removeNote(id: string) {
    return this.prisma.note.delete({
      where: { id },
    });
  }
}

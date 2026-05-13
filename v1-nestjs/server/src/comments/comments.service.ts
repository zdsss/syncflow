import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    content: string;
    authorId: string;
    entityType: string;
    entityId: string;
    parentId?: string;
  }) {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        entityType: data.entityType,
        entityId: data.entityId,
        parentId: data.parentId,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.comment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, content: string) {
    try {
      return await this.prisma.comment.update({
        where: { id },
        data: { content },
      });
    } catch {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.comment.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
  }
}

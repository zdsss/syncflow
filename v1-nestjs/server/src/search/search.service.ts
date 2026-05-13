import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchAll(q: string) {
    if (!q || !q.trim()) {
      return { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] };
    }

    const [projects, tasks, files, bomItems, articles, users] = await Promise.all([
      this.prisma.project.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, status: true },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, status: true, priority: true },
        take: 10,
      }),
      this.prisma.file.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5,
      }),
      this.prisma.bomItem.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { partNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, partNumber: true },
        take: 5,
      }),
      this.prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, status: true },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, email: true },
        take: 5,
      }),
    ]);

    return { projects, tasks, files, bomItems, articles, users };
  }
}

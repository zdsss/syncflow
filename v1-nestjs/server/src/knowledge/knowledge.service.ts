import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  private readonly validTransitions: Record<string, string[]> = {
    draft: ['published', 'archived'],
    published: ['archived'],
    archived: [],
  };

  constructor(private prisma: PrismaService) {}

  async findAll(query: { category?: string; status?: string; keyword?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
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
    const article = await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return article;
  }

  async create(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    status?: string;
    authorId: string;
  }) {
    return this.prisma.article.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }

  async getArticleComments(articleId: string) {
    return this.prisma.comment.findMany({
      where: { entityType: 'article', entityId: articleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addArticleComment(articleId: string, authorId: string, content: string) {
    return this.prisma.comment.create({
      data: { content, authorId, entityType: 'article', entityId: articleId },
    });
  }

  async updateStatus(id: string, newStatus: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const allowed = this.validTransitions[article.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${article.status} to ${newStatus}`);
    }

    return this.prisma.article.update({ where: { id }, data: { status: newStatus } });
  }

  async getCategories() {
    const articles = await this.prisma.article.findMany({
      where: {},
      select: { category: true },
      distinct: ['category'],
    });
    return articles.map(a => a.category).filter(Boolean);
  }

  async searchArticles(keyword: string) {
    return this.prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getByCategory(category: string) {
    return this.prisma.article.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }
}

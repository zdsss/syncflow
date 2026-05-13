import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let prisma: PrismaService;

  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    content: 'Test content',
    category: 'general',
    tags: ['test'],
    status: 'draft',
    authorId: 'user-1',
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockArticleWithViewCount = {
    ...mockArticle,
    viewCount: 1,
  };

  const mockUpdate = jest.fn().mockResolvedValue(mockArticle);

  beforeEach(async () => {
    mockUpdate.mockClear();
    mockUpdate.mockResolvedValue(mockArticle);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        {
          provide: PrismaService,
          useValue: {
            comment: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            article: {
              findMany: jest.fn().mockResolvedValue([mockArticle]),
              findUnique: jest.fn().mockResolvedValue(mockArticle),
              count: jest.fn().mockResolvedValue(1),
              update: jest.fn().mockImplementation((args) => {
                if (args.data?.viewCount?.increment) {
                  return Promise.resolve(mockArticleWithViewCount);
                }
                return mockUpdate(args);
              }),
              create: jest.fn().mockResolvedValue(mockArticle),
              delete: jest.fn().mockResolvedValue(mockArticle),
            },
          },
        },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const result = await service.findAll({});
      expect(result.data).toEqual([mockArticle]);
      expect(result.total).toBe(1);
      expect(prisma.article.findMany).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      await service.findAll({ category: 'technical' });
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'technical' }),
        }),
      );
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'published' });
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('should filter by keyword', async () => {
      await service.findAll({ keyword: 'test' });
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { content: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should paginate with default page=1 and pageSize=20', async () => {
      const result = await service.findAll({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should paginate with custom page and pageSize', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValueOnce(42);
      const result = await service.findAll({ page: 3, pageSize: 15 });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(15);
      expect(result.total).toBe(42);
      expect(result.totalPages).toBe(3);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 30, take: 15 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return article and increment viewCount', async () => {
      const result = await service.findOne('article-1');
      expect(result.viewCount).toBe(1);
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('create', () => {
    it('should create a new article', async () => {
      const createDto = {
        title: 'New Article',
        content: 'Content here',
        authorId: 'user-1',
      };
      const result = await service.create(createDto);
      expect(result).toEqual(mockArticle);
      expect(prisma.article.create).toHaveBeenCalledWith({ data: createDto });
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const updateDto = { title: 'Updated Title' };
      const result = await service.update('article-1', updateDto);
      expect(result).toEqual(mockArticle);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete an article', async () => {
      const result = await service.remove('article-1');
      expect(result).toEqual(mockArticle);
      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-1' },
      });
    });
  });

  // === Article Comments ===
  describe('getArticleComments', () => {
    it('should return all comments for an article ordered by createdAt asc', async () => {
      const mockComments = [
        { id: 'c1', entityType: 'article', entityId: 'article-1', content: 'first', createdAt: new Date('2024-01-01') },
        { id: 'c2', entityType: 'article', entityId: 'article-1', content: 'second', createdAt: new Date('2024-01-02') },
      ];
      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await service.getArticleComments('article-1');

      expect(result).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { entityType: 'article', entityId: 'article-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when article has no comments', async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getArticleComments('article-1');

      expect(result).toEqual([]);
    });
  });

  describe('addArticleComment', () => {
    it('should create a comment with entityType article', async () => {
      const mockComment = {
        id: 'c1',
        content: 'Great article!',
        authorId: 'user-1',
        entityType: 'article',
        entityId: 'article-1',
        createdAt: new Date(),
      };
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await service.addArticleComment('article-1', 'user-1', 'Great article!');

      expect(result).toEqual(mockComment);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Great article!',
          authorId: 'user-1',
          entityType: 'article',
          entityId: 'article-1',
        },
      });
    });
  });

  // === Article Status Transitions ===
  describe('updateStatus', () => {
    beforeEach(() => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle });
      (prisma.article.update as jest.Mock).mockImplementation((args) =>
        Promise.resolve({ ...mockArticle, ...args.data }),
      );
    });

    it('should allow draft -> published', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle, status: 'draft' });
      const result = await service.updateStatus('article-1', 'published');
      expect(result.status).toBe('published');
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'published' },
      });
    });

    it('should allow published -> archived', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle, status: 'published' });
      const result = await service.updateStatus('article-1', 'archived');
      expect(result.status).toBe('archived');
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'archived' },
      });
    });

    it('should allow draft -> archived', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle, status: 'draft' });
      const result = await service.updateStatus('article-1', 'archived');
      expect(result.status).toBe('archived');
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'archived' },
      });
    });

    it('should throw when archived -> published (cannot unarchive)', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle, status: 'archived' });
      await expect(service.updateStatus('article-1', 'published')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when article not found', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.updateStatus('nonexistent', 'published')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw for invalid status transition', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({ ...mockArticle, status: 'published' });
      await expect(service.updateStatus('article-1', 'draft')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // === Full-text Search ===
  describe('searchArticles', () => {
    it('should search articles by title (case-insensitive contains)', async () => {
      const matchingArticles = [{ ...mockArticle, title: 'NestJS Guide' }];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(matchingArticles);

      const result = await service.searchArticles('nestjs');

      expect(result).toEqual(matchingArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'nestjs', mode: 'insensitive' } },
            { content: { contains: 'nestjs', mode: 'insensitive' } },
            { tags: { has: 'nestjs' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should search articles by content (case-insensitive contains)', async () => {
      const matchingArticles = [{ ...mockArticle, content: 'Learn NestJS from scratch' }];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(matchingArticles);

      const result = await service.searchArticles('learn');

      expect(result).toEqual(matchingArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { content: { contains: 'learn', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should search articles by tags (array contains)', async () => {
      const matchingArticles = [{ ...mockArticle, tags: ['nestjs', 'typescript'] }];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(matchingArticles);

      const result = await service.searchArticles('nestjs');

      expect(result).toEqual(matchingArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { tags: { has: 'nestjs' } },
            ]),
          }),
        }),
      );
    });

    it('should return matching articles ordered by createdAt desc', async () => {
      const orderedArticles = [
        { ...mockArticle, id: 'a2', createdAt: new Date('2024-06-01') },
        { ...mockArticle, id: 'a1', createdAt: new Date('2024-01-01') },
      ];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(orderedArticles);

      const result = await service.searchArticles('test');

      expect(result).toEqual(orderedArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array for no matches', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.searchArticles('nonexistent');

      expect(result).toEqual([]);
    });

    it('should limit results to 20', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);

      await service.searchArticles('test');

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });
  });

  // === Article Categories ===
  describe('getCategories', () => {
    it('should return distinct categories from all articles', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([
        { category: 'general' },
        { category: 'technical' },
        { category: 'faq' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['general', 'technical', 'faq']);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {},
        select: { category: true },
        distinct: ['category'],
      });
    });

    it('should return empty array when no articles', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getByCategory', () => {
    it('should return articles filtered by category', async () => {
      const techArticles = [
        { ...mockArticle, category: 'technical' },
      ];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(techArticles);

      const result = await service.getByCategory('technical');

      expect(result).toEqual(techArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { category: 'technical' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array for non-existent category', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getByCategory('nonexistent');

      expect(result).toEqual([]);
    });
  });
});

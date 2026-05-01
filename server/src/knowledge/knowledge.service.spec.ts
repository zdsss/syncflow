import { Test, TestingModule } from '@nestjs/testing';
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
            article: {
              findMany: jest.fn().mockResolvedValue([mockArticle]),
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
      expect(result).toEqual([mockArticle]);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by category', async () => {
      await service.findAll({ category: 'technical' });
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { category: 'technical' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'published' });
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by keyword', async () => {
      await service.findAll({ keyword: 'test' });
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
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
});

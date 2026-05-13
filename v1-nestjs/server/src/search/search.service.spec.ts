import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    status: 'in_progress',
  };

  const mockTask = {
    id: 'task-1',
    name: 'Test Task',
    status: 'in_progress',
    priority: 'high',
  };

  const mockFile = {
    id: 'file-1',
    name: 'test.pdf',
  };

  const mockBomItem = {
    id: 'bom-1',
    name: 'Test Motor',
    partNumber: 'MOT-001',
  };

  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    status: 'published',
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findMany: jest.fn().mockResolvedValue([mockProject]),
            },
            task: {
              findMany: jest.fn().mockResolvedValue([mockTask]),
            },
            file: {
              findMany: jest.fn().mockResolvedValue([mockFile]),
            },
            bomItem: {
              findMany: jest.fn().mockResolvedValue([mockBomItem]),
            },
            article: {
              findMany: jest.fn().mockResolvedValue([mockArticle]),
            },
            user: {
              findMany: jest.fn().mockResolvedValue([mockUser]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchAll', () => {
    it('should search projects by name (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test', mode: 'insensitive' } },
        select: { id: true, name: true, status: true },
        take: 5,
      });
      expect(result.projects).toEqual([mockProject]);
    });

    it('should search tasks by name (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test', mode: 'insensitive' } },
        select: { id: true, name: true, status: true, priority: true },
        take: 10,
      });
      expect(result.tasks).toEqual([mockTask]);
    });

    it('should search files by name (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test', mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5,
      });
      expect(result.files).toEqual([mockFile]);
    });

    it('should search BOM items by name (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.bomItem.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { partNumber: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, partNumber: true },
        take: 5,
      });
      expect(result.bomItems).toEqual([mockBomItem]);
    });

    it('should search articles by title (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, status: true },
        take: 5,
      });
      expect(result.articles).toEqual([mockArticle]);
    });

    it('should search users by name (case-insensitive)', async () => {
      const result = await service.searchAll('test');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test', mode: 'insensitive' } },
        select: { id: true, name: true, email: true },
        take: 5,
      });
      expect(result.users).toEqual([mockUser]);
    });

    it('should return all 6 types in result', async () => {
      const result = await service.searchAll('test');

      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('bomItems');
      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('users');
    });

    it('should limit results per type: projects:5, tasks:10, files:5, bomItems:5, articles:5, users:5', async () => {
      await service.searchAll('test');

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      expect(prisma.bomItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should return empty arrays for empty query', async () => {
      const result = await service.searchAll('');

      expect(result).toEqual({
        projects: [],
        tasks: [],
        files: [],
        bomItems: [],
        articles: [],
        users: [],
      });
      expect(prisma.project.findMany).not.toHaveBeenCalled();
      expect(prisma.task.findMany).not.toHaveBeenCalled();
      expect(prisma.file.findMany).not.toHaveBeenCalled();
      expect(prisma.bomItem.findMany).not.toHaveBeenCalled();
      expect(prisma.article.findMany).not.toHaveBeenCalled();
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });
});

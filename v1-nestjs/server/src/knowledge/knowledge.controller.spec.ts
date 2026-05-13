import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeController', () => {
  let controller: KnowledgeController;
  let service: KnowledgeService;

  const mockArticle = { id: 'art-1', title: 'How to use BOM', status: 'published' };
  const mockPaginated = { data: [mockArticle], total: 1, page: 1, pageSize: 20 };
  const mockComment = { id: 'cmt-1', content: 'Great article' };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    searchArticles: jest.fn().mockResolvedValue([mockArticle]),
    getCategories: jest.fn().mockResolvedValue(['engineering', 'design']),
    getByCategory: jest.fn().mockResolvedValue([mockArticle]),
    findOne: jest.fn().mockResolvedValue(mockArticle),
    create: jest.fn().mockResolvedValue(mockArticle),
    update: jest.fn().mockResolvedValue(mockArticle),
    updateStatus: jest.fn().mockResolvedValue({ ...mockArticle, status: 'archived' }),
    remove: jest.fn().mockResolvedValue(mockArticle),
    getArticleComments: jest.fn().mockResolvedValue([mockComment]),
    addArticleComment: jest.fn().mockResolvedValue(mockComment),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeController],
      providers: [{ provide: KnowledgeService, useValue: mockService }],
    }).compile();

    controller = module.get<KnowledgeController>(KnowledgeController);
    service = module.get<KnowledgeService>(KnowledgeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return articles', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({ category: undefined, status: undefined, keyword: undefined, page: undefined, pageSize: undefined });
      expect(result).toEqual({ code: 0, ...mockPaginated });
    });

    it('should pass filters', async () => {
      await controller.findAll('engineering', 'published', 'bom', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith({ category: 'engineering', status: 'published', keyword: 'bom', page: 2, pageSize: 10 });
    });
  });

  describe('searchArticles', () => {
    it('should search articles', async () => {
      const result = await controller.searchArticles('bom');
      expect(service.searchArticles).toHaveBeenCalledWith('bom');
      expect(result).toEqual({ code: 0, data: [mockArticle] });
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const result = await controller.getCategories();
      expect(service.getCategories).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: ['engineering', 'design'] });
    });
  });

  describe('getByCategory', () => {
    it('should return articles by category', async () => {
      const result = await controller.getByCategory('engineering');
      expect(service.getByCategory).toHaveBeenCalledWith('engineering');
      expect(result).toEqual({ code: 0, data: [mockArticle] });
    });
  });

  describe('findOne', () => {
    it('should return an article', async () => {
      const result = await controller.findOne('art-1');
      expect(service.findOne).toHaveBeenCalledWith('art-1');
      expect(result).toEqual({ code: 0, data: mockArticle });
    });

    it('should propagate not found errors', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create an article', async () => {
      const dto = { title: 'New Article', content: 'Content', authorId: 'user-1' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockArticle });
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const dto = { title: 'Updated' };
      const result = await controller.update('art-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('art-1', dto);
      expect(result).toEqual({ code: 0, data: mockArticle });
    });
  });

  describe('updateStatus', () => {
    it('should update article status', async () => {
      const result = await controller.updateStatus('art-1', { status: 'archived' });
      expect(service.updateStatus).toHaveBeenCalledWith('art-1', 'archived');
      expect(result).toEqual({ code: 0, data: { ...mockArticle, status: 'archived' } });
    });
  });

  describe('remove', () => {
    it('should delete an article', async () => {
      const result = await controller.remove('art-1');
      expect(service.remove).toHaveBeenCalledWith('art-1');
      expect(result).toEqual({ code: 0, data: mockArticle });
    });
  });

  describe('getArticleComments', () => {
    it('should return comments', async () => {
      const result = await controller.getArticleComments('art-1');
      expect(service.getArticleComments).toHaveBeenCalledWith('art-1');
      expect(result).toEqual({ code: 0, data: [mockComment] });
    });
  });

  describe('addArticleComment', () => {
    it('should add a comment', async () => {
      const body = { authorId: 'user-1', content: 'Great article' };
      const result = await controller.addArticleComment('art-1', body);
      expect(service.addArticleComment).toHaveBeenCalledWith('art-1', 'user-1', 'Great article');
      expect(result).toEqual({ code: 0, data: mockComment });
    });
  });
});

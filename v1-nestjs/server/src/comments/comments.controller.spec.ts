import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockComment = {
    id: 'comment-1',
    content: 'This is a test comment',
    authorId: 'user-1',
    entityType: 'task',
    entityId: 'task-1',
    parentId: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockComment),
    findByEntity: jest.fn().mockResolvedValue([mockComment]),
    update: jest.fn().mockResolvedValue({ ...mockComment, content: 'Updated' }),
    remove: jest.fn().mockResolvedValue(mockComment),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /comments', () => {
    it('should create a comment', async () => {
      const result = await controller.create({
        content: 'This is a test comment',
        authorId: 'user-1',
        entityType: 'task',
        entityId: 'task-1',
      });

      expect(result).toEqual({ code: 0, data: mockComment });
      expect(service.create).toHaveBeenCalledWith({
        content: 'This is a test comment',
        authorId: 'user-1',
        entityType: 'task',
        entityId: 'task-1',
      });
    });

    it('should create a reply comment with parentId', async () => {
      const reply = { ...mockComment, id: 'comment-2', parentId: 'comment-1' };
      (service.create as jest.Mock).mockResolvedValueOnce(reply);

      const result = await controller.create({
        content: 'This is a reply',
        authorId: 'user-2',
        entityType: 'task',
        entityId: 'task-1',
        parentId: 'comment-1',
      });

      expect(result).toEqual({ code: 0, data: reply });
    });
  });

  describe('GET /comments', () => {
    it('should return comments for an entity', async () => {
      const result = await controller.findByEntity('task', 'task-1');

      expect(result).toEqual({ code: 0, data: [mockComment] });
      expect(service.findByEntity).toHaveBeenCalledWith('task', 'task-1');
    });
  });

  describe('PATCH /comments/:id', () => {
    it('should update a comment', async () => {
      const result = await controller.update('comment-1', {
        content: 'Updated',
      });

      expect(result).toEqual({
        code: 0,
        data: { ...mockComment, content: 'Updated' },
      });
      expect(service.update).toHaveBeenCalledWith('comment-1', 'Updated');
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should remove a comment', async () => {
      const result = await controller.remove('comment-1');

      expect(result).toEqual({ code: 0, data: mockComment });
      expect(service.remove).toHaveBeenCalledWith('comment-1');
    });
  });
});

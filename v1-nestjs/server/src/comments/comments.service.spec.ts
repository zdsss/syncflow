import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: PrismaService;

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

  const mockChildComment = {
    id: 'comment-2',
    content: 'This is a reply',
    authorId: 'user-2',
    entityType: 'task',
    entityId: 'task-1',
    parentId: 'comment-1',
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z'),
  };

  const mockPrisma = {
    comment: {
      create: jest.fn().mockResolvedValue(mockComment),
      findMany: jest.fn().mockResolvedValue([mockComment, mockChildComment]),
      findUnique: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue({ ...mockComment, content: 'Updated content' }),
      delete: jest.fn().mockResolvedValue(mockComment),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const result = await service.create({
        content: 'This is a test comment',
        authorId: 'user-1',
        entityType: 'task',
        entityId: 'task-1',
      });

      expect(result).toEqual(mockComment);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'This is a test comment',
          authorId: 'user-1',
          entityType: 'task',
          entityId: 'task-1',
          parentId: undefined,
        },
      });
    });

    it('should create a reply comment with parentId', async () => {
      const replyMock = { ...mockChildComment };
      (prisma.comment.create as jest.Mock).mockResolvedValueOnce(replyMock);

      const result = await service.create({
        content: 'This is a reply',
        authorId: 'user-2',
        entityType: 'task',
        entityId: 'task-1',
        parentId: 'comment-1',
      });

      expect(result).toEqual(replyMock);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'This is a reply',
          authorId: 'user-2',
          entityType: 'task',
          entityId: 'task-1',
          parentId: 'comment-1',
        },
      });
    });
  });

  describe('findByEntity', () => {
    it('should return comments for an entity ordered by createdAt asc', async () => {
      const result = await service.findByEntity('task', 'task-1');

      expect(result).toEqual([mockComment, mockChildComment]);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { entityType: 'task', entityId: 'task-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no comments exist', async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.findByEntity('task', 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update comment content', async () => {
      const result = await service.update('comment-1', 'Updated content');

      expect(result.content).toBe('Updated content');
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Updated content' },
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      (prisma.comment.update as jest.Mock).mockRejectedValueOnce(
        new Error('Record not found'),
      );

      await expect(
        service.update('nonexistent', 'Updated content'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a comment', async () => {
      const result = await service.remove('comment-1');

      expect(result).toEqual(mockComment);
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      (prisma.comment.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Record not found'),
      );

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

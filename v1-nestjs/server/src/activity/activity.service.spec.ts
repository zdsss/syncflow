import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let prisma: PrismaService;

  const mockActivity = {
    id: 'act-1',
    userId: 'user-1',
    action: 'created',
    entityType: 'task',
    entityId: 'task-1',
    entityName: 'Battery Testing',
    projectId: 'proj-1',
    metadata: null,
    createdAt: new Date('2024-01-15'),
  };

  const mockActivityWithMetadata = {
    ...mockActivity,
    id: 'act-2',
    action: 'completed',
    metadata: { progress: 100 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: PrismaService,
          useValue: {
            activityLog: {
              create: jest.fn().mockResolvedValue(mockActivity),
              findMany: jest.fn().mockResolvedValue([mockActivity]),
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an activity log entry', async () => {
      const result = await service.log(
        'user-1',
        'created',
        'task',
        'task-1',
        'Battery Testing',
        'proj-1',
      );

      expect(result).toEqual(mockActivity);
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'created',
          entityType: 'task',
          entityId: 'task-1',
          entityName: 'Battery Testing',
          projectId: 'proj-1',
          metadata: undefined,
        },
      });
    });

    it('should create an activity log entry with metadata', async () => {
      (prisma.activityLog.create as jest.Mock).mockResolvedValue(mockActivityWithMetadata);
      const metadata = { progress: 100 };

      const result = await service.log(
        'user-1',
        'completed',
        'task',
        'task-1',
        'Battery Testing',
        'proj-1',
        metadata,
      );

      expect(result).toEqual(mockActivityWithMetadata);
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'completed',
          entityType: 'task',
          entityId: 'task-1',
          entityName: 'Battery Testing',
          projectId: 'proj-1',
          metadata,
        },
      });
    });

    it('should create an activity log entry without projectId', async () => {
      const result = await service.log(
        'user-1',
        'uploaded',
        'file',
        'file-1',
        'spec.pdf',
      );

      expect(result).toEqual(mockActivity);
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'uploaded',
          entityType: 'file',
          entityId: 'file-1',
          entityName: 'spec.pdf',
          projectId: undefined,
          metadata: undefined,
        },
      });
    });
  });

  describe('getByProject', () => {
    it('should return activities for a project with default pagination', async () => {
      const result = await service.getByProject('proj-1');

      expect(result.data).toEqual([mockActivity]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should support custom pagination', async () => {
      const result = await service.getByProject('proj-1', { page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return empty result when no activities exist', async () => {
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getByProject('proj-empty');

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getByUser', () => {
    it('should return activities for a user with default pagination', async () => {
      const result = await service.getByUser('user-1');

      expect(result.data).toEqual([mockActivity]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should support custom pagination', async () => {
      const result = await service.getByUser('user-1', { page: 3, pageSize: 5 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(5);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should return empty result when user has no activities', async () => {
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getByUser('user-empty');

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

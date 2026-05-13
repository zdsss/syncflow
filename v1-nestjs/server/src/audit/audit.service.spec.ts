import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockAuditLog = {
    id: 'audit-1',
    userId: 'user-1',
    action: 'create',
    entityType: 'task',
    entityId: 'task-1',
    changes: null,
    ipAddress: null,
    createdAt: new Date('2024-01-15'),
  };

  const mockAuditLogWithChanges = {
    ...mockAuditLog,
    id: 'audit-2',
    action: 'update',
    changes: { status: { old: 'in_progress', new: 'completed' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn().mockResolvedValue(mockAuditLog),
              findMany: jest.fn().mockResolvedValue([mockAuditLog]),
              count: jest.fn().mockResolvedValue(1),
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const result = await service.log('user-1', 'create', 'task', 'task-1');

      expect(result).toEqual(mockAuditLog);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'create',
          entityType: 'task',
          entityId: 'task-1',
          changes: undefined,
        },
      });
    });

    it('should create an audit log entry with changes', async () => {
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLogWithChanges);
      const changes = { status: { old: 'in_progress', new: 'completed' } };

      const result = await service.log('user-1', 'update', 'task', 'task-1', changes);

      expect(result).toEqual(mockAuditLogWithChanges);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'update',
          entityType: 'task',
          entityId: 'task-1',
          changes,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs with default options', async () => {
      const result = await service.findAll();

      expect(result.data).toEqual([mockAuditLog]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by userId', async () => {
      await service.findAll({ userId: 'user-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should filter by entityType', async () => {
      await service.findAll({ entityType: 'task' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'task' }),
        }),
      );
    });

    it('should filter by entityId', async () => {
      await service.findAll({ entityId: 'task-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'task-1' }),
        }),
      );
    });

    it('should filter by action', async () => {
      await service.findAll({ action: 'create' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'create' }),
        }),
      );
    });

    it('should support custom pagination', async () => {
      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should combine multiple filters', async () => {
      await service.findAll({
        userId: 'user-1',
        entityType: 'task',
        action: 'update',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            entityType: 'task',
            action: 'update',
          },
        }),
      );
    });
  });

  describe('getEntityHistory', () => {
    it('should return all logs for an entity ordered by createdAt desc', async () => {
      const history = [mockAuditLogWithChanges, mockAuditLog];
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(history);

      const result = await service.getEntityHistory('task', 'task-1');

      expect(result).toEqual(history);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { entityType: 'task', entityId: 'task-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no history exists', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getEntityHistory('task', 'non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than retention period', async () => {
      (prisma.auditLog.deleteMany as jest.Mock).mockResolvedValue({ count: 15 });

      const result = await service.cleanupOldLogs(90);

      expect(result.deletedCount).toBe(15);
      expect(result.cutoffDate).toBeInstanceOf(Date);
      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});

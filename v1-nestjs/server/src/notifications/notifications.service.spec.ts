import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'task_assigned',
    title: 'New Task Assigned',
    content: 'You have been assigned to task "Design UI"',
    relatedType: 'task',
    relatedId: 'task-1',
    isRead: false,
    createdAt: new Date('2026-05-01T10:00:00Z'),
  };

  const mockNotificationRead = {
    ...mockNotification,
    id: 'notif-2',
    isRead: true,
  };

  const mockPrisma = {
    notification: {
      create: jest.fn().mockResolvedValue(mockNotification),
      findMany: jest.fn().mockResolvedValue([mockNotification, mockNotificationRead]),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true }),
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create(
        'user-1',
        'task_assigned',
        'New Task Assigned',
        'You have been assigned to task "Design UI"',
        'task',
        'task-1',
      );

      expect(result).toEqual(mockNotification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'task_assigned',
          title: 'New Task Assigned',
          content: 'You have been assigned to task "Design UI"',
          relatedType: 'task',
          relatedId: 'task-1',
        },
      });
    });

    it('should create a notification without relatedType and relatedId', async () => {
      await service.create(
        'user-1',
        'system',
        'System Alert',
        'System will be under maintenance',
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'system',
          title: 'System Alert',
          content: 'System will be under maintenance',
          relatedType: undefined,
          relatedId: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications for a user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.findAll('user-1');

      expect(result).toEqual({
        data: [mockNotification],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should filter by isRead status', async () => {
      await service.findAll('user-1', { isRead: false });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should support custom pagination', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(50);

      const result = await service.findAll('user-1', { page: 3, pageSize: 10 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const result = await service.markAsRead('notif-1');

      expect(result).toEqual({ ...mockNotification, isRead: true });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      const result = await service.markAllAsRead('user-1');

      expect(result).toEqual({ count: 3 });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });
});

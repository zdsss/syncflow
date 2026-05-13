import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotification = { id: 'notif-1', message: 'Hello', isRead: false };
  const mockPaginated = { data: [mockNotification], total: 1, page: 1, pageSize: 20 };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    getUnreadCount: jest.fn().mockResolvedValue(5),
    markAsRead: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true }),
    markAllAsRead: jest.fn().mockResolvedValue({ count: 3 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return notifications', async () => {
      const result = await controller.findAll('user-1');
      expect(service.findAll).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual({ code: 0, data: mockPaginated });
    });

    it('should pass filters', async () => {
      await controller.findAll('user-1', 'true', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith('user-1', { isRead: true, page: 2, pageSize: 10 });
    });

    it('should handle isRead=false', async () => {
      await controller.findAll('user-1', 'false');
      expect(service.findAll).toHaveBeenCalledWith('user-1', { isRead: false });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const result = await controller.getUnreadCount('user-1');
      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ code: 0, data: { count: 5 } });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await controller.markAsRead('notif-1');
      expect(service.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(result).toEqual({ code: 0, data: { ...mockNotification, isRead: true } });
    });

    it('should propagate errors', async () => {
      (service.markAsRead as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.markAsRead('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      const result = await controller.markAllAsRead('user-1');
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ code: 0, data: { count: 3 } });
    });
  });
});

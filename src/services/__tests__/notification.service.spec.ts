import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../notification.service';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotifications calls GET /notifications without params', async () => {
    await getNotifications();
    expect(api.get).toHaveBeenCalledWith('/notifications', { params: undefined });
  });

  it('getNotifications calls GET /notifications with params', async () => {
    await getNotifications({ pageNum: 1, pageSize: 10 });
    expect(api.get).toHaveBeenCalledWith('/notifications', {
      params: { pageNum: 1, pageSize: 10 },
    });
  });

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    await getUnreadCount();
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('getNotifications calls GET /notifications with all params', async () => {
    await getNotifications({ pageNum: 1, pageSize: 10, status: 'unread' });
    expect(api.get).toHaveBeenCalledWith('/notifications', {
      params: { pageNum: 1, pageSize: 10, status: 'unread' },
    });
  });

  it('markAsRead calls PATCH /notifications/:id/read', async () => {
    await markAsRead(1);
    expect(api.patch).toHaveBeenCalledWith('/notifications/1/read');
  });

  it('markAllAsRead calls PATCH /notifications/read-all', async () => {
    await markAllAsRead();
    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
  });
});

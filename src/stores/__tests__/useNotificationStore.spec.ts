import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificationStore, getDisplayTime, formatRelativeTime } from '../useNotificationStore';

// Mock the notification service
vi.mock('../../services/notification.service', () => ({
  getNotifications: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }),
  getUnreadCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
  markAsRead: vi.fn().mockResolvedValue({}),
  markAllAsRead: vi.fn().mockResolvedValue({}),
}));

import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../../services/notification.service';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct initial state', () => {
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('addNotification adds with auto-generated id, read:false, createdAt as Date', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'Test', desc: 'Desc', type: 'task' });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toMatch(/^notif-/);
    expect(notifications[0].read).toBe(false);
    expect(notifications[0].createdAt).toBeInstanceOf(Date);
  });

  it('addNotification uses Date.now() for unique ids', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'First', desc: 'D1', type: 'task' });

    vi.advanceTimersByTime(5);
    addNotification({ title: 'Second', desc: 'D2', type: 'task' });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(2);
    expect(notifications[0].id).not.toBe(notifications[1].id);
    expect(notifications[0].id).toMatch(/^notif-/);
    expect(notifications[1].id).toMatch(/^notif-/);
  });

  it('addNotification prepends to the beginning of array', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'First', desc: 'D1', type: 'task' });
    addNotification({ title: 'Second', desc: 'D2', type: 'system' });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(2);
    expect(notifications[0].title).toBe('Second');
    expect(notifications[1].title).toBe('First');
  });

  it('addNotification preserves title, desc, type from input', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'My Title', desc: 'My Desc', type: 'approval' });

    const n = useNotificationStore.getState().notifications[0];
    expect(n.title).toBe('My Title');
    expect(n.desc).toBe('My Desc');
    expect(n.type).toBe('approval');
  });

  it('addNotification stores createdAt as current Date', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    vi.setSystemTime(now);

    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'T', desc: 'D', type: 'task' });

    const n = useNotificationStore.getState().notifications[0];
    expect(n.createdAt.getTime()).toBe(now.getTime());
  });

  it('markAsRead sets read:true for matching id', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'T', desc: 'D', type: 'task' });
    const id = useNotificationStore.getState().notifications[0].id;

    useNotificationStore.getState().markAsRead(id);
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
  });

  it('markAsRead does not affect other notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'A', desc: 'D', type: 'task' });
    vi.advanceTimersByTime(5);
    addNotification({ title: 'B', desc: 'D', type: 'task' });

    const notifications = useNotificationStore.getState().notifications;
    const targetId = notifications[1].id; // "A" (older, at index 1)

    useNotificationStore.getState().markAsRead(targetId);
    const updated = useNotificationStore.getState().notifications;
    expect(updated[1].read).toBe(true);
    expect(updated[0].read).toBe(false);
  });

  it('markAllAsRead sets read:true for all notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'A', desc: 'D', type: 'task' });
    addNotification({ title: 'B', desc: 'D', type: 'system' });

    useNotificationStore.getState().markAllAsRead();
    const notifications = useNotificationStore.getState().notifications;
    expect(notifications.every((n) => n.read)).toBe(true);
  });

  it('markAllAsRead works when array is empty', () => {
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('clearAll empties the notifications array', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'A', desc: 'D', type: 'task' });
    addNotification({ title: 'B', desc: 'D', type: 'task' });

    useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('getUnreadCountLocal returns 0 when empty', () => {
    expect(useNotificationStore.getState().getUnreadCountLocal()).toBe(0);
  });

  it('getUnreadCountLocal returns correct count of unread notifications', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'A', desc: 'D', type: 'task' });
    addNotification({ title: 'B', desc: 'D', type: 'task' });
    addNotification({ title: 'C', desc: 'D', type: 'task' });

    expect(useNotificationStore.getState().getUnreadCountLocal()).toBe(3);
  });

  it('getUnreadCountLocal changes after markAsRead', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: 'A', desc: 'D', type: 'task' });
    vi.advanceTimersByTime(5);
    addNotification({ title: 'B', desc: 'D', type: 'task' });

    expect(useNotificationStore.getState().getUnreadCountLocal()).toBe(2);

    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);

    expect(useNotificationStore.getState().getUnreadCountLocal()).toBe(1);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "刚刚" for dates less than 1 minute ago', () => {
    const date = new Date('2025-06-15T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('刚刚');
  });

  it('returns "刚刚" for the current time', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('刚刚');
  });

  it('returns "X分钟前" for dates less than 60 minutes ago', () => {
    const date = new Date('2025-06-15T11:45:00Z');
    expect(formatRelativeTime(date)).toBe('15分钟前');
  });

  it('returns "X分钟前" for exactly 1 minute ago', () => {
    const date = new Date('2025-06-15T11:59:00Z');
    expect(formatRelativeTime(date)).toBe('1分钟前');
  });

  it('returns "X分钟前" for 59 minutes ago', () => {
    const date = new Date('2025-06-15T11:01:00Z');
    expect(formatRelativeTime(date)).toBe('59分钟前');
  });

  it('returns "X小时前" for dates less than 24 hours ago', () => {
    const date = new Date('2025-06-15T09:00:00Z');
    expect(formatRelativeTime(date)).toBe('3小时前');
  });

  it('returns "X小时前" for exactly 1 hour ago', () => {
    const date = new Date('2025-06-15T11:00:00Z');
    expect(formatRelativeTime(date)).toBe('1小时前');
  });

  it('returns "X天前" for dates less than 7 days ago', () => {
    const date = new Date('2025-06-13T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2天前');
  });

  it('returns "X天前" for exactly 1 day ago', () => {
    const date = new Date('2025-06-14T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('1天前');
  });

  it('returns "6天前" for 6 days ago', () => {
    const date = new Date('2025-06-09T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('6天前');
  });

  it('returns "YYYY-MM-DD" for dates 7 or more days ago', () => {
    const date = new Date('2025-06-08T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2025-06-08');
  });

  it('returns "YYYY-MM-DD" for very old dates', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(formatRelativeTime(date)).toBe('2024-01-01');
  });
});

describe('getDisplayTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "刚刚" for a notification created just now', () => {
    const notification = {
      id: 'notif-1',
      title: 'Test',
      desc: 'Desc',
      type: 'task' as const,
      read: false,
      createdAt: new Date('2025-06-15T11:59:30Z'),
    };
    expect(getDisplayTime(notification)).toBe('刚刚');
  });

  it('returns "X分钟前" for a notification a few minutes old', () => {
    const notification = {
      id: 'notif-2',
      title: 'Test',
      desc: 'Desc',
      type: 'task' as const,
      read: false,
      createdAt: new Date('2025-06-15T11:45:00Z'),
    };
    expect(getDisplayTime(notification)).toBe('15分钟前');
  });

  it('returns "X小时前" for a notification hours old', () => {
    const notification = {
      id: 'notif-3',
      title: 'Test',
      desc: 'Desc',
      type: 'system' as const,
      read: false,
      createdAt: new Date('2025-06-15T08:00:00Z'),
    };
    expect(getDisplayTime(notification)).toBe('4小时前');
  });

  it('returns "YYYY-MM-DD" for an old notification', () => {
    const notification = {
      id: 'notif-4',
      title: 'Test',
      desc: 'Desc',
      type: 'approval' as const,
      read: true,
      createdAt: new Date('2025-06-01T12:00:00Z'),
    };
    expect(getDisplayTime(notification)).toBe('2025-06-01');
  });
});

describe('useNotificationStore async actions', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
    vi.clearAllMocks();
  });

  describe('fetchNotificationsAsync', () => {
    it('fetches notifications and stores in state', async () => {
      const serverData = [
        { id: 'n1', title: 'Task assigned', content: 'You got a task', isRead: false, type: 'task', createdAt: '2025-06-15T10:00:00Z' },
        { id: 'n2', title: 'Approval', content: 'Approve this', isRead: true, type: 'approval', createdAt: '2025-06-14T10:00:00Z' },
      ];
      vi.mocked(getNotifications).mockResolvedValue({ data: { data: serverData, total: 2 } } as any);

      await useNotificationStore.getState().fetchNotificationsAsync();

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(2);
      expect(notifications[0].id).toBe('n1');
      expect(notifications[0].title).toBe('Task assigned');
      expect(notifications[0].desc).toBe('You got a task');
      expect(notifications[0].read).toBe(false);
      expect(notifications[1].read).toBe(true);
    });

    it('passes params to getNotifications', async () => {
      vi.mocked(getNotifications).mockResolvedValue({ data: { data: [], total: 0 } } as any);

      await useNotificationStore.getState().fetchNotificationsAsync({ isRead: false, page: 1, pageSize: 10 });

      expect(getNotifications).toHaveBeenCalledWith({ isRead: false, page: 1, pageSize: 10 });
    });

    it('handles empty response gracefully', async () => {
      vi.mocked(getNotifications).mockResolvedValue({ data: [] } as any);

      await useNotificationStore.getState().fetchNotificationsAsync();

      expect(useNotificationStore.getState().notifications).toEqual([]);
    });
  });

  describe('fetchUnreadCountAsync', () => {
    it('fetches unread count and stores in state', async () => {
      vi.mocked(getUnreadCount).mockResolvedValue({ data: { count: 5 } } as any);

      await useNotificationStore.getState().fetchUnreadCountAsync();

      expect(useNotificationStore.getState().unreadCount).toBe(5);
    });

    it('handles numeric response', async () => {
      vi.mocked(getUnreadCount).mockResolvedValue({ data: 3 } as any);

      await useNotificationStore.getState().fetchUnreadCountAsync();

      expect(useNotificationStore.getState().unreadCount).toBe(3);
    });
  });

  describe('markAsReadAsync', () => {
    it('calls API and updates local notification', async () => {
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', title: 'Test', desc: 'D', createdAt: new Date(), read: false, type: 'task' },
        ],
        unreadCount: 1,
      });

      await useNotificationStore.getState().markAsReadAsync('n1');

      expect(apiMarkAsRead).toHaveBeenCalledWith('n1');
      expect(useNotificationStore.getState().notifications[0].read).toBe(true);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('does not decrement unreadCount for already read notification', async () => {
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', title: 'Test', desc: 'D', createdAt: new Date(), read: true, type: 'task' },
        ],
        unreadCount: 0,
      });

      await useNotificationStore.getState().markAsReadAsync('n1');

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('markAllAsReadAsync', () => {
    it('calls API and marks all notifications as read', async () => {
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', title: 'A', desc: 'D', createdAt: new Date(), read: false, type: 'task' },
          { id: 'n2', title: 'B', desc: 'D', createdAt: new Date(), read: false, type: 'system' },
        ],
        unreadCount: 2,
      });

      await useNotificationStore.getState().markAllAsReadAsync();

      expect(apiMarkAllAsRead).toHaveBeenCalled();
      expect(useNotificationStore.getState().notifications.every((n) => n.read)).toBe(true);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('works when notifications array is empty', async () => {
      await useNotificationStore.getState().markAllAsReadAsync();

      expect(apiMarkAllAsRead).toHaveBeenCalled();
      expect(useNotificationStore.getState().notifications).toEqual([]);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });
});

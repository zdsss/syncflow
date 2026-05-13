import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../services/notification.service';

export interface Notification {
  id: string;
  title: string;
  desc: string;
  createdAt: Date;
  read: boolean;
  type: 'task' | 'approval' | 'system';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCountLocal: () => number;
  fetchNotificationsAsync: (params?: { isRead?: boolean; page?: number; pageSize?: number }) => Promise<void>;
  fetchUnreadCountAsync: () => Promise<void>;
  markAsReadAsync: (id: string) => Promise<void>;
  markAllAsReadAsync: () => Promise<void>;
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  }

  // Format as YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDisplayTime(notification: Notification): string {
  return formatRelativeTime(notification.createdAt);
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}`,
              read: false,
              createdAt: new Date(),
            },
            ...state.notifications,
          ],
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [] }),

      getUnreadCountLocal: () => get().notifications.filter((n) => !n.read).length,

      fetchNotificationsAsync: async (params) => {
        const res = await getNotifications(params);
        const data = res.data || res;
        const items = Array.isArray(data) ? data : data.data || [];
        set({
          notifications: items.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            desc: n.content || n.desc || '',
            createdAt: new Date(n.createdAt),
            read: n.isRead ?? n.read ?? false,
            type: n.type || 'system',
          })),
        });
      },

      fetchUnreadCountAsync: async () => {
        const res = await getUnreadCount();
        const data = res.data || res;
        const count = typeof data === 'number' ? data : data.count ?? 0;
        set({ unreadCount: count });
      },

      markAsReadAsync: async (id: string) => {
        await apiMarkAsRead(id);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
        }));
      },

      markAllAsReadAsync: async () => {
        await apiMarkAllAsRead();
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },
    }),
    { name: 'notification' },
  ),
);

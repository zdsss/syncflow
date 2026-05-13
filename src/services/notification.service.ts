import api from './api';

export async function getNotifications(params?: { pageNum?: number; pageSize?: number; status?: string }) {
  return api.get('/notifications', { params });
}

export async function getUnreadCount() {
  return api.get('/notifications/unread-count');
}

export async function markAsRead(id: string | number) {
  return api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  return api.patch('/notifications/read-all');
}

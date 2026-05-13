import api from './api';

export async function getComments(taskId: string, params?: { pageNum?: number }) {
  return api.get(`/tasks/${taskId}/comments`, { params });
}

export async function createComment(taskId: string, data: { content: string; parentId?: string }) {
  return api.post(`/tasks/${taskId}/comments`, data);
}

export async function updateComment(taskId: string, commentId: string, data: { content: string }) {
  return api.patch(`/tasks/${taskId}/comments/${commentId}`, data);
}

export async function deleteComment(taskId: string, commentId: string) {
  return api.delete(`/tasks/${taskId}/comments/${commentId}`);
}

import api from './api';

export async function getApprovals(params?: { status?: string; userId?: string }) {
  return api.get('/approvals', { params });
}

export async function getApproval(id: string) {
  return api.get(`/approvals/${id}`);
}

export async function createApproval(data: Record<string, any>) {
  return api.post('/approvals', data);
}

export async function approveApproval(id: string, approverId: string) {
  return api.patch(`/approvals/${id}/approve`, { approverId });
}

export async function rejectApproval(id: string, approverId: string, comment: string) {
  return api.patch(`/approvals/${id}/reject`, { approverId, comment });
}

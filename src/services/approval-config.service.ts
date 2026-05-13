import { request } from './api';

export interface ApprovalConfigVO {
  id: number;
  objectType: string;
  processKey: string;
  nodeId: string;
  nodeName: string;
  ruleType: string;
  ruleValue?: string;
  expression?: string;
  priority: number;
  skipExpression?: string;
  required: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalConfigDTO {
  objectType: string;
  processKey: string;
  nodeId: string;
  nodeName: string;
  ruleType: string;
  ruleValue?: string;
  expression?: string;
  priority?: number;
  skipExpression?: string;
  required?: boolean;
  enabled?: boolean;
}

export async function getApprovalConfigs(params?: { objectType?: string; processKey?: string }): Promise<{ code: number; data: ApprovalConfigVO[] }> {
  return request.get('/approval-configs', { params });
}

export async function getApprovalConfig(id: number): Promise<{ code: number; data: ApprovalConfigVO }> {
  return request.get(`/approval-configs/${id}`);
}

export async function createApprovalConfig(data: ApprovalConfigDTO): Promise<{ code: number; data: ApprovalConfigVO }> {
  return request.post('/approval-configs', data);
}

export async function updateApprovalConfig(id: number, data: ApprovalConfigDTO): Promise<{ code: number; data: ApprovalConfigVO }> {
  return request.put(`/approval-configs/${id}`, data);
}

export async function deleteApprovalConfig(id: number): Promise<{ code: number; data: null }> {
  return request.delete(`/approval-configs/${id}`);
}

export async function toggleApprovalConfig(id: number): Promise<{ code: number; data: null }> {
  return request.put(`/approval-configs/${id}/toggle`);
}

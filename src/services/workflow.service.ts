import api from './api';

export interface ApprovalTaskVO {
  taskId: string;
  taskName: string;
  businessObjectId: number;
  objectType: string;
  objectName: string;
  objectCode?: string;
  projectId?: number;
  applicantName?: string;
  createdAt: string;
}

export interface ApprovalCommentVO {
  id: number;
  nodeName: string;
  approverName: string;
  action: string; // APPROVE/REJECT
  comment?: string;
  createdAt: string;
}

export interface BusinessObjectVO {
  id: number;
  objectType: string;
  objectId: number;
  objectName: string;
  objectCode?: string;
  projectId?: number;
  status: number; // 1=draft, 2=pending, 3=approved, 4=rejected, 5=withdrawn
  currentNode?: string;
  currentTaskId?: string;
  flowInstanceId?: string;
  applicantId: number;
  applicantName?: string;
  appliedAt?: string;
  completedAt?: string;
}

export interface DelegationVO {
  id: number;
  businessObjectId: number;
  fromUserId: number;
  toUserId: number;
  reason?: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CcRecordVO {
  id: number;
  businessObjectId: number;
  userId: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Get business object detail by id
export async function getBusinessObject(id: string | number): Promise<BusinessObjectVO> {
  return api.get(`/wf/business-objects/${id}`);
}

// Complete approval task (approve or reject)
export async function completeTask(taskId: string, data: {
  approved: boolean;
  comment?: string;
}) {
  return api.post(`/wf/tasks/${taskId}/complete`, data);
}

// Start a workflow instance for a business object
export async function startWorkflow(data: {
  processKey: string;
  objectId: number;
  objectType: string;
  objectName: string;
  projectId?: number;
  ccUserIds?: number[];
}) {
  return api.post('/wf/start', data);
}

// Get pending approval tasks
export async function getPendingTasks(): Promise<ApprovalTaskVO[]> {
  return api.get('/wf/tasks/pending');
}

// Get completed/processed approval tasks
export async function getCompletedTasks(): Promise<ApprovalTaskVO[]> {
  return api.get('/wf/tasks/completed');
}

// Get approval history
export async function getApprovalHistory(businessObjectId: number): Promise<ApprovalCommentVO[]> {
  return api.get(`/wf/business-objects/${businessObjectId}/history`);
}

// Withdraw approval
export async function withdrawApproval(businessObjectId: number) {
  return api.post(`/wf/business-objects/${businessObjectId}/withdraw`);
}

// Send reminder to current assignee
export async function remindApproval(businessObjectId: number) {
  return api.post(`/wf/business-objects/${businessObjectId}/remind`);
}

// Delegation
export async function delegate(data: {
  businessObjectId: number;
  fromUserId: number;
  toUserId: number;
  reason?: string;
  startTime?: string;
  endTime?: string;
}) {
  return api.post('/wf/delegation', data);
}

export async function revokeDelegation(id: number) {
  return api.delete(`/wf/delegation/${id}`);
}

export async function getDelegations(): Promise<DelegationVO[]> {
  return api.get('/wf/delegation');
}

// CC Records
export async function addCc(data: { businessObjectId: number; userId: number }) {
  return api.post('/wf/cc', data);
}

// Add candidate user (加签) to an active task
export async function addCandidateUser(taskId: string, userId: number) {
  return api.post(`/wf/tasks/${taskId}/add-candidate`, { userId });
}

// Reassign (transfer) an active task to a different user
export async function reassignTask(taskId: string, userId: number) {
  return api.post(`/wf/tasks/${taskId}/reassign`, { userId });
}

export async function markCcAsRead(id: number) {
  return api.put(`/wf/cc/${id}/read`);
}

export async function getCcRecords(unreadOnly = false): Promise<CcRecordVO[]> {
  return api.get(`/wf/cc?unreadOnly=${unreadOnly}`);
}

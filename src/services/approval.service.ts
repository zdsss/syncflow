import api from './api';
import * as workflowService from './workflow.service';

// ── Legacy approval endpoints ──────────────────────────────────────────
// These maintain backward-compatible signatures.  Where possible they
// delegate to the new workflow.service methods.

export async function getApprovals(params?: { status?: string; userId?: string }) {
  return workflowService.getPendingTasks();
}

export async function getApproval(id: string) {
  // Fetch business-object detail from workflow service
  return api.get(`/wf/business-objects/${id}`);
}

export async function createApproval(data: Record<string, any>) {
  return workflowService.startWorkflow(data as any);
}

export async function approveApproval(id: string, approverId: string) {
  // id is a business-object id; we need the Flowable task id (currentTaskId)
  const bo = await workflowService.getBusinessObject(id);
  const taskId = (bo as any)?.currentTaskId ?? (bo as any)?.data?.currentTaskId;
  if (!taskId) throw new Error('No active approval task found for business object ' + id);
  return workflowService.completeTask(taskId, { approved: true });
}

export async function rejectApproval(id: string, approverId: string, comment: string) {
  const bo = await workflowService.getBusinessObject(id);
  const taskId = (bo as any)?.currentTaskId ?? (bo as any)?.data?.currentTaskId;
  if (!taskId) throw new Error('No active approval task found for business object ' + id);
  return workflowService.completeTask(taskId, { approved: false, comment });
}

// createApprovalChain removed — Java backend uses wf_approval_config table for multi-level approval

export async function transferApproval(id: string, fromUserId: string, toUserId: string) {
  return workflowService.delegate({
    businessObjectId: Number(id),
    fromUserId: Number(fromUserId),
    toUserId: Number(toUserId),
  });
}

// ── New workflow delegation helpers ────────────────────────────────────

export { getPendingTasks } from './workflow.service';
export { withdrawApproval } from './workflow.service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  completeTask,
  startWorkflow,
  getPendingTasks,
  getApprovalHistory,
  withdrawApproval,
  delegate,
  revokeDelegation,
  getDelegations,
  addCc,
  markCcAsRead,
  getCcRecords,
} from '../workflow.service';

describe('WorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── startWorkflow ──────────────────────────────────────────────────

  it('calls POST /wf/start with objectId and optional fields', async () => {
    const data = {
      processKey: 'task_completion_approval',
      objectId: 1,
      objectType: 'TASK',
      objectName: 'Task-001',
      projectId: 10,
      ccUserIds: [3, 5],
    };
    await startWorkflow(data);
    expect(api.post).toHaveBeenCalledWith('/wf/start', data);
  });

  it('calls POST /wf/start with minimal required fields', async () => {
    const data = {
      processKey: 'bom_approval',
      objectId: 2,
      objectType: 'BOM',
      objectName: 'BOM-001',
    };
    await startWorkflow(data);
    expect(api.post).toHaveBeenCalledWith('/wf/start', data);
  });

  // ── completeTask ──────────────────────────────────────────────────

  it('calls POST /wf/tasks/:taskId/complete for approval', async () => {
    await completeTask('task-123', { approved: true });
    expect(api.post).toHaveBeenCalledWith('/wf/tasks/task-123/complete', {
      approved: true,
    });
  });

  it('calls POST /wf/tasks/:taskId/complete for rejection with comment', async () => {
    await completeTask('task-456', { approved: false, comment: 'Not good enough' });
    expect(api.post).toHaveBeenCalledWith('/wf/tasks/task-456/complete', {
      approved: false,
      comment: 'Not good enough',
    });
  });

  // ── getPendingTasks ───────────────────────────────────────────────

  it('calls GET /wf/tasks/pending and returns full response', async () => {
    const mockTasks = [
      {
        taskId: 't1',
        taskName: 'Review',
        businessObjectId: 1,
        objectType: 'BOM',
        objectName: 'BOM-001',
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTasks });
    const result = await getPendingTasks();
    expect(api.get).toHaveBeenCalledWith('/wf/tasks/pending');
    expect(result).toEqual({ data: mockTasks });
  });

  // ── getApprovalHistory ────────────────────────────────────────────

  it('calls GET /wf/business-objects/:id/history and returns full response', async () => {
    const mockHistory = [
      {
        id: 1,
        nodeName: 'Manager Review',
        approverName: 'Alice',
        action: 'APPROVE',
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockHistory });
    const result = await getApprovalHistory(42);
    expect(api.get).toHaveBeenCalledWith('/wf/business-objects/42/history');
    expect(result).toEqual({ data: mockHistory });
  });

  // ── withdrawApproval ──────────────────────────────────────────────

  it('calls POST /wf/business-objects/:id/withdraw', async () => {
    await withdrawApproval(42);
    expect(api.post).toHaveBeenCalledWith('/wf/business-objects/42/withdraw');
  });

  // ── delegate ──────────────────────────────────────────────────────

  it('calls POST /wf/delegation with delegation data', async () => {
    const data = {
      businessObjectId: 10,
      fromUserId: 1,
      toUserId: 2,
      reason: 'On vacation',
      startTime: '2026-05-01',
      endTime: '2026-05-15',
    };
    await delegate(data);
    expect(api.post).toHaveBeenCalledWith('/wf/delegation', data);
  });

  it('delegate works without optional fields', async () => {
    const data = {
      businessObjectId: 10,
      fromUserId: 1,
      toUserId: 2,
    };
    await delegate(data);
    expect(api.post).toHaveBeenCalledWith('/wf/delegation', data);
  });

  // ── revokeDelegation ──────────────────────────────────────────────

  it('calls DELETE /wf/delegation/:id', async () => {
    await revokeDelegation(7);
    expect(api.delete).toHaveBeenCalledWith('/wf/delegation/7');
  });

  // ── getDelegations ────────────────────────────────────────────────

  it('calls GET /wf/delegation and returns full response', async () => {
    const mockDelegations = [
      {
        id: 1,
        businessObjectId: 10,
        fromUserId: 1,
        toUserId: 2,
        isActive: true,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDelegations });
    const result = await getDelegations();
    expect(api.get).toHaveBeenCalledWith('/wf/delegation');
    expect(result).toEqual({ data: mockDelegations });
  });

  // ── addCc ─────────────────────────────────────────────────────────

  it('calls POST /wf/cc with cc data', async () => {
    await addCc({ businessObjectId: 10, userId: 3 });
    expect(api.post).toHaveBeenCalledWith('/wf/cc', {
      businessObjectId: 10,
      userId: 3,
    });
  });

  // ── markCcAsRead ──────────────────────────────────────────────────

  it('calls PUT /wf/cc/:id/read', async () => {
    await markCcAsRead(5);
    expect(api.put).toHaveBeenCalledWith('/wf/cc/5/read');
  });

  // ── getCcRecords ──────────────────────────────────────────────────

  it('calls GET /wf/cc with default unreadOnly=false and returns full response', async () => {
    const mockRecords = [
      {
        id: 1,
        businessObjectId: 10,
        userId: 3,
        isRead: false,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockRecords });
    const result = await getCcRecords();
    expect(api.get).toHaveBeenCalledWith('/wf/cc?unreadOnly=false');
    expect(result).toEqual({ data: mockRecords });
  });

  it('calls GET /wf/cc with unreadOnly=true', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await getCcRecords(true);
    expect(api.get).toHaveBeenCalledWith('/wf/cc?unreadOnly=true');
  });
});

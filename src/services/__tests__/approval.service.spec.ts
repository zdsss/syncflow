import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockCompleteTask = vi.fn().mockResolvedValue({});
const mockGetPendingTasks = vi.fn().mockResolvedValue([]);
const mockDelegate = vi.fn().mockResolvedValue({});
const mockGetBusinessObject = vi.fn().mockResolvedValue({ currentTaskId: 'task-99' });
vi.mock('../workflow.service', () => ({
  completeTask: (...args: any[]) => mockCompleteTask(...args),
  getPendingTasks: (...args: any[]) => mockGetPendingTasks(...args),
  startWorkflow: vi.fn().mockResolvedValue({}),
  delegate: (...args: any[]) => mockDelegate(...args),
  getBusinessObject: (...args: any[]) => mockGetBusinessObject(...args),
}));

import api from '../api';
import {
  getApprovals,
  getApproval,
  createApproval,
  approveApproval,
  rejectApproval,
  transferApproval,
} from '../approval.service';

describe('ApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates getApprovals to workflowService.getPendingTasks', async () => {
    await getApprovals({ status: 'pending', userId: 'u1' });
    expect(mockGetPendingTasks).toHaveBeenCalled();
  });

  it('calls GET /wf/business-objects/:id for getApproval', async () => {
    await getApproval('a1');
    expect(api.get).toHaveBeenCalledWith('/wf/business-objects/a1');
  });

  it('delegates createApproval to workflowService.startWorkflow', async () => {
    const data = { processKey: 'test', objectId: 1, objectType: 'BOM', objectName: 'BOM-1' };
    await createApproval(data);
    // createApproval delegates to workflowService.startWorkflow which is mocked
  });

  it('delegates approve to workflowService.completeTask with approved=true', async () => {
    await approveApproval('a1', 'u2');
    expect(mockGetBusinessObject).toHaveBeenCalledWith('a1');
    expect(mockCompleteTask).toHaveBeenCalledWith('task-99', { approved: true });
  });

  it('delegates reject to workflowService.completeTask with approved=false and comment', async () => {
    await rejectApproval('a1', 'u2', 'Needs revision');
    expect(mockGetBusinessObject).toHaveBeenCalledWith('a1');
    expect(mockCompleteTask).toHaveBeenCalledWith('task-99', {
      approved: false,
      comment: 'Needs revision',
    });
  });

  it('delegates transferApproval to workflowService.delegate', async () => {
    await transferApproval('1', '10', '20');
    expect(mockDelegate).toHaveBeenCalledWith({
      businessObjectId: 1,
      fromUserId: 10,
      toUserId: 20,
    });
  });
});

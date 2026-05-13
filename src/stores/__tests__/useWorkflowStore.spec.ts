import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockGetPendingTasks = vi.fn().mockResolvedValue([]);
const mockGetApprovalHistory = vi.fn().mockResolvedValue([]);
const mockCompleteTask = vi.fn().mockResolvedValue({});
const mockWithdrawApproval = vi.fn().mockResolvedValue({});
const mockGetDelegations = vi.fn().mockResolvedValue([]);
const mockDelegate = vi.fn().mockResolvedValue({});
const mockRevokeDelegation = vi.fn().mockResolvedValue({});
const mockGetCcRecords = vi.fn().mockResolvedValue([]);
const mockAddCc = vi.fn().mockResolvedValue({});
const mockMarkCcAsRead = vi.fn().mockResolvedValue({});

vi.mock('../../services/workflow.service', () => ({
  getPendingTasks: (...args: any[]) => mockGetPendingTasks(...args),
  getApprovalHistory: (...args: any[]) => mockGetApprovalHistory(...args),
  completeTask: (...args: any[]) => mockCompleteTask(...args),
  withdrawApproval: (...args: any[]) => mockWithdrawApproval(...args),
  getDelegations: (...args: any[]) => mockGetDelegations(...args),
  delegate: (...args: any[]) => mockDelegate(...args),
  revokeDelegation: (...args: any[]) => mockRevokeDelegation(...args),
  getCcRecords: (...args: any[]) => mockGetCcRecords(...args),
  addCc: (...args: any[]) => mockAddCc(...args),
  markCcAsRead: (...args: any[]) => mockMarkCcAsRead(...args),
}));

import { useWorkflowStore } from '../useWorkflowStore';

// Helper to reset zustand store between tests
const resetStore = () => {
  useWorkflowStore.setState({
    pendingTasks: [],
    approvalHistory: [],
    delegations: [],
    ccRecords: [],
    loading: false,
    error: null,
  });
};

describe('useWorkflowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // ── fetchPendingTasks ─────────────────────────────────────────────

  it('has correct initial state', () => {
    const state = useWorkflowStore.getState();
    expect(state.pendingTasks).toEqual([]);
    expect(state.approvalHistory).toEqual([]);
    expect(state.delegations).toEqual([]);
    expect(state.ccRecords).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchPendingTasks loads tasks and clears loading', async () => {
    const tasks = [
      {
        taskId: 't1',
        taskName: 'Review',
        businessObjectId: 1,
        objectType: 'BOM',
        objectName: 'BOM-001',
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetPendingTasks.mockResolvedValueOnce(tasks);

    await act(async () => {
      await useWorkflowStore.getState().fetchPendingTasks();
    });

    const state = useWorkflowStore.getState();
    expect(state.pendingTasks).toEqual(tasks);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchPendingTasks sets error on failure', async () => {
    mockGetPendingTasks.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      await useWorkflowStore.getState().fetchPendingTasks();
    });

    const state = useWorkflowStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.loading).toBe(false);
  });

  // ── fetchApprovalHistory ──────────────────────────────────────────

  it('fetchApprovalHistory loads history', async () => {
    const history = [
      {
        id: 1,
        nodeName: 'Manager',
        approverName: 'Alice',
        action: 'APPROVE',
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetApprovalHistory.mockResolvedValueOnce(history);

    await act(async () => {
      await useWorkflowStore.getState().fetchApprovalHistory(42);
    });

    expect(useWorkflowStore.getState().approvalHistory).toEqual(history);
    expect(mockGetApprovalHistory).toHaveBeenCalledWith(42);
  });

  it('fetchApprovalHistory sets error on failure', async () => {
    mockGetApprovalHistory.mockRejectedValueOnce(new Error('Failed'));

    await act(async () => {
      await useWorkflowStore.getState().fetchApprovalHistory(42);
    });

    expect(useWorkflowStore.getState().error).toBe('Failed');
  });

  // ── completeTask ──────────────────────────────────────────────────

  it('completeTask calls service and removes task from pending list', async () => {
    useWorkflowStore.setState({
      pendingTasks: [
        {
          taskId: 't1',
          taskName: 'Review',
          businessObjectId: 1,
          objectType: 'BOM',
          objectName: 'BOM-001',
          createdAt: '2026-05-01T10:00:00Z',
        },
        {
          taskId: 't2',
          taskName: 'Approve',
          businessObjectId: 2,
          objectType: 'Process',
          objectName: 'PROC-001',
          createdAt: '2026-05-01T11:00:00Z',
        },
      ],
    });

    await act(async () => {
      await useWorkflowStore.getState().completeTask('t1', true, 'Looks good');
    });

    expect(mockCompleteTask).toHaveBeenCalledWith('t1', {
      approved: true,
      comment: 'Looks good',
    });
    expect(useWorkflowStore.getState().pendingTasks).toHaveLength(1);
    expect(useWorkflowStore.getState().pendingTasks[0].taskId).toBe('t2');
  });

  it('completeTask sets error on failure', async () => {
    mockCompleteTask.mockRejectedValueOnce(new Error('Task failed'));

    await act(async () => {
      await useWorkflowStore.getState().completeTask('t1', false);
    });

    expect(useWorkflowStore.getState().error).toBe('Task failed');
  });

  // ── withdrawApproval ──────────────────────────────────────────────

  it('withdrawApproval calls service and removes related tasks', async () => {
    useWorkflowStore.setState({
      pendingTasks: [
        {
          taskId: 't1',
          taskName: 'Review',
          businessObjectId: 10,
          objectType: 'BOM',
          objectName: 'BOM-001',
          createdAt: '2026-05-01T10:00:00Z',
        },
        {
          taskId: 't2',
          taskName: 'Approve',
          businessObjectId: 20,
          objectType: 'Process',
          objectName: 'PROC-001',
          createdAt: '2026-05-01T11:00:00Z',
        },
      ],
    });

    await act(async () => {
      await useWorkflowStore.getState().withdrawApproval(10);
    });

    expect(mockWithdrawApproval).toHaveBeenCalledWith(10);
    expect(useWorkflowStore.getState().pendingTasks).toHaveLength(1);
    expect(useWorkflowStore.getState().pendingTasks[0].businessObjectId).toBe(20);
  });

  // ── fetchDelegations / delegate / revokeDelegation ────────────────

  it('fetchDelegations loads delegations', async () => {
    const delegations = [
      {
        id: 1,
        businessObjectId: 10,
        fromUserId: 1,
        toUserId: 2,
        isActive: true,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetDelegations.mockResolvedValueOnce(delegations);

    await act(async () => {
      await useWorkflowStore.getState().fetchDelegations();
    });

    expect(useWorkflowStore.getState().delegations).toEqual(delegations);
  });

  it('delegate calls service and refreshes delegations', async () => {
    const newDelegations = [
      {
        id: 1,
        businessObjectId: 10,
        fromUserId: 1,
        toUserId: 2,
        isActive: true,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetDelegations.mockResolvedValueOnce(newDelegations);

    const delegateData = {
      businessObjectId: 10,
      fromUserId: 1,
      toUserId: 2,
      reason: 'On vacation',
    };

    await act(async () => {
      await useWorkflowStore.getState().delegate(delegateData);
    });

    expect(mockDelegate).toHaveBeenCalledWith(delegateData);
    expect(mockGetDelegations).toHaveBeenCalled();
    expect(useWorkflowStore.getState().delegations).toEqual(newDelegations);
  });

  it('revokeDelegation calls service and removes from list', async () => {
    useWorkflowStore.setState({
      delegations: [
        {
          id: 1,
          businessObjectId: 10,
          fromUserId: 1,
          toUserId: 2,
          isActive: true,
          createdAt: '2026-05-01T10:00:00Z',
        },
        {
          id: 2,
          businessObjectId: 20,
          fromUserId: 3,
          toUserId: 4,
          isActive: true,
          createdAt: '2026-05-01T11:00:00Z',
        },
      ],
    });

    await act(async () => {
      await useWorkflowStore.getState().revokeDelegation(1);
    });

    expect(mockRevokeDelegation).toHaveBeenCalledWith(1);
    expect(useWorkflowStore.getState().delegations).toHaveLength(1);
    expect(useWorkflowStore.getState().delegations[0].id).toBe(2);
  });

  // ── fetchCcRecords / addCc / markCcAsRead ─────────────────────────

  it('fetchCcRecords loads CC records', async () => {
    const records = [
      {
        id: 1,
        businessObjectId: 10,
        userId: 3,
        isRead: false,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetCcRecords.mockResolvedValueOnce(records);

    await act(async () => {
      await useWorkflowStore.getState().fetchCcRecords(true);
    });

    expect(mockGetCcRecords).toHaveBeenCalledWith(true);
    expect(useWorkflowStore.getState().ccRecords).toEqual(records);
  });

  it('addCc calls service and refreshes records', async () => {
    const newRecords = [
      {
        id: 1,
        businessObjectId: 10,
        userId: 3,
        isRead: false,
        createdAt: '2026-05-01T10:00:00Z',
      },
    ];
    mockGetCcRecords.mockResolvedValueOnce(newRecords);

    await act(async () => {
      await useWorkflowStore.getState().addCc(10, 3);
    });

    expect(mockAddCc).toHaveBeenCalledWith({ businessObjectId: 10, userId: 3 });
    expect(mockGetCcRecords).toHaveBeenCalled();
    expect(useWorkflowStore.getState().ccRecords).toEqual(newRecords);
  });

  it('markCcAsRead calls service and updates local state', async () => {
    useWorkflowStore.setState({
      ccRecords: [
        {
          id: 1,
          businessObjectId: 10,
          userId: 3,
          isRead: false,
          createdAt: '2026-05-01T10:00:00Z',
        },
      ],
    });

    await act(async () => {
      await useWorkflowStore.getState().markCcAsRead(1);
    });

    expect(mockMarkCcAsRead).toHaveBeenCalledWith(1);
    const record = useWorkflowStore.getState().ccRecords[0];
    expect(record.isRead).toBe(true);
    expect(record.readAt).toBeDefined();
  });

  it('markCcAsRead sets error on failure', async () => {
    mockMarkCcAsRead.mockRejectedValueOnce(new Error('Mark read failed'));
    useWorkflowStore.setState({
      ccRecords: [
        {
          id: 1,
          businessObjectId: 10,
          userId: 3,
          isRead: false,
          createdAt: '2026-05-01T10:00:00Z',
        },
      ],
    });

    await act(async () => {
      await useWorkflowStore.getState().markCcAsRead(1);
    });

    expect(useWorkflowStore.getState().error).toBe('Mark read failed');
  });
});

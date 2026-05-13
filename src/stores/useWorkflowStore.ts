import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as workflowService from '../services/workflow.service';
import type {
  ApprovalTaskVO,
  ApprovalCommentVO,
  BusinessObjectVO,
  DelegationVO,
  CcRecordVO,
} from '../services/workflow.service';

/** Safely extract data from a response that may or may not be wrapped in { data } */
const unwrap = <T>(res: T | { data: T }): T =>
  res != null && typeof res === 'object' && 'data' in res ? (res as { data: T }).data : (res as T);

interface WorkflowState {
  pendingTasks: ApprovalTaskVO[];
  completedTasks: ApprovalTaskVO[];
  approvalHistory: ApprovalCommentVO[];
  delegations: DelegationVO[];
  ccRecords: CcRecordVO[];
  loading: boolean;
  error: string | null;

  fetchPendingTasks: () => Promise<void>;
  fetchCompletedTasks: () => Promise<void>;
  fetchApprovalHistory: (businessObjectId: number) => Promise<void>;
  completeTask: (taskId: string, approved: boolean, comment?: string) => Promise<void>;
  withdrawApproval: (businessObjectId: number) => Promise<void>;
  fetchDelegations: () => Promise<void>;
  delegate: (data: Parameters<typeof workflowService.delegate>[0]) => Promise<void>;
  revokeDelegation: (id: number) => Promise<void>;
  fetchCcRecords: (unreadOnly?: boolean) => Promise<void>;
  addCc: (businessObjectId: number, userId: number) => Promise<void>;
  markCcAsRead: (id: number) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set) => ({
      pendingTasks: [],
      completedTasks: [],
      approvalHistory: [],
      delegations: [],
      ccRecords: [],
      loading: false,
      error: null,

      fetchPendingTasks: async () => {
        set({ loading: true, error: null });
        try {
          const res = await workflowService.getPendingTasks();
          const tasks = unwrap(res);
          set({ pendingTasks: tasks, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      fetchCompletedTasks: async () => {
        set({ loading: true, error: null });
        try {
          const res = await workflowService.getCompletedTasks();
          const tasks = unwrap(res);
          set({ completedTasks: tasks, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      fetchApprovalHistory: async (businessObjectId: number) => {
        set({ loading: true, error: null });
        try {
          const res = await workflowService.getApprovalHistory(businessObjectId);
          const history = unwrap(res);
          set({ approvalHistory: history, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      completeTask: async (taskId: string, approved: boolean, comment?: string) => {
        set({ error: null });
        try {
          await workflowService.completeTask(taskId, { approved, comment });
          let completedTask: ApprovalTaskVO | undefined;
          set((state) => {
            completedTask = state.pendingTasks.find((t) => t.taskId === taskId);
            return {
              pendingTasks: state.pendingTasks.filter((t) => t.taskId !== taskId),
            };
          });
          // Cross-store sync: refresh task store so Todo page reflects updated status
          import('./useTaskStore').then(({ useTaskStore }) => {
            useTaskStore.getState().fetchTasks();
          }).catch(() => {});
          if (completedTask) {
            import('./useNotificationStore').then(({ useNotificationStore }) => {
              useNotificationStore.getState().addNotification({
                title: approved ? '审批已通过' : '审批已拒绝',
                desc: `${completedTask!.objectName} 的审批已${approved ? '通过' : '拒绝'}`,
                type: 'approval',
              });
            }).catch(() => {});
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      withdrawApproval: async (businessObjectId: number) => {
        set({ error: null });
        try {
          await workflowService.withdrawApproval(businessObjectId);
          set((state) => ({
            pendingTasks: state.pendingTasks.filter(
              (t) => t.businessObjectId !== businessObjectId,
            ),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      fetchDelegations: async () => {
        set({ loading: true, error: null });
        try {
          const res = await workflowService.getDelegations();
          const delegations = unwrap(res);
          set({ delegations, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      delegate: async (data) => {
        set({ loading: true, error: null });
        try {
          await workflowService.delegate(data);
          // Refresh delegations list
          const res = await workflowService.getDelegations();
          const delegations = unwrap(res);
          set({ delegations, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      revokeDelegation: async (id: number) => {
        set({ loading: true, error: null });
        try {
          await workflowService.revokeDelegation(id);
          // Remove from local list
          set((state) => ({
            delegations: state.delegations.filter((d) => d.id !== id),
            loading: false,
          }));
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      fetchCcRecords: async (unreadOnly = false) => {
        set({ loading: true, error: null });
        try {
          const res = await workflowService.getCcRecords(unreadOnly);
          const records = unwrap(res);
          set({ ccRecords: records, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      addCc: async (businessObjectId: number, userId: number) => {
        set({ loading: true, error: null });
        try {
          await workflowService.addCc({ businessObjectId, userId });
          // Refresh CC records
          const res = await workflowService.getCcRecords();
          const records = unwrap(res);
          set({ ccRecords: records, loading: false });
        } catch (e: any) {
          set({ error: e.message, loading: false });
        }
      },

      markCcAsRead: async (id: number) => {
        try {
          await workflowService.markCcAsRead(id);
          // Update local state
          set((state) => ({
            ccRecords: state.ccRecords.map((r) =>
              r.id === id ? { ...r, isRead: true, readAt: new Date().toISOString() } : r,
            ),
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
    }),
    { name: 'workflow' },
  ),
);

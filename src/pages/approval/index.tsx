import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useSocket } from '@/hooks/useSocket';
import { remindApproval } from '@/services/workflow.service';
import ApprovalList from './components/ApprovalList';
import ApprovalDetail from './components/ApprovalDetail';
import AddSignerModal from './components/AddSignerModal';
import styles from './ApprovalPage.module.css';

export default function ApprovalPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [addSignerOpen, setAddSignerOpen] = useState(false);

  const { pendingTasks: approvals, completedTasks, loading, fetchPendingTasks, fetchCompletedTasks } = useWorkflowStore();
  const { connected, subscribe } = useSocket();

  useEffect(() => {
    fetchPendingTasks();
  }, [fetchPendingTasks]);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchCompletedTasks();
    }
  }, [activeTab, fetchCompletedTasks]);

  useEffect(() => {
    if (!connected) return;
    const unsub = subscribe('/topic/approvals', () => {
      fetchPendingTasks();
    });
    return unsub;
  }, [connected, subscribe, fetchPendingTasks]);

  const selectedTask = approvals.find((t) => t.taskId === selectedTaskId)
    || completedTasks.find((t) => t.taskId === selectedTaskId)
    || null;

  const handleRemind = useCallback(async (taskId: string) => {
    const task = approvals.find((t) => t.taskId === taskId);
    if (!task?.businessObjectId) {
      message.warning('无法催办：缺少审批信息');
      return;
    }
    try {
      await remindApproval(task.businessObjectId);
      message.success('催办通知已发送');
    } catch {
      message.error('催办失败，请稍后重试');
    }
  }, [approvals]);

  const handleAddSigner = () => {
    setAddSignerOpen(true);
  };

  return (
    <div className={styles.approvalPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>审批管理</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.listPanel} role="region" aria-label="审批列表">
          <h3 className={styles.panelTitle}>审批列表</h3>
          <ApprovalList
            approvals={activeTab === 'pending' ? approvals : [...approvals, ...completedTasks]}
            selectedId={selectedTaskId}
            onSelect={setSelectedTaskId}
            loading={loading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onRemind={handleRemind}
            onAddSigner={handleAddSigner}
          />
        </div>

        <div className={styles.detailPanel} role="region" aria-label="审批详情">
          <h3 className={styles.panelTitle}>审批详情</h3>
          <ApprovalDetail task={selectedTask} onRefresh={fetchPendingTasks} />
        </div>
      </div>

      <AddSignerModal
        open={addSignerOpen}
        businessObjectId={selectedTask?.businessObjectId ?? 0}
        taskId={selectedTask?.taskId}
        onClose={() => setAddSignerOpen(false)}
        onSuccess={() => {
          setAddSignerOpen(false);
          fetchPendingTasks();
        }}
      />
    </div>
  );
}

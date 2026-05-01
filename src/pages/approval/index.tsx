import { useEffect, useState, useCallback } from 'react';
import { getApprovals } from '@/services/approval.service';
import ApprovalList from './components/ApprovalList';
import ApprovalDetail from './components/ApprovalDetail';
import styles from './ApprovalPage.module.css';

interface Approval {
  id: string;
  type: string;
  targetId: string;
  targetType: string;
  status: string;
  applicantId: string;
  approverId?: string;
  comment?: string;
  createdAt: string;
}

export default function ApprovalPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : undefined;
      const res = await getApprovals(params);
      setApprovals((res as any).data || []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedApproval = approvals.find((a) => a.id === selectedId) || null;

  return (
    <div className={styles.approvalPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>审批管理</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.listPanel}>
          <h3 className={styles.panelTitle}>审批列表</h3>
          <ApprovalList
            approvals={approvals}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className={styles.detailPanel}>
          <h3 className={styles.panelTitle}>审批详情</h3>
          <ApprovalDetail approval={selectedApproval} onRefresh={fetchData} />
        </div>
      </div>
    </div>
  );
}

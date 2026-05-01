import { Button, Tag, Input, message, Popconfirm } from 'antd';
import { useState } from 'react';
import { approveApproval, rejectApproval } from '@/services/approval.service';
import styles from '../ApprovalPage.module.css';

const { TextArea } = Input;

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

const statusColors: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

const statusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
};

const typeLabels: Record<string, string> = {
  task_complete: '任务完成',
  milestone: '里程碑',
  bom_change: 'BOM变更',
  process_publish: '工艺发布',
  resource_borrow: '资源借用',
};

interface ApprovalDetailProps {
  approval: Approval | null;
  onRefresh: () => void;
}

export default function ApprovalDetail({ approval, onRefresh }: ApprovalDetailProps) {
  const [rejectComment, setRejectComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!approval) {
    return <div className={styles.emptyHint}>请选择一条审批记录</div>;
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveApproval(approval.id, 'current-user');
      message.success('审批通过');
      onRefresh();
    } catch {
      message.error('审批失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    setLoading(true);
    try {
      await rejectApproval(approval.id, 'current-user', rejectComment);
      message.success('已拒绝');
      setRejectComment('');
      onRefresh();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const isPending = approval.status === 'pending';

  return (
    <div>
      <div className={styles.detailLabel}>审批类型</div>
      <div className={styles.detailValue}>{typeLabels[approval.type] || approval.type}</div>

      <div className={styles.detailLabel}>目标类型</div>
      <div className={styles.detailValue}>{approval.targetType}</div>

      <div className={styles.detailLabel}>目标ID</div>
      <div className={styles.detailValue}>{approval.targetId}</div>

      <div className={styles.detailLabel}>申请人</div>
      <div className={styles.detailValue}>{approval.applicantId}</div>

      <div className={styles.detailLabel}>审批人</div>
      <div className={styles.detailValue}>{approval.approverId || '-'}</div>

      <div className={styles.detailLabel}>状态</div>
      <div className={styles.detailValue}>
        <Tag color={statusColors[approval.status]}>{statusLabels[approval.status]}</Tag>
      </div>

      {approval.comment && (
        <>
          <div className={styles.detailLabel}>备注</div>
          <div className={styles.detailValue}>{approval.comment}</div>
        </>
      )}

      <div className={styles.detailLabel}>创建时间</div>
      <div className={styles.detailValue}>
        {new Date(approval.createdAt).toLocaleString('zh-CN')}
      </div>

      {isPending && (
        <div className={styles.actionButtons}>
          <Popconfirm
            title="确认通过此审批？"
            onConfirm={handleApprove}
            okText="确认"
            cancelText="取消"
          >
            <Button type="primary" loading={loading}>
              通过
            </Button>
          </Popconfirm>
          <div style={{ flex: 1 }}>
            <TextArea
              rows={2}
              placeholder="拒绝原因（必填）"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Button danger loading={loading} onClick={handleReject}>
              拒绝
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

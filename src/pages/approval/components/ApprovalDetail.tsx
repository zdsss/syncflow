import { Button, Tag, Input, message, Popconfirm, Space } from 'antd';
import { useState, useEffect } from 'react';
import { getApprovalHistory, getBusinessObject, withdrawApproval, remindApproval } from '@/services/workflow.service';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useAuthStore } from '@/stores/useAuthStore';
import ApprovalChainView from '../ApprovalChainView';
import AddSignerModal from './AddSignerModal';
import type { ApprovalTaskVO, ApprovalCommentVO } from '@/services/workflow.service';
import type { ChainStep } from '../ApprovalChainView';
import styles from '../ApprovalPage.module.css';

const { TextArea } = Input;

type ApprovalMode = 'single' | 'countersign' | 'orsign';

const objectTypeLabels: Record<string, string> = {
  TASK: '任务',
  BOM: 'BOM',
  BOM_CHANGE: 'BOM变更',
  PROCESS_ROUTE: '工艺路线',
  PROCESS_CHANGE: '工艺变更',
  FILE: '文件',
  STAGE_GATE: '阶段门',
  MILESTONE: '里程碑',
  MODULE_SPEC: '模块规格',
  SPEC_CHANGE: '规格变更',
  PROJECT: '项目',
  ISSUE: '问题',
  RISK: '风险',
};

const modeLabels: Record<ApprovalMode, { label: string; color: string; desc: string }> = {
  single: { label: '单人审批', color: 'default', desc: '一人通过即可' },
  countersign: { label: '会签', color: 'blue', desc: '所有审批人均需通过' },
  orsign: { label: '或签', color: 'green', desc: '任一审批人通过即可' },
};

interface ApprovalDetailProps {
  task: ApprovalTaskVO | null;
  onRefresh: () => void;
}

export default function ApprovalDetail({ task, onRefresh }: ApprovalDetailProps) {
  const [rejectComment, setRejectComment] = useState('');
  const [addSignerOpen, setAddSignerOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('single');
  const [approvalHistory, setApprovalHistory] = useState<ApprovalCommentVO[]>([]);
  const { completeTask, loading: storeLoading } = useWorkflowStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = currentUser?.id ?? '';

  useEffect(() => {
    if (task?.businessObjectId) {
      getApprovalHistory(task.businessObjectId)
        .then((res) => {
          const history = Array.isArray(res) ? res : (res as { data?: ApprovalCommentVO[] }).data || [];
          setApprovalHistory(history);
        })
        .catch(() => setApprovalHistory([]));

      getBusinessObject(task.businessObjectId)
        .then((res) => {
          const bo = (res as any)?.data ?? res;
          if (bo?.approvalMode === 'countersign') setApprovalMode('countersign');
          else if (bo?.approvalMode === 'orsign') setApprovalMode('orsign');
          else setApprovalMode('single');
        })
        .catch(() => setApprovalMode('single'));
    } else {
      setApprovalHistory([]);
      setApprovalMode('single');
    }
  }, [task?.businessObjectId]);

  const loading = storeLoading;

  const handleRemind = async () => {
    if (!task?.businessObjectId) return;
    try {
      await remindApproval(task.businessObjectId);
      message.success('催办通知已发送');
    } catch {
      message.error('催办失败');
    }
  };

  const handleWithdraw = async () => {
    if (!task?.businessObjectId) return;
    try {
      await withdrawApproval(task.businessObjectId);
      message.success('已撤回审批');
      onRefresh();
    } catch {
      message.error('撤回失败，可能您不是申请人');
    }
  };

  if (!task) {
    return <div className={styles.emptyHint}>请选择一条审批记录</div>;
  }

  const handleApprove = () => {
    completeTask(task!.taskId, true).then(() => {
      if (!useWorkflowStore.getState().error) {
        message.success('审批通过');
        onRefresh();
      } else {
        message.error('审批失败');
      }
    });
  };

  const handleReject = () => {
    if (!rejectComment.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    completeTask(task!.taskId, false, rejectComment).then(() => {
      if (!useWorkflowStore.getState().error) {
        message.success('已拒绝');
        setRejectComment('');
        onRefresh();
      } else {
        message.error('操作失败');
      }
    });
  };

  const chainSteps: ChainStep[] = approvalHistory.map((h, i) => ({
    id: String(h.id),
    approvalId: String(task.businessObjectId),
    stepOrder: i + 1,
    approverId: h.approverName,
    status: h.action === 'APPROVE' ? 'approved' : h.action === 'REJECT' ? 'rejected' : 'pending',
    comment: h.comment,
    actedAt: h.createdAt,
  }));

  return (
    <div>
      <div className={styles.detailLabel}>审批类型</div>
      <div className={styles.detailValue}>{objectTypeLabels[task.objectType] || task.objectType}</div>

      <div className={styles.detailLabel}>名称</div>
      <div className={styles.detailValue}>{task.objectName}</div>

      {task.objectCode && (
        <>
          <div className={styles.detailLabel}>编号</div>
          <div className={styles.detailValue}>{task.objectCode}</div>
        </>
      )}

      <div className={styles.detailLabel}>审批节点</div>
      <div className={styles.detailValue}>{task.taskName}</div>

      <div className={styles.detailLabel}>申请人</div>
      <div className={styles.detailValue}>{task.applicantName || '-'}</div>

      <div className={styles.detailLabel}>审批模式</div>
      <div className={styles.detailValue}>
        <Space>
          <Tag color={modeLabels[approvalMode].color}>{modeLabels[approvalMode].label}</Tag>
          <span style={{ color: '#999', fontSize: 12 }}>{modeLabels[approvalMode].desc}</span>
        </Space>
      </div>

      <div className={styles.detailLabel}>创建时间</div>
      <div className={styles.detailValue}>
        {new Date(task.createdAt).toLocaleString('zh-CN')}
      </div>

      <div className={styles.actionButtons} style={{ flexDirection: 'column', gap: 12 }}>
        <TextArea
          rows={3}
          placeholder="审批意见/拒绝原因（拒绝时必填）"
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Popconfirm
            title="确认通过此审批？"
            description="审批通过后将触发后续流程，请确认已审阅相关内容。"
            onConfirm={handleApprove}
            okText="确认通过"
            cancelText="取消"
            okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
          >
            <Button
              type="primary"
              loading={loading}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
              size="large"
            >
              通过
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认拒绝此审批？"
            description="拒绝后申请人需重新提交。"
            onConfirm={handleReject}
            okText="确认拒绝"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            disabled={!rejectComment.trim()}
          >
            <Button
              danger
              loading={loading}
              size="large"
              style={{ fontWeight: 600 }}
              onClick={() => { if (!rejectComment.trim()) message.warning('请先输入拒绝原因'); }}
            >
              拒绝
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button onClick={handleRemind}>催办</Button>
        <Button onClick={() => setAddSignerOpen(true)}>加签</Button>
        <Popconfirm
          title="确认撤回此审批？"
          description="撤回后需重新提交审批。"
          onConfirm={handleWithdraw}
          okText="确认撤回"
          cancelText="取消"
        >
          <Button>撤回</Button>
        </Popconfirm>
      </div>

      {chainSteps.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <ApprovalChainView
            approvalId={String(task.businessObjectId)}
            taskId={task.taskId}
            chainSteps={chainSteps}
            currentUserId={String(currentUserId)}
            onRefresh={onRefresh}
            showActions={false}
          />
        </div>
      )}

      <AddSignerModal
        open={addSignerOpen}
        businessObjectId={task.businessObjectId}
        taskId={task.taskId}
        onClose={() => setAddSignerOpen(false)}
        onSuccess={() => {
          setAddSignerOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
}

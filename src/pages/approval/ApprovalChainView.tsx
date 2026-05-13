import { useState } from 'react';
import { Timeline, Tag, Button, Input, Space, Typography, message } from 'antd';
import { useAsyncAction } from '@/hooks/useAsyncData';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  UserOutlined,
} from '@ant-design/icons';
import { approveApproval, rejectApproval } from '@/services/approval.service';
import TransferModal from './TransferModal';

const { TextArea } = Input;
const { Text } = Typography;

export interface ChainStep {
  id: string;
  approvalId: string;
  stepOrder: number;
  approverId: string;
  status: string;
  comment?: string | null;
  actedAt?: string | null;
}

interface ApprovalChainViewProps {
  approvalId: string;
  taskId?: string;
  chainSteps: ChainStep[];
  currentUserId: string;
  onRefresh: () => void;
  showActions?: boolean;
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

const statusIcons: Record<string, React.ReactNode> = {
  approved: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  rejected: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
  pending: <ClockCircleFilled style={{ color: '#faad14' }} />,
};

export default function ApprovalChainView({
  approvalId,
  taskId,
  chainSteps,
  currentUserId,
  onRefresh,
  showActions = true,
}: ApprovalChainViewProps) {
  const [rejectComment, setRejectComment] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);

  const currentStep = chainSteps.find(
    (s) => s.status === 'pending' && s.approverId === currentUserId,
  );

  const { execute: doApprove, loading: approveLoading } = useAsyncAction(
    async () => {
      await approveApproval(approvalId, currentUserId);
    },
    { successMessage: '审批通过', errorMessage: '审批失败' },
  );

  const { execute: doReject, loading: rejectLoading } = useAsyncAction(
    async (comment: string) => {
      await rejectApproval(approvalId, currentUserId, comment);
      return true;
    },
    { errorMessage: '操作失败' },
  );

  const loading = approveLoading || rejectLoading;

  const handleApprove = () => {
    doApprove().then(() => onRefresh());
  };

  const handleReject = () => {
    if (!rejectComment.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    doReject(rejectComment).then((result) => {
      if (result !== undefined) {
        message.success('已拒绝');
        setRejectComment('');
        onRefresh();
      }
    });
  };

  if (chainSteps.length === 0) {
    return (
      <div>
        <Text type="secondary">暂无审批链</Text>
      </div>
    );
  }

  const timelineItems = chainSteps.map((step) => {
    const isCurrentStep = step.id === currentStep?.id;
    return {
      icon: statusIcons[step.status] || <ClockCircleFilled />,
      color: isCurrentStep ? 'blue' : step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'gray',
      content: (
        <div style={{ padding: '4px 0', background: isCurrentStep ? '#EBF5FF' : undefined, borderRadius: 4, paddingInline: 8 }}>
          <Space>
            <Text strong>第{step.stepOrder}步</Text>
            <Text>{step.approverId}</Text>
            <Tag color={statusColors[step.status]}>{statusLabels[step.status]}</Tag>
            {isCurrentStep && <Tag color="blue">当前步骤</Tag>}
          </Space>
          {step.comment && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">意见：{step.comment}</Text>
            </div>
          )}
          {step.actedAt && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                处理时间：{new Date(step.actedAt).toLocaleString('zh-CN')}
              </Text>
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <div>
      <div style={{ marginBottom: 16, fontWeight: 600 }}>审批链</div>
      <Timeline items={timelineItems} />

      {showActions && currentStep && (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <TextArea
            rows={2}
            placeholder="审批意见（拒绝时必填）"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Space>
            <Button type="primary" loading={loading} onClick={handleApprove}>
              通过
            </Button>
            <Button danger loading={loading} onClick={handleReject}>
              拒绝
            </Button>
            <Button onClick={() => setTransferOpen(true)}>转交</Button>
          </Space>
        </div>
      )}

      <TransferModal
        open={transferOpen}
        approvalId={approvalId}
        taskId={taskId}
        userId={currentUserId}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => {
          setTransferOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
}

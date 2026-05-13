import { Card, Tag, Button, Skeleton, Empty } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export interface ApprovalItem {
  id: number;
  title: string;
  type: string;
  applicantName: string;
  createdAt: string;
  status: string;
  projectName?: string;
  currentTaskId?: string;
}

interface PendingApprovalsProps {
  items: ApprovalItem[];
  loading?: boolean;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
}

const APPROVAL_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  TASK: { label: '任务', color: 'blue' },
  MILESTONE: { label: '里程碑', color: 'purple' },
  ISSUE: { label: '问题', color: 'red' },
  RISK: { label: '风险', color: 'orange' },
  BOM: { label: 'BOM', color: 'cyan' },
  BOM_CHANGE: { label: 'BOM变更', color: 'orange' },
  CHANGE: { label: '变更', color: 'orange' },
  PROJECT: { label: '项目', color: 'green' },
  STAGE_GATE: { label: '阶段评审', color: 'purple' },
  FILE: { label: '文件', color: 'geekblue' },
  PROCESS_CHANGE: { label: '工艺变更', color: 'orange' },
  MODULE_SPEC: { label: '模块规格', color: 'cyan' },
  SPEC_CHANGE: { label: '规格变更', color: 'orange' },
};

export default function PendingApprovals({ items, loading, onApprove, onReject }: PendingApprovalsProps) {
  if (loading) {
    return (
      <Card title="审批待办" data-testid="pending-approvals">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card title="审批待办" data-testid="pending-approvals">
        <Empty description="暂无审批待办" />
      </Card>
    );
  }

  return (
    <Card title="审批待办" data-testid="pending-approvals">
      <div>
        {items.map((item) => {
          const typeCfg = APPROVAL_TYPE_CONFIG[item.type] || { label: item.type, color: 'default' };
          return (
            <div
              key={item.id}
              data-testid={`approval-item-${item.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span data-testid="approval-title">{item.title}</span>
                  <Tag color={typeCfg.color}>{typeCfg.label}</Tag>
                </div>
                <div data-testid="approval-meta" style={{ fontSize: 12, color: '#999' }}>
                  <span style={{ marginRight: 12 }}>提交人: {item.applicantName}</span>
                  <span style={{ marginRight: 12 }}>提交时间: {item.createdAt}</span>
                  {item.projectName && <span>项目: {item.projectName}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => item.currentTaskId && onApprove?.(item.currentTaskId)}
                  disabled={!item.currentTaskId}
                  data-testid="approve-button"
                >
                  通过
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => item.currentTaskId && onReject?.(item.currentTaskId)}
                  disabled={!item.currentTaskId}
                  data-testid="reject-button"
                >
                  驳回
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

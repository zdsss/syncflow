import { Table, Tag, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';

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

interface ApprovalListProps {
  approvals: Approval[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
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

const columns: ColumnsType<Approval> = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
    render: (type: string) => typeLabels[type] || type,
  },
  {
    title: '目标ID',
    dataIndex: 'targetId',
    key: 'targetId',
    ellipsis: true,
  },
  {
    title: '申请人',
    dataIndex: 'applicantId',
    key: 'applicantId',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => (
      <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (date: string) => new Date(date).toLocaleString('zh-CN'),
  },
];

export default function ApprovalList({
  approvals,
  selectedId,
  onSelect,
  loading,
  activeTab,
  onTabChange,
}: ApprovalListProps) {
  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          { key: 'pending', label: '待审批' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
          { key: 'all', label: '全部' },
        ]}
        size="small"
      />
      <Table
        columns={columns}
        dataSource={approvals}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => onSelect(record.id),
          style: {
            cursor: 'pointer',
            background: record.id === selectedId ? '#EBF0FF' : undefined,
          },
        })}
      />
    </div>
  );
}

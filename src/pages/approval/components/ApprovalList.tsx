import { Table, Tag, Tabs, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ApprovalTaskVO } from '@/services/workflow.service';

interface ApprovalListProps {
  approvals: ApprovalTaskVO[];
  selectedId: string | null;
  onSelect: (taskId: string) => void;
  loading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRemind?: (taskId: string) => void;
  onAddSigner?: (taskId: string) => void;
}

const statusColors: Record<string, string> = {
  TASK: 'blue',
  BOM: 'cyan',
  PROCESS: 'purple',
  FILE: 'geekblue',
  STAGE_GATE: 'orange',
  MILESTONE: 'green',
};

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

const getColumns = (
  onRemind?: (taskId: string) => void,
  onAddSigner?: (taskId: string) => void,
): ColumnsType<ApprovalTaskVO> => [
  {
    title: '类型',
    dataIndex: 'objectType',
    key: 'objectType',
    width: 120,
    render: (type: string) => objectTypeLabels[type] || type,
  },
  {
    title: '名称',
    dataIndex: 'objectName',
    key: 'objectName',
    ellipsis: true,
  },
  {
    title: '申请人',
    dataIndex: 'applicantName',
    key: 'applicantName',
    width: 120,
  },
  {
    title: '节点',
    dataIndex: 'taskName',
    key: 'taskName',
    width: 140,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    render: (date: string) => new Date(date).toLocaleString('zh-CN'),
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    render: (_: unknown, record: ApprovalTaskVO) => (
      <Space size="small">
        {onRemind && (
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemind(record.taskId);
            }}
          >
            催办
          </Button>
        )}
        {onAddSigner && (
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAddSigner(record.taskId);
            }}
          >
            加签
          </Button>
        )}
      </Space>
    ),
  },
];

export default function ApprovalList({
  approvals,
  selectedId,
  onSelect,
  loading,
  activeTab,
  onTabChange,
  onRemind,
  onAddSigner,
}: ApprovalListProps) {
  const columns = getColumns(onRemind, onAddSigner);

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          { key: 'pending', label: '待审批' },
          { key: 'all', label: '全部' },
        ]}
        size="small"
      />
      <Table
        columns={columns}
        dataSource={approvals}
        rowKey="taskId"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: activeTab === 'pending' ? '暂无待审批事项' : '暂无审批记录' }}
        onRow={(record) => ({
          onClick: () => onSelect(record.taskId),
          'aria-selected': record.taskId === selectedId,
          style: {
            cursor: 'pointer',
            background: record.taskId === selectedId ? '#EBF0FF' : undefined,
          },
        } as any)}
      />
    </div>
  );
}

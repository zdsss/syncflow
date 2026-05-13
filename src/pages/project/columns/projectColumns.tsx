import { Tag, Button, Progress, Space, Tooltip } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { getProjectStatusLabel, getProjectStatusColor } from '@/constants/statusMap';

export function getProjectColumns(
  handleSelectProject: (id: number) => void,
  getAssigneeName: (id: string) => string,
  projectTaskCounts: Record<string, number>,
) {
  return [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <span style={{ color: '#3366FF', cursor: 'pointer' }} onClick={() => handleSelectProject(record.id)}>
          {record.projectNumber ? `${record.projectNumber} ` : ''}{name}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        const label = getProjectStatusLabel(status);
        const color = getProjectStatusColor(status);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '完成度',
      dataIndex: 'progress',
      key: 'progress',
      render: (v: number) => (
        <Progress
          percent={v || 0}
          size="small"
          style={{ width: 100 }}
          strokeColor={v >= 80 ? '#52C41A' : v >= 50 ? '#FAAD14' : '#3366FF'}
        />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      key: 'ownerId',
      render: (ownerId: number) => getAssigneeName(String(ownerId)),
    },
    {
      title: '起止时间',
      key: 'dateRange',
      render: (_: any, record: any) => {
        const start = record.plannedStart ? new Date(record.plannedStart).toLocaleDateString('zh-CN') : '-';
        const end = record.plannedEnd ? new Date(record.plannedEnd).toLocaleDateString('zh-CN') : '-';
        return `${start} ~ ${end}`;
      },
    },
    {
      title: '任务数',
      key: 'taskCount',
      render: (_: any, record: any) => projectTaskCounts[record.id] || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Tooltip title="查看关注项目">
            <Button type="text" icon={<StarOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];
}

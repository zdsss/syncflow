import { Table, Input, Button, Space, Tag } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  status: string;
  createdAt: string;
}

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onSearch: (keyword: string) => void;
  onAdd: () => void;
  onEdit: (record: Resource) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  available: 'green',
  busy: 'orange',
  unavailable: 'red',
  maintenance: 'blue',
};

const statusLabels: Record<string, string> = {
  available: '可用',
  busy: '忙碌',
  unavailable: '不可用',
  maintenance: '维护中',
};

export default function ResourceList({
  resources,
  loading,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
}: ResourceListProps) {
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space>
          {tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Resource) => (
        <Space>
          <Button type="link" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => onDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索资源..."
          onSearch={onSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          添加资源
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={resources}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}
